import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle, Edit3, ClipboardList, Info } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import LessonPlanService from "@/services/LessonPlanService"
import DailyDiaryService from "@/services/DailyDiaryService"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"

interface LogLectureDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  period: any
  subjectId?: number
  subjectName?: string
  date?: string
  onSuccess?: () => void
}

export default function LogLectureDialog({ isOpen, onOpenChange, period, subjectId: propSubjectId, subjectName: propSubjectName, date, onSuccess }: LogLectureDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const currentUser = useAppSelector(selectCurrentUser)
  
  const [logData, setLogData] = useState({
    topicCovered: "",
    resourcesUsed: "",
    attendanceRemarks: "",
    conclusion: "",
    referenceBook: "",
    attendance: "",
    topicIds: [] as number[],
    subtopicIds: [] as number[],
    topicDurations: {} as Record<number, number | string>
  })
  const [lessonPlan, setLessonPlan] = useState<any>(null)
  const [isLoadingLessonPlan, setIsLoadingLessonPlan] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Flatten topics and subtopics for grid display
  const flattenedSyllabus = useMemo(() => {
    if (!lessonPlan?.topics) return []
    const flat: any[] = []
    lessonPlan.topics.forEach((topic: any) => {
      if (topic.subtopics && topic.subtopics.length > 0) {
        topic.subtopics.forEach((sub: any) => {
          flat.push({
            ...sub,
            topicName: topic.name,
            topicId: topic.id,
            assignedStaffIds: sub.assignedStaffIds || sub.assigned_staff_ids || topic.assignedStaffIds || topic.assigned_staff_ids
          })
        })
      } else {
        // Fallback if no subtopics
        flat.push({
          id: `topic-${topic.id}`,
          name: topic.name,
          topicName: topic.name,
          topicId: topic.id,
          code: "-",
          competency: "-",
          outcome: "-",
          lessonPlanNumber: topic.lessonPlanNumber || topic.lesson_plan_number || "-",
          requiredHours: topic.requiredHours || topic.required_hours || 0,
          assignedStaffIds: topic.assignedStaffIds || topic.assigned_staff_ids
        })
      }
    })

    const teacherStaffId = currentUser?.staff?.id || (currentUser as any)?.staff_id
    if (teacherStaffId) {
      const teacherAssignedTopics = flat.filter((item: any) => 
        item.assignedStaffIds && Array.isArray(item.assignedStaffIds) && item.assignedStaffIds.map(Number).includes(Number(teacherStaffId))
      )
      if (teacherAssignedTopics.length > 0) {
        return teacherAssignedTopics.sort((a, b) => (a.order || 0) - (b.order || 0))
      }
    }

    return flat.sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [lessonPlan, currentUser])

  useEffect(() => {
    if (isOpen && period) {
      setLogData({
        topicCovered: "",
        resourcesUsed: "",
        attendanceRemarks: "",
        conclusion: "",
        referenceBook: "",
        attendance: "",
        topicIds: [],
        subtopicIds: [],
        topicDurations: {}
      })
      
      const sId = propSubjectId || period.period_config_subject?.subject_id || period.subjects_division_masters_id
      if (sId) {
        fetchLessonPlan(sId)
      }
    }
  }, [isOpen, period, propSubjectId])

  const fetchLessonPlan = async (subjectId: number) => {
    try {
      setIsLoadingLessonPlan(true)
      setLessonPlan(null)
      const academicSessionId = currentAcademicSession?.id || period.academic_session_id || period.period_config_class_day?.class?.academic_session_id
      const response = await LessonPlanService.getLessonPlan(subjectId, academicSessionId)
      setLessonPlan(response.data)
    } catch (error) {
      console.error("Error fetching lesson plan:", error)
    } finally {
      setIsLoadingLessonPlan(false)
    }
  }

  const toggleSubtopic = (subtopicId: any, name: string, checked: boolean) => {
    const isTopicFallback = typeof subtopicId === 'string' && subtopicId.startsWith('topic-')
    const realId = isTopicFallback ? parseInt(subtopicId.replace('topic-', '')) : subtopicId

    let newSubtopicIds = [...logData.subtopicIds]
    if (!isTopicFallback) {
      if (checked) {
        newSubtopicIds.push(realId)
      } else {
        newSubtopicIds = newSubtopicIds.filter(id => id !== realId)
      }
    }

    // Identify which parent topics are "active" based on selected subtopics
    const activeTopicIds = new Set<number>()
    const selectedNames: string[] = []

    flattenedSyllabus.forEach(item => {
      const isItemSelected = isTopicFallback 
        ? (item.id === subtopicId && checked) 
        : newSubtopicIds.includes(item.id)

      if (isItemSelected) {
        activeTopicIds.add(item.topicId)
        selectedNames.push(`${item.code !== "-" ? item.code + ": " : ""}${item.outcome || item.name}`)
      }
    })

    setLogData({
      ...logData,
      subtopicIds: newSubtopicIds,
      topicIds: Array.from(activeTopicIds),
      topicCovered: selectedNames.join("; ")
    })
  }

  const handleLogSubmit = async () => {
    if (!logData.topicCovered) {
      toast({
        variant: "destructive",
        description: t("topic_covered_is_required")
      })
      return
    }

    try {
      setIsSubmitting(true)
      const cleanDurations: Record<number, number> = {}
      Object.entries(logData.topicDurations).forEach(([key, val]) => {
        const numKey = Number(key)
        const numVal = typeof val === "string" ? parseFloat(val) : val
        if (!isNaN(numVal)) {
          cleanDurations[numKey] = numVal
        }
      })

      await DailyDiaryService.logActivity({
        periodsConfigId: period.id,
        date: date || format(new Date(), 'yyyy-MM-dd'),
        ...logData,
        topicDurations: cleanDurations
      })
      
      toast({
        title: t("success"),
        description: t("activity_logged_successfully")
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error logging activity:", error)
      const errorMessage = error.response?.data?.message || t("failed_to_log_activity")
      toast({
        variant: "destructive",
        title: t("error"),
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            {t("log_lecture_activity")}
          </DialogTitle>
          <DialogDescription>
            {period && (
              <span className="font-medium text-gray-700">
                {propSubjectName || period.period_config_subject?.subject?.name || "Subject"} - Period {period.period_order}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
          {/* Left Column: Grid Selection */}
          <div className="lg:col-span-8 flex flex-col min-h-0">
            <Label className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4" />
              {t("select_topics_from_curriculum_grid")}
            </Label>
            
            <div className="border rounded-md overflow-hidden bg-white shadow-sm flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                {isLoadingLessonPlan ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                    <span className="text-sm text-gray-500">{t("loading_curriculum_grid")}...</span>
                  </div>
                ) : flattenedSyllabus.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[80px] text-xs font-bold">{t("code")}</TableHead>
                        <TableHead className="w-[150px] text-xs font-bold">{t("subject_area")}</TableHead>
                        <TableHead className="text-xs font-bold">{t("competency")}</TableHead>
                        <TableHead className="text-xs font-bold">{t("outcome_subtopic")}</TableHead>
                        <TableHead className="w-[60px] text-xs font-bold text-center">{t("hrs")}</TableHead>
                        <TableHead className="w-[70px] text-xs font-bold text-center">{t("lp_no")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flattenedSyllabus.map((item) => {
                        const isCompleted = item.isCompleted || item.is_completed;
                        return (
                          <TableRow 
                            key={item.id} 
                            className={`transition-colors ${
                              isCompleted 
                                ? "bg-green-50/50 opacity-70 cursor-not-allowed" 
                                : logData.subtopicIds.includes(item.id) || (typeof item.id === 'string' && logData.topicCovered.includes(item.name))
                                  ? "bg-blue-50 hover:bg-blue-100 cursor-pointer" 
                                  : "hover:bg-gray-50 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (isCompleted) return;
                              toggleSubtopic(item.id, item.name, !logData.subtopicIds.includes(item.id));
                            }}
                          >
                            <TableCell className="p-2 text-center">
                              <Checkbox 
                                checked={isCompleted || logData.subtopicIds.includes(item.id) || (typeof item.id === 'string' && logData.topicCovered.includes(item.name))}
                                disabled={isCompleted}
                                onCheckedChange={(checked) => {
                                  if (isCompleted) return;
                                  toggleSubtopic(item.id, item.name, checked === true);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="p-2 text-[11px] font-mono text-gray-500">{item.code || "-"}</TableCell>
                            <TableCell className="p-2 text-[11px] font-medium text-gray-700">{item.topicName}</TableCell>
                            <TableCell className="p-2 text-[11px] text-gray-600 italic">{item.competency || "-"}</TableCell>
                            <TableCell className="p-2 text-[11px] text-gray-800 font-medium">
                              <div className="flex items-center gap-2">
                                <span>{item.outcome || item.name}</span>
                                {isCompleted && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-[9px] px-1.5 py-0 h-4">
                                    {t("completed")}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-[11px] text-center font-bold text-blue-600">{item.requiredHours || item.required_hours || "0"}h</TableCell>
                            <TableCell className="p-2 text-[11px] text-center">
                              <Badge variant="outline" className="text-[9px] bg-gray-50">
                                {item.lessonPlanNumber || item.lesson_plan_number || "-"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Info className="h-10 w-10 mb-2 opacity-20" />
                    <p>{t("no_curriculum_found_please_upload_excel_first")}</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Right Column: Logging Form */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="topic" className="font-semibold text-sm flex items-center justify-between">
                <span>{t("topic_covered")} *</span>
                {logData.subtopicIds.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">
                    {logData.subtopicIds.length} {t("items_selected")}
                  </Badge>
                )}
              </Label>
              <Textarea
                id="topic"
                placeholder={t("select_from_grid_or_type_here")}
                value={logData.topicCovered}
                onChange={(e) => setLogData({ ...logData, topicCovered: e.target.value })}
                className="min-h-[100px] border-gray-200 text-sm"
              />
            </div>
            
            {logData.topicIds.length > 0 && (
              <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                <Label className="font-semibold text-sm text-blue-800">{t("hours_taught_per_topic")}</Label>
                {logData.topicIds.map(topicId => {
                  const topic = lessonPlan?.topics?.find((t: any) => t.id === topicId);
                  const required = topic?.requiredHours || topic?.required_hours || 0;
                  const completed = topic?.completedHours || topic?.completed_hours || 0;
                  const maxAllowed = Math.max(0, required - completed);
                  
                  return (
                    <div key={topicId} className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate" title={topic?.name}>
                          {topic?.name || `Topic ${topicId}`}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {completed}h completed of {required}h
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          step="0.5"
                          min="0"
                          max={maxAllowed}
                          placeholder="Hrs"
                          className="w-20 h-8 text-sm text-right"
                          value={logData.topicDurations[topicId] || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setLogData({
                              ...logData,
                              topicDurations: {
                                ...logData.topicDurations,
                                [topicId]: isNaN(val) ? "" : val
                              }
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="attendance" className="font-semibold text-sm">{t("attendance")}</Label>
              <Input
                id="attendance"
                placeholder={t("e_g_45_or_45_out_of_50")}
                value={logData.attendance}
                onChange={(e) => setLogData({ ...logData, attendance: e.target.value })}
                className="border-gray-200 h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conclusion" className="font-semibold text-sm">{t("conclusion")}</Label>
              <Textarea
                id="conclusion"
                placeholder={t("summarize_lecture_conclusion")}
                value={logData.conclusion}
                onChange={(e) => setLogData({ ...logData, conclusion: e.target.value })}
                className="min-h-[80px] border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceBook" className="font-semibold text-sm">{t("reference_book")}</Label>
              <Textarea
                id="referenceBook"
                placeholder={t("reference_book_used")}
                value={logData.referenceBook}
                onChange={(e) => setLogData({ ...logData, referenceBook: e.target.value })}
                className="min-h-[80px] border-gray-200 text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10">
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleLogSubmit} 
            disabled={isSubmitting || !logData.topicCovered}
            className="bg-blue-600 hover:bg-blue-700 h-10 px-8"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            {t("save_log")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
