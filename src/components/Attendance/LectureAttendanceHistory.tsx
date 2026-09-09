import type React from "react"
import { useEffect } from "react"
import { useLazyGetLectureHistoryQuery, getHistoryExportUrl } from "@/services/LectureAttendanceService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2, Calendar } from "lucide-react"

interface LectureAttendanceHistoryProps {
  divisionId: number
  subjectId: number
  academicYear: number
}

const LectureAttendanceHistory: React.FC<LectureAttendanceHistoryProps> = ({
  divisionId,
  subjectId,
  academicYear,
}) => {
  const [triggerHistory, { data: historyData, isLoading, isError }] = useLazyGetLectureHistoryQuery()

  useEffect(() => {
    if (divisionId && subjectId && academicYear) {
      triggerHistory({ division_id: divisionId, subject_id: subjectId, academic_session: academicYear })
    }
  }, [divisionId, subjectId, academicYear, triggerHistory])

  const handleExport = () => {
    const url = getHistoryExportUrl(divisionId, subjectId, academicYear)
    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading attendance history...</span>
      </div>
    )
  }

  if (isError) {
    return <div className="py-6 text-center text-destructive">Failed to load attendance history.</div>
  }

  const records = historyData?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Attendance History ({records.length} Sessions)
          </h3>
          <p className="text-xs text-muted-foreground">Full historical logs of all marked lectures/labs</p>
        </div>
        {records.length > 0 && (
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export History (.csv)
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground">
          No attendance records found for this subject.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session Type</TableHead>
                <TableHead className="text-center">Total Students</TableHead>
                <TableHead className="text-center text-emerald-600 dark:text-emerald-400">Present</TableHead>
                <TableHead className="text-center text-rose-600 dark:text-rose-400">Absent</TableHead>
                <TableHead className="text-center text-amber-600 dark:text-amber-400">Late</TableHead>
                <TableHead className="text-center text-blue-600 dark:text-blue-400">Half Day</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.attendance_date}</TableCell>
                  <TableCell>
                    <Badge variant={row.session_type === "lab" ? "secondary" : "default"} className="capitalize">
                      {row.session_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{row.total}</TableCell>
                  <TableCell className="text-center font-semibold text-emerald-600 dark:text-emerald-400">
                    {row.present}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-rose-600 dark:text-rose-400">
                    {row.absent}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-amber-600 dark:text-amber-400">
                    {row.late}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-blue-600 dark:text-blue-400">
                    {row.half_day ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export default LectureAttendanceHistory
