"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface StudentFee {
  id: string
  studentName: string
  class: string
  division: string
  rollNumber: string
  totalFees: number
  paidAmount: number
  pendingAmount: number
  dueDate: string
  status: "Paid" | "Partially Paid" | "Pending" | "Overdue"
}

interface StudentFeeDetailsProps {
  student: StudentFee
  onClose: () => void
}

// Mock data for fee breakdown and payment history
const feeBreakdown = [
  { id: 1, feeType: "Tuition Fee", amount: 30000, paid: 20000, pending: 10000, dueDate: "2023-07-15" },
  { id: 2, feeType: "Activity Fee", amount: 5000, paid: 5000, pending: 0, dueDate: "2023-07-15" },
  { id: 3, feeType: "Transport Fee", amount: 8000, paid: 0, pending: 8000, dueDate: "2023-07-15" },
  { id: 4, feeType: "Library Fee", amount: 2000, paid: 0, pending: 2000, dueDate: "2023-07-15" },
]

const paymentHistory = [
  { id: 1, date: "2023-05-10", amount: 15000, mode: "Online", reference: "TXN123456", remarks: "First installment" },
  { id: 2, date: "2023-06-15", amount: 10000, mode: "Cash", reference: "", remarks: "Second installment" },
]

const concessions = [
  {
    id: 1,
    type: "Sibling Discount",
    amount: 5000,
    appliedOn: "Tuition Fee",
    approvedBy: "Principal",
    date: "2023-04-01",
  },
]

export const StudentFeeDetails: React.FC<StudentFeeDetailsProps> = ({ student, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("student_information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("name")}:</div>
                <div>{student.studentName}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("class")}:</div>
                <div>
                  {student.class}-{student.division}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("roll_number")}:</div>
                <div>{student.rollNumber}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fee_summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("total_fees")}:</div>
                <div>₹{student.totalFees.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("paid_amount")}:</div>
                <div>₹{student.paidAmount.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("pending_amount")}:</div>
                <div className="font-bold text-red-600">₹{student.pendingAmount.toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm font-medium">{t("status")}:</div>
                <div>
                  <Badge
                    variant={
                      student.status === "Paid"
                        ? "default"
                        : student.status === "Partially Paid"
                          ? "secondary"
                          : student.status === "Pending"
                            ? "secondary"
                            : "destructive"
                    }
                  >
                    {student.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">{t("fee_breakdown")}</TabsTrigger>
          <TabsTrigger value="history">{t("payment_history")}</TabsTrigger>
          <TabsTrigger value="concessions">{t("concessions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>{t("fee_breakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fee_types")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("paid")}</TableHead>
                    <TableHead>{t("pending")}</TableHead>
                    <TableHead>{t("due_date")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeBreakdown.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.feeType}</TableCell>
                      <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                      <TableCell>₹{fee.paid.toLocaleString()}</TableCell>
                      <TableCell>₹{fee.pending.toLocaleString()}</TableCell>
                      <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            fee.pending === 0
                              ? "default"
                              : fee.paid > 0
                                ? "secondary"
                                : new Date(fee.dueDate) < new Date()
                                  ? "destructive"
                                  : "secondary"
                          }
                        >
                          {fee.pending === 0
                            ? "Paid"
                            : fee.paid > 0
                              ? "Partially Paid"
                              : new Date(fee.dueDate) < new Date()
                                ? "Overdue"
                                : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment_history")}</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("payment_mode")}</TableHead>
                      <TableHead>{t("reference")}</TableHead>
                      <TableHead>{t("remarks")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.mode}</TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell>{payment.remarks || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">{t("no_payment_history_available")}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concessions">
          <Card>
            <CardHeader>
              <CardTitle>{t("applied_concessions")}</CardTitle>
            </CardHeader>
            <CardContent>
              {concessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("concession_type")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("applied_on")}</TableHead>
                      <TableHead>{t("approved_by")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {concessions.map((concession) => (
                      <TableRow key={concession.id}>
                        <TableCell>{concession.type}</TableCell>
                        <TableCell>₹{concession.amount.toLocaleString()}</TableCell>
                        <TableCell>{concession.appliedOn}</TableCell>
                        <TableCell>{concession.approvedBy}</TableCell>
                        <TableCell>{new Date(concession.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">{t("no_concessions_applied")}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onClose}>{t("close")}</Button>
      </div>
    </div>
  )
}

