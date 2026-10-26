"use client"
import type React from "react"
import { useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Download, Receipt, Sparkles, Copy, FileText } from "lucide-react"
import FeeReceiptMakerDialog from "./FeeReceiptMakerDialog"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetAllConcessionsQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentSchool } from "@/redux/slices/authSlice"
import {
  CNKHMCReceiptOptions,
  renderCNKHMCPageHtml,
  renderSingleReceiptHtml,
  numberToWordsIndianFormatted,
  formatDateDDMMYYYY,
} from "./CNKHMCFeeReceiptView"

interface PaymentReceiptGeneratorProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  studentDetails: any
  installmentDetails: any
  feeTypeDetails: any
  formatCurrency: (amount: string | number | null | undefined) => string
  formatDate: (dateString: string | null | undefined) => string
  getStatusBadgeVariant: (status: string) => "default" | "outline" | "secondary" | "destructive"
  getFeeTypeName: (feeTypeId: number, studentFeeDetails?: any) => string
}

const PaymentReceiptGenerator: React.FC<PaymentReceiptGeneratorProps> = ({
  isOpen,
  onClose,
  payment,
  studentDetails,
  installmentDetails,
  feeTypeDetails,
  formatCurrency,
  formatDate,
  getFeeTypeName,
}) => {
  const { t } = useTranslation()
  const [isTemplateMakerOpen, setIsTemplateMakerOpen] = useState(false)
  const [isDualCopy, setIsDualCopy] = useState(true)

  const currentAcademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)
  const activeSchool = useAppSelector(selectCurrentSchool)

  // Get academic session ID for fee types query
  const academicSessionId = useMemo(() => {
    if (studentDetails?.detail?.fees_plan?.academic_session_id) {
      return studentDetails.detail.fees_plan.academic_session_id
    }
    return currentAcademicSessions?.id
  }, [studentDetails?.detail?.fees_plan?.academic_session_id, currentAcademicSessions])

  // Fetch concession types from API if needed
  const { data: concessionTypes } = useGetAllConcessionsQuery(
    { academic_session_id: academicSessionId || 0 },
    { skip: !academicSessionId }
  )

  const getConcessionNameFromId = (concessionId: number): string => {
    if (!concessionId) return t("unknown_concession")
    if (concessionTypes && concessionTypes.length > 0) {
      const concession = concessionTypes.find((type) => type.id === concessionId)
      if (concession) return concession.name
    }
    return `${t("concession")} ${concessionId}`
  }

  // Build CNKHMC Receipt Options matching the reference PDF
  const receiptOptions: CNKHMCReceiptOptions = useMemo(() => {
    if (!payment || !studentDetails) {
      return {
        studentName: "",
        sid: "",
        level: "",
        receiptNo: "",
        course: "",
        academicYear: "",
        term: "",
        date: "",
        feeItems: [],
        totalAmount: 0,
        paymentMode: "Cash",
      }
    }

    const student = studentDetails.student || {}
    const studentFullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`
      .trim()
      .replace(/\s+/g, " ")

    // Student ID / SID (Roll no or Enrollment or GR)
    const sid = String(student.enrollment_no || student.gr_no || student.roll_number || "").trim()

    // Level (e.g. 3rd Year, 1st BHMS)
    const level = String(
      student.academic_class?.[0]?.class?.class?.class ||
      student.academic_class?.[0]?.class?.division ||
      student.class_name ||
      "BHMS"
    ).trim()

    // Course Name
    const course = String(
      studentDetails.detail?.fees_plan?.name ||
      student.course_name ||
      "BHMS Old Curriculum"
    ).trim()

    // Academic Year
    const academicYear = String(
      (activeSchool?.academicSessions || (activeSchool as any)?.academic_sessions)?.find(
        (s: any) => s.id === (payment.academic_session_id || studentDetails?.detail?.fees_plan?.academic_session_id)
      )?.session_name ||
      currentAcademicSessions?.session_name ||
      studentDetails.detail?.fees_plan?.academic_year ||
      "2023-2024"
    ).trim()

    // Term / Installment No
    const term = String(installmentDetails?.installment_no || feeTypeDetails?.installment_no || "1").trim()

    // Receipt Number
    const receiptNo = String(payment.id || payment.receipt_no || "7516").trim()

    // Receipt Date (DD-MM-YYYY)
    const rawDate = payment.payment_date || new Date().toISOString()
    const formattedDate = formatDateDDMMYYYY(rawDate)

    // Fee Title
    const feeTitle = (
      (feeTypeDetails?.fees_type_id
        ? getFeeTypeName(feeTypeDetails.fees_type_id, studentDetails)
        : null) ||
      feeTypeDetails?.name ||
      "TUTION FEE-M/G"
    ).toUpperCase()

    // Fee Amount
    const paidAmt = Number(payment.paid_amount || payment.amount || 0)

    // Items for the 6-column breakdown
    const feeItems = [
      {
        title: feeTitle,
        amount: paidAmt,
      },
    ]

    // If there were concessions applied, include note in remarks or items
    let remarkText = payment.remarks || "-"
    if (payment.applied_concessions && payment.applied_concessions.length > 0) {
      const concNames = payment.applied_concessions
        .map((c: any) => `${getConcessionNameFromId(c.concession_id)}: ₹${c.applied_amount}`)
        .join(", ")
      remarkText = `${remarkText !== "-" ? remarkText + " | " : ""}Concession: ${concNames}`
    }

    const isMess =
      feeTitle.includes("MESS") ||
      String(payment?.fee_type || "").toUpperCase().includes("MESS") ||
      String(payment?.category || "").toUpperCase().includes("MESS")

    const isHostel =
      !isMess && (
        feeTitle.includes("HOSTEL") ||
        String(payment?.fee_type || "").toUpperCase().includes("HOSTEL") ||
        String(payment?.category || "").toUpperCase().includes("HOSTEL")
      )

    return {
      studentName: studentFullName,
      sid: sid || "0101010120210057",
      level: level || "3rd Year",
      receiptNo: receiptNo || "7516",
      course: course || "BHMS",
      academicYear: academicYear || "2023-2024",
      term: term || "1",
      date: formattedDate,
      feeItems,
      totalAmount: paidAmt,
      amountInWords: numberToWordsIndianFormatted(paidAmt),
      paymentMode: payment.payment_mode || "NEFT/RTGS",
      bankName: payment.bank_name || "",
      transactionRef: payment.transaction_reference || "N/A",
      paymentDate: formattedDate,
      remark: remarkText,
      barcodeText1: receiptNo.padStart(6, "0"),
      barcodeText2: sid ? sid.slice(-9) : "943900200",
      isHostel,
      isMess,
      hostelName: "Kantaba Girls Hostel",
      messName: "Rama Harshad Mess",
      receiptCategory: isMess ? "mess" : isHostel ? "hostel" : "college",
    }
  }, [
    payment,
    studentDetails,
    installmentDetails,
    feeTypeDetails,
    currentAcademicSessions,
    activeSchool,
    getFeeTypeName,
  ])

  // Custom Print Function with High Fidelity & Two Copies on single A4 sheet
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1000")
    if (!printWindow) {
      console.error("Could not open print window")
      return
    }

    const receiptHtml = isDualCopy
      ? renderCNKHMCPageHtml(receiptOptions)
      : renderSingleReceiptHtml(receiptOptions)

    printWindow.document.open()
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${receiptOptions.sid} - ${receiptOptions.receiptNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          @media print {
            body { 
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0;
              color: #000000;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cnkhmc-a4-page {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 8px;
            background: #ffffff;
            color: #000000;
          }
        </style>
      </head>
      <body onload="window.print(); setTimeout(() => window.close(), 500);">
        ${receiptHtml}
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Simple download text function
  const handleDownloadTxt = () => {
    if (!payment || !studentDetails) return

    const receiptText = `
C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE & RESEARCH CENTER, VYARA
FEE RECEIPT (OFFICIAL)
========================================================================
Receipt No: ${receiptOptions.receiptNo}
Date: ${receiptOptions.date}
Student Name: ${receiptOptions.studentName}
SID: ${receiptOptions.sid}
Level: ${receiptOptions.level}
Course: ${receiptOptions.course}
Academic Year: ${receiptOptions.academicYear}
Term: ${receiptOptions.term}
------------------------------------------------------------------------
Fee Title: ${receiptOptions.feeItems[0]?.title || "TUTION FEE"}
Amount: Rs. ${Number(receiptOptions.totalAmount).toLocaleString("en-IN")}
Total: Rs. ${Number(receiptOptions.totalAmount).toLocaleString("en-IN")}
------------------------------------------------------------------------
Amount in Words: ${receiptOptions.amountInWords}
Payment Mode: ${receiptOptions.paymentMode} ${receiptOptions.bankName ? `(Bank: ${receiptOptions.bankName})` : ""}
Transaction Details: ${receiptOptions.transactionRef}
Remark: ${receiptOptions.remark}
========================================================================
Authorized Signature
    `.trim()

    const blob = new Blob([receiptText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Fee_Receipt_${receiptOptions.receiptNo}.txt`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  if (!payment || !studentDetails) return null

  const renderedPreviewHtml = isDualCopy
    ? renderCNKHMCPageHtml(receiptOptions)
    : renderSingleReceiptHtml(receiptOptions)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[890px] max-h-[94vh] overflow-hidden flex flex-col p-0 border-slate-300">
        <DialogHeader className="px-6 py-3.5 border-b bg-slate-900 text-white shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                <Receipt className="h-5 w-5 text-emerald-400" />
                C. N. Kothari Fee Receipt #{receiptOptions.receiptNo}
              </DialogTitle>
              <p className="text-xs text-slate-300 mt-0.5">
                Official College Form matching previous ERP printout with dual copies on single A4 sheet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className={`text-xs h-7 gap-1 border-slate-600 ${
                  isDualCopy ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-800 text-slate-300"
                }`}
                onClick={() => setIsDualCopy(!isDualCopy)}
              >
                <Copy className="h-3.5 w-3.5" />
                {isDualCopy ? "Dual Copies (2 on A4)" : "Single Copy"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-3">
            <span><strong>Student:</strong> {receiptOptions.studentName}</span>
            <span>&bull;</span>
            <span><strong>SID:</strong> {receiptOptions.sid}</span>
            <span>&bull;</span>
            <span><strong>Amount:</strong> ₹{Number(receiptOptions.totalAmount).toLocaleString("en-IN")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 border-slate-300 text-slate-700 hover:bg-slate-200 gap-1.5"
              onClick={handleDownloadTxt}
            >
              <Download className="h-3.5 w-3.5" />
              Download TXT
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5 text-xs h-8"
              onClick={() => setIsTemplateMakerOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Custom Template Maker
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print Official Receipt
            </Button>
          </div>
        </div>

        {/* Receipt Live Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-200/60 flex justify-center">
          <div
            className="bg-white shadow-lg border border-slate-300 p-4 w-full max-w-[820px] rounded-sm transition-all"
            dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
          />
        </div>

        {/* Optional Custom Template Maker Dialog */}
        {isTemplateMakerOpen && (
          <FeeReceiptMakerDialog
            isOpen={isTemplateMakerOpen}
            onClose={() => setIsTemplateMakerOpen(false)}
            studentData={studentDetails?.student}
            paymentData={payment}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PaymentReceiptGenerator
