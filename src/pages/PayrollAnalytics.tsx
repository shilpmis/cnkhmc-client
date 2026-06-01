"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, RefreshCw, TrendingUp, DollarSign, Users, Building, ChevronDown, ChevronUp } from "lucide-react"

// Mock data types
interface MonthlyPayrollData {
  month: string
  totalAmount: number
  employeeCount: number
}

interface DepartmentPayrollData {
  department: string
  totalAmount: number
  employeeCount: number
  color: string
}

interface RolePayrollData {
  role: string
  totalAmount: number
  employeeCount: number
  averageSalary: number
}

interface TopEmployeeData {
  id: number
  name: string
  role: string
  department: string
  salary: number
  trend: "up" | "down" | "stable"
  percentChange: number
}

// Mock data
const monthlyPayrollData: MonthlyPayrollData[] = [
  { month: "Jan", totalAmount: 420000, employeeCount: 10 },
  { month: "Feb", totalAmount: 435000, employeeCount: 10 },
  { month: "Mar", totalAmount: 450000, employeeCount: 10 },
  { month: "Apr", totalAmount: 465000, employeeCount: 10 },
  { month: "May", totalAmount: 477000, employeeCount: 10 },
  { month: "Jun", totalAmount: 477000, employeeCount: 10 },
  { month: "Jul", totalAmount: 490000, employeeCount: 10 },
  { month: "Aug", totalAmount: 490000, employeeCount: 10 },
  { month: "Sep", totalAmount: 505000, employeeCount: 10 },
  { month: "Oct", totalAmount: 505000, employeeCount: 10 },
  { month: "Nov", totalAmount: 520000, employeeCount: 10 },
  { month: "Dec", totalAmount: 520000, employeeCount: 10 },
]

const departmentPayrollData: DepartmentPayrollData[] = [
  { department: "Science", totalAmount: 90000, employeeCount: 2, color: "#8884d8" },
  { department: "Mathematics", totalAmount: 65000, employeeCount: 1, color: "#82ca9d" },
  { department: "English", totalAmount: 42000, employeeCount: 1, color: "#ffc658" },
  { department: "Arts", totalAmount: 41000, employeeCount: 1, color: "#ff8042" },
  { department: "Physical Education", totalAmount: 43000, employeeCount: 1, color: "#0088fe" },
  { department: "Administration", totalAmount: 75000, employeeCount: 1, color: "#00C49F" },
  { department: "Finance", totalAmount: 58000, employeeCount: 1, color: "#FFBB28" },
  { department: "Library", totalAmount: 38000, employeeCount: 1, color: "#FF8042" },
  { department: "Maintenance", totalAmount: 22000, employeeCount: 1, color: "#8884d8" },
]

const rolePayrollData: RolePayrollData[] = [
  { role: "Teacher", totalAmount: 171000, employeeCount: 4, averageSalary: 42750 },
  { role: "Head Teacher", totalAmount: 65000, employeeCount: 1, averageSalary: 65000 },
  { role: "Administrator", totalAmount: 75000, employeeCount: 1, averageSalary: 75000 },
  { role: "Librarian", totalAmount: 38000, employeeCount: 1, averageSalary: 38000 },
  { role: "Peon", totalAmount: 22000, employeeCount: 1, averageSalary: 22000 },
  { role: "Accountant", totalAmount: 58000, employeeCount: 1, averageSalary: 58000 },
  { role: "Counselor", totalAmount: 48000, employeeCount: 1, averageSalary: 48000 },
]

const topEmployeesData: TopEmployeeData[] = [
  {
    id: 3,
    name: "Robert Johnson",
    role: "Administrator",
    department: "Administration",
    salary: 75000,
    trend: "up",
    percentChange: 5.6,
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Head Teacher",
    department: "Mathematics",
    salary: 65000,
    trend: "stable",
    percentChange: 0,
  },
  {
    id: 9,
    name: "James Anderson",
    role: "Accountant",
    department: "Finance",
    salary: 58000,
    trend: "up",
    percentChange: 3.2,
  },
  {
    id: 10,
    name: "Patricia Thomas",
    role: "Counselor",
    department: "Student Affairs",
    salary: 48000,
    trend: "down",
    percentChange: 2.1,
  },
  {
    id: 1,
    name: "John Doe",
    role: "Teacher",
    department: "Science",
    salary: 45000,
    trend: "up",
    percentChange: 4.5,
  },
]

const bottomEmployeesData: TopEmployeeData[] = [
  {
    id: 7,
    name: "David Miller",
    role: "Peon",
    department: "Maintenance",
    salary: 22000,
    trend: "up",
    percentChange: 4.8,
  },
  {
    id: 5,
    name: "Michael Wilson",
    role: "Librarian",
    department: "Library",
    salary: 38000,
    trend: "stable",
    percentChange: 0,
  },
  {
    id: 6,
    name: "Sarah Brown",
    role: "Teacher",
    department: "Arts",
    salary: 41000,
    trend: "up",
    percentChange: 2.5,
  },
  {
    id: 4,
    name: "Emily Davis",
    role: "Teacher",
    department: "English",
    salary: 42000,
    trend: "down",
    percentChange: 1.2,
  },
  {
    id: 8,
    name: "Jennifer Taylor",
    role: "Teacher",
    department: "Physical Education",
    salary: 43000,
    trend: "up",
    percentChange: 3.6,
  },
]

// Years for filter
const years = ["2023", "2022", "2021", "2020"]

