"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Download,
  FileText,
  ArrowUpDown,
  RefreshCw,
  UserPlus,
  DollarSign,
  Calendar,
  Building,
  Users,
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
}

// Mock data for employees
const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "John Doe",
    code: "EMP001",
    role: "Teacher",
    department: "Science",
    payrollStatus: "Active",
    joiningDate: "2022-06-15",
    salary: 45000,
  },
  {
    id: 2,
    name: "Jane Smith",
    code: "EMP002",
    role: "Head Teacher",
    department: "Mathematics",
    payrollStatus: "Active",
    joiningDate: "2021-08-10",
    salary: 65000,
  },
  {
    id: 3,
    name: "Robert Johnson",
    code: "EMP003",
    role: "Administrator",
    department: "Administration",
    payrollStatus: "Active",
    joiningDate: "2020-03-22",
    salary: 75000,
  },
  {
    id: 4,
    name: "Emily Davis",
    code: "EMP004",
    role: "Teacher",
    department: "English",
    payrollStatus: "Inactive",
    joiningDate: "2022-01-05",
    salary: 42000,
  },
  {
    id: 5,
    name: "Michael Wilson",
    code: "EMP005",
    role: "Librarian",
    department: "Library",
    payrollStatus: "Active",
    joiningDate: "2021-11-18",
    salary: 38000,
  },
  {
    id: 6,
    name: "Sarah Brown",
    code: "EMP006",
    role: "Teacher",
    department: "Arts",
    payrollStatus: "Pending",
    joiningDate: "2023-01-10",
    salary: 41000,
  },
  {
    id: 7,
    name: "David Miller",
    code: "EMP007",
    role: "Peon",
    department: "Maintenance",
    payrollStatus: "Active",
    joiningDate: "2022-09-01",
    salary: 22000,
  },
  {
    id: 8,
    name: "Jennifer Taylor",
    code: "EMP008",
    role: "Teacher",
    department: "Physical Education",
    payrollStatus: "Active",
    joiningDate: "2021-07-15",
    salary: 43000,
  },
  {
    id: 9,
    name: "James Anderson",
    code: "EMP009",
    role: "Accountant",
    department: "Finance",
    payrollStatus: "Active",
    joiningDate: "2020-12-01",
    salary: 58000,
  },
  {
    id: 10,
    name: "Patricia Thomas",
    code: "EMP010",
    role: "Counselor",
    department: "Student Affairs",
    payrollStatus: "Inactive",
    joiningDate: "2022-04-20",
    salary: 48000,
  },
]

// Mock data for departments and roles
const departments = [
  "All Departments",
  "Science",
  "Mathematics",
  "English",
  "Arts",
  "Physical Education",
  "Administration",
  "Finance",
  "Library",
  "Maintenance",
  "Student Affairs",
]
const roles = ["All Roles", "Teacher", "Head Teacher", "Administrator", "Librarian", "Peon", "Accountant", "Counselor"]
const statuses = ["All Statuses", "Active", "Inactive", "Pending"]

const EmployeePayrollDashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments")
  const [selectedRole, setSelectedRole] = useState("All Roles")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Employee | null
    direction: "ascending" | "descending"
  }>({
    key: null,
    direction: "ascending",
  })

  // Pagination settings
  const itemsPerPage = 8
  const totalPages = Math.ceil(mockEmployees.length / itemsPerPage)

  // Load data with simulated delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data refreshed",
        description: "Employee payroll data has been updated",
      })
    }, 1000)
  }

  // Handle sorting
  const requestSort = (key: keyof Employee) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Filter and sort employees
  const filteredEmployees = mockEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = selectedDepartment === "All Departments" || employee.department === selectedDepartment
    const matchesRole = selectedRole === "All Roles" || employee.role === selectedRole
    const matchesStatus = selectedStatus === "All Statuses" || employee.payrollStatus === selectedStatus
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && employee.payrollStatus === "Active") ||
      (activeTab === "inactive" && employee.payrollStatus === "Inactive") ||
      (activeTab === "pending" && employee.payrollStatus === "Pending")

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus && matchesTab
  })

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.key) return 0

    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Paginate employees
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Navigate to employee detail
  const handleViewEmployee = (employeeId: number) => {
    navigate(`/d/payroll/employees/${employeeId}`)
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setSelectedDepartment("All Departments")
    setSelectedRole("All Roles")
    setSelectedStatus("All Statuses")
    setActiveTab("all")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("employee_payroll")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_employee_payroll_and_salary_details")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? t("refreshing") : t("refresh")}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("add_employee")}
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("total_employees")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEmployees.length}</div>
            <p className="text-xs text-muted-foreground">{t("across_all_departments")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("monthly_payroll")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹4,77,000</div>
            <p className="text-xs text-muted-foreground">{t("for_current_month")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("departments")}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length - 1}</div>
            <p className="text-xs text-muted-foreground">{t("active_departments")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("next_payday")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 {t("may")}</div>
            <p className="text-xs text-muted-foreground">
              {t("in")} 15 {t("days")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("employee_payroll_management")}</CardTitle>
          <CardDescription>{t("view_and_manage_payroll_details_for_all_employees")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">{t("all_employees")}</TabsTrigger>
              <TabsTrigger value="active">{t("active")}</TabsTrigger>
              <TabsTrigger value="inactive">{t("inactive")}</TabsTrigger>
              <TabsTrigger value="pending">{t("pending")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("department")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("role")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="icon" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_by_name_or_code")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>

          {/* Employee Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("name")}>
                      {t("employee_name")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("code")}>
                      {t("employee_code")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("role")}>
                      {t("role")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("department")}>
                      {t("department")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("joiningDate")}>
                      {t("joining_date")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("salary")}>
                      {t("salary")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("payrollStatus")}>
                      {t("status")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[80px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-9 w-[100px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ||
                      selectedDepartment !== "All Departments" ||
                      selectedRole !== "All Roles" ||
                      selectedStatus !== "All Statuses"
                        ? t("no_employees_match_your_search_criteria")
                        : t("no_employees_found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.code}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{formatDate(employee.joiningDate)}</TableCell>
                      <TableCell>{formatCurrency(employee.salary)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(employee.payrollStatus)}>{employee.payrollStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewEmployee(employee.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          {t("view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredEmployees.length > 0 && (
            <div className="flex justify-center">
              <SaralPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeePayrollDashboard
