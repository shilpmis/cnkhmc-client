import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, ClipboardCheck, Clock, Calendar, Users, Activity, FileText, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { useLogActivityMutation, NonLectureAssignment, NonLectureTopic } from "@/services/NonLectureService"
import { Checkbox } from "@/components/ui/checkbox"

interface LogNonLectureDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  assignment: NonLectureAssignment | null
  /** The timetable period this diary entry is written from */
  periodsConfigId?: number
  onSuccess?: () => void
}

export default function LogNonLectureDialog({
  isOpen,
  onOpenChange,
  assignment,
  periodsConfigId,
  onSuccess,
}: LogNonLectureDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [logActivity, { isLoading: isSubmitting }] = useLogActivityMutation()

  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedTopicId, setSelectedTopicId] = useState<string>("custom")
  const [hoursSpent, setHoursSpent] = useState<number>(1)
  const [batchName, setBatchName] = useState<string>("")
  const [studentsCount, setStudentsCount] = useState<string>("")
  const [activityDetails, setActivityDetails] = useState<string>("")
  const [learningOutcomes, setLearningOutcomes] = useState<string>("")
  const [clinicalCases, setClinicalCases] = useState<string>("")
  const [remarks, setRemarks] = useState<string>("")
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])
  const [conclusion, setConclusion] = useState<string>("")
  const [referenceBook, setReferenceBook] = useState<string>("")

  useEffect(() => {
    if (isOpen && assignment) {
      setDate(format(new Date(), "yyyy-MM-dd"))
      setBatchName(assignment.batch_name || "All")
      setHoursSpent(1)
      setStudentsCount("")
      setActivityDetails("")
      setLearningOutcomes("")
      setClinicalCases("")
      setRemarks("")
      setSelectedRowIds([])
      setConclusion("")
      setReferenceBook("")

      // Pick first uncompleted topic if available
      const topics = assignment.template?.topics || []
      if (topics.length > 0) {
        setSelectedTopicId(String(topics[0].id))
        setHoursSpent(Number(topics[0].hours || 1))
        const objectives = topics[0].learning_objectives || (topics[0] as any).learningObjectives
        if (objectives) {
          setLearningOutcomes(objectives)
        }
      } else {
        setSelectedTopicId("custom")
      }
    }
  }, [isOpen, assignment])

  const handleTopicChange = (topicIdStr: string) => {
    setSelectedTopicId(topicIdStr)
    setSelectedRowIds([])
    if (topicIdStr !== "custom" && assignment?.template?.topics) {
      const topic = assignment.template.topics.find((tp) => String(tp.id) === topicIdStr)
      if (topic) {
        setHoursSpent(Number(topic.hours || 1))
        const objectives = topic.learning_objectives || (topic as any).learningObjectives
        if (objectives) {
          setLearningOutcomes(objectives)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalTemplateId =
      assignment?.template_id ||
      (assignment as any)?.templateId ||
      assignment?.template?.id

    if (!assignment || !finalTemplateId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid non-lecture session assignment",
      })
      return
    }

    const finalStaffId =
      assignment?.staff_id ||
      (assignment as any)?.staffId ||
      assignment?.staff?.id

    if (!activityDetails.trim() && selectedRowIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Tick the syllabus rows covered or enter the activity details.",
      })
      return
    }

    if (hoursSpent <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Hours spent must be greater than 0.",
      })
      return
    }

    try {
      const payload = {
        template_id: Number(finalTemplateId),
        assignment_id: assignment.id,
        topic_id: selectedTopicId !== "custom" ? Number(selectedTopicId) : null,
        staff_id: finalStaffId ? Number(finalStaffId) : undefined,
        date: date,
        hours_spent: Number(hoursSpent),
        batch_name: batchName.trim() || null,
        students_count: studentsCount ? Number(studentsCount) : null,
        activity_details: activityDetails.trim() || undefined,
        learning_outcomes: learningOutcomes.trim() || null,
        clinical_cases: clinicalCases.trim() || null,
        remarks: remarks.trim() || null,
        row_ids: selectedRowIds.length ? selectedRowIds : undefined,
        conclusion: conclusion.trim() || null,
        reference_book: referenceBook.trim() || null,
        lesson_plan_number: selectedRows[0]?.lesson_plan_number || null,
        periods_config_id: periodsConfigId ?? null,
      }

      await logActivity(payload).unwrap()

      toast({
        title: "Activity Logged Successfully",
        description: `Logged ${hoursSpent} hr(s) for ${assignment.template?.title}.`,
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error Logging Activity",
        description: err?.data?.message || err.message || "Failed to submit log",
      })
    }
  }

  const topics: NonLectureTopic[] = assignment?.template?.topics || []
  const selectedTopic = topics.find((tp) => String(tp.id) === selectedTopicId)
  const topicRows = selectedTopic?.rows || []
  const coveredBefore = assignment?.covered_row_ids || []
  const selectedRows = topicRows.filter((r) => r.id !== undefined && selectedRowIds.includes(r.id))

  const toggleRow = (id: number, checked: boolean) => {
    const next = checked ? [...selectedRowIds, id] : selectedRowIds.filter((x) => x !== id)
    setSelectedRowIds(next)
    // hours follow what is ticked, unless nothing is ticked
    const hrs = topicRows.filter((r) => r.id !== undefined && next.includes(r.id)).reduce((sum, r) => sum + Number(r.required_hours || 0), 0)
    if (hrs > 0) setHoursSpent(hrs)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Log Non-Lecture / Clinical Session
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record your conducted clinical duties, bedside clinics, practicals, or tutorial sessions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {assignment && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Session Context Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-indigo-950">{assignment.template?.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-indigo-700">
                  <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
                    {assignment.template?.activity_type}
                  </Badge>
                  <span>Class: {assignment.class?.class || assignment.template?.class?.class || "General"}</span>
                  <span>•</span>
                  <span>Batch: {assignment.batch_name || "All"}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="text-gray-500">Progress:</span>
                <p className="font-bold text-indigo-700">
                  {assignment.logged_hours || 0} / {assignment.target_hours || 0} hrs
                </p>
              </div>
            </div>

            {/* Date, Topic & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1 text-gray-700">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  Date *
                </Label>
                <Input
                  type="date"
                  value={date}
                  max={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1 text-gray-700">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  Hours Spent *
                </Label>
                <Input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1 text-gray-700">
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                  Batch / Group
                </Label>
                <Input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Batch A, Ward 2"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Topic from Template */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1 text-gray-700">
                <Activity className="h-3.5 w-3.5 text-indigo-500" />
                Curriculum Topic / Unit Covered
              </Label>
              <Select value={selectedTopicId} onValueChange={handleTopicChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select topic from template" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((tp, idx) => (
                    <SelectItem key={tp.id} value={String(tp.id)} className="text-xs">
                      #{tp.topic_order || (tp as any).topicOrder || (idx + 1)}: {tp.title} ({tp.hours} hrs)
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-xs text-indigo-600 font-medium">
                    + Other / Custom Non-Lecture Activity
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Syllabus rows of the chosen topic: what the teacher plans to follow */}
            {topicRows.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Syllabus covered today ({topicRows.filter((r) => r.id !== undefined && coveredBefore.includes(r.id)).length}/{topicRows.length} done earlier)
                </Label>
                <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
                  {topicRows.map((r, i) => {
                    const done = r.id !== undefined && coveredBefore.includes(r.id)
                    const checked = r.id !== undefined && selectedRowIds.includes(r.id)
                    return (
                      <label key={r.id ?? i} className={"flex items-start gap-2 p-2 text-xs cursor-pointer " + (done ? "bg-emerald-50/60" : "hover:bg-indigo-50/40")}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => r.id !== undefined && toggleRow(r.id, v === true)}
                          className="mt-0.5"
                        />
                        <span className="flex-1">
                          <span className="font-semibold text-gray-900">{r.sl_no ? r.sl_no + ". " : ""}{r.content || r.competency || "—"}</span>
                          {r.outcome && <span className="block text-gray-500">SLO: {r.outcome}</span>}
                          <span className="block text-[10px] text-gray-400">
                            {[r.miller, r.bloom, r.priority, r.tl_mm].filter(Boolean).join(" • ")}
                          </span>
                        </span>
                        {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Students count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Number of Students Attended (Optional)
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 25"
                  value={studentsCount}
                  onChange={(e) => setStudentsCount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Clinical Cases / Patients Examined (Optional)
                </Label>
                <Input
                  placeholder="e.g. OPD Case #102, #105 (Bronchial Asthma, Eczema)"
                  value={clinicalCases}
                  onChange={(e) => setClinicalCases(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Activity Details (Required) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1 text-gray-700">
                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                Activity Details &amp; Work Conducted {selectedRowIds.length === 0 && "*"}
              </Label>
              <Textarea
                rows={3}
                value={activityDetails}
                onChange={(e) => setActivityDetails(e.target.value)}
                placeholder="Describe the clinical demonstration, bedside discussion, practical experiment, or case analysis conducted..."
                className="text-xs resize-none"
              />
            </div>

            {/* Learning Outcomes & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Learning Outcomes / Competencies</Label>
                <Textarea
                  rows={2}
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  placeholder="Key competencies achieved by students..."
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Remarks / Follow-up</Label>
                <Textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any observations, assignments given, or follow-up needed..."
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Conclusion</Label>
                <Textarea rows={2} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Summary / take-home point of the session..." className="text-xs resize-none" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Reference Book</Label>
                <Input value={referenceBook} onChange={(e) => setReferenceBook(e.target.value)} placeholder="e.g. Organon of Medicine, 6th ed." className="h-9 text-xs" />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!activityDetails.trim() && selectedRowIds.length === 0)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Activity Log
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
