import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import LessonPlanService, { type SyllabusStatus } from "@/services/LessonPlanService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAccademicSessionsForSchool } from "@/redux/slices/authSlice"

interface SyllabusUploadDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  subject: any
  academicSessionId: number
  onSuccess?: () => void
  /** The subject's syllabus in this session, when it already has one */
  existingSyllabus?: SyllabusStatus | null
}

export default function SyllabusUploadDialog({
  isOpen,
  onOpenChange,
  subject,
  academicSessionId,
  onSuccess,
  existingSyllabus,
}: SyllabusUploadDialogProps) {
  const { t } = useTranslation()
  // A syllabus belongs to one session: uploading replaces only that session's syllabus and progress
  const sessions = useAppSelector(selectAccademicSessionsForSchool) as any[]
  const sessionName = sessions?.find((s) => Number(s.id) === Number(academicSessionId))?.session_name || academicSessionId
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Replacing an existing syllabus resets this session's teaching progress, so it needs a tick first.
  // The server refuses a replacement without it too, and tells us what is there (serverExisting).
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [serverExisting, setServerExisting] = useState<{ topics: number; taught_hours: number; logged_lectures: number } | null>(null)
  useEffect(() => {
    if (isOpen) {
      setConfirmReplace(false)
      setServerExisting(null)
    }
  }, [isOpen, subject?.id, academicSessionId])

  const existing = serverExisting
    ? { topics: serverExisting.topics, taughtHours: serverExisting.taught_hours, loggedLectures: serverExisting.logged_lectures }
    : existingSyllabus
      ? { topics: existingSyllabus.topics, taughtHours: existingSyllabus.taught_hours, loggedLectures: null as number | null }
      : null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase()
      if (fileExt !== "xlsx" && fileExt !== "xls") {
        toast({
          variant: "destructive",
          title: t("invalid_file"),
          description: t("please_upload_an_excel_file"),
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !subject || !academicSessionId) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("subjectId", subject.id.toString())
      formData.append("subject_id", subject.id.toString())
      formData.append("academicYear", academicSessionId.toString())
      formData.append("academicSessionId", academicSessionId.toString())
      formData.append("academic_session_id", academicSessionId.toString())
      formData.append("replace_existing", confirmReplace ? "true" : "false")

      await LessonPlanService.bulkUploadSyllabus(formData)

      toast({
        title: t("success"),
        description: t("syllabus_uploaded_successfully"),
      })
      
      onOpenChange(false)
      setFile(null)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      const code = error?.response?.data?.code
      // The subject already has a syllabus here (perhaps added since this page loaded): ask first
      if (error?.response?.status === 409 && code === "SYLLABUS_EXISTS") {
        setServerExisting(error.response.data.existing || { topics: 0, taught_hours: 0, logged_lectures: 0 })
        setConfirmReplace(false)
        toast({
          variant: "destructive",
          title: "Syllabus already added",
          description: "Nothing was changed. Tick \"Replace the existing syllabus\" to replace it.",
        })
        return
      }
      // Nothing readable in the file: the existing syllabus was kept
      if (code === "SYLLABUS_FILE_EMPTY") {
        toast({ variant: "destructive", title: "Could not read the syllabus", description: error.response.data.message })
        return
      }

      console.error("Error uploading syllabus:", error)
      let errorMessage = t("failed_to_upload_syllabus")
      
      if (error.response?.data) {
        console.error("Error response data:", error.response.data)
        const data = error.response.data
        errorMessage = data.message || JSON.stringify(data)
        
        if (data.fileErrors && Array.isArray(data.fileErrors)) {
          errorMessage += " | File Errors: " + data.fileErrors.map((e: any) => e.message).join(", ")
        }
        
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += " | Errors: " + JSON.stringify(data.errors)
        }
        
        if (data.error) {
          errorMessage += " | Detail: " + data.error
        }
      }

      toast({
        variant: "destructive",
        title: t("error"),
        description: errorMessage,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            {t("upload_syllabus")}
          </DialogTitle>
          <DialogDescription>
            {t("upload_the_curriculum_excel_for")}{" "}
            <span className="font-semibold text-gray-900">
              {subject?.name} {subject?.year ? `(${subject.year})` : ""}
            </span>
            <span className="mt-2 block rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
              Session <span className="font-semibold">{sessionName}</span>: this replaces only this session's syllabus. Other
              sessions keep their own syllabus and teaching progress.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="syllabus-file">{t("select_excel_file")}</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                file ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => document.getElementById("syllabus-file")?.click()}
            >
              <Input
                id="syllabus-file"
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">{t("click_to_upload_or_drag_and_drop")}</span>
                  <span className="text-xs text-gray-500">Excel files (.xlsx, .xls)</span>
                </div>
              )}
            </div>
          </div>

          {existing && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-4 w-4 text-rose-600" /> A syllabus is already added for {sessionName}
              </p>
              <p className="mt-1">
                {existing.topics} topics
                {existing.taughtHours ? ` · ${existing.taughtHours}h already taught` : " · nothing taught yet"}
                {existing.loggedLectures ? ` · ${existing.loggedLectures} lectures logged` : ""}.
              </p>
              <p className="mt-1">
                Uploading replaces it. Taught hours reset to zero and lectures already logged no longer count towards it.
                Their written notes stay in the logs.
              </p>
              <label className="mt-2 flex cursor-pointer items-center gap-2 font-medium">
                <Checkbox checked={confirmReplace} onCheckedChange={(v) => setConfirmReplace(v === true)} />
                Replace the existing syllabus
              </label>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-md flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold mb-1">{t("excel_format_guide")}:</p>
              <ul className="list-disc ml-4 space-y-0.5">
                <li>Col A: Sr. No. (Code)</li>
                <li>Col B: Subject Area (Topic Name)</li>
                <li>Col C: Specific Competency</li>
                <li>Col D: SLO / Outcome</li>
                <li>Col E: Hours</li>
                <li>Col F: LP Number</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!file || isUploading || (!!existing && !confirmReplace)}
            className={existing ? "bg-rose-600 hover:bg-rose-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("uploading")}...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {existing ? "Replace syllabus" : t("upload_syllabus")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
