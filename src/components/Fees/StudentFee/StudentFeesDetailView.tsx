import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  Receipt,
  Tag,
  User,
  Info,
  CheckCircle2,
  Eye,
} from "lucide-react"
import { useLazyGetStudentFeesDetailsQuery, useGetAllFeesTypeQuery, useGetAllConcessionsQuery } from "@/services/feesService"
import { toast } from "@/hooks/use-toast"
import PayFeesDialog from "@/components/Fees/PayFees/PayFeesDialog"
import InstallmentDetailView from "@/components/Fees/Reports/InstallmentDetailViewProps"
import PaymentReceiptGenerator from "@/components/Fees/Reports/PaymentReceiptGenerator"
import type { InstallmentBreakdown, StudentFeeDetails } from "@/types/fees"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useNavigate, useParams } from "react-router-dom"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { selectAccademicSessionsForSchool, selectCurrentSchool } from "@/redux/slices/authSlice"

// Extended interface for installment breakdown with additional fields
interface ExtendedInstallmentBreakdown extends Omit<InstallmentBreakdown, "fee_plan_details_id"> {
  original_amount?: string
  discounted_amount?: string
  paid_amount?: string
  remaining_amount?: string
  carry_forward_amount?: string
  payment_status?: string
  is_paid?: boolean
  payment_date?: string | null
  transaction_reference?: string | null
  amount_paid_as_carry_forward?: string
  fee_plan_details_id: number
  status: "Paid" | "Unpaid" | "Partially Paid" | "Overdue" | "Failed"
  applied_concession?:
  | {
    concession_id: number
    applied_amount: number
    concession?: {
      id: number
      name: string
    }
  }[]
  | null
}

// Fee type interface
interface FeesType {
  id: number
  name: string
  description?: string
  academic_session_id: number
  status?: string
}

// Academic session interface (simplified)
interface AcademicSession {
  id: number
  session_name: string
  // Add other properties as needed
}

// School info interface
interface SchoolInfo {
  name: string
  address: string
  logo?: string
  // Add other properties as needed
}

// Component props
interface StudentFeesPanelProps {
  // For standalone mode (via URL)
  studentId?: number

  // For dialog mode (passed from parent)
  studentFeeDetails?: StudentFeeDetails
  isLoading?: boolean
  onClose?: () => void
  academicSession?: AcademicSession
  schoolInfo?: SchoolInfo
  showBackButton?: boolean
}

