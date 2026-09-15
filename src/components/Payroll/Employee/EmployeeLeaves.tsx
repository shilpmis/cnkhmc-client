"use client"

import type React from "react"
import { useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import { Calendar, FileSpreadsheet, Clock, AlertCircle, CalendarDays, User, Award, RefreshCw } from "lucide-react"
import { useGetIndividualTeacherLeaveReportQuery } from "@/services/LeaveService"
import type { StaffType } from "@/types/staff"

interface EmployeeProps {
  employee: StaffType
}

const EmployeeLeaves: React.FC<EmployeeProps> = ({ employee }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("balance")
  const [isLeaveDetailDialogOpen, setIsLeaveDetailDialogOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null)

  // Fetch real employee leave balances, applications, and comp offs
  const {
    data: leaveReportData,
    isLoading: isReportLoading,
    refetch: refetchReport,
  } = useGetIndividualTeacherLeaveReportQuery(
    { staff_id: employee?.id },
    { skip: !employee?.id }
  )

  const balances = leaveReportData?.balances || []
  const applications = leaveReportData?.applications || []
  const compOffRequests = leaveReportData?.comp_off_requests || []

  // Format date helper
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Status badge styling helper
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Handle view leave detail
  const handleViewLeaveDetail = (leave: any) => {
    setSelectedLeave(leave)
    setIsLeaveDetailDialogOpen(true)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT INDIVIDUAL EMPLOYEE LEAVE REPORT TO EXCEL
  // ──────────────────────────────────────────────────────────────────────────
  const exportIndividualLeaveToExcel = () => {
    if (!employee) {
      toast({ variant: "destructive", title: "No Employee", description: "Employee information is missing." })
      return
    }

    try {
      const workbook = XLSX.utils.book_new()
      const staffName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Staff"

      // Sheet 1: Leave Balances Overview
      const balanceRows = (balances || []).map((b: any, idx: number) => ({
        "Sr No": idx + 1,
        "Leave Type": b.leave_type?.leave_type_name || "N/A",
        "Total Quota": Number(b.total_leaves || 0),
        "Used Leaves": Number(b.used_leaves || 0),
        "Pending Approval": Number(b.pending_leaves || 0),
        "Available Balance": Number(b.available_balance || 0),
      }))
      const balanceSheet = XLSX.utils.json_to_sheet(
        balanceRows.length > 0 ? balanceRows : [{ Note: "No leave balance records assigned" }]
      )
      XLSX.utils.book_append_sheet(workbook, balanceSheet, "Leave Balances")

      // Sheet 2: Detailed Applications History
      const appRows = (applications || []).map((app: any, idx: number) => ({
        "Sr No": idx + 1,
        "Applied Date": app.created_at ? new Date(app.created_at).toLocaleDateString() : "-",
        "Leave Type": app.leave_type?.leave_type_name || app.leave_type_name || "Leave",
        "From Date": new Date(app.from_date).toLocaleDateString(),
        "To Date": new Date(app.to_date).toLocaleDateString(),
        "Duration (Days)": app.number_of_days,
        "Half Day": app.is_half_day ? `Yes (${app.half_day_type || "Half"})` : "No",
        "Reason": app.reason || "-",
        "Status": app.status,
        "Remarks / Action": app.remarks || (app.approved_by_user ? `By ${app.approved_by_user.first_name}` : "-"),
      }))
      const appSheet = XLSX.utils.json_to_sheet(
        appRows.length > 0 ? appRows : [{ Note: "No leave applications on record" }]
      )
      XLSX.utils.book_append_sheet(workbook, appSheet, "Leave Applications")

      // Sheet 3: Comp Off History
      const compOffRows = (compOffRequests || []).map((c: any, idx: number) => ({
        "Sr No": idx + 1,
        "Worked Date": new Date(c.worked_date).toLocaleDateString(),
        "Day Type": c.day_type === "half_day" ? "Half Day (0.5)" : "Full Day (1.0)",
        "Credited Days": c.credited_days,
        "Reason / Event": c.reason,
        "Description": c.description || "-",
        "Status": c.status,
        "Admin Remarks": c.admin_remarks || "-",
      }))
      const compOffSheet = XLSX.utils.json_to_sheet(
        compOffRows.length > 0 ? compOffRows : [{ Note: "No compensatory off records" }]
      )
      XLSX.utils.book_append_sheet(workbook, compOffSheet, "Comp Off Claims")

      const dateStr = new Date().toISOString().split("T")[0]
      const safeName = staffName.replace(/[^a-zA-Z0-9]/g, "_")
      XLSX.writeFile(workbook, `Leave_Record_${safeName}_${dateStr}.xlsx`)

      toast({
        title: "Export Successful",
        description: `Leave report for ${staffName} downloaded successfully.`,
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message || "Could not export leave records to Excel.",
      })
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold">{t("leaves")}</h2>
          <p className="text-sm text-muted-foreground">
            View allocated leave quotas, balance progress, and leave application records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportIndividualLeaveToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Leave Records (.xlsx)
          </Button>
        </div>
      </div>

      {isReportLoading ? (
        <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" /> Loading employee leave records...
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {t("leave_balance")}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> {t("leave_history")} ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="compoff" className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Comp Off ({compOffRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* 1. Leave Balance Tab */}
          <TabsContent value="balance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t("leave_balance")}
                </CardTitle>
                <CardDescription>
                  Current academic session leave balances, used days, and remaining allowance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {balances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leave balances assigned yet for this staff member.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.map((balance: any) => {
                      const total = Number(balance.total_leaves || 0)
                      const used = Number(balance.used_leaves || 0)
                      const available = Number(balance.available_balance || 0)
                      const usagePercentage = total > 0 ? (used / total) * 100 : 0

                      return (
                        <Card key={balance.id} className="border shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-base">{balance.leave_type?.leave_type_name || "Leave"}</h4>
                              <Badge variant={available > 0 ? "outline" : "destructive"}>
                                {available} Available
                              </Badge>
                            </div>
                            <Progress value={Math.min(100, usagePercentage)} className="h-2 mb-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Total: {total}</span>
                              <span className="text-amber-600 font-medium">Used: {used}</span>
                              <span className="text-emerald-600 font-bold">Remaining: {available}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Leave History Tab */}
          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t("leave_history")}
                </CardTitle>
                <CardDescription>Itemized leave applications, duration, reasons, and approval status.</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{t("no_leave_requests_found")}</div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Applied Date</TableHead>
                          <TableHead>{t("leave_type")}</TableHead>
                          <TableHead>{t("duration")}</TableHead>
                          <TableHead className="text-center">{t("days")}</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>{t("status")}</TableHead>
                          <TableHead className="text-right">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((leave: any) => (
                          <TableRow
                            key={leave.id}
                            className="cursor-pointer hover:bg-muted/40"
                            onClick={() => handleViewLeaveDetail(leave)}
                          >
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(leave.created_at)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {leave.leave_type?.leave_type_name || leave.leave_type_name || "Leave"}
                            </TableCell>
                            <TableCell>
                              {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                              {leave.is_half_day && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Half Day ({leave.half_day_type || "0.5"})
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold">{leave.number_of_days}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(leave.status)} className="capitalize">
                                {leave.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewLeaveDetail(leave)
                                }}
                              >
                                {t("view_details")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Comp Off Tab */}
          <TabsContent value="compoff" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Compensatory Off Claims
                </CardTitle>
                <CardDescription>
                  Logged work done on holidays/weekends converted into earned leave credits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {compOffRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No Comp Off requests on record.</div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Worked Date</TableHead>
                          <TableHead>Day Type</TableHead>
                          <TableHead className="text-center">Credited Days</TableHead>
                          <TableHead>Reason / Event</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compOffRequests.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{formatDate(c.worked_date)}</TableCell>
                            <TableCell className="capitalize">
                              {c.day_type === "half_day" ? "Half Day" : "Full Day"}
                            </TableCell>
                            <TableCell className="text-center font-bold text-amber-600">+{c.credited_days}</TableCell>
                            <TableCell>{c.reason}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(c.status)} className="capitalize">
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{c.admin_remarks || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Leave Detail Dialog */}
      <Dialog open={isLeaveDetailDialogOpen} onOpenChange={setIsLeaveDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("leave_request_details")}</DialogTitle>
            <DialogDescription>{t("detailed_information_about_the_leave_request")}</DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedLeave.leave_type?.leave_type_name || selectedLeave.leave_type_name || "Leave"}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatDate(selectedLeave.from_date)} - {formatDate(selectedLeave.to_date)} ({selectedLeave.number_of_days}{" "}
                    {t("days")})
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedLeave.status)} className="capitalize">
                  {selectedLeave.status}
                </Badge>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-2">{t("reason")}</h4>
                <p className="text-sm">{selectedLeave.reason || "No reason specified"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t("application_details")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("applied_on")}</p>
                        <p>{formatDate(selectedLeave.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CalendarDays className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("leave_duration")}</p>
                        <p>
                          {formatDate(selectedLeave.from_date)} - {formatDate(selectedLeave.to_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t("approval_details")}</h4>
                  <div className="space-y-2 text-sm">
                    {selectedLeave.approved_by_user && (
                      <div className="flex items-start">
                        <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Action By</p>
                          <p>
                            {selectedLeave.approved_by_user.first_name} {selectedLeave.approved_by_user.last_name || ""}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedLeave.remarks && (
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("comments")}</p>
                          <p>{selectedLeave.remarks}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveDetailDialogOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EmployeeLeaves
