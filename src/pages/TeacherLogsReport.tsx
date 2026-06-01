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
  CheckCircle2
} from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import DailyDiaryService from "@/services/DailyDiaryService"
import LessonPlanService from "@/services/LessonPlanService"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as XLSX from 'xlsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export default function TeacherLogsReport() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const user = useAppSelector(selectCurrentUser)
  
  const [logs, setLogs] = useState<any[]>([])
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
        // startDate: dateRange.startDate,
        // endDate: dateRange.endDate,
        staffId: isTeacher ? (user?.staff_id ?? undefined) : undefined
      })
      const logsData = response.data.data
      console.log('TeacherLogsReport - Received logs:', logsData)
      console.log('TeacherLogsReport - Debug info:', response.data.debug)
      setLogs(logsData)

      // Extract all subtopic IDs from all logs to fetch their metadata
      const allSubtopicIds = new Set<number>()
      logsData.forEach((log: any) => {
        if (log.subtopicIds && Array.isArray(log.subtopicIds)) {
          log.subtopicIds.forEach((id: number) => allSubtopicIds.add(id))
        }
      })

      // Fetch metadata for these subtopics if we have any
      if (allSubtopicIds.size > 0) {
        // We'll need a way to fetch multiple subtopics by ID
        // For now, let's assume we might need a new endpoint or fetch the whole lesson plan
        // Actually, let's see if we can get them from the logs response if we update the backend
      }
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
        resourcesUsed: log.resourcesUsed,
        attendanceRemarks: log.attendanceRemarks,
        originalLog: log
      }

      if (log.subtopics && log.subtopics.length > 0) {
        log.subtopics.forEach((sub: any) => {
          flat.push({
            ...baseInfo,
            subtopicId: sub.id,
            topicCovered: sub.name,
            requiredHours: sub.required_hours || sub.requiredHours,
            lessonPlanNumber: sub.lesson_plan_number || sub.lessonPlanNumber
          })
        })
      } else {
        flat.push({
          ...baseInfo,
          topicCovered: log.topicCovered || t("no_topics_recorded"),
          subtopicId: null,
          requiredHours: "-",
          lessonPlanNumber: "-"
        })
      }
    })

    // Apply filters
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

  const lpNumbersToExport = useMemo(() => {
    const lps = new Map<string, { lpNumber: string, subjectId: number, subjectName: string }>()
    flattenedLogs.forEach(log => {
      if (log.lessonPlanNumber && log.lessonPlanNumber !== "-" && log.originalLog?.periodConfig?.period_config_subject?.subject_id) {
        const key = `${log.originalLog.periodConfig.period_config_subject.subject_id}-${log.lessonPlanNumber}`
        if (!lps.has(key)) {
          lps.set(key, {
            lpNumber: log.lessonPlanNumber,
            subjectId: log.originalLog.periodConfig.period_config_subject.subject_id,
            subjectName: log.subjectName
          })
        }
      }
    })
    return Array.from(lps.values()).sort((a, b) => {
      if (a.subjectName !== b.subjectName) return a.subjectName.localeCompare(b.subjectName)
      return a.lpNumber.localeCompare(b.lpNumber, undefined, { numeric: true })
    })
  }, [flattenedLogs])

  const exportToExcel = (lpWise: boolean = false) => {
    try {
      let dataToExport = [...flattenedLogs]
      
      if (lpWise) {
        // Sort by LP number. Handle cases where LP number might be a string or missing.
        dataToExport.sort((a, b) => {
          const lpA = a.lessonPlanNumber?.toString() || ""
          const lpB = b.lessonPlanNumber?.toString() || ""
          return lpA.localeCompare(lpB, undefined, { numeric: true, sensitivity: 'base' })
        })
      } else {
        // Standard sort by date
        dataToExport.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }

      // Map to friendly headers
      const excelData = dataToExport.map(log => ({
        [t("date")]: format(new Date(log.date), 'dd-MM-yyyy'),
        [t("class")]: log.className,
        [t("subject")]: log.subjectName,
        [t("teacher")]: log.teacherName,
        [t("topics_covered")]: log.topicCovered,
        [t("lp_no")]: log.lessonPlanNumber || "-",
        [t("hrs")]: log.requiredHours || "-",
        [t("resources_used")]: log.resourcesUsed || "-",
        [t("remarks")]: log.attendanceRemarks || "-"
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, t("teacher_logs"))

      // Generate filename
      const dateStr = format(new Date(), 'yyyy-MM-dd')
      const filename = lpWise 
        ? `Teacher_Logs_LP_Wise_${dateStr}.xlsx`
        : `Teacher_Logs_${dateStr}.xlsx`

      XLSX.writeFile(workbook, filename)

      toast({
        title: t("success"),
        description: t("export_successful")
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("export_failed")
      })
    }
  }

  const handleExportLP = async (subjectId: number, lpNumber: string) => {
    if (!currentAcademicSession) return
    try {
      setIsLoading(true)
      const response = await LessonPlanService.exportLP(
        subjectId,
        currentAcademicSession.id,
        lpNumber
      )
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `LessonPlan-${lpNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: t("success"),
        description: t("export_successful")
      })
    } catch (error) {
      console.error("Export Error:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_export_lp_sheet")
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shadow-sm border-gray-200 hover:bg-gray-50 transition-all">
                <FileText className="h-4 w-4 text-gray-500" />
                {t("export_excel")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => exportToExcel(false)} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                {t("standard_export")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(true)} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                {t("export_excel_lp_wise")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-gray-400 font-black px-3 py-2">
                {t("export_lp_sheets")}
              </DropdownMenuLabel>
              <ScrollArea className="h-60">
                {lpNumbersToExport.map((lp) => (
                  <DropdownMenuItem 
                    key={`${lp.subjectId}-${lp.lpNumber}`}
                    onClick={() => handleExportLP(lp.subjectId, lp.lpNumber)}
                    className="cursor-pointer text-xs"
                  >
                    <FileText className="h-3 w-3 mr-2 text-blue-600" />
                    <span className="font-bold">{lp.lpNumber}</span>
                    <span className="ml-2 text-gray-400 text-[10px]">({lp.subjectName})</span>
                  </DropdownMenuItem>
                ))}
                {lpNumbersToExport.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-400 text-[10px]">
                    {t("no_lp_numbers_found")}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
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
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("start_date")}</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    type="date" 
                    className="pl-10 h-11 border-gray-200 focus:ring-indigo-500 rounded-xl" 
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("end_date")}</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    type="date" 
                    className="pl-10 h-11 border-gray-200 focus:ring-indigo-500 rounded-xl" 
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </div> */}
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
            {/* </div> */}
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="px-4 py-2 rounded-full border-indigo-100 bg-indigo-50/50 text-indigo-700 font-bold">
                {logs.length} {t("entries_found")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[650px]">
            <Table>
              <TableHeader className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="w-[120px] text-[10px] font-black text-gray-400 uppercase py-5 pl-8">{t("date")}</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black text-gray-400 uppercase">{t("class_subject")}</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black text-gray-400 uppercase">{t("teacher")}</TableHead>
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase">{t("topics_covered")}</TableHead>
                  <TableHead className="w-[80px] text-[10px] font-black text-gray-400 uppercase text-center">{t("hrs")}</TableHead>
                  <TableHead className="w-[100px] text-[10px] font-black text-gray-400 uppercase text-center">{t("lp_no")}</TableHead>
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
                    <TableCell colSpan={7} className="h-96 text-center">
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
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{format(new Date(log.date), 'dd MMM yyyy')}</span>
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{format(new Date(log.date), 'EEEE')}</span>
                        </div>
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
                          {log.requiredHours && log.requiredHours !== "-" ? `${log.requiredHours}h` : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] font-bold border-gray-200 bg-white px-2 py-1">
                          {log.lessonPlanNumber || "-"}
                        </Badge>
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
    </div>
  )
}
