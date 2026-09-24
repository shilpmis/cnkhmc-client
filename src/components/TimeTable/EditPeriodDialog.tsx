import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  Beaker,
  Dumbbell,
  Coffee,
  Clock,
  Presentation,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { parseBackendError } from "@/lib/errorParser"
import {
  useUpdateSinglePeriodMutation,
  useDeleteSinglePeriodMutation,
} from "@/services/timetableService"
import type {
  PeriodsConfig,
  TimeTableConfigForSchool,
  SubjectDivisionMaster,
} from "@/types/subjects"
import type { StaffType } from "@/types/staff"

interface EditPeriodDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  period: PeriodsConfig | null
  timetableConfig: TimeTableConfigForSchool
  subjects: SubjectDivisionMaster[]
  staff: StaffType[]
  onSuccess?: () => void
}

export default function EditPeriodDialog({
  isOpen,
  onOpenChange,
  period,
  timetableConfig,
  subjects,
  staff,
  onSuccess,
}: EditPeriodDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [updateSinglePeriod, { isLoading: isUpdating }] =
    useUpdateSinglePeriodMutation()
  const [deleteSinglePeriod, { isLoading: isDeleting }] =
    useDeleteSinglePeriodMutation()

  const [periodType, setPeriodType] = useState<
    "regular" | "break" | "free" | "pt" | "library" | "seminar"
  >("regular")
  const [subjectId, setSubjectId] = useState<string>("none")
  const [staffId, setStaffId] = useState<string>("none")
  const [labId, setLabId] = useState<string>("none")
  const [batchName, setBatchName] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Initialize form state when period changes
  useEffect(() => {
    if (period) {
      if (period.is_break) {
        setPeriodType("break")
      } else if (period.is_library) {
        setPeriodType("library")
      } else if (period.is_seminar) {
        setPeriodType("seminar")
      } else if (period.is_pt) {
        setPeriodType("pt")
      } else if (period.is_free_period) {
        setPeriodType("free")
      } else {
        setPeriodType("regular")
      }

      setSubjectId(
        period.subjects_division_masters_id
          ? String(period.subjects_division_masters_id)
          : "none"
      )
      setStaffId(
        period.staff_enrollment_id
          ? String(period.staff_enrollment_id)
          : "none"
      )
      setLabId(period.lab_id ? String(period.lab_id) : "none")
      setBatchName(period.batch_name || "")
      setStartTime(period.start_time || "")
      setEndTime(period.end_time || "")
    }
  }, [period, isOpen])

  const handlePeriodTypeChange = (
    type: "regular" | "break" | "free" | "pt" | "library" | "seminar"
  ) => {
    setPeriodType(type)
    if (type === "break") {
      setSubjectId("none")
      setStaffId("none")
      setLabId("none")
      setBatchName("")
    } else if (type === "free" || type === "library" || type === "seminar" || type === "pt") {
      setLabId("none")
    }
  }

  const handleSave = async () => {
    if (!period?.id) return

    try {
      const payload: Partial<PeriodsConfig> = {
        start_time: startTime || period.start_time,
        end_time: endTime || period.end_time,
        is_break: periodType === "break",
        is_free_period: periodType === "free",
        is_library: periodType === "library",
        is_seminar: periodType === "seminar",
        is_pt: periodType === "pt",
        subjects_division_masters_id:
          periodType === "break" || subjectId === "none"
            ? null
            : Number(subjectId),
        staff_enrollment_id:
          periodType === "break" || staffId === "none"
            ? null
            : Number(staffId),
        lab_id:
          periodType === "break" || labId === "none"
            ? null
            : Number(labId),
        batch_name:
          periodType === "break" || !batchName.trim()
            ? null
            : batchName.trim(),
      }

      await updateSinglePeriod({
        period_id: period.id,
        payload,
      }).unwrap()

      toast({
        title: t("success") || "Success",
        description: t("period_updated_successfully") || "Period updated successfully",
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Failed to update period:", error)
      const parsed = parseBackendError(error)
      toast({
        title: t("error") || "Error",
        description: parsed.description || parsed.title || "Failed to update period",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!period?.id) return

    try {
      await deleteSinglePeriod({
        period_id: period.id,
      }).unwrap()

      toast({
        title: t("success") || "Success",
        description: t("period_deleted_successfully") || "Period deleted successfully",
      })

      setShowDeleteConfirm(false)
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Failed to delete period:", error)
      const parsed = parseBackendError(error)
      toast({
        title: t("error") || "Error",
        description: parsed.description || parsed.title || "Failed to delete period",
        variant: "destructive",
      })
    }
  }

  const formatTimeDisplay = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  if (!period) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t("edit_period") || "Edit Period"} #{period.period_order}
              </DialogTitle>
            </div>
            <DialogDescription>
              {startTime && endTime ? (
                <span className="text-xs text-muted-foreground font-medium">
                  {formatTimeDisplay(startTime)} - {formatTimeDisplay(endTime)}
                </span>
              ) : (
                t("modify_period_details") || "Modify subject, teacher, lab or type for this period slot."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Period Type Buttons */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                {t("period_type") || "Period Type"}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={periodType === "regular" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => handlePeriodTypeChange("regular")}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {t("regular") || "Regular"}
                </Button>
                <Button
                  type="button"
                  variant={periodType === "break" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => handlePeriodTypeChange("break")}
                >
                  <Coffee className="h-3.5 w-3.5" />
                  {t("break") || "Break / Recess"}
                </Button>
                <Button
                  type="button"
                  variant={periodType === "free" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => handlePeriodTypeChange("free")}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {t("free") || "Free Period"}
                </Button>
                <Button
                  type="button"
                  variant={periodType === "library" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => handlePeriodTypeChange("library")}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {t("library") || "Library"}
                </Button>
                <Button
                  type="button"
                  variant={periodType === "seminar" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => handlePeriodTypeChange("seminar")}
                >
                  <Presentation className="h-3.5 w-3.5" />
                  {t("seminar") || "Seminar"}
                </Button>
                <Button
                  type="button"
                  variant={periodType === "pt" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => handlePeriodTypeChange("pt")}
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  {t("pt") || "PT / Sports"}
                </Button>
              </div>
            </div>

            {/* Time Configuration (Optional editing) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs text-muted-foreground">{t("start_time") || "Start Time"}</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t("end_time") || "End Time"}</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* Dynamic fields when not a break */}
            {periodType !== "break" && (
              <div className="space-y-3 pt-2 border-t">
                {/* Subject Selection */}
                {periodType !== "free" && periodType !== "library" && periodType !== "seminar" && (
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("subject") || "Subject"}
                    </Label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={t("select_subject") || "Select Subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">{t("no_subject") || "None (No Subject)"}</span>
                        </SelectItem>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={String(sub.id)}>
                            {sub.subject?.name || t("unknown_subject")}{" "}
                            {sub.code_for_division ? `(${sub.code_for_division})` : sub.subject?.code ? `(${sub.subject.code})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Teacher Selection */}
                {periodType !== "free" && periodType !== "library" && periodType !== "seminar" && (
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("teacher") || "Teacher"}
                    </Label>
                    <Select value={staffId} onValueChange={setStaffId}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={t("select_teacher") || "Select Teacher"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">{t("no_teacher") || "None (No Teacher)"}</span>
                        </SelectItem>
                        {staff.map((s) => {
                          const fullName = `${s.first_name || ""} ${s.middle_name || ""} ${s.last_name || ""}`.trim()
                          return (
                            <SelectItem key={s.id} value={String(s.staff_enrollment_id)}>
                              {fullName || `Staff #${s.id}`}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Lab Selection (if enabled) */}
                {timetableConfig?.lab_enabled && (
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
                      <Beaker className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("lab_facility") || "Lab / Clinical Facility (Optional)"}
                    </Label>
                    <Select value={labId} onValueChange={setLabId}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={t("select_lab") || "Select Lab (Optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">{t("no_lab") || "None (No Lab)"}</span>
                        </SelectItem>
                        {timetableConfig.lab_config?.map((lab) => (
                          <SelectItem key={lab.id} value={String(lab.id)}>
                            {lab.name} {lab.max_capacity ? `(Cap: ${lab.max_capacity})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Batch Name (for practical / split classes) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-medium">
                      {t("batch_name_optional") || "Practical Batch (Optional)"}
                    </Label>
                    <div className="flex gap-1">
                      {["Batch A", "Batch B", "Batch C", "Batch D"].map((b) => (
                        <Badge
                          key={b}
                          variant="outline"
                          className="cursor-pointer text-[10px] px-1.5 py-0 hover:bg-primary/10 transition-colors"
                          onClick={() => setBatchName(b)}
                        >
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Input
                    placeholder="e.g. Batch A, Clinical Group 1"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting || isUpdating}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {t("delete_period") || "Delete Period"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting || isUpdating}
              >
                {t("cancel") || "Cancel"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating || isDeleting}
                className="gap-1.5"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("saving") || "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t("save_changes") || "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t("delete_period") || "Delete Period"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_period_confirm_message") ||
                `Are you sure you want to delete Period #${period.period_order}? This period will be removed from the timetable.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  {t("deleting") || "Deleting..."}
                </>
              ) : (
                t("confirm_delete") || "Delete Period"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
