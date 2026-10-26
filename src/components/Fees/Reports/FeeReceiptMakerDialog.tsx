"use client"

import { useCan } from "@/permissions/useCan"
import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Printer,
  Download,
  ReceiptText,
  Search,
  User,
  CheckCircle2,
  Sparkles,
  FileCheck,
  Building,
  CreditCard,
  Layers,
  Coins,
  Plus,
  Trash2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import ApiService from "@/services/ApiService"
import FlexiblePaymentDialog from "@/components/Fees/PayFees/FlexiblePaymentDialog"
import { useGetAllFeesTypeQuery } from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectCurrentSchool, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { renderCNKHMCPageHtml, renderHostelPageHtml, renderMessPageHtml, numberToWordsIndianFormatted } from "./CNKHMCFeeReceiptView"

// ─── Number to Indian Words Helper ────────────────────────────────────────────

export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "Zero Rupees Only"
  const integerPart = Math.floor(Math.abs(num))
  if (integerPart === 0) return "Zero Rupees Only"

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return ""
    if (n < 20) return units[n]
    const t = Math.floor(n / 10)
    const u = n % 10
    return (tens[t] + (u > 0 ? " " + units[u] : "")).trim()
  }

  const convertThreeDigits = (n: number): string => {
    const h = Math.floor(n / 100)
    const rem = n % 100
    let res = ""
    if (h > 0) {
      res += units[h] + " Hundred"
      if (rem > 0) res += " "
    }
    if (rem > 0) {
      res += convertTwoDigits(rem)
    }
    return res.trim()
  }

  const crore = Math.floor(integerPart / 10000000)
  const remAfterCrore = integerPart % 10000000

  const lakh = Math.floor(remAfterCrore / 100000)
  const remAfterLakh = remAfterCrore % 100000

  const thousand = Math.floor(remAfterLakh / 1000)
  const remAfterThousand = remAfterLakh % 1000

  let words = ""
  if (crore > 0) words += convertTwoDigits(crore) + " Crore "
  if (lakh > 0) words += convertTwoDigits(lakh) + " Lakh "
  if (thousand > 0) words += convertTwoDigits(thousand) + " Thousand "
  if (remAfterThousand > 0) words += convertThreeDigits(remAfterThousand) + " "

  return ("Rupees " + words.trim() + " Only").replace(/\s+/g, " ")
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FeeReceiptTemplateItem {
  id: number
  name: string
  code: string | null
  content: string
  description: string | null
  is_active: boolean
}

export interface FeeReceiptItem {
  id?: string | number
  title: string
  amount: number
}

export interface FeeReceiptMakerDialogProps {
  isOpen: boolean
  onClose: () => void
  studentId?: number | null
  studentData?: any
  paymentData?: any
  initialFeeType?: string
  initialCourse?: string
  initialTemplateCode?: string
  initialFeePlanId?: number | string
  onReceiptIssued?: (receiptMeta: any) => void
}

// ─── Receipt Serial Number Helper (0000 - 9999) ──────────────────────────────
export const getReceiptSerial = (ymd: string): string => {
  try {
    const key = `cnkhmc_receipt_seq_${ymd}`
    const saved = localStorage.getItem(key)
    const seq = saved !== null ? parseInt(saved, 10) : 0
    return String(Math.min(9999, Math.max(0, seq))).padStart(4, "0")
  } catch {
    return "0000"
  }
}

export const advanceReceiptSerial = (ymd: string, currentReceiptNo?: string) => {
  try {
    const key = `cnkhmc_receipt_seq_${ymd}`
    let nextSeq = 1
    if (currentReceiptNo) {
      const match = currentReceiptNo.match(/-(\d{4})$/)
      if (match) {
        const num = parseInt(match[1], 10)
        nextSeq = (num + 1) % 10000
      }
    } else {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        nextSeq = (parseInt(saved, 10) + 1) % 10000
      }
    }
    localStorage.setItem(key, String(nextSeq))
  } catch (e) {
    console.warn("Could not advance receipt serial in localStorage:", e)
  }
}

