"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  Sparkles,
  Loader2,
  BookOpen,
  Layers,
  X,
  ScrollText,
  Users,
  GraduationCap,
  Award,
  Check,
} from "lucide-react"
import ApiService from "@/services/ApiService"
import { toast } from "@/hooks/use-toast"

export interface CertificateTemplate {
  id: number
  name: string
  code: string | null
  type: string
  target_type?: string
  targetType?: string
  description: string | null
  content: string
  is_active: boolean
  isActive?: boolean
  created_at: string
  updated_at: string
}

const STAFF_MERGE_TAGS = [
  { tag: "{{full_name}}", label: "Staff Full Name", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { tag: "{{prefix}}", label: "Prefix (Dr./Mr./Mrs.)", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{designation}}", label: "Designation", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { tag: "{{department}}", label: "Department", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { tag: "{{joining_date}}", label: "Joining Date", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { tag: "{{last_date}}", label: "Last Date", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { tag: "{{from_date}}", label: "Period From Date", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{to_date}}", label: "Period To Date", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{financial_year}}", label: "Financial Year", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { tag: "{{he_she}}", label: "He / She", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{him_her}}", label: "him / her", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{his_her}}", label: "his / her", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
]

const STUDENT_MERGE_TAGS = [
  { tag: "{{student_name}}", label: "Student Full Name", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { tag: "{{gr_no}}", label: "GR Number / SID", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { tag: "{{enrollment_no}}", label: "Enrollment Code", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { tag: "{{roll_no}}", label: "Roll Number", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { tag: "{{class}}", label: "Class / Year (BHMS)", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { tag: "{{academic_year}}", label: "Academic Session", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { tag: "{{dob}}", label: "Date of Birth", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{gender}}", label: "Gender", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{father_name}}", label: "Father's Name", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { tag: "{{mother_name}}", label: "Mother's Name", color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
  { tag: "{{admission_date}}", label: "Admission Date", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { tag: "{{completion_date}}", label: "Completion Date", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { tag: "{{exam_passed}}", label: "Exam Passed", color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
  { tag: "{{purpose}}", label: "Purpose / Remarks", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{ref_no}}", label: "Reference Number", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{cert_date}}", label: "Issue Date", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{he_she}}", label: "He / She", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{him_her}}", label: "him / her", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{his_her}}", label: "his / her", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
]

export type CertificateTableType = "none" | "experience" | "salary_with_arrears" | "salary_summary" | "salary_detailed"

const STAFF_PRESETS: Record<string, { title: string; body: string; tableType: CertificateTableType }> = {
  SALARY_WITH_ARREARS: {
    title: "Salary Certificate (With Arrears & TDS)",
    body: `This is to certify that salary paid to {{prefix}} {{full_name}} for the period from {{from_date}} to {{to_date}} as follows:

This certificate is issued upon {{his_her}} personal request for official verification purposes.`,
    tableType: "salary_with_arrears",
  },
  SALARY_DETAILED: {
    title: "Detailed Salary Certificate",
    body: `This is to certify that salary and allowance details paid to {{prefix}} {{full_name}} for the period from {{from_date}} to {{to_date}} are as follows:

This certificate is issued upon {{his_her}} personal request for official verification purposes.`,
    tableType: "salary_detailed",
  },
  SALARY_SUMMARY: {
    title: "Salary Certificate (Simplified)",
    body: `This is to certify that salary paid to {{prefix}} {{full_name}} for the period from {{from_date}} to {{to_date}} as follows:

This certificate is issued upon {{his_her}} personal request for official verification purposes.`,
    tableType: "salary_summary",
  },
  EXPERIENCE: {
    title: "Experience Certificate",
    body: `This is to certify that {{prefix}} {{full_name}} is an employee of this Organization and duties performed by {{him_her}} during the period(s) are as under:

{{he_she}} is found to be sincere and honest. {{he_she}} bears a good moral character and has good public behavior.`,
    tableType: "experience",
  },
  RELIEVING: {
    title: "Relieving Order & Experience Letter",
    body: `This is to certify that {{prefix}} {{full_name}} was working with our institution as {{designation}} in the department of {{department}} from {{joining_date}} to {{last_date}}.

{{he_she}} has been relieved from all {{his_her}} duties and responsibilities at the closing of office hours on {{last_date}} upon {{his_her}} resignation. 

During {{his_her}} tenure with us, we found {{him_her}} to be diligent, sincere, and hardworking. We wish {{him_her}} all success in {{his_her}} future endeavors.`,
    tableType: "none",
  },
  NOC: {
    title: "No Objection Certificate (NOC)",
    body: `This is to certify that {{prefix}} {{full_name}} is a permanent employee of this Institution holding the post of {{designation}} in the Department of {{department}} since {{joining_date}}.

This Institution has NO OBJECTION to {{him_her}} applying for external academic pursuits / higher studies / competitive examinations or personal passport / visa processing.

{{he_she}} bears good moral character and conduct.`,
    tableType: "none",
  },
  CHARACTER: {
    title: "Character & Conduct Certificate",
    body: `This is to certify that {{prefix}} {{full_name}} is known to me in {{his_her}} capacity as {{designation}} in the Department of {{department}} at this Institution since {{joining_date}}.

To the best of my knowledge and belief, {{he_she}} bears an excellent moral character, exemplary professional conduct, and high integrity.

{{he_she}} is dedicated and sincere towards the duties assigned to {{him_her}}.`,
    tableType: "none",
  },
}

const STUDENT_PRESETS: Record<string, { title: string; body: string; tableType: CertificateTableType }> = {
  STUDENT_BONAFIDE: {
    title: "Bonafide Certificate",
    body: `This is to certify that {{student_name}} (GR No: {{gr_no}}, Enrollment No: {{enrollment_no}}) is a bonafide student of this College studying in {{class}} during the Academic Session {{academic_year}}.

According to College records, {{his_her}} Date of Birth is {{dob}}.

To the best of my knowledge and belief, {{he_she}} bears good moral character and exemplary conduct.

Purpose / Remarks: {{purpose}}`,
    tableType: "none",
  },
  STUDENT_CHARACTER: {
    title: "Character & Conduct Certificate",
    body: `This is to certify that {{student_name}}, Son/Daughter of {{father_name}}, is/was a bonafide student of this Institution admitted in {{class}} (BHMS).

During {{his_her}} tenure at this College, {{he_she}} has maintained exemplary discipline, sincere dedication towards academic pursuits, and high moral character.

We wish {{him_her}} all success in {{his_her}} future academic and professional endeavors.`,
    tableType: "none",
  },
  STUDENT_ATTEMPT: {
    title: "Attempt / Passing Certificate",
    body: `This is to certify that {{student_name}} (GR No: {{gr_no}}, Enrollment No: {{enrollment_no}}) has appeared and passed the {{exam_passed}} examination conducted by the University / College in {{academic_year}}.

As per official examination records of this Institution, {{he_she}} passed the said examination in First Attempt.

Purpose / Remarks: {{purpose}}`,
    tableType: "none",
  },
  STUDENT_MEDIUM: {
    title: "Medium of Instruction Certificate",
    body: `This is to certify that {{student_name}} (GR No: {{gr_no}}, Enrollment No: {{enrollment_no}}) is/was a bonafide student of {{class}} at C.N. Kothari Homoeopathic Medical College & Research Centre.

It is hereby certified that the medium of instruction and examination for the Bachelor of Homoeopathic Medicine and Surgery (B.H.M.S.) course at this Institution is English.

This certificate is issued upon {{his_her}} request for higher education / official verification.`,
    tableType: "none",
  },
  STUDENT_COMPLETION: {
    title: "Course Completion Certificate",
    body: `This is to certify that {{student_name}} (Enrollment No: {{enrollment_no}}, GR No: {{gr_no}}) was enrolled in the Bachelor of Homoeopathic Medicine and Surgery (B.H.M.S.) degree programme at this Institution from {{admission_date}} to {{completion_date}}.

{{he_she}} has satisfactorily completed all prescribed academic, clinical, and practical requirements of the curriculum.`,
    tableType: "none",
  },
  STUDENT_FEE_STRUCTURE: {
    title: "Tuition Fee & Expenditure Certificate",
    body: `This is to certify that {{student_name}} (GR No: {{gr_no}}, Enrollment No: {{enrollment_no}}) is studying in {{class}} (BHMS) for the Academic Session {{academic_year}}.

The estimated fee structure approved by the Fee Regulatory Committee (Medical) for the said academic year is as follows:

1. Tuition Fee (Annual): Rs. 95,000.00
2. Library & Laboratory Fee: Rs. 5,000.00
3. University Examination & Enrollment Fee: Rs. 3,500.00
Total Annual Estimated Expenses: Rs. 1,03,500.00

This certificate is issued for obtaining Bank Education Loan / Government Scholarship.`,
    tableType: "none",
  },
}

export default function CertificateTemplateSettings() {
  const [activeTab, setActiveTab] = useState<"staff" | "student">("staff")
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Form states
  const [targetType, setTargetType] = useState<"staff" | "student">("staff")
  const [certTitle, setCertTitle] = useState<string>("")
  const [certBody, setCertBody] = useState<string>("")
  const [tableType, setTableType] = useState<CertificateTableType>("none")
  const [includeSignature, setIncludeSignature] = useState<boolean>(true)
  const [isActive, setIsActive] = useState<boolean>(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const res = await ApiService.get("certificate-templates?include_inactive=true")
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setTemplates(res.data.data)
      }
    } catch (err: any) {
      console.error("Failed to fetch certificate templates:", err)
      toast({
        title: "Error",
        description: "Failed to load certificate templates.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const staffTemplates = useMemo(
    () => templates.filter((t) => (t.target_type || t.targetType || "staff") === "staff"),
    [templates]
  )

  const studentTemplates = useMemo(
    () => templates.filter((t) => (t.target_type || t.targetType) === "student"),
    [templates]
  )

  const handleOpenCreate = (target: "staff" | "student" = activeTab) => {
    setEditingTemplate(null)
    setTargetType(target)
    if (target === "staff") {
      setCertTitle("Salary Certificate (With Arrears & TDS)")
      setCertBody(STAFF_PRESETS.SALARY_WITH_ARREARS.body)
      setTableType("salary_with_arrears")
    } else {
      setCertTitle("Bonafide Certificate")
      setCertBody(STUDENT_PRESETS.STUDENT_BONAFIDE.body)
      setTableType("none")
    }
    setIncludeSignature(true)
    setIsActive(true)
    setDialogOpen(true)
  }

  const handleOpenEdit = (t: CertificateTemplate) => {
    setEditingTemplate(t)
    const tTarget = (t.target_type || t.targetType || "staff") as "staff" | "student"
    setTargetType(tTarget)
    setCertTitle(t.name || "")
    setIsActive(t.is_active !== undefined ? t.is_active : t.isActive !== undefined ? t.isActive : true)

    let rawContent = t.content || ""
    if (rawContent.includes("{{salary_table_with_arrears}}")) {
      setTableType("salary_with_arrears")
    } else if (rawContent.includes("{{salary_table_detailed}}")) {
      setTableType("salary_detailed")
    } else if (rawContent.includes("{{salary_table_summary}}")) {
      setTableType("salary_summary")
    } else if (rawContent.includes("{{experience_table}}")) {
      setTableType("experience")
    } else {
      setTableType("none")
    }

    const hasSig = rawContent.includes("{{principal_signature}}")
    setIncludeSignature(hasSig)

    let plainText = rawContent
      .replace(/\{\{experience_table\}\}/g, "")
      .replace(/\{\{salary_table_with_arrears\}\}/g, "")
      .replace(/\{\{salary_table_summary\}\}/g, "")
      .replace(/\{\{salary_table_detailed\}\}/g, "")
      .replace(/\{\{principal_signature\}\}/g, "")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim()

    // If plain text starts with title, remove duplicate title
    if (t.name && plainText.toLowerCase().startsWith(t.name.toLowerCase())) {
      plainText = plainText.substring(t.name.length).trim()
    }

    setCertBody(plainText)
    setDialogOpen(true)
  }

  const handleLoadPreset = (presetKey: string) => {
    const presets = targetType === "staff" ? STAFF_PRESETS : STUDENT_PRESETS
    const preset = presets[presetKey]
    if (!preset) return
    setCertTitle(preset.title)
    setCertBody(preset.body)
    setTableType(preset.tableType)
  }

  const insertMergeTag = (tag: string) => {
    if (!textareaRef.current) {
      setCertBody((prev) => prev + " " + tag)
      return
    }
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const text = certBody
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    setCertBody(before + tag + after)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + tag.length, start + tag.length)
      }
    }, 50)
  }

  // Generates preview HTML with realistic dummy data
  const getLivePreviewHtml = () => {
    const paragraphs = certBody
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)

    let bodyHtml = paragraphs
      .map(
        (p) =>
          `<p style="text-align: justify; font-size: 13px; line-height: 1.8; margin-bottom: 16px; color: #1e293b;">${p.replace(
            /\n/g,
            "<br/>"
          )}</p>`
      )
      .join("")

    const sampleReplacements: Record<string, string> =
      targetType === "staff"
        ? {
            "{{prefix}}": "Dr.",
            "{{full_name}}": "<strong style='color:#0f172a;'>Sandeep Kishorbhai Solanki</strong>",
            "{{first_name}}": "Sandeep",
            "{{last_name}}": "Solanki",
            "{{designation}}": "<strong style='color:#0f172a;'>Associate Professor</strong>",
            "{{department}}": "<strong style='color:#0f172a;'>Organon of Medicine</strong>",
            "{{joining_date}}": "<strong style='color:#0f172a;'>01/06/2018</strong>",
            "{{last_date}}": "<strong style='color:#0f172a;'>Till date</strong>",
            "{{resignation_date}}": "<strong style='color:#0f172a;'>Till date</strong>",
            "{{from_date}}": "<strong style='color:#0f172a;'>01-04-2025</strong>",
            "{{to_date}}": "<strong style='color:#0f172a;'>31-03-2026</strong>",
            "{{financial_year}}": "<strong style='color:#0f172a;'>2025-2026</strong>",
            "{{he_she}}": "He",
            "{{him_her}}": "him",
            "{{his_her}}": "his",
          }
        : {
            "{{student_name}}": "<strong style='color:#0f172a;'>Patel Dhruv Rajeshbhai</strong>",
            "{{full_name}}": "<strong style='color:#0f172a;'>Patel Dhruv Rajeshbhai</strong>",
            "{{gr_no}}": "<strong style='color:#0f172a;'>2023041</strong>",
            "{{sid}}": "<strong style='color:#0f172a;'>2023041</strong>",
            "{{enrollment_no}}": "<strong style='color:#0f172a;'>BHMS20230041</strong>",
            "{{enrollment_code}}": "<strong style='color:#0f172a;'>BHMS20230041</strong>",
            "{{roll_no}}": "<strong style='color:#0f172a;'>41</strong>",
            "{{class}}": "<strong style='color:#0f172a;'>2nd BHMS</strong>",
            "{{programme}}": "<strong style='color:#0f172a;'>BHMS</strong>",
            "{{academic_year}}": "<strong style='color:#0f172a;'>2025-2026</strong>",
            "{{dob}}": "<strong style='color:#0f172a;'>15/08/2004</strong>",
            "{{birth_date}}": "<strong style='color:#0f172a;'>15/08/2004</strong>",
            "{{gender}}": "Male",
            "{{father_name}}": "<strong style='color:#0f172a;'>Rajeshbhai Patel</strong>",
            "{{mother_name}}": "<strong style='color:#0f172a;'>Gitaben Patel</strong>",
            "{{admission_date}}": "<strong style='color:#0f172a;'>01/09/2023</strong>",
            "{{completion_date}}": "<strong style='color:#0f172a;'>31/03/2028</strong>",
            "{{exam_passed}}": "<strong style='color:#0f172a;'>1st BHMS University Exam</strong>",
            "{{purpose}}": "<strong style='color:#0f172a;'>For MYSY Scholarship Application</strong>",
            "{{ref_no}}": "CNKHMC/CERT/2026/089",
            "{{cert_date}}": "22/09/2026",
            "{{he_she}}": "He",
            "{{him_her}}": "him",
            "{{his_her}}": "his",
          }

    Object.entries(sampleReplacements).forEach(([tag, val]) => {
      bodyHtml = bodyHtml.split(tag).join(val)
    })

    const sampleExperienceTableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 11px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">Name of post held</th>
            <th style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">From dd/mm/yy</th>
            <th style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">To dd/mm/yy</th>
            <th style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">Department</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">Associate Professor</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">01/06/2018</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">Till date</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">Organon of Medicine</td>
          </tr>
        </tbody>
      </table>
    `

    const sampleSalaryWithArrearsTableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Month - Year</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Consolidated Gross</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Arrears</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Total Gross</th>
            <th colspan="5" style="border: 1px solid #000; padding: 4px; text-align: center;">Deduction</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center;">Net Salary</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 8.5px;">
            <th style="border: 1px solid #000; padding: 3px;">Prof. Tax</th>
            <th style="border: 1px solid #000; padding: 3px;">Prov. Fund</th>
            <th style="border: 1px solid #000; padding: 3px;">T.D.S.</th>
            <th style="border: 1px solid #000; padding: 3px;">OTHER</th>
            <th style="border: 1px solid #000; padding: 3px;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">APRIL - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">70,000</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">70,000</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">3,360</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">1,500</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">5,060</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">64,940</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f8fafc; border-top: 2px solid #000;">
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">TOTAL</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">8,40,000</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">8,40,000</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">2,400</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">40,320</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">18,000</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">60,720</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">7,79,280</td>
          </tr>
        </tbody>
      </table>
    `

    let renderedTableHtml = ""
    if (tableType === "experience") renderedTableHtml = sampleExperienceTableHtml
    else if (tableType === "salary_with_arrears") renderedTableHtml = sampleSalaryWithArrearsTableHtml

    const sampleSignatureHtml = `
      <table style="width: 100%; border: none; margin-top: 50px;">
        <tr>
          <td style="border: none; width: 60%;"></td>
          <td style="border: none; width: 40%; text-align: center;">
            <p style="font-size: 13px; font-weight: bold; margin: 0; color: #0f172a;">Principal</p>
            <p style="font-size: 11px; margin: 3px 0 0 0; color: #475569;">C. N. K. H. M. C. &amp; R. C., Vyara</p>
          </td>
        </tr>
      </table>
    `

    return `
      <div>
        <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
          <span style="font-size: 14px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            ${certTitle || "CERTIFICATE TITLE"}
          </span>
        </div>

        ${bodyHtml}

        ${renderedTableHtml}

        ${includeSignature ? sampleSignatureHtml : ""}
      </div>
    `
  }

  const handleSave = async () => {
    if (!certTitle.trim()) {
      toast({ title: "Required", description: "Please enter a certificate title.", variant: "destructive" })
      return
    }
    if (!certBody.trim()) {
      toast({ title: "Required", description: "Please write the certificate body text.", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)

      const paragraphs = certBody
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean)

      const formattedParagraphs = paragraphs
        .map(
          (p) =>
            `<p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 16pt;">${p.replace(
              /\n/g,
              "<br/>"
            )}</p>`
        )
        .join("\n\n")

      const titleHtml = `<p style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;"><span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">${certTitle.trim()}</span></p>`

      let tableTag = ""
      if (tableType === "experience") tableTag = "{{experience_table}}"
      else if (tableType === "salary_with_arrears") tableTag = "{{salary_table_with_arrears}}"
      else if (tableType === "salary_summary") tableTag = "{{salary_table_summary}}"
      else if (tableType === "salary_detailed") tableTag = "{{salary_table_detailed}}"

      const finalHtml = `
${titleHtml}

${formattedParagraphs}

${tableTag}

${includeSignature ? "{{principal_signature}}" : ""}
      `.trim()

      const generatedCode =
        editingTemplate?.code ||
        `${targetType.toUpperCase()}_${certTitle.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_")}`

      const payload = {
        name: certTitle.trim(),
        code: generatedCode,
        type: generatedCode,
        target_type: targetType,
        targetType: targetType,
        description: `Official ${targetType} certificate template: ${certTitle.trim()}`,
        content: finalHtml,
        is_active: isActive,
      }

      if (editingTemplate) {
        const res = await ApiService.put(`certificate-templates/${editingTemplate.id}`, payload)
        if (res?.data?.success) {
          toast({ title: "Updated", description: "Certificate template updated successfully." })
        }
      } else {
        const res = await ApiService.post("certificate-templates", payload)
        if (res?.data?.success) {
          toast({ title: "Created", description: "Certificate template created successfully." })
        }
      }

      setDialogOpen(false)
      fetchTemplates()
    } catch (err: any) {
      console.error("Save template error:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save certificate template.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this certificate template?")) return
    try {
      const res = await ApiService.delete(`certificate-templates/${id}`)
      if (res?.data?.success) {
        toast({ title: "Deleted", description: "Template deleted successfully." })
        fetchTemplates()
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" })
    }
  }

  const currentMergeTags = targetType === "staff" ? STAFF_MERGE_TAGS : STUDENT_MERGE_TAGS
  const currentPresets = targetType === "staff" ? STAFF_PRESETS : STUDENT_PRESETS

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/10 text-blue-700 rounded-xl">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Certificate &amp; Letter Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Design and manage official institutional templates for Staff and Students with live preview, letterheads, and print formatting
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => handleOpenCreate(activeTab)}
          className="gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Template
        </Button>
      </div>

      {/* Main Tabs (Staff vs Student) */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "staff" | "student")} className="space-y-6">
        <div className="p-1.5 bg-muted/60 rounded-2xl border border-border/60 backdrop-blur-xs inline-flex">
          <TabsList className="bg-transparent p-0 gap-1.5 h-auto">
            <TabsTrigger
              value="staff"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all border border-transparent data-[state=active]:border-border/60"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Staff Templates</span>
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-mono">
                {staffTemplates.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="student"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs transition-all border border-transparent data-[state=active]:border-border/60"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Student Templates</span>
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-mono">
                {studentTemplates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Staff Templates Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <CardHeader className="p-6 border-b border-border/60 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">
                    Staff Certificate Templates
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Templates available for Teaching faculty, Hospital clinical staff, and Non-teaching personnel
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading staff templates...
                </div>
              ) : staffTemplates.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No staff templates found. Click "Create New Template" above to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 text-center font-bold">#</TableHead>
                      <TableHead className="font-bold">Template Name</TableHead>
                      <TableHead className="font-bold">Code</TableHead>
                      <TableHead className="font-bold">Included Table Format</TableHead>
                      <TableHead className="text-center font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffTemplates.map((t, idx) => {
                      const hasArrears = t.content?.includes("{{salary_table_with_arrears}}")
                      const hasDetailed = t.content?.includes("{{salary_table_detailed}}")
                      const hasSummary = t.content?.includes("{{salary_table_summary}}")
                      const hasExp = t.content?.includes("{{experience_table}}")

                      return (
                        <TableRow key={t.id} className="hover:bg-slate-50/70">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            {t.name}
                            {t.description && (
                              <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                                {t.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {t.code || t.type}
                          </TableCell>
                          <TableCell>
                            {hasArrears && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">
                                Salary (Arrears &amp; TDS)
                              </Badge>
                            )}
                            {hasDetailed && (
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px]">
                                Detailed Allowances
                              </Badge>
                            )}
                            {hasSummary && (
                              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]">
                                Simplified Salary
                              </Badge>
                            )}
                            {hasExp && (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                                Experience Table
                              </Badge>
                            )}
                            {!hasArrears && !hasDetailed && !hasSummary && !hasExp && (
                              <span className="text-xs text-muted-foreground">Standard Text</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {t.is_active ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(t)}
                                className="h-8 text-xs gap-1.5"
                              >
                                <Edit className="h-3.5 w-3.5" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(t.id)}
                                className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Templates Tab */}
        <TabsContent value="student" className="space-y-4">
          <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <CardHeader className="p-6 border-b border-border/60 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">
                    Student Certificate Templates
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Templates available for Bonafide, Character, Transfer/Leaving, Attempt, Medium of Instruction, and Loan Certificates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Loading student templates...
                </div>
              ) : studentTemplates.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No student templates found. Click "Create New Template" above to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 text-center font-bold">#</TableHead>
                      <TableHead className="font-bold">Template Name</TableHead>
                      <TableHead className="font-bold">Code</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="text-center font-bold">Status</TableHead>
                      <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentTemplates.map((t, idx) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/70">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {t.name}
                          {t.description && (
                            <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                              {t.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {t.code || t.type}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                            Student Certificate
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {t.is_active ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(t)}
                              className="h-8 text-xs gap-1.5"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(t.id)}
                              className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/70 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Create Certificate Template"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Configure certificate title, text paragraphs, merge tags, and preview live formatting
                </DialogDescription>
              </div>

              {/* Target Type Selector */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <Button
                  type="button"
                  size="sm"
                  variant={targetType === "staff" ? "default" : "ghost"}
                  onClick={() => setTargetType("staff")}
                  className={`text-xs h-7 px-3 rounded-lg ${targetType === "staff" ? "bg-blue-700 text-white" : "text-slate-600"}`}
                >
                  <Users className="w-3 h-3 mr-1.5" /> Staff
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={targetType === "student" ? "default" : "ghost"}
                  onClick={() => setTargetType("student")}
                  className={`text-xs h-7 px-3 rounded-lg ${targetType === "student" ? "bg-emerald-700 text-white" : "text-slate-600"}`}
                >
                  <GraduationCap className="w-3 h-3 mr-1.5" /> Student
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-border/70">
            {/* Left Column: Form Editor */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Presets Quick-Load Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(currentPresets).map(([key, p]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadPreset(key)}
                      className="text-[11px] h-7 px-2.5 bg-white hover:bg-slate-100 text-slate-700"
                    >
                      {p.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title & Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Certificate Title *</Label>
                  <Input
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. Bonafide Certificate"
                    className="h-9 text-xs"
                  />
                </div>

                {targetType === "staff" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Included Table Format</Label>
                    <Select value={tableType} onValueChange={(v) => setTableType(v as CertificateTableType)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Plain Text Letter)</SelectItem>
                        <SelectItem value="salary_with_arrears">Salary Table (With Arrears &amp; TDS)</SelectItem>
                        <SelectItem value="salary_detailed">Detailed Salary Table (Allowances)</SelectItem>
                        <SelectItem value="salary_summary">Simplified Salary Table</SelectItem>
                        <SelectItem value="experience">Experience Postings Table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Merge Tags Quick Insert Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">
                    Click to Insert Dynamic Merge Tags:
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Inserts at cursor</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {currentMergeTags.map((mt) => (
                    <button
                      key={mt.tag}
                      type="button"
                      onClick={() => insertMergeTag(mt.tag)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-all ${mt.color}`}
                    >
                      {mt.label} <span className="font-mono text-[10px] opacity-75">{mt.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Certificate Body Textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Certificate Body Text *</Label>
                <Textarea
                  ref={textareaRef}
                  value={certBody}
                  onChange={(e) => setCertBody(e.target.value)}
                  placeholder="Write the paragraphs of the certificate. Separate paragraphs with double enter (blank line)."
                  rows={8}
                  className="font-sans text-xs leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate paragraphs with a blank line. Do not manually type the certificate title inside the body text.
                </p>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Switch id="sig-switch" checked={includeSignature} onCheckedChange={setIncludeSignature} />
                  <Label htmlFor="sig-switch" className="text-xs cursor-pointer font-medium">
                    Include Principal Signature &amp; Seal Block
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="active-switch" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="active-switch" className="text-xs cursor-pointer font-medium">
                    Template Active
                  </Label>
                </div>
              </div>
            </div>

            {/* Right Column: Live A4 Preview */}
            <div className="p-6 bg-slate-100/70 overflow-y-auto flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Real-time A4 Letterhead Preview:</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white">
                  Sample Data
                </Badge>
              </div>

              <div className="w-full bg-white border border-slate-200 rounded-lg shadow-sm p-8 min-h-[500px]">
                {/* Header Letterhead Sample */}
                <div className="border-b-2 border-blue-900 pb-3 mb-6 text-center">
                  <h2 className="text-base font-bold text-blue-900 leading-tight uppercase">
                    C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE &amp; RESEARCH CENTRE
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">(Managed by: Vyara Pradesh Seva Samiti)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
                  </p>
                </div>

                <div className="flex justify-between text-xs text-slate-600 mb-6 font-mono">
                  <span>Ref. No. CNKHMC/CERT/2026/042</span>
                  <span>Date: 22/09/2026</span>
                </div>

                <div
                  className="font-serif text-[12px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getLivePreviewHtml() }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/70 bg-card gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
