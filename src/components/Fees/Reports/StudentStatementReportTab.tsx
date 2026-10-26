import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, FileText, Printer, ArrowUpDown, UserCheck, ShieldCheck, ReceiptText } from "lucide-react"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetStudentFeesDetailsForClassQuery } from "@/services/feesService"
import { StudentWithFeeStatus } from "@/types/fees"
import { Division } from "@/types/academic"
import { StudentFinancialStatementModal } from "./StudentFinancialStatementModal"
import FeeReceiptMakerDialog from "./FeeReceiptMakerDialog"

export const StudentStatementReportTab: React.FC = () => {
  const academicClasses = useAppSelector(selectAcademicClasses)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [getClassFeesStatus, { data: feesData, isLoading }] = useLazyGetStudentFeesDetailsForClassQuery()

  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statementStudentId, setStatementStudentId] = useState<number | null>(null)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)
  const [receiptStudent, setReceiptStudent] = useState<any>(null)
  const [isReceiptMakerOpen, setIsReceiptMakerOpen] = useState(false)

  // Auto-select first class & division if available
  useEffect(() => {
    if (academicClasses && academicClasses.length > 0 && !selectedClass) {
      const firstClassWithDivisions = academicClasses.find((cls) => cls.divisions.length > 0)
      if (firstClassWithDivisions) {
        setSelectedClass(firstClassWithDivisions.class.toString())
        setSelectedDivision(firstClassWithDivisions.divisions[0])
      }
    }
  }, [academicClasses, selectedClass])

  // Fetch fees status when class & division change
  useEffect(() => {
    if (selectedDivision && currentAcademicSession) {
      getClassFeesStatus({
        class_id: selectedDivision.id,
        academic_session: currentAcademicSession.id,
        page: 1,
      })
    }
  }, [selectedDivision, currentAcademicSession, getClassFeesStatus])

  const students: StudentWithFeeStatus[] = feesData?.students || []

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name} ${s.middle_name || ""} ${s.last_name}`.toLowerCase()
    const grNo = s.gr_no ? s.gr_no.toString() : ""
    const term = searchTerm.toLowerCase()
    return fullName.includes(term) || grNo.includes(term)
  })

  const handleOpenStatement = (studentId: number) => {
    setStatementStudentId(studentId)
    setIsStatementModalOpen(true)
  }

  const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return "₹0.00"
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return `₹${num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <FileText className="h-5 w-5 text-blue-600" />
            Individual Student Financial Statements & Cohort Ledgers
          </CardTitle>
          <p className="text-xs text-slate-500">
            Generate and print official student fee statements detailing locked quota totals, concessions, paid amounts to date, and granular installment history.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Class Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class</label>
              <Select
                value={selectedClass}
                onValueChange={(val) => {
                  setSelectedClass(val)
                  const classObj = academicClasses.find((cls) => cls.class.toString() === val)
                  if (classObj && classObj.divisions.length > 0) {
                    setSelectedDivision(classObj.divisions[0])
                  } else {
                    setSelectedDivision(null)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {academicClasses?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.class.toString()}>
                      {cls.class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Division</label>
              <Select
                value={selectedDivision?.id ? selectedDivision.id.toString() : ""}
                onValueChange={(val) => {
                  const classObj = academicClasses.find((cls) => cls.class.toString() === selectedClass)
                  if (classObj) {
                    const div = classObj.divisions.find((d) => d.id.toString() === val)
                    setSelectedDivision(div || null)
                  }
                }}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {academicClasses
                    .find((cls) => cls.class.toString() === selectedClass)
                    ?.divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id.toString()}>
                        Division {div.division} {div.aliases ? `(${div.aliases})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Search */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Search Student</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by student name or GR No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">GR No</TableHead>
                  <TableHead className="font-semibold text-slate-700">Student Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Admission Quota</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Locked Total Fee</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Paid to Date</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Outstanding Balance</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Statement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                      No students found for this division matching your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono font-medium text-slate-800">
                        {student.gr_no}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {student.first_name} {student.middle_name} {student.last_name}
                      </TableCell>
                      <TableCell>
                        {(student as any).quota_name ? (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            {(student as any).quota_name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-xs">
                            Standard
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatCurrency(student.fees_status.total_amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        {formatCurrency(student.fees_status.paid_amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-amber-700">
                        {formatCurrency(
                          Number(student.fees_status.total_amount) - Number(student.fees_status.paid_amount)
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-xs ${
                            student.fees_status.status === "Paid"
                              ? "bg-emerald-600 text-white"
                              : student.fees_status.status === "Partially Paid"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                          variant={student.fees_status.status === "Paid" ? "default" : "outline"}
                        >
                          {student.fees_status.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReceiptStudent(student)
                              setIsReceiptMakerOpen(true)
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5 text-xs"
                          >
                            <ReceiptText className="h-3.5 w-3.5 text-emerald-600" />
                            Make Receipt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenStatement(student.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 gap-1.5 text-xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            Statement
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal View */}
      <StudentFinancialStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        studentId={statementStudentId}
      />

      {/* Accountant Fee Receipt Maker */}
      <FeeReceiptMakerDialog
        isOpen={isReceiptMakerOpen}
        onClose={() => {
          setIsReceiptMakerOpen(false)
          setReceiptStudent(null)
        }}
        studentData={receiptStudent}
        studentId={receiptStudent?.id}
      />
    </div>
  )
}

export default StudentStatementReportTab
