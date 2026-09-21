"use client"

import React, { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Settings2, History, Cloud, Loader2, FileText, CheckCircle2, ChevronDown, Sparkles } from "lucide-react"
import type { StaffType, StaffExperience } from "@/types/staff"
import ApiService from "@/services/ApiService"
import { useGetDepartmentsQuery } from "@/services/DepartmentService"
import { useGetStaffByIdQuery } from "@/services/StaffService"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"

interface ExperienceCertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffType | null
}

interface CertificateAuditLog {
  id: number
  staff_id: number
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
  description: string | null
  content: string
}

export interface MonthlySalaryEntry {
  month: string
  year: number
  consolidatedSalary: number
  arrears: number
  profTax: number
  provFund: number
  tds: number
  otherDeduction: number
  basic: number
  da: number
  hra: number
  ta: number
  ma: number
  otherAllowance: number
}

const MONTH_NAMES = [
  "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER",
  "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"
]

const generateDefaultSalaryRows = (
  startYear: number,
  defaultSalary = 16000,
  defaultPt = 200,
  defaultPf = 1800
): MonthlySalaryEntry[] => {
  return MONTH_NAMES.map((m, idx) => {
    const yr = idx < 9 ? startYear : startYear + 1
    const basic = Math.round(defaultSalary * 0.4)
    const da = Math.round(defaultSalary * 0.3)
    const hra = Math.round(defaultSalary * 0.15)
    const ta = 1600
    const ma = 300
    const otherAllow = Math.max(0, defaultSalary - (basic + da + hra + ta + ma))

    return {
      month: m,
      year: yr,
      consolidatedSalary: defaultSalary,
      arrears: 0,
      profTax: defaultPt,
      provFund: defaultPf,
      tds: 0,
      otherDeduction: 0,
      basic,
      da,
      hra,
      ta,
      ma,
      otherAllowance: otherAllow,
    }
  })
}