export const FeeReceiptMakerDialog: React.FC<FeeReceiptMakerDialogProps> = ({
  isOpen,
  onClose,
  studentId,
  studentData,
  paymentData,
  initialFeeType,
  initialCourse,
  initialTemplateCode,
  initialFeePlanId,
  onReceiptIssued,
}) => {
  const activeSchool = useAppSelector(selectCurrentSchool)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const { can: canFees } = useCan()
  const { data: allFeeTypes } = useGetAllFeesTypeQuery(
    { academic_session_id: currentAcademicSession?.id || 0, applicable_to: "All" },
    { skip: !currentAcademicSession?.id },
  )
  const getFeeTypeName = (feeTypeId: number): string =>
    allFeeTypes?.find((t: any) => t.id === feeTypeId)?.name || `Fee Type ${feeTypeId}`
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // ── States ──────────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<FeeReceiptTemplateItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Fee Plans (Fee Templates)
  const [feePlans, setFeePlans] = useState<any[]>([])
  const [selectedFeePlanId, setSelectedFeePlanId] = useState<string>(
    initialFeePlanId ? String(initialFeePlanId) : ""
  )
  const [isLoadingFeePlans, setIsLoadingFeePlans] = useState(false)
  const [feeItems, setFeeItems] = useState<FeeReceiptItem[]>([])

  // Student selection & search
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchingStudents, setIsSearchingStudents] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentFeeHistory, setStudentFeeHistory] = useState<any>(null)
  const [studentFeeFull, setStudentFeeFull] = useState<any>(null)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false)

  // Receipt form fields
  const [receiptNo, setReceiptNo] = useState("")
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0])
  const [course, setCourse] = useState<string>(initialCourse || "BHMS")
  const [feeType, setFeeType] = useState(initialFeeType || "Tuition Fee")
  const [hostelName, setHostelName] = useState("Kantaba Girls Hostel")
  const [installmentNo, setInstallmentNo] = useState("1")
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [amountInWords, setAmountInWords] = useState("")
  const [paymentMode, setPaymentMode] = useState("Cash")
  const [transactionRef, setTransactionRef] = useState("")
  const [bankName, setBankName] = useState("")
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split("T")[0])
  const [totalFees, setTotalFees] = useState<number>(0)
  const [balanceDue, setBalanceDue] = useState<number>(0)
  const [concessionAmount, setConcessionAmount] = useState<number>(0)
  const [remarks, setRemarks] = useState("Academic Year Fee Payment")
  const [includeSignatures, setIncludeSignatures] = useState(true)

  // Sync initialFeeType when dialog opens
  useEffect(() => {
    if (isOpen && initialFeeType) {
      setFeeType(initialFeeType)
      if (initialFeeType.toLowerCase().includes("hostel")) {
        setSelectedTemplateId("-98")
        if (remarks === "Academic Year Fee Payment") {
          setRemarks("-")
        }
      }
    }
  }, [isOpen, initialFeeType])


  // Generate default receipt number: RCP-YYYYMMDD-XXXX (Serial 0000 to 9999)
  const generateDefaultReceiptNo = (customDateStr?: string) => {
    const today = new Date()
    const dStr = customDateStr || today.toISOString().split("T")[0]
    const ymd = dStr.replace(/-/g, "")
    const serial = getReceiptSerial(ymd)
    return `RCP-${ymd}-${serial}`
  }

  // ── Load Templates ──────────────────────────────────────────────────────────
  const fetchTemplates = async () => {
    const officialCnkTemplate: FeeReceiptTemplateItem = {
      id: -99,
      name: "C. N. Kothari Official Receipt (Dual Copy Form)",
      code: "CNKHMC_OFFICIAL",
      content: "CNKHMC_OFFICIAL_DUAL_PAGE",
      description: "Official college dual copy format matching cnkothari.emli.in PDF with cutting line",
      is_active: true,
    }

    const officialHostelTemplate: FeeReceiptTemplateItem = {
      id: -98,
      name: "Kantaba Girls Hostel Official Receipt (Dual Copy Form)",
      code: "CNKHMC_HOSTEL_OFFICIAL",
      content: "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE",
      description: "Official hostel dual copy format matching Kantaba Girls Hostel PDF with cutting line",
      is_active: true,
    }

    const officialMessTemplate: FeeReceiptTemplateItem = {
      id: -97,
      name: "Rama Harshad Mess Official Receipt (Dual Copy Form)",
      code: "CNKHMC_MESS_OFFICIAL",
      content: "CNKHMC_MESS_OFFICIAL_DUAL_PAGE",
      description: "Official mess dual copy format matching Rama Harshad Mess with cutting line",
      is_active: true,
    }

    try {
      setIsLoadingTemplates(true)
      const res = await ApiService.get("fee-receipt-templates")
      let list: FeeReceiptTemplateItem[] = []
      if (res?.data?.success && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (Array.isArray(res?.data)) {
        list = res.data
      }

      const hasOfficial = list.some(
        (t) => t.code === "CNKHMC_OFFICIAL" || t.name.includes("C. N. Kothari Official")
      )
      const hasHostel = list.some(
        (t) => t.code === "CNKHMC_HOSTEL_OFFICIAL" || t.name.includes("Kantaba Girls Hostel")
      )
      const hasMess = list.some(
        (t) => t.code === "CNKHMC_MESS_OFFICIAL" || t.name.includes("Hostel Mess") || t.name.includes("Mess Official")
      )
      const extraDefaults: FeeReceiptTemplateItem[] = []
      if (!hasOfficial) extraDefaults.push(officialCnkTemplate)
      if (!hasHostel) extraDefaults.push(officialHostelTemplate)
      if (!hasMess) extraDefaults.push(officialMessTemplate)

      const combined = [...extraDefaults, ...list]
      setTemplates(combined)

      const isMessCategory =
        initialFeeType?.toLowerCase().includes("mess") ||
        initialTemplateCode === "CNKHMC_MESS_OFFICIAL"

      const isHostelCategory =
        !isMessCategory && (
          initialFeeType?.toLowerCase().includes("hostel") ||
          initialTemplateCode === "CNKHMC_HOSTEL_OFFICIAL"
        )

      if (isMessCategory) {
        const mTpl = combined.find((t) => t.code === "CNKHMC_MESS_OFFICIAL")
        if (mTpl) {
          setSelectedTemplateId(String(mTpl.id))
          return
        }
      }

      if (isHostelCategory) {
        const hTpl = combined.find((t) => t.code === "CNKHMC_HOSTEL_OFFICIAL")
        if (hTpl) {
          setSelectedTemplateId(String(hTpl.id))
          return
        }
      }

      if (!selectedTemplateId || selectedTemplateId === "-99") {
        const defaultTpl = combined.find((t) => t.code === "CNKHMC_OFFICIAL") || combined[0]
        if (defaultTpl) setSelectedTemplateId(String(defaultTpl.id))
      }
    } catch {
      setTemplates([officialCnkTemplate, officialHostelTemplate, officialMessTemplate])
      if (initialFeeType?.toLowerCase().includes("mess")) {
        setSelectedTemplateId(String(officialMessTemplate.id))
      } else if (initialFeeType?.toLowerCase().includes("hostel")) {
        setSelectedTemplateId(String(officialHostelTemplate.id))
      } else {
        setSelectedTemplateId(String(officialCnkTemplate.id))
      }
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  // ── Load Fee Plans (Fee Templates) ───────────────────────────────────────────
  const fetchFeePlans = async () => {
    if (!currentAcademicSession?.id) return
    try {
      setIsLoadingFeePlans(true)
      const res = await ApiService.get(
        `feesplan?academic_session=${currentAcademicSession.id}&status=Active&limit=50`
      )
      let list: any[] = []
      if (res?.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data
      } else if (Array.isArray(res?.data)) {
        list = res.data
      }
      setFeePlans(list)
    } catch (err) {
      console.error("Failed to load fee plans:", err)
    } finally {
      setIsLoadingFeePlans(false)
    }
  }

  // ── Fee Plan Selection Handler ──────────────────────────────────────────────
  const handleSelectFeePlan = async (
    planId: string,
    currentInstallment: string = installmentNo,
    plansList: any[] = feePlans
  ) => {
    setSelectedFeePlanId(planId)
    if (!planId || planId === "custom") {
      return
    }

    let selectedPlan = (plansList && plansList.length > 0 ? plansList : feePlans).find(
      (p) => String(p.id) === String(planId)
    )

    let details = selectedPlan?.fees_detail
    try {
      const detailRes = await ApiService.get(
        `feesplan/detail/${planId}?academic_session=${currentAcademicSession?.id || ""}`
      )
      const data = detailRes?.data?.data || detailRes?.data
      if (data?.fees_plan) {
        selectedPlan = data.fees_plan
      }
      if (data?.fees_types && Array.isArray(data.fees_types)) {
        details = data.fees_types.map((ft: any) => ({
          ...ft.fees_type,
          fees_type: ft.fees_type?.fees_type || ft.fees_type,
          installment_breakDowns: ft.installment_breakDowns,
        }))
      }
    } catch (e) {
      console.warn("Could not fetch detailed breakdown for plan:", e)
    }

    if (!selectedPlan) return

    if (details && details.length > 0) {
      const instNum = parseInt(currentInstallment, 10) || 1
      const items: FeeReceiptItem[] = details.map((d: any) => {
        const typeName = d.fees_type?.name || d.name || "Fee Component"
        let compAmt = Number(d.total_amount || 0)

        if (d.installment_breakDowns && Array.isArray(d.installment_breakDowns) && d.installment_breakDowns.length > 0) {
          const matchingInst = d.installment_breakDowns.find((ib: any) => Number(ib.installment_no) === instNum)
          if (matchingInst && matchingInst.installment_amount) {
            compAmt = Number(matchingInst.installment_amount)
          } else if (d.total_installment && d.total_installment > 1) {
            compAmt = Math.round(Number(d.total_amount) / d.total_installment)
          }
        } else if (d.total_installment && d.total_installment > 1) {
          compAmt = Math.round(Number(d.total_amount) / d.total_installment)
        }

        return {
          id: d.id,
          title: typeName,
          amount: compAmt,
        }
      })

      setFeeItems(items)
      const totalItemsAmt = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      setAmountPaid(totalItemsAmt)
      setBalanceDue(Math.max(0, Number(selectedPlan.total_amount || totalItemsAmt) - totalItemsAmt))
      if (items.length === 1) {
        setFeeType(items[0].title)
      } else {
        setFeeType(selectedPlan.name || "Tuition & College Fees")
      }
    } else if (selectedPlan.total_amount) {
      const tot = Number(selectedPlan.total_amount)
      setFeeItems([
        {
          id: selectedPlan.id,
          title: selectedPlan.name || "TUTION FEE-M/G",
          amount: tot,
        },
      ])
      setAmountPaid(tot)
      setBalanceDue(0)
      setFeeType(selectedPlan.name)
    }
  }

  // ── Modify Fee Components ───────────────────────────────────────────────────
  const handleFeeItemChange = (index: number, field: "title" | "amount", value: any) => {
    setFeeItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: field === "amount" ? Number(value) || 0 : value,
      }
      if (field === "amount") {
        const sum = updated.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
        setAmountPaid(sum)
        setBalanceDue(Math.max(0, totalFees - sum))
      }
      return updated
    })
  }

  const handleAddFeeItem = () => {
    setFeeItems((prev) => [
      ...prev,
      { id: Date.now(), title: prev.length === 0 ? (feeType || "Tuition Fee") : "Additional Fee", amount: 0 },
    ])
  }

  const handleRemoveFeeItem = (index: number) => {
    setFeeItems((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      const sum = updated.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
      setAmountPaid(sum)
      setBalanceDue(Math.max(0, totalFees - sum))
      return updated
    })
  }

  const handleAmountPaidChange = (newAmount: number) => {
    setAmountPaid(newAmount)
    setBalanceDue(Math.max(0, totalFees - newAmount))
    if (feeItems.length === 1) {
      setFeeItems([{ ...feeItems[0], amount: newAmount }])
    } else if (feeItems.length === 0 && newAmount > 0) {
      setFeeItems([{ id: Date.now(), title: feeType || "Tuition Fee", amount: newAmount }])
    }
  }

  // ── Auto-update amount in words whenever amountPaid changes ──────────────────
  useEffect(() => {
    setAmountInWords(numberToWordsIndian(amountPaid))
  }, [amountPaid])

  // ── Load student details when studentId is passed ────────────────────────────
  const loadStudentDetails = async (id: number) => {
    try {
      setIsLoadingStudentDetails(true)
      const academicParam = currentAcademicSession?.id
        ? `?academic_session=${currentAcademicSession.id}&academic_year=${currentAcademicSession.id}`
        : ""

      let sObj: any = null
      try {
        const res = await ApiService.get(`student/detail/${id}${academicParam}`)
        if (res?.data?.success && res.data.data) {
          sObj = res.data.data
        } else if (res?.data?.student) {
          sObj = res.data.student
        } else if (res?.data) {
          sObj = res.data
        }
      } catch {
        const res = await ApiService.get(`student/${id}${academicParam}`)
        sObj = res?.data?.data || res?.data
      }

      if (sObj) {
        const flatStudent = sObj.student ? { ...sObj.student, ...sObj } : sObj
        const className =
          flatStudent.class_name ||
          flatStudent.division?.class?.class ||
          flatStudent.division?.division ||
          flatStudent.academic_class?.[0]?.division?.class?.class ||
          flatStudent.academic_class?.[0]?.division?.division ||
          flatStudent.division_name ||
          ""

        const quotaName =
          flatStudent.quota?.name ||
          sObj.quota?.name ||
          flatStudent.academic_class?.[0]?.quota?.name ||
          ""

        const updatedStudent = {
          ...flatStudent,
          // The merge above can let a wrapper object's own `id` overwrite the student's id,
          // so always pin it to the id that was searched/selected.
          id,
          class_name: className,
          quota_name: quotaName,
          quota_id: flatStudent.quota_id || sObj.quota_id || flatStudent.academic_class?.[0]?.quota_id,
          enrollment_no: flatStudent.enrollment_code || flatStudent.enrollment_no,
        }
        setSelectedStudent(updatedStudent)

        // Ensure active fee plans list is available
        let currentPlans = feePlans
        if (!currentPlans || currentPlans.length === 0) {
          try {
            const planRes = await ApiService.get(
              `feesplan?academic_session=${currentAcademicSession?.id || 2026}&status=Active&limit=50`
            )
            const list = planRes?.data?.data || (Array.isArray(planRes?.data) ? planRes.data : [])
            if (Array.isArray(list) && list.length > 0) {
              currentPlans = list
              setFeePlans(list)
            }
          } catch (e) {
            console.warn("Could not load fee plans inline:", e)
          }
        }

        // Auto-fetch fee status if available
        let targetPlanId: string | number | null = null
        try {
          const feesParam = currentAcademicSession?.id ? `?academic_year=${currentAcademicSession.id}` : ""
          const feesRes = await ApiService.get(`fees/status/student/${id}${feesParam}`)
          const feeData =
            feesRes?.data?.data ||
            feesRes?.data?.student?.fees_status ||
            feesRes?.data?.fees_status ||
            feesRes?.data
          setStudentFeeFull(feesRes?.data?.installments ? feesRes.data : feesRes?.data?.data || null)
          if (feeData) {
            setStudentFeeHistory(feeData)
            const tot = Number(feeData.total_amount || 0)
            const paid = Number(feeData.paid_amount || 0)
            const due = Number(feeData.due_amount !== undefined ? feeData.due_amount : Math.max(0, tot - paid))
            if (tot > 0) {
              setTotalFees(tot)
              setBalanceDue(due)
              if (due > 0 && due <= tot) {
                setAmountPaid(due)
              }
            }

            targetPlanId =
              feesRes?.data?.detail?.fees_plan?.id ||
              feesRes?.data?.student?.fees_status?.fees_plan_id ||
              feeData.fees_plan_id ||
              feeData.fees_plan?.id ||
              null
          }
        } catch {
          // ignore error
        }

        // If targetPlanId wasn't found in fee status, check student object
        if (!targetPlanId) {
          targetPlanId =
            sObj?.fees_status?.fees_plan_id ||
            sObj?.fees_status?.fees_plan?.id ||
            sObj?.student?.fees_status?.fees_plan_id ||
            null
        }

        // Fallback: match by Student's assigned Quota and Class
        const studentQuotaId =
          updatedStudent.quota_id ||
          sObj?.quota_id ||
          sObj?.quota?.id ||
          sObj?.student?.academic_class?.[0]?.quota_id

        const studentClassId =
          sObj?.division?.class_id ||
          sObj?.class_id ||
          sObj?.academic_class?.[0]?.division?.class_id ||
          flatStudent?.class_id

        if (!targetPlanId && studentQuotaId && currentPlans.length > 0) {
          const matchingPlan =
            currentPlans.find(
              (p: any) =>
                Number(p.quota_id) === Number(studentQuotaId) &&
                (!studentClassId || Number(p.class_id) === Number(studentClassId))
            ) ||
            currentPlans.find((p: any) => Number(p.quota_id) === Number(studentQuotaId)) ||
            (studentClassId ? currentPlans.find((p: any) => Number(p.class_id) === Number(studentClassId)) : null)

          if (matchingPlan) {
            targetPlanId = matchingPlan.id
          }
        }

        // Automatically select the Fee Plan / Template and populate components
        if (targetPlanId) {
          await handleSelectFeePlan(String(targetPlanId), installmentNo, currentPlans)
        }
      }
    } catch {
      toast({
        title: "Student load error",
        description: "Could not load full student details.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStudentDetails(false)
    }
  }

  // ── Helper to select a student from search results ───────────────────────────
  const handleSelectStudent = (st: any) => {
    const className =
      st.class_name ||
      st.academic_class?.[0]?.division?.class?.class ||
      st.academic_class?.[0]?.division?.division ||
      st.division_name ||
      ""
    const preparedStudent = {
      ...st,
      class_name: className,
      enrollment_no: st.enrollment_code || st.enrollment_no,
    }
    if (st.course) {
      setCourse(st.course)
    }
    setSelectedStudent(preparedStudent)
    setStudentFeeHistory(null)
    setStudentFeeFull(null)
    setSearchResults([])
    setStudentSearchQuery("")
    loadStudentDetails(st.id)
  }

  // Initialize on dialog open
  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
      fetchFeePlans()
      if (paymentData?.receipt_no) {
        setReceiptNo(String(paymentData.receipt_no))
      } else if (paymentData?.id) {
        const today = new Date()
        const ymd = today.toISOString().split("T")[0].replace(/-/g, "")
        setReceiptNo(`RCP-${ymd}-${String(paymentData.id).padStart(4, "0")}`)
      } else {
        setReceiptNo(generateDefaultReceiptNo())
      }
      setReceiptDate(new Date().toISOString().split("T")[0])

      if (initialCourse) {
        setCourse(initialCourse)
      } else if (paymentData?.course) {
        setCourse(paymentData.course)
      } else if (studentData?.course) {
        setCourse(studentData.course)
      }

      if (initialFeePlanId) {
        handleSelectFeePlan(String(initialFeePlanId))
      }

      if (studentData) {
        setSelectedStudent(studentData)
        if (studentData.id) {
          loadStudentDetails(studentData.id)
        }
      } else if (studentId) {
        loadStudentDetails(studentId)
      }

      if (paymentData) {
        if (paymentData.amount || paymentData.paid_amount) {
          const amt = Number(paymentData.amount || paymentData.paid_amount)
          setAmountPaid(amt)
          setAmountInWords(numberToWordsIndian(amt))
          setFeeItems([
            {
              id: paymentData.id || 1,
              title: paymentData.fee_type_name || initialFeeType || "Tuition Fee",
              amount: amt,
            },
          ])
          setTotalFees(amt)
          setBalanceDue(0)
        }
        if (paymentData.payment_mode) setPaymentMode(paymentData.payment_mode)
        if (paymentData.transaction_reference || paymentData.transaction_id) {
          setTransactionRef(paymentData.transaction_reference || paymentData.transaction_id)
        }
        if (paymentData.installment_no) setInstallmentNo(String(paymentData.installment_no))
        if (paymentData.fee_type_name) setFeeType(paymentData.fee_type_name)
      } else if (!initialFeePlanId) {
        setFeeItems([])
        setAmountPaid(0)
        setTotalFees(0)
        setBalanceDue(0)
        setAmountInWords("")
        setSelectedFeePlanId("")
      }
    }
  }, [isOpen, studentId, studentData, paymentData, initialCourse, initialFeePlanId, currentAcademicSession?.id])

  // ── Student Search Logic ────────────────────────────────────────────────────
  useEffect(() => {
    if (!studentSearchQuery || studentSearchQuery.trim().length < 1) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingStudents(true)
        const q = studentSearchQuery.trim()
        const res = await ApiService.get(
          `student/search?query=${encodeURIComponent(q)}&detailed=true`
        )
        let list: any[] = []
        if (Array.isArray(res?.data)) {
          list = res.data
        } else if (res?.data?.success && Array.isArray(res.data.data)) {
          list = res.data.data
        } else if (Array.isArray(res?.data?.students)) {
          list = res.data.students
        } else if (Array.isArray(res?.data?.data)) {
          list = res.data.data
        }
        setSearchResults(list)
      } catch (err) {
        console.error("Student search failed:", err)
        setSearchResults([])
      } finally {
        setIsSearchingStudents(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [studentSearchQuery])

  // ── Active Selected Template ────────────────────────────────────────────────
  const activeTemplate = useMemo(() => {
    return templates.find((t) => String(t.id) === String(selectedTemplateId)) || templates[0] || null
  }, [templates, selectedTemplateId])

  // ── Active Selected Fee Plan ────────────────────────────────────────────────
  const selectedPlanObj = useMemo(() => {
    return feePlans.find((p) => String(p.id) === String(selectedFeePlanId)) || null
  }, [feePlans, selectedFeePlanId])

  // ── Compute Formatted Values for Merge Tags ─────────────────────────────────
  const studentFullName = useMemo(() => {
    if (!selectedStudent) return "Student Full Name"
    return [
      selectedStudent.first_name,
      selectedStudent.middle_name,
      selectedStudent.last_name,
    ]
      .filter(Boolean)
      .join(" ")
  }, [selectedStudent])

  const studentGrNo = useMemo(() => {
    return String(selectedStudent?.gr_no || selectedStudent?.enrollment_no || selectedStudent?.enrollment_code || "GR-0000")
  }, [selectedStudent])

  const studentEnrollmentNo = useMemo(() => {
    return String(selectedStudent?.enrollment_code || selectedStudent?.enrollment_no || selectedStudent?.gr_no || "ENR-0000")
  }, [selectedStudent])

  const studentClass = useMemo(() => {
    if (selectedStudent?.class_name) return selectedStudent.class_name
    if (selectedStudent?.division_name) return selectedStudent.division_name
    if (selectedStudent?.academic_class && selectedStudent.academic_class.length > 0) {
      const enr = selectedStudent.academic_class[0]
      return enr?.division?.class?.class || enr?.division?.division || enr?.division?.name || "BHMS Course"
    }
    if (selectedStudent?.enrollments && selectedStudent.enrollments.length > 0) {
      const enr = selectedStudent.enrollments[0]
      return enr?.class?.class || enr?.division?.division || "BHMS Course"
    }
    if (selectedStudent?.division) {
      return selectedStudent.division?.class?.class || selectedStudent.division?.division || "BHMS Course"
    }
    return "BHMS"
  }, [selectedStudent])

  const studentQuota = useMemo(() => {
    return (
      selectedStudent?.quota?.name ||
      selectedStudent?.quota_name ||
      (selectedStudent?.quota_id === 1
        ? "Government Quota"
        : selectedStudent?.quota_id === 2
        ? "Management Quota"
        : selectedStudent?.quota_id === 3
        ? "NRI Quota"
        : null) ||
      selectedStudent?.academic_class?.[0]?.quota?.name ||
      null
    )
  }, [selectedStudent])

  const academicSessionName = useMemo(() => {
    return (
      selectedStudent?.academic_session?.session ||
      currentAcademicSession?.session ||
      "2025-2026"
    )
  }, [selectedStudent, currentAcademicSession])

  const collegeName = activeSchool?.name || "C. N. Kothari Homoeopathic Medical College & Research Centre, Vyara"
  const collegeAddress = activeSchool?.address || "Station Road, Vyara, Tapi, Gujarat - 394650"
  const collegePhone = activeSchool?.contact_number ? String(activeSchool.contact_number) : "+91 2626 220264"
  const collegeEmail = activeSchool?.email || "info@cnkhmc.edu.in"

  // ── Render Breakdown Table ──────────────────────────────────────────────────
  const generatedBreakdownTable = useMemo(() => {
    const itemsToRender =
      feeItems && feeItems.length > 0
        ? feeItems
        : [{ title: feeType, amount: amountPaid }]
    return `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;border:1px solid #cbd5e1;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:1.5px solid #94a3b8;">
            <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:left;font-weight:600;color:#1e293b;">Fee Component</th>
            <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;font-weight:600;color:#1e293b;">Installment</th>
            <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:right;font-weight:600;color:#1e293b;">Amount Paid (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsToRender
            .map(
              (item) => `
            <tr>
              <td style="border:1px solid #cbd5e1;padding:8px 12px;color:#334155;">${item.title}</td>
              <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;color:#334155;">#${installmentNo}</td>
              <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:right;font-weight:600;color:#0f172a;">${Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `
            )
            .join("")}
          ${concessionAmount > 0 ? `
          <tr style="background:#fef2f2;">
            <td style="border:1px solid #cbd5e1;padding:6px 12px;color:#b91c1c;">Concession / Scholarship Discount</td>
            <td style="border:1px solid #cbd5e1;padding:6px 12px;text-align:center;color:#b91c1c;">-</td>
            <td style="border:1px solid #cbd5e1;padding:6px 12px;text-align:right;font-weight:600;color:#b91c1c;">- ${concessionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>` : ""}
          <tr style="background:#f1f5f9;font-weight:bold;border-top:2px solid #94a3b8;">
            <td style="border:1px solid #cbd5e1;padding:8px 12px;color:#0f172a;" colspan="2">Total Received Amount</td>
            <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:right;color:#0f172a;font-size:14px;">₹ ${amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    `
  }, [feeItems, feeType, installmentNo, amountPaid, concessionAmount])

  // ── Render Signatures Block ─────────────────────────────────────────────────
  const generatedSignaturesBlock = useMemo(() => {
    if (!includeSignatures) return ""
    return `
      <div style="margin-top:60px;display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
        <div style="text-align:center;min-width:200px;">
          <div style="border-bottom:1.5px dashed #475569;width:160px;margin:0 auto 8px auto;"></div>
          <p style="font-size:13px;font-weight:bold;margin:0;color:#0f172a;">Cashier / Accounts Officer</p>
          <p style="font-size:11px;margin:3px 0 0 0;color:#64748b;">${collegeName}</p>
        </div>
        <div style="text-align:center;min-width:200px;">
          <div style="border-bottom:1.5px dashed #475569;width:160px;margin:0 auto 8px auto;"></div>
          <p style="font-size:13px;font-weight:bold;margin:0;color:#0f172a;">Principal / Authorised Signatory</p>
          <p style="font-size:11px;margin:3px 0 0 0;color:#64748b;">${collegeName}</p>
        </div>
      </div>
    `
  }, [includeSignatures, collegeName])

  // ── Render Full Template HTML ───────────────────────────────────────────────
  const compiledReceiptHtml = useMemo(() => {
    if (!activeTemplate) return "<p>No template selected</p>"

    const isMess =
      activeTemplate.code === "CNKHMC_MESS_OFFICIAL" ||
      activeTemplate.content === "CNKHMC_MESS_OFFICIAL_DUAL_PAGE" ||
      activeTemplate.name?.toLowerCase().includes("hostel mess") ||
      activeTemplate.name?.toLowerCase().includes("mess official") ||
      (activeTemplate.name?.toLowerCase().includes("mess") && !activeTemplate.name?.toLowerCase().includes("c. n. kothari")) ||
      feeType?.toLowerCase().includes("mess")

    if (isMess) {
      return renderMessPageHtml({
        studentName: studentFullName,
        sid: studentEnrollmentNo || studentGrNo || "0101010120200034",
        level: studentClass || "4th Year",
        receiptNo: receiptNo || "1435",
        course: course || "BHMS Old Curriculum",
        academicYear: academicSessionName || "2023 - 2025",
        term: installmentNo || "1",
        date: receiptDate,
        feeItems:
          feeItems && feeItems.length > 0
            ? feeItems.map((item) => ({ title: item.title, amount: item.amount }))
            : [{ title: "MESS FEE", amount: amountPaid }],
        totalAmount: amountPaid,
        amountInWords: amountInWords || numberToWordsIndianFormatted(amountPaid),
        paymentMode: paymentMode || "Cheque",
        bankName: bankName,
        transactionRef: transactionRef,
        chequeDate: paymentMode === "Cheque" ? chequeDate : undefined,
        paymentDate: receiptDate,
        remark: remarks || "-",
        messName: "Rama Harshad Mess",
        messPhone: "02626-221095",
        isMess: true,
      })
    }

    const isHostel =
      !isMess && (
        activeTemplate.code === "CNKHMC_HOSTEL_OFFICIAL" ||
        activeTemplate.content === "CNKHMC_HOSTEL_OFFICIAL_DUAL_PAGE" ||
        activeTemplate.name?.toLowerCase().includes("kantaba girls hostel") ||
        (activeTemplate.name?.toLowerCase().includes("hostel") && !activeTemplate.name?.toLowerCase().includes("c. n. kothari")) ||
        feeType?.toLowerCase().includes("hostel")
      )

    if (isHostel) {
      return renderHostelPageHtml({
        studentName: studentFullName,
        sid: studentEnrollmentNo || studentGrNo || "0101010120200034",
        level: studentClass || "4th Year",
        receiptNo: receiptNo || "1434",
        course: course || "BHMS Old Curriculum",
        academicYear: academicSessionName || "2023 - 2025",
        term: installmentNo || "1",
        date: receiptDate,
        feeItems:
          feeItems && feeItems.length > 0
            ? feeItems.map((item) => ({ title: item.title, amount: item.amount }))
            : [{ title: "HOSTEL FEE", amount: amountPaid }],
        totalAmount: amountPaid,
        amountInWords: amountInWords || numberToWordsIndianFormatted(amountPaid),
        paymentMode: paymentMode || "Cheque",
        bankName: bankName,
        transactionRef: transactionRef,
        chequeDate: paymentMode === "Cheque" ? chequeDate : undefined,
        paymentDate: receiptDate,
        remark: remarks || "-",
        hostelName: hostelName || "Kantaba Girls Hostel",
        hostelPhone: "02626-221095",
        isHostel: true,
      })
    }

    const isOfficial =
      activeTemplate.code === "CNKHMC_OFFICIAL" ||
      activeTemplate.content === "CNKHMC_OFFICIAL_DUAL_PAGE" ||
      activeTemplate.name?.toLowerCase().includes("c. n. kothari official")

    if (isOfficial) {
      return renderCNKHMCPageHtml({
        studentName: studentFullName,
        sid: studentEnrollmentNo || studentGrNo || "0101010120210057",
        level: studentClass || "3rd Year",
        receiptNo: receiptNo || "7516",
        course: course || "BHMS",
        academicYear: academicSessionName || "2023-2024",
        term: installmentNo || "2",
        date: receiptDate,
        feeItems:
          feeItems && feeItems.length > 0
            ? feeItems.map((item) => ({ title: item.title, amount: item.amount }))
            : [{ title: feeType || "TUTION FEE-M/G", amount: amountPaid }],
        totalAmount: amountPaid,
        amountInWords: amountInWords || numberToWordsIndianFormatted(amountPaid),
        paymentMode: paymentMode || "NEFT/RTGS",
        bankName: bankName,
        transactionRef: transactionRef,
        chequeDate: paymentMode === "Cheque" ? chequeDate : undefined,
        paymentDate: receiptDate,
        remark: remarks,
      })
    }

    let content = activeTemplate.content || ""

    // Format Date: DD/MM/YYYY
    const dParts = receiptDate.split("-")
    const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : receiptDate

    // Merge Tags Replacement Map
    const replacements: Record<string, string> = {
      // Student
      "{{student_name}}": `<strong style="color:#0f172a;">${studentFullName}</strong>`,
      "{{gr_no}}": `<strong style="color:#0f172a;">${studentGrNo}</strong>`,
      "{{enrollment_no}}": `<strong style="color:#0f172a;">${studentEnrollmentNo}</strong>`,
      "{{class}}": `<strong style="color:#0f172a;">${studentClass}</strong>`,
      "{{course}}": `<strong style="color:#0f172a;">${course}</strong>`,
      "{{academic_year}}": `<strong style="color:#0f172a;">${academicSessionName}</strong>`,

      // Receipt Meta
      "{{receipt_no}}": `<strong style="color:#0f172a;">${receiptNo}</strong>`,
      "{{receipt_date}}": `<strong style="color:#0f172a;">${formattedDate}</strong>`,
      "{{payment_mode}}": `<strong style="color:#0f172a;">${paymentMode}</strong>`,
      "{{transaction_id}}": transactionRef ? `<strong style="color:#0f172a;">${transactionRef}</strong>` : "N/A",
      "{{reference_no}}": transactionRef ? `<strong style="color:#0f172a;">${transactionRef}</strong>` : "N/A",
      "{{bank_name}}": bankName || "N/A",
      "{{cheque_no}}": paymentMode === "Cheque" && transactionRef ? `<strong style="color:#0f172a;">${transactionRef}</strong>` : "N/A",
      "{{cheque_date}}": paymentMode === "Cheque" && chequeDate ? chequeDate.split("-").reverse().join("-") : "N/A",

      // Financials
      "{{amount_paid}}": amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "{{total_paid}}": amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "{{amount_in_words}}": amountInWords,
      "{{total_fees}}": totalFees.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "{{balance_due}}": balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "{{concession}}": concessionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "{{installment_no}}": installmentNo,
      "{{fees_type}}": feeType,
      "{{fee_type}}": feeType,
      "{{remarks}}": remarks,

      // College Info
      "{{college_name}}": collegeName,
      "{{college_address}}": collegeAddress,
      "{{college_phone}}": collegePhone,
      "{{college_email}}": collegeEmail,

      // Blocks
      "{{fees_breakdown_table}}": generatedBreakdownTable,
      "{{breakdown_table}}": generatedBreakdownTable,
      "{{principal_signature}}": "",
      "{{cashier_signature}}": "",
    }

    // Replace all tags
    for (const [tag, val] of Object.entries(replacements)) {
      content = content.split(tag).join(val)
    }

    // Clean up empty paragraphs
    content = content.replace(/\n\n+/g, "</p><p style='margin:12px 0;line-height:1.7;'>")
    content = content.replace(/\n/g, "<br/>")

    return `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;background:#ffffff;padding:32px 40px;line-height:1.6;font-size:14px;border:1px solid #e2e8f0;border-radius:6px;max-width:850px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <!-- Receipt College Header -->
        <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:20px;">
          <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-0.02em;text-transform:uppercase;">
            ${collegeName}
          </h2>
          <p style="font-size:12px;color:#475569;margin:4px 0 0 0;">
            ${collegeAddress} &bull; Ph: ${collegePhone}
          </p>
          <div style="margin-top:10px;display:inline-block;padding:4px 20px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;border-radius:4px;letter-spacing:0.06em;text-transform:uppercase;">
            FEE PAYMENT RECEIPT
          </div>
        </div>

        <!-- Meta Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:20px;font-size:13px;">
          <div><strong style="color:#475569;">Receipt No:</strong> <span style="color:#0f172a;font-weight:700;">${receiptNo}</span></div>
          <div><strong style="color:#475569;">Date:</strong> <span style="color:#0f172a;font-weight:700;">${formattedDate}</span></div>
          <div><strong style="color:#475569;">Academic Session:</strong> <span style="color:#0f172a;font-weight:700;">${academicSessionName}</span></div>
        </div>

        <!-- Body Content -->
        <div style="font-size:14px;color:#1e293b;line-height:1.7;">
          <p style="margin:12px 0;line-height:1.7;">${content}</p>
        </div>

        <!-- Signatures Block -->
        ${generatedSignaturesBlock}

        <!-- Bottom verification watermark -->
        <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#94a3b8;">
          <span>This is an official computer-generated receipt from the CNKHMC Campus Management System.</span>
          <span>Printed: ${new Date().toLocaleString("en-IN")}</span>
        </div>
      </div>
    `
  }, [
    activeTemplate,
    receiptNo,
    receiptDate,
    studentFullName,
    studentGrNo,
    studentEnrollmentNo,
    studentClass,
    course,
    academicSessionName,
    paymentMode,
    transactionRef,
    bankName,
    chequeDate,
    amountPaid,
    amountInWords,
    totalFees,
    balanceDue,
    concessionAmount,
    installmentNo,
    feeType,
    remarks,
    collegeName,
    collegeAddress,
    collegePhone,
    collegeEmail,
    feeItems,
    selectedFeePlanId,
    generatedBreakdownTable,
    generatedSignaturesBlock,
    hostelName,
  ])

  // A cheque receipt must carry the cheque number and the bank.
  const chequeDetailsMissing = (): boolean => {
    if (paymentMode !== "Cheque") return false
    if (transactionRef.trim() && bankName.trim()) return false
    toast({
      title: "Cheque details required",
      description: "Enter the cheque number and the bank name before issuing the receipt.",
      variant: "destructive",
    })
    return true
  }

  // ── Print Handler ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (chequeDetailsMissing()) return
    const printWindow = window.open("", "_blank", "width=900,height=1000")
    if (!printWindow) {
      toast({
        title: "Print Blocked",
        description: "Please allow popups to print the receipt.",
        variant: "destructive",
      })
      return
    }

    printWindow.document.open()
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt - ${studentGrNo} - ${receiptNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
          </style>
        </head>
        <body>
          ${compiledReceiptHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()

    toast({
      title: "Receipt Sent to Print",
      description: `Receipt ${receiptNo} for ${studentFullName} has been prepared.`,
    })

    // Advance sequential receipt serial (0000 to 9999) for this date
    const ymd = (receiptDate || new Date().toISOString().split("T")[0]).replace(/-/g, "")
    advanceReceiptSerial(ymd, receiptNo)

    if (onReceiptIssued) {
      onReceiptIssued({
        receiptNo,
        receiptDate,
        studentId: selectedStudent?.id,
        amount: amountPaid,
        feeType,
        course,
      })
    }
  }

  // ── Export Student Statement to Excel & DigitalOcean Spaces ─────────────────
  const handleExportStudentExcel = async () => {
    if (!selectedStudent?.id) {
      toast({
        title: "No Student Selected",
        description: "Please select a student first to export their financial statement.",
        variant: "destructive",
      })
      return
    }
    try {
      setIsExportingExcel(true)
      const res = await ApiService.post(`fees/statement/${selectedStudent.id}/export-excel`, {
        academic_year: currentAcademicSession?.id,
      })
      const data = res?.data
      if (data?.file_url) {
        const a = document.createElement("a")
        a.href = data.file_url
        a.download = data.file_name
        a.target = "_blank"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
      toast({
        title: "Excel Statement Archived in DigitalOcean Spaces",
        description: `Exported ${data.file_name} and download started.`,
      })
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err?.response?.data?.message || "Failed to export student statement to Excel.",
        variant: "destructive",
      })
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] lg:max-w-7xl max-h-[92vh] overflow-hidden flex flex-col p-0 border-slate-200">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <ReceiptText className="h-5 w-5 text-emerald-400" />
                Accountant Fee Receipt Creator
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-xs mt-0.5">
                Generate and issue official student fee receipts using customized templates with real-time merge tag substitution.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-400/30 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Templates Active
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body: Split View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Form Controls (5 cols) */}
          <div className="lg:col-span-5 p-4 space-y-3.5 overflow-y-auto max-h-[calc(92vh-130px)] bg-slate-50/60">
            {/* 1. Student Selection */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  1. Student Details
                </Label>
                {selectedStudent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-blue-600 hover:text-blue-800 p-0"
                    onClick={() => {
                      setSelectedStudent(null)
                      setStudentFeeHistory(null)
                      setStudentSearchQuery("")
                    }}
                  >
                    Change Student
                  </Button>
                )}
              </div>

              {!selectedStudent ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search student by Name or GR Number..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-white"
                    />
                  </div>

                  {isSearchingStudents && (
                    <p className="text-xs text-slate-500 italic flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                      Searching students across records...
                    </p>
                  )}

                  {!isSearchingStudents && studentSearchQuery.trim().length >= 1 && searchResults.length === 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      No student found matching "{studentSearchQuery}". Search by First Name, Last Name, or GR Number.
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="border border-slate-200 rounded-md max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white shadow-sm">
                      {searchResults.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStudent(st)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {st.first_name} {st.middle_name} {st.last_name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex gap-3 mt-0.5">
                              <span>GR No: <strong className="text-slate-700">{st.gr_no || "—"}</strong></span>
                              {st.enrollment_code && (
                                <span>Enrollment: <strong className="text-slate-700">{st.enrollment_code}</strong></span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-300">
                            {st.class_name || "Select Student"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-md text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-slate-900 text-xs">{studentFullName}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportStudentExcel}
                      disabled={isExportingExcel}
                      className="h-6 px-2 text-[10px] text-emerald-700 hover:text-emerald-800 border-emerald-200 hover:bg-emerald-50 bg-white"
                      title="Export entire student fee history to Excel and DigitalOcean Spaces"
                    >
                      {isExportingExcel ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-3 w-3 mr-1 text-emerald-600" />
                      )}
                      Export History (Excel)
                    </Button>
                  </div>
                  <div className="text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                    <span>GR: <strong className="text-slate-800">{studentGrNo}</strong></span>
                    <span>Course: <strong className="text-slate-800">{course}</strong></span>
                    <span>Class: <strong className="text-slate-800">{studentClass}</strong></span>
                    <span>Session: <strong className="text-slate-800">{academicSessionName}</strong></span>
                    {studentQuota && (
                      <span className="flex items-center gap-1">
                        Quota:
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold bg-blue-100 text-blue-800 border-blue-200">
                          {studentQuota}
                        </Badge>
                      </span>
                    )}
                  </div>
                  {studentFeeHistory && (
                    <div className="pt-1.5 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">
                        Paid to Date: <strong className="text-emerald-700">₹{Number(studentFeeHistory.paid_amount || 0).toLocaleString("en-IN")}</strong>
                      </span>
                      <span className="text-slate-600">
                        Balance Due: <strong className="text-amber-700">₹{Number(studentFeeHistory.due_amount || 0).toLocaleString("en-IN")}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Choose Fee Receipt Template */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-purple-600" />
                2. Receipt Template
              </Label>

              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Choose a fee receipt template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={String(tpl.id)} className="text-xs">
                      {tpl.name} {tpl.code ? `(${tpl.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Fee Plan Selection & Breakdown */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  3. Fee Plan & Components
                </Label>
                {isLoadingFeePlans && (
                  <span className="text-[10px] text-slate-400 italic">Loading...</span>
                )}
              </div>

              <Select
                value={selectedFeePlanId}
                onValueChange={(val) => handleSelectFeePlan(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Select a Fee Plan / Template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom" className="text-xs font-medium text-slate-600">
                    -- Custom / Manual Fee Breakdown --
                  </SelectItem>
                  {feePlans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)} className="text-xs">
                      {plan.name} {plan.quota?.name ? `(${plan.quota.name})` : ""} - ₹
                      {Number(plan.total_amount || 0).toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Fee Components Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Fee Components ({feeItems.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700">
                      ₹{amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFeeItem}
                      className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {feeItems.length === 0 ? (
                    <div className="text-center py-2.5 px-3 text-[11px] text-slate-400 bg-slate-50/60 rounded border border-dashed border-slate-200">
                      No components added. Select a Fee Plan above or click "+ Add".
                    </div>
                  ) : (
                    feeItems.map((item, idx) => (
                      <div key={item.id ?? idx} className="flex items-center gap-1.5">
                        <Input
                          value={item.title}
                          onChange={(e) => handleFeeItemChange(idx, "title", e.target.value)}
                          placeholder="Component Name (e.g. Tuition Fee)"
                          className="h-7 text-xs flex-1 bg-white"
                        />
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2 top-1.5 text-[11px] text-slate-400">₹</span>
                          <Input
                            type="number"
                            value={item.amount || ""}
                            onChange={(e) => handleFeeItemChange(idx, "amount", e.target.value)}
                            placeholder="0"
                            className="h-7 text-xs pl-5 font-semibold text-right bg-white"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFeeItem(idx)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 4. Payment & Receipt Parameters */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs space-y-2.5">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                4. Payment & Receipt Details
              </Label>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">Receipt No.</Label>
                  <Input
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="h-8 text-xs font-mono bg-white"
                    placeholder="RCP-YYYYMMDD-0000"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">Receipt Date</Label>
                  <Input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => {
                      const newDate = e.target.value
                      setReceiptDate(newDate)
                      if (!receiptNo || receiptNo.startsWith("RCP-")) {
                        setReceiptNo(generateDefaultReceiptNo(newDate))
                      }
                    }}
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block font-semibold text-slate-700">Course</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select course..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BHMS" className="text-xs">
                        BHMS
                      </SelectItem>
                      <SelectItem value="1st BHMS" className="text-xs">
                        1st BHMS
                      </SelectItem>
                      <SelectItem value="2nd BHMS" className="text-xs">
                        2nd BHMS
                      </SelectItem>
                      <SelectItem value="3rd BHMS" className="text-xs">
                        3rd BHMS
                      </SelectItem>
                      <SelectItem value="4th BHMS" className="text-xs">
                        4th BHMS
                      </SelectItem>
                      <SelectItem value="BHMS Old Curriculum" className="text-xs">
                        BHMS Old Curriculum
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">Installment No.</Label>
                  <Input
                    value={installmentNo}
                    onChange={(e) => setInstallmentNo(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. 1 or Full"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-[11px] text-slate-600 mb-1 block">Receipt Title / Remark</Label>
                  <Input
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. Tuition Fee"
                    list="fee-type-suggestions"
                  />
                  <datalist id="fee-type-suggestions">
                    <option value="Tuition Fee" />
                    <option value="Hostel Fee" />
                    <option value="Mess & Dining Fee" />
                    <option value="Bonafide Certificate Fee" />
                    <option value="Leaving / Transfer Certificate Fee" />
                    <option value="Migration / Transcript Fee" />
                    <option value="Library Fee" />
                    <option value="Examination Fee" />
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {["Tuition Fee", "Hostel Fee", "Mess Fee", "Certificate Fee"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setFeeType(item)
                          if (item === "Hostel Fee") {
                            setSelectedTemplateId("-98")
                            if (remarks === "Academic Year Fee Payment") setRemarks("-")
                          } else if (item === "Tuition Fee") {
                            setSelectedTemplateId("-99")
                          }
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          feeType === item
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  {(activeTemplate?.code === "CNKHMC_HOSTEL_OFFICIAL" ||
                    feeType.toLowerCase().includes("hostel") ||
                    selectedTemplateId === "-98") && (
                    <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-md">
                      <Label className="text-[11px] text-amber-900 mb-1 block font-semibold flex items-center justify-between">
                        <span>Hostel Name (Header Title)</span>
                        <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-800 border-amber-300">
                          Official PDF Format
                        </Badge>
                      </Label>
                      <Input
                        value={hostelName}
                        onChange={(e) => setHostelName(e.target.value)}
                        className="h-8 text-xs font-bold text-amber-950 bg-white"
                        placeholder="e.g. Kantaba Girls Hostel"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block font-semibold text-emerald-700">
                    Amount Paid (₹)
                  </Label>
                  <Input
                    type="number"
                    value={amountPaid || ""}
                    onChange={(e) => handleAmountPaidChange(Number(e.target.value))}
                    className="h-8 text-xs font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Online">Online / Net Banking</SelectItem>
                      <SelectItem value="NEFT">NEFT / RTGS</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label className="text-[11px] text-slate-600 mb-1 block">
                    Amount in Words (Auto-computed)
                  </Label>
                  <Input
                    value={amountInWords}
                    onChange={(e) => setAmountInWords(e.target.value)}
                    className="h-8 text-xs font-medium text-slate-700"
                  />
                </div>

                {paymentMode === "Cheque" ? (
                  <div className="col-span-2 grid grid-cols-3 gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                    <div>
                      <Label className="text-[11px] text-slate-600 mb-1 block">
                        Cheque No. <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value.replace(/[^0-9A-Za-z-]/g, ""))}
                        className="h-8 text-xs"
                        placeholder="e.g. 004512"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-600 mb-1 block">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="e.g. State Bank of India"
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-600 mb-1 block">Cheque Date</Label>
                      <Input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-[11px] text-slate-600 mb-1 block">Txn Ref No.</Label>
                    <Input
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="UTR / Reference No."
                    />
                  </div>
                )}

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">Balance Due (₹)</Label>
                  <Input
                    type="number"
                    value={balanceDue || ""}
                    onChange={(e) => setBalanceDue(Number(e.target.value))}
                    className="h-8 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Include Signatures</span>
                <Switch
                  checked={includeSignatures}
                  onCheckedChange={setIncludeSignatures}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable Preview (7 cols) */}
          <div className="lg:col-span-7 p-6 bg-slate-100 overflow-y-auto max-h-[calc(92vh-130px)] flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3 max-w-[850px]">
              <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Live Template Render
              </div>
              <div className="text-[11px] text-slate-500">
                Paper: A4 Standard &bull; High Resolution
              </div>
            </div>

            {/* Paper Container */}
            <div
              ref={previewContainerRef}
              className="w-full max-w-[850px] shadow-lg rounded-md overflow-hidden bg-white"
              dangerouslySetInnerHTML={{ __html: compiledReceiptHtml }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-3 border-t bg-white flex flex-row justify-between items-center shrink-0">
          <div className="text-xs text-slate-500">
            Selected Template: <strong className="text-slate-800">{activeTemplate?.name || "None"}</strong>
          </div>
          <div className="flex gap-2">
            {selectedStudent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportStudentExcel}
                disabled={isExportingExcel}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs gap-1.5"
                title="Export student's fee ledger and statements to Excel and DigitalOcean Spaces"
              >
                {isExportingExcel ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                )}
                Export Ledger (Excel)
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
              title="Reprint only. Does not record a payment."
            >
              <Printer className="h-4 w-4" />
              Print Only
            </Button>
            {canFees("create", "Fees") && (
<Button
              size="sm"
              onClick={() => {
                if (chequeDetailsMissing()) return
                setIsRecordPaymentOpen(true)
              }}
              disabled={!selectedStudent || !studentFeeFull?.installments}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
              title="Records the payment against the student's installments, then prints the receipt."
            >
              <Printer className="h-4 w-4" />
              Save Payment &amp; Print
            </Button>
)}
          </div>
        </DialogFooter>
    {selectedStudent && studentFeeFull?.installments && (
      <FlexiblePaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccessfulSubmit={() => {
          setIsRecordPaymentOpen(false)
          handlePrint()
          loadStudentDetails(selectedStudent.id)
        }}
        initialPaymentAmount={Number(amountPaid) || 0}
        initialValues={{
          payment_mode: (["Cash", "Online", "Bank Transfer", "Cheque", "UPI"].includes(paymentMode)
            ? paymentMode
            : "Cash") as "Cash" | "Online" | "Bank Transfer" | "Cheque" | "UPI",
          transaction_reference: transactionRef,
          payment_date: receiptDate,
          remarks:
            paymentMode === "Cheque"
              ? `${remarks ? remarks + " | " : ""}Cheque No: ${transactionRef}, Bank: ${bankName}, Cheque Date: ${chequeDate}`
              : remarks,
        }}
        skipAmountConfirmation
        enrolled_academic_session_id={currentAcademicSession.id}
        feesPlanDetail={studentFeeFull.detail?.fees_details || []}
        availableInstallments={studentFeeFull.installments.flatMap((feeType: any) =>
          (feeType.installments_breakdown || [])
            .filter(
              (inst: any) =>
                !inst.is_paid || (Number(inst.carry_forward_amount || 0) > 0 && inst.is_paid),
            )
            .map((inst: any) => ({
              ...inst,
              fee_plan_details_id: feeType.id,
              fee_type_name: getFeeTypeName(feeType.fees_type_id),
              installment_type: feeType.installment_type,
              status: "Unpaid",
            })),
        )}
        studentId={Number(selectedStudent.id)}
        studentConcessions={studentFeeFull.student?.provided_concession || []}
        planConcessions={studentFeeFull.detail?.fees_plan?.concession_for_plan || []}
        availableConcessionBalance={{
          student_concession: Number(studentFeeFull.detail?.wallet?.total_concession_for_student || 0),
          plan_concession: Number(studentFeeFull.detail?.wallet?.total_concession_for_plan || 0),
        }}
        getFeeTypeName={getFeeTypeName}
      />
    )}
      </DialogContent>
    </Dialog>
  )
}

export default FeeReceiptMakerDialog
