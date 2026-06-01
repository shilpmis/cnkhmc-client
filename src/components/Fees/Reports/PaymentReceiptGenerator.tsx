"use client"
import type React from "react"
import { useMemo, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, FileText, CheckCircle2, Receipt, User, CreditCard, Tag } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetAllConcessionsQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentSchool } from "@/redux/slices/authSlice"

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
  getFeeTypeName: (feeTypeId: number, studentFeeDetails: any) => string
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
  getStatusBadgeVariant,
  getFeeTypeName,
}) => {
  const { t } = useTranslation()
  const receiptRef = useRef<HTMLDivElement>(null)

  const currentAcademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)
  const activeSchool = useAppSelector(selectCurrentSchool)
 
  // Get academic session ID for fee types query
  const academicSessionId = useMemo(() => {
    if (studentDetails?.detail?.fees_plan?.academic_session_id) {
      return studentDetails.detail.fees_plan.academic_session_id
    }
    // Fallback to effective academic session if needed
    return currentAcademicSessions?.id
  }, [studentDetails?.detail?.fees_plan?.academic_session_id, currentAcademicSessions])

  // Fetch concession types from API
  const { data: concessionTypes, isLoading: isLoadingConcessionTypes } = useGetAllConcessionsQuery(
    { academic_session_id: academicSessionId || 0 },
    { skip: !academicSessionId },
  )

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

  // Generate the current date in a readable format
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Custom print function without using react-to-print
  const handlePrint = () => {
    if (!receiptRef.current) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      console.error("Could not open print window")
      return
    }

    // Get the HTML content of the receipt
    const receiptContent = receiptRef.current.innerHTML

    // Create a complete HTML document with styles
    printWindow.document.open()
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt #${payment?.id || "default"}</title>
        <style>
          @media print {
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
              background-color: white;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              box-shadow: none;
              background-color: white;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .school-logo {
              max-height: 80px;
              margin-bottom: 10px;
            }
            .school-name {
              font-size: 24px;
              font-weight: bold;
              margin: 5px 0;
            }
            .school-address {
              font-size: 14px;
              margin: 5px 0;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: bold;
              margin: 15px 0;
              text-align: center;
            }
            .receipt-number {
              font-size: 16px;
              text-align: right;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .text-green {
              color: #16a34a;
            }
            .text-blue {
              color: #2563eb;
            }
            .text-amber {
              color: #d97706;
            }
            .badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-default {
              background-color: #22c55e;
              color: white;
            }
            .badge-outline {
              border: 1px solid #6b7280;
              color: #6b7280;
            }
            .badge-secondary {
              background-color: #6b7280;
              color: white;
            }
            .badge-destructive {
              background-color: #ef4444;
              color: white;
            }
            .separator {
              height: 1px;
              background-color: #e5e7eb;
              margin: 16px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .signature-line {
              margin-top: 40px;
              border-top: 1px solid #000;
              width: 160px;
              padding-top: 4px;
              text-align: center;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .info-column {
              flex: 1;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 120px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              color: rgba(0, 0, 0, 0.05);
              z-index: -1;
              pointer-events: none;
            }
            .note {
              font-size: 12px;
              font-style: italic;
              text-align: center;
              margin-top: 20px;
              color: #666;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.onfocus=function(){ window.close(); }">
        <div class="receipt-container">
          ${receiptContent}
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Simple download function that creates a text-based receipt
  const handleDownload = () => {
    if (!payment || !studentDetails || !installmentDetails || !feeTypeDetails) return

    // Create a text-based receipt
    const receiptText = `
PAYMENT RECEIPT
Receipt No: #${payment.id}

SCHOOL DETAILS
${activeSchool?.name || "School Name"}
${activeSchool?.address || "School Address"}
${activeSchool?.city || ""} ${activeSchool?.state || ""} ${activeSchool?.pincode || ""}
Phone: ${activeSchool?.contact_number || ""}
Email: ${activeSchool?.email || ""}

RECEIPT DETAILS
Date: ${formatDate(payment.payment_date)}
Payment Mode: ${payment.payment_mode}
${payment.transaction_reference ? `Reference: ${payment.transaction_reference}` : ""}
Status: ${payment.status}

STUDENT DETAILS
Name: ${studentDetails.student.first_name} ${studentDetails.student.middle_name || ""} ${studentDetails.student.last_name}
GR Number: ${studentDetails.student.gr_no}
Roll Number: ${studentDetails.student.roll_number}
Class: ${studentDetails.student.academic_class[0].class.class.class || ""} - ${studentDetails?.student.academic_class[0].class.division}
Fee Plan: ${studentDetails.detail?.fees_plan?.name || ""}

PAYMENT DETAILS
Description: ${getFeeTypeName(feeTypeDetails?.fees_type_id, studentDetails)} - ${feeTypeDetails?.installment_type || ""} ${installmentDetails?.installment_no || ""}
Amount: ${formatCurrency(installmentDetails?.installment_amount || payment.original_amount)}
${Number(payment.discounted_amount) > 0 ? `Discount: - ${formatCurrency(payment.discounted_amount)}` : ""}
${Number(payment.amount_paid_as_carry_forward) > 0 ? `Carry Forward: ${formatCurrency(payment.amount_paid_as_carry_forward)}` : ""}
${Number(payment.remaining_amount) > 0 ? `Remaining Amount: ${formatCurrency(payment.remaining_amount)}` : ""}
Total Paid: ${formatCurrency(payment.paid_amount)}

${
  payment.applied_concessions && payment.applied_concessions.length > 0
    ? `
APPLIED CONCESSIONS
${payment.applied_concessions
  .map(
    (concession: any) =>
      `Concession : ${getConcessionNameFromId(concession.concession_id)}, Amount: ${formatCurrency(concession.applied_amount)}`,
  )
  .join("\n")}
Total Concession: ${formatCurrency(payment.discounted_amount)}
`
    : ""
}

${payment.remarks ? `REMARKS\n${payment.remarks}` : ""}

Payment received with thanks.
This is a computer generated receipt and does not require a signature.

${activeSchool?.name || "School Name"} © ${new Date().getFullYear()}
    `.trim()

    // Create a Blob with the text content
    const blob = new Blob([receiptText], { type: "text/plain" })

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Payment_Receipt_${payment.id}.txt`
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  if (!payment || !studentDetails) return null

  const student = studentDetails.student
  const hasDiscount = Number(payment.discounted_amount) > 0
  const hasCarryForward = Number(payment.amount_paid_as_carry_forward) > 0
  const hasRemaining = Number(payment.remaining_amount) > 0

  console.log("studentDetails", studentDetails)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-primary" />
            {t("payment_receipt")} #{payment.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-2 mb-4">
          {/* <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> {t("download_receipt")}
          </Button> */}
          <Button size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> {t("print_receipt")}
          </Button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="bg-white p-6 border rounded-md shadow-sm" style={{ minHeight: "600px" }}>
          <div className="watermark">{payment.status === "Paid" ? "PAID" : payment.status}</div>

          {/* Receipt Header with School Logo and Info */}
          <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
            {activeSchool?.school_logo && (
              <img
                src={activeSchool.school_logo || "/placeholder.svg"}
                alt={`${activeSchool.name} Logo`}
                className="school-logo h-16 mx-auto mb-2"
              />
            )}
            <h1 className="school-name text-2xl font-bold text-gray-900">
              {activeSchool?.name || t("school_management_system")}
            </h1>
            <p className="school-address text-gray-600">
              {activeSchool?.address || ""}
              {activeSchool?.address && (activeSchool?.city || activeSchool?.state) && ", "}
              {activeSchool?.city || ""}
              {activeSchool?.city && activeSchool?.state && ", "}
              {activeSchool?.state || ""}
              {activeSchool?.pincode && ` - ${activeSchool.pincode}`}
            </p>
            {(activeSchool?.contact_number || activeSchool?.email) && (
              <p className="school-address text-gray-600">
                {activeSchool?.contact_number && `${t("phone")}: ${activeSchool.contact_number}`}
                {activeSchool?.contact_number && activeSchool?.email && " | "}
                {activeSchool?.email && `${t("email")}: ${activeSchool.email}`}
              </p>
            )}
          </div>

          {/* Receipt Title and Number */}
          <div className="receipt-title bg-gray-100 text-center py-2 rounded-md mb-6">
            <h2 className="text-xl font-bold text-gray-800">{t("payment_receipt").toUpperCase()}</h2>
          </div>

          <div className="receipt-number text-right mb-4">
            <p className="text-gray-700">
              <span className="font-semibold">{t("receipt_no")}:</span> #{payment.id} |
              <span className="font-semibold ml-2">{t("date")}:</span> {currentDate}
            </p>
          </div>

          {/* Info Sections - Student and Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Student Information */}
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
              <h3 className="font-semibold text-blue-800 flex items-center mb-3">
                <User className="mr-2 h-4 w-4" />
                {t("student_information")}
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("name")}:</span>
                  <span className="text-sm font-medium col-span-3">
                    {student.first_name} {student.middle_name} {student.last_name}
                  </span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("gr_number")}:</span>
                  <span className="text-sm font-medium col-span-3">{student.gr_no}</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("roll_number")}:</span>
                  <span className="text-sm font-medium col-span-3">{student.roll_number}</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("class")}:</span>
                  <span className="text-sm font-medium col-span-3">
                    {studentDetails.student.academic_class[0].class.class.class || ""} - {studentDetails?.student.academic_class[0].class.division}
                  </span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("fee_plan")}:</span>
                  <span className="text-sm font-medium col-span-3">
                    {studentDetails.detail?.fees_plan?.name || t("n/a")}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-green-50 border border-green-100 rounded-md p-4">
              <h3 className="font-semibold text-green-800 flex items-center mb-3">
                <CreditCard className="mr-2 h-4 w-4" />
                {t("payment_information")}
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("payment_date")}:</span>
                  <span className="text-sm font-medium col-span-3">{formatDate(payment.payment_date)}</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("payment_mode")}:</span>
                  <span className="text-sm font-medium col-span-3">{payment.payment_mode}</span>
                </div>
                {payment.transaction_reference && (
                  <div className="grid grid-cols-5">
                    <span className="text-sm text-gray-600 col-span-2">{t("reference")}:</span>
                    <span className="text-sm font-medium col-span-3">{payment.transaction_reference}</span>
                  </div>
                )}
                <div className="grid grid-cols-5">
                  <span className="text-sm text-gray-600 col-span-2">{t("status")}:</span>
                  <span className="text-sm font-medium col-span-3">
                    <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center mb-3">
              <FileText className="mr-2 h-4 w-4" />
              {t("payment_details")}
            </h3>
            <div className="overflow-hidden border border-gray-200 rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t("description")}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t("due_date")}</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t("amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-t border-gray-200">
                      {installmentDetails && feeTypeDetails ? (
                        <>
                          {getFeeTypeName(feeTypeDetails.fees_type_id, studentDetails)} -{" "}
                          {feeTypeDetails.installment_type || ""} {t("installment")}{" "}
                          {installmentDetails.installment_no || ""}
                        </>
                      ) : (
                        t("fee_payment")
                      )}
                    </td>
                    <td className="px-4 py-3 border-t border-gray-200">{formatDate(installmentDetails?.due_date)}</td>
                    <td className="px-4 py-3 border-t border-gray-200 text-right">
                      {formatCurrency(installmentDetails?.installment_amount || payment.original_amount)}
                    </td>
                  </tr>
                  {hasDiscount && (
                    <tr className="bg-green-50">
                      <td colSpan={2} className="px-4 py-3 border-t border-gray-200 text-green-700">
                        {t("discount_applied")}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-right text-green-700">
                        - {formatCurrency(payment.discounted_amount)}
                      </td>
                    </tr>
                  )}
                  {hasCarryForward && (
                    <tr className="bg-blue-50">
                      <td colSpan={2} className="px-4 py-3 border-t border-gray-200 text-blue-700">
                        {t("carry_forward_amount")}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-right text-blue-700">
                        {formatCurrency(payment.amount_paid_as_carry_forward)}
                      </td>
                    </tr>
                  )}
                  {hasRemaining && (
                    <tr className="bg-amber-50">
                      <td colSpan={2} className="px-4 py-3 border-t border-gray-200 text-amber-700">
                        {t("remaining_amount")}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-right text-amber-700">
                        {formatCurrency(payment.remaining_amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={2} className="px-4 py-3 border-t border-gray-200">
                      {t("total_paid")}
                    </td>
                    <td className="px-4 py-3 border-t border-gray-200 text-right">
                      {formatCurrency(payment.paid_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Applied Concessions */}
          {payment.applied_concessions && payment.applied_concessions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center mb-3">
                <Tag className="mr-2 h-4 w-4" />
                {t("applied_concessions")}
              </h3>
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t("concession")}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.applied_concessions.map((concession: any, idx: number) => (
                      <tr key={idx} className="bg-green-50">
                        <td className="px-4 py-3 border-t border-gray-200 flex items-center">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          {getConcessionNameFromId(concession.concession_id)}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-right text-green-600">
                          {formatCurrency(concession.applied_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-4 py-3 border-t border-gray-200">{t("total_concession")}</td>
                      <td className="px-4 py-3 border-t border-gray-200 text-right text-green-600">
                        {formatCurrency(payment.discounted_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Remarks */}
          {payment.remarks && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center mb-3">
                <FileText className="mr-2 h-4 w-4" />
                {t("remarks")}
              </h3>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">{payment.remarks}</div>
            </div>
          )}

          {/* Footer with Signatures */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="mt-10 border-t border-gray-800 w-40 mx-auto pt-1">
                  <p className="text-sm font-medium">{t("received_by")}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="mt-10 border-t border-gray-800 w-40 mx-auto pt-1">
                  <p className="text-sm font-medium">{t("authorized_signature")}</p>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 italic mt-8">
              {t("this_is_a_computer_generated_receipt_and_does_not_require_a_physical_signature")}
            </div>

            <div className="text-center text-sm font-medium mt-4">{t("payment_received_with_thanks")}</div>

            <div className="text-center text-xs text-gray-500 mt-2">
              {activeSchool?.name || t("school_management_system")} &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentReceiptGenerator
