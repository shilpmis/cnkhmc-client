"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import { FileText, Download, Printer, Mail, Eye, Calendar, DollarSign, Clock } from "lucide-react"

// Mock data types
interface Payslip {
  id: number
  month: string
  year: number
  payDate: string
  grossSalary: number
  totalDeductions: number
  netSalary: number
  status: "Paid" | "Processing" | "Failed"
  isPrinted: boolean
  isEmailed: boolean
}

// Mock data for payslips
const mockPayslips: Payslip[] = [
  {
    id: 1,
    month: "April",
    year: 2023,
    payDate: "2023-04-30",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 2,
    month: "May",
    year: 2023,
    payDate: "2023-05-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 3,
    month: "June",
    year: 2023,
    payDate: "2023-06-30",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 4,
    month: "July",
    year: 2023,
    payDate: "2023-07-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 5,
    month: "August",
    year: 2023,
    payDate: "2023-08-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 6,
    month: "September",
    year: 2023,
    payDate: "2023-09-30",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 7,
    month: "October",
    year: 2023,
    payDate: "2023-10-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 8,
    month: "November",
    year: 2023,
    payDate: "2023-11-30",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 9,
    month: "December",
    year: 2023,
    payDate: "2023-12-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 10,
    month: "January",
    year: 2024,
    payDate: "2024-01-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 11,
    month: "February",
    year: 2024,
    payDate: "2024-02-29",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: true,
    isEmailed: true,
  },
  {
    id: 12,
    month: "March",
    year: 2024,
    payDate: "2024-03-31",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Paid",
    isPrinted: false,
    isEmailed: false,
  },
  {
    id: 13,
    month: "April",
    year: 2024,
    payDate: "2024-04-30",
    grossSalary: 45000,
    totalDeductions: 4400,
    netSalary: 40600,
    status: "Processing",
    isPrinted: false,
    isEmailed: false,
  },
]

interface EmployeeProps {
  employee: any
}

const EmployeePayslips: React.FC<EmployeeProps> = ({ employee }) => {
  const { t } = useTranslation()
  const [selectedYear, setSelectedYear] = useState<string>("2024")
  const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)

  // Filter payslips by year
  const filteredPayslips = mockPayslips
    .filter((payslip) => payslip.year.toString() === selectedYear)
    .sort((a, b) => b.id - a.id) // Sort by newest first

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Paid":
        return "default"
      case "Processing":
        return "secondary"
      case "Failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Handle view payslip
  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip)
    setIsPayslipDialogOpen(true)
  }

  // Handle download payslip
  const handleDownloadPayslip = (payslip: Payslip) => {
    toast({
      title: "Downloading payslip",
      description: `Payslip for ${payslip.month} ${payslip.year} is being downloaded`,
    })
  }

  // Handle print payslip
  const handlePrintPayslip = (payslip: Payslip) => {
    toast({
      title: "Printing payslip",
      description: `Payslip for ${payslip.month} ${payslip.year} is being sent to printer`,
    })
  }

  // Handle email payslip
  const handleEmailPayslip = (payslip: Payslip) => {
    toast({
      title: "Emailing payslip",
      description: `Payslip for ${payslip.month} ${payslip.year} is being emailed to ${employee.email}`,
    })
  }

  // Available years for filtering
  const availableYears = Array.from(new Set(mockPayslips.map((payslip) => payslip.year.toString())))

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t("payslips")}</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t("select_year")} />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("payslip_history")}
          </CardTitle>
          <CardDescription>{t("view_and_download_employee_payslips")}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("no_payslips_found_for_selected_year")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("month_year")}</TableHead>
                  <TableHead>{t("pay_date")}</TableHead>
                  <TableHead>{t("gross_salary")}</TableHead>
                  <TableHead>{t("deductions")}</TableHead>
                  <TableHead>{t("net_salary")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.month} {payslip.year}
                    </TableCell>
                    <TableCell>{formatDate(payslip.payDate)}</TableCell>
                    <TableCell>{formatCurrency(payslip.grossSalary)}</TableCell>
                    <TableCell className="text-red-500">{formatCurrency(payslip.totalDeductions)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payslip.netSalary)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payslip.status)}>{payslip.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewPayslip(payslip)}
                          disabled={payslip.status !== "Paid"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPayslip(payslip)}
                          disabled={payslip.status !== "Paid"}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintPayslip(payslip)}
                          disabled={payslip.status !== "Paid"}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEmailPayslip(payslip)}
                          disabled={payslip.status !== "Paid"}
                        >
                          <Mail className="h-4 w-4" />
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

      {/* Payslip Detail Dialog */}
      <Dialog open={isPayslipDialogOpen} onOpenChange={setIsPayslipDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {t("payslip_for")} {selectedPayslip?.month} {selectedPayslip?.year}
            </DialogTitle>
            <DialogDescription>{t("detailed_view_of_employee_payslip")}</DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{employee.name}</h3>
                    <p className="text-muted-foreground">{employee.code}</p>
                    <p className="text-muted-foreground">{employee.role}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold">{t("payslip")}</h3>
                    <p className="text-muted-foreground">
                      {selectedPayslip.month} {selectedPayslip.year}
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <p className="text-muted-foreground">{formatDate(selectedPayslip.payDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("department")}</p>
                    <p className="font-medium">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("bank_account")}</p>
                    <p className="font-medium">
                      {employee.bankDetails?.bankName} - {employee.bankDetails?.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("payment_mode")}</p>
                    <p className="font-medium">{t("bank_transfer")}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    {t("earnings")}
                  </h4>
                  <div className="border rounded-lg divide-y">
                    <div className="flex justify-between p-3">
                      <span>{t("basic_salary")}</span>
                      <span className="font-medium">₹22,500</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span>{t("house_rent_allowance")}</span>
                      <span className="font-medium">₹9,000</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span>{t("dearness_allowance")}</span>
                      <span className="font-medium">₹4,500</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span>{t("transport_allowance")}</span>
                      <span className="font-medium">₹3,000</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span>{t("special_allowance")}</span>
                      <span className="font-medium">₹6,000</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted">
                      <span className="font-bold">{t("total_earnings")}</span>
                      <span className="font-bold">₹45,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-red-500" />
                    {t("deductions")}
                  </h4>
                  <div className="border rounded-lg divide-y">
                    <div className="flex justify-between p-3">
                      <span>{t("provident_fund")}</span>
                      <span className="font-medium">₹2,700</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span>{t("professional_tax")}</span>
                      <span className="font-medium">₹200</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span>{t("income_tax")}</span>
                      <span className="font-medium">₹1,500</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted">
                      <span className="font-bold">{t("total_deductions")}</span>
                      <span className="font-bold">₹4,400</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-primary" />
                      {t("net_salary")}
                    </h4>
                    <div className="border rounded-lg p-4 bg-primary/5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{t("net_pay")}</span>
                        <span className="text-xl font-bold">₹40,600</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("forty_thousand_six_hundred_rupees_only")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {t("generated_on")} {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPayslipDialogOpen(false)}>
                {t("close")}
              </Button>
              <Button variant="outline" className="flex items-center">
                <Printer className="mr-2 h-4 w-4" />
                {t("print")}
              </Button>
              <Button className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                {t("download")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EmployeePayslips
