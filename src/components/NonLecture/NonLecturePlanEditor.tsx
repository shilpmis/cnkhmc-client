import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, FileSpreadsheet, FileText, Loader2, Pencil, Plus, Save, Trash2, Upload, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useGetAllTeachingStaffQuery } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import {
  useGetNonLecturePlanQuery,
  useSaveNonLecturePlanMutation,
  useUploadNonLecturePlanMutation,
  downloadNonLecturePlanTemplate,
  exportNonLecturePlan,
  NonLecturePlanRowData,
  NonLecturePlanTopicData,
} from "@/services/NonLectureService"

type HeadKey =
  | "sl_no"
  | "competency"
  | "miller"
  | "content"
  | "outcome"
  | "bloom"
  | "priority"
  | "tl_mm"
  | "assessment"
  | "integration"

/** The heads of the Non-Lecture Lesson Plan sheet, in sheet order */
const HEADS: { key: HeadKey; label: string; width: string; options?: string[] }[] = [
  { key: "sl_no", label: "Sl. No.", width: "w-14" },
  { key: "competency", label: "Competency", width: "w-40" },
  { key: "miller", label: "Miller's Level", width: "w-28", options: ["Knows", "Knows how", "Shows", "Shows how", "Does"] },
  { key: "content", label: "Content", width: "w-56" },
  { key: "outcome", label: "SLO / Outcome", width: "w-48" },
  { key: "bloom", label: "Bloom's Domain / Guilbert's Level", width: "w-36", options: ["Cognitive", "Affective", "Psychomotor"] },
  { key: "priority", label: "Priority", width: "w-28", options: ["Must know", "Desirable", "Nice to know"] },
  { key: "tl_mm", label: "T-L Methods / Media", width: "w-40" },
  { key: "assessment", label: "Formative Assessment", width: "w-40" },
  { key: "integration", label: "Integration", width: "w-36" },
]

const emptyRow = (): NonLecturePlanRowData => ({
  sl_no: "",
  competency: "",
  miller: "",
  content: "",
  outcome: "",
  bloom: "",
  priority: "",
  tl_mm: "",
  assessment: "",
  integration: "",
  lesson_plan_number: "",
  required_hours: 1,
})

interface Props {
  templateId: number
}

interface BodyProps extends Props {
  onSaved: () => void
  onDirtyChange: (dirty: boolean) => void
}

