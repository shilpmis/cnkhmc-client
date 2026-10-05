import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  FileSpreadsheet, 
  BookOpen,
  RefreshCw,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  ClipboardList
} from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import DailyDiaryService from "@/services/DailyDiaryService"
import LessonPlanService from "@/services/LessonPlanService"
import LogManualWorkDialog from "@/components/TimeTable/LogManualWorkDialog"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import jsPDF from "jspdf"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DiaryLogPermissionsTab from "./DiaryLogPermissionsTab"

export default function TeacherLogsReport() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const user = useAppSelector(selectCurrentUser)
  
  const [logs, setLogs] = useState<any[]>([])
  const [manualLogs, setManualLogs] = useState<any[]>([])
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")

  useEffect(() => {
    if (currentAcademicSession && user) {
      fetchLogs()
    }
  }, [currentAcademicSession, user])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      
      const isTeacher = user?.system_role === 'SCHOOL_TEACHER' || user?.system_role === 'HEAD_TEACHER'
      
      const response = await DailyDiaryService.getLogs({
        staffId: isTeacher ? (user?.staff_id ?? undefined) : undefined
      })
      const logsData = response.data.data
      console.log('TeacherLogsReport - Received logs:', logsData)
      console.log('TeacherLogsReport - Debug info:', response.data.debug)
      setLogs(logsData)

      if (response.data.manualEntries) {
        setManualLogs(response.data.manualEntries)
      } else {
        const manualResp = await DailyDiaryService.getManualLogs({
          staffId: isTeacher ? (user?.staff_id ?? undefined) : undefined
        })
        setManualLogs(manualResp.data.data || [])
      }

      const allSubtopicIds = new Set<number>()
      logsData.forEach((log: any) => {
        if (log.subtopicIds && Array.isArray(log.subtopicIds)) {
          log.subtopicIds.forEach((id: number) => allSubtopicIds.add(id))
        }
      })
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_load_logs")
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteManualLog = async (id: number) => {
    try {
      await DailyDiaryService.deleteManualLog(id)
      toast({
        title: t("success") || "Success",
        description: "Manual work entry deleted successfully."
      })
      fetchLogs()
    } catch (error) {
      console.error("Failed to delete manual entry:", error)
      toast({
        variant: "destructive",
        title: t("error") || "Error",
        description: "Failed to delete manual work entry."
      })
    }
  }

  // Flatten logs and subtopics for grid display
  const flattenedLogs = useMemo(() => {
    const flat: any[] = []
    logs.forEach((log: any) => {
      const baseInfo = {
        date: log.date,
        subjectName: log.periodConfig?.period_config_subject?.subject?.name || t("unknown_subject"),
        className: log.periodConfig?.period_config_class_day?.class?.class || t("unknown_class"),
        periodOrder: log.periodConfig?.period_order,
        teacherName: log.staffEnrollment?.staff ? `${log.staffEnrollment.staff.first_name} ${log.staffEnrollment.staff.last_name}` : t("unknown_teacher"),
        resourcesUsed: log.resourcesUsed || log.resources_used,
        attendanceRemarks: log.attendanceRemarks || log.attendance_remarks,
        originalLog: log
      }

      let loggedHours = "-"
      const durationsObj = log.topicDurations || log.topic_durations
      if (durationsObj && typeof durationsObj === 'object') {
        const vals = Object.values(durationsObj)
        if (vals.length > 0) {
          const total = vals.reduce((acc: number, val: any) => {
            const num = typeof val === 'number' ? val : parseFloat(val)
            return acc + (isNaN(num) ? 0 : num)
          }, 0)
          if (total > 0) {
            loggedHours = `${total}`
          }
        }
      }

      let lpNumberStr = "-"
      if (log.subtopics && log.subtopics.length > 0) {
        const lpSet = new Set<string>()
        log.subtopics.forEach((sub: any) => {
          const lp = sub.lesson_plan_number || sub.lessonPlanNumber
          if (lp) lpSet.add(lp)
        })
        if (lpSet.size > 0) {
          lpNumberStr = Array.from(lpSet).join(", ")
        }
      }

      const topicText = log.topicCovered || log.topic_covered

      flat.push({
        ...baseInfo,
        topicCovered: topicText || t("no_topics_recorded"),
        hours: loggedHours,
        lessonPlanNumber: lpNumberStr
      })
    })

    let filtered = flat
    if (selectedSubject !== "all") {
      filtered = filtered.filter(item => item.subjectName === selectedSubject)
    }
    if (selectedClass !== "all") {
      filtered = filtered.filter(item => item.className === selectedClass)
    }
    return filtered
  }, [logs, t, selectedSubject, selectedClass])

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>()
    logs.forEach((log: any) => {
      const subjectName = log.periodConfig?.period_config_subject?.subject?.name
      if (subjectName) subjects.add(subjectName)
    })
    return Array.from(subjects).sort()
  }, [logs])

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>()
    logs.forEach((log: any) => {
      const className = log.periodConfig?.period_config_class_day?.class?.class
      if (className) classes.add(className)
    })
    return Array.from(classes).sort()
  }, [logs])

  const formatDateStr = (rawDate: any): string => {
    if (!rawDate) return "-"
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      const day = String(rawDate.getDate()).padStart(2, '0')
      const month = String(rawDate.getMonth() + 1).padStart(2, '0')
      const year = rawDate.getFullYear()
      return `${day}-${month}-${year}`
    }
    const str = String(rawDate).trim()
    const clean = str.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }
    return str
  }

  const exportToPDF = async () => {
    try {
      setIsLoading(true)
      const isTeacher = user?.system_role === 'SCHOOL_TEACHER' || user?.system_role === 'HEAD_TEACHER'
      const response = await DailyDiaryService.exportPDF({
        staffId: isTeacher ? (user?.staff_id ?? undefined) : undefined
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      const dateStr = format(new Date(), 'yyyy-MM-dd')
      link.setAttribute('download', `Daily_Diary_${dateStr}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: t("success"),
        description: t("export_successful")
      })
    } catch (error) {
      console.error("Server PDF export failed, using client PDF generator fallback:", error)
      try {
        let dataToExport = [...flattenedLogs]
        dataToExport.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 12

        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, pageWidth, 20, "F")

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.text("C. N. Kothari Homoeopathic Medical College & Research Centre - VYARA", pageWidth / 2, 9, { align: "center" })

        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text("DAILY DIARY / TEACHER LOGS REPORT", pageWidth / 2, 16, { align: "center" })

        doc.setTextColor(15, 23, 42)
        doc.setFontSize(8.5)
        doc.setFont("helvetica", "bold")
        const filterText = `Class: ${selectedClass === 'all' ? 'All Classes' : selectedClass}   |   Subject: ${selectedSubject === 'all' ? 'All Subjects' : selectedSubject}   |   Scheduled Logs: ${dataToExport.length}   |   Manual Work Logs: ${manualLogs.length}`
        doc.text(filterText, margin, 26)

        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.5)
        doc.line(margin, 28, pageWidth - margin, 28)

        const columns = [
          { header: "Date", width: 24 },
          { header: "Class", width: 22 },
          { header: "Subject", width: 35 },
          { header: "Teacher", width: 38 },
          { header: "Topics Covered", width: 85 },
          { header: "LP No.", width: 18 },
          { header: "Hrs", width: 14 },
          { header: "Remarks / Resources", width: 37 }
        ]

        let currentY = 32

        const drawTableHeader = (y: number) => {
          doc.setFillColor(241, 245, 249)
          doc.rect(margin, y, 273, 7, "F")
          doc.setFontSize(8)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)

          let x = margin
          columns.forEach(col => {
            doc.text(col.header, x + 2, y + 4.8)
            x += col.width
          })

          doc.setDrawColor(71, 85, 105)
          doc.line(margin, y, margin + 273, y)
          doc.line(margin, y + 7, margin + 273, y + 7)
        }

        drawTableHeader(currentY)
        currentY += 7

        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.5)
        doc.setTextColor(30, 41, 59)

        dataToExport.forEach((log, index) => {
          const dateStr = formatDateStr(log.date)
          const className = log.className || "-"
          const subjectName = log.subjectName || "-"
          const teacherName = log.teacherName || "-"
          const topicCovered = log.topicCovered || "-"
          const lpNo = log.lessonPlanNumber || "-"
          const hrs = log.hours && log.hours !== "-" ? `${log.hours}h` : "-"
          const remarks = [log.resourcesUsed, log.attendanceRemarks].filter(Boolean).join(" | ") || "-"

          const topicLines = doc.splitTextToSize(topicCovered, columns[4].width - 4)
          const remarksLines = doc.splitTextToSize(remarks, columns[7].width - 4)
          const teacherLines = doc.splitTextToSize(teacherName, columns[3].width - 4)
          const subjectLines = doc.splitTextToSize(subjectName, columns[2].width - 4)

          const maxLines = Math.max(topicLines.length, remarksLines.length, teacherLines.length, subjectLines.length, 1)
          const rowHeight = maxLines * 4 + 3

          if (currentY + rowHeight > pageHeight - 20) {
            doc.addPage()
            currentY = 12
            drawTableHeader(currentY)
            currentY += 7
            doc.setFont("helvetica", "normal")
            doc.setFontSize(7.5)
            doc.setTextColor(30, 41, 59)
          }

          if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252)
            doc.rect(margin, currentY, 273, rowHeight, "F")
          }

          let x = margin
          doc.text(dateStr, x + 2, currentY + 3.8)
          x += columns[0].width
          doc.text(doc.splitTextToSize(className, columns[1].width - 4), x + 2, currentY + 3.8)
          x += columns[1].width
          doc.text(subjectLines, x + 2, currentY + 3.8)
          x += columns[2].width
          doc.text(teacherLines, x + 2, currentY + 3.8)
          x += columns[3].width
          doc.text(topicLines, x + 2, currentY + 3.8)
          x += columns[4].width
          doc.text(lpNo, x + 2, currentY + 3.8)
          x += columns[5].width
          doc.text(hrs, x + 2, currentY + 3.8)
          x += columns[6].width
          doc.text(remarksLines, x + 2, currentY + 3.8)

          doc.setDrawColor(226, 232, 240)
          doc.line(margin, currentY + rowHeight, margin + 273, currentY + rowHeight)
          currentY += rowHeight
        })

        // Manual Non-Calendar Entries in PDF
        if (manualLogs.length > 0) {
          if (currentY + 30 > pageHeight - 20) {
            doc.addPage()
            currentY = 15
          } else {
            currentY += 8
          }

          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)
          doc.text("WORK DONE NOT ON CALENDAR (MANUAL ENTRIES)", margin, currentY)
          currentY += 4

          const manualCols = [
            { header: "Date", width: 30 },
            { header: "Time / Duration", width: 45 },
            { header: "Description of Work Done", width: 140 },
            { header: "Teacher", width: 58 }
          ]

          doc.setFillColor(241, 245, 249)
          doc.rect(margin, currentY, 273, 7, "F")
          doc.setFontSize(8)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)

          let mx = margin
          manualCols.forEach(col => {
            doc.text(col.header, mx + 2, currentY + 4.8)
            mx += col.width
          })

          doc.setDrawColor(71, 85, 105)
          doc.line(margin, currentY, margin + 273, currentY)
          doc.line(margin, currentY + 7, margin + 273, currentY + 7)
          currentY += 7

          doc.setFont("helvetica", "normal")
          doc.setFontSize(7.5)
          doc.setTextColor(30, 41, 59)

          manualLogs.forEach((m: any, mIdx: number) => {
            const dateStr = formatDateStr(m.date)
            const timeStr = m.time || "-"
            const descStr = m.description || "-"
            const teacherStr = m.staff ? `${m.staff.first_name} ${m.staff.last_name}` : "-"

            const descLines = doc.splitTextToSize(descStr, manualCols[2].width - 4)
            const teacherLines = doc.splitTextToSize(teacherStr, manualCols[3].width - 4)

            const maxMLines = Math.max(descLines.length, teacherLines.length, 1)
            const mRowHeight = maxMLines * 4 + 3

            if (currentY + mRowHeight > pageHeight - 20) {
              doc.addPage()
              currentY = 12
              doc.setFillColor(241, 245, 249)
              doc.rect(margin, currentY, 273, 7, "F")
              doc.setFontSize(8)
              doc.setFont("helvetica", "bold")
              doc.setTextColor(15, 23, 42)

              let rx = margin
              manualCols.forEach(col => {
                doc.text(col.header, rx + 2, currentY + 4.8)
                rx += col.width
              })
              currentY += 7
              doc.setFont("helvetica", "normal")
              doc.setFontSize(7.5)
              doc.setTextColor(30, 41, 59)
            }

            if (mIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252)
              doc.rect(margin, currentY, 273, mRowHeight, "F")
            }

            let curX = margin
            doc.text(dateStr, curX + 2, currentY + 3.8)
            curX += manualCols[0].width
            doc.text(timeStr, curX + 2, currentY + 3.8)
            curX += manualCols[1].width
            doc.text(descLines, curX + 2, currentY + 3.8)
            curX += manualCols[2].width
            doc.text(teacherLines, curX + 2, currentY + 3.8)

            doc.setDrawColor(226, 232, 240)
            doc.line(margin, currentY + mRowHeight, margin + 273, currentY + mRowHeight)
            currentY += mRowHeight
          })
        }

        if (currentY + 18 > pageHeight - 10) {
          doc.addPage()
          currentY = 18
        }

        currentY += 8
        doc.setFontSize(8.5)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(185, 28, 28)
        doc.text("Teacher Signature: _______________", margin + 10, currentY)
        doc.text("HOD Signature: _______________", pageWidth - margin - 70, currentY)

        const totalPages = doc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i)
          doc.setFontSize(7.5)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(148, 163, 184)
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" })
          doc.text(`Generated on: ${formatDateStr(new Date())}`, margin, pageHeight - 5)
        }

        const dateStr = format(new Date(), 'yyyy-MM-dd')
        doc.save(`Daily_Diary_${dateStr}.pdf`)
        toast({ title: t("success"), description: t("export_successful") })
      } catch (fallbackErr) {
        console.error("Client PDF export error:", fallbackErr)
        toast({ variant: "destructive", title: t("error"), description: t("export_failed") })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isTeacher = user?.system_role === 'SCHOOL_TEACHER' || user?.system_role === 'HEAD_TEACHER'

  const ReportContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t("teacher_logs_report")}</h1>
            <p className="text-gray-500 font-medium">{t("historical_view_of_your_teaching_activities")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2 shadow-sm border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition-all"
            onClick={() => setIsManualDialogOpen(true)}
          >
            <Plus className="h-4 w-4 text-amber-700" />
            Log Non-Calendar Work
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 shadow-sm border-red-200 hover:bg-red-50 text-red-600 font-bold transition-all"
            onClick={() => exportToPDF()}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-red-600" />}
            Export PDF
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md gap-2 transition-all"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("refresh_data")}
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardHeader className="pb-6 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("class")}</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-11 border-gray-200 focus:ring-indigo-500 rounded-xl w-full">
                    <SelectValue placeholder={t("all_classes")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_classes")}</SelectItem>
                    {uniqueClasses.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("subject")}</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-11 border-gray-200 focus:ring-indigo-500 rounded-xl w-full">
                    <SelectValue placeholder={t("all_subjects")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_subjects")}</SelectItem>
                    {uniqueSubjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="px-4 py-2 rounded-full border-indigo-100 bg-indigo-50/50 text-indigo-700 font-bold">
                {flattenedLogs.length} Timetable Entries
              </Badge>
              <Badge variant="outline" className="px-4 py-2 rounded-full border-amber-100 bg-amber-50/50 text-amber-800 font-bold">
                {manualLogs.length} Manual Non-Calendar Entries
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="w-[120px] text-[10px] font-black text-gray-400 uppercase py-5 pl-8">{t("date")}</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black text-gray-400 uppercase">{t("class_subject")}</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black text-gray-400 uppercase">{t("teacher")}</TableHead>
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase">{t("topics_covered")}</TableHead>
                  <TableHead className="w-[80px] text-[10px] font-black text-gray-400 uppercase text-center">{t("hrs")}</TableHead>
                  <TableHead className="w-[200px] text-[10px] font-black text-gray-400 uppercase">{t("resources_remarks")}</TableHead>
                  <TableHead className="w-[80px] text-[10px] font-black text-gray-400 uppercase text-center pr-8">{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <p className="text-gray-500 font-medium">{t("loading_your_logs")}...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : flattenedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="p-6 bg-gray-50 rounded-full">
                          <BookOpen className="h-12 w-12 text-gray-200" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-gray-800">{t("no_logs_found")}</h3>
                          <p className="text-gray-500 max-w-xs mx-auto">{t("try_adjusting_date_range")}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  flattenedLogs.map((log, idx) => (
                    <TableRow key={`${log.date}-${log.periodOrder}-${idx}`} className="hover:bg-indigo-50/20 border-gray-50 group transition-colors">
                      <TableCell className="pl-8 py-5">
                        <span className="text-sm font-bold text-gray-900">{formatDateStr(log.date)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-800">{log.subjectName}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{t("class")}: {log.className}</span>
                          <Badge variant="secondary" className="w-fit text-[9px] mt-1 bg-gray-100 text-gray-600 font-bold border-none">
                            {t("period")} {log.periodOrder}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-indigo-600">{log.teacherName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[400px]">
                          <span className="text-xs font-bold text-gray-700 leading-relaxed line-clamp-2">
                            {log.topicCovered}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center h-8 w-12 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-black border border-indigo-100 shadow-sm">
                          {log.hours && log.hours !== "-" ? `${log.hours}h` : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {log.resourcesUsed && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                              <span className="text-[10px] text-gray-600 font-medium">{log.resourcesUsed}</span>
                            </div>
                          )}
                          {log.attendanceRemarks && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                              <span className="text-[10px] text-gray-400 italic leading-tight">{log.attendanceRemarks}</span>
                            </div>
                          )}
                          {!log.resourcesUsed && !log.attendanceRemarks && <span className="text-[10px] text-gray-300 italic">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center pr-8">
                        <div className="flex items-center justify-center h-8 w-8 bg-green-50 text-green-600 rounded-full border border-green-100 mx-auto shadow-sm group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Non-Calendar Manual Work Section */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white mt-6">
        <CardHeader className="pb-4 border-b bg-amber-50/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Work Done Not On Calendar (Manual Entries)</h2>
              <p className="text-xs text-gray-500 font-medium">Extra duties, meetings, lab prep, and non-timetable activities logged manually</p>
            </div>
          </div>
          <Button 
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 rounded-xl shadow-sm"
            onClick={() => setIsManualDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            + Log Manual Work
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {manualLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm font-medium text-gray-700">No non-calendar manual work entries logged yet.</p>
              <p className="text-xs text-gray-400 mt-1">Click "+ Log Manual Work" to record extra duties, meetings, or non-calendar work.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="w-[130px] text-[10px] font-black text-gray-400 uppercase py-4 pl-8">Date</TableHead>
                  <TableHead className="w-[180px] text-[10px] font-black text-gray-400 uppercase">Time / Duration</TableHead>
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase">Description of Work</TableHead>
                  <TableHead className="w-[180px] text-[10px] font-black text-gray-400 uppercase">Teacher</TableHead>
                  <TableHead className="w-[80px] text-[10px] font-black text-gray-400 uppercase text-center pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualLogs.map((m: any) => (
                  <TableRow key={m.id} className="hover:bg-amber-50/20 border-gray-50 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <span className="text-xs font-bold text-gray-900">{formatDateStr(m.date)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-bold text-xs">
                        {m.time}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-gray-800 leading-relaxed">
                        {m.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-indigo-600">
                        {m.staff ? `${m.staff.first_name} ${m.staff.last_name}` : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center pr-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg"
                        onClick={() => handleDeleteManualLog(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LogManualWorkDialog
        isOpen={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onSuccess={fetchLogs}
        staffId={isTeacher ? (user?.staff_id ?? undefined) : undefined}
      />
    </div>
  )

  if (isTeacher) {
    return <div className="p-6 space-y-6 max-w-[1600px] mx-auto">{ReportContent}</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <Tabs defaultValue="report" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="report">{t("teacher_logs_report")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("log_permissions")}</TabsTrigger>
        </TabsList>
        <TabsContent value="report">
          {ReportContent}
        </TabsContent>
        <TabsContent value="permissions">
          <DiaryLogPermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
