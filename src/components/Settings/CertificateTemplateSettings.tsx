"use client"

import React, { useState, useEffect, useRef } from "react"
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
import { Plus, Edit, Trash2, FileText, Eye, CheckCircle, Sparkles, Loader2, BookOpen, Layers, X } from "lucide-react"
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

const MERGE_TAGS = [
  { tag: "{{full_name}}", label: "Staff Full Name", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { tag: "{{prefix}}", label: "Prefix (Dr./Mr.)", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{designation}}", label: "Designation", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { tag: "{{department}}", label: "Department", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { tag: "{{joining_date}}", label: "Joining Date", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { tag: "{{resignation_date}}", label: "Resignation Date", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { tag: "{{from_date}}", label: "Period From Date", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{to_date}}", label: "Period To Date", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{financial_year}}", label: "Financial Year", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { tag: "{{he_she}}", label: "He / She", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{him_her}}", label: "him / her", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{his_her}}", label: "his / her", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
]

export type CertificateTableType = "none" | "experience" | "salary_with_arrears" | "salary_summary" | "salary_detailed"

const PRESET_TEMPLATES: Record<string, { title: string; body: string; tableType: CertificateTableType }> = {
  SALARY_WITH_ARREARS: {
    title: "Salary Certificate",
    body: `This is to certify that salary paid to {{prefix}} {{full_name}} for the period from {{from_date}} to {{to_date}} as follows:

This certificate is issued upon {{his_her}} personal request for official verification purposes.`,
    tableType: "salary_with_arrears",
  },
  SALARY_SUMMARY: {
    title: "Salary Certificate (Simplified)",
    body: `This is to certify that salary paid to {{prefix}} {{full_name}} for the period from {{from_date}} to {{to_date}} as follows:

This certificate is issued upon {{his_her}} personal request for official verification purposes.`,
    tableType: "salary_summary",
  },
  SALARY_DETAILED: {
    title: "Detailed Salary Certificate",
    body: `This is to certify that salary and allowance details paid to {{prefix}} {{full_name}} for the period from {{from_date}} to {{to_date}} are as follows:

This certificate is issued upon {{his_her}} personal request for official verification purposes.`,
    tableType: "salary_detailed",
  },
  EXPERIENCE: {
    title: "Experience Certificate",
    body: `This is to certify that {{prefix}} {{full_name}} is an employee of this Organization and duties performed by {{him_her}} during the period(s) are as under:

{{he_she}} is found to be sincere and honest. {{he_she}} bears a good moral character and has good public behavior.`,
    tableType: "experience",
  },
  RELIEVING: {
    title: "Relieving Order & Experience Letter",
    body: `This is to certify that {{prefix}} {{full_name}} was working with our institution as {{designation}} in the department of {{department}} from {{joining_date}} to {{resignation_date}}.

{{he_she}} has been relieved from all {{his_her}} duties and responsibilities at the closing of office hours on {{resignation_date}} upon {{his_her}} resignation. 

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

export default function CertificateTemplateSettings() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Simplified form states
  const [certTitle, setCertTitle] = useState<string>("")
  const [certBody, setCertBody] = useState<string>("")
  const [tableType, setTableType] = useState<CertificateTableType>("salary_with_arrears")
  const [includeSignature, setIncludeSignature] = useState<boolean>(true)
  const [isActive, setIsActive] = useState<boolean>(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const res = await ApiService.get("certificate-templates?target_type=staff&include_inactive=true")
      if (res?.data?.success) {
        setTemplates(res.data.data || [])
      }
    } catch (err: any) {
      console.error("Failed to fetch certificate templates:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setCertTitle("Salary Certificate")
    setCertBody(PRESET_TEMPLATES.SALARY_WITH_ARREARS.body)
    setTableType("salary_with_arrears")
    setIncludeSignature(true)
    setIsActive(true)
    setDialogOpen(true)
  }

  const handleOpenEdit = (t: CertificateTemplate) => {
    setEditingTemplate(t)
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

    setCertBody(plainText)
    setDialogOpen(true)
  }

  const handleLoadPreset = (presetKey: string) => {
    const preset = PRESET_TEMPLATES[presetKey]
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

  // Generates preview HTML with sample dummy data
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

    const sampleReplacements: Record<string, string> = {
      "{{prefix}}": "MS.",
      "{{full_name}}": "<strong style='color:#0f172a;'>Suchitra H Dhodiya</strong>",
      "{{first_name}}": "Suchitra",
      "{{last_name}}": "Dhodiya",
      "{{designation}}": "<strong style='color:#0f172a;'>Assistant Professor</strong>",
      "{{department}}": "<strong style='color:#0f172a;'>Homoeopathy</strong>",
      "{{joining_date}}": "<strong style='color:#0f172a;'>01/06/2021</strong>",
      "{{resignation_date}}": "<strong style='color:#0f172a;'>Till date</strong>",
      "{{from_date}}": "<strong style='color:#0f172a;'>01-06-2025</strong>",
      "{{to_date}}": "<strong style='color:#0f172a;'>30-11-2025</strong>",
      "{{financial_year}}": "<strong style='color:#0f172a;'>2025-2026</strong>",
      "{{he_she}}": "She",
      "{{him_her}}": "her",
      "{{his_her}}": "her",
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
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">Assistant Professor</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">01/06/2021</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">Till date</td>
            <td style="border: 1px solid #94a3b8; padding: 6px 8px; text-align: center; color: #334155;">Homoeopathy</td>
          </tr>
        </tbody>
      </table>
    `

    const sampleSalaryWithArrearsTableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; width: 17%;">Month - Year</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; width: 14%;">Consolidated Gross Salary</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; width: 8%;">Arrears</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; width: 14%;">Total Gross Salary</th>
            <th colspan="5" style="border: 1px solid #000; padding: 4px; text-align: center; width: 34%;">Deduction</th>
            <th rowspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; width: 13%;">Net Salary</th>
          </tr>
          <tr style="background-color: #f8fafc; font-size: 8.5px;">
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">Prof. Tax</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">Prov. Fund</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">T.D.S.</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">OTHER</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">JUNE - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">961</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">2,000</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">3,161</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">10,773</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">JULY - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">961</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">2,000</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">3,161</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">10,773</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">AUG - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">961</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">1,161</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">12,773</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">SEP - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">13,934</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">961</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">1,161</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">12,773</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">OCT - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">16,606</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">16,606</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">1,058</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">1,258</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">15,348</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">NOV - 2025</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">15,329</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">15,329</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">200</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">1,058</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">1,258</td>
            <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">14,071</td>
          </tr>
          <tr style="font-weight: bold; border-top: 2px solid #000;">
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">TOTAL</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">87,671</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">87,671</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">1,200</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">5,960</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: center;">-</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">4,000</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">11,160</td>
            <td style="border: 1px solid #000; padding: 4px 5px; text-align: right;">76,511</td>
          </tr>
        </tbody>
      </table>
    `

    const sampleSalarySummaryTableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10.5px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th rowspan="2" style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: center; font-weight: bold; color: #0f172a;">Month - Year</th>
            <th rowspan="2" style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: center; font-weight: bold; color: #0f172a;">Consolidated Salary</th>
            <th colspan="3" style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: center; font-weight: bold; color: #0f172a;">Deduction</th>
            <th rowspan="2" style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: center; font-weight: bold; color: #0f172a;">Net Salary</th>
          </tr>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: center; font-size: 9.5px; color: #475569;">Prof. Tax</th>
            <th style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: center; font-size: 9.5px; color: #475569;">Prov. Fund</th>
            <th style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: center; font-size: 9.5px; color: #475569;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: center;">APRIL - 2023</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">16,000.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">200.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">1,800.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">2,000.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right; font-weight: bold;">14,000.00</td>
          </tr>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: center;">MAY - 2023</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">16,000.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">200.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">1,800.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right;">2,000.00</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 6px; text-align: right; font-weight: bold;">14,000.00</td>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: center;">TOTAL (12 Months)</td>
            <td style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: right;">192,000.00</td>
            <td style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: right;">2,400.00</td>
            <td style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: right;">21,600.00</td>
            <td style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: right;">24,000.00</td>
            <td style="border: 1px solid #94a3b8; padding: 5px 6px; text-align: right; color: #0f172a;">168,000.00</td>
          </tr>
        </tbody>
      </table>
    `

    const sampleSalaryDetailedTableHtml = `
      <div style="overflow-x: auto; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #94a3b8; padding: 4px;">Month - Year</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">BASIC</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">D.A.</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">H.R.A.</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">T.A.</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">M.A.</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">Gross</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">PT</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">PF</th>
              <th style="border: 1px solid #94a3b8; padding: 4px;">Other Ded</th>
              <th style="border: 1px solid #94a3b8; padding: 4px; font-weight: bold;">Net Salary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: center;">APRIL - 2023</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">36,183</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">25,328</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">3,618</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">1,600</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">300</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">95,831</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">200</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">1,800</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right;">8,000</td>
              <td style="border: 1px solid #94a3b8; padding: 3px; text-align: right; font-weight: bold;">85,831</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: center;">TOTAL</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">452,808</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">316,968</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">45,282</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">19,200</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">3,600</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">1,189,812</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">2,400</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">21,600</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">110,000</td>
              <td style="border: 1px solid #94a3b8; padding: 4px; text-align: right;">1,055,812</td>
            </tr>
          </tbody>
        </table>
      </div>
    `

    let renderedTableHtml = ""
    if (tableType === "experience") renderedTableHtml = sampleExperienceTableHtml
    else if (tableType === "salary_with_arrears") renderedTableHtml = sampleSalaryWithArrearsTableHtml
    else if (tableType === "salary_summary") renderedTableHtml = sampleSalarySummaryTableHtml
    else if (tableType === "salary_detailed") renderedTableHtml = sampleSalaryDetailedTableHtml

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

      const code = certTitle.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_")

      const payload = {
        name: certTitle.trim(),
        code,
        type: code,
        target_type: "staff",
        description: `Custom ${certTitle.trim()} template`,
        content: finalHtml,
        is_active: isActive,
      }

      if (editingTemplate) {
        const res = await ApiService.put(`certificate-templates/${editingTemplate.id}`, payload)
        if (res?.data?.success || res?.status === 200) {
          toast({ title: "Saved", description: `Template "${certTitle}" updated successfully.` })
          setDialogOpen(false)
          fetchTemplates()
        }
      } else {
        const res = await ApiService.post("certificate-templates", payload)
        if (res?.data?.success || res?.status === 201) {
          toast({ title: "Created", description: `Template "${certTitle}" created successfully.` })
          setDialogOpen(false)
          fetchTemplates()
        }
      }
    } catch (err: any) {
      console.error("Failed to save template:", err)
      toast({
        title: "Error Saving Template",
        description: err?.response?.data?.message || err?.message || "Failed to save template.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return
    try {
      const res = await ApiService.delete(`certificate-templates/${id}`)
      if (res?.data?.success) {
        toast({ title: "Deleted", description: "Template deleted successfully." })
        fetchTemplates()
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" })
    }
  }

  return (
    <Card className="border border-slate-200/90 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-slate-900">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Certificate & Letter Templates
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Create customized staff certificates (Relieving Order, NOC, Salary Certificate, etc.) with automated placeholders without writing code.
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 bg-blue-900 hover:bg-blue-800 text-white text-xs px-4 py-2 h-9 rounded-lg shadow-sm">
          <Plus className="h-4 w-4" />
          Add New Certificate
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Loading certificate templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/40 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3.5">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">No Custom Certificate Templates Yet</p>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Create your own custom letters (Relieving Letter, NOC, Salary Certificate, Character Certificate) in just a few clicks.
            </p>
            <Button onClick={handleOpenCreate} className="mt-5 gap-2 bg-blue-900 hover:bg-blue-800 text-white text-xs rounded-lg px-4 h-9">
              <Plus className="h-3.5 w-3.5" />
              Add First Certificate
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
            <Table className="text-xs">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 py-3.5 pl-5">Certificate Title</TableHead>
                  <TableHead className="font-semibold text-slate-700">Identifier Code</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody className="divide-y divide-slate-100">
                {templates.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-900 py-3.5 pl-5">
                      <div className="font-semibold text-sm text-slate-800">{t.name}</div>
                      {t.description && <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                        {t.code || t.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.is_active || t.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] px-2 py-0.5">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-5 space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(t)}
                        className="h-8 px-3 text-xs gap-1.5 text-slate-700 hover:text-blue-700 hover:border-blue-300"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                        className="h-8 px-2.5 text-xs text-slate-500 hover:text-red-700 hover:border-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Spacious, Beautiful Split-View Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[1200px] w-[95vw] max-h-[92vh] overflow-y-auto p-7 rounded-2xl shadow-2xl">
            {/* Header with Preset Loader */}
            <DialogHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingTemplate ? `Edit: ${editingTemplate.name}` : "Create Certificate Template"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-1">
                    Enter the certificate title, write the letter text, and select options. Live preview updates on the right.
                  </DialogDescription>
                </div>

                {!editingTemplate && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Load Example:</span>
                    <Select onValueChange={handleLoadPreset}>
                      <SelectTrigger className="h-7 text-xs w-48 bg-white border-slate-300 rounded-lg">
                        <SelectValue placeholder="Choose starter letter..." />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="SALARY_WITH_ARREARS">Salary Certificate (With Arrears, TDS & Deductions)</SelectItem>
                        <SelectItem value="SALARY_SUMMARY">Salary Certificate (Consolidated Table)</SelectItem>
                        <SelectItem value="SALARY_DETAILED">Salary Certificate (Detailed Breakdown)</SelectItem>
                        <SelectItem value="EXPERIENCE">Experience Certificate</SelectItem>
                        <SelectItem value="RELIEVING">Relieving Order</SelectItem>
                        <SelectItem value="NOC">No Objection Certificate (NOC)</SelectItem>
                        <SelectItem value="CHARACTER">Character Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Split Screen Grid with Extra Spacing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              {/* Left Column: Form & Inputs (7 Columns on large screens) */}
              <div className="lg:col-span-6 space-y-5">
                {/* Certificate Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Certificate Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. Salary Certificate"
                    className="h-10 text-sm bg-white font-medium rounded-xl border-slate-300 focus-visible:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Merge Tags Palette */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Insert Staff Information <span className="text-[11px] font-normal text-slate-500">(Click to insert):</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MERGE_TAGS.map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => insertMergeTag(item.tag)}
                        className={`inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs ${item.color}`}
                        title={`Click to insert ${item.label}`}
                      >
                        <span className="font-bold text-sm leading-none">+</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Certificate Body Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      Certificate Body Text <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Separate paragraphs with double Enter</span>
                  </div>
                  <Textarea
                    ref={textareaRef}
                    value={certBody}
                    onChange={(e) => setCertBody(e.target.value)}
                    placeholder="Type the body of the certificate here. Click on the buttons above to insert dynamic staff variables..."
                    rows={8}
                    className="text-xs leading-relaxed font-sans bg-white rounded-xl border-slate-300 focus-visible:ring-blue-500 p-3.5 min-h-[180px] shadow-2xs"
                  />
                </div>

                {/* Standard Section Switches & Table Type Selection */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-bold text-slate-800 tracking-wide uppercase block">
                    Document Sections & Settings
                  </Label>
                  <div className="space-y-2.5">
                    <div className="py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-semibold text-slate-800 block">
                            Embedded Table Type
                          </Label>
                          <span className="text-[11px] text-slate-500">
                            Choose which data table to embed in this certificate
                          </span>
                        </div>
                      </div>
                      <Select value={tableType} onValueChange={(v: CertificateTableType) => setTableType(v)}>
                        <SelectTrigger className="h-9 text-xs bg-slate-50/80 border-slate-300 rounded-lg">
                          <SelectValue placeholder="Select Table Type" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="none">None (Plain Letter format)</SelectItem>
                          <SelectItem value="salary_with_arrears">Salary Table - With Arrears, TDS & Deductions (Standard Format)</SelectItem>
                          <SelectItem value="salary_summary">Salary Table - Consolidated (Monthly, PT, PF, Net)</SelectItem>
                          <SelectItem value="salary_detailed">Salary Table - Detailed Breakdown (Allowances & Deductions)</SelectItem>
                          <SelectItem value="experience">Experience / Service History (4 Columns: Post, From, To, Department)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50/50 transition-colors">
                      <div>
                        <Label htmlFor="toggle-sig" className="text-xs font-medium text-slate-800 cursor-pointer block">
                          Include Principal Signature Block
                        </Label>
                        <span className="text-[11px] text-slate-500">Adds college seal and Principal designation at bottom</span>
                      </div>
                      <Switch id="toggle-sig" checked={includeSignature} onCheckedChange={setIncludeSignature} />
                    </div>

                    <div className="flex items-center justify-between py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50/50 transition-colors">
                      <div>
                        <Label htmlFor="toggle-active" className="text-xs font-medium text-slate-800 cursor-pointer block">
                          Active Template
                        </Label>
                        <span className="text-[11px] text-slate-500">Make this certificate type selectable in staff profiles</span>
                      </div>
                      <Switch id="toggle-active" checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Real-Time Live Paper Preview (6 Columns on large screens) */}
              <div className="lg:col-span-6 flex flex-col space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span>Real-Time Certificate Preview</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-100 font-mono">
                    A4 Sheet Preview
                  </Badge>
                </div>

                {/* Paper Container */}
                <div className="bg-slate-100/90 p-5 rounded-2xl border border-slate-200/90 h-[560px] overflow-y-auto shadow-inner flex justify-center">
                  <div
                    className="bg-white p-8 rounded-xl shadow-md border border-slate-200/80 w-full text-black font-serif text-xs leading-normal flex flex-col justify-between"
                    style={{ minHeight: "500px" }}
                  >
                    <div>
                      {/* College Header */}
                      <div className="border-b-2 border-double border-blue-900 pb-3 mb-5">
                        <div className="flex items-center gap-3">
                          <img
                            src="/college-logo.jpeg"
                            alt="College Logo"
                            className="w-12 h-12 object-contain shrink-0"
                          />
                          <div className="flex-1 text-center pr-12">
                            <h4 className="font-bold text-[12.5px] text-blue-900 tracking-wide uppercase leading-tight font-sans">
                              C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br />
                              <span className="text-[11px]">&amp; RESEARCH CENTRE</span>
                            </h4>
                            <p className="text-[9px] text-slate-600 mt-0.5 font-sans">
                              (Managed by: Vyara Pradesh Seva Samiti)
                            </p>
                            <p className="text-[8px] text-slate-500 font-sans">
                              Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ref and Date Line */}
                      <div className="flex justify-between text-[11px] text-slate-700 mb-6 font-sans">
                        <span>Ref. No. 104/C.N.K.H.M.C.&amp;R.C./Vyara/2026</span>
                        <span>Date: {new Date().toLocaleDateString("en-GB")}</span>
                      </div>

                      {/* Rendered Live Body */}
                      <div
                        className="preview-body-content"
                        dangerouslySetInnerHTML={{ __html: getLivePreviewHtml() }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs h-9 px-4 rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="gap-2 bg-blue-900 hover:bg-blue-800 text-white text-xs h-9 px-5 rounded-lg shadow-sm"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