/** The editing screen; it lives inside the full-page dialog. */
function PlanEditorBody({ templateId, onSaved, onDirtyChange }: BodyProps) {
  const { toast } = useToast()
  const { data, isLoading, isFetching } = useGetNonLecturePlanQuery({ template_id: templateId })
  const [savePlan, { isLoading: isSaving }] = useSaveNonLecturePlanMutation()
  const [uploadPlan, { isLoading: isUploading }] = useUploadNonLecturePlanMutation()
  const fileRef = useRef<HTMLInputElement>(null)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const { data: teachingStaff = [] } = useGetAllTeachingStaffQuery(
    { academic_sessions: currentAcademicSession?.id || new Date().getFullYear() },
    { skip: !currentAcademicSession }
  )

  const [topics, setTopics] = useState<NonLecturePlanTopicData[]>([])
  const [removedTopicIds, setRemovedTopicIds] = useState<number[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (data?.data && !dirty) {
      setTopics(data.data.topics.map((t) => ({ ...t, rows: t.rows.map((r) => ({ ...r })) })))
      setRemovedTopicIds([])
    }
  }, [data, dirty])

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const view = data?.data
  const edit = (fn: (draft: NonLecturePlanTopicData[]) => NonLecturePlanTopicData[]) => {
    setTopics((prev) => fn(prev))
    setDirty(true)
  }

  const setRow = (ti: number, ri: number, key: keyof NonLecturePlanRowData, value: string | number) =>
    edit((prev) =>
      prev.map((t, i) =>
        i !== ti ? t : { ...t, rows: t.rows.map((r, j) => (j !== ri ? r : { ...r, [key]: value })) }
      )
    )

  const toggleTeacher = (ti: number, staffId: number, on: boolean) =>
    edit((prev) =>
      prev.map((t, i) => {
        if (i !== ti) return t
        const current = t.assigned_staff_ids || []
        return { ...t, assigned_staff_ids: on ? [...current, staffId] : current.filter((x) => x !== staffId) }
      })
    )

  const addTopic = () =>
    edit((prev) => [...prev, { title: `Topic ${prev.length + 1}`, hours: 0, rows: [{ ...emptyRow(), sl_no: "1" }] }])

  const removeTopic = (ti: number) =>
    edit((prev) => {
      const t = prev[ti]
      if (t?.id) setRemovedTopicIds((ids) => [...ids, t.id as number])
      return prev.filter((_, i) => i !== ti)
    })

  const addRow = (ti: number) =>
    edit((prev) =>
      prev.map((t, i) =>
        i !== ti ? t : { ...t, rows: [...t.rows, { ...emptyRow(), sl_no: String(t.rows.length + 1) }] }
      )
    )

  const removeRow = (ti: number, ri: number) =>
    edit((prev) => prev.map((t, i) => (i !== ti ? t : { ...t, rows: t.rows.filter((_, j) => j !== ri) })))

  const handleSave = async () => {
    if (topics.some((t) => !t.title.trim())) {
      toast({ variant: "destructive", title: "Topic name missing", description: "Every topic needs a name." })
      return
    }
    try {
      await savePlan({
        template_id: templateId,
        topics: topics.map((t, i) => ({ ...t, topic_order: i + 1 })),
        removed_topic_ids: removedTopicIds,
      }).unwrap()
      setDirty(false)
      toast({ title: "Lesson plan saved" })
      onSaved()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not save", description: err?.data?.message || err?.message })
    }
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    if (dirty && !window.confirm("You have unsaved edits. Uploading will replace the rows of the topics in the sheet. Continue?")) {
      return
    }
    try {
      const res = await uploadPlan({ template_id: templateId, file, replace_rows: true }).unwrap()
      setDirty(false)
      toast({
        title: "Lesson plan uploaded",
        description: res.warnings?.length ? res.warnings.slice(0, 3).join(" ") : res.message,
      })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err?.data?.message || err?.message })
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Download failed", description: err?.data?.message || err?.message })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
      </div>
    )
  }

  const summary = view?.summary

  return (
    <div className="space-y-3">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3 flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">{view?.template.heading || "Non-Lecture Lesson Plan"}</CardTitle>
            <CardDescription className="text-xs">
              Build the plan with the standard heads. Teachers see these rows when they write their daily diary and tick what they covered.
            </CardDescription>
            {summary && (
              <div className="mt-2 max-w-md space-y-1">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>
                    {summary.rows_covered}/{summary.rows} rows covered • {summary.topics_completed}/{summary.topics} topics complete
                  </span>
                  <span>{summary.percent}%</span>
                </div>
                <Progress value={summary.percent} className="h-1.5" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => run(() => downloadNonLecturePlanTemplate(templateId))}>
              <Download className="h-3.5 w-3.5" /> Blank sheet
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={isUploading} onClick={() => fileRef.current?.click()}>
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={dirty} onClick={() => run(() => exportNonLecturePlan(templateId, "xlsx"))}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" disabled={dirty} onClick={() => run(() => exportNonLecturePlan(templateId, "pdf"))}>
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button size="sm" className="gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!dirty || isSaving} onClick={handleSave}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save plan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {topics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-xs text-gray-400">
            No topics yet. Add a topic, or upload the filled Excel sheet.
          </CardContent>
        </Card>
      )}

      {topics.map((topic, ti) => (
        <Card key={topic.id ?? `new-${ti}`} className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50/70 border-b flex flex-row flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-500">Topic :</span>
            <Input
              value={topic.title}
              onChange={(e) => edit((prev) => prev.map((t, i) => (i === ti ? { ...t, title: e.target.value } : t)))}
              className="h-8 text-xs font-semibold max-w-md"
            />
            {!!topic.is_completed && (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </Badge>
            )}
            <span className="text-[11px] text-gray-500">
              {topic.rows_covered ?? 0}/{topic.rows.length} rows covered
              {topic.logged_hours ? ` • ${topic.logged_hours} hrs logged` : ""}
            </span>
            <details className="relative text-xs">
              <summary className="cursor-pointer rounded-md border bg-white px-2 py-1 font-medium text-indigo-700">
                Teachers: {(topic.assigned_staff_ids || []).length ? `${(topic.assigned_staff_ids || []).length} assigned` : "all of the subject"}
              </summary>
              <div className="absolute z-20 mt-1 max-h-60 w-64 overflow-y-auto rounded-lg border bg-white p-2 shadow-lg">
                {teachingStaff.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={(topic.assigned_staff_ids || []).includes(Number(s.id))}
                      onChange={(e) => toggleTeacher(ti, Number(s.id), e.target.checked)}
                    />
                    <span>{`${s.first_name || ""} ${s.last_name || ""}`.trim()}</span>
                  </label>
                ))}
                {teachingStaff.length === 0 && <p className="text-gray-400">No teachers found.</p>}
              </div>
            </details>
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-red-500 hover:bg-red-50" onClick={() => removeTopic(ti)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {topic.rows.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No rows yet. Add a row or upload the Excel sheet.</p>
            )}
            {topic.rows.map((row, ri) => (
              <div
                key={row.id ?? `r-${ri}`}
                className={`rounded-xl border p-4 ${row.is_completed ? "border-emerald-200 bg-emerald-50/40" : "bg-white"}`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">Row {ri + 1}</span>
                  {row.is_completed ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Covered</Badge>
                  ) : (
                    <span className="text-[11px] text-gray-400">Pending</span>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      LP No.
                      <input
                        value={row.lesson_plan_number ?? ""}
                        onChange={(e) => setRow(ti, ri, "lesson_plan_number", e.target.value)}
                        className="h-8 w-16 rounded-md border px-2 text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      Hours
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={row.required_hours ?? 0}
                        onChange={(e) => setRow(ti, ri, "required_hours", Number(e.target.value))}
                        className="h-8 w-20 rounded-md border px-2 text-sm"
                      />
                    </label>
                    <button type="button" className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => removeRow(ti, ri)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {HEADS.map((h) => {
                    const long = h.key === "content" || h.key === "outcome" || h.key === "competency"
                    return (
                      <div key={h.key} className={`space-y-1 ${h.key === "content" ? "sm:col-span-2 xl:col-span-2" : ""}`}>
                        <label className="text-xs font-semibold text-gray-600">{h.label}</label>
                        {h.options ? (
                          <input
                            list={`opts-${h.key}`}
                            value={(row[h.key] as string) ?? ""}
                            onChange={(e) => setRow(ti, ri, h.key, e.target.value)}
                            className="h-10 w-full rounded-md border px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                        ) : h.key === "sl_no" ? (
                          <input
                            value={(row[h.key] as string) ?? ""}
                            onChange={(e) => setRow(ti, ri, h.key, e.target.value)}
                            className="h-10 w-full rounded-md border px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                        ) : (
                          <textarea
                            rows={long ? 4 : 3}
                            value={(row[h.key] as string) ?? ""}
                            onChange={(e) => setRow(ti, ri, h.key, e.target.value)}
                            className="w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1 text-sm text-indigo-600" onClick={() => addRow(ti)}>
              <Plus className="h-4 w-4" /> Add row
            </Button>
          </CardContent>
        </Card>
      ))}

      {HEADS.filter((h) => h.options).map((h) => (
        <datalist key={h.key} id={`opts-${h.key}`}>
          {h.options!.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addTopic}>
          <Plus className="h-3.5 w-3.5" /> Add topic
        </Button>
        {dirty && <span className="text-[11px] text-amber-600">Unsaved changes{isFetching ? " …" : ""}</span>}
      </div>
    </div>
  )
}

async function run(fn: () => Promise<void>) {
  try {
    await fn()
  } catch (err: any) {
    window.alert(err?.data?.message || err?.message || "Download failed")
  }
}

/**
 * Lesson Plan tab: a summary of the plan, and a button that opens the editor on the full page.
 * Saving the plan closes the editor.
 */
export default function NonLecturePlanEditor({ templateId }: Props) {
  const { data } = useGetNonLecturePlanQuery({ template_id: templateId })
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const view = data?.data
  const summary = view?.summary

  const requestClose = (next: boolean) => {
    if (!next && dirty && !window.confirm("You have unsaved changes. Close without saving?")) return
    setOpen(next)
    if (!next) setDirty(false)
  }

  return (
    <div className="space-y-3">
      <Card className="border-none bg-white shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">{view?.template.heading || "Non-Lecture Lesson Plan"}</CardTitle>
            <CardDescription className="text-xs">
              {summary
                ? `${summary.topics} topics • ${summary.rows} syllabus rows • ${summary.rows_covered} covered (${summary.percent}%)`
                : "No lesson plan yet."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => run(() => exportNonLecturePlan(templateId, "pdf"))}>
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => run(() => exportNonLecturePlan(templateId, "xlsx"))}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" className="gap-1 bg-indigo-600 text-xs text-white hover:bg-indigo-700" onClick={() => setOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit lesson plan
            </Button>
          </div>
        </CardHeader>
        {view && view.topics.length > 0 && (
          <CardContent className="space-y-2 pt-0">
            {view.topics.map((t, i) => (
              <div key={t.id ?? i} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-xs">
                <span className="font-semibold text-gray-900">{t.title}</span>
                <span className="text-gray-500">
                  {t.rows_covered ?? 0}/{t.rows.length} rows covered
                </span>
                {!!t.is_completed && <Badge className="bg-emerald-100 text-[10px] text-emerald-700">Completed</Badge>}
                <span className="ml-auto text-gray-400">{(t.assigned_staff_ids || []).length ? `${(t.assigned_staff_ids || []).length} teacher(s)` : "all teachers"}</span>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:rounded-none">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{view?.template.heading || "Non-Lecture Lesson Plan"}</DialogTitle>
            <DialogDescription>Edit the topics and the syllabus rows, then press Save plan. The window closes once it is saved.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
            <PlanEditorBody templateId={templateId} onSaved={() => setOpen(false)} onDirtyChange={setDirty} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
