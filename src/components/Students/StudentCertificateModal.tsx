"use client"

import React, { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Printer,
  Download,
  Settings2,
  History,
  Cloud,
  Loader2,
  FileText,
  GraduationCap,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  FileCheck,
  Award,
} from "lucide-react"
import ApiService from "@/services/ApiService"
import { toast } from "@/hooks/use-toast"

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

const PURPOSE_PRESETS = [
  "For Official / Scholarship Verification",
  "For Higher Studies / Admission Purpose",
  "For Bank Education Loan Verification",
  "For Passport / Visa Verification",
  "For Hostel / Accommodation Purpose",
  "For Bus / Train Concession Pass",
  "To Whomsoever It May Concern",
]

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
  const [purpose, setPurpose] = useState<string>("For Official / Scholarship Verification")
  const [customClass, setCustomClass] = useState<string>("")
  const [customSession, setCustomSession] = useState<string>("")
  const [includeLetterhead, setIncludeLetterhead] = useState<boolean>(true)
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false)
  const [zoomLevel, setZoomLevel] = useState<number>(100)

  // Audit and cloud storage states
  const [auditLogs, setAuditLogs] = useState<CertificateAuditLog[]>([])
  const [totalGenerations, setTotalGenerations] = useState<number>(0)
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Set today's date formatted as DD/MM/YYYY
  const getTodayFormatted = () => {
    const d = new Date()
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

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
      if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setAvailableTemplates(res.data.data)
        if (selectedTemplateId === "STUDENT_BONAFIDE") {
          const first = res.data.data[0]
          setSelectedTemplateId(first.code || first.type || String(first.id))
        }
      } else {
        // Built-in presets
        setAvailableTemplates([
          {
            id: 1,
            name: "Bonafide Certificate",
            code: "STUDENT_BONAFIDE",
            type: "STUDENT_BONAFIDE",
            description: "Standard Bonafide Certificate certifying student enrolment, class, DOB, and conduct.",
            content: "",
          },
          {
            id: 2,
            name: "Character & Conduct Certificate",
            code: "STUDENT_CHARACTER",
            type: "STUDENT_CHARACTER",
            description: "Certifies the good moral character and exemplary conduct of the student.",
            content: `
              <div style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;">
                <span style="font-size: 13.5pt; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">
                  CHARACTER &amp; CONDUCT CERTIFICATE
                </span>
              </div>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a; text-indent: 30pt;">
                This is to certify that <strong>{{student_name}}</strong> (GR No: <strong>{{gr_no}}</strong>, Enrollment No: <strong>{{enrollment_no}}</strong>) is / was a bonafide student of this College studying in <strong>{{class}}</strong> during the Academic Session <strong>{{academic_year}}</strong>.
              </p>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
                During {{his_her}} period of study at this institution, {{his_her}} conduct and moral character have been found to be <strong>Exemplary and Commendable</strong>. {{he_she}} has actively participated in academic and institutional activities.
              </p>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
                According to College records, {{his_her}} Date of Birth is <strong>{{dob}}</strong>.
              </p>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
                I wish {{him_her}} all success and the very best in all {{his_her}} future endeavors.
              </p>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
                <strong>Purpose / Remarks:</strong> {{purpose}}
              </p>

              {{principal_signature}}
            `,
          },
          {
            id: 3,
            name: "Course Study & Completion Certificate",
            code: "STUDENT_COMPLETION",
            type: "STUDENT_COMPLETION",
            description: "Certifies completion or enrollment status in the BHMS degree programme.",
            content: `
              <div style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;">
                <span style="font-size: 13.5pt; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">
                  COURSE STUDY CERTIFICATE
                </span>
              </div>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a; text-indent: 30pt;">
                This is to certify that <strong>{{student_name}}</strong>, son/daughter of <strong>{{father_name}}</strong>, bearing GR No: <strong>{{gr_no}}</strong> and Enrollment No: <strong>{{enrollment_no}}</strong>, is enrolled in the Bachelor of Homoeopathic Medicine and Surgery (BHMS) programme at this College from <strong>{{admission_date}}</strong>.
              </p>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
                {{he_she}} is currently undergoing the regular curriculum of <strong>{{class}}</strong> for the academic session <strong>{{academic_year}}</strong>.
              </p>

              <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
                This certificate is issued on {{his_her}} request for: <strong>{{purpose}}</strong>.
              </p>

              {{principal_signature}}
            `,
          },
        ])
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
      setCertDate(getTodayFormatted())
      setExamPassed("")
      setPurpose("For Official / Scholarship Verification")
      setShowAuditHistory(false)
      setShowConfig(false)
    }
  }, [open, studentId, student])

  useEffect(() => {
    if (open && studentId) {
      fetchAuditLogs()
    }
  }, [selectedTemplateId, studentId, open])

  // Resolve Student Attributes
  const fullName = activeStudent
    ? `${activeStudent.first_name || ""} ${activeStudent.middle_name ? activeStudent.middle_name + " " : ""}${activeStudent.last_name || ""}`
        .replace(/\s+/g, " ")
        .trim()
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
    <table style="width: 100%; border: none; margin-top: 50pt; page-break-inside: avoid;">
      <tr>
        <td style="border: none; width: 45%; vertical-align: bottom; padding-left: 10px;">
          <div style="display: inline-block; border: 1px dashed #94a3b8; border-radius: 50%; width: 72px; height: 72px; line-height: 72px; text-align: center; font-size: 8.5pt; color: #94a3b8; text-transform: uppercase; font-family: sans-serif; letter-spacing: 0.5px;">
            College Seal
          </div>
        </td>
        <td style="border: none; width: 55%; text-align: center; vertical-align: bottom;">
          <p style="font-size: 13pt; font-weight: bold; margin: 0 0 2pt 0; color: #0f172a; font-family: 'Times New Roman', serif;">Principal</p>
          <p style="font-size: 10.5pt; margin: 0; color: #334155; font-family: 'Times New Roman', serif;">C. N. K. H. M. C. &amp; R. C., Vyara</p>
        </td>
      </tr>
    </table>
  `

  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/college-logo.jpeg` : "/college-logo.jpeg"

  const headerHtml = includeLetterhead
    ? `
      <table style="width: 100%; border: none; border-bottom: 2.5px double #1e3a8a; padding-bottom: 14px; margin-bottom: 26px;">
        <tr>
          <td style="border: none; width: 85px; vertical-align: middle; text-align: left;">
            <img src="${logoUrl}" width="75" height="75" alt="College Logo" style="width: 75px; height: 75px; object-fit: contain; display: block;" />
          </td>
          <td style="border: none; vertical-align: middle; text-align: center; padding-right: 40px;">
            <h1 style="font-size: 16pt; font-weight: bold; color: #1e3a8a; margin: 0 0 4px 0; line-height: 1.25; font-family: 'Times New Roman', serif; text-transform: uppercase; letter-spacing: 0.5px;">
              C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br/>&amp; RESEARCH CENTRE
            </h1>
            <h2 style="font-size: 10.5pt; font-weight: normal; margin: 0 0 4px 0; color: #334155; font-family: 'Times New Roman', serif;">(Managed by: Vyara Pradesh Seva Samiti)</h2>
            <p style="font-size: 9pt; margin: 0; color: #64748b; font-family: 'Times New Roman', serif; letter-spacing: 0.2px;">
              Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
            </p>
          </td>
        </tr>
      </table>`
    : `<div style="height: 45pt;"></div>`

  // Template lookup
  const activeCustomTemplate = availableTemplates.find(
    (t) => (t.code || t.type || String(t.id)) === selectedTemplateId
  )

  const getResolvedCertificateBody = () => {
    if (activeCustomTemplate && activeCustomTemplate.content && activeCustomTemplate.content.trim().length > 0) {
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

    // Default Fallback: Refined Bonafide Certificate
    return `
      <div style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;">
        <span style="font-size: 13.5pt; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">
          BONAFIDE CERTIFICATE
        </span>
      </div>

      <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a; text-indent: 30pt;">
        This is to certify that <strong>${fullName}</strong> (GR No: <strong>${grNo}</strong>, Enrollment No: <strong>${enrollmentNo}</strong>) is a bonafide student of this College studying in <strong>${studentClass}</strong> during the Academic Session <strong>${academicSession}</strong>.
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
        According to College records, ${hisHer} Date of Birth is <strong>${dob}</strong>.
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
        To the best of my knowledge and belief, ${heShe} bears good moral character and exemplary conduct.
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 2.1; margin-bottom: 16pt; color: #0f172a;">
        <strong>Purpose / Remarks:</strong> ${purpose || "For Official / Scholarship Verification"}
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
          <meta charset="utf-8" />
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
              font-family: "Times New Roman", Times, Georgia, serif;
              color: #0f172a;
              line-height: 1.8;
              padding: 24px;
              max-width: 820px;
              margin: 0 auto;
              font-size: 15px;
            }
            .letterhead-header {
              border-bottom: 2.5px double #1e3a8a;
              padding-bottom: 14px;
              margin-bottom: 30px;
            }
            .letterhead-header .flex-wrapper {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .letterhead-header img {
              width: 75px;
              height: 75px;
              object-fit: contain;
            }
            .letterhead-header .header-text {
              flex: 1;
              text-align: center;
              padding-right: 40px;
            }
            .letterhead-header h1 {
              font-size: 17.5px;
              font-weight: bold;
              color: #1e3a8a;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              line-height: 1.25;
              letter-spacing: 0.5px;
            }
            .letterhead-header h2 {
              font-size: 13px;
              font-weight: normal;
              margin: 0 0 4px 0;
              color: #334155;
            }
            .letterhead-header p {
              font-size: 11px;
              margin: 0;
              color: #64748b;
              letter-spacing: 0.2px;
            }
            .ref-date-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: normal;
              margin-bottom: 30px;
              color: #1e293b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          ${
            includeLetterhead
              ? `
            <div class="letterhead-header">
              <div class="flex-wrapper">
                <img src="${logoUrl}" alt="College Logo" />
                <div class="header-text">
                  <h1>C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br/>&amp; RESEARCH CENTRE</h1>
                  <h2>(Managed by: Vyara Pradesh Seva Samiti)</h2>
                  <p>Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117</p>
                </div>
              </div>
            </div>`
              : `<div style="height: 45px;"></div>`
          }
          
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
              line-height: 1.8;
              color: #000000;
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
                <td style="border: none; text-align: left; font-size: 11pt; color: #000;">Ref. No. ${formattedRefNumber}</td>
                <td style="border: none; text-align: right; font-size: 11pt; color: #000;">Date: ${formattedCertDate}</td>
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

  const handleResetDefaults = () => {
    setRefNumber("")
    setRefYear(String(currentYear))
    setCertDate(getTodayFormatted())
    setExamPassed("")
    setPurpose("For Official / Scholarship Verification")
    setCustomClass("")
    setCustomSession("")
    setIncludeLetterhead(true)
    toast({
      title: "Reset to Standard Defaults",
      description: "Certificate parameters restored to student profile values.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[94vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl border-slate-200">
        {/* Modal Header */}
        <DialogHeader className="p-3.5 sm:px-6 sm:py-3.5 border-b border-slate-200 bg-white/95 backdrop-blur flex flex-row items-center justify-between shrink-0 gap-4 pr-14">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-700/20 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                  Student Certificate Generator
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="bg-emerald-50/80 text-emerald-800 border-emerald-300/80 text-xs px-2.5 py-0.5 font-medium shadow-none"
                >
                  {studentClass} • GR: {grNo}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">{fullName}</span>
                {enrollmentNo && enrollmentNo !== "-" && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Enr: {enrollmentNo}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAuditHistory(!showAuditHistory)
                if (showConfig) setShowConfig(false)
              }}
              className={`gap-1.5 text-xs h-9 px-3 font-medium transition-all ${
                showAuditHistory
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm"
                  : "text-slate-700 hover:bg-slate-100/80 border-slate-200"
              }`}
            >
              <History className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:inline">Audit Log</span>
              <Badge
                variant="secondary"
                className={`ml-0.5 text-[10px] px-1.5 py-0 h-4 font-semibold ${
                  totalGenerations > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {totalGenerations}
              </Badge>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowConfig(!showConfig)
                if (showAuditHistory) setShowAuditHistory(false)
              }}
              className={`gap-1.5 text-xs h-9 px-3 font-medium transition-all ${
                showConfig
                  ? "bg-blue-50 text-blue-800 border-blue-300 shadow-sm"
                  : "text-slate-700 hover:bg-slate-100/80 border-slate-200"
              }`}
            >
              <Settings2 className={`h-3.5 w-3.5 ${showConfig ? "text-blue-600" : "text-slate-500"}`} />
              <span className="hidden md:inline">Configure</span> Fields
            </Button>

            <Button
              onClick={handleDownloadWord}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 px-3 font-medium text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Word</span> (.doc)
            </Button>

            <Button
              onClick={handlePrint}
              disabled={isSaving}
              size="sm"
              className="gap-1.5 text-xs h-9 px-4 font-semibold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm shadow-emerald-700/25 transition-all"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Certificate Type Selector & Quick Controls Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/90 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Certificate Type:</span>
            </div>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="h-8 text-xs bg-white w-56 sm:w-72 font-medium border-slate-300 shadow-sm focus:ring-emerald-500">
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.code || t.type || String(t.id)} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden lg:flex items-center gap-1.5 text-[11.5px] text-slate-500 pl-2 border-l border-slate-200">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span className="truncate max-w-md">
                {activeCustomTemplate?.description || "Official institutional certificate for student verification."}
              </span>
            </div>
          </div>

          {/* Quick letterhead & zoom controls */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <Switch
                id="quick-letterhead-toggle"
                checked={includeLetterhead}
                onCheckedChange={setIncludeLetterhead}
                className="scale-75 data-[state=checked]:bg-emerald-600"
              />
              <Label
                htmlFor="quick-letterhead-toggle"
                className="text-[11.5px] cursor-pointer font-medium text-slate-600 select-none whitespace-nowrap"
              >
                Letterhead
              </Label>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="h-6 w-6 text-slate-500 hover:text-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-semibold text-slate-600 px-1 select-none min-w-[32px] text-center">
                {zoomLevel}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="h-6 w-6 text-slate-500 hover:text-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Audit History Drawer */}
        {showAuditHistory && (
          <div className="bg-slate-50/95 border-b border-emerald-200 p-4 sm:p-5 space-y-3 shrink-0 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-800">
                    DigitalOcean Spaces Archive &amp; Audit Log
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {totalGenerations} generation record{totalGenerations !== 1 ? "s" : ""} on file for this student
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAuditHistory(false)}
                className="text-xs h-7 text-slate-500 hover:text-slate-800"
              >
                Close Log
              </Button>
            </div>

            {isLoadingLogs ? (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Retrieving cloud audit records...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-white rounded-lg border border-dashed border-slate-200">
                <FileCheck className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-medium text-slate-700">No certificate generation records found yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When you print or export Word documents, automated audit records and cloud backups will appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b sticky top-0">
                    <tr>
                      <th className="p-2.5 text-center w-14">Version</th>
                      <th className="p-2.5">Date &amp; Time</th>
                      <th className="p-2.5">Certificate Type</th>
                      <th className="p-2.5">Ref No</th>
                      <th className="p-2.5 text-center">Format</th>
                      <th className="p-2.5">Generated By</th>
                      <th className="p-2.5 text-center w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => {
                      const dateStr = new Date(log.created_at).toLocaleString()
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 text-center font-bold text-emerald-700">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 text-[11px]">
                              v{log.generation_number}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700 whitespace-nowrap">{dateStr}</td>
                          <td className="p-2.5 text-slate-900 font-medium">
                            {log.certificate_type.replace(/_/g, " ")}
                          </td>
                          <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                            {log.reference_no || "-"}
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge
                              variant="secondary"
                              className="uppercase text-[10px] px-1.5 py-0 font-semibold bg-slate-100 text-slate-700"
                            >
                              {log.file_type}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {log.user?.name || "Administrator"}
                          </td>
                          <td className="p-2.5 text-center">
                            {log.file_url ? (
                              <a
                                href={log.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline font-semibold text-xs"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Download
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
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
          <div className="bg-slate-50/95 border-b border-blue-200 p-4 sm:p-5 space-y-4 shrink-0 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 text-blue-800">
                  <Settings2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-800">
                    Certificate Parameters &amp; Customization
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modify issue reference numbers, dates, academic session overrides, or remarks.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDefaults}
                  className="text-xs h-7 text-slate-600 hover:text-slate-900 gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Defaults
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfig(false)}
                  className="text-xs h-7 text-slate-500 hover:text-slate-800"
                >
                  Done
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Ref Number Prefix */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-700 font-semibold flex items-center gap-1">
                  Ref No. Prefix
                </Label>
                <Input
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. CNKHMC/2026/089"
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Ref Year */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-700 font-semibold">Ref Year</Label>
                <Input
                  value={refYear}
                  onChange={(e) => setRefYear(e.target.value)}
                  placeholder={String(currentYear)}
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Issue Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-slate-700 font-semibold">Issue Date</Label>
                  <button
                    type="button"
                    onClick={() => setCertDate(getTodayFormatted())}
                    className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Today
                  </button>
                </div>
                <Input
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Exam Passed */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-700 font-semibold">Exam Passed / Term</Label>
                <Input
                  value={examPassed}
                  onChange={(e) => setExamPassed(e.target.value)}
                  placeholder="e.g. 1st yr BHMS Aug.2024"
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Custom Class */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-700 font-semibold">Class Override</Label>
                <Input
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  placeholder={studentClass || "1st BHMS"}
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Academic Session */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-700 font-semibold">Academic Session</Label>
                <Input
                  value={customSession}
                  onChange={(e) => setCustomSession(e.target.value)}
                  placeholder={academicSession}
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Purpose Input */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[11px] text-slate-700 font-semibold">Purpose / Remarks</Label>
                <Input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. For Official / Scholarship Verification"
                  className="h-8 text-xs bg-white border-slate-300 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Purpose Suggestion Chips */}
            <div className="pt-1">
              <Label className="text-[10.5px] text-slate-500 font-medium block mb-1.5">
                Quick Purpose Presets:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PURPOSE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPurpose(preset)}
                    className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      purpose === preset
                        ? "bg-blue-100 text-blue-800 border-blue-300 font-semibold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live A4 Sheet Preview Canvas Workspace */}
        <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-8 flex justify-center items-start min-h-[500px]">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-[800px]"
          >
            {/* Realistic A4 Paper Canvas */}
            <div
              ref={printRef}
              className="bg-white border border-slate-300/80 rounded-[2px] shadow-[0_4px_25px_rgba(0,0,0,0.09)] p-8 sm:p-14 min-h-[960px] flex flex-col justify-between font-serif text-[14px] leading-relaxed text-slate-900 select-text"
            >
              <div>
                {/* Header Letterhead */}
                {includeLetterhead ? (
                  <div className="border-b-[2.5px] border-double border-blue-900 pb-3.5 mb-7">
                    <div className="flex items-center gap-5">
                      <img
                        src={logoUrl}
                        alt="College Logo"
                        className="w-[72px] h-[72px] object-contain shrink-0"
                      />
                      <div className="flex-1 text-center pr-10">
                        <h1 className="text-[17px] font-bold text-blue-900 uppercase leading-snug tracking-wide font-serif">
                          C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br />&amp; RESEARCH CENTRE
                        </h1>
                        <h2 className="text-[12px] text-slate-800 font-normal mt-0.5 font-serif">
                          (Managed by: Vyara Pradesh Seva Samiti)
                        </h2>
                        <p className="text-[10px] text-slate-600 mt-0.5 font-serif tracking-tight">
                          Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-14"></div>
                )}

                {/* Reference No & Date Line */}
                <div className="flex justify-between text-[13.5px] mb-8 font-serif text-slate-900">
                  <span className="font-serif">
                    <strong className="font-semibold">Ref. No.</strong> {formattedRefNumber}
                  </span>
                  <span className="font-serif">
                    <strong className="font-semibold">Date:</strong> {formattedCertDate}
                  </span>
                </div>

                {/* Dynamic Certificate Body Content */}
                <div
                  className="space-y-4 text-[14px]"
                  dangerouslySetInnerHTML={{ __html: getResolvedCertificateBody() }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
