import React, { useState } from "react"
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
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import LessonPlanService from "@/services/LessonPlanService"

interface SyllabusUploadDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  subject: any
  academicSessionId: number
  onSuccess?: () => void
}

export default function SyllabusUploadDialog({
  isOpen,
  onOpenChange,
  subject,
  academicSessionId,
  onSuccess,
}: SyllabusUploadDialogProps) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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
      formData.append("academicSessionId", academicSessionId.toString())

      await LessonPlanService.bulkUploadSyllabus(formData)

      toast({
        title: t("success"),
        description: t("syllabus_uploaded_successfully"),
      })
      
      onOpenChange(false)
      setFile(null)
      if (onSuccess) onSuccess()
    } catch (error: any) {
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
            disabled={!file || isUploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("uploading")}...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("upload_syllabus")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