export default function ExperienceCertificateModal({ open, onOpenChange, staff }: ExperienceCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const authSchoolId = useAppSelector((state) => state.auth.user?.school_id)
  const schoolId = staff?.school_id || authSchoolId

  // Fetch departments and full staff data to ensure accurate department resolution
  const { data: departments } = useGetDepartmentsQuery(
    { school_id: schoolId! },
    { skip: !open || !schoolId }
  )
  const { data: fullStaffData } = useGetStaffByIdQuery(staff?.id || 0, { skip: !open || !staff?.id })

  const currentStaff = fullStaffData || staff

  // Certificate selection & templates
  const [availableTemplates, setAvailableTemplates] = useState<CustomTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("DEFAULT_EXPERIENCE")

  const [refNumber, setRefNumber] = useState<string>("")
  const [refYear, setRefYear] = useState<string>("")
  const [certDate, setCertDate] = useState<string>("")
  const [prefix, setPrefix] = useState<string>("Dr.")
  const [customDesignation, setCustomDesignation] = useState<string>("")
  const [customDepartment, setCustomDepartment] = useState<string>("")
  const [pronounStyle, setPronounStyle] = useState<"generic" | "gender">("generic")
  const [includeLetterhead, setIncludeLetterhead] = useState<boolean>(true)
  const [showConfig, setShowConfig] = useState<boolean>(false)
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false)

  // Salary Table States
  const currentFYStart = new Date().getMonth() >= 3 ? new Date().getFullYear() - 1 : new Date().getFullYear() - 2
  const [salaryStartYear, setSalaryStartYear] = useState<number>(currentFYStart)
  const [defaultMonthlySalary, setDefaultMonthlySalary] = useState<number>(16000)
  const [defaultPt, setDefaultPt] = useState<number>(200)
  const [defaultPf, setDefaultPf] = useState<number>(1800)
  const [salaryEntries, setSalaryEntries] = useState<MonthlySalaryEntry[]>(() =>
    generateDefaultSalaryRows(currentFYStart, 16000, 200, 1800)
  )

  // Audit and cloud storage states
  const [auditLogs, setAuditLogs] = useState<CertificateAuditLog[]>([])
  const [totalGenerations, setTotalGenerations] = useState<number>(0)
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Fetch available templates for staff
  const fetchTemplates = async () => {
    try {
      const res = await ApiService.get("certificate-templates?target_type=staff")
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAvailableTemplates(res.data.data)
      }
    } catch (err) {
      console.error("Failed to load certificate templates:", err)
    }
  }

  const fetchAuditLogs = async () => {
    if (!staff?.id) return
    try {
      setIsLoadingLogs(true)
      const currentCode = selectedTemplateId === "DEFAULT_EXPERIENCE" ? "EXPERIENCE_CERTIFICATE" : selectedTemplateId
      const res = await ApiService.get(`staff/${staff.id}/certificates/audit-logs?certificate_type=${currentCode}`)
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
    if (open && currentStaff) {
      setRefNumber("")
      setRefYear("")
      setCertDate("")
      setShowAuditHistory(false)

      const isDr =
        currentStaff.staff_type === "teaching" ||
        currentStaff.staff_category === "Teaching" ||
        (currentStaff.ug_degree && currentStaff.ug_degree.toLowerCase().includes("b")) ||
        (currentStaff.qualification && currentStaff.qualification.toLowerCase().includes("h.m.s"))
      setPrefix(isDr ? "Dr." : currentStaff.gender === "Female" ? "Mrs." : "Mr.")

      // Accurately resolve department from department_id or department_details
      let resolvedDept = ""
      const deptId = currentStaff.department_id || staff?.department_id
      if (deptId && departments && departments.length > 0) {
        const found = departments.find((d) => String(d.id) === String(deptId))
        if (found?.name) resolvedDept = found.name
      }
      if (!resolvedDept && (currentStaff as any)?.department_details?.name) {
        resolvedDept = (currentStaff as any).department_details.name
      }
      if (!resolvedDept && currentStaff.department && currentStaff.department !== "General" && currentStaff.department !== "Mathematics") {
        resolvedDept = currentStaff.department
      }
      if (!resolvedDept && currentStaff.area_of_expertise) {
        resolvedDept = currentStaff.area_of_expertise
      }
      if (!resolvedDept && currentStaff.department && currentStaff.department !== "Mathematics") {
        resolvedDept = currentStaff.department
      }
      setCustomDepartment(resolvedDept || "Homoeopathy")
      setCustomDesignation(currentStaff.designation || currentStaff.role || "Assistant Professor")

      fetchTemplates()
    }
  }, [staff, currentStaff, departments, open])

  useEffect(() => {
    if (open && staff) {
      fetchAuditLogs()
    }
  }, [selectedTemplateId, staff, open])

  if (!staff) return null

  const experiences: StaffExperience[] = (currentStaff as any)?.experiences || currentStaff?.staff_experiences || []

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "Till date"
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const fullName = `${staff.first_name || ""} ${staff.middle_name ? staff.middle_name + " " : ""}${staff.last_name || ""}`.trim()
  const currentYear = new Date().getFullYear()

  // Pronouns
  const himHer = pronounStyle === "generic" ? "him/her" : staff.gender === "Female" ? "her" : "him"
  const heShe = pronounStyle === "generic" ? "He / She" : staff.gender === "Female" ? "She" : "He"
  const hisHer = pronounStyle === "generic" ? "his/her" : staff.gender === "Female" ? "her" : "his"

  // Rows for table
  const tableRows =
    experiences.length > 0
      ? experiences.map((exp) => ({
        post: exp.post_name || customDesignation || currentStaff?.role || currentStaff?.designation || "Assistant Professor",
        from: formatDate(exp.from_date),
        to: exp.to_date ? formatDate(exp.to_date) : "Till date",
        department: (exp.department && exp.department !== "Mathematics" ? exp.department : customDepartment) || "-",
      }))
      : [
        {
          post: customDesignation || currentStaff?.role || currentStaff?.designation || "Assistant Professor",
          from: currentStaff?.joining_date ? formatDate(currentStaff.joining_date) : "01/01/" + currentYear,
          to: currentStaff?.resignation_date ? formatDate(currentStaff.resignation_date) : "Till date",
          department: customDepartment || "Homoeopathy",
        },
      ]

  const formattedRefNumber = refNumber
    ? `${refNumber}/C.N.K.H.M.C.&R.C./Vyara/${refYear || currentYear}`
    : "____________ / C.N.K.H.M.C. & R.C. / Vyara / 20____"
  const formattedCertDate = certDate || "_____ / _____ / 20____"

  const tableRowsHtml = tableRows
    .map(
      (r) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.post}</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.from}</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.to}</td>
        <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.department}</td>
      </tr>`
    )
    .join("")

  const experienceTableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 14pt; margin-bottom: 18pt; font-size: 11pt;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Name of post held</th>
          <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">From dd/mm/yy</th>
          <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">To dd/mm/yy</th>
          <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Department</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  `

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

  // Salary Table Calculations & HTML Generation
  const formatCurrency = (val: number) => {
    if (!val || isNaN(val) || val === 0) return " - "
    return val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatCurrencyInteger = (val: number) => {
    if (!val || isNaN(val) || val === 0) return " - "
    return val.toLocaleString("en-IN")
  }

  const totalConsolidated = salaryEntries.reduce((sum, r) => sum + (Number(r.consolidatedSalary) || 0), 0)
  const totalProfTax = salaryEntries.reduce((sum, r) => sum + (Number(r.profTax) || 0), 0)
  const totalProvFund = salaryEntries.reduce((sum, r) => sum + (Number(r.provFund) || 0), 0)
  const totalOtherDed = salaryEntries.reduce((sum, r) => sum + (Number(r.otherDeduction) || 0), 0)
  const totalDeductions = totalProfTax + totalProvFund + totalOtherDed
  const totalNetSalary = totalConsolidated - totalDeductions

  const totalBasic = salaryEntries.reduce((sum, r) => sum + (Number(r.basic) || 0), 0)
  const totalDa = salaryEntries.reduce((sum, r) => sum + (Number(r.da) || 0), 0)
  const totalHra = salaryEntries.reduce((sum, r) => sum + (Number(r.hra) || 0), 0)
  const totalTa = salaryEntries.reduce((sum, r) => sum + (Number(r.ta) || 0), 0)
  const totalMa = salaryEntries.reduce((sum, r) => sum + (Number(r.ma) || 0), 0)
  const totalSub = totalBasic + totalDa + totalHra + totalTa + totalMa
  const totalOtherAllow = salaryEntries.reduce((sum, r) => sum + (Number(r.otherAllowance) || 0), 0)
  const totalGross = totalSub + totalOtherAllow

  const salaryTableSummaryRowsHtml = salaryEntries
    .map((r) => {
      const rowConsolidated = Number(r.consolidatedSalary) || 0
      const rowPt = Number(r.profTax) || 0
      const rowPf = Number(r.provFund) || 0
      const rowOther = Number(r.otherDeduction) || 0
      const rowDed = rowPt + rowPf + rowOther
      const rowNet = rowConsolidated - rowDed

      return `
        <tr>
          <td style="border: 1px solid #000; padding: 4.5px 6px; text-align: center; font-weight: 500;">${r.month} - ${r.year}</td>
          <td style="border: 1px solid #000; padding: 4.5px 8px; text-align: right;">${formatCurrency(rowConsolidated)}</td>
          <td style="border: 1px solid #000; padding: 4.5px 6px; text-align: right;">${formatCurrency(rowPt)}</td>
          <td style="border: 1px solid #000; padding: 4.5px 6px; text-align: right;">${formatCurrency(rowPf)}</td>
          <td style="border: 1px solid #000; padding: 4.5px 6px; text-align: right;">${formatCurrency(rowDed)}</td>
          <td style="border: 1px solid #000; padding: 4.5px 8px; text-align: right; font-weight: bold;">${formatCurrency(rowNet)}</td>
        </tr>
      `
    })
    .join("")

  const salaryTableSummaryHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 14pt; margin-bottom: 16pt; font-size: 9.5pt; font-family: 'Times New Roman', Times, serif;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th rowspan="2" style="border: 1px solid #000; padding: 5px 6px; text-align: center; font-weight: bold; width: 23%;">Month - Year</th>
          <th rowspan="2" style="border: 1px solid #000; padding: 5px 6px; text-align: center; font-weight: bold; width: 23%;">Consolidated Salary</th>
          <th colspan="3" style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold; width: 34%;">Deduction</th>
          <th rowspan="2" style="border: 1px solid #000; padding: 5px 6px; text-align: center; font-weight: bold; width: 20%;">Net Salary</th>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #000; padding: 4px 5px; text-align: center; font-weight: bold; font-size: 8.5pt;">Prof. Tax</th>
          <th style="border: 1px solid #000; padding: 4px 5px; text-align: center; font-weight: bold; font-size: 8.5pt;">Prov. Fund</th>
          <th style="border: 1px solid #000; padding: 4px 5px; text-align: center; font-weight: bold; font-size: 8.5pt;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${salaryTableSummaryRowsHtml}
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 5px 6px; text-align: center; font-weight: bold;">TOTAL</td>
          <td style="border: 1px solid #000; padding: 5px 8px; text-align: right; font-weight: bold;">${formatCurrency(totalConsolidated)}</td>
          <td style="border: 1px solid #000; padding: 5px 6px; text-align: right; font-weight: bold;">${formatCurrency(totalProfTax)}</td>
          <td style="border: 1px solid #000; padding: 5px 6px; text-align: right; font-weight: bold;">${formatCurrency(totalProvFund)}</td>
          <td style="border: 1px solid #000; padding: 5px 6px; text-align: right; font-weight: bold;">${formatCurrency(totalDeductions)}</td>
          <td style="border: 1px solid #000; padding: 5px 8px; text-align: right; font-weight: bold;">${formatCurrency(totalNetSalary)}</td>
        </tr>
      </tbody>
    </table>
  `

  const salaryTableDetailedRowsHtml = salaryEntries
    .map((r) => {
      const basic = Number(r.basic) || 0
      const da = Number(r.da) || 0
      const hra = Number(r.hra) || 0
      const ta = Number(r.ta) || 0
      const ma = Number(r.ma) || 0
      const sub = basic + da + hra + ta + ma
      const otherAllow = Number(r.otherAllowance) || 0
      const gross = sub + otherAllow
      const pt = Number(r.profTax) || 0
      const pf = Number(r.provFund) || 0
      const otherDed = Number(r.otherDeduction) || 0
      const net = gross - (pt + pf + otherDed)

      return `
        <tr>
          <td style="border: 1px solid #000; padding: 3px; text-align: center;">${r.month} - ${r.year}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(basic)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(da)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(hra)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(ta)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(ma)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(sub)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(otherAllow)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right; font-weight: bold;">${formatCurrencyInteger(gross)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(pt)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(pf)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(otherDed)}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: right; font-weight: bold;">${formatCurrencyInteger(net)}</td>
        </tr>
      `
    })
    .join("")

  const salaryTableDetailedHtml = `
    <div style="width: 100%; overflow-x: auto; margin-top: 12pt; margin-bottom: 14pt;">
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; font-family: 'Times New Roman', Times, serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">Month - Year</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">BASIC</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">D.A.</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">H.R.A.</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">T.A.</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">M.A.</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">SUB TOTAL</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">OTHER</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">Gross Salary</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">Prof. Tax</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">P.F.</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center;">OTHER</th>
            <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">Net Salary</th>
          </tr>
        </thead>
        <tbody>
          ${salaryTableDetailedRowsHtml}
          <tr style="background-color: #f2f2f2; font-weight: bold;">
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">TOTAL</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalBasic)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalDa)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalHra)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalTa)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalMa)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalSub)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalOtherAllow)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalGross)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalProfTax)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalProvFund)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalOtherDed)}</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: right;">${formatCurrencyInteger(totalNetSalary)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `

  const totalArrears = salaryEntries.reduce((sum, r) => sum + (Number(r.arrears) || 0), 0)
  const totalGrossWithArrears = totalConsolidated + totalArrears
  const totalTds = salaryEntries.reduce((sum, r) => sum + (Number(r.tds) || 0), 0)
  const totalDeductionsWithArrears = totalProfTax + totalProvFund + totalTds + totalOtherDed
  const totalNetWithArrears = totalGrossWithArrears - totalDeductionsWithArrears

  const getMonthNumber = (monthName: string) => {
    const m = monthName.trim().toUpperCase()
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const fullMonths = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
    let idx = fullMonths.findIndex((name) => name === m)
    if (idx === -1) idx = months.findIndex((name) => m.startsWith(name))
    return idx >= 0 ? idx + 1 : 1
  }

  const getPeriodDates = () => {
    if (!salaryEntries || salaryEntries.length === 0) {
      return { from: `01-04-${salaryStartYear}`, to: `31-03-${salaryStartYear + 1}` }
    }
    const first = salaryEntries[0]
    const last = salaryEntries[salaryEntries.length - 1]
    const firstMonthNum = getMonthNumber(first.month)
    const lastMonthNum = getMonthNumber(last.month)

    const lastMonthDays = new Date(last.year, lastMonthNum, 0).getDate()

    const fromStr = `01-${String(firstMonthNum).padStart(2, "0")}-${first.year}`
    const toStr = `${String(lastMonthDays).padStart(2, "0")}-${String(lastMonthNum).padStart(2, "0")}-${last.year}`
    return { from: fromStr, to: toStr }
  }

  const salaryTableWithArrearsRowsHtml = salaryEntries
    .map((r) => {
      const rowConsolidated = Number(r.consolidatedSalary) || 0
      const rowArrears = Number(r.arrears) || 0
      const rowTotalGross = rowConsolidated + rowArrears
      const rowPt = Number(r.profTax) || 0
      const rowPf = Number(r.provFund) || 0
      const rowTds = Number(r.tds) || 0
      const rowOther = Number(r.otherDeduction) || 0
      const rowTotalDed = rowPt + rowPf + rowTds + rowOther
      const rowNet = rowTotalGross - rowTotalDed

      return `
        <tr>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: center; font-weight: 500;">${r.month} - ${r.year}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">${formatCurrencyInteger(rowConsolidated)}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">${rowArrears > 0 ? formatCurrencyInteger(rowArrears) : "-"}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">${formatCurrencyInteger(rowTotalGross)}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">${formatCurrencyInteger(rowPt)}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">${formatCurrencyInteger(rowPf)}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: center;">${rowTds > 0 ? formatCurrencyInteger(rowTds) : "-"}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right;">${rowOther > 0 ? formatCurrencyInteger(rowOther) : "-"}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(rowTotalDed)}</td>
          <td style="border: 1px solid #000; padding: 3px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(rowNet)}</td>
        </tr>
      `
    })
    .join("")

  const salaryTableWithArrearsHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 14pt; margin-bottom: 16pt; font-size: 9pt; font-family: 'Times New Roman', Times, serif; border: 1px solid #000;">
      <thead>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <th rowspan="2" style="border: 1px solid #000; padding: 4px 5px; text-align: center; width: 17%;">Month - Year</th>
          <th rowspan="2" style="border: 1px solid #000; padding: 4px 5px; text-align: center; width: 14%;">Consolidated Gross Salary</th>
          <th rowspan="2" style="border: 1px solid #000; padding: 4px 5px; text-align: center; width: 8%;">Arrears</th>
          <th rowspan="2" style="border: 1px solid #000; padding: 4px 5px; text-align: center; width: 14%;">Total Gross Salary</th>
          <th colspan="5" style="border: 1px solid #000; padding: 4px 5px; text-align: center; width: 34%;">Deduction</th>
          <th rowspan="2" style="border: 1px solid #000; padding: 4px 5px; text-align: center; width: 13%;">Net Salary</th>
        </tr>
        <tr style="background-color: #f8fafc; font-size: 8.5pt;">
          <th style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold;">Prof. Tax</th>
          <th style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold;">Prov. Fund</th>
          <th style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold;">T.D.S.</th>
          <th style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold;">OTHER</th>
          <th style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${salaryTableWithArrearsRowsHtml}
        <tr style="font-weight: bold; background-color: #f8fafc; border-top: 2px solid #000;">
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: center; font-weight: bold;">TOTAL</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(totalConsolidated)}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: center;">${totalArrears > 0 ? formatCurrencyInteger(totalArrears) : "-"}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(totalGrossWithArrears)}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(totalProfTax)}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(totalProvFund)}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: center;">${totalTds > 0 ? formatCurrencyInteger(totalTds) : "-"}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${totalOtherDed > 0 ? formatCurrencyInteger(totalOtherDed) : "-"}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(totalDeductionsWithArrears)}</td>
          <td style="border: 1px solid #000; padding: 4px 5px; text-align: right; font-weight: bold;">${formatCurrencyInteger(totalNetWithArrears)}</td>
        </tr>
      </tbody>
    </table>
  `

  // Resolve template content by substituting merge tags
  const activeCustomTemplate = availableTemplates.find(
    (t) => (t.code || t.type || String(t.id)) === selectedTemplateId
  )

  const isSalaryCertificate =
    selectedTemplateId.toUpperCase().includes("SALARY") ||
    activeCustomTemplate?.content?.includes("{{salary_table_with_arrears}}") ||
    activeCustomTemplate?.content?.includes("{{salary_table_summary}}") ||
    activeCustomTemplate?.content?.includes("{{salary_table_detailed}}") ||
    activeCustomTemplate?.name?.toUpperCase().includes("SALARY")

  const periodDates = getPeriodDates()

  const getResolvedCertificateBody = () => {
    if (activeCustomTemplate && activeCustomTemplate.content) {
      let content = activeCustomTemplate.content
      const replacements: Record<string, string> = {
        "{{prefix}}": prefix ? prefix + " " : "",
        "{{full_name}}": fullName,
        "{{first_name}}": currentStaff?.first_name || "",
        "{{last_name}}": currentStaff?.last_name || "",
        "{{designation}}": customDesignation || currentStaff?.role || currentStaff?.designation || "Assistant Professor",
        "{{post}}": customDesignation || currentStaff?.role || currentStaff?.designation || "Assistant Professor",
        "{{department}}": customDepartment || "Homoeopathy",
        "{{joining_date}}": currentStaff?.joining_date ? formatDate(currentStaff.joining_date) : "-",
        "{{resignation_date}}": currentStaff?.resignation_date ? formatDate(currentStaff.resignation_date) : "Till date",
        "{{ref_no}}": formattedRefNumber,
        "{{cert_date}}": formattedCertDate,
        "{{from_date}}": periodDates.from,
        "{{to_date}}": periodDates.to,
        "{{financial_year}}": `${salaryStartYear}-${salaryStartYear + 1}`,
        "{{he_she}}": heShe,
        "{{him_her}}": himHer,
        "{{his_her}}": hisHer,
        "{{experience_table}}": experienceTableHtml,
        "{{salary_table_with_arrears}}": salaryTableWithArrearsHtml,
        "{{salary_table_summary}}": salaryTableSummaryHtml,
        "{{salary_table_detailed}}": salaryTableDetailedHtml,
        "{{principal_signature}}": principalSignatureHtml,
      }

      Object.entries(replacements).forEach(([tag, val]) => {
        content = content.split(tag).join(val)
      })
      return content
    }

    // Default Experience Certificate template
    return `
      <p style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;">
        <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">EXPERIENCE CERTIFICATE</span>
      </p>

      <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 18pt;">
        This is to certify that ${prefix ? prefix + " " : ""}${fullName} is an employee of this Organization and duties performed by ${himHer} during the period(s) are as under:
      </p>

      ${experienceTableHtml}

      <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-top: 18pt; margin-bottom: 60pt;">
        ${heShe} is found to be sincere and honest. ${heShe} bears a good moral character and has good public behavior.
      </p>

      ${principalSignatureHtml}
    `
  }

  const certificateTypeTitle =
    activeCustomTemplate?.name || "Experience Certificate"
  const certificateTypeCode =
    activeCustomTemplate?.code || activeCustomTemplate?.type || "EXPERIENCE_CERTIFICATE"

  /**
   * Sends certificate to backend for upload to DigitalOcean Spaces and logs audit entry
   */
  const saveToCloudAndRecordAudit = async (
    fileContent: string,
    fileType: "doc" | "pdf" | "html",
    customFileName: string
  ) => {
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
          prefix,
          pronounStyle,
          includeLetterhead,
        },
      }

      const res = await ApiService.post(`staff/${staff.id}/certificates/generate`, payload)
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
    const printContent = printRef.current
    if (!printContent) return

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
              line-height: 1.5;
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
        description: `Stored to DigitalOcean Spaces (Version #${result.generation_number})`,
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
              line-height: 1.5;
              color: #000000;
            }
            p { margin: 0; margin-bottom: 12pt; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18pt;
              margin-bottom: 18pt;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            ${headerHtml}
            
            <table style="width: 100%; border: none; margin-bottom: 24pt;">
              <tr>
                <td style="border: none; text-align: left; font-size: 12pt;">Ref. No. ${formattedRefNumber}</td>
                <td style="border: none; text-align: right; font-size: 12pt;">Date: ${formattedCertDate}</td>
              </tr>
            </table>

            ${bodyContent}
          </div>
        </body>
      </html>
    `

    const fileName = `${certificateTypeTitle.replace(/\s+/g, "_")}_${fullName.replace(/\s+/g, "_")}.doc`

    // Upload & log audit record in backend
    const cloudResult = await saveToCloudAndRecordAudit(docContent, "doc", fileName)

    setIsSaving(false)

    // Serve/download document
    const blob = new Blob([docContent], { type: "application/msword;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    if (cloudResult) {
      toast({
        title: "Certificate Downloaded & Saved",
        description: `Archived to DigitalOcean Spaces (Version #${cloudResult.generation_number})`,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl font-bold">Staff Certificate Generator</DialogTitle>
            <Badge
              variant="outline"
              onClick={() => setShowAuditHistory(!showAuditHistory)}
              className="cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold"
              title="Click to view full certificate generation history"
            >
              <History className="h-3.5 w-3.5 text-blue-600" />
              Generated {totalGenerations} {totalGenerations === 1 ? "time" : "times"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mr-6">
            <Button
              variant={showAuditHistory ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAuditHistory(!showAuditHistory)}
              className="gap-1 text-xs"
            >
              <History className="h-3.5 w-3.5" />
              {showAuditHistory ? "Hide History" : "Audit History"}
            </Button>
            <Button
              variant={showConfig ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="gap-1 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {showConfig ? "Hide Options" : "Customize"}
            </Button>
            <Button
              onClick={handleDownloadWord}
              disabled={isSaving}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download Word (.doc)
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isSaving}
              size="sm"
              className="gap-1.5 text-xs bg-blue-900 hover:bg-blue-800 text-white"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Certificate Type Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FileText className="h-4 w-4 text-blue-700 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Certificate Type:</span>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="h-8 text-xs bg-white w-full sm:w-64 font-medium">
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT_EXPERIENCE">Experience Certificate (Default)</SelectItem>
                {availableTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.code || t.type || String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-[11px] text-slate-500">
            {activeCustomTemplate?.description || "Official certificate for faculty and staff members"}
          </span>
        </div>

        {/* Audit History Drawer */}
        {showAuditHistory && (
          <div className="bg-slate-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-slate-800">
                  Cloud Storage & Audit History ({totalGenerations} total)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                All generated certificates are archived in DigitalOcean Spaces
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="py-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Loading audit history...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No certificate generation records found for this staff member yet.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto rounded border border-slate-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 text-center w-12">#</th>
                      <th className="p-2">Date & Time</th>
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
                          <td className="p-2 text-center font-bold text-blue-700">
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
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
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

        {/* Customization Drawer / Controls */}
        {showConfig && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <Label className="text-xs mb-1 block">Ref Number</Label>
              <Input
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="(Blank)"
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Ref Year</Label>
              <Input
                value={refYear}
                onChange={(e) => setRefYear(e.target.value)}
                placeholder="(Blank)"
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Certificate Date</Label>
              <Input
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
                placeholder="(Blank)"
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Name Prefix</Label>
              <Select value={prefix} onValueChange={setPrefix}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr.">Dr.</SelectItem>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Pronouns</Label>
              <Select value={pronounStyle} onValueChange={(v: "generic" | "gender") => setPronounStyle(v)}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generic (He / She, him/her)</SelectItem>
                  <SelectItem value="gender">Gender-specific ({staff.gender === "Female" ? "She, her" : "He, him"})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <Label className="text-xs mb-1 block">Department</Label>
              {departments && departments.length > 0 ? (
                <Select
                  value={customDepartment}
                  onValueChange={setCustomDepartment}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Select or type department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                    {customDepartment && !departments.some((d) => d.name === customDepartment) && (
                      <SelectItem value={customDepartment}>{customDepartment}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="e.g. Human Anatomy"
                  className="h-8 text-xs bg-white"
                />
              )}
            </div>
            <div className="sm:col-span-2 md:col-span-2">
              <Label className="text-xs mb-1 block">Designation / Post</Label>
              <Input
                value={customDesignation}
                onChange={(e) => setCustomDesignation(e.target.value)}
                placeholder="e.g. Assistant Professor"
                className="h-8 text-xs bg-white"
              />
            </div>

            {/* Salary Certificate Specific Controls */}
            {isSalaryCertificate && (
              <div className="sm:col-span-2 md:col-span-5 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/70 pb-2.5">
                  <div>
                    <h4 className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                      Salary Certificate Data &amp; Month Breakdown
                    </h4>
                    <p className="text-[11px] text-blue-800/80 mt-0.5">
                      Configure period, arrears, TDS, and deductions. Date ranges and totals auto-calculate in real time.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-blue-900">Period Preset:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSalaryEntries(generateDefaultSalaryRows(salaryStartYear, defaultMonthlySalary, defaultPt, defaultPf))
                      }}
                      className="h-6 text-[10px] px-2 bg-white"
                    >
                      Full FY (12 M)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const sixMonths = ["JUNE", "JULY", "AUG", "SEP", "OCT", "NOV"].map((m) => ({
                          month: m,
                          year: salaryStartYear,
                          consolidatedSalary: defaultMonthlySalary,
                          arrears: 0,
                          profTax: defaultPt,
                          provFund: defaultPf,
                          tds: 0,
                          otherDeduction: 0,
                          basic: Math.round(defaultMonthlySalary * 0.4),
                          da: Math.round(defaultMonthlySalary * 0.3),
                          hra: Math.round(defaultMonthlySalary * 0.15),
                          ta: 1600,
                          ma: 300,
                          otherAllowance: 0,
                        }))
                        setSalaryEntries(sixMonths)
                      }}
                      className="h-6 text-[10px] px-2 bg-white"
                    >
                      Jun - Nov (6 M)
                    </Button>
                    <Select
                      value={String(salaryStartYear)}
                      onValueChange={(val) => {
                        const yr = parseInt(val)
                        setSalaryStartYear(yr)
                        setSalaryEntries(generateDefaultSalaryRows(yr, defaultMonthlySalary, defaultPt, defaultPf))
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs bg-white border-blue-300 w-32 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            FY {y} - {y + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick Bulk Update Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white/90 p-2.5 rounded-lg border border-blue-200/60 items-end text-xs">
                  <div>
                    <Label className="text-[11px] font-medium text-slate-700 block mb-1">Monthly Salary (₹)</Label>
                    <Input
                      type="number"
                      value={defaultMonthlySalary}
                      onChange={(e) => setDefaultMonthlySalary(Number(e.target.value) || 0)}
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-medium text-slate-700 block mb-1">Prof. Tax (₹)</Label>
                    <Input
                      type="number"
                      value={defaultPt}
                      onChange={(e) => setDefaultPt(Number(e.target.value) || 0)}
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-medium text-slate-700 block mb-1">Prov. Fund (₹)</Label>
                    <Input
                      type="number"
                      value={defaultPf}
                      onChange={(e) => setDefaultPf(Number(e.target.value) || 0)}
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const updated = salaryEntries.map((r) => ({
                          ...r,
                          consolidatedSalary: defaultMonthlySalary,
                          profTax: defaultPt,
                          provFund: defaultPf,
                        }))
                        setSalaryEntries(updated)
                        toast({ title: "Applied", description: "Default salary applied to current rows." })
                      }}
                      className="h-7 text-xs w-full bg-blue-900 hover:bg-blue-800 text-white shadow-2xs"
                    >
                      Apply Defaults
                    </Button>
                  </div>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const lastYear = salaryEntries.length > 0 ? salaryEntries[salaryEntries.length - 1].year : salaryStartYear
                        const newRow: MonthlySalaryEntry = {
                          month: "MONTH",
                          year: lastYear,
                          consolidatedSalary: defaultMonthlySalary,
                          arrears: 0,
                          profTax: defaultPt,
                          provFund: defaultPf,
                          tds: 0,
                          otherDeduction: 0,
                          basic: Math.round(defaultMonthlySalary * 0.4),
                          da: Math.round(defaultMonthlySalary * 0.3),
                          hra: Math.round(defaultMonthlySalary * 0.15),
                          ta: 1600,
                          ma: 300,
                          otherAllowance: 0,
                        }
                        setSalaryEntries([...salaryEntries, newRow])
                      }}
                      className="h-7 text-xs w-full bg-white text-slate-700 border-dashed border-blue-400 hover:bg-blue-50"
                    >
                      + Add Month Row
                    </Button>
                  </div>
                </div>

                {/* Month-by-month editable table */}
                <div className="border border-blue-200/80 rounded-lg overflow-hidden bg-white max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-800 font-semibold border-b sticky top-0">
                      <tr>
                        <th className="p-1.5 text-left pl-2.5">Month</th>
                        <th className="p-1.5 text-center">Year</th>
                        <th className="p-1.5 text-right">Consolidated (₹)</th>
                        <th className="p-1.5 text-right">Arrears (₹)</th>
                        <th className="p-1.5 text-right">Prof Tax (₹)</th>
                        <th className="p-1.5 text-right">Prov Fund (₹)</th>
                        <th className="p-1.5 text-right">T.D.S (₹)</th>
                        <th className="p-1.5 text-right">Other Ded (₹)</th>
                        <th className="p-1.5 text-right">Net Salary (₹)</th>
                        <th className="p-1.5 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {salaryEntries.map((entry, idx) => {
                        const rowGross = (entry.consolidatedSalary || 0) + (entry.arrears || 0)
                        const rowDed = (entry.profTax || 0) + (entry.provFund || 0) + (entry.tds || 0) + (entry.otherDeduction || 0)
                        const rowNet = rowGross - rowDed

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-1 pl-2">
                              <input
                                type="text"
                                value={entry.month}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], month: e.target.value.toUpperCase() }
                                  setSalaryEntries(copy)
                                }}
                                className="w-16 px-1 py-0.5 border border-slate-300 rounded font-sans font-bold text-xs uppercase"
                              />
                            </td>
                            <td className="p-1 text-center">
                              <input
                                type="number"
                                value={entry.year}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], year: Number(e.target.value) || salaryStartYear }
                                  setSalaryEntries(copy)
                                }}
                                className="w-14 text-center px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                value={entry.consolidatedSalary}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], consolidatedSalary: Number(e.target.value) || 0 }
                                  setSalaryEntries(copy)
                                }}
                                className="w-20 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                value={entry.arrears || 0}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], arrears: Number(e.target.value) || 0 }
                                  setSalaryEntries(copy)
                                }}
                                className="w-16 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                value={entry.profTax}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], profTax: Number(e.target.value) || 0 }
                                  setSalaryEntries(copy)
                                }}
                                className="w-14 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                value={entry.provFund}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], provFund: Number(e.target.value) || 0 }
                                  setSalaryEntries(copy)
                                }}
                                className="w-16 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                value={entry.tds || 0}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], tds: Number(e.target.value) || 0 }
                                  setSalaryEntries(copy)
                                }}
                                className="w-14 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                value={entry.otherDeduction || 0}
                                onChange={(e) => {
                                  const copy = [...salaryEntries]
                                  copy[idx] = { ...copy[idx], otherDeduction: Number(e.target.value) || 0 }
                                  setSalaryEntries(copy)
                                }}
                                className="w-16 text-right px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="p-1 text-right font-bold text-slate-900 pr-2">
                              ₹{rowNet.toLocaleString("en-IN")}
                            </td>
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (salaryEntries.length > 1) {
                                    setSalaryEntries(salaryEntries.filter((_, i) => i !== idx))
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 font-bold px-1"
                                title="Delete row"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 pl-2.5 font-sans font-bold" colSpan={2}>TOTAL</td>
                        <td className="p-2 text-right">₹{totalConsolidated.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{totalArrears.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{totalProfTax.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{totalProvFund.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{totalTds.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{totalOtherDed.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right text-blue-900 font-bold pr-2">₹{totalNetWithArrears.toLocaleString("en-IN")}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="sm:col-span-2 md:col-span-5 flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Switch
                  id="letterhead-toggle"
                  checked={includeLetterhead}
                  onCheckedChange={setIncludeLetterhead}
                />
                <Label htmlFor="letterhead-toggle" className="text-xs cursor-pointer font-normal">
                  Include College Letterhead Header & Logo (Turn OFF if printing directly onto pre-printed stationary)
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Preview */}
        <div className="p-6 bg-gray-100 rounded-lg overflow-x-auto flex justify-center">
          <div
            ref={printRef}
            className="bg-white p-12 shadow-md rounded border border-gray-300 w-full max-w-[780px]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Optional College Letterhead with Logo */}
            {includeLetterhead && (
              <div className="letterhead-header border-b-2 border-double border-blue-900 pb-3 mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src="/college-logo.jpeg"
                    alt="College Logo"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div className="header-text flex-1 text-center pr-16">
                    <h1 className="text-lg font-bold text-[#182b49] tracking-wide uppercase leading-tight">
                      C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE<br />
                      <span className="text-base font-bold">&amp; RESEARCH CENTRE</span>
                    </h1>
                    <h2 className="text-xs font-medium text-gray-700 mt-1">
                      (Managed by: Vyara Pradesh Seva Samiti)
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!includeLetterhead && <div className="h-10"></div>}

            {/* Reference & Date Line */}
            <div className="ref-date-row flex justify-between text-sm text-black mb-8">
              <span>Ref. No. {formattedRefNumber}</span>
              <span>Date: {formattedCertDate}</span>
            </div>

            {/* Dynamic Certificate Body */}
            <div
              className="certificate-rendered-body text-black text-sm"
              dangerouslySetInnerHTML={{ __html: getResolvedCertificateBody() }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