const PayrollAnalytics = () => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedYear, setSelectedYear] = useState("2023")
  const [activeTab, setActiveTab] = useState("overview")

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
    }, 1000)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`
  }

  // Calculate total monthly payroll
  const calculateTotalMonthlyPayroll = () => {
    return monthlyPayrollData.reduce((sum, month) => sum + month.totalAmount, 0) / 12
  }

  // Calculate average salary
  const calculateAverageSalary = () => {
    const totalSalary = rolePayrollData.reduce((sum, role) => sum + role.totalAmount, 0)
    const totalEmployees = rolePayrollData.reduce((sum, role) => sum + role.employeeCount, 0)
    return totalSalary / totalEmployees
  }

  // Calculate highest department payroll
  const getHighestDepartmentPayroll = () => {
    return departmentPayrollData.reduce((prev, current) => (prev.totalAmount > current.totalAmount ? prev : current))
  }

  // Calculate lowest department payroll
  const getLowestDepartmentPayroll = () => {
    return departmentPayrollData.reduce((prev, current) => (prev.totalAmount < current.totalAmount ? prev : current))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>

        <Skeleton className="h-80 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("payroll_analytics")}</h1>
          <p className="text-muted-foreground mt-1">{t("analyze_payroll_data_and_trends")}</p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t("select_year")} />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("monthly_payroll")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalMonthlyPayroll())}</div>
            <p className="text-xs text-muted-foreground">{t("average_monthly_expenditure")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("average_salary")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateAverageSalary())}</div>
            <p className="text-xs text-muted-foreground">{t("per_employee_per_month")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("highest_department")}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getHighestDepartmentPayroll().department}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(getHighestDepartmentPayroll().totalAmount)} {t("total")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("lowest_department")}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLowestDepartmentPayroll().department}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(getLowestDepartmentPayroll().totalAmount)} {t("total")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" /> {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center">
            <Building className="mr-2 h-4 w-4" /> {t("departments")}
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> {t("employees")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("monthly_payroll_trend")}</CardTitle>
              <CardDescription>
                {t("payroll_expenditure_trend_for")} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPayrollData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("total_payroll")]}
                      labelFormatter={(label) => `${label}, ${selectedYear}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalAmount"
                      name={t("total_payroll")}
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("payroll_by_role")}</CardTitle>
                <CardDescription>{t("distribution_of_payroll_across_different_roles")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rolePayrollData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" angle={-45} textAnchor="end" height={70} />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("total_payroll")]}
                      />
                      <Legend />
                      <Bar dataKey="totalAmount" name={t("total_payroll")} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("average_salary_by_role")}</CardTitle>
                <CardDescription>{t("average_salary_comparison_across_roles")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rolePayrollData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" angle={-45} textAnchor="end" height={70} />
                      <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("average_salary")]}
                      />
                      <Legend />
                      <Bar dataKey="averageSalary" name={t("average_salary")} fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("department_payroll_distribution")}</CardTitle>
                <CardDescription>{t("payroll_distribution_across_departments")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentPayrollData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="totalAmount"
                        nameKey="department"
                        label={({ department, percent }) => `${department}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {departmentPayrollData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("total_payroll")]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("department_payroll_comparison")}</CardTitle>
                <CardDescription>{t("comparison_of_payroll_expenditure_by_department")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentPayrollData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="department" width={100} />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("total_payroll")]}
                      />
                      <Legend />
                      <Bar dataKey="totalAmount" name={t("total_payroll")} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("department_details")}</CardTitle>
              <CardDescription>{t("detailed_breakdown_of_payroll_by_department")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("department")}</TableHead>
                    <TableHead>{t("employee_count")}</TableHead>
                    <TableHead>{t("total_payroll")}</TableHead>
                    <TableHead>{t("average_salary")}</TableHead>
                    <TableHead>{t("percentage_of_total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentPayrollData.map((dept) => {
                    const totalPayroll = departmentPayrollData.reduce((sum, d) => sum + d.totalAmount, 0)
                    const percentageOfTotal = (dept.totalAmount / totalPayroll) * 100
                    const averageSalary = dept.totalAmount / dept.employeeCount

                    return (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell>{dept.employeeCount}</TableCell>
                        <TableCell>{formatCurrency(dept.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(averageSalary)}</TableCell>
                        <TableCell>{percentageOfTotal.toFixed(1)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("top_paid_employees")}</CardTitle>
                <CardDescription>{t("employees_with_highest_salaries")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{t("department")}</TableHead>
                      <TableHead>{t("salary")}</TableHead>
                      <TableHead>{t("trend")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topEmployeesData.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{formatCurrency(employee.salary)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {employee.trend === "up" ? (
                              <>
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  {employee.percentChange}%
                                </Badge>
                              </>
                            ) : employee.trend === "down" ? (
                              <>
                                <Badge variant="destructive" className="text-white">
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  {employee.percentChange}%
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline">{t("stable")}</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("lowest_paid_employees")}</CardTitle>
                <CardDescription>{t("employees_with_lowest_salaries")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{t("department")}</TableHead>
                      <TableHead>{t("salary")}</TableHead>
                      <TableHead>{t("trend")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bottomEmployeesData.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{formatCurrency(employee.salary)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {employee.trend === "up" ? (
                              <>
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  {employee.percentChange}%
                                </Badge>
                              </>
                            ) : employee.trend === "down" ? (
                              <>
                                <Badge variant="destructive" className="text-white">
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  {employee.percentChange}%
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline">{t("stable")}</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("salary_distribution_by_role")}</CardTitle>
              <CardDescription>{t("comparison_of_salary_ranges_across_different_roles")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rolePayrollData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" angle={-45} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, t("average_salary")]}
                    />
                    <Legend />
                    <Bar dataKey="averageSalary" name={t("average_salary")} fill="#82ca9d" />
                    <Bar dataKey="employeeCount" name={t("employee_count")} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PayrollAnalytics
