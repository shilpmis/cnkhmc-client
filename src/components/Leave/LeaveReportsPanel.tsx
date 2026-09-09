"use client"

import type React from "react"
import { useState, useMemo } from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  useGetTeachersLeaveSummaryReportQuery,
  useLazyGetIndividualTeacherLeaveReportQuery,
} from "@/services/LeaveService"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { FileSpreadsheet, Search, User, Users, Calendar, Download, RefreshCw, Award, CheckCircle2, Clock } from "lucide-react"

export const LeaveReportsPanel: React.FC = () => {
  const { toast } = useToast()
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [activeReportTab, setActiveReportTab] = useState<"summary" | "individual">("summary")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")

  // Query all teachers summary
  const {
    data: summaryReport,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetTeachersLeaveSummaryReportQuery({
    academic_session_id: CurrentAcademicSessionForSchool?.id,
  })

  // Lazy query individual teacher report
  const [
    getIndividualReport,
    { data: individualReport, isLoading: isIndividualLoading },
  ] = useLazyGetIndividualTeacherLeaveReportQuery()

  const handleTeacherSelect = (staffIdStr: string) => {
    setSelectedStaffId(staffIdStr)
    if (staffIdStr) {
      getIndividualReport({ staff_id: Number(staffIdStr) })
    }
  }

  // Filtered summary data
  const filteredSummary = useMemo(() => {
    if (!summaryReport || !summaryReport.data) return []
    return summaryReport.data.filter((item) => {
      const nameMatch = item.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      const empIdMatch = item.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      const deptMatch = item.department?.toLowerCase().includes(searchQuery.toLowerCase())
      return nameMatch || empIdMatch || deptMatch
    })
  }, [summaryReport, searchQuery])

  // Summary Metrics
  const metrics = useMemo(() => {
    if (!summaryReport || !summaryReport.data)
      return { totalTeachers: 0, totalLeavesTaken: 0, avgLeavesPerTeacher: 0 }

    const totalTeachers = summaryReport.data.length
    const totalLeavesTaken = summaryReport.data.reduce((acc, curr) => acc + (curr.total_leaves_taken || 0), 0)
    const avgLeavesPerTeacher = totalTeachers > 0 ? (totalLeavesTaken / totalTeachers).toFixed(1) : 0

    return { totalTeachers, totalLeavesTaken, avgLeavesPerTeacher }
  }, [summaryReport])

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT ALL TEACHERS SUMMARY TO EXCEL
  // ──────────────────────────────────────────────────────────────────────────
  const exportAllTeachersSummaryToExcel = () => {
    if (!summaryReport || !summaryReport.data || summaryReport.data.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No report data available to export." })
      return
    }

    try {
      const leaveTypeNames = summaryReport.leave_types.map((lt) => lt.name)

      const excelRows = summaryReport.data.map((teacher, index) => {
        const row: Record<string, any> = {
          "Sr No": index + 1,
          "Employee ID": teacher.employee_id,
          "Teacher Name": teacher.full_name,
          "Department": teacher.department,
        }

        leaveTypeNames.forEach((typeName) => {
          const breakdown = teacher.leave_breakdown?.[typeName]
          row[`${typeName} (Used / Total)`] = breakdown
            ? `${breakdown.used} / ${breakdown.total}`
            : "0 / 0"
        })

        row["Total Leaves Taken"] = teacher.total_leaves_taken
        row["Total Balance Remaining"] = teacher.total_leaves_available

        return row
      })

      const worksheet = XLSX.utils.json_to_sheet(excelRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "All Teachers Leave Summary")

      const dateStr = new Date().toISOString().split("T")[0]
      XLSX.writeFile(workbook, `All_Teachers_Leave_Summary_${dateStr}.xlsx`)

      toast({ title: "Export Successful", description: "All teachers leave summary downloaded successfully." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export Failed", description: err.message || "Could not export Excel file." })
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT INDIVIDUAL TEACHER REPORT TO EXCEL
  // ──────────────────────────────────────────────────────────────────────────
  const exportIndividualTeacherReportToExcel = () => {
    if (!individualReport || !individualReport.staff) {
      toast({ variant: "destructive", title: "No Teacher Selected", description: "Please select a teacher to export their report." })
      return
    }

    try {
      const workbook = XLSX.utils.book_new()
      const { staff, balances, applications, comp_off_requests } = individualReport

      // Sheet 1: Balances Overview
      const balanceRows = (balances || []).map((b: any, idx: number) => ({
        "Sr No": idx + 1,
        "Leave Type": b.leave_type?.leave_type_name || "N/A",
        "Total Quota": b.total_leaves,
        "Used Leaves": b.used_leaves,
        "Pending Leaves": b.pending_leaves,
        "Available Balance": b.available_balance,
      }))
      const balanceSheet = XLSX.utils.json_to_sheet(balanceRows.length > 0 ? balanceRows : [{ Note: "No balance records" }])
      XLSX.utils.book_append_sheet(workbook, balanceSheet, "Leave Balances")

      // Sheet 2: Itemized Leave Applications
      const appRows = (applications || []).map((app: any, idx: number) => ({
        "Sr No": idx + 1,
        "Applied Date": app.created_at ? new Date(app.created_at).toLocaleDateString() : "-",
        "Leave Type": app.leave_type?.leave_type_name || app.leave_type_name || "N/A",
        "From Date": new Date(app.from_date).toLocaleDateString(),
        "To Date": new Date(app.to_date).toLocaleDateString(),
        "Days / Duration": app.number_of_days,
        "Is Half Day": app.is_half_day ? `Yes (${app.half_day_type})` : "No",
        "Reason": app.reason,
        "Status": app.status,
        "Approver / Action Notes": app.remarks || "-",
      }))
      const appSheet = XLSX.utils.json_to_sheet(appRows.length > 0 ? appRows : [{ Note: "No leave applications found" }])
      XLSX.utils.book_append_sheet(workbook, appSheet, "Leave History")

      // Sheet 3: Comp Off Claims
      const compOffRows = (comp_off_requests || []).map((c: any, idx: number) => ({
        "Sr No": idx + 1,
        "Worked Date": new Date(c.worked_date).toLocaleDateString(),
        "Day Type": c.day_type === "half_day" ? "Half Day (0.5)" : "Full Day (1.0)",
        "Credited Days": c.credited_days,
        "Reason / Event": c.reason,
        "Description": c.description || "-",
        "Status": c.status,
        "Admin Remarks": c.admin_remarks || "-",
      }))
      const compOffSheet = XLSX.utils.json_to_sheet(compOffRows.length > 0 ? compOffRows : [{ Note: "No comp off claims" }])
      XLSX.utils.book_append_sheet(workbook, compOffSheet, "Comp Off Claims")

      const dateStr = new Date().toISOString().split("T")[0]
      const safeName = staff.full_name.replace(/[^a-zA-Z0-9]/g, "_")
      XLSX.writeFile(workbook, `Leave_Report_${safeName}_${dateStr}.xlsx`)

      toast({ title: "Export Successful", description: `Leave report for ${staff.full_name} exported successfully.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export Failed", description: err.message || "Could not export Excel file." })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeReportTab} onValueChange={(v) => setActiveReportTab(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> All Teachers Summary
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Individual Teacher Report
            </TabsTrigger>
          </TabsList>

          {activeReportTab === "summary" ? (
            <Button onClick={exportAllTeachersSummaryToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Export All Teachers Summary (.xlsx)
            </Button>
          ) : (
            <Button
              onClick={exportIndividualTeacherReportToExcel}
              disabled={!selectedStaffId || isIndividualLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Teacher Detailed Report (.xlsx)
            </Button>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            TAB 1: ALL TEACHERS SUMMARY
        ────────────────────────────────────────────────────────────────────────── */}
        <TabsContent value="summary" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Teaching Staff</p>
                  <h3 className="text-2xl font-bold">{metrics.totalTeachers}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Leaves Taken (All Types)</p>
                  <h3 className="text-2xl font-bold">{metrics.totalLeavesTaken} Days</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Average Leaves Per Teacher</p>
                  <h3 className="text-2xl font-bold">{metrics.avgLeavesPerTeacher} Days</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-xl font-bold">All Teachers Leave Summary Matrix</CardTitle>
                <CardDescription>Comprehensive view of every leave type taken by each teacher</CardDescription>
              </div>
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by teacher name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Generating leave summary report...
                </div>
              ) : filteredSummary.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Teacher Name</TableHead>
                        <TableHead>Emp ID</TableHead>
                        <TableHead>Department</TableHead>
                        {summaryReport?.leave_types.map((lt) => (
                          <TableHead key={lt.id} className="text-center">
                            {lt.name} (Used / Total)
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold text-destructive">Total Taken</TableHead>
                        <TableHead className="text-center font-bold text-emerald-600">Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSummary.map((t) => (
                        <TableRow key={t.staff_id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold text-primary">{t.full_name}</TableCell>
                          <TableCell>{t.employee_id}</TableCell>
                          <TableCell>{t.department}</TableCell>
                          {summaryReport?.leave_types.map((lt) => {
                            const b = t.leave_breakdown?.[lt.name]
                            return (
                              <TableCell key={lt.id} className="text-center">
                                {b ? (
                                  <span className={b.used > 0 ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted-foreground"}>
                                    {b.used} / {b.total}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">0 / 0</span>
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center font-bold text-destructive text-base">
                            {t.total_leaves_taken}
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-600 text-base">
                            {t.total_leaves_available}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">No teacher records match your search query.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────────────────────────────────────────────────────────────────────
            TAB 2: INDIVIDUAL TEACHER REPORT
        ────────────────────────────────────────────────────────────────────────── */}
        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Select Teacher for Individual Leave Statement</CardTitle>
              <CardDescription>View complete leave statement, balances, leave applications, and Comp Off history for a single teacher.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Select value={selectedStaffId} onValueChange={handleTeacherSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select Teacher / Staff Member --" />
                  </SelectTrigger>
                  <SelectContent>
                    {summaryReport?.data?.map((st) => (
                      <SelectItem key={st.staff_id} value={st.staff_id.toString()}>
                        {st.full_name} ({st.employee_id}) - {st.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isIndividualLoading && (
                <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Fetching teacher leave records...
                </div>
              )}

              {individualReport && individualReport.staff && !isIndividualLoading && (
                <div className="space-y-6 mt-6">
                  {/* Teacher Header Info */}
                  <div className="bg-muted/40 border p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-primary">{individualReport.staff.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Emp ID: <span className="font-medium text-foreground">{individualReport.staff.employee_id}</span> | Department:{" "}
                        <span className="font-medium text-foreground">{individualReport.staff.department}</span>
                      </p>
                    </div>
                    <Button onClick={exportIndividualTeacherReportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Statement (.xlsx)
                    </Button>
                  </div>

                  {/* Balances Grid */}
                  <div>
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" /> Current Leave Balances
                    </h4>
                    {individualReport.balances && individualReport.balances.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {individualReport.balances.map((bal: any) => (
                          <Card key={bal.id} className="border shadow-sm">
                            <CardContent className="p-4">
                              <h5 className="font-semibold text-base mb-1">{bal.leave_type?.leave_type_name || "Leave"}</h5>
                              <div className="flex justify-between text-sm py-1 border-b">
                                <span className="text-muted-foreground">Annual Quota:</span>
                                <span className="font-medium">{bal.total_leaves} Days</span>
                              </div>
                              <div className="flex justify-between text-sm py-1 border-b">
                                <span className="text-muted-foreground">Used:</span>
                                <span className="font-semibold text-amber-600">{bal.used_leaves} Days</span>
                              </div>
                              <div className="flex justify-between text-sm py-1 pt-2">
                                <span className="font-semibold">Available Balance:</span>
                                <span className="font-bold text-emerald-600 text-base">{bal.available_balance} Days</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No leave balance records assigned yet.</p>
                    )}
                  </div>

                  {/* Leave Applications Table */}
                  <div>
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Itemized Leave Applications
                    </h4>
                    {individualReport.applications && individualReport.applications.length > 0 ? (
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Applied Date</TableHead>
                              <TableHead>Leave Type</TableHead>
                              <TableHead>From Date - To Date</TableHead>
                              <TableHead className="text-center">Days</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Remarks / Approver</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {individualReport.applications.map((app: any) => (
                              <TableRow key={app.id}>
                                <TableCell className="text-xs text-muted-foreground">
                                  {app.created_at ? new Date(app.created_at).toLocaleDateString() : "-"}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {app.leave_type?.leave_type_name || app.leave_type_name || "Leave"}
                                </TableCell>
                                <TableCell>
                                  {new Date(app.from_date).toLocaleDateString()} - {new Date(app.to_date).toLocaleDateString()}
                                  {app.is_half_day && <Badge variant="outline" className="ml-2 text-xs">Half Day</Badge>}
                                </TableCell>
                                <TableCell className="text-center font-bold">{app.number_of_days}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{app.reason}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      app.status === "approved"
                                        ? "default"
                                        : app.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {app.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {app.remarks || (app.approved_by_user ? `By ${app.approved_by_user.first_name}` : "-")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No leave applications submitted by this teacher.</p>
                    )}
                  </div>

                  {/* Comp Off Claims Table */}
                  <div>
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" /> Compensatory Off (Comp Off) Claims
                    </h4>
                    {individualReport.comp_off_requests && individualReport.comp_off_requests.length > 0 ? (
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Worked Date</TableHead>
                              <TableHead>Day Type</TableHead>
                              <TableHead className="text-center">Credit</TableHead>
                              <TableHead>Reason / Event</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Admin Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {individualReport.comp_off_requests.map((c: any) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium">{new Date(c.worked_date).toLocaleDateString()}</TableCell>
                                <TableCell className="capitalize">{c.day_type === "half_day" ? "Half Day" : "Full Day"}</TableCell>
                                <TableCell className="text-center font-bold text-amber-600">+{c.credited_days}</TableCell>
                                <TableCell>{c.reason}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      c.status === "approved"
                                        ? "default"
                                        : c.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {c.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{c.admin_remarks || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No Comp Off claims logged for this teacher.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LeaveReportsPanel
