import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Loader2, 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  FileDown
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import LessonPlanService from "@/services/LessonPlanService"
import { useLazyGetAllSubjectsQuery } from "@/services/subjects"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types/user"

export default function LessonPlanManager() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const currentUser = useAppSelector(selectCurrentUser)

  // Only SUPER_ADMIN, DEVELOPER, and ADMIN can delete syllabus data
  const canDeleteSyllabus = [
    UserRole.SUPER_ADMIN,
    UserRole.DEVELOPER,
    UserRole.ADMIN,
  ].includes(currentUser?.system_role as UserRole)
  
  const [getSubjects, { data: subjects }] = useLazyGetAllSubjectsQuery()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [lessonPlan, setLessonPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [coverageReport, setCoverageReport] = useState<any>(null)

  const years = [
    { value: "all", label: t("all_years") },
    { value: "1st Year", label: t("1st_year") },
    { value: "2nd Year", label: t("2nd_year") },
    { value: "3rd Year", label: t("3rd_year") },
    { value: "4th Year", label: t("4th_year") },
  ]

  const filteredSubjects = useMemo(() => {
    if (!subjects) return []
    console.log("All subjects:", subjects)
    return subjects.filter((s: any) => {
      if (selectedYear === "all") return true
      // Case-insensitive comparison and handle missing year field
      const subjectYear = s.year || ""
      return subjectYear.toLowerCase() === selectedYear.toLowerCase()
    })
  }, [subjects, selectedYear])

  const selectedSubject = useMemo(() => {
    return subjects?.find((s: any) => s.id.toString() === selectedSubjectId)
  }, [subjects, selectedSubjectId])

  useEffect(() => {
    console.log("Current Academic Session:", currentAcademicSession)
    if (currentAcademicSession) {
      getSubjects({ academic_session_id: currentAcademicSession.id })
    }
  }, [currentAcademicSession, getSubjects])

  const fetchLessonPlan = async (subjectId: string) => {
    try {
      setIsLoading(true)
      const response = await LessonPlanService.getLessonPlan(Number(subjectId), currentAcademicSession!.id)
      setLessonPlan(response.data)
      
      const reportResponse = await LessonPlanService.getCoverageReport(Number(subjectId), currentAcademicSession!.id)
      setCoverageReport(reportResponse.data)
    } catch (error) {
      console.error("Error fetching lesson plan:", error)
      setLessonPlan({
        subjectId: Number(subjectId),
        academicSessionId: currentAcademicSession!.id,
        totalRequiredHours: 40,
        topics: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value)
    fetchLessonPlan(value)
  }

  const handleAddTopic = () => {
    setLessonPlan({
      subjectId: Number(selectedSubjectId),
      academicSessionId: currentAcademicSession?.id,
      ...lessonPlan,
      topics: [
        ...(lessonPlan?.topics || []),
        { name: "", requiredHours: 1, isCompleted: false }
      ]
    })
  }

  const handleRemoveTopic = (index: number) => {
    if (!lessonPlan?.topics) return
    const newTopics = [...lessonPlan.topics]
    newTopics.splice(index, 1)
    setLessonPlan({ ...lessonPlan, topics: newTopics })
  }

  const handleTopicUpdate = (index: number, field: string, value: any) => {
    if (!lessonPlan?.topics) return
    const newTopics = [...lessonPlan.topics]
    newTopics[index] = { ...newTopics[index], [field]: value }
    setLessonPlan({ ...lessonPlan, topics: newTopics })
  }

  const toggleCompletion = async (item: any) => {
    // Determine if it's a topic or subtopic
    const isTopic = item.id.toString().startsWith("topic-")
    const id = isTopic ? Number(item.id.replace("topic-", "")) : Number(item.id)
    
    // Optimistically update local state
    const newLessonPlan = JSON.parse(JSON.stringify(lessonPlan))
    if (isTopic) {
      const topic = newLessonPlan.topics.find((t: any) => t.id === id)
      if (topic) topic.isCompleted = !topic.isCompleted
    } else {
      // It's a subtopic, find it within topics
      newLessonPlan.topics.forEach((topic: any) => {
        const subtopic = topic.subtopics?.find((s: any) => s.id === id)
        if (subtopic) subtopic.isCompleted = !subtopic.isCompleted
      })
    }
    setLessonPlan(newLessonPlan)

    // Save changes
    try {
      if (isTopic) {
        const topic = newLessonPlan.topics.find((t: any) => t.id === id)
        await LessonPlanService.updateTopicStatus(id, !!topic?.isCompleted)
      } else {
        let subStatus = false
        newLessonPlan.topics.forEach((topic: any) => {
          const sub = topic.subtopics?.find((s: any) => s.id === id)
          if (sub) subStatus = !!sub.isCompleted
        })
        await LessonPlanService.updateSubtopicStatus(id, subStatus)
      }

      toast({
        title: t("status_updated"),
        description: t("topic_completion_status_synced")
      })
      // Refresh coverage report
      const reportResponse = await LessonPlanService.getCoverageReport(Number(selectedSubjectId), currentAcademicSession!.id)
      setCoverageReport(reportResponse.data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_sync_status")
      })
      // Revert if failed
      fetchLessonPlan(selectedSubjectId)
    }
  }

  const handleExportCoverageReport = async () => {
    if (!currentAcademicSession) return
    try {
      const response = await LessonPlanService.exportPDF(currentAcademicSession.id)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `CoverageReport-${currentAcademicSession.session_name}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_export_coverage_report")
      })
    }
  }

  const handleExportLP = async (lpNumber: string | null) => {
    if (!lpNumber || !selectedSubjectId || !currentAcademicSession) return
    try {
      const response = await LessonPlanService.exportLP(
        Number(selectedSubjectId),
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
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await LessonPlanService.createLessonPlan(lessonPlan)
      toast({
        title: t("success"),
        description: t("lesson_plan_saved_successfully")
      })
      fetchLessonPlan(selectedSubjectId)
    } catch (error) {
      console.error("Error saving lesson plan:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_save_lesson_plan")
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSyllabus = async () => {
    if (!selectedSubjectId || !currentAcademicSession) return
    try {
      setIsDeleting(true)
      await LessonPlanService.deleteSyllabus(Number(selectedSubjectId), currentAcademicSession.id)
      setLessonPlan(null)
      setCoverageReport(null)
      toast({
        title: t("deleted"),
        description: t("syllabus_data_deleted_successfully"),
      })
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_delete_syllabus"),
      })
    } finally {
      setIsDeleting(false)
    }
  }

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
            topicId: topic.id
          })
        })
      } else {
        flat.push({
          id: `topic-${topic.id}`,
          name: topic.name,
          topicName: topic.name,
          topicId: topic.id,
          code: "-",
          competency: "-",
          outcome: "-",
          lessonPlanNumber: "-",
          requiredHours: topic.requiredHours,
          isCompleted: topic.isCompleted
        })
      }
    })
    return flat.sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [lessonPlan])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t("curriculum_master_grid")}</h1>
            <p className="text-gray-500 font-medium">{t("view_and_manage_syllabus_as_per_excel_format")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2 shadow-sm border-gray-200"
            onClick={handleExportCoverageReport}
          >
            <FileText className="h-4 w-4 text-gray-500" />
            {t("export_pdf")}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 shadow-md gap-2"
            onClick={handleAddTopic}
          >
            <Plus className="h-4 w-4" />
            {t("add_new_row")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-3 border-none shadow-sm h-fit sticky top-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              {t("subject_selection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("academic_year")}</Label>
              <Select onValueChange={setSelectedYear} value={selectedYear}>
                <SelectTrigger className="border-gray-200 h-11 focus:ring-blue-500">
                  <SelectValue placeholder={t("all_years")} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("choose_subject")}</Label>
              <Select onValueChange={handleSubjectChange} value={selectedSubjectId}>
                <SelectTrigger className="border-gray-200 h-11 focus:ring-blue-500">
                  <SelectValue placeholder={t("select_a_subject")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {coverageReport && (
              <div className="mt-8 pt-6 border-t space-y-5">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-blue-900">{t("syllabus_coverage")}</span>
                    <Badge className="bg-blue-600 text-white border-none">{coverageReport.coverage_percentage}%</Badge>
                  </div>
                  <Progress value={coverageReport.coverage_percentage} className="h-2 bg-blue-200/50" />
                  <div className="mt-3 flex justify-between text-[10px] text-blue-700 font-medium uppercase tracking-tighter">
                    <span>{t("planned")}</span>
                    <span>{t("completed")}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <Clock className="h-4 w-4 text-gray-400 mb-1" />
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{t("allocated")}</p>
                    <p className="text-lg font-black text-gray-800">{coverageReport.assigned_hours}h</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <AlertCircle className="h-4 w-4 text-gray-400 mb-1" />
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{t("required")}</p>
                    <p className="text-lg font-black text-gray-800">{coverageReport.required_hours}h</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="xl:col-span-9 space-y-6 min-h-[600px]">
          {!selectedSubjectId ? (
            <Card className="border-none shadow-sm py-40 text-center flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl">
              <div className="p-6 bg-white rounded-full shadow-xl mb-6">
                <BookOpen className="h-16 w-16 text-blue-200" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{t("get_started_with_curriculum")}</h3>
              <p className="text-gray-500 max-w-sm mx-auto">{t("select_a_subject_from_the_sidebar_to_view_the_master_curriculum_grid")}</p>
            </Card>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 font-medium">{t("building_master_grid")}...</p>
            </div>
          ) : (
            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-white">
              <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-20">
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900">{lessonPlan?.subject?.name || selectedSubject?.name || t("curriculum_grid")}</CardTitle>
                  <CardDescription className="text-gray-500 font-medium">
                    {flattenedSyllabus.length} {t("topics_mapped_from_excel")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-gray-200 hover:bg-gray-50 font-bold text-xs" onClick={fetchLessonPlan.bind(null, selectedSubjectId)}>
                    <Loader2 className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {t("refresh")}
                  </Button>

                  {/* Delete button — only for SUPER_ADMIN, ADMIN, DEVELOPER */}
                  {canDeleteSyllabus && flattenedSyllabus.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs gap-1.5"
                          disabled={isDeleting}
                        >
                          {isDeleting
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />
                          }
                          {t("delete_syllabus")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete Syllabus Data?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 leading-relaxed">
                            This will permanently delete all <strong>{flattenedSyllabus.length} rows</strong> of syllabus data
                            for <strong>{lessonPlan?.subject?.name || "this subject"}</strong>.
                            <br /><br />
                            You can re-upload a fresh Excel file after this. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteSyllabus}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                          >
                            Yes, Delete All Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  {flattenedSyllabus.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs">
                          <FileDown className="h-3 w-3 mr-2" />
                          {t("export_lp_sheet")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 rounded-xl shadow-xl border-gray-100">
                        <DropdownMenuLabel className="text-[10px] uppercase text-gray-400 font-black px-3 py-2">{t("select_lp_number")}</DropdownMenuLabel>
                        <div className="max-h-60 overflow-y-auto">
                          {Array.from(new Set(flattenedSyllabus.map(i => i.lessonPlanNumber || i.lesson_plan_number).filter(Boolean))).sort((a, b) => {
                            const numA = parseInt(a || "0")
                            const numB = parseInt(b || "0")
                            return numA - numB
                          }).map((lp) => (
                            <DropdownMenuItem 
                              key={lp} 
                              className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 cursor-pointer"
                              onClick={() => handleExportLP(lp)}
                            >
                              {t("lp_number")}: {lp}
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <Button className="bg-green-600 hover:bg-green-700 shadow-md font-bold text-xs" onClick={handleSave} disabled={isSaving || !lessonPlan}>
                    <Save className="h-3 w-3 mr-2" />
                    {t("save_changes")}
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="w-[80px] text-[10px] font-black text-gray-400 uppercase text-center">{t("sr_no")}</TableHead>
                        <TableHead className="w-[150px] text-[10px] font-black text-gray-400 uppercase">{t("subject_area")}</TableHead>
                        <TableHead className="w-[200px] text-[10px] font-black text-gray-400 uppercase">{t("competency")}</TableHead>
                        <TableHead className="text-[10px] font-black text-gray-400 uppercase">{t("outcome_subtopic")}</TableHead>
                        <TableHead className="w-[60px] text-[10px] font-black text-gray-400 uppercase text-center">{t("hours")}</TableHead>
                        <TableHead className="w-[80px] text-[10px] font-black text-gray-400 uppercase text-center">{t("lp_no")}</TableHead>
                        <TableHead className="w-[120px] text-[10px] font-black text-gray-400 uppercase text-center">{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flattenedSyllabus.map((item) => (
                        <TableRow key={item.id} className="hover:bg-blue-50/30 border-gray-100 group">
                          <TableCell className="text-center font-mono text-[11px] text-gray-400 group-hover:text-blue-500 font-bold transition-colors">
                            {item.code || "-"}
                          </TableCell>
                          <TableCell className="font-bold text-gray-700 text-xs py-4">
                            {item.topicName}
                          </TableCell>
                          <TableCell className="text-[11px] text-gray-500 italic max-w-[200px] leading-relaxed">
                            {item.competency || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-[12px] font-bold text-gray-900 leading-tight">{item.outcome || item.name}</span>
                              {item.detail && <span className="text-[10px] text-gray-400 line-clamp-1">{item.detail}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center h-8 w-12 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-black">
                              {item.requiredHours || item.required_hours || "0"}h
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 font-black text-[11px] hover:bg-blue-50 text-blue-600 flex items-center justify-center gap-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                              onClick={() => handleExportLP(item.lessonPlanNumber || item.lesson_plan_number)}
                              title={t("export_lp_sheet")}
                            >
                              <FileDown className="h-3 w-3" />
                              {item.lessonPlanNumber || item.lesson_plan_number || "-"}
                            </Button>
                          </TableCell>
                           <TableCell className="text-center">
                            <Button 
                              variant={item.isCompleted ? "default" : "outline"} 
                              size="sm"
                              onClick={() => toggleCompletion(item)}
                              className={`h-8 px-3 text-[10px] font-bold rounded-full transition-all duration-300 ${
                                item.isCompleted 
                                  ? "bg-green-500 hover:bg-green-600 shadow-sm" 
                                  : "text-gray-400 hover:text-blue-600 border-gray-200"
                              }`}
                            >
                              {item.isCompleted ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("taught")}</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" /> {t("pending")}</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {flattenedSyllabus.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30">
                    <AlertCircle className="h-10 w-10 text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm font-medium">{t("no_curriculum_data_available")}</p>
                    <p className="text-xs text-gray-300 mt-1">{t("please_use_bulk_upload_in_settings")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
