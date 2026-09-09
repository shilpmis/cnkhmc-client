import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Printer, AlertCircle, Users, DollarSign, Clock, CheckCircle } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import {
    selectAuthState,
    selectActiveAccademicSessionsForSchool,
    selectAccademicSessionsForSchool,
} from "@/redux/slices/authSlice"
import { useLazyFetchInsatllmentWiseReportQuery, useFetchInstallmentDetailsQuery, useGetAllFeesTypeQuery } from "@/services/feesService"
import type { TypeOfInstallmentWiseReportForClass } from "@/types/fees"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"

const InstallmentWiseReport: React.FC = () => {
    const { t } = useTranslation()
    const authState = useAppSelector(selectAuthState)
    const academicClasses = useAppSelector(selectAcademicClasses)
    const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
    const allAcademicSessions = useAppSelector(selectAccademicSessionsForSchool)

    // State for form selections
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [selectedDivision, setSelectedDivision] = useState<string>("")
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("")
    const [selectedFeesType, setSelectedFeesType] = useState<string>("")
    const [selectedInstallment, setSelectedInstallment] = useState<string>("")

    // Report data state
    const [reportData, setReportData] = useState<TypeOfInstallmentWiseReportForClass[]>([])
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)

    const { data: feeTypes , refetch : refetchFeesType } = useGetAllFeesTypeQuery(
        { academic_session_id: Number(selectedAcademicYear) || 0, applicable_to: "All" },
        { skip: !selectedAcademicYear }
    )

    // API hooks
    const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
    const [fetchReport , {data : report}] = useLazyFetchInsatllmentWiseReportQuery()
    const {
        data: installmentDetails,
        isLoading: isInstallmentDetailsLoading,
        error: installmentDetailsError,
        refetch: refetchInstallmentDetails,
    } = useFetchInstallmentDetailsQuery(    
        {
            division_id: Number(selectedDivision),
            academic_session_id: Number(selectedAcademicYear),
        },
        { skip: !selectedDivision || !selectedAcademicYear },

    )

    // Set default academic year
    useEffect(() => {
        if (currentAcademicSession && !selectedAcademicYear) {
            setSelectedAcademicYear(currentAcademicSession.id.toString())
        }
    }, [currentAcademicSession, selectedAcademicYear])

    // Get available divisions based on selected class
    const availableDivisions = useMemo(() => {
        if (!academicClasses || !selectedClass) return []
        const classObj = academicClasses.find((cls) => cls.id.toString() === selectedClass)
        return classObj?.divisions || []
    }, [academicClasses, selectedClass])

    // Get available academic sessions
    const availableAcademicSessions = useMemo(() => {
        return allAcademicSessions || []
    }, [allAcademicSessions])

    // Calculate summary data from report
    const summaryData = useMemo(() => {
        if (!reportData.length) return null

        const totalStudents = reportData.length
        const totalAmount = report?.installment.installment_amount || 0
        const totalPaidAmount = reportData.reduce((sum, student) => sum + student.total_paid_amount, 0)
        const totalDiscountedAmount = reportData.reduce((sum, student) => sum + student.total_discounted_amount, 0)
        const totalRemainingAmount = reportData.reduce((sum, student) => sum + student.total_remaining_amount, 0)

        const paidStudents = reportData.filter((student) => student.total_remaining_amount === 0).length
        const partiallyPaidStudents = reportData.filter(
            (student) => student.total_paid_amount > 0 && student.total_remaining_amount > 0,
        ).length
        const pendingStudents = reportData.filter((student) => student.total_paid_amount === 0).length

        return {
            totalStudents,
            totalAmount,
            totalPaidAmount,
            totalDiscountedAmount,
            totalRemainingAmount,
            paidStudents,
            partiallyPaidStudents,
            pendingStudents,
        }
    }, [reportData])

    // Handle class change
    const handleClassChange = (classId: string) => {
        setSelectedClass(classId)
        setSelectedDivision("")
        setSelectedFeesType("")
        setSelectedInstallment("")
        setReportData([])
    }

    // Handle division change
    const handleDivisionChange = (divisionId: string) => {
        setSelectedDivision(divisionId)
        setSelectedFeesType("")
        setSelectedInstallment("")
        setReportData([])
    }

    // Handle academic year change
    const handleAcademicYearChange = (academicYear: string) => {
        setSelectedAcademicYear(academicYear)
        setSelectedFeesType("")
        setSelectedInstallment("")
        setReportData([])
    }

    // Handle fees type change
    const handleFeesTypeChange = (feesTypeId: string) => {
        setSelectedFeesType(feesTypeId)
        setSelectedInstallment("")
        setReportData([])
    }

    // Handle installment change
    const handleInstallmentChange = (installmentId: string) => {
        setSelectedInstallment(installmentId)
        setReportData([])
    }

    // Generate report
    const handleGenerateReport = async () => {
        if (!selectedDivision || !selectedAcademicYear || !selectedFeesType || !selectedInstallment) {
            toast({
                variant: "destructive",
                title: t("validation_error"),
                description: t("please_select_all_required_fields"),
            })
            return
        }

        setIsGeneratingReport(true)
        try {
            const response = await fetchReport({
                division_id: Number(selectedDivision),
                academic_session: Number(selectedAcademicYear),
                fees_type_id: Number(selectedFeesType),
                installment_id: Number(selectedInstallment),
            }).unwrap()

            setReportData(response.data)
            toast({
                title: t("success"),
                description: t("report_generated_successfully"),
            })
        } catch (error: any) {
            console.error("Error generating report:", error)
            toast({
                variant: "destructive",
                title: t("error"),
                description: error?.data?.message || t("failed_to_generate_report"),
            })
        } finally {
            setIsGeneratingReport(false)
        }
    }

    // Get payment status for a student
    const getPaymentStatus = (student: TypeOfInstallmentWiseReportForClass) => {
        console.log("student", student.total_paid_amount , report?.installment.installment_amount)
        if(student.total_paid_amount == 0 ) return "Pending"
        else if(Number(report?.installment.installment_amount) == Number(student.total_paid_amount)) return "Paid"        
        // if (student.total_paid_amount > 0) return "Partial"
        return "Pending"
    }

    // Export to Excel
    const handleExportToExcel = () => {
        if (!reportData.length) return

        const selectedClassObj = academicClasses?.find((cls) => cls.id.toString() === selectedClass)
        const selectedDivisionObj = availableDivisions.find((div) => div.id.toString() === selectedDivision)
        const selectedAcademicSessionObj = availableAcademicSessions.find(
            (session) => session.id.toString() === selectedAcademicYear,
        )

        const workbook = XLSX.utils.book_new()

        // Create main data sheet
        const worksheetData = [
            ["Installment Wise Fees Report"],
            [""],
            ["Class:", selectedClassObj ? selectedClassObj.class : ""],
            ["Division:", selectedDivisionObj ? selectedDivisionObj.division : ""],
            ["Academic Session:", selectedAcademicSessionObj?.session_name || ""],
            ["Generated On:", new Date().toLocaleDateString()],
            [""],
            [
                "GR No",
                "Student Name",
                "Enrollment Code",
                "Total Amount",
                "Paid Amount",
                "Discounted Amount",
                "Remaining Amount",
                "Payment Status",
                "Payment Count",
                "First Payment Date",
                "Last Payment Date",
            ],
        ]

        reportData.forEach((student) => {
            const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()
            worksheetData.push([
                student.gr_no.toString(),
                fullName,
                student.enrollment_code,
                report?.installment.installment_amount ?? '-',
                student.total_paid_amount.toString(),
                student.total_discounted_amount.toString(),
                student.total_remaining_amount.toString(),
                getPaymentStatus(student),
                student.payment_count.toString(),
                student.first_payment_date || "N/A",
                student.last_payment_date || "N/A",
            ])
        })

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        XLSX.utils.book_append_sheet(workbook, worksheet, "Installment Report")

        // Generate filename
        const filename = `Installment_Report_${selectedClassObj?.class || ""}_${selectedDivisionObj?.division || ""}_${new Date().toISOString().split("T")[0]}.xlsx`

        XLSX.writeFile(workbook, filename)
    }

    // Print report
    const handlePrint = () => {
        if (!reportData.length) return

        const selectedClassObj = academicClasses?.find((cls) => cls.id.toString() === selectedClass)
        const selectedDivisionObj = availableDivisions.find((div) => div.id.toString() === selectedDivision)
        const selectedAcademicSessionObj = availableAcademicSessions.find(
            (session) => session.id.toString() === selectedAcademicYear,
        )

        const printWindow = window.open("", "_blank")
        if (!printWindow) return

        const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Installment Wise Fees Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
            .summary-item { padding: 10px; border: 1px solid #ddd; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Installment Wise Fees Report</h1>
            <h3>${authState.user?.school?.name || "School Name"}</h3>
          </div>
          
          <div class="info">
            <div class="info-row">
              <span><strong>Class:</strong> ${selectedClassObj ? selectedClassObj.class : ""}</span>
              <span><strong>Division:</strong> ${selectedDivisionObj?.division || ""}</span>
            </div>
            <div class="info-row">
              <span><strong>Academic Session:</strong> ${selectedAcademicSessionObj?.session_name || ""}</span>
              <span><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>GR No</th>
                <th>Student Name</th>
                <th>Enrollment Code</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Discounted Amount</th>
                <th>Remaining Amount</th>
                <th>Status</th>
                <th>Payment Count</th>
                <th>First Payment</th>
                <th>Last Payment</th>
              </tr>
            </thead>
            <tbody>
              ${reportData
                .map((student) => {
                    const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()
                    // Data format (for possible JSON export or debugging)
                    // const studentData = {
                    //   gr_no: student.gr_no,
                    //   full_name: fullName,
                    //   enrollment_code: student.enrollment_code,
                    //   total_amount: student.total_amount,
                    //   total_paid_amount: student.total_paid_amount,
                    //   total_discounted_amount: student.total_discounted_amount,
                    //   total_remaining_amount: student.total_remaining_amount,
                    //   payment_status: getPaymentStatus(student),
                    //   payment_count: student.payment_count,
                    //   first_payment_date: student.first_payment_date || "N/A",
                    //   last_payment_date: student.last_payment_date || "N/A",
                    // }
                    return `
                    <tr>
                      <td>${student.gr_no}</td>
                      <td>${fullName}</td>
                      <td>${student.enrollment_code}</td>
                      <td>₹${report?.installment.installment_amount}</td>
                      <td>₹${student.total_paid_amount}</td>
                      <td>₹${student.total_discounted_amount}</td>
                      <td>₹${student.total_remaining_amount}</td>
                      <td>${getPaymentStatus(student)}</td>
                      <td>${student.payment_count}</td>
                      <td>${student.first_payment_date || "N/A"}</td>
                      <td>${student.last_payment_date || "N/A"}</td>
                    </tr>
                  `
                })
                .join("")}
            </tbody>
          </table>

        </body>
      </html>
    `

        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.print()
    }

    // Render payment status badge
    const renderStatusBadge = (student: TypeOfInstallmentWiseReportForClass) => {
        const status = getPaymentStatus(student)
        const statusConfig = {
            Paid: { color: "bg-green-100 text-green-800", icon: CheckCircle },
            Partial: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
            Pending: { color: "bg-red-100 text-red-800", icon: AlertCircle },
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        const Icon = config?.icon || AlertCircle

        return (
            <Badge variant="outline" className={`${config?.color || ""} flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        )
    }


      useEffect(() => {
        if (!academicClasses && authState.user) {
          getAcademicClasses(authState.user.school_id)
        }
      }, [academicClasses])

    // Refetch installment details when class, division, or academic year changes and all are selected
    useEffect(() => {
        if (selectedClass && selectedDivision && selectedAcademicYear) {
            refetchFeesType();
            refetchInstallmentDetails();
        }
    }, [selectedClass, selectedDivision, selectedAcademicYear, refetchInstallmentDetails]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t("installment_wise_fees_report")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Filter Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Class Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("class")}</label>
                            <Select value={selectedClass} onValueChange={handleClassChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicClasses?.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.class}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Division Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("division")}</label>
                            <Select value={selectedDivision} onValueChange={handleDivisionChange} disabled={!selectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_division")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDivisions.map((division) => (
                                        <SelectItem key={division.id} value={division.id.toString()}>
                                            {division.division} {division.aliases && `- ${division.aliases}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Academic Year Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("academic_year")}</label>
                            <Select value={selectedAcademicYear} onValueChange={handleAcademicYearChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_academic_year")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAcademicSessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id.toString()}>
                                            {session.session_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Fees Type Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("fees_type")}</label>
                            <Select
                                value={selectedFeesType}
                                onValueChange={handleFeesTypeChange}
                                disabled={!selectedDivision || !selectedAcademicYear || isInstallmentDetailsLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={isInstallmentDetailsLoading ? t("loading") + "..." : t("select_fees_type")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {installmentDetails?.fees_detail.map((fees_detail) =>
                                        <SelectItem key={fees_detail.id} value={fees_detail.fees_type_id.toString()}>
                                            {feeTypes ? 
                                            feeTypes.find((type) => type.id === fees_detail.fees_type_id)?.name || "Unknown Fees Type" : `Unknown Fees Type : ${fees_detail.fees_type_id}` }                                             
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Installment Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("installment")}</label>
                            <Select
                                value={selectedInstallment}
                                onValueChange={handleInstallmentChange}
                                disabled={!selectedFeesType || isInstallmentDetailsLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_installment")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {installmentDetails?.fees_detail.find((fees_detail) => fees_detail.fees_type_id === Number(selectedFeesType))?.installments_breakdown?.map((installment) => (
                                        <SelectItem key={installment.id} value={installment.id.toString()}>

                                            <span className="mx-2 text-gray-400">|</span>
                                            <span>
                                                <span className="font-semibold">Installment {installment.installment_no}</span>                                  <span className="text-sm text-gray-600">{new Date(installment.due_date).toLocaleDateString()}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Error Display for Installment Details */}
                    {installmentDetailsError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {(installmentDetailsError as any)?.data?.message || t("failed_to_load_fees_data")}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Generate Report Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleGenerateReport}
                            disabled={
                                !selectedDivision ||
                                !selectedAcademicYear ||
                                !selectedFeesType ||
                                !selectedInstallment ||
                                isGeneratingReport ||
                                isInstallmentDetailsLoading
                            }
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {isGeneratingReport ? t("generating") + "..." : t("generate_report")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report Results */}
            {reportData.length > 0 && summaryData && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{t("report_results")}</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    {t("print")}
                                </Button>
                                {/* <Button variant="outline" onClick={handleExportToExcel}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {t("export_excel")}
                                </Button> */}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Report Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">{t("class_division")}</p>
                                <p className="font-semibold">
                                    {academicClasses?.find((cls) => cls.id.toString() === selectedClass)?.class} -{" "}
                                    {availableDivisions.find((div) => div.id.toString() === selectedDivision)?.division}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{t("academic_session")}</p>
                                <p className="font-semibold">
                                    {
                                        availableAcademicSessions.find((session) => session.id.toString() === selectedAcademicYear)
                                            ?.session_name
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{t("generated_on")}</p>
                                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                    <p className="text-2xl font-bold">{summaryData.totalStudents}</p>
                                    <p className="text-sm text-gray-600">{t("total_students")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                    <p className="text-2xl font-bold">{summaryData.paidStudents}</p>
                                    <p className="text-sm text-gray-600">{t("paid_students")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                                    <p className="text-2xl font-bold">{summaryData.partiallyPaidStudents}</p>
                                    <p className="text-sm text-gray-600">{t("partially_paid")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                                    <p className="text-2xl font-bold">{summaryData.pendingStudents}</p>
                                    <p className="text-sm text-gray-600">{t("pending_students")}</p>
                                </CardContent>
                            </Card>
                        </div> */}

                        {/* Amount Summary Cards */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                    <p className="text-2xl font-bold">₹{summaryData.totalAmount}</p>
                                    <p className="text-sm text-gray-600">{t("total_amount")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                    <p className="text-2xl font-bold">₹{summaryData.totalPaidAmount}</p>
                                    <p className="text-sm text-gray-600">{t("paid_amount")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                    <p className="text-2xl font-bold">₹{summaryData.totalDiscountedAmount}</p>
                                    <p className="text-sm text-gray-600">{t("discounted_amount")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-red-600" />
                                    <p className="text-2xl font-bold">₹{summaryData.totalRemainingAmount}</p>
                                    <p className="text-sm text-gray-600">{t("remaining_amount")}</p>
                                </CardContent>
                            </Card>
                        </div> */}

                        {/* Students Data Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("gr_number")}</TableHead>
                                        <TableHead>{t("student_name")}</TableHead>
                                        <TableHead>{t("enrollment_code")}</TableHead>
                                        <TableHead className="text-right">{t("total_amount")}</TableHead>
                                        <TableHead className="text-right">{t("paid_amount")}</TableHead>
                                        <TableHead className="text-right">{t("discounted_amount")}</TableHead>
                                        <TableHead className="text-right">{t("remaining_amount")}</TableHead>
                                        <TableHead>{t("status")}</TableHead>
                                        <TableHead className="text-center">{t("payment_count")}</TableHead>
                                        <TableHead>{t("first_payment")}</TableHead>
                                        <TableHead>{t("last_payment")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map((student) => {
                                        const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()
                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.gr_no}</TableCell>
                                                <TableCell>{fullName}</TableCell>
                                                <TableCell>{student.enrollment_code}</TableCell>
                                                <TableCell className="text-right">₹{report?.installment.installment_amount}</TableCell>
                                                <TableCell className="text-right">₹{student.total_paid_amount}</TableCell>
                                                <TableCell className="text-right">₹{student.total_discounted_amount}</TableCell>
                                                <TableCell className="text-right">₹{student.total_remaining_amount}</TableCell>
                                                <TableCell>{renderStatusBadge(student)}</TableCell>
                                                <TableCell className="text-center">{student.payment_count}</TableCell>
                                                <TableCell>
                                                    {student.first_payment_date
                                                        ? new Date(student.first_payment_date).toLocaleDateString()
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {student.last_payment_date
                                                        ? new Date(student.last_payment_date).toLocaleDateString()
                                                        : "-"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Data Message */}
            {reportData.length === 0 &&
                !isGeneratingReport &&
                selectedDivision &&
                selectedAcademicYear &&
                !installmentDetailsError && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("no_data_found")}</h3>
                            <p className="text-gray-500">{t("no_installment_data_available_for_selected_filters")}</p>
                        </CardContent>
                    </Card>
                )}
        </div>
    )
}

export default InstallmentWiseReport
