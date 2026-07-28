"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, Loader2, Download, AlertCircle } from "lucide-react"
import { useUploadStaffExperienceMutation } from "@/services/StaffService"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ExperienceUploadModalProps {
  onClose?: () => void
}

export default function ExperienceUploadModal({ onClose }: ExperienceUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadExperience, { isLoading }] = useUploadStaffExperienceMutation()
  const [unmatchedStaff, setUnmatchedStaff] = useState<string[]>([])
  const [processedCount, setProcessedCount] = useState<number | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      // Basic validation for excel files
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx, .xls) or .csv",
        })
        setFile(null)
        e.target.value = ''
        return
      }
      setFile(selectedFile)
      setUnmatchedStaff([])
      setProcessedCount(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload first.",
      })
      return
    }

    try {
      const response = await uploadExperience({ file }).unwrap()
      setProcessedCount(response.processed_count)
      setUnmatchedStaff(response.unmatched_staff || [])
      
      toast({
        title: "Upload Successful",
        description: `Processed ${response.processed_count} staff sheets.`,
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "An error occurred while uploading the file.",
      })
    }
  }

  const handleDownloadErrorReport = () => {
    if (unmatchedStaff.length === 0) return

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Unmatched Staff Name (Sheet Name)\n"
      + unmatchedStaff.map(name => `"${name}"`).join("\n");

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "unmatched_staff_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="experience-file">Excel File</Label>
          <Input id="experience-file" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
        </div>
        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file.name}</span>
          </div>
        )}
      </div>

      {processedCount !== null && (
        <Alert variant={unmatchedStaff.length > 0 ? "destructive" : "default"}>
          {unmatchedStaff.length > 0 ? <AlertCircle className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
          <AlertTitle>Upload Results</AlertTitle>
          <AlertDescription>
            Successfully processed {processedCount} staff members. 
            {unmatchedStaff.length > 0 && ` Could not match ${unmatchedStaff.length} staff names.`}
          </AlertDescription>
        </Alert>
      )}

      {unmatchedStaff.length > 0 && (
        <Button variant="outline" onClick={handleDownloadErrorReport} className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <Download className="h-4 w-4" />
          Download Error Report (CSV)
        </Button>
      )}

      <div className="flex justify-end gap-3 pt-4">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
        )}
        <Button onClick={handleUpload} disabled={!file || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Experiences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
