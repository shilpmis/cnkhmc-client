import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  History,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  FileText,
} from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import {
  useGetTimetableVersionsQuery,
  useSaveTimetableVersionMutation,
  useRestoreTimetableVersionMutation,
  useDeleteTimetableVersionMutation,
} from "@/services/timetableService"
import { format } from "date-fns"

interface TimetableHistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  divisionId: number
  academicSessionId: number
  onRestored?: () => void
  currentPeriods?: any[]
}

export default function TimetableHistoryDialog({
  isOpen,
  onOpenChange,
  divisionId,
  academicSessionId,
  onRestored,
  currentPeriods,
}: TimetableHistoryDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const { data: versions = [], isLoading, refetch } = useGetTimetableVersionsQuery(
    { division_id: divisionId, academic_session_id: academicSessionId },
    { skip: !isOpen || !divisionId || !academicSessionId }
  )

  const [saveVersion, { isLoading: isSaving }] = useSaveTimetableVersionMutation()
  const [restoreVersion, { isLoading: isRestoring }] = useRestoreTimetableVersionMutation()
  const [deleteVersion, { isLoading: isDeleting }] = useDeleteTimetableVersionMutation()

  const [isCreating, setIsCreating] = useState(false)
  const [versionName, setVersionName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [selectedVersionToRestore, setSelectedVersionToRestore] = useState<any>(null)
  const [selectedVersionToDelete, setSelectedVersionToDelete] = useState<any>(null)
  const [previewVersion, setPreviewVersion] = useState<any>(null)

  const handleSaveNewVersion = async () => {
    if (!divisionId || !academicSessionId) return

    try {
      await saveVersion({
        payload: {
          division_id: divisionId,
          academic_session_id: academicSessionId,
          version_name: versionName.trim() || undefined,
          start_date: startDate || null,
          end_date: endDate || null,
          periods_config: currentPeriods && currentPeriods.length > 0 ? currentPeriods : undefined,
        },
      }).unwrap()

      toast({
        title: t("success") || "Success",
        description: t("timetable_version_saved_successfully") || "Timetable version snapshot saved to history",
      })

      setIsCreating(false)
      setVersionName("")
      setStartDate("")
      setEndDate("")
      refetch()
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error?.data?.message || "Failed to save timetable version",
        variant: "destructive",
      })
    }
  }

  const handleConfirmRestore = async () => {
    if (!selectedVersionToRestore) return

    try {
      await restoreVersion({ version_id: selectedVersionToRestore.id }).unwrap()

      toast({
        title: t("success") || "Success",
        description: t("timetable_restored_successfully") || `Restored version "${selectedVersionToRestore.version_name || 'Timetable'}"`,
      })

      setSelectedVersionToRestore(null)
      onOpenChange(false)
      if (onRestored) onRestored()
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error?.data?.message || "Failed to restore timetable version",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedVersionToDelete) return

    try {
      await deleteVersion({ version_id: selectedVersionToDelete.id }).unwrap()

      toast({
        title: t("success") || "Success",
        description: t("timetable_version_deleted") || "Version deleted from history",
      })

      setSelectedVersionToDelete(null)
      refetch()
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error?.data?.message || "Failed to delete version",
        variant: "destructive",
      })
    }
  }

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      return format(new Date(dateStr), "MMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {t("timetable_history_versions") || "Timetable History & Validity"}
                  </DialogTitle>
                  <DialogDescription>
                    {t("timetable_history_description") || "Manage saved timetable versions, validity durations, and restore past schedules."}
                  </DialogDescription>
                </div>
              </div>

              {!isCreating && (
                <Button
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="gap-1.5 h-8"
                >
                  <Plus className="h-4 w-4" />
                  {t("save_current_version") || "Save Snapshot"}
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Create Snapshot Form */}
            {isCreating && (
              <Card className="border-primary/30 bg-primary/5 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("save_new_timetable_version") || "Save Timetable Snapshot & Duration"}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground"
                      onClick={() => setIsCreating(false)}
                    >
                      {t("cancel") || "Cancel"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">{t("version_name") || "Version Label / Title"}</Label>
                    <Input
                      placeholder="e.g. Odd Semester 2026, Post-Midterm Revision"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {t("effective_from") || "Effective Start Date"}
                      </Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {t("effective_to") || "Effective End Date"}
                      </Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setIsCreating(false)}
                    >
                      {t("cancel") || "Cancel"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={handleSaveNewVersion}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t("saving") || "Saving..."}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("save_to_history") || "Save to History"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Versions List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm">{t("loading_versions") || "Loading timetable history..."}</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-12 text-center border rounded-lg border-dashed bg-muted/20">
                <History className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
                <h4 className="text-sm font-semibold">{t("no_versions_saved") || "No Timetable History Found"}</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  {t("no_versions_desc") || "Save snapshots of the timetable along with validity date ranges to track modifications and revert when needed."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("create_first_snapshot") || "Create First Snapshot"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver: any) => {
                  const hasDuration = !!(ver.start_date || ver.end_date)
                  const startDisplay = formatDateDisplay(ver.start_date)
                  const endDisplay = formatDateDisplay(ver.end_date)

                  return (
                    <Card
                      key={ver.id}
                      className={`transition-all hover:border-primary/40 ${
                        ver.is_active ? "border-emerald-300 bg-emerald-50/20" : "bg-card"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">
                                {ver.version_name || `Version #${ver.id}`}
                              </span>
                              {ver.is_active ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0">
                                  {t("active_timetable") || "Active"}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                  {t("archived") || "Archived"}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                • {ver.total_periods || (Array.isArray(ver.version_data) ? ver.version_data.length : 0)} {t("periods") || "periods"}
                              </span>
                            </div>

                            {/* Duration badge */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-0.5">
                              {hasDuration ? (
                                <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  <Calendar className="h-3 w-3 text-primary" />
                                  {startDisplay || "Start"} → {endDisplay || "Ongoing"}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  {t("no_duration_set") || "No date range specified"}
                                </span>
                              )}

                              <span className="text-[11px] text-muted-foreground">
                                Saved: {formatDateDisplay(ver.created_at) || "Recently"}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary"
                              onClick={() => setPreviewVersion(ver)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {t("view") || "View"}
                            </Button>

                            <Button
                              variant={ver.is_active ? "outline" : "default"}
                              size="sm"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => setSelectedVersionToRestore(ver)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {t("restore") || "Restore"}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setSelectedVersionToDelete(ver)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t("close") || "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={!!selectedVersionToRestore}
        onOpenChange={(open) => !open && setSelectedVersionToRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              <RotateCcw className="h-5 w-5" />
              {t("restore_timetable_version") || "Restore Timetable Version"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("restore_version_confirm_desc") ||
                `Are you sure you want to restore "${selectedVersionToRestore?.version_name || 'this version'}"? This will replace the current active timetable with the snapshot from this version.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmRestore()
              }}
              disabled={isRestoring}
              className="gap-1.5"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("restoring") || "Restoring..."}
                </>
              ) : (
                t("confirm_restore") || "Yes, Restore Version"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!selectedVersionToDelete}
        onOpenChange={(open) => !open && setSelectedVersionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t("delete_version_history") || "Delete Version from History"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_version_confirm_desc") ||
                `Are you sure you want to delete "${selectedVersionToDelete?.version_name || 'this version'}" from history? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("deleting") || "Deleting..."}
                </>
              ) : (
                t("delete") || "Delete Version"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Snapshot Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={(open) => !open && setPreviewVersion(null)}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewVersion?.version_name || "Timetable Snapshot"}
            </DialogTitle>
            <DialogDescription>
              {previewVersion?.start_date || previewVersion?.end_date ? (
                <span>
                  Valid: {formatDateDisplay(previewVersion?.start_date) || "Start"} to{" "}
                  {formatDateDisplay(previewVersion?.end_date) || "End"}
                </span>
              ) : (
                "Snapshot details"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("periods_in_snapshot") || "Periods in Snapshot"} (
              {Array.isArray(previewVersion?.version_data) ? previewVersion?.version_data.length : 0})
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-1.5 border rounded-md p-3 bg-muted/10">
              {Array.isArray(previewVersion?.version_data) && previewVersion.version_data.length > 0 ? (
                previewVersion.version_data.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded bg-background border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Order #{p.period_order}
                      </Badge>
                      <span className="font-medium">
                        {p.is_break
                          ? "Break"
                          : p.is_free_period
                          ? "Free Period"
                          : p.is_library
                          ? "Library"
                          : p.is_seminar
                          ? "Seminar"
                          : p.period_config_subject?.subject?.name || p.subject_name || "Subject Period"}
                      </span>
                      {p.batch_name && (
                        <Badge variant="secondary" className="text-[10px]">
                          {p.batch_name}
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground text-[11px]">
                      {p.start_time} - {p.end_time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {t("no_period_data") || "No period data in this snapshot"}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewVersion(null)}>
              {t("close") || "Close"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedVersionToRestore(previewVersion)
                setPreviewVersion(null)
              }}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("restore_this_version") || "Restore This Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
