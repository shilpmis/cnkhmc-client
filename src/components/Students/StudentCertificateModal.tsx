"use client"

import React, { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Settings2, History, Cloud, Loader2, FileText, CheckCircle2, ChevronDown, Sparkles, GraduationCap } from "lucide-react"
import ApiService from "@/services/ApiService"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"

interface StudentCertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: number | null
  student?: any | null
}

interface CertificateAuditLog {
  id: number
  student_id: number
  certificate_type: string
  reference_no: string | null
  certificate_date: string | null
  file_name: string
  file_url: string
  file_type: string
  generation_number: number
  generated_by: number | null
  created_at: string
  user?: {
    id: number
    name: string
    email: string
  }
}

interface CustomTemplate {
  id: number
  name: string
  code: string | null
  type: string
  target_type?: string
  description: string | null
  content: string
}

export default function StudentCertificateModal({
  open,
  onOpenChange,
  studentId,
  student,
}: StudentCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [fetchedStudent, setFetchedStudent] = useState<any>(null)
  const [isLoadingStudent, setIsLoadingStudent] = useState<boolean>(false)

  const activeStudent = student || fetchedStudent

  // Certificate selection & templates
  const [availableTemplates, setAvailableTemplates] = useState<CustomTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("STUDENT_BONAFIDE")

  // Interactive configurations
  const currentYear = new Date().getFullYear()
  const [refNumber, setRefNumber] = useState<string>("")
  const [refYear, setRefYear] = useState<string>(String(currentYear))
  const [certDate, setCertDate] = useState<string>("")
  const [examPassed, setExamPassed] = useState<string>("")
  const [purpose, setPurpose] = useState<string>("")
  const [customClass, setCustomClass] = useState<string>("")
  const [customSession, setCustomSession] = useState<string>("")
  const [includeLetterhead, setIncludeLetterhead] = useState<boolean>(true)
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false)

  // Audit and cloud storage states
  const [auditLogs, setAuditLogs] = useState<CertificateAuditLog[]>([])
  const [totalGenerations, setTotalGenerations] = useState<number>(0)
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Fetch full student info if not passed directly
  const fetchStudentDetails = async () => {
    if (!studentId) return
    try {
      setIsLoadingStudent(true)
      const res = await ApiService.get(`student/${studentId}`)
      if (res?.data?.success && res.data.data) {
        setFetchedStudent(res.data.data)
      }
    } catch (err) {
      console.error("Failed to load student details:", err)
    } finally {
      setIsLoadingStudent(false)
    }
  }

  // Fetch student certificate templates
  const fetchTemplates = async () => {
    try {
      const res = await ApiService.get("certificate-templates?target_type=student")
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAvailableTemplates(res.data.data)
        if (res.data.data.length > 0 && selectedTemplateId === "STUDENT_BONAFIDE") {
          const first = res.data.data[0]
          setSelectedTemplateId(first.code || first.type || String(first.id))
        }
      }
    } catch (err) {
      console.error("Failed to load student templates:", err)
    }
  }

  const fetchAuditLogs = async () => {
    if (!studentId) return
    try {
      setIsLoadingLogs(true)
      const currentCode = selectedTemplateId
      const res = await ApiService.get(
        `students/${studentId}/certificates/audit-logs?certificate_type=${currentCode}`
      )
      if (res?.data?.success) {
        setAuditLogs(res.data.logs || [])
        setTotalGenerations(res.data.total_count || 0)
      }
    } catch (err) {
      console.error("Failed to load certificate audit logs:", err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (open) {
      if (!student && studentId) {
        fetchStudentDetails()
      }
      fetchTemplates()
      setRefNumber("")
      setRefYear(String(currentYear))
      setCertDate("")
      setExamPassed("")
      setPurpose("For Official / Scholarship Verification")
      setShowAuditHistory(false)
    }
  }, [open, studentId, student])

  useEffect(() => {
    if (open && studentId) {
      fetchAuditLogs()
    }
  }, [selectedTemplateId, studentId, open])

  // Resolve Student Attributes
  const fullName = activeStudent
    ? `${activeStudent.first_name || ""} ${activeStudent.middle_name ? activeStudent.middle_name + " " : ""}${activeStudent.last_name || ""}`.replace(/\s+/g, " ").trim()
    : "Student Name"

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "-"
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const grNo = activeStudent?.gr_no ? String(activeStudent.gr_no) : "-"
  const enrollmentNo = activeStudent?.enrollment_code || activeStudent?.admission_number || "-"
  const rollNo =
    activeStudent?.fourth_year_roll_number ||
    activeStudent?.third_year_roll_number ||
    activeStudent?.second_year_roll_number ||
    activeStudent?.first_year_roll_number ||
    activeStudent?.roll_number ||
    "-"
  const dob = activeStudent?.birth_date ? formatDate(activeStudent.birth_date) : "-"
  const gender = activeStudent?.gender || "Male"
  const fatherName = activeStudent?.father_name || "-"
  const motherName = activeStudent?.mother_name || "-"
  const admissionDate = activeStudent?.admission_date ? formatDate(activeStudent.admission_date) : `01/09/${currentYear - 2}`

  // Class / Year determination
  let studentClass = customClass
  if (!studentClass) {
    if (activeStudent?.enrollment?.division?.class?.class) {
      studentClass = activeStudent.enrollment.division.class.class
    } else if (activeStudent?.class_name) {
      studentClass = activeStudent.class_name
    } else if (activeStudent?.fourth_year_roll_number) {
      studentClass = "4th BHMS"
    } else if (activeStudent?.third_year_roll_number) {
      studentClass = "3rd BHMS"
    } else if (activeStudent?.second_year_roll_number) {
      studentClass = "2nd BHMS"
    } else {
      studentClass = "1st BHMS"
    }
  }

  const academicSession =
    customSession ||
    activeStudent?.enrollment?.academic_year ||
    `${currentYear - 1}-${currentYear}`

  // Pronouns
  const isFemale = gender.toLowerCase() === "female"
  const heShe = isFemale ? "She" : "He"
  const himHer = isFemale ? "her" : "him"
  const hisHer = isFemale ? "her" : "his"

  const formattedRefNumber = refNumber
    ? `${refNumber}/C.N.K.H.M.C.&R.C./Vyara/${refYear || currentYear}`
    : "____________ / C.N.K.H.M.C. & R.C. / Vyara / 20____"
  const formattedCertDate = certDate || "_____ / _____ / 20____"

  const principalSignatureHtml = `
    <table style="width: 100%; border: none; margin-top: 50pt;">
      <tr>
        <td style="border: none; width: 60%;"></td>
        <td style="border: none; width: 40%; text-align: center;">
          <p style="font-size: 12pt; font-weight: bold; margin: 0;">Principal</p>
          <p style="font-size: 11pt; margin: 2pt 0 0 0;">C. N. K. H. M. C. &amp; R. C., Vyara</p>
        </td>
      </tr>
    </table>
  `

  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/college-logo.jpeg` : "/college-logo.jpeg"

  const headerHtml = includeLetterhead
    ? `
      <table style="width: 100%; border: none; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 25px;">
        <tr>
          <td style="border: none; width: 75px; vertical-align: middle; text-align: left;">
            <img src="${logoUrl}" width="65" height="65" alt="Logo" style="width: 65px; height: 65px; object-fit: contain;" />
          </td>
          <td style="border: none; vertical-align: middle; text-align: center; padding-right: 75px;">
            <h1 style="font-size: 15pt; font-weight: bold; color: #1e3a8a; margin: 0 0 4px 0; line-height: 1.2;">
              C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br/>&amp; RESEARCH CENTRE
            </h1>
            <h2 style="font-size: 10.5pt; font-weight: normal; margin: 0 0 3px 0; color: #333;">(Managed by: Vyara Pradesh Seva Samiti)</h2>
            <p style="font-size: 9pt; margin: 0; color: #555;">Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117</p>
          </td>
        </tr>
      </table>`
    : `<div style="height: 40pt;"></div>`

  // Template lookup
  const activeCustomTemplate = availableTemplates.find(
    (t) => (t.code || t.type || String(t.id)) === selectedTemplateId
  )

  const getResolvedCertificateBody = () => {
    if (activeCustomTemplate && activeCustomTemplate.content) {
      let content = activeCustomTemplate.content
      const replacements: Record<string, string> = {
        "{{student_name}}": fullName,
        "{{full_name}}": fullName,
        "{{gr_no}}": grNo,
        "{{sid}}": grNo,
        "{{enrollment_no}}": enrollmentNo,
        "{{enrollment_code}}": enrollmentNo,
        "{{roll_no}}": rollNo,
        "{{class}}": studentClass,
        "{{programme}}": "BHMS",
        "{{academic_year}}": academicSession,
        "{{dob}}": dob,
        "{{birth_date}}": dob,
        "{{gender}}": gender,
        "{{father_name}}": fatherName,
        "{{mother_name}}": motherName,
        "{{admission_date}}": admissionDate,
        "{{completion_date}}": `31/03/${currentYear + 2}`,
        "{{exam_passed}}": examPassed || `${studentClass} Examination`,
        "{{purpose}}": purpose || "Official Verification",
        "{{ref_no}}": formattedRefNumber,
        "{{cert_date}}": formattedCertDate,
        "{{he_she}}": heShe,
        "{{him_her}}": himHer,
        "{{his_her}}": hisHer,
        "{{principal_signature}}": principalSignatureHtml,
      }

      Object.entries(replacements).forEach(([tag, val]) => {
        content = content.split(tag).join(val)
      })
      return content
    }

    // Default Fallback: Bonafide Certificate
    return `
      <p style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;">
        <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">BONAFIDE CERTIFICATE</span>
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 16pt;">
        This is to certify that <strong>${fullName}</strong> (GR No: <strong>${grNo}</strong>, Enrollment No: <strong>${enrollmentNo}</strong>) is a bonafide student of this College studying in <strong>${studentClass}</strong> during the Academic Session <strong>${academicSession}</strong>.
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 16pt;">
        According to College records, ${hisHer} Date of Birth is <strong>${dob}</strong>.
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 16pt;">
        To the best of my knowledge and belief, ${heShe} bears good moral character and exemplary conduct.
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 16pt;">
        <strong>Purpose / Remarks:</strong> ${purpose || "Official Verification"}
      </p>

      ${principalSignatureHtml}
    `
  }

  const certificateTypeTitle = activeCustomTemplate?.name || "Bonafide Certificate"
  const certificateTypeCode = activeCustomTemplate?.code || activeCustomTemplate?.type || "STUDENT_BONAFIDE"

  /**
   * Sends certificate to backend for cloud upload to DigitalOcean Spaces & logs audit entry
   */
  const saveToCloudAndRecordAudit = async (
    fileContent: string,
    fileType: "doc" | "pdf" | "html",
    customFileName: string
  ) => {
    if (!studentId) return null
    try {
      const payload = {
        certificate_type: certificateTypeCode,
        reference_no: refNumber ? `${refNumber}/C.N.K.H.M.C.&R.C./Vyara/${refYear || currentYear}` : null,
        certificate_date: certDate || null,
        file_content: fileContent,
        file_type: fileType,
        file_name: customFileName,
        metadata: {
          templateName: certificateTypeTitle,
          examPassed,
          purpose,
          studentClass,
          academicSession,
          includeLetterhead,
        },
      }

      const res = await ApiService.post(`students/${studentId}/certificates/generate`, payload)
      if (res?.data?.success) {
        const data = res.data.data
        setTotalGenerations(data.total_generated || totalGenerations + 1)
        if (data.log) {
          setAuditLogs((prev) => [data.log, ...prev])
        }
        return data
      }
    } catch (err: any) {
      console.error("Failed to archive certificate to cloud storage:", err)
      toast({
        title: "Warning: Cloud Sync",
        description: "Certificate generated locally, but cloud audit sync failed.",
        variant: "destructive",
      })
    }
    return null
  }

  const handlePrint = async () => {
    setIsSaving(true)
    const bodyContent = getResolvedCertificateBody()

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${certificateTypeTitle} - ${fullName}</title>
          <style>
            @media print {
              @page { 
                size: A4 portrait; 
                margin: ${includeLetterhead ? "20mm 20mm 20mm 20mm" : "40mm 20mm 20mm 20mm"}; 
              }
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
            }
            body {
              font-family: "Times New Roman", Times, serif;
              color: #000;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              font-size: 15px;
            }
            .letterhead-header {
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 30px;
            }
            .letterhead-header .flex-wrapper {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .letterhead-header img {
              width: 65px;
              height: 65px;
              object-fit: contain;
            }
            .letterhead-header .header-text {
              flex: 1;
              text-align: center;
              padding-right: 50px;
            }
            .letterhead-header h1 {
              font-size: 17px;
              font-weight: bold;
              color: #1e3a8a;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              line-height: 1.3;
            }
            .letterhead-header h2 {
              font-size: 13px;
              font-weight: normal;
              margin: 0 0 4px 0;
              color: #333;
            }
            .letterhead-header p {
              font-size: 11px;
              margin: 0;
              color: #555;
            }
            .ref-date-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: normal;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          ${includeLetterhead ? `
            <div class="letterhead-header">
              <div class="flex-wrapper">
                <img src="${logoUrl}" alt="Logo" />
                <div class="header-text">
                  <h1>C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br/>&amp; RESEARCH CENTRE</h1>
                  <h2>(Managed by: Vyara Pradesh Seva Samiti)</h2>
                  <p>Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117</p>
                </div>
              </div>
            </div>` : `<div style="height: 40px;"></div>`}
          
          <div class="ref-date-row">
            <span>Ref. No. ${formattedRefNumber}</span>
            <span>Date: ${formattedCertDate}</span>
          </div>

          ${bodyContent}

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `

    // Upload & log audit record
    const result = await saveToCloudAndRecordAudit(
      printHtml,
      "html",
      `${certificateTypeTitle.replace(/\s+/g, "_")}_${fullName.replace(/\s+/g, "_")}.html`
    )

    setIsSaving(false)

    if (result) {
      toast({
        title: "Certificate Generated",
        description: `Archived to DigitalOcean Spaces (Version #${result.generation_number})`,
      })
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(printHtml)
    printWindow.document.close()
  }

  const handleDownloadWord = async () => {
    setIsSaving(true)
    const bodyContent = getResolvedCertificateBody()

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${certificateTypeTitle} - ${fullName}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 595.3pt 841.9pt;
              margin: 72pt 72pt 72pt 72pt;
              mso-header-margin: 36pt;
              mso-footer-margin: 36pt;
              mso-paper-source: 0;
            }
            div.Section1 { page: Section1; }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
            }
            p { margin: 0 0 14pt 0; text-align: justify; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="Section1">
            ${headerHtml}
            <table style="width: 100%; border: none; margin-bottom: 25pt;">
              <tr>
                <td style="border: none; text-align: left; font-size: 11pt;">Ref. No. ${formattedRefNumber}</td>
                <td style="border: none; text-align: right; font-size: 11pt;">Date: ${formattedCertDate}</td>
              </tr>
            </table>

            ${bodyContent}
          </div>
        </body>
      </html>
    `

    const fileName = `${certificateTypeTitle.replace(/\s+/g, "_")}_${fullName.replace(/\s+/g, "_")}.doc`

    // Upload & log audit record
    await saveToCloudAndRecordAudit(docContent, "doc", fileName)

    setIsSaving(false)

    const blob = new Blob(["\ufeff", docContent], { type: "application/msword;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Word Document Downloaded",
      description: "Certificate saved and cloud audit record updated.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-4 md:px-6 md:py-3 border-b border-slate-200 bg-white flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                Student Certificate Generator
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-normal">
                  {studentClass} • GR: {grNo}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium">{fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuditHistory(!showAuditHistory)}
              className="gap-1.5 text-xs text-slate-600 h-8"
            >
              <History className="h-3.5 w-3.5" />
              Audit Log ({totalGenerations})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className={`gap-1.5 text-xs h-8 ${showConfig ? "bg-slate-100 text-blue-700 border-blue-300" : "text-slate-600"}`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configure Fields
            </Button>
            <Button
              onClick={handleDownloadWord}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
            >
              <Download className="h-3.5 w-3.5" />
              Word (.doc)
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isSaving}
              size="sm"
              className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white h-8"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Certificate Type Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Certificate Type:</span>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="h-8 text-xs bg-white w-full sm:w-72 font-medium">
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.code || t.type || String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-[11px] text-slate-500">
            {activeCustomTemplate?.description || "Official certificate for college students"}
          </span>
        </div>

        {/* Audit History Drawer */}
        {showAuditHistory && (
          <div className="bg-slate-50 border-b border-emerald-200 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-slate-800">
                  Cloud Storage &amp; Audit History ({totalGenerations} total)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                All generated certificates are archived in DigitalOcean Spaces
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="py-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Loading audit history...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No certificate generation records found for this student yet.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 text-center w-12">#</th>
                      <th className="p-2">Date &amp; Time</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Ref No</th>
                      <th className="p-2">Format</th>
                      <th className="p-2">Generated By</th>
                      <th className="p-2 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => {
                      const dateStr = new Date(log.created_at).toLocaleString()
                      return (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-bold text-emerald-700">
                            v{log.generation_number}
                          </td>
                          <td className="p-2 text-slate-700">{dateStr}</td>
                          <td className="p-2 text-slate-800 font-medium">
                            {log.certificate_type.replace(/_/g, " ")}
                          </td>
                          <td className="p-2 text-slate-600 font-mono text-[11px]">
                            {log.reference_no || "-"}
                          </td>
                          <td className="p-2">
                            <Badge variant="secondary" className="uppercase text-[10px] px-1.5 py-0">
                              {log.file_type}
                            </Badge>
                          </td>
                          <td className="p-2 text-slate-600">
                            {log.user?.name || "System Admin"}
                          </td>
                          <td className="p-2 text-center">
                            {log.file_url ? (
                              <a
                                href={log.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:underline font-semibold"
                              >
                                Re-Download
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Configuration Drawer */}
        {showConfig && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">
                Configure Reference Numbers &amp; Certificate Overrides
              </h3>
              <div className="flex items-center gap-2">
                <Switch
                  id="student-letterhead-toggle"
                  checked={includeLetterhead}
                  onCheckedChange={setIncludeLetterhead}
                />
                <Label htmlFor="student-letterhead-toggle" className="text-xs cursor-pointer font-medium">
                  Include College Letterhead &amp; Logo
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-medium">Ref No. Prefix</Label>
                <Input
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. CNKHMC/2026/089"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-medium">Ref Year</Label>
                <Input
                  value={refYear}
                  onChange={(e) => setRefYear(e.target.value)}
                  placeholder={String(currentYear)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-medium">Issue Date</Label>
                <Input
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-medium">Exam Passed</Label>
                <Input
                  value={examPassed}
                  onChange={(e) => setExamPassed(e.target.value)}
                  placeholder="e.g. 1st yr BHMS Aug.2024"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-medium">Purpose / Remarks</Label>
                <Input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. For Scholarship Purpose"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live A4 Sheet Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200/70 p-4 md:p-8 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[780px] bg-white border border-slate-300 shadow-md p-8 md:p-12 min-h-[900px] flex flex-col justify-between font-serif text-[13.5px] leading-relaxed text-slate-900"
          >
            <div>
              {/* Header Letterhead */}
              {includeLetterhead && (
                <div className="border-b-2 border-blue-900 pb-3 mb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={logoUrl}
                      alt="College Logo"
                      className="w-16 h-16 object-contain shrink-0"
                    />
                    <div className="flex-1 text-center pr-12">
                      <h1 className="text-[17px] font-bold text-blue-900 uppercase leading-snug tracking-wide">
                        C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br />&amp; RESEARCH CENTRE
                      </h1>
                      <h2 className="text-[12px] text-slate-800 font-normal mt-0.5">
                        (Managed by: Vyara Pradesh Seva Samiti)
                      </h2>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference No & Date Line */}
              <div className="flex justify-between text-[13px] mb-8 font-serif">
                <span>Ref. No. {formattedRefNumber}</span>
                <span>Date: {formattedCertDate}</span>
              </div>

              {/* Dynamic Body Content */}
              <div
                className="space-y-4"
                dangerouslySetInnerHTML={{ __html: getResolvedCertificateBody() }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
