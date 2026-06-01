import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Users,
  GraduationCap,
  Briefcase,
  Filter,
  Plus,
  AlertCircle,
} from "lucide-react"

// API service for staff data
import { useLazyGetTeachingStaffQuery, useLazyGetOtherStaffQuery } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import type { StaffType } from "@/types/staff"
import type { PageMeta } from "@/types/global"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Employment status options
const employmentStatuses = ["All Statuses", "Permanent", "Trial_Period", "Resigned", "Contract_Based", "Notice_Period"]

const EmployeeManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // API hooks
  const [getTeachingStaff, { data: teachingStaff, isLoading: isTeachingStaffLoading }] = useLazyGetTeachingStaffQuery()
  const [getOtherStaff, { data: otherStaff, isLoading: isOtherStaffLoading }] = useLazyGetOtherStaffQuery()

  // State for tabs and filters
  const [activeTab, setActiveTab] = useState<string>("teaching")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Separate state for teaching and non-teaching staff
  const [currentDisplayDataForTeachers, setCurrentDisplayDataForTeachers] = useState<{
    staff: StaffType[]
    meta: PageMeta
  } | null>(null)

  const [currentDisplayDataForOtherStaff, setCurrentDisplayDataForOtherStaff] = useState<{
    staff: StaffType[]
    meta: PageMeta
  } | null>(null)

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StaffType | null
    direction: "ascending" | "descending"
  }>({
    key: null,
    direction: "ascending",
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDataForActiveTab(activeTab as "teaching" | "non-teaching", currentPage)
      .then(() => {
        setIsRefreshing(false)
        toast({
          title: "Data refreshed",
          description: "Employee data has been updated",
        })
      })
      .catch(() => {
        setIsRefreshing(false)
        toast({
          title: "Refresh failed",
          description: "Could not refresh employee data",
          variant: "destructive",
        })
      })
  }

  // Handle sorting
  const requestSort = (key: keyof StaffType) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Navigate to employee detail
  const handleViewEmployee = (employeeId: number) => {
    navigate(`/d/payroll/employee/${employeeId}`)
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setSelectedStatus("All Statuses")
    fetchDataForActiveTab(activeTab as "teaching" | "non-teaching", 1)
  }

  // Fetch data for active tab
  const fetchDataForActiveTab = async (type: "teaching" | "non-teaching", page = 1) => {
    try {
      setError(null)

      if (type === "teaching") {
        const response = await getTeachingStaff({
          academic_sessions: currentAcademicSession!.id,
          page: page,
        })
        if (response.data) {
          setCurrentDisplayDataForTeachers({
            staff: response.data.data,
            meta: response.data.meta,
          })
        }
      } else {
        const response = await getOtherStaff({
          academic_sessions: currentAcademicSession!.id,
          page: page,
        })
        if (response.data)
          setCurrentDisplayDataForOtherStaff({
            staff: response.data.data,
            meta: response.data.meta,
          })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Error",
        description: "Failed to load employee data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchDataForActiveTab(activeTab as "teaching" | "non-teaching", page)
  }

  // Filter staff data based on search term and status
  const filterStaffData = (data: StaffType[] | undefined) => {
    if (!data) return []

    return data.filter((staff) => {
      const fullName = `${staff.first_name} ${staff.middle_name || ""} ${staff.last_name}`.toLowerCase()
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        staff.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = selectedStatus === "All Statuses" || staff.employment_status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }

  // Get current staff data based on active tab
  const getCurrentStaffData = () => {
    if (activeTab === "teaching") {
      return currentDisplayDataForTeachers?.staff || []
    } else {
      return currentDisplayDataForOtherStaff?.staff || []
    }
  }

  // Get current meta data based on active tab
  const getCurrentMetaData = () => {
    if (activeTab === "teaching") {
      return currentDisplayDataForTeachers?.meta
    } else {
      return currentDisplayDataForOtherStaff?.meta
    }
  }

  // Effect to fetch data when tab changes
  useEffect(() => {
    if (currentAcademicSession) {
      setCurrentPage(1)
      fetchDataForActiveTab(activeTab as "teaching" | "non-teaching", 1)
    }
  }, [activeTab, currentAcademicSession])

  // Effect to update teaching staff data when it changes
  useEffect(() => {
    if (teachingStaff) {
      setCurrentDisplayDataForTeachers({
        staff: teachingStaff.data,
        meta: teachingStaff.meta,
      })
    }
  }, [teachingStaff])

  // Effect to update non-teaching staff data when it changes
  useEffect(() => {
    if (otherStaff) {
      setCurrentDisplayDataForOtherStaff({
        staff: otherStaff.data,
        meta: otherStaff.meta,
      })
    }
  }, [otherStaff])

  // Get filtered and sorted staff data
  const filteredStaff = filterStaffData(getCurrentStaffData())
  const sortedStaff = [...filteredStaff].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (aValue === bValue) return 0

    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    return sortConfig.direction === "ascending" ? (aValue < bValue ? -1 : 1) : aValue < bValue ? 1 : -1
  })

  // Calculate counts
  const teachingCount = currentDisplayDataForTeachers?.meta?.total || 0
  const nonTeachingCount = currentDisplayDataForOtherStaff?.meta?.total || 0
  const totalCount = teachingCount + nonTeachingCount

  // Get current loading state
  const isLoading = activeTab === "teaching" ? isTeachingStaffLoading : isOtherStaffLoading

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("employee_management")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_staff_and_employee_details")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? t("refreshing") : t("refresh")}
          </Button>
          {/* <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
          <Button size="sm" onClick={() => navigate("/d/payroll/employee/add")}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("add_employee")}
          </Button> */}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("total_employees")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">{t("across_all_departments")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("teaching_staff")}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachingCount}</div>
            <p className="text-xs text-muted-foreground">{t("faculty_members")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("non_teaching_staff")}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonTeachingCount}</div>
            <p className="text-xs text-muted-foreground">{t("support_staff")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("employee_directory")}</CardTitle>
          <CardDescription>{t("view_and_manage_all_employees_in_the_system")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Staff Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teaching">{t("teaching_staff")}</TabsTrigger>
              <TabsTrigger value="non-teaching">{t("non_teaching_staff")}</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" size="icon" onClick={resetFilters} title={t("reset_filters")}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("search_by_name_code_or_email")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
            </div>

            {/* Teaching Staff Tab Content */}
            <TabsContent value="teaching" className="mt-4">
              {isTeachingStaffLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <span className="ml-2">Loading teaching staff...</span>
                </div>
              ) : currentDisplayDataForTeachers && currentDisplayDataForTeachers.staff.length > 0 ? (
                <>
                  {/* Staff Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">
                            <div className="flex items-center cursor-pointer" onClick={() => requestSort("first_name")}>
                              {t("employee_name")}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => requestSort("employee_code")}
                            >
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
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => requestSort("joining_date")}
                            >
                              {t("joining_date")}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => requestSort("employment_status")}
                            >
                              {t("status")}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {searchTerm || selectedStatus !== "All Statuses"
                                ? t("no_employees_match_your_search_criteria")
                                : t("no_employees_found")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedStaff.map((staff) => (
                            <TableRow
                              key={staff.id}
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleViewEmployee(staff.id)}
                            >
                              <TableCell className="font-medium">
                                {`${staff.first_name} ${staff.middle_name ? staff.middle_name + " " : ""}${
                                  staff.last_name
                                }`}
                              </TableCell>
                              <TableCell>{staff.employee_code}</TableCell>
                              <TableCell>{staff.role}</TableCell>
                              <TableCell>{formatDate(staff.joining_date)}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(staff.employment_status)}>
                                  {staff.employment_status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewEmployee(staff.id)
                                  }}
                                >
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
                  {currentDisplayDataForTeachers.meta && (
                    <div className="flex justify-center mt-4">
                      <SaralPagination
                        currentPage={currentDisplayDataForTeachers.meta.current_page}
                        totalPages={currentDisplayDataForTeachers.meta.last_page}                        
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Alert className="my-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>No teaching staff found</AlertTitle>
                  <AlertDescription>
                    There are no teaching staff records available.
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/d/payroll/employee/add")}
                        className="flex items-center"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add teaching staff
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Non-Teaching Staff Tab Content */}
            <TabsContent value="non-teaching" className="mt-4">
              {isOtherStaffLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <span className="ml-2">Loading non-teaching staff...</span>
                </div>
              ) : currentDisplayDataForOtherStaff && currentDisplayDataForOtherStaff.staff.length > 0 ? (
                <>
                  {/* Staff Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">
                            <div className="flex items-center cursor-pointer" onClick={() => requestSort("first_name")}>
                              {t("employee_name")}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => requestSort("employee_code")}
                            >
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
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => requestSort("joining_date")}
                            >
                              {t("joining_date")}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => requestSort("employment_status")}
                            >
                              {t("status")}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {searchTerm || selectedStatus !== "All Statuses"
                                ? t("no_employees_match_your_search_criteria")
                                : t("no_employees_found")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedStaff.map((staff) => (
                            <TableRow
                              key={staff.id}
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleViewEmployee(staff.id)}
                            >
                              <TableCell className="font-medium">
                                {`${staff.first_name} ${staff.middle_name ? staff.middle_name + " " : ""}${
                                  staff.last_name
                                }`}
                              </TableCell>
                              <TableCell>{staff.employee_code}</TableCell>
                              <TableCell>{staff.role}</TableCell>
                              <TableCell>{formatDate(staff.joining_date)}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(staff.employment_status)}>
                                  {staff.employment_status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewEmployee(staff.id)
                                  }}
                                >
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
                  {currentDisplayDataForOtherStaff.meta && (
                    <div className="flex justify-center mt-4">
                      <SaralPagination
                        currentPage={currentDisplayDataForOtherStaff.meta.current_page}
                        totalPages={currentDisplayDataForOtherStaff.meta.last_page}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Alert className="my-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>No non-teaching staff found</AlertTitle>
                  <AlertDescription>
                    There are no non-teaching staff records available.
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/d/payroll/employee/add")}
                        className="flex items-center"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add non-teaching staff
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeManagement
