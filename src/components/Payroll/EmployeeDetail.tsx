import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  ArrowLeft,
  User,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  Download,
  Printer,
  Mail,
  Phone,
  GraduationCap,
  Edit,
  AlertCircle,
} from "lucide-react"

// Import sub-components
import EmployeeOverview from "./Employee/EmployeeOverview"
import EmployeeSalaryDetails from "./Employee/EmployeeSalaryDetails"
import EmployeePayslips from "./Employee/EmployeePayslips"
import EmployeeLeaves from "./Employee/EmployeeLeaves"

// API service for staff data
import { useLazyGetStaffByIdQuery } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { StaffType } from "@/types/staff"

const EmployeeDetail = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { employeeId } = useParams<{ employeeId: string }>()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // API hooks
  const [getStaffById, { data: staffData, isLoading: isStaffLoading, error: staffError }] = useLazyGetStaffByIdQuery()

  const [employee, setEmployee] = useState<StaffType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        if (employeeId && currentAcademicSession) {
          // Try to fetch from API
          const response = await getStaffById(Number(employeeId))

          if (response.data) {
            setEmployee(response.data)
          } else {
            setEmployee(null)
            setError("Could not find employee with the specified ID")
            toast({
              title: "Employee not found",
              description: "Could not find employee with the specified ID",
              variant: "destructive",
            })
          }
        }
      } catch (err) {
        console.error("Error fetching employee data:", err)
        setError("Failed to load employee data. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load employee data. Please try again.",
        })
        setEmployee(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployeeData()
  }, [employeeId, currentAcademicSession, getStaffById])

  // Handle back navigation
  const handleBack = () => {
    navigate("/d/payroll/employee")
  }

  // Format date
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Permanent":
      case "Contract_Based":
        return "default"
      case "Resigned":
        return "destructive"
      case "Trial_Period":
      case "Notice_Period":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Get full name
  const getFullName = useMemo(() => {
    if (!employee) return ""
    return `${employee.first_name} ${employee.middle_name ? employee.middle_name + " " : ""}${employee.last_name}`
  }, [employee])

  // Get initials for avatar
  const getInitials = useMemo(() => {
    if (!employee) return ""
    return `${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`
  }, [employee])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
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
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex-1">
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_employees")}
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("employee_not_found")}</AlertTitle>
          <AlertDescription>
            {error || t("the_employee_you_are_looking_for_does_not_exist_or_has_been_removed")}
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">{t("unable_to_load_employee_details")}</p>
            <Button onClick={handleBack}>{t("return_to_employee_list")}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="outline" onClick={handleBack} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_employees")}
        </Button>

        <div className="flex gap-2">
          {/* <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> {t("print")}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> {t("export")}
          </Button> */}
          {/* <Button size="sm">
            <Edit className="mr-2 h-4 w-4" /> {t("edit")}
          </Button> */}
        </div>
      </div>

      {/* Employee Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage
                  src={`/abstract-geometric-shapes.png?height=96&width=96&query=${getFullName}`}
                  alt={getFullName}
                />
                <AvatarFallback className="text-2xl bg-primary/10">{getInitials}</AvatarFallback>
              </Avatar>
              <Badge className={`absolute -top-2 -right-2`} variant={getStatusBadgeVariant(employee.employment_status)}>
                {employee.employment_status?.replace("_", " ")}
              </Badge>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-3xl font-bold">{getFullName}</h1>
                <Badge variant="outline" className="w-fit">
                  {t("employee_code")}: {employee.employee_code}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{employee.role}</span>
                </div>
                {employee.subject_specialization && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{employee.subject_specialization}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t("joined")}: {formatDate(employee.joining_date)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{employee.mobile_number}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {employee.gender || "N/A"}
                </Badge>
                {employee.blood_group && (
                  <Badge variant="destructive" className="text-white flex items-center gap-1">
                    {employee.blood_group}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 ${
                    employee.is_teaching_role
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  <GraduationCap className="h-3 w-3" />
                  {employee.is_teaching_role ? "Teaching" : "Non-Teaching"}
                </Badge>
                {employee.qualification && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {employee.qualification}
                  </Badge>
                )}
              </div>
            </div>

            {/* <div className="w-full md:w-auto flex flex-col gap-2">
              <Card className="border-l-4 border-l-primary w-full md:w-64">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">{t("salary_information")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {employee.salary ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">{t("monthly_salary")}</span>
                        <span className="font-medium">
                          ₹{employee.salary?.monthly_salary?.toLocaleString() || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">{t("annual_ctc")}</span>
                        <span className="font-medium">₹{employee.salary?.annual_ctc?.toLocaleString() || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">{t("template")}</span>
                        <span className="font-medium">{employee.salary?.template_name || "N/A"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center text-amber-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">No salary assigned</span>
                      </div>
                      <Button size="sm" className="w-full" onClick={() => setActiveTab("salary")}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Assign Salary
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <User className="mr-2 h-4 w-4" /> {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" /> {t("salary_details")}
          </TabsTrigger>
          <TabsTrigger value="payslips" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> {t("payslips")}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" /> {t("leaves")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <EmployeeOverview employee={employee} />
        </TabsContent>

        {/* Salary Details Tab */}
        <TabsContent value="salary" className="space-y-6 mt-6">
          <EmployeeSalaryDetails employee={employee} />
        </TabsContent>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-6 mt-6">
          <EmployeePayslips employee={employee} />
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-6 mt-6">
          <EmployeeLeaves employee={employee} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EmployeeDetail
