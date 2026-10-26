import React, { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Printer,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Calendar,
  Building,
  User,
  CreditCard,
  History,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import {
  useGetStudentFinancialStatementQuery,
  useLockStudentFeeTemplateMutation,
  useExportStudentFinancialStatementExcelMutation,
} from "@/services/feesService"
import { toast } from "@/hooks/use-toast"

interface StudentFinancialStatementModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: number | null
}

export const StudentFinancialStatementModal: React.FC<StudentFinancialStatementModalProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const printRef = useRef<HTMLDivElement>(null)

  const {
    data: statementResponse,
    isLoading,
    isError,
    refetch,
  } = useGetStudentFinancialStatementQuery(
    { student_id: studentId! },
    { skip: !studentId || !isOpen }
  )

  const [lockFeeTemplate, { isLoading: isLocking }] = useLockStudentFeeTemplateMutation()
  const [exportExcelMutation, { isLoading: isExporting }] = useExportStudentFinancialStatementExcelMutation()

  const statement = statementResponse?.data

  const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return "₹0.00"
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return `₹${num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A"
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    if (!studentId) return
    try {
      const res = await exportExcelMutation({ student_id: studentId }).unwrap()
      if (res.file_url) {
        const a = document.createElement("a")
        a.href = res.file_url
        a.download = res.file_name
        a.target = "_blank"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
      toast({
        title: "Excel Statement Exported & Archived",
        description: `Saved to DigitalOcean Spaces: ${res.file_name}`,
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err?.data?.message || "Could not export statement to Excel.",
      })
    }
  }

  const handleLockTemplateManually = async () => {
    if (!studentId || !statement?.template.id) return
    try {
      await lockFeeTemplate({
        student_id: studentId,
        fees_plan_id: statement.template.id,
      }).unwrap()

      toast({
        title: "Fee Structure Locked",
        description: "Student fee template is now permanently locked for their cohort.",
      })
      refetch()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lock Failed",
        description: err?.data?.message || "Could not lock fee structure.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Fully Paid</Badge>
      case "Partially Paid":
        return <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50">Partially Paid</Badge>
      case "Pending":
      case "Unpaid":
        return <Badge variant="destructive">Payment Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 print:p-0 print:border-none print:shadow-none">
        {/* Modal Toolbar (hidden in print) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold text-slate-800">
              Student Financial Statement & Ledger
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {!statement?.template.is_locked && statement?.template.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLockTemplateManually}
                disabled={isLocking}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                {isLocking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2 text-amber-600" />
                )}
                Lock Fee Template
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-medium"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
              )}
              Export to Excel
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="h-4 w-4 mr-2" />
              Print Official Statement
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 font-medium">Generating real-time financial ledger statement...</p>
          </div>
        ) : isError || !statement ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Statement Not Available</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Could not retrieve the financial statement for this student. Ensure a valid fee template is assigned to their enrollment.
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : (
          <div ref={printRef} className="p-6 md:p-8 space-y-6 print:p-4 print:space-y-4 bg-white text-slate-900">
            {/* Header: Official CNKHMC Letterhead */}
            <div className="border-b pb-6 text-center space-y-2">
              <div className="flex justify-center items-center gap-2 text-blue-900 font-extrabold text-xl md:text-2xl tracking-wide uppercase">
                <Building className="h-7 w-7 text-blue-700 inline-block print:hidden" />
                C.N. Kothari Homoeopathic Medical College & Research Centre
              </div>
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                Affiliated with Veer Narmad South Gujarat University | Recognised by NCH, New Delhi
              </p>
              <p className="text-xs text-slate-500">
                Vyara, Dist. Tapi, Gujarat - 394650 | Phone: (02626) 220074
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border">
                  Official Student Fee Statement & Financial Ledger
                </span>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                Statement Generated: {formatDate(statement.statement_date)}
              </div>
            </div>

            {/* Student Demographics & Quota Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">Student Profile:</span>
                </div>
                <div className="text-base font-bold text-slate-900">{statement.student.full_name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="font-medium text-slate-700">GR No:</span> {statement.student.gr_no}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Roll No:</span> {statement.student.roll_number}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Class:</span> {statement.student.class_name} ({statement.student.division_name})
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Enrollment Year:</span> {statement.student.enrollment_year || "N/A"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 md:border-l md:pl-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Quota & Cohort Assignment:</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold border-blue-200">
                    {statement.student.quota_name || "General / Merit Quota"}
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    Cohort Session: {statement.student.cohort_session || "Standard"}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  Assigned Template: <span className="font-medium text-slate-700">{statement.template.name || "Default Class Template"}</span>
                </div>
              </div>
            </div>

            {/* Cohort-Based Grandfathering (Lock-in Rule) Status Banner */}
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
              statement.template.is_locked
                ? "bg-emerald-50/70 border-emerald-200"
                : "bg-blue-50/70 border-blue-200"
            }`}>
              {statement.template.is_locked ? (
                <Lock className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <Unlock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {statement.template.is_locked
                      ? "Cohort-Based Grandfathering Active (Fee Locked)"
                      : "Dynamic Fee Structure (Standard Class Template)"}
                  </span>
                  {statement.template.is_locked && (
                    <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold py-0">
                      Locked to Cohort
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {statement.template.is_locked
                    ? `This student's fee structure of ${formatCurrency(statement.template.locked_total_amount)} was locked on ${formatDate(statement.template.locked_at)}. Under institutional policy, this rate is preserved and protected for the student's entire degree program duration, unaffected by subsequent fee hikes.`
                    : "The fee structure is linked to the current academic session template. Administrators may lock this structure to permanently preserve these fee terms for this cohort."}
                </p>
              </div>
            </div>

            {/* Financial Ledger KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <Card className="bg-slate-50 border-slate-200 shadow-none">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500 uppercase font-medium">Locked Total Fee</p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 mt-1">
                    {formatCurrency(statement.financial_summary.locked_total_fee)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200 shadow-none">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500 uppercase font-medium">Concessions / Waivers</p>
                  <p className="text-lg md:text-xl font-bold text-emerald-600 mt-1">
                    -{formatCurrency(statement.financial_summary.concessions_discount)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50 border-emerald-200 shadow-none">
                <CardContent className="p-3">
                  <p className="text-xs text-emerald-700 uppercase font-medium">Total Paid to Date</p>
                  <p className="text-lg md:text-xl font-bold text-emerald-800 mt-1">
                    {formatCurrency(statement.financial_summary.paid_amount)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200 shadow-none">
                <CardContent className="p-3">
                  <p className="text-xs text-amber-700 uppercase font-medium">Outstanding Balance</p>
                  <p className="text-lg md:text-xl font-bold text-amber-900 mt-1">
                    {formatCurrency(statement.financial_summary.outstanding_balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Progress Bar */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded border">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                  <span>Settlement Progress:</span>
                </div>
                <span>
                  {statement.financial_summary.payment_percentage.toFixed(1)}% ({getStatusBadge(statement.financial_summary.status)})
                </span>
              </div>
              <Progress value={statement.financial_summary.payment_percentage} className="h-2" />
            </div>

            {/* Component-Wise Fee Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  1. Component-Wise Fee Breakdown & Installment Schedule
                </h4>
              </div>

              <div className="rounded border overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Fee Component</TableHead>
                      <TableHead className="font-semibold text-slate-700">Schedule Type</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Scheduled Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount Paid</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Outstanding</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.breakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                          No fee components recorded for this template.
                        </TableCell>
                      </TableRow>
                    ) : (
                      statement.breakdown.map((item) => (
                        <TableRow key={item.fee_plan_details_id}>
                          <TableCell className="font-medium text-slate-900">
                            {item.fee_type_name}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.installment_type} ({item.total_installment}x)
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total_amount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-700">
                            {formatCurrency(item.paid_amount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-amber-700">
                            {formatCurrency(item.due_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.due_amount <= 0 ? (
                              <Badge className="bg-emerald-600 text-[10px] py-0">Completed</Badge>
                            ) : item.paid_amount > 0 ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] py-0">
                                In Progress
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-slate-600 text-[10px] py-0">
                                Unpaid
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Granular Installment Schedule */}
            {statement.breakdown.some((b) => b.installments.length > 0) && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  2. Detailed Installments & Due Dates
                </h4>

                <div className="rounded border overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">Fee Component</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-center">Inst #</TableHead>
                        <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Scheduled (₹)</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Paid (₹)</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Balance (₹)</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.breakdown.flatMap((comp) =>
                        comp.installments.map((inst) => (
                          <TableRow key={`${comp.fee_plan_details_id}-${inst.installment_id}`}>
                            <TableCell className="text-slate-700 font-medium">{comp.fee_type_name}</TableCell>
                            <TableCell className="text-center font-bold text-slate-800">
                              #{inst.installment_no}
                            </TableCell>
                            <TableCell className="text-slate-600">{formatDate(inst.due_date)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(inst.scheduled_amount)}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-700">
                              {formatCurrency(inst.paid_amount)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-amber-700">
                              {formatCurrency(inst.remaining_amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {inst.status === "Paid" ? (
                                <Badge className="bg-emerald-600 text-[10px] py-0">Paid</Badge>
                              ) : inst.status === "Partially Paid" ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] py-0">
                                  Partial
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-slate-500 text-[10px] py-0">
                                  {inst.status}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Complete Transaction History */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                3. Transaction Ledger & Payment Receipts
              </h4>

              <div className="rounded border overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Receipt Ref #</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mode</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Amount Paid</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-slate-500">
                          No payments or transactions recorded to date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      statement.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono font-medium text-blue-700">
                            {tx.transaction_reference || `TXN-${tx.id}`}
                          </TableCell>
                          <TableCell className="text-slate-600">{formatDate(tx.payment_date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-slate-700 bg-white">
                              {tx.payment_mode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-800">
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`text-[10px] py-0 ${
                                tx.status === "Success" || tx.status === "Paid"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-[11px] max-w-xs truncate">
                            {tx.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Verification & Certification Sign-Off (for official prints) */}
            <div className="pt-8 border-t grid grid-cols-2 gap-8 text-xs text-slate-600">
              <div className="space-y-12">
                <p>Checked by: Accountant / Cashier</p>
                <div className="border-t border-slate-300 w-48 pt-1">
                  Signature & Seal
                </div>
              </div>
              <div className="space-y-12 text-right">
                <p>Authorized Signatory</p>
                <div className="border-t border-slate-300 w-48 ml-auto pt-1">
                  Principal / Administrative Officer
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 text-center pt-2">
              Note: This is a computer-generated statement issued by the CNKHMC Student Finance System. Any discrepancies should be reported to the Finance Department within 7 days.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StudentFinancialStatementModal
