import type React from "react"
import { useState, useEffect } from "react"
import {
  useLazyGetClassReportQuery,
  useLazyGetClassSubjectReportQuery,
  useLazyGetStudentReportQuery,
  useLazyGetStudentSubjectReportQuery,
  getReportExportUrl,
} from "@/services/LectureAttendanceService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2, User, Users, ChevronRight, ArrowLeft } from "lucide-react"
import type { ClassStudentSummary, StudentSubjectSummary } from "@/types/lectureAttendance"

interface LectureAttendanceReportsProps {
  divisionId: number
  academicYear: number
  defaultSubjectId?: number
  subjects?: { subject_id: number; subject_name: string }[]
}

const LectureAttendanceReports: React.FC<LectureAttendanceReportsProps> = ({
  divisionId,
  academicYear,
  defaultSubjectId,
  subjects = [],
}) => {
  const [activeTab, setActiveTab] = useState<"class" | "student">("class")

  // Class Report state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    defaultSubjectId ? String(defaultSubjectId) : "all"
  )
  const [triggerClassReport, { data: classReportData, isLoading: isLoadingClass }] = useLazyGetClassReportQuery()
  const [triggerClassSubjectReport, { data: classSubData, isLoading: isLoadingClassSub }] =
    useLazyGetClassSubjectReportQuery()

  // Student Report state
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedStudentName, setSelectedStudentName] = useState<string>("")
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("")
  const [drilledSubjectId, setDrilledSubjectId] = useState<number | null>(null)

  const [triggerStudentReport, { data: studentReportData, isLoading: isLoadingStudent }] = useLazyGetStudentReportQuery()
  const [triggerStudentSubReport, { data: studentSubData, isLoading: isLoadingStudentSub }] =
    useLazyGetStudentSubjectReportQuery()

  // Fetch class report on mount/change
  useEffect(() => {
    if (divisionId && academicYear) {
      if (selectedSubjectId === "all") {
        triggerClassReport({ division_id: divisionId, academic_session: academicYear })
      } else {
        triggerClassSubjectReport({
          division_id: divisionId,
          subject_id: Number(selectedSubjectId),
          academic_session: academicYear,
        })
      }
    }
  }, [divisionId, academicYear, selectedSubjectId, triggerClassReport, triggerClassSubjectReport])

  // Fetch student report when selected
  useEffect(() => {
    if (selectedStudentId && academicYear) {
      triggerStudentReport({ student_id: Number(selectedStudentId), academic_session: academicYear })
      setDrilledSubjectId(null)
    }
  }, [selectedStudentId, academicYear, triggerStudentReport])

  // Fetch student subject drilldown
  useEffect(() => {
    if (selectedStudentId && drilledSubjectId && academicYear) {
      triggerStudentSubReport({
        student_id: Number(selectedStudentId),
        subject_id: drilledSubjectId,
        academic_session: academicYear,
      })
    }
  }, [selectedStudentId, drilledSubjectId, academicYear, triggerStudentSubReport])

  const classStudents: ClassStudentSummary[] = classReportData?.data ?? []

  // Filter students for search dropdown in "By Student" tab
  const filteredStudents = classStudents.filter(
    (s) =>
      s.student_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(studentSearchQuery.toLowerCase()))
  )

  const handleExportClassReport = () => {
    const subId = selectedSubjectId !== "all" ? Number(selectedSubjectId) : undefined
    const url = getReportExportUrl(divisionId, academicYear, subId)
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex items-center justify-between border-b pb-3">
          <TabsList>
            <TabsTrigger value="class" className="gap-2">
              <Users className="h-4 w-4" />
              Class Performance
            </TabsTrigger>
            <TabsTrigger value="student" className="gap-2">
              <User className="h-4 w-4" />
              Student Analysis
            </TabsTrigger>
          </TabsList>

          {activeTab === "class" && (
            <Button onClick={handleExportClassReport} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report (.csv)
            </Button>
          )}
        </div>

        {/* ── TAB 1: CLASS PERFORMANCE ── */}
        <TabsContent value="class" className="space-y-4 pt-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter Subject:</label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects (Summary)</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub.subject_id} value={String(sub.subject_id)}>
                    {sub.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingClass || isLoadingClassSub ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating report...</span>
            </div>
          ) : selectedSubjectId === "all" ? (
            // All Subjects aggregate table
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    {subjects.map((sub) => (
                      <TableHead key={sub.subject_id} className="text-center">
                        {sub.subject_name}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold">Overall %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3 + subjects.length} className="text-center py-8 text-muted-foreground">
                        No student data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classStudents.map((st) => (
                      <TableRow key={st.student_id}>
                        <TableCell className="font-medium">{st.roll_number || "-"}</TableCell>
                        <TableCell className="font-semibold">{st.student_name}</TableCell>
                        {subjects.map((sub) => {
                          const subStat = st.subjects?.find((s) => s.subject_id === sub.subject_id)
                          const pct = subStat ? subStat.attendance_percentage : 0
                          return (
                            <TableCell key={sub.subject_id} className="text-center font-mono">
                              <Badge
                                variant={pct >= 75 ? "outline" : pct >= 60 ? "secondary" : "destructive"}
                                className="font-bold"
                              >
                                {pct}%
                              </Badge>
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center font-mono font-bold text-base">
                          <Badge
                            variant={st.overall_percentage >= 75 ? "default" : "destructive"}
                            className="text-sm px-2.5 py-1"
                          >
                            {st.overall_percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Single Subject date-by-date table
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    {classSubData?.sessions.map((s, idx) => (
                      <TableHead key={idx} className="text-center text-xs whitespace-nowrap">
                        {s.date}
                        <br />
                        <span className="text-[10px] text-muted-foreground uppercase">{s.session_type}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubData?.data.map((st) => (
                    <TableRow key={st.student_id}>
                      <TableCell className="font-medium">{st.roll_number || "-"}</TableCell>
                      <TableCell className="font-semibold">{st.student_name}</TableCell>
                      {st.records.map((r, idx) => (
                        <TableCell key={idx} className="text-center font-mono text-xs">
                          {r.status === "present" ? (
                            <span className="text-emerald-600 font-bold">P</span>
                          ) : r.status === "absent" ? (
                            <span className="text-rose-600 font-bold">A</span>
                          ) : r.status === "late" ? (
                            <span className="text-amber-600 font-bold">L</span>
                          ) : (
                            <span className="text-blue-600 font-bold">HD</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono font-bold">
                        <Badge
                          variant={st.attendance_percentage >= 75 ? "default" : "destructive"}
                        >
                          {st.attendance_percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: STUDENT ANALYSIS ── */}
        <TabsContent value="student" className="space-y-4 pt-4">
          <div className="flex items-center gap-4 max-w-md">
            <Input
              placeholder="Search student by name or roll number..."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>

          {studentSearchQuery && (
            <div className="border rounded-md max-h-48 overflow-y-auto bg-background divide-y">
              {filteredStudents.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">No students found</div>
              ) : (
                filteredStudents.map((st) => (
                  <div
                    key={st.student_id}
                    className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between text-sm"
                    onClick={() => {
                      setSelectedStudentId(String(st.student_id))
                      setSelectedStudentName(st.student_name)
                      setStudentSearchQuery("")
                    }}
                  >
                    <span className="font-medium">{st.student_name}</span>
                    <span className="text-xs text-muted-foreground">Roll: {st.roll_number || "N/A"}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedStudentId ? (
            <div className="space-y-4 border p-5 rounded-lg bg-card">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold">{selectedStudentName}</h3>
                    <p className="text-xs text-muted-foreground">Individual Subject Attendance Overview</p>
                  </div>
                </div>
                {drilledSubjectId && (
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setDrilledSubjectId(null)}>
                    <ArrowLeft className="h-4 w-4" /> Back to Subject List
                  </Button>
                )}
              </div>

              {isLoadingStudent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : drilledSubjectId ? (
                // Drill-down date-by-date view for selected subject
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Date-wise Breakdown</h4>
                  {isLoadingStudentSub ? (
                    <div className="py-6 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentSubData?.data.map((r, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{r.date}</TableCell>
                              <TableCell className="capitalize">{r.session_type}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    r.status === "present"
                                      ? "default"
                                      : r.status === "absent"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="capitalize"
                                >
                                  {r.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">{r.remarks || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                // Subject summary table for student
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-center">Total Lectures</TableHead>
                        <TableHead className="text-center text-emerald-600">Present</TableHead>
                        <TableHead className="text-center text-rose-600">Absent</TableHead>
                        <TableHead className="text-center font-bold">Attendance %</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentReportData?.data.map((sub: StudentSubjectSummary) => (
                        <TableRow
                          key={sub.subject_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setDrilledSubjectId(sub.subject_id)}
                        >
                          <TableCell className="font-semibold">{sub.subject_name}</TableCell>
                          <TableCell>{sub.subject_code}</TableCell>
                          <TableCell className="text-center">{sub.total_lectures}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">{sub.present}</TableCell>
                          <TableCell className="text-center text-rose-600 font-medium">{sub.absent}</TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            <Badge variant={sub.attendance_percentage >= 75 ? "default" : "destructive"}>
                              {sub.attendance_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
              Search and select a student above to view their attendance profile.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LectureAttendanceReports
