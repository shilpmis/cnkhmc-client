import type React from "react"
import { useState, useEffect } from "react"
import {
  useLazyGetLectureAttendanceForDateQuery,
  useMarkLectureAttendanceMutation,
} from "@/services/LectureAttendanceService"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AssignedSubject, AttendanceStatus, LectureAttendanceStudent } from "@/types/lectureAttendance"
import LectureAttendanceHistory from "./LectureAttendanceHistory"
import LectureAttendanceReports from "./LectureAttendanceReports"

interface LectureAttendanceMarkingViewProps {
  assignedSubject: AssignedSubject
  academicYear: number
  userId: number
  onBack: () => void
}

const LectureAttendanceMarkingView: React.FC<LectureAttendanceMarkingViewProps> = ({
  assignedSubject,
  academicYear,
  userId,
  onBack,
}) => {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [sessionType, setSessionType] = useState<"lecture" | "lab">(assignedSubject.session_type)
  const [activeTab, setActiveTab] = useState<"mark" | "history" | "reports">("mark")
  const [students, setStudents] = useState<LectureAttendanceStudent[]>([])
  const [isMarked, setIsMarked] = useState<boolean>(false)

  const [triggerFetchDate, { data: dateData, isLoading: isLoadingDate }] = useLazyGetLectureAttendanceForDateQuery()
  const [markAttendance, { isLoading: isSubmitting }] = useMarkLectureAttendanceMutation()

  // Fetch attendance when date changes
  useEffect(() => {
    if (selectedDate && assignedSubject && academicYear) {
      const unixDate = Math.floor(selectedDate.getTime() / 1000)
      triggerFetchDate({
        division_id: assignedSubject.division_id,
        subject_id: assignedSubject.subject_id,
        unix_date: unixDate,
        academic_session: academicYear,
      })
    }
  }, [selectedDate, assignedSubject, academicYear, triggerFetchDate])

  // Sync fetched student data into local state
  useEffect(() => {
    if (dateData) {
      setIsMarked(dateData.is_marked)
      if (dateData.session_type) {
        setSessionType(dateData.session_type)
      }
      setStudents(
        dateData.attendance_data.map((s) => ({
          ...s,
          status: s.status || "present", // Default to present if unmarked
        }))
      )
    }
  }, [dateData])

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    if (isMarked) return
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
    )
  }

  const handleRemarksChange = (studentId: number, remarks: string) => {
    if (isMarked) return
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks } : s))
    )
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    if (isMarked) return
    setStudents((prev) => prev.map((s) => ({ ...s, status })))
  }

  const handleSubmit = async () => {
    if (isMarked) return

    const payload = {
      division_id: assignedSubject.division_id,
      subject_id: assignedSubject.subject_id,
      academic_year: academicYear,
      date: format(selectedDate, "yyyy-MM-dd"),
      session_type: sessionType,
      marked_by: userId,
      attendance_data: students.map((s) => ({
        student_id: s.student_id,
        status: s.status || "present",
        remarks: s.remarks || undefined,
      })),
    }

    try {
      await markAttendance(payload).unwrap()
      toast({
        title: "Success",
        description: "Lecture attendance marked successfully!",
      })
      setIsMarked(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to mark attendance",
        variant: "destructive",
      })
    }
  }

  const counts = {
    total: students.length,
    present: students.filter((s) => s.status === "present").length,
    absent: students.filter((s) => s.status === "absent").length,
    late: students.filter((s) => s.status === "late").length,
    halfDay: students.filter((s) => s.status === "half_day").length,
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{assignedSubject.subject_name}</h2>
              <Badge variant="outline">{assignedSubject.division_name}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Subject Code: {assignedSubject.subject_code || "N/A"} | Division ID: {assignedSubject.division_id}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: MARK ATTENDANCE ── */}
        <TabsContent value="mark" className="space-y-6 pt-4">
          {/* Date Picker & Controls Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Select Date:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48 justify-start text-left font-normal gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-sm font-semibold ml-4">Session:</span>
              <div className="flex gap-1 border rounded-md p-1 bg-muted/40">
                <Button
                  variant={sessionType === "lecture" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSessionType("lecture")}
                  disabled={isMarked}
                >
                  Lecture
                </Button>
                <Button
                  variant={sessionType === "lab" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSessionType("lab")}
                  disabled={isMarked}
                >
                  Lab
                </Button>
              </div>
            </div>

            {/* Status Banner */}
            <div>
              {isMarked ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Attendance Already Marked
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4" /> Ready to Mark
                </div>
              )}
            </div>
          </div>

          {/* Attendance Stats Counter */}
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="border rounded-lg p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-xl font-bold">{counts.total}</p>
            </div>
            <div className="border rounded-lg p-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <p className="text-xs font-medium">Present</p>
              <p className="text-xl font-bold">{counts.present}</p>
            </div>
            <div className="border rounded-lg p-3 bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400">
              <p className="text-xs font-medium">Absent</p>
              <p className="text-xl font-bold">{counts.absent}</p>
            </div>
            <div className="border rounded-lg p-3 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <p className="text-xs font-medium">Late</p>
              <p className="text-xl font-bold">{counts.late}</p>
            </div>
            <div className="border rounded-lg p-3 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
              <p className="text-xs font-medium">Half Day</p>
              <p className="text-xl font-bold">{counts.halfDay}</p>
            </div>
          </div>

          {/* Student Table */}
          {isLoadingDate ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading student roster...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {!isMarked && (
                <div className="flex items-center justify-end gap-2 text-xs font-medium">
                  <span>Mark All As:</span>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAll("present")}>
                    Present
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAll("absent")}>
                    Absent
                  </Button>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-16">Roll No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-center w-72">Status</TableHead>
                      <TableHead className="w-64">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((st) => (
                      <TableRow key={st.student_id}>
                        <TableCell className="font-medium">{st.roll_number || "-"}</TableCell>
                        <TableCell className="font-semibold">{st.student_name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant={st.status === "present" ? "default" : "outline"}
                              className={st.status === "present" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                              onClick={() => handleStatusChange(st.student_id, "present")}
                              disabled={isMarked}
                            >
                              P
                            </Button>
                            <Button
                              size="sm"
                              variant={st.status === "absent" ? "destructive" : "outline"}
                              onClick={() => handleStatusChange(st.student_id, "absent")}
                              disabled={isMarked}
                            >
                              A
                            </Button>
                            <Button
                              size="sm"
                              variant={st.status === "late" ? "secondary" : "outline"}
                              className={st.status === "late" ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
                              onClick={() => handleStatusChange(st.student_id, "late")}
                              disabled={isMarked}
                            >
                              L
                            </Button>
                            <Button
                              size="sm"
                              variant={st.status === "half_day" ? "secondary" : "outline"}
                              className={st.status === "half_day" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                              onClick={() => handleStatusChange(st.student_id, "half_day")}
                              disabled={isMarked}
                            >
                              HD
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Optional note"
                            value={st.remarks || ""}
                            onChange={(e) => handleRemarksChange(st.student_id, e.target.value)}
                            disabled={isMarked}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!isMarked && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 px-6">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Submit Attendance
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: HISTORY ── */}
        <TabsContent value="history" className="pt-4">
          <LectureAttendanceHistory
            divisionId={assignedSubject.division_id}
            subjectId={assignedSubject.subject_id}
            academicYear={academicYear}
          />
        </TabsContent>

        {/* ── TAB 3: REPORTS ── */}
        <TabsContent value="reports" className="pt-4">
          <LectureAttendanceReports
            divisionId={assignedSubject.division_id}
            academicYear={academicYear}
            defaultSubjectId={assignedSubject.subject_id}
            subjects={[{ subject_id: assignedSubject.subject_id, subject_name: assignedSubject.subject_name }]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LectureAttendanceMarkingView