const StudentFeesDetailView: React.FC<StudentFeesPanelProps> = ({
  studentId: propStudentId,
  studentFeeDetails: propStudentFeeDetails,
  isLoading: propIsLoading,
  onClose,
  academicSession: propAcademicSession,
  schoolInfo: propSchoolInfo,
  showBackButton = true,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [getStudentFeesDetails, { data: fetchedStudentFeeDetails, isLoading: isFetchLoading, isError, isFetching }] =
    useLazyGetStudentFeesDetailsQuery()

  const params = useParams<{ student_id: string }>()
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Determine if we're in standalone mode or dialog mode
  const isStandaloneMode = !propStudentFeeDetails || !!params.student_id

  // Determine student ID from props or URL params
  const effectiveStudentId = useMemo(() => {
    if (propStudentId) return propStudentId
    if (params.student_id) return Number.parseInt(params.student_id)
    return null
  }, [propStudentId, params.student_id])

  // Selectors for standalone mode
  const academicClasses = useAppSelector(selectAcademicClasses)
  const academicDivisions = useAppSelector(selectAllAcademicClasses)
  const academicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const schoolDetails = useAppSelector(selectCurrentSchool)

  // Use passed data or fetched data
  const studentFeeDetails = useMemo(() => {
    return propStudentFeeDetails || fetchedStudentFeeDetails
  }, [propStudentFeeDetails, fetchedStudentFeeDetails])

  // Use passed loading state or fetch loading state
  const isLoading = useMemo(() => {
    return propIsLoading !== undefined ? propIsLoading : isFetchLoading || isFetching || isInitialLoading
  }, [propIsLoading, isFetchLoading, isFetching, isInitialLoading])

  // Use passed academic session or selector
  const effectiveAcademicSession = useMemo(() => {
    return propAcademicSession || (academicSessions?.length ? academicSessions[0] : undefined)
  }, [propAcademicSession, academicSessions])

  // Use passed school info or selector
  const effectiveSchoolInfo = useMemo(() => {
    if (propSchoolInfo) return propSchoolInfo
    return {
      name: schoolDetails?.name || "School Management System",
      address: schoolDetails?.address || "",
      logo: "",
    }
  }, [propSchoolInfo, schoolDetails])

  const [activeTab, setActiveTab] = useState("due-fees")
  const [isPayFeesDialogOpen, setIsPayFeesDialogOpen] = useState(false)
  const [selectedInstallments, setSelectedInstallments] = useState<ExtendedInstallmentBreakdown[]>([])
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] =
    useState<ExtendedInstallmentBreakdown | null>(null)

  // States for detail view and receipt generator
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedInstallmentForView, setSelectedInstallmentForView] = useState<any>(null)
  const [selectedFeeTypeForView, setSelectedFeeTypeForView] = useState<any>(null)
  const [isReceiptGeneratorOpen, setIsReceiptGeneratorOpen] = useState(false)
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null)
  const [selectedInstallmentForReceipt, setSelectedInstallmentForReceipt] = useState<any>(null)
  const [selectedFeeTypeForReceipt, setSelectedFeeTypeForReceipt] = useState<any>(null)

  // State for payment status update
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Get academic session ID for fee types query
  const academicSessionId = useMemo(() => {
    if (studentFeeDetails?.detail?.fees_plan?.academic_session_id) {
      return studentFeeDetails.detail.fees_plan.academic_session_id
    }
    // Fallback to effective academic session if needed
    return effectiveAcademicSession?.id
  }, [studentFeeDetails?.detail?.fees_plan?.academic_session_id, effectiveAcademicSession])

  // Fetch fee types from API
  const { data: feeTypes, isLoading: isLoadingFeeTypes } = useGetAllFeesTypeQuery(
    { academic_session_id: academicSessionId! , applicable_to : "All" },
    { skip: !academicSessionId },
  )

  // Fetch cooncrssion types from API
  const { data: concessionTypes, isLoading: isLoadingConcessionTypes } = useGetAllConcessionsQuery(
    { academic_session_id: academicSessionId || 0 },
    { skip: !academicSessionId },
  )

  // Format date to readable format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency
  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0.00"
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Get status badge variant based on status
  const getStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "Paid":
        return "default"
      case "Partially Paid":
        return "outline"
      case "Overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Get fee type name from ID using the API data
  const getFeeTypeName = (feeTypeId: number, studentData?: StudentFeeDetails): string => {
    if (!feeTypeId) return t("unknown_fee_type")

    // First check if we have the fee type in our API data
    if (feeTypes && feeTypes.length > 0) {
      const feeType = feeTypes.find((type) => type.id === feeTypeId)
      if (feeType) {
        return feeType.name
      }
    }

    // Then try to find it in the installments data
    if (studentData?.installments) {
      const feeType = studentData.installments.find((installment) => installment.fees_type_id === feeTypeId)

      if (feeType?.installment_type) {
        return `${feeType.installment_type} ${t("fee")}`
      }
    }

    // Fallback to a generic name with the ID
    return `${t("fee_type")} ${feeTypeId}`
  }

  // Get concession name from ID using the API data
  const getConcessionNameFromId = (concessionId: number): string => {
    if (!concessionId) return t("unknown_concession")

    // First check if we have the concession in our API data
    if (concessionTypes && concessionTypes.length > 0) {
      const concession = concessionTypes.find((type) => type.id === concessionId)
      if (concession) {
        return concession.name
      }
    }

    // Fallback to a generic name with the ID
    return `${t("concession")} ${concessionId}`
  }

  // Get concession name with proper fallback
  // const getConcessionName = (concession: any): string => {
  //   if (concession?.concession?.name) {
  //     return concession.concession.name
  //   }

  //   return `${t("concession")} #${concession?.concession_id || "Unknown"}`
  // }

  // Toggle installment selection
  const toggleInstallmentSelection = (installment: ExtendedInstallmentBreakdown) => {
    if (selectedInstallments.some((item) => item.id === installment.id)) {
      setSelectedInstallments(selectedInstallments.filter((item) => item.id !== installment.id))
    } else {
      setSelectedInstallments([...selectedInstallments, installment])
    }
  }

  // Handle pay fees button click for multiple installments
  const handlePayFees = () => {
    if (selectedInstallments.length === 0) {
      toast({
        variant: "destructive",
        title: t("no_installments_selected"),
        description: t("please_select_at_least_one_installment_to_pay"),
      })
      return
    }

    setIsPayFeesDialogOpen(true)
  }

  // Handle pay single installment
  const handlePaySingleInstallment = (installment: ExtendedInstallmentBreakdown) => {
    setSelectedInstallmentForPayment(installment)
    setIsPayFeesDialogOpen(true)
  }

  // Handle back to list button click
  const handleBackToList = () => {
    if (onClose) {
      onClose()
    } else {
      navigate(-1)
    }
  }

  // Calculate total selected amount
  const calculateTotalSelectedAmount = () => {
    if (selectedInstallmentForPayment) {
      // For single installment payment
      const amount = Number(selectedInstallmentForPayment.installment_amount || 0)
      const discountedAmount = Number(selectedInstallmentForPayment.discounted_amount || 0)
      return amount - discountedAmount
    } else {
      // For multiple installments
      return selectedInstallments.reduce((total, installment) => {
        const amount = Number(installment.installment_amount || 0)
        const discountedAmount = Number(installment.discounted_amount || 0)
        return total + (amount - discountedAmount)
      }, 0)
    }
  }

  // Calculate payment progress percentage
  const calculatePaymentProgress = () => {
    if (!studentFeeDetails?.student?.fees_status) return 0

    const totalAmount = Number(studentFeeDetails.student.fees_status.total_amount || 0)
    if (totalAmount === 0) return 0

    const paidAmount = Number(studentFeeDetails.student.fees_status.paid_amount || 0)
    const discountedAmount = Number(studentFeeDetails.student.fees_status.discounted_amount || 0)

    return Math.round(((paidAmount + discountedAmount) / totalAmount) * 100)
  }

  // Check if an installment has carry-forward amount that needs to be paid
  const hasCarryForwardToPay = (installment: {
    carry_forward_amount?: string | number
    is_paid?: boolean
  }): boolean => {
    // Check if the installment has carry-forward amount
    const carryForwardAmount = Number(installment.carry_forward_amount || 0)

    // If there's carry-forward amount and the installment is marked as paid
    // but still has carry-forward to be paid, return true
    return carryForwardAmount > 0 && !!installment.is_paid
  }

  // Add a function to handle opening the update status dialog
  const handleUpdateStatus = (payment: any) => {
    setSelectedPayment(payment)
    setIsUpdateStatusDialogOpen(true)
  }

  // Add a function to handle viewing installment details
  const handleViewInstallmentDetails = (installment: any, feeType: any) => {
    setSelectedInstallmentForView(installment)
    setSelectedFeeTypeForView(feeType)
    setIsDetailViewOpen(true)
  }

  // Add a function to handle generating fee receipt
  const handleGenerateReceipt = (payment: any) => {
    // Find the corresponding installment and fee type
    let foundInstallment = null
    let foundFeeType = null

    if (!studentFeeDetails) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("student_fee_details_not_available"),
      })
      return
    }

    studentFeeDetails.installments?.forEach((feeType) => {
      feeType.installments_breakdown.forEach((installment) => {
        if (installment.id === payment.installment_id) {
          foundInstallment = installment
          foundFeeType = feeType
        }
      })
    })

    if (foundInstallment && foundFeeType) {
      setSelectedPaymentForReceipt(payment)
      setSelectedInstallmentForReceipt(foundInstallment)
      setSelectedFeeTypeForReceipt(foundFeeType)
      setIsReceiptGeneratorOpen(true)
    } else {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("could_not_find_installment_details_for_this_payment"),
      })
    }
  }

  // Add a function to handle viewing payment details
  const handleViewPayment = (payment: any) => {
    // Find the corresponding installment and fee type
    let foundInstallment = null
    let foundFeeType = null

    if (!studentFeeDetails?.student?.fees_status?.paid_fees) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("payment_history_not_available"),
      })
      return
    }

    studentFeeDetails.installments?.forEach((feeType) => {
      feeType.installments_breakdown.forEach((installment) => {
        if (installment.id === payment.installment_id) {
          foundInstallment = installment
          foundFeeType = feeType
        }
      })
    })

    if (foundInstallment && foundFeeType) {
      setSelectedInstallmentForView(foundInstallment)
      setSelectedFeeTypeForView(foundFeeType)
      setIsDetailViewOpen(true)
    } else {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("could_not_find_installment_details_for_this_payment"),
      })
    }
  }

  // Calculate available concession balance
  const calculateAvailableConcessionBalance = () => {
    if (!studentFeeDetails?.detail?.wallet) return { student_concession: 0, plan_concession: 0 }

    const wallet = studentFeeDetails.detail.wallet || {
      total_concession_for_student: 0,
      total_concession_for_plan: 0,
    }

    return {
      student_concession: Number(wallet.total_concession_for_student || 0),
      plan_concession: Number(wallet.total_concession_for_plan || 0),
    }
  }

  // Handle print all details
  const handlePrintAllDetails = () => {
    if (!studentFeeDetails) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("could_not_open_print_window_please_check_your_popup_blocker_settings"),
      })
      return
    }

    // Generate HTML content for printing
    const studentData = studentFeeDetails.student
    const feesStatus = studentData.fees_status || {
      total_amount: "0",
      paid_amount: "0",
      discounted_amount: "0",
      due_amount: "0",
      status: "Unknown",
    }
    const paymentProgress = calculatePaymentProgress()

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("student_fee_details")}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px;
            border-bottom: 2px solid #ddd;
          }
          .school-logo {
            max-width: 100px;
            max-height: 100px;
            margin-bottom: 10px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .school-address {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
            color: #444;
          }
          .section { 
            margin-bottom: 25px; 
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 15px;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #444;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .summary-box { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin-bottom: 15px; 
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .summary-label {
            font-weight: bold;
            color: #555;
          }
          .summary-value {
            text-align: right;
          }
          .progress-container {
            width: 100%;
            background-color: #e0e0e0;
            border-radius: 5px;
            margin-top: 10px;
          }
          .progress-bar {
            height: 20px;
            background-color: #4caf50;
            border-radius: 5px;
            text-align: center;
            color: white;
            font-size: 12px;
            line-height: 20px;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .print-button {
            background-color: #4caf50;
            color: white;
            border: none;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 20px auto;
            cursor: pointer;
            border-radius: 5px;
          }
          @media print {
            .print-button { display: none; }
            body { margin: 0; padding: 15px; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${effectiveSchoolInfo.logo ? `<img src="${effectiveSchoolInfo.logo}" class="school-logo" alt="School Logo" />` : ""}
          <div class="school-name">${effectiveSchoolInfo.name}</div>
          <div class="school-address">${effectiveSchoolInfo.address || ""}</div>
          <div class="report-title">${t("student_fee_details")}</div>
          <p>${t("generated_on")} ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <div class="section-title">${t("student_information")}</div>
          <div class="summary-box">
            <div class="summary-item">
              <span class="summary-label">${t("name")}:</span>
              <span class="summary-value">${studentData.first_name} ${studentData.middle_name || ""} ${studentData.last_name}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("gr_number")}:</span>
              <span class="summary-value">${studentData.gr_no}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("roll_number")}:</span>
              <span class="summary-value">${(studentData as any).roll_number}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("fee_plan")}:</span>
              <span class="summary-value">${studentFeeDetails.detail?.fees_plan?.name || "-"}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("academic_year")}:</span>
              <span class="summary-value">${effectiveAcademicSession?.session_name ||
      studentFeeDetails.detail?.fees_plan?.academic_session_id ||
      "-"
      }</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("fee_summary")}</div>
          <div class="summary-box">
            <div class="summary-item">
              <span class="summary-label">${t("total_fees")}:</span>
              <span class="summary-value">${formatCurrency(feesStatus?.total_amount)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("paid_amount")}:</span>
              <span class="summary-value">${formatCurrency(feesStatus?.paid_amount)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("discounted_amount")}:</span>
              <span class="summary-value">${formatCurrency(feesStatus?.discounted_amount)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("due_amount")}:</span>
              <span class="summary-value">${formatCurrency(feesStatus?.due_amount)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("payment_status")}:</span>
              <span class="summary-value">${feesStatus?.status || "-"}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">${t("payment_progress")}:</span>
              <span class="summary-value">${paymentProgress}%</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${paymentProgress}%">
                ${paymentProgress}%
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("installment_details")}</div>
          <table>
            <thead>
              <tr>
                <th>${t("fee_type")}</th>
                <th>${t("installment")}</th>
                <th>${t("due_date")}</th>
                <th>${t("amount")}</th>
                <th>${t("discount")}</th>
                <th>${t("payable")}</th>
                <th>${t("status")}</th>
              </tr>
            </thead>
            <tbody>
              ${studentFeeDetails.installments
        ?.map((feeType) =>
          feeType.installments_breakdown
            .map(
              (installment) => `
                  <tr>
                    <td>${getFeeTypeName(feeType.fees_type_id, studentFeeDetails)}</td>
                    <td>${feeType.installment_type} - ${installment.installment_no}</td>
                    <td>${formatDate(installment.due_date)}</td>
                    <td>${formatCurrency(installment.installment_amount)}</td>
                    <td>${formatCurrency(installment.discounted_amount)}</td>
                    <td>${formatCurrency(
                Number(installment.installment_amount || 0) - Number(installment.discounted_amount || 0),
              )}</td>
                    <td>${installment.payment_status || t("unpaid")}</td>
                  </tr>
                `,
            )
            .join(""),
        )
        .join("") || `<tr><td colspan="7" style="text-align: center">${t("no_installments_found")}</td></tr>`
      }
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">${t("payment_history")}</div>
          ${!studentFeeDetails.student.fees_status?.paid_fees ||
        studentFeeDetails.student.fees_status.paid_fees.length === 0
        ? `<p style="text-align: center">${t("no_payment_history_found")}</p>`
        : `<table>
              <thead>
                <tr>
                  <th>${t("payment_id")}</th>
                  <th>${t("date")}</th>
                  <th>${t("amount")}</th>
                  <th>${t("discount")}</th>
                  <th>${t("carry_forward")}</th>
                  <th>${t("remaining")}</th>
                  <th>${t("mode")}</th>
                  <th>${t("status")}</th>
                </tr>
              </thead>
              <tbody>
                ${studentFeeDetails.student.fees_status.paid_fees
          .map(
            (payment) => `
                  <tr>
                    <td>#${payment.id}</td>
                    <td>${formatDate(payment.payment_date)}</td>
                    <td>${formatCurrency(payment.paid_amount)}</td>
                    <td>${formatCurrency(payment.discounted_amount)}</td>
                    <td>${Number(payment.amount_paid_as_carry_forward || 0) > 0
                ? formatCurrency(payment.amount_paid_as_carry_forward)
                : "-"
              }</td>
                    <td>${Number(payment.remaining_amount || 0) > 0 ? formatCurrency(payment.remaining_amount) : "-"
              }</td>
                    <td>${payment.payment_mode || "-"}</td>
                    <td>${payment.status || "-"}</td>
                  </tr>
                `,
          )
          .join("")}
              </tbody>
            </table>`
      }
        </div>
        
        <div class="footer">
          <p>${t("this_is_a_computer_generated_report_and_does_not_require_a_signature")}</p>
          <p>${effectiveSchoolInfo.name} &copy; ${new Date().getFullYear()}</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button class="print-button" onclick="window.print()">${t("print_report")}</button>
        </div>
      </body>
      </html>
    `

    // Write to the new window and print
    printWindow.document.open()
    printWindow.document.write(printContent)
    printWindow.document.close()

    // Trigger print after content is loaded
    printWindow.onload = () => {
      printWindow.focus()
    }
  }

  // Fetch student fees details on component mount
  useEffect(() => {
    // Only fetch if we're in standalone mode and not receiving props
    if (isStandaloneMode && effectiveStudentId) {
      const fetchData = async () => {
        try {
          await getStudentFeesDetails({ student_id : effectiveStudentId , academic_session_id : academicSessionId! })
        } catch (error) {
          console.error("Error fetching student fees details:", error)
          toast({
            variant: "destructive",
            title: t("failed_to_load_student_fees"),
            description: t("there_was_an_error_loading_the_fee_details_please_try_again"),
          })
        } finally {
          setIsInitialLoading(false)
        }
      }

      fetchData()
    } else {
      // If we're in dialog mode with props, no need to fetch
      setIsInitialLoading(false)
    }
  }, [effectiveStudentId, getStudentFeesDetails, isStandaloneMode, t])

  // Reset selected installments when tab changes
  useEffect(() => {
    setSelectedInstallments([])
    setSelectedInstallmentForPayment(null)
  }, [activeTab])

  // Reset selected single installment when dialog closes
  useEffect(() => {
    if (!isPayFeesDialogOpen) {
      setSelectedInstallmentForPayment(null)
    }
  }, [isPayFeesDialogOpen])

  // Reset selected tab when component mounts
  useEffect(() => {
    setActiveTab("due-fees")
  }, [])

  // Debug log to check if studentFeeDetails is actually available
  // useEffect(() => {
  //   if (studentFeeDetails) {
  //     console.log("Student fee details loaded:", studentFeeDetails)
  //   }
  // }, [studentFeeDetails])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <Button variant="outline" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="due-fees">
          <TabsList className="w-full">
            <TabsTrigger value="due-fees" className="flex-1">
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
            <TabsTrigger value="paid-fees" className="flex-1"></TabsTrigger>
            <TabsTrigger value="concessions" className="flex-1">
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="due-fees">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Skeleton className="h-4 w-8" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-24" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-24" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={handleBackToList} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_list")}
        </Button>

        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">{t("error_loading_student_fees")}</CardTitle>
            <CardDescription className="text-red-500">
              {t("there_was_a_problem_loading_the_fee_details_for_this_student_please_try_again_later")}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => effectiveStudentId && getStudentFeesDetails({ student_id : effectiveStudentId , academic_session_id : academicSessionId! })}>
              {t("retry")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Fix for "no_fee_details_found_for_this_student" error
  // Check if studentFeeDetails exists but might be empty or missing required properties
  const hasValidData =
    studentFeeDetails &&
    studentFeeDetails.student &&
    studentFeeDetails.student.fees_status &&
    studentFeeDetails.installments

  if (!hasValidData) {
    return (
      <div className="p-6">
        {showBackButton && (
          <Button variant="outline" onClick={handleBackToList} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_list")}
          </Button>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("no_data_available")}</CardTitle>
            <CardDescription>
              {studentFeeDetails
                ? t("incomplete_fee_details_for_this_student")
                : t("no_fee_details_found_for_this_student")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentFeeDetails && (
              <div className="text-sm text-muted-foreground">
                <p>{t("the_student_record_exists_but_some_fee_details_are_missing")}</p>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(
                    {
                      hasStudent: !!studentFeeDetails.student,
                      hasFeesStatus: !!(studentFeeDetails.student && studentFeeDetails.student.fees_status),
                      hasInstallments: !!studentFeeDetails.installments,
                      hasDetail: !!studentFeeDetails.detail,
                      studentDetailsObject: studentFeeDetails,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleBackToList} className="mr-2">
              {t("return_to_fee_list")}
            </Button>
            {isStandaloneMode && effectiveStudentId && (
              <Button onClick={() => getStudentFeesDetails({ student_id : effectiveStudentId , academic_session_id : academicSessionId! })}>{t("retry_loading")}</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Now we know studentFeeDetails is valid, we can safely use it
  const studentData = studentFeeDetails.student
  const feesStatus = studentData.fees_status
  const paymentProgress = calculatePaymentProgress()
  const concessionBalance = calculateAvailableConcessionBalance()
  const totalConcessionBalance = concessionBalance.student_concession + concessionBalance.plan_concession

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {showBackButton && (
          <Button variant="outline" onClick={handleBackToList} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_list")}
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintAllDetails}>
            <Printer className="mr-2 h-4 w-4" /> {t("print_details")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <User className="mr-2 h-5 w-5" />
            {studentData.first_name} {studentData.middle_name} {studentData.last_name}
          </CardTitle>
          <CardDescription>
            {t("student_fee_details_for_academic_year")}{" "}
            {effectiveAcademicSession?.session_name || studentFeeDetails.detail?.fees_plan?.academic_session_id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("gr_number")}</p>
              <p className="text-lg font-semibold">{studentData.gr_no}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("roll_number")}</p>
              <p className="text-lg font-semibold">{(studentData as any).roll_number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("fee_plan")}</p>
              <p className="text-lg font-semibold">{studentFeeDetails.detail?.fees_plan?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("payment_status")}</p>
              <Badge variant={getStatusBadgeVariant(feesStatus?.status || "")} className="text-sm">
                {feesStatus?.status || t("unknown")}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 text-lg flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {t("total_fees")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(feesStatus?.total_amount)}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 text-lg flex items-center">
                  <Receipt className="mr-2 h-5 w-5" />
                  {t("paid_amount")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(feesStatus?.paid_amount)}</p>
                {Number(feesStatus?.paid_amount) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t("due_amount")}: {formatCurrency((Number(feesStatus?.total_amount) - Number(feesStatus?.paid_amount)))}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 text-lg flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  {t("concession")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(feesStatus?.discounted_amount)}</p>
                {totalConcessionBalance > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t("available")}: {formatCurrency(totalConcessionBalance)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 text-lg flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  {t("total_carry_forwarded_amount")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(feesStatus?.due_amount)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{t("payment_progress")}</span>
              <span className="text-sm font-medium">{paymentProgress}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="due-fees" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" /> {t("due_fees")}
          </TabsTrigger>
          <TabsTrigger value="paid-fees" className="flex items-center">
            <Receipt className="mr-2 h-4 w-4" /> {t("paid_fees")}
          </TabsTrigger>
          <TabsTrigger value="concessions" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            {t("concessions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="due-fees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("due_installments")}</CardTitle>
              <div className="flex gap-2">
                {/* <Button
                  onClick={handlePayFees}
                  disabled={selectedInstallments.length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  {t("pay_selected")} ({selectedInstallments.length})
                </Button> */}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!studentFeeDetails.installments || studentFeeDetails.installments.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">{t("no_due_installments_found")}</p>
                </div>
              ) : (
                <>
                  {selectedInstallments.length > 0 && (
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <p className="text-sm text-blue-700">
                        {t("selected_amount")}:{" "}
                        <span className="font-bold">{formatCurrency(calculateTotalSelectedAmount())}</span>
                      </p>
                    </div>
                  )}

                  {totalConcessionBalance > 0 && (
                    <Alert className="m-4 bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-700">{t("available_concession_balance")}</AlertTitle>
                      <AlertDescription className="text-amber-600">
                        <div className="flex flex-col gap-1">
                          <span>
                            {t("total_available")}: {formatCurrency(totalConcessionBalance)}
                          </span>
                          {concessionBalance.student_concession > 0 && (
                            <span>
                              {t("student_concession")}: {formatCurrency(concessionBalance.student_concession)}
                            </span>
                          )}
                          {concessionBalance.plan_concession > 0 && (
                            <span>
                              {t("plan_concession")}: {formatCurrency(concessionBalance.plan_concession)}
                            </span>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {studentData.provided_concession && studentData.provided_concession.length > 0 && (
                    <div className="p-4 bg-green-50 border-b border-green-100">
                      <div className="flex items-center mb-2">
                        <Tag className="h-4 w-4 mr-2 text-green-600" />
                        <p className="text-sm font-medium text-green-700">{t("student_concessions_applied")}</p>
                      </div>
                      <ul className="text-xs text-green-700 space-y-1 ml-6">
                        {studentData.provided_concession.map((concession) => (
                          <li key={concession.id}>
                            <span className="font-medium">{getConcessionNameFromId(concession.id)}:</span>{" "}
                            {concession.deduction_type === "percentage"
                              ? `${concession.percentage}% ${t("discount")}`
                              : `${formatCurrency(concession.amount || 0)} ${t("fixed_discount")}`}
                            {concession.fees_type_id
                              ? ` ${t("on")} ${getFeeTypeName(concession.fees_type_id, studentFeeDetails)}`
                              : ` ${t("on_all_fees")}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {studentFeeDetails.detail?.fees_plan?.concession_for_plan &&
                    studentFeeDetails.detail.fees_plan.concession_for_plan.length > 0 && (
                      <div className="p-4 bg-blue-50 border-b border-blue-100">
                        <div className="flex items-center mb-2">
                          <Tag className="h-4 w-4 mr-2 text-blue-600" />
                          <p className="text-sm font-medium text-blue-700">{t("plan_concessions_applied")}</p>
                        </div>
                        <ul className="text-xs text-blue-700 space-y-1 ml-6">
                          {studentFeeDetails.detail.fees_plan.concession_for_plan.map((concession) => (
                            <li key={concession.id}>
                              <span className="font-medium">{getConcessionNameFromId(concession.id)}:</span>{" "}
                              {concession.deduction_type === "percentage"
                                ? `${concession.percentage}% ${t("discount")}`
                                : `${formatCurrency(concession.amount || 0)} ${t("fixed_discount")}`}
                              {concession.fees_type_id
                                ? ` ${t("on")} ${getFeeTypeName(concession.fees_type_id, studentFeeDetails)}`
                                : ` ${t("on_all_fees")}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Fee Type Sections */}
                  {studentFeeDetails.installments.map((feeType) => (
                    <div key={feeType.id} className="mb-6">
                      <div className="bg-gray-50 p-3 border-b">
                        <h3 className="font-medium flex items-center">
                          <Tag className="h-4 w-4 mr-2" />
                          {getFeeTypeName(feeType.fees_type_id, studentFeeDetails)} - {feeType.installment_type}
                          <Badge variant="outline" className="ml-2">
                            {feeType.total_installment} {t("installments")}
                          </Badge>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                          <div>
                            <span>
                              {t("total")}: {formatCurrency(feeType.total_amount)}
                            </span>
                          </div>
                          <div>
                            <span>
                              {t("paid")}: {formatCurrency(feeType.paid_amount)}
                            </span>
                          </div>
                          <div>
                            <span>
                              {t("discounted")}: {formatCurrency(feeType.discounted_amount)}
                            </span>
                          </div>
                          <div>
                            <span>
                              {t("due")}: {formatCurrency(feeType.due_amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            {/* <TableHead className="w-[50px]">{t("select")}</TableHead> */}
                            <TableHead>{t("installment")}</TableHead>
                            <TableHead>{t("due_date")}</TableHead>
                            <TableHead>{t("amount")}</TableHead>
                            <TableHead>{t("discount")}</TableHead>
                            <TableHead>{t("payable")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                            <TableHead>{t("actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feeType.installments_breakdown.map((installment) => {
                            // Include unpaid installments OR paid installments with carry-forward amounts
                            if (
                              !installment.is_paid ||
                              hasCarryForwardToPay({
                                carry_forward_amount: installment.carry_forward_amount,
                                is_paid: installment.is_paid,
                              })
                            ) {
                              const originalAmount = Number(installment.installment_amount || 0)
                              const discountAmount = Number(installment.discounted_amount || 0)
                              const payableAmount = originalAmount - discountAmount
                              const hasDiscount = discountAmount > 0
                              const hasCarryForward = Number(installment.carry_forward_amount || 0) > 0

                              return (
                                <TableRow
                                  key={installment.id}
                                  className={`hover:bg-gray-50 
                                  ${hasDiscount ? "bg-green-50" : ""} 
                                  ${hasCarryForward ? "bg-blue-50" : ""} 
                                  ${installment.is_paid &&
                                      hasCarryForwardToPay({
                                        carry_forward_amount: installment.carry_forward_amount,
                                        is_paid: installment.is_paid,
                                      })
                                      ? "border-l-4 border-blue-500"
                                      : ""
                                    }`}
                                >
                                  {/* <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={selectedInstallments.some((item) => item.id === installment.id)}
                                      onChange={() =>
                                        toggleInstallmentSelection({
                                          ...installment,
                                          fee_plan_details_id: feeType.id,
                                          status: installment.payment_status as any,
                                        })
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                  </TableCell> */}
                                  <TableCell>
                                    {feeType.installment_type} - {installment.installment_no}
                                  </TableCell>
                                  <TableCell>{formatDate(installment.due_date)}</TableCell>
                                  <TableCell className={hasDiscount ? "line-through text-gray-500" : ""}>
                                    {formatCurrency(installment.installment_amount)}
                                  </TableCell>
                                  <TableCell className="text-green-600">
                                    {hasDiscount ? formatCurrency(discountAmount) : "-"}
                                    {installment.applied_concession && installment.applied_concession.length > 0 && (
                                      <div className="text-xs mt-1">
                                        {installment.applied_concession.map((concession, idx) => (
                                          <div key={idx} className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            <span>
                                              { getConcessionNameFromId(concession.concession_id) }{" "}
                                              ({formatCurrency(concession.applied_amount)})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatCurrency(payableAmount)}
                                    {hasCarryForward && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        {t("carry_forward")}: {formatCurrency(installment.carry_forward_amount)}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getStatusBadgeVariant(installment.payment_status || "Unpaid")}>
                                      {installment.payment_status || t("unpaid")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewInstallmentDetails(installment, feeType)}
                                      >
                                        <Eye className="mr-1 h-3 w-3" /> {t("view")}
                                      </Button>
                                      {/* <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handlePaySingleInstallment({
                                            ...installment,
                                            fee_plan_details_id: feeType.id,
                                            status: installment.payment_status as any,
                                          })
                                        }
                                      >
                                        {installment.is_paid &&
                                        hasCarryForwardToPay({
                                          carry_forward_amount: installment.carry_forward_amount,
                                          is_paid: installment.is_paid,
                                        })
                                          ? t("pay_carry_forward")
                                          : t("pay_now")}
                                    </Button> */}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            }
                            return null
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid-fees">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment_history")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!feesStatus?.paid_fees || feesStatus.paid_fees.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">{t("no_payment_history_found")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("payment_id")}</TableHead>
                      <TableHead>{t("installment")}</TableHead>
                      <TableHead>{t("payment_date")}</TableHead>
                      <TableHead>{t("paid_amount")}</TableHead>
                      <TableHead>{t("discounted")}</TableHead>
                      <TableHead>{t("carry_forward")}</TableHead>
                      <TableHead>{t("remaining")}</TableHead>
                      <TableHead>{t("payment_mode")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesStatus.paid_fees.map((payment) => {
                      // Find the corresponding installment details
                      let installmentDetails = { type: "Unknown", number: "-", feeType: "Unknown" }
                      let foundInstallment = null
                      let foundFeeType = null

                      studentFeeDetails.installments?.forEach((feeType) => {
                        feeType.installments_breakdown.forEach((installment) => {
                          if (installment.id === payment.installment_id) {
                            installmentDetails = {
                              type: feeType.installment_type,
                              number: installment.installment_no.toString(),
                              feeType: getFeeTypeName(feeType.fees_type_id, studentFeeDetails),
                            }
                            foundInstallment = installment
                            foundFeeType = feeType
                          }
                        })
                      })

                      const hasDiscount = Number(payment.discounted_amount || 0) > 0
                      const hasCarryForward = Number(payment.amount_paid_as_carry_forward || 0) > 0
                      const hasRemaining = Number(payment.remaining_amount || 0) > 0

                      return (
                        <TableRow
                          key={payment.id}
                          className={`hover:bg-gray-50 ${hasDiscount ? "bg-green-50" : ""} ${hasCarryForward ? "bg-blue-50" : ""}`}
                        >
                          <TableCell className="font-medium">#{payment.id}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {installmentDetails.type} - {installmentDetails.number}
                            </div>
                            <div className="text-xs text-muted-foreground">{installmentDetails.feeType}</div>
                          </TableCell>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(payment.paid_amount)}</TableCell>
                          <TableCell>{formatCurrency(payment.discounted_amount)}</TableCell>
                          <TableCell>
                            {hasCarryForward ? (
                              <span className="text-blue-600">
                                {formatCurrency(payment.amount_paid_as_carry_forward)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasRemaining ? (
                              <span className="text-amber-600">{formatCurrency(payment.remaining_amount)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{payment.payment_mode}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === "Paid"
                                  ? "default"
                                  : payment.status === "Overdue"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {payment.status || t("unknown")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleGenerateReceipt(payment)}>
                                <FileText className="mr-1 h-3 w-3" /> {t("receipt")}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleViewPayment(payment)}>
                                <Eye className="mr-1 h-3 w-3" /> {t("view")}
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

        <TabsContent value="concessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("applied_concessions")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(studentData.provided_concession && studentData.provided_concession.length > 0) ||
                (studentFeeDetails.detail?.fees_plan?.concession_for_plan &&
                  studentFeeDetails.detail.fees_plan.concession_for_plan.length > 0) ? (
                <>
                  <div className="p-4 bg-blue-50">
                    <h3 className="text-sm font-medium text-blue-700 mb-2">{t("concession_summary")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">{t("total_concession_applied")}:</span>
                          <span className="text-sm font-medium text-blue-700">
                            {formatCurrency(feesStatus?.discounted_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">{t("available_balance")}:</span>
                          <span className="text-sm font-medium text-blue-700">
                            {formatCurrency(totalConcessionBalance)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">{t("student_concessions")}:</span>
                          <span className="text-sm font-medium text-blue-700">
                            {formatCurrency(concessionBalance.student_concession)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">{t("plan_concessions")}:</span>
                          <span className="text-sm font-medium text-blue-700">
                            {formatCurrency(concessionBalance.plan_concession)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {studentData.provided_concession && studentData.provided_concession.length > 0 && (
                    <div className="mt-4">
                      <h3 className="px-4 text-base font-medium mb-2">{t("student_concessions")}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("concession_name")}</TableHead>
                            <TableHead>{t("applied_to")}</TableHead>
                            <TableHead>{t("deduction_type")}</TableHead>
                            <TableHead>{t("value")}</TableHead>
                            <TableHead>{t("applied_discount")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentData.provided_concession.map((concession) => (
                            <TableRow key={concession.id}>
                              <TableCell className="font-medium">{getConcessionNameFromId(concession.id)}</TableCell>
                              <TableCell>
                                {concession.fees_type_id
                                  ? getFeeTypeName(concession.fees_type_id, studentFeeDetails)
                                  : t("all_fees")}
                              </TableCell>
                              <TableCell className="capitalize">{t(concession.deduction_type)}</TableCell>
                              <TableCell>
                                {concession.deduction_type === "percentage"
                                  ? `${concession.percentage}%`
                                  : formatCurrency(concession.amount || 0)}
                              </TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {formatCurrency(concession.amount || 0)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={concession.status === "Active" ? "default" : "outline"}>
                                  {t(concession.status || "inactive")}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {studentFeeDetails.detail?.fees_plan?.concession_for_plan &&
                    studentFeeDetails.detail.fees_plan.concession_for_plan.length > 0 && (
                      <div className="mt-4">
                        <h3 className="px-4 text-base font-medium mb-2">{t("plan_concessions")}</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("concession_name")}</TableHead>
                              <TableHead>{t("applied_to")}</TableHead>
                              <TableHead>{t("deduction_type")}</TableHead>
                              <TableHead>{t("value")}</TableHead>
                              <TableHead>{t("status")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentFeeDetails.detail.fees_plan.concession_for_plan.map((concession) => (
                              <TableRow key={concession.id}>
                                <TableCell className="font-medium">{getConcessionNameFromId(concession.id)}</TableCell>
                                <TableCell>
                                  {concession.fees_type_id
                                    ? getFeeTypeName(concession.fees_type_id, studentFeeDetails)
                                    : t("all_fees")}
                                </TableCell>
                                <TableCell className="capitalize">{t(concession.deduction_type)}</TableCell>
                                <TableCell>
                                  {concession.deduction_type === "percentage"
                                    ? `${concession.percentage}%`
                                    : formatCurrency(concession.amount || 0)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={concession.status === "Active" ? "default" : "outline"}>
                                    {t(concession.status || "inactive")}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                </>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">{t("no_concessions_have_been_applied_yet")}</p>
                </div>
              )}

              {feesStatus?.discounted_amount > 0 && (
                <div className="p-4 bg-green-50 border-t border-green-100">
                  <div className="flex justify-between items-center">
                    <p className="text-green-700 font-medium">{t("total_discount_applied")}:</p>
                    <p className="text-green-700 font-bold">{formatCurrency(feesStatus.discounted_amount)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      {/* {effectiveStudentId && (
        <PayFeesDialog
          enrolled_academic_session_id={currentAcademicSession?.id || 0}
          isOpen={isPayFeesDialogOpen}
          onClose={() => {
            setIsPayFeesDialogOpen(false)
            setSelectedInstallments([]) // Clear selected installments when dialog is closed
          }}
          onSuccessfulSubmit={() => {
            setIsPayFeesDialogOpen(false)
            setSelectedInstallments([]) // Clear selected installments after successful payment
            if (isStandaloneMode && effectiveStudentId) {
              getStudentFeesDetails({ student_id : effectiveStudentId , academic_session_id : academicSessionId! })
            }
          }}
          installments={selectedInstallmentForPayment ? [selectedInstallmentForPayment] : selectedInstallments}
          studentId={effectiveStudentId}
          totalAmount={calculateTotalSelectedAmount()}
          studentConcessions={studentData.provided_concession}
          planConcessions={studentFeeDetails.detail?.fees_plan?.concession_for_plan}
          availableConcessionBalance={concessionBalance}
        />
      )} */}

      {/* Installment Detail View Dialog */}
      <InstallmentDetailView
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        installment={selectedInstallmentForView}
        feeTypeDetails={selectedFeeTypeForView}
        studentDetails={studentFeeDetails}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusBadgeVariant={getStatusBadgeVariant}
        getFeeTypeName={getFeeTypeName}
      // schoolInfo={effectiveSchoolInfo}
      />

      {/* Payment Receipt Generator Dialog */}
      <PaymentReceiptGenerator
        isOpen={isReceiptGeneratorOpen}
        onClose={() => setIsReceiptGeneratorOpen(false)}
        payment={selectedPaymentForReceipt}
        studentDetails={studentFeeDetails}
        installmentDetails={selectedInstallmentForReceipt}
        feeTypeDetails={selectedFeeTypeForReceipt}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusBadgeVariant={getStatusBadgeVariant}
        getFeeTypeName={getFeeTypeName}
      // schoolInfo=""
      />

      {/* Update Status Dialog */}
      <Dialog
        open={isUpdateStatusDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsUpdateStatusDialogOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("update_payment_status")}</DialogTitle>
            <DialogDescription>
              {t("change_the_status_of_payment")} #{selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                {t("status")}
              </Label>
              <Select defaultValue={selectedPayment?.status}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("select_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">{t("paid")}</SelectItem>
                  <SelectItem value="Pending">{t("pending")}</SelectItem>
                  <SelectItem value="Overdue">{t("overdue")}</SelectItem>
                  <SelectItem value="Cancelled">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remarks" className="text-right">
                {t("remarks")}
              </Label>
              <Input
                id="remarks"
                defaultValue={selectedPayment?.remarks}
                className="col-span-3"
                placeholder={t("add_remarks_about_this_status_change")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              onClick={() => {
                toast({
                  title: t("status_updated"),
                  description: t("payment_status_has_been_updated_successfully"),
                })
                setIsUpdateStatusDialogOpen(false)
                // Implement actual status update logic here
              }}
            >
              {t("update_status")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentFeesDetailView

