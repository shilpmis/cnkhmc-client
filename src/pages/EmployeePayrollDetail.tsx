"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  ArrowLeft,
  Save,
  Edit,
  User,
  Building,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Briefcase,
  Download,
  Printer,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react"

// Mock data types
interface Employee {
  id: number
  name: string
  code: string
  role: string
  department: string
  payrollStatus: "Active" | "Inactive" | "Pending"
  joiningDate: string
  salary: number
  email: string
  phone: string
  bankDetails: {
    accountNumber: string
    bankName: string
    ifscCode: string
    branch: string
  }
  epfNo: string
  uanNo: string
  pfAccountNo: string
  salaryTemplate: string
  salaryComponents: SalaryComponent[]
}

interface SalaryComponent {
  id: number
  name: string
  type: "Earning" | "Deduction" | "Benefit"
  amount: number
  percentage?: number
  isPercentage: boolean
  isEditable: boolean
  isActive: boolean
}

// Mock employee data
const mockEmployeeData: Record<string, Employee> = {
  "1": {
    id: 1,
    name: "John Doe",
    code: "EMP001",
    role: "Teacher",
    department: "Science",
    payrollStatus: "Active",
    joiningDate: "2022-06-15",
    salary: 45000,
    email: "john.doe@school.edu",
    phone: "+91 9876543210",
    bankDetails: {
      accountNumber: "1234567890",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      branch: "Main Branch, City Center",
    },
    epfNo: "EP12345678",
    uanNo: "UAN123456789012",
    pfAccountNo: "PF12345678",
    salaryTemplate: "Teacher Grade II",
    salaryComponents: [
      {
        id: 1,
        name: "Basic Salary",
        type: "Earning",
        amount: 22500,
        percentage: 50,
        isPercentage: true,
        isEditable: true,
        isActive: true,
      },
      {
        id: 2,
        name: "House Rent Allowance",
        type: "Earning",
        amount: 9000,
        percentage: 20,
        isPercentage: true,
        isEditable: true,
        isActive: true,
      },
      {
        id: 3,
        name: "Dearness Allowance",
        type: "Earning",
        amount: 4500,
        percentage: 10,
        isPercentage: true,
        isEditable: true,
        isActive: true,
      },
      {
        id: 4,
        name: "Transport Allowance",
        type: "Earning",
        amount: 3000,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 5,
        name: "Special Allowance",
        type: "Earning",
        amount: 6000,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 6,
        name: "Provident Fund",
        type: "Deduction",
        amount: 2700,
        percentage: 6,
        isPercentage: true,
        isEditable: false,
        isActive: true,
      },
      {
        id: 7,
        name: "Professional Tax",
        type: "Deduction",
        amount: 200,
        isPercentage: false,
        isEditable: false,
        isActive: true,
      },
      {
        id: 8,
        name: "Income Tax",
        type: "Deduction",
        amount: 1500,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 9,
        name: "Health Insurance",
        type: "Benefit",
        amount: 1000,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 10,
        name: "Meal Vouchers",
        type: "Benefit",
        amount: 2000,
        isPercentage: false,
        isEditable: true,
        isActive: false,
      },
    ],
  },
  "2": {
    id: 2,
    name: "Jane Smith",
    code: "EMP002",
    role: "Head Teacher",
    department: "Mathematics",
    payrollStatus: "Active",
    joiningDate: "2021-08-10",
    salary: 65000,
    email: "jane.smith@school.edu",
    phone: "+91 9876543211",
    bankDetails: {
      accountNumber: "9876543210",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0002345",
      branch: "City Mall Branch",
    },
    epfNo: "EP87654321",
    uanNo: "UAN987654321098",
    pfAccountNo: "PF87654321",
    salaryTemplate: "Head Teacher Grade I",
    salaryComponents: [
      {
        id: 1,
        name: "Basic Salary",
        type: "Earning",
        amount: 32500,
        percentage: 50,
        isPercentage: true,
        isEditable: true,
        isActive: true,
      },
      {
        id: 2,
        name: "House Rent Allowance",
        type: "Earning",
        amount: 13000,
        percentage: 20,
        isPercentage: true,
        isEditable: true,
        isActive: true,
      },
      {
        id: 3,
        name: "Dearness Allowance",
        type: "Earning",
        amount: 6500,
        percentage: 10,
        isPercentage: true,
        isEditable: true,
        isActive: true,
      },
      {
        id: 4,
        name: "Transport Allowance",
        type: "Earning",
        amount: 4000,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 5,
        name: "Special Allowance",
        type: "Earning",
        amount: 9000,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 6,
        name: "Provident Fund",
        type: "Deduction",
        amount: 3900,
        percentage: 6,
        isPercentage: true,
        isEditable: false,
        isActive: true,
      },
      {
        id: 7,
        name: "Professional Tax",
        type: "Deduction",
        amount: 200,
        isPercentage: false,
        isEditable: false,
        isActive: true,
      },
      {
        id: 8,
        name: "Income Tax",
        type: "Deduction",
        amount: 3500,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 9,
        name: "Health Insurance",
        type: "Benefit",
        amount: 1500,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
      {
        id: 10,
        name: "Leadership Allowance",
        type: "Benefit",
        amount: 5000,
        isPercentage: false,
        isEditable: true,
        isActive: true,
      },
    ],
  },
}

const EmployeePayrollDetail = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { employeeId } = useParams<{ employeeId: string }>()

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null)
  const [editedComponents, setEditedComponents] = useState<SalaryComponent[]>([])

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        setTimeout(() => {
          if (employeeId && mockEmployeeData[employeeId]) {
            setEmployee(mockEmployeeData[employeeId])
            setEditedEmployee(mockEmployeeData[employeeId])
            setEditedComponents(mockEmployeeData[employeeId].salaryComponents)
          }
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching employee data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load employee data. Please try again.",
        })
        setIsLoading(false)
      }
    }

    fetchEmployeeData()
  }, [employeeId])

  // Handle back navigation
  const handleBack = () => {
    navigate("/d/payroll/employees")
  }

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      if (employee && editedEmployee) {
        setEmployee(editedEmployee)
        setEditedComponents(editedComponents)
        toast({
          title: "Changes saved",
          description: "Employee payroll details have been updated",
        })
      }
    }
    setIsEditing(!isEditing)
  }

  // Handle input change for employee details
  const handleInputChange = (field: any, value: string) => {
    if (editedEmployee) {
      if (
        field === "bankDetails.accountNumber" ||
        field === "bankDetails.bankName" ||
        field === "bankDetails.ifscCode" ||
        field === "bankDetails.branch"
      ) {
        const [parent, child] = field.split(".")
        setEditedEmployee({
          ...editedEmployee,
          bankDetails: {
            ...editedEmployee.bankDetails,
            [child]: value,
          },
        })
      } else {
        setEditedEmployee({
          ...editedEmployee,
          [field]: value,
        })
      }
    }
  }

  // Handle salary component change
  const handleComponentChange = (id: number, field: keyof SalaryComponent, value: any) => {
    setEditedComponents(
      editedComponents.map((component) => (component.id === id ? { ...component, [field]: value } : component)),
    )
  }

  // Calculate total earnings
  const calculateTotalEarnings = (components: SalaryComponent[]) => {
    return components
      .filter((comp) => comp.type === "Earning" && comp.isActive)
      .reduce((sum, comp) => sum + comp.amount, 0)
  }

  // Calculate total deductions
  const calculateTotalDeductions = (components: SalaryComponent[]) => {
    return components
      .filter((comp) => comp.type === "Deduction" && comp.isActive)
      .reduce((sum, comp) => sum + comp.amount, 0)
  }

  // Calculate total benefits
  const calculateTotalBenefits = (components: SalaryComponent[]) => {
    return components
      .filter((comp) => comp.type === "Benefit" && comp.isActive)
      .reduce((sum, comp) => sum + comp.amount, 0)
  }

  // Calculate net salary
  const calculateNetSalary = (components: SalaryComponent[]) => {
    const earnings = calculateTotalEarnings(components)
    const deductions = calculateTotalDeductions(components)
    return earnings - deductions
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      case "Pending":
        return "outline"
      default:
        return "default"
    }
  }

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

  if (!employee) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back_to_employees")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t("employee_not_found")}</CardTitle>
            <CardDescription>
              {t("the_employee_you_are_looking_for_does_not_exist_or_has_been_removed")}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleBack}>{t("return_to_employee_list")}</Button>
          </CardFooter>
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
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> {t("print")}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> {t("export")}
          </Button>
          <Button size="sm" variant={isEditing ? "default" : "outline"} onClick={handleEditToggle}>
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" /> {t("save_changes")}
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" /> {t("edit")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Employee Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                {employee.name}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center">
                <Badge className="mr-2">{employee.code}</Badge>
                <Badge variant={getStatusBadgeVariant(employee.payrollStatus)}>{employee.payrollStatus}</Badge>
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-sm text-muted-foreground">{t("net_salary")}</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(calculateNetSalary(employee.salaryComponents))}
              </div>
              <div className="text-xs text-muted-foreground">{t("per_month")}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-2 h-4 w-4" />
                {t("role")}
              </div>
              <div className="font-medium">{employee.role}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="mr-2 h-4 w-4" />
                {t("department")}
              </div>
              <div className="font-medium">{employee.department}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                {t("joining_date")}
              </div>
              <div className="font-medium">{formatDate(employee.joiningDate)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                {t("email")}
              </div>
              <div className="font-medium">{employee.email}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                {t("phone")}
              </div>
              <div className="font-medium">{employee.phone}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="mr-2 h-4 w-4" />
                {t("salary_template")}
              </div>
              <div className="font-medium">{employee.salaryTemplate}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center">
            <User className="mr-2 h-4 w-4" /> {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" /> {t("salary_details")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-primary" />
                {t("bank_and_statutory_details")}
              </CardTitle>
              <CardDescription>{t("manage_employee_bank_account_and_statutory_information")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("bank_details")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">{t("account_number")}</Label>
                    <Input
                      id="accountNumber"
                      value={isEditing ? editedEmployee?.bankDetails.accountNumber : employee.bankDetails.accountNumber}
                      onChange={(e) => handleInputChange("bankDetails.accountNumber", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankName">{t("bank_name")}</Label>
                    <Input
                      id="bankName"
                      value={isEditing ? editedEmployee?.bankDetails.bankName : employee.bankDetails.bankName}
                      onChange={(e) => handleInputChange("bankDetails.bankName", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">{t("ifsc_code")}</Label>
                    <Input
                      id="ifscCode"
                      value={isEditing ? editedEmployee?.bankDetails.ifscCode : employee.bankDetails.ifscCode}
                      onChange={(e) => handleInputChange("bankDetails.ifscCode", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">{t("branch")}</Label>
                    <Input
                      id="branch"
                      value={isEditing ? editedEmployee?.bankDetails.branch : employee.bankDetails.branch}
                      onChange={(e) => handleInputChange("bankDetails.branch", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t("statutory_details")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="epfNo">{t("epf_number")}</Label>
                    <Input
                      id="epfNo"
                      value={isEditing ? editedEmployee?.epfNo : employee.epfNo}
                      onChange={(e) => handleInputChange("epfNo", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uanNo">{t("uan_number")}</Label>
                    <Input
                      id="uanNo"
                      value={isEditing ? editedEmployee?.uanNo : employee.uanNo}
                      onChange={(e) => handleInputChange("uanNo", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pfAccountNo">{t("pf_account_number")}</Label>
                    <Input
                      id="pfAccountNo"
                      value={isEditing ? editedEmployee?.pfAccountNo : employee.pfAccountNo}
                      onChange={(e) => handleInputChange("pfAccountNo", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Details Tab */}
        <TabsContent value="salary" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                {t("salary_structure")}
              </CardTitle>
              <CardDescription>{t("manage_employee_salary_components_and_structure")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-lg font-medium">{t("salary_template")}</h3>
                  <p className="text-sm text-muted-foreground">{employee.salaryTemplate}</p>
                </div>

                <div className="mt-4 md:mt-0 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("gross_salary")}:</span>
                    <span className="font-medium">
                      {formatCurrency(calculateTotalEarnings(isEditing ? editedComponents : employee.salaryComponents))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("total_deductions")}:</span>
                    <span className="font-medium text-red-500">
                      {formatCurrency(
                        calculateTotalDeductions(isEditing ? editedComponents : employee.salaryComponents),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("total_benefits")}:</span>
                    <span className="font-medium text-green-500">
                      {formatCurrency(calculateTotalBenefits(isEditing ? editedComponents : employee.salaryComponents))}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">{t("net_salary")}:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(calculateNetSalary(isEditing ? editedComponents : employee.salaryComponents))}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Earnings Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                  {t("earnings")}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("component_name")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("percentage")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      {isEditing && <TableHead>{t("actions")}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isEditing ? editedComponents : employee.salaryComponents)
                      .filter((comp) => comp.type === "Earning")
                      .map((component) => (
                        <TableRow key={component.id}>
                          <TableCell className="font-medium">{component.name}</TableCell>
                          <TableCell>{component.type}</TableCell>
                          <TableCell>
                            {isEditing && component.isEditable ? (
                              <Input
                                type="number"
                                value={component.amount}
                                onChange={(e) => handleComponentChange(component.id, "amount", Number(e.target.value))}
                                className="w-24"
                              />
                            ) : (
                              formatCurrency(component.amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing && component.isEditable && component.isPercentage ? (
                              <Input
                                type="number"
                                value={component.percentage || 0}
                                onChange={(e) =>
                                  handleComponentChange(component.id, "percentage", Number(e.target.value))
                                }
                                className="w-24"
                              />
                            ) : component.percentage ? (
                              `${component.percentage}%`
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Switch
                                checked={component.isActive}
                                onCheckedChange={(checked) => handleComponentChange(component.id, "isActive", checked)}
                              />
                            ) : (
                              <Badge variant={component.isActive ? "default" : "secondary"}>
                                {component.isActive ? t("active") : t("inactive")}
                              </Badge>
                            )}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              {component.isEditable ? (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              ) : (
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                                  <span className="text-xs text-muted-foreground">{t("fixed")}</span>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Deductions Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-red-500" />
                  {t("deductions")}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("component_name")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("percentage")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      {isEditing && <TableHead>{t("actions")}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isEditing ? editedComponents : employee.salaryComponents)
                      .filter((comp) => comp.type === "Deduction")
                      .map((component) => (
                        <TableRow key={component.id}>
                          <TableCell className="font-medium">{component.name}</TableCell>
                          <TableCell>{component.type}</TableCell>
                          <TableCell>
                            {isEditing && component.isEditable ? (
                              <Input
                                type="number"
                                value={component.amount}
                                onChange={(e) => handleComponentChange(component.id, "amount", Number(e.target.value))}
                                className="w-24"
                              />
                            ) : (
                              formatCurrency(component.amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing && component.isEditable && component.isPercentage ? (
                              <Input
                                type="number"
                                value={component.percentage || 0}
                                onChange={(e) =>
                                  handleComponentChange(component.id, "percentage", Number(e.target.value))
                                }
                                className="w-24"
                              />
                            ) : component.percentage ? (
                              `${component.percentage}%`
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Switch
                                checked={component.isActive}
                                onCheckedChange={(checked) => handleComponentChange(component.id, "isActive", checked)}
                              />
                            ) : (
                              <Badge variant={component.isActive ? "default" : "secondary"}>
                                {component.isActive ? t("active") : t("inactive")}
                              </Badge>
                            )}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              {component.isEditable ? (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              ) : (
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                                  <span className="text-xs text-muted-foreground">{t("fixed")}</span>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Benefits Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                  {t("benefits")}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("component_name")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("percentage")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      {isEditing && <TableHead>{t("actions")}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isEditing ? editedComponents : employee.salaryComponents)
                      .filter((comp) => comp.type === "Benefit")
                      .map((component) => (
                        <TableRow key={component.id}>
                          <TableCell className="font-medium">{component.name}</TableCell>
                          <TableCell>{component.type}</TableCell>
                          <TableCell>
                            {isEditing && component.isEditable ? (
                              <Input
                                type="number"
                                value={component.amount}
                                onChange={(e) => handleComponentChange(component.id, "amount", Number(e.target.value))}
                                className="w-24"
                              />
                            ) : (
                              formatCurrency(component.amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing && component.isEditable && component.isPercentage ? (
                              <Input
                                type="number"
                                value={component.percentage || 0}
                                onChange={(e) =>
                                  handleComponentChange(component.id, "percentage", Number(e.target.value))
                                }
                                className="w-24"
                              />
                            ) : component.percentage ? (
                              `${component.percentage}%`
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Switch
                                checked={component.isActive}
                                onCheckedChange={(checked) => handleComponentChange(component.id, "isActive", checked)}
                              />
                            ) : (
                              <Badge variant={component.isActive ? "default" : "secondary"}>
                                {component.isActive ? t("active") : t("inactive")}
                              </Badge>
                            )}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              {component.isEditable ? (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              ) : (
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                                  <span className="text-xs text-muted-foreground">{t("fixed")}</span>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add Component Button (only in edit mode) */}
              {isEditing && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("add_component")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EmployeePayrollDetail
