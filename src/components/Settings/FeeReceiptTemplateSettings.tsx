"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ReceiptText,
  Sparkles,
  Check,
  X,
  LayoutTemplate,
} from "lucide-react"
import ApiService from "@/services/ApiService"
import { toast } from "@/hooks/use-toast"
import { CNKHMCReceiptPreview } from "@/components/Fees/Reports/CNKHMCFeeReceiptView"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeeReceiptTemplate {
  id: number
  name: string
  code: string | null
  content: string
  description: string | null
  is_active: boolean
  isActive?: boolean
  created_at: string
  updated_at: string
}

// ─── Merge Tags ───────────────────────────────────────────────────────────────

const RECEIPT_MERGE_TAGS = [
  // Student
  { tag: "{{student_name}}", label: "Student Full Name", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { tag: "{{gr_no}}", label: "GR Number / SID", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { tag: "{{enrollment_no}}", label: "Enrollment No.", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { tag: "{{class}}", label: "Class / Year", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { tag: "{{academic_year}}", label: "Academic Session", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  // Receipt
  { tag: "{{receipt_no}}", label: "Receipt Number", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{receipt_date}}", label: "Receipt Date", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{payment_mode}}", label: "Payment Mode", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { tag: "{{transaction_id}}", label: "Transaction / DD / Cheque No.", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { tag: "{{bank_name}}", label: "Bank Name", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  // Amounts
  { tag: "{{amount_paid}}", label: "Amount Paid", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { tag: "{{amount_in_words}}", label: "Amount in Words", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { tag: "{{total_fees}}", label: "Total Fee Amount", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { tag: "{{balance_due}}", label: "Balance / Due Amount", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { tag: "{{concession}}", label: "Concession Amount", color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  // Fee detail
  { tag: "{{fees_breakdown_table}}", label: "Fees Breakdown Table", color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
  { tag: "{{installment_no}}", label: "Installment Number", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { tag: "{{fees_type}}", label: "Fee Type Name", color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  // School / signatures
  { tag: "{{college_name}}", label: "College Name", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { tag: "{{principal_signature}}", label: "Principal Signature Block", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { tag: "{{cashier_signature}}", label: "Cashier Signature Block", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
]

// ─── Presets ──────────────────────────────────────────────────────────────────

const RECEIPT_PRESETS: Record<string, { name: string; body: string }> = {
  CNKHMC_MESS_OFFICIAL: {
    name: "Rama Harshad Mess Official Receipt (Dual Copy Form)",
    body: "CNKHMC_MESS_OFFICIAL_DUAL_PAGE",
  },
  CNKHMC_HOSTEL_OFFICIAL: {
    name: "Kantaba Girls Hostel Official Receipt (Dual Copy Form)",
    body: "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE",
  },
  CNKHMC_OFFICIAL: {
    name: "C. N. Kothari Official Receipt (Dual Copy Form)",
    body: "CNKHMC_OFFICIAL_DUAL_PAGE",
  },
  STANDARD: {
    name: "Standard Fee Receipt",
    body: `Received with thanks from {{student_name}} (GR No: {{gr_no}}, Enrollment: {{enrollment_no}}), studying in {{class}} for the Academic Session {{academic_year}}, a sum of Rs. {{amount_paid}} (Rupees {{amount_in_words}} Only) towards the following fees:

{{fees_breakdown_table}}

Payment Mode: {{payment_mode}}
Transaction / Cheque / DD No.: {{transaction_id}}
Bank: {{bank_name}}

Balance Due: Rs. {{balance_due}}`,
  },
  INSTALLMENT: {
    name: "Installment Payment Receipt",
    body: `Received with thanks from {{student_name}} (GR No: {{gr_no}}), studying in {{class}} ({{academic_year}}), a sum of Rs. {{amount_paid}} (Rupees {{amount_in_words}} Only) against Installment No. {{installment_no}} for {{fees_type}}.

Payment Mode: {{payment_mode}}
Reference No.: {{transaction_id}}

Total Fees: Rs. {{total_fees}} | Amount Paid This Time: Rs. {{amount_paid}} | Balance: Rs. {{balance_due}}`,
  },
  CONCESSION: {
    name: "Receipt with Concession",
    body: `Received with thanks from {{student_name}} (GR No: {{gr_no}}), studying in {{class}} for {{academic_year}}, a sum of Rs. {{amount_paid}} (Rupees {{amount_in_words}} Only).

Total Fee: Rs. {{total_fees}}
Concession Applied: Rs. {{concession}}
Net Payable: Rs. {{amount_paid}}
Balance Due: Rs. {{balance_due}}

{{fees_breakdown_table}}

Payment Mode: {{payment_mode}} | Reference: {{transaction_id}}`,
  },
  HOSTEL: {
    name: "Hostel Fee Receipt",
    body: `Received with thanks from {{student_name}} (GR No: {{gr_no}}, Enrollment: {{enrollment_no}}), studying in {{class}} ({{academic_year}}), a sum of Rs. {{amount_paid}} (Rupees {{amount_in_words}} Only) towards Hostel Accommodation / Maintenance Fees.

{{fees_breakdown_table}}

Hostel / Room Details: {{remarks}}
Payment Mode: {{payment_mode}}
Transaction / Cheque / DD No.: {{transaction_id}}
Bank: {{bank_name}}

Total Hostel Fees: Rs. {{total_fees}} | Paid: Rs. {{amount_paid}} | Balance Due: Rs. {{balance_due}}`,
  },
  MESS: {
    name: "Mess / Food Fee Receipt",
    body: `Received with thanks from {{student_name}} (GR No: {{gr_no}}), studying in {{class}} ({{academic_year}}), a sum of Rs. {{amount_paid}} (Rupees {{amount_in_words}} Only) towards Mess & Dining Charges ({{fees_type}}).

Mess Plan / Period: {{remarks}}
Payment Mode: {{payment_mode}}
Transaction / Reference No.: {{transaction_id}}
Bank: {{bank_name}}

Total Amount: Rs. {{total_fees}} | Amount Paid: Rs. {{amount_paid}} | Balance Due: Rs. {{balance_due}}`,
  },
  CERTIFICATE: {
    name: "Certificate Issuance Receipt",
    body: `Received with thanks from {{student_name}} (GR No: {{gr_no}}, Enrollment: {{enrollment_no}}), {{class}}, an amount of Rs. {{amount_paid}} (Rupees {{amount_in_words}} Only) towards Certificate Issuance & Verification Fees.

Certificate Type: {{fees_type}}
Application / Reference Remarks: {{remarks}}
Payment Mode: {{payment_mode}}
Transaction / Receipt Ref No.: {{transaction_id}}

Payment Status: Full Payment Received (Nil Balance Due)`,
  },
}

// ─── Sample Data for Live Preview ─────────────────────────────────────────────

const SAMPLE_DATA: Record<string, string> = {
  "{{student_name}}": "<strong style='color:#0f172a;'>Patel Dhruv Rajeshbhai</strong>",
  "{{gr_no}}": "<strong style='color:#0f172a;'>2023041</strong>",
  "{{enrollment_no}}": "<strong style='color:#0f172a;'>BHMS20230041</strong>",
  "{{class}}": "<strong style='color:#0f172a;'>2nd BHMS</strong>",
  "{{academic_year}}": "<strong style='color:#0f172a;'>2025-2026</strong>",
  "{{receipt_no}}": "<strong style='color:#0f172a;'>CNKHMC/REC/2026/00189</strong>",
  "{{receipt_date}}": "<strong style='color:#0f172a;'>13/10/2026</strong>",
  "{{payment_mode}}": "<strong style='color:#0f172a;'>NEFT</strong>",
  "{{transaction_id}}": "<strong style='color:#0f172a;'>HDFC20261013001234</strong>",
  "{{bank_name}}": "<strong style='color:#0f172a;'>HDFC Bank, Vyara</strong>",
  "{{amount_paid}}": "<strong style='color:#0f172a;'>47,500</strong>",
  "{{amount_in_words}}": "<strong style='color:#0f172a;'>Forty Seven Thousand Five Hundred</strong>",
  "{{total_fees}}": "<strong style='color:#0f172a;'>95,000</strong>",
  "{{balance_due}}": "<strong style='color:#0f172a;'>47,500</strong>",
  "{{concession}}": "<strong style='color:#0f172a;'>0</strong>",
  "{{installment_no}}": "<strong style='color:#0f172a;'>1</strong>",
  "{{fees_type}}": "<strong style='color:#0f172a;'>Tuition Fee</strong>",
  "{{college_name}}": "C. N. Kothari Homoeopathic Medical College &amp; Research Centre, Vyara",
}

const SAMPLE_BREAKDOWN_TABLE = `
  <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;">
    <thead>
      <tr style="background:#f1f5f9;">
        <th style="border:1px solid #94a3b8;padding:6px 8px;text-align:left;">Fee Type</th>
        <th style="border:1px solid #94a3b8;padding:6px 8px;text-align:center;">Installment</th>
        <th style="border:1px solid #94a3b8;padding:6px 8px;text-align:right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #94a3b8;padding:6px 8px;">Tuition Fee</td>
        <td style="border:1px solid #94a3b8;padding:6px 8px;text-align:center;">1 of 2</td>
        <td style="border:1px solid #94a3b8;padding:6px 8px;text-align:right;">47,500.00</td>
      </tr>
      <tr style="font-weight:bold;background:#f8fafc;">
        <td style="border:1px solid #94a3b8;padding:6px 8px;" colspan="2">Total Paid</td>
        <td style="border:1px solid #94a3b8;padding:6px 8px;text-align:right;">47,500.00</td>
      </tr>
    </tbody>
  </table>
`

const SAMPLE_SIGNATURE_HTML = `
  <table style="width:100%;border:none;margin-top:50px;">
    <tr>
      <td style="border:none;width:50%;text-align:center;">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#0f172a;">Cashier / Accounts Officer</p>
        <p style="font-size:11px;margin:3px 0 0 0;color:#475569;">C. N. K. H. M. C. &amp; R. C., Vyara</p>
      </td>
      <td style="border:none;width:50%;text-align:center;">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#0f172a;">Principal</p>
        <p style="font-size:11px;margin:3px 0 0 0;color:#475569;">C. N. K. H. M. C. &amp; R. C., Vyara</p>
      </td>
    </tr>
  </table>
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeeReceiptTemplateSettings() {
  const [templates, setTemplates] = useState<FeeReceiptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FeeReceiptTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<FeeReceiptTemplate | null>(null)

  // Form state
  const [templateName, setTemplateName] = useState("")
  const [templateBody, setTemplateBody] = useState(RECEIPT_PRESETS.STANDARD.body)
  const [includeSignatures, setIncludeSignatures] = useState(true)
  const [isActive, setIsActive] = useState(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const res = await ApiService.get("fee-receipt-templates?include_inactive=true")
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setTemplates(res.data.data)
      }
    } catch {
      toast({ title: "Error", description: "Failed to load fee receipt templates.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setTemplateName(RECEIPT_PRESETS.STANDARD.name)
    setTemplateBody(RECEIPT_PRESETS.STANDARD.body)
    setIncludeSignatures(true)
    setIsActive(true)
    setEditingTemplate(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleOpenEdit = (t: FeeReceiptTemplate) => {
    setEditingTemplate(t)
    setTemplateName(t.name || "")
    setIsActive(t.is_active !== undefined ? t.is_active : (t.isActive ?? true))

    if (t.code === "CNKHMC_MESS_OFFICIAL" || t.content === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE") {
      setTemplateBody("CNKHMC_MESS_OFFICIAL_DUAL_PAGE")
      setDialogOpen(true)
      return
    }

    if (t.code === "CNKHMC_HOSTEL_OFFICIAL" || t.content === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE") {
      setTemplateBody("CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE")
      setDialogOpen(true)
      return
    }

    if (t.code === "CNKHMC_OFFICIAL" || t.content === "CNKHMC_OFFICIAL_DUAL_PAGE") {
      setTemplateBody("CNKHMC_OFFICIAL_DUAL_PAGE")
      setDialogOpen(true)
      return
    }

    const raw = t.content || ""
    setIncludeSignatures(raw.includes("{{cashier_signature}}") || raw.includes("{{principal_signature}}"))

    const bodyText = raw
      .replace(/\{\{cashier_signature\}\}/g, "")
      .replace(/\{\{principal_signature\}\}/g, "")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim()

    setTemplateBody(bodyText)
    setDialogOpen(true)
  }

  const handleOpenPreview = (t: FeeReceiptTemplate) => {
    setPreviewTemplate(t)
    setPreviewOpen(true)
  }

  // ── Preset loader ──────────────────────────────────────────────────────────

  const handleLoadPreset = (key: string) => {
    const preset = RECEIPT_PRESETS[key]
    if (!preset) return
    setTemplateName(preset.name)
    setTemplateBody(preset.body)
  }

  // ── Merge tag insertion ────────────────────────────────────────────────────

  const insertMergeTag = (tag: string) => {
    if (!textareaRef.current) {
      setTemplateBody((prev) => prev + " " + tag)
      return
    }
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const before = templateBody.substring(0, start)
    const after = templateBody.substring(end)
    setTemplateBody(before + tag + after)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + tag.length, start + tag.length)
      }
    }, 50)
  }

  // Helper to resolve merge tags with realistic values
  const resolveTemplateTags = (content: string) => {
    let resolved = content
    Object.entries(SAMPLE_DATA).forEach(([tag, val]) => {
      resolved = resolved.split(tag).join(val)
    })
    resolved = resolved.split("{{fees_breakdown_table}}").join(SAMPLE_BREAKDOWN_TABLE)
    resolved = resolved.split("{{breakdown_table}}").join(SAMPLE_BREAKDOWN_TABLE)
    resolved = resolved.split("{{principal_signature}}").join(SAMPLE_SIGNATURE_HTML)
    resolved = resolved.split("{{cashier_signature}}").join("")
    return resolved
  }

  // ── Live preview HTML ──────────────────────────────────────────────────────

  const getLivePreviewHtml = () => {
    const paragraphs = templateBody
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)

    let bodyHtml = paragraphs
      .map(
        (p) =>
          `<p style="text-align:justify;font-size:13px;line-height:1.8;margin-bottom:16px;color:#1e293b;">${p.replace(/\n/g, "<br/>")}</p>`
      )
      .join("")

    bodyHtml = resolveTemplateTags(bodyHtml)

    return `
      <div>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
          <span style="font-size:14px;font-weight:bold;text-decoration:underline;text-transform:uppercase;letter-spacing:0.5px;color:#0f172a;">
            ${templateName || "FEE RECEIPT"}
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:16px;color:#0f172a;">
          <span>Receipt No: <strong>CNKHMC/REC/2026/00189</strong></span>
          <span>Date: <strong>13/10/2026</strong></span>
        </div>
        ${bodyHtml}
        ${includeSignatures ? SAMPLE_SIGNATURE_HTML : ""}
      </div>
    `
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({ title: "Required", description: "Please enter a template name.", variant: "destructive" })
      return
    }
    if (!templateBody.trim()) {
      toast({ title: "Required", description: "Please write the receipt body text.", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)

      const isMessOfficial =
        templateBody === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE" ||
        editingTemplate?.code === "CNKHMC_MESS_OFFICIAL" ||
        templateName.toLowerCase().includes("hostel mess official") ||
        templateName.toLowerCase().includes("mess official")

      const isHostelOfficial =
        !isMessOfficial && (
          templateBody === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE" ||
          editingTemplate?.code === "CNKHMC_HOSTEL_OFFICIAL" ||
          templateName.toLowerCase().includes("kantaba girls hostel official")
        )

      const isOfficial =
        !isMessOfficial && !isHostelOfficial && (
          templateBody === "CNKHMC_OFFICIAL_DUAL_PAGE" ||
          editingTemplate?.code === "CNKHMC_OFFICIAL" ||
          templateName.toLowerCase().includes("c. n. kothari official")
        )

      let finalContent = ""
      let generatedCode = ""

      if (isMessOfficial) {
        finalContent = "CNKHMC_MESS_OFFICIAL_DUAL_PAGE"
        generatedCode = "CNKHMC_MESS_OFFICIAL"
      } else if (isHostelOfficial) {
        finalContent = "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE"
        generatedCode = "CNKHMC_HOSTEL_OFFICIAL"
      } else if (isOfficial) {
        finalContent = "CNKHMC_OFFICIAL_DUAL_PAGE"
        generatedCode = "CNKHMC_OFFICIAL"
      } else {
        const paragraphs = templateBody
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean)

        const formattedBody = paragraphs
          .map(
            (p) =>
              `<p style="text-align:justify;font-size:12pt;line-height:1.8;margin-bottom:16pt;">${p.replace(/\n/g, "<br/>")}</p>`
          )
          .join("\n\n")

        const titleHtml = `<p style="text-align:center;margin-top:24pt;margin-bottom:24pt;"><span style="font-size:13pt;font-weight:bold;text-decoration:underline;text-transform:uppercase;">${templateName.trim()}</span></p>`

        const signaturesHtml = includeSignatures
          ? "\n\n{{cashier_signature}}\n\n{{principal_signature}}"
          : ""

        finalContent = `${titleHtml}\n\n${formattedBody}${signaturesHtml}`.trim()
        generatedCode =
          editingTemplate?.code ||
          `RECEIPT_${templateName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_")}`
      }

      const payload = {
        name: templateName.trim(),
        code: generatedCode,
        description: isMessOfficial
          ? "Official mess dual copy format matching Rama Harshad Mess with cutting line"
          : isHostelOfficial
          ? "Official hostel dual copy format matching Kantaba Girls Hostel PDF with cutting line"
          : isOfficial
          ? "Official college dual copy format matching cnkothari.emli.in PDF with cutting line"
          : `Fee Receipt Template: ${templateName.trim()}`,
        content: finalContent,
        is_active: isActive,
      }

      if (editingTemplate) {
        const res = await ApiService.put(`fee-receipt-templates/${editingTemplate.id}`, payload)
        if (res?.data?.success) {
          toast({ title: "Updated", description: "Fee receipt template updated successfully." })
        }
      } else {
        const res = await ApiService.post("fee-receipt-templates", payload)
        if (res?.data?.success) {
          toast({ title: "Created", description: "Fee receipt template created successfully." })
        }
      }

      setDialogOpen(false)
      fetchTemplates()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save template.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this fee receipt template?")) return
    try {
      const res = await ApiService.delete(`fee-receipt-templates/${id}`)
      if (res?.data?.success) {
        toast({ title: "Deleted", description: "Template deleted successfully." })
        fetchTemplates()
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" })
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600/10 text-emerald-700 rounded-xl">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Fee Receipt Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Design and manage official fee receipt templates with merge tags, live preview, and print-ready formatting
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Template
        </Button>
      </div>

      {/* Template Table */}
      <Card className="rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-border/60 bg-card">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-emerald-600" />
            Receipt Templates
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-mono ml-1">
              {templates.filter((t) => t.is_active || t.isActive).length} Active
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Templates used when printing or generating fee receipts for students
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-14 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">
              <ReceiptText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No templates yet</p>
              <p className="text-xs mt-1">Create your first fee receipt template to get started.</p>
              <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={handleOpenCreate}>
                <Plus className="h-3.5 w-3.5" /> New Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="pl-6 font-semibold text-xs text-slate-600 uppercase tracking-wide">Name</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wide">Code</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wide">Description</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-600 uppercase tracking-wide text-center">Status</TableHead>
                  <TableHead className="pr-6 font-semibold text-xs text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => {
                  const active = t.is_active !== undefined ? t.is_active : (t.isActive ?? true)
                  return (
                    <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 font-semibold text-slate-800">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <ReceiptText className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>{t.name}</span>
                          </div>
                          {(t.code === "CNKHMC_MESS_OFFICIAL" || t.content === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE" || t.name.toLowerCase().includes("hostel mess") || t.name.toLowerCase().includes("mess official")) ? (
                            <div className="flex items-center gap-1.5 ml-6">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 font-normal">
                                Official Mess Dual-Copy Format
                              </Badge>
                            </div>
                          ) : (t.code === "CNKHMC_HOSTEL_OFFICIAL" || t.content === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE" || (t.name.toLowerCase().includes("hostel") && !t.name.toLowerCase().includes("c. n. kothari"))) ? (
                            <div className="flex items-center gap-1.5 ml-6">
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-normal">
                                Official Hostel Dual-Copy Format
                              </Badge>
                            </div>
                          ) : (t.code === "CNKHMC_OFFICIAL" || t.content === "CNKHMC_OFFICIAL_DUAL_PAGE" || t.name.toLowerCase().includes("official")) && (
                            <div className="flex items-center gap-1.5 ml-6">
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 font-normal">
                                Official Dual-Copy Format (cnkothari.emli.in)
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-mono">
                          {t.code || "—"}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-[260px] truncate">
                        {t.description || <span className="text-slate-300 italic">No description</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {active ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] gap-1">
                            <Check className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 text-[11px] gap-1">
                            <X className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleOpenPreview(t)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(t.id)}
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

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[96vw] w-[1300px] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              {editingTemplate ? "Edit Fee Receipt Template" : "Create Fee Receipt Template"}
            </DialogTitle>
            <DialogDescription>
              Use merge tags to insert dynamic data. The preview on the right shows how the receipt will look with sample data.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Left panel: form */}
            <div className="w-[55%] flex flex-col border-r overflow-y-auto p-6 gap-5">

              {/* Preset Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Load a Preset
                </Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(RECEIPT_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 rounded-lg border-dashed"
                      onClick={() => handleLoadPreset(key)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fee-template-name" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fee-template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Standard Fee Receipt"
                  className="h-9"
                />
              </div>

              {/* Merge Tags */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Insert Merge Tags
                </Label>
                <p className="text-[11px] text-muted-foreground -mt-0.5">
                  Click a tag to insert it at the cursor position in the body editor below.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto py-1 pr-1">
                  {RECEIPT_MERGE_TAGS.map((mt) => (
                    <button
                      key={mt.tag}
                      type="button"
                      onClick={() => insertMergeTag(mt.tag)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-mono font-medium transition-all cursor-pointer ${mt.color}`}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="fee-template-body" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Receipt Body <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="fee-template-body"
                  ref={textareaRef}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="font-mono text-sm resize-none h-56 leading-relaxed"
                  placeholder="Write the receipt body text here. Separate paragraphs with a blank line. Use {{fees_breakdown_table}} to embed the auto-generated fee breakdown."
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate paragraphs with a blank line. Use{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{fees_breakdown_table}}"}</code>{" "}
                  to embed the auto-generated fee breakdown.
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Include Signature Blocks</Label>
                    <p className="text-xs text-muted-foreground">Add Cashier and Principal signature lines at the bottom</p>
                  </div>
                  <Switch checked={includeSignatures} onCheckedChange={setIncludeSignatures} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Active</Label>
                    <p className="text-xs text-muted-foreground">Inactive templates are hidden from receipt generation</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </div>

            {/* Right panel: live preview */}
            <div className="w-[45%] flex flex-col overflow-hidden bg-slate-50">
              <div className="px-5 py-3 border-b bg-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Live Preview</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {templateBody === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE" || templateName.toLowerCase().includes("hostel mess") || templateName.toLowerCase().includes("mess official")
                    ? "Mess Dual-Copy View"
                    : templateBody === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE" || templateName.toLowerCase().includes("hostel")
                    ? "Hostel Dual-Copy View"
                    : templateBody === "CNKHMC_OFFICIAL_DUAL_PAGE" || templateName.toLowerCase().includes("official")
                    ? "Official Dual-Copy View"
                    : "Sample Data"}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {templateBody === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE" || templateName.toLowerCase().includes("hostel mess") || templateName.toLowerCase().includes("mess official") ? (
                  <div className="w-full scale-90 origin-top">
                    <CNKHMCReceiptPreview
                      options={{
                        studentName: "Kher Devanshi Shailendrasinh",
                        sid: "0101010120200034",
                        level: "4th Year",
                        receiptNo: "1435",
                        course: "BHMS Old Curriculum",
                        academicYear: "2023 - 2025",
                        term: "1",
                        date: "30-04-2025",
                        feeItems: [{ title: "MESS FEE", amount: 4500 }],
                        totalAmount: 4500,
                        amountInWords: "Four Thousand Five Hundred and zero Paise Only",
                        paymentMode: "Cheque",
                        bankName: "",
                        transactionRef: "UTR SDCBN25115594716",
                        paymentDate: "30-04-2025",
                        remark: "Monthly Mess Charges",
                        messName: "Rama Harshad Mess",
                        messPhone: "02626-221095",
                        isMess: true,
                      }}
                    />
                  </div>
                ) : templateBody === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE" || templateName.toLowerCase().includes("hostel") ? (
                  <div className="w-full scale-90 origin-top">
                    <CNKHMCReceiptPreview
                      options={{
                        studentName: "Kher Devanshi Shailendrasinh",
                        sid: "0101010120200034",
                        level: "4th Year",
                        receiptNo: "1434",
                        course: "BHMS Old Curriculum",
                        academicYear: "2023 - 2025",
                        term: "1",
                        date: "30-04-2025",
                        feeItems: [{ title: "HOSTEL FEE", amount: 8750 }],
                        totalAmount: 8750,
                        amountInWords: "Eight Thousand Seven Hundred and Fifty and zero Paise Only",
                        paymentMode: "Cheque",
                        bankName: "",
                        transactionRef: "UTR SDCBN25115594715",
                        paymentDate: "30-04-2025",
                        remark: "-",
                        barcodeText: "2776R943900200",
                        hostelName: "Kantaba Girls Hostel",
                        hostelPhone: "02626-221095",
                        isHostel: true,
                      }}
                    />
                  </div>
                ) : templateBody === "CNKHMC_OFFICIAL_DUAL_PAGE" || templateName.toLowerCase().includes("official") ? (
                  <div className="w-full scale-90 origin-top">
                    <CNKHMCReceiptPreview
                      options={{
                        studentName: "Patel Dhruv Rajeshbhai",
                        sid: "0101010120210057",
                        level: "3rd Year",
                        receiptNo: "7516",
                        course: "BHMS Old Curriculum",
                        academicYear: "2023-2024",
                        term: "2",
                        date: new Date().toISOString().split("T")[0],
                        feeItems: [{ title: "TUTION FEE-M/G", amount: 47500 }],
                        totalAmount: 47500,
                        amountInWords: "Forty Seven Thousand Five Hundred Only",
                        paymentMode: "NEFT/RTGS",
                        bankName: "State Bank of India",
                        transactionRef: "CMS4054611419",
                        paymentDate: new Date().toISOString().split("T")[0],
                        remark: "Semester Fee Installment",
                        barcodeText1: "007516",
                        barcodeText2: "943900200",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: "white",
                      fontFamily: "Arial, sans-serif",
                      padding: "24px 28px",
                      borderRadius: "8px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      color: "#1e293b",
                    }}
                  >
                    {/* Mock college header */}
                    <table style={{ width: "100%", borderBottom: "2px solid #333", paddingBottom: "12px", marginBottom: "16px" }}>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: "center" }}>
                            <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px" }}>
                              C. N. Kothari Homoeopathic Medical College &amp; Research Centre, Vyara
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#475569" }}>
                              Vilasini K. Desai Arogya Sankul, Near Vanchetna Kakrapar bypass Tadkuva, Dist-Tapi, Gujarat 394650
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div dangerouslySetInnerHTML={{ __html: getLivePreviewHtml() }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-card gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {editingTemplate ? "Update Template" : "Create Template"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Template Preview Dialog ──────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Template Preview — {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-2">
            {previewTemplate?.code === "CNKHMC_MESS_OFFICIAL" ||
            previewTemplate?.content === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE" ||
            previewTemplate?.name?.toLowerCase().includes("hostel mess") ||
            previewTemplate?.name?.toLowerCase().includes("mess official") ? (
              <CNKHMCReceiptPreview
                options={{
                  studentName: "Kher Devanshi Shailendrasinh",
                  sid: "0101010120200034",
                  level: "4th Year",
                  receiptNo: "1435",
                  course: "BHMS Old Curriculum",
                  academicYear: "2023 - 2025",
                  term: "1",
                  date: new Date().toISOString().split("T")[0],
                  feeItems: [{ title: "MESS FEE", amount: 4500 }],
                  totalAmount: 4500,
                  amountInWords: "Four Thousand Five Hundred and zero Paise Only",
                  paymentMode: "Cheque",
                  bankName: "State Bank of India",
                  transactionRef: "UTR SDCBN25115594716",
                  paymentDate: new Date().toISOString().split("T")[0],
                  remark: "Monthly Mess Charges",
                  messName: "Rama Harshad Mess",
                  messPhone: "02626-221095",
                  isMess: true,
                }}
              />
            ) : previewTemplate?.code === "CNKHMC_HOSTEL_OFFICIAL" ||
            previewTemplate?.content === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE" ||
            (previewTemplate?.name?.toLowerCase().includes("hostel") && !previewTemplate?.name?.toLowerCase().includes("c. n. kothari")) ? (
              <CNKHMCReceiptPreview
                options={{
                  studentName: "Kher Devanshi Shailendrasinh",
                  sid: "0101010120200034",
                  level: "4th Year",
                  receiptNo: "1434",
                  course: "BHMS Old Curriculum",
                  academicYear: "2023 - 2025",
                  term: "1",
                  date: new Date().toISOString().split("T")[0],
                  feeItems: [{ title: "HOSTEL FEE", amount: 8750 }],
                  totalAmount: 8750,
                  amountInWords: "Eight Thousand Seven Hundred and Fifty and zero Paise Only",
                  paymentMode: "Cheque",
                  bankName: "",
                  transactionRef: "UTR SDCBN25115594715",
                  paymentDate: new Date().toISOString().split("T")[0],
                  remark: "-",
                  hostelName: "Kantaba Girls Hostel",
                  hostelPhone: "02626-221095",
                  isHostel: true,
                }}
              />
            ) : previewTemplate?.code === "CNKHMC_OFFICIAL" ||
            previewTemplate?.content === "CNKHMC_OFFICIAL_DUAL_PAGE" ||
            previewTemplate?.name?.toLowerCase().includes("official") ? (
              <CNKHMCReceiptPreview
                options={{
                  studentName: "Patel Dhruv Rajeshbhai",
                  sid: "0101010120210057",
                  level: "3rd Year",
                  receiptNo: "7516",
                  course: "BHMS Old Curriculum",
                  academicYear: "2023-2024",
                  term: "2",
                  date: new Date().toISOString().split("T")[0],
                  feeItems: [{ title: "TUTION FEE-M/G", amount: 47500 }],
                  totalAmount: 47500,
                  amountInWords: "Forty Seven Thousand Five Hundred Only",
                  paymentMode: "NEFT/RTGS",
                  bankName: "State Bank of India",
                  transactionRef: "CMS4054611419",
                  paymentDate: new Date().toISOString().split("T")[0],
                  remark: "Semester Fee Installment",
                  barcodeText1: "007516",
                  barcodeText2: "943900200",
                }}
              />
            ) : (
              <div
                style={{
                  background: "white",
                  fontFamily: "Arial, sans-serif",
                  padding: "24px 28px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                <table style={{ width: "100%", borderBottom: "2px solid #333", paddingBottom: "12px", marginBottom: "16px" }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px" }}>
                          C. N. Kothari Homoeopathic Medical College &amp; Research Centre, Vyara
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div dangerouslySetInnerHTML={{ __html: resolveTemplateTags(previewTemplate?.content || "") }} />
              </div>
            )}
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
