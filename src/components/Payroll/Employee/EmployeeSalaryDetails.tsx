"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { DollarSign, Plus, AlertCircle, Edit, ExternalLink, HelpCircleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { StaffType } from "@/types/staff"
import {
  useLazyFetchSingleStaffSalaryTemplateQuery,
  useLazyFetchAllSalaryComponentQuery,
} from "@/services/PayrollService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { Skeleton } from "@/components/ui/skeleton"
import type { SalaryComponent, StaffSalaryTemplate } from "@/types/payroll"

interface EmployeeSalaryDetailsProps {
  employee: StaffType
}

const EmployeeSalaryDetails = ({ employee }: EmployeeSalaryDetailsProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // API hooks
  const [fetchStaffSalary, { data: staffSalary, isLoading: isLoadingSalary, error: salaryError }] =
    useLazyFetchSingleStaffSalaryTemplateQuery()
  const [fetchAllSalaryComponent, { data: availableComponents }] = useLazyFetchAllSalaryComponentQuery()

  // State for salary data
  const [salary, setSalary] = useState<StaffSalaryTemplate | null>(null)
  const [errorType, setErrorType] = useState<"not_found" | "other" | null>(null)

  // Helper function to get component details by ID
  const getComponentById = (componentId: number): SalaryComponent | undefined => {
    return availableComponents?.find((component) => component.id === componentId)
  }

  // Fetch staff salary data
  useEffect(() => {
    if (employee.id && CurrentAcademicSessionForSchool) {
      fetchStaffSalary({
        staff_id: employee.id,
      })
        .unwrap()
        .then((data) => {
          // Reset error state on successful fetch
          setErrorType(null)
        })
        .catch((error) => {
          // Check if it's the specific "not found" error
          if (error.status === 404 && error.data?.message === "Salary Template not found") {
            setErrorType("not_found")
          } else {
            setErrorType("other")
          }
        })
    }
  }, [employee.id, CurrentAcademicSessionForSchool, fetchStaffSalary])

  // Fetch available salary components
  useEffect(() => {
    if (CurrentAcademicSessionForSchool) {
      fetchAllSalaryComponent({
        academic_session: CurrentAcademicSessionForSchool.id,
      })
    }
  }, [CurrentAcademicSessionForSchool, fetchAllSalaryComponent])

  // Update local state when API data is received
  useEffect(() => {
    if (staffSalary) {
      setSalary(staffSalary)
    } else {
      setSalary(null)
    }
  }, [staffSalary])

  // Format currency
  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === "" || isNaN(Number(amount))) return "₹0.00"
    const numAmount = typeof amount === "string" ? Number(amount) : amount
    return `₹${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Navigate to create/edit salary page
  const handleNavigateToSalaryPage = (mode: "create" | "edit") => {
    if (mode === "edit") {
      navigate(`/d/payroll/employee/${employee.id}/salary/edit`)
    } else {
      navigate(`/d/payroll/employee/${employee.id}/salary/create`)
    }
  }

  // Get deduction type display text
  const getDeductionTypeText = (type: string | null) => {
    switch (type) {
      case "ends_on_selected_month":
        return "Ends on selected month"
      case "ends_never":
        return "Never ends"
      case "recovering_specific_amount":
        return "Recovering specific amount"
      default:
        return "N/A"
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    if (!salary || !salary.template_components)
      return { totalEarnings: 0, totalDeductions: 0, totalBenefits: 0, netSalary: 0 }

    let totalEarnings = 0
    let totalDeductions = 0
    let totalBenefits = 0

    salary.template_components.forEach((comp) => {
      const component = getComponentById(comp.salary_components_id)
      if (!component) return

      const amount = comp.amount ? Number(comp.amount) : 0

      if (component.component_type === "earning") {
        totalEarnings += amount
      } else if (component.component_type === "deduction") {
        totalDeductions += amount
      } else if (component.component_type === "benefits") {
        totalBenefits += amount
      }
    })

    // Calculate net salary properly
    const netSalary = totalEarnings - totalDeductions

    return {
      totalEarnings,
      totalDeductions,
      totalBenefits,
      netSalary,
    }
  }

  const totals = calculateTotals()

  // Loading state
  if (isLoadingSalary) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (salaryError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {errorType === "not_found" ? (
                <>
                  <AlertCircle className="mr-2 h-5 w-5 text-amber-500" /> {t("no_salary_template_found")}
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-5 w-5 text-destructive" /> {t("error_loading_salary_data")}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {errorType === "not_found"
                ? t("this_employee_does_not_have_a_salary_template_assigned_yet")
                : t("there_was_an_error_loading_the_salary_data_for_this_employee")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorType === "not_found" ? (
              <div className="space-y-4">
                <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>{t("no_salary_template")}</AlertTitle>
                  <AlertDescription>{t("you_need_to_create_a_salary_template_for_this_employee")}</AlertDescription>
                </Alert>
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button onClick={() => handleNavigateToSalaryPage("create")} variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("advanced_create")}
                  </Button>
                  <Button onClick={() => handleNavigateToSalaryPage("create")}>
                    <Plus className="mr-2 h-4 w-4" /> {t("create_salary_template")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("error")}</AlertTitle>
                  <AlertDescription>{t("failed_to_load_salary_data_please_try_again_later")}</AlertDescription>
                </Alert>
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() =>
                      fetchStaffSalary({
                        staff_id: employee.id,
                      })
                    }
                  >
                    {t("try_again")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Salary Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" /> {t("salary_overview")}
            </CardTitle>
            <CardDescription>
              {salary ? t("current_salary_structure_for_the_employee") : t("no_salary_structure_assigned_yet")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {salary ? (
              <>
                {/* <Button variant="outline" onClick={() => handleNavigateToSalaryPage("edit")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("advanced_edit")}
                </Button> */}
                <Button onClick={() => handleNavigateToSalaryPage("edit")}>
                  <Edit className="mr-2 h-4 w-4" /> {t("edit_salary")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleNavigateToSalaryPage("create")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("advanced_create")}
                </Button>
                <Button onClick={() => handleNavigateToSalaryPage("create")}>
                  <Plus className="mr-2 h-4 w-4" /> {t("create_salary_template")}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {salary ? (
            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("template_name")}</Label>
                  <p className="font-medium mt-1">{salary.template_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("template_code")}</Label>
                  <p className="font-medium mt-1">{salary.template_code || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("description")}</Label>
                  <p className="font-medium mt-1">{salary.description || "N/A"}</p>
                </div>
              </div>

              {/* Base Template Info */}
              {salary.base_template && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-2">{t("base_template_info")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">{t("template_name")}</Label>
                      <p className="font-medium mt-1">{salary.base_template.template_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t("template_code")}</Label>
                      <p className="font-medium mt-1">{salary.base_template.template_code || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t("annual_ctc")}</Label>
                      <p className="font-medium mt-1">{formatCurrency(salary.base_template.annual_ctc)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-muted-foreground text-sm">{t("annual_ctc")}</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(salary.annual_ctc)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-muted-foreground text-sm">{t("monthly_salary")}</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(Number(salary.annual_ctc) / 12)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-muted-foreground text-sm">{t("total_deductions")}</div>
                    <div className="text-2xl font-bold mt-1 text-destructive">
                      {formatCurrency(totals.totalDeductions)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-muted-foreground text-sm">{t("net_salary")}</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(totals.netSalary)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Salary Components */}
              <Tabs defaultValue="earning">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="earning">{t("earnings")}</TabsTrigger>
                  <TabsTrigger value="deduction">{t("deductions")}</TabsTrigger>
                  <TabsTrigger value="benefits">{t("benefits")}</TabsTrigger>
                </TabsList>
                <TabsContent value="earning" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("component_name")}</TableHead>
                            <TableHead>{t("calculation_method")}</TableHead>
                            <TableHead className="text-right">{t("amount")}</TableHead>
                            <TableHead className="text-right">{t("percentage")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salary.template_components
                            .filter((comp) => {
                              const component = getComponentById(comp.salary_components_id)
                              return component?.component_type === "earning"
                            })
                            .map((comp) => {
                              const componentDetails = getComponentById(comp.salary_components_id)
                              return (
                                <TableRow key={comp.id}>
                                  <TableCell>
                                    <div className="font-medium">{componentDetails?.component_name}</div>
                                    {comp.is_mandatory && (
                                      <Badge variant="outline" className="mt-1">
                                        {t("mandatory")}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {componentDetails?.calculation_method === "amount"
                                        ? t("fixed_amount")
                                        : t("percentage")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(comp.amount)}</TableCell>
                                  <TableCell className="text-right">
                                    {comp.percentage !== null ? `${comp.percentage}%` : "N/A"}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="deduction" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("component_name")}</TableHead>
                            <TableHead>{t("calculation_method")}</TableHead>
                            <TableHead className="text-right">{t("amount")}</TableHead>
                            <TableHead>{t("recovery_details")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salary.template_components
                            .filter((comp) => {
                              const component = getComponentById(comp.salary_components_id)
                              return component?.component_type === "deduction"
                            })
                            .map((comp) => {
                              const componentDetails = getComponentById(comp.salary_components_id)
                              return (
                                <TableRow key={comp.id}>
                                  <TableCell>
                                    <div className="font-medium">{componentDetails?.component_name}</div>
                                    {comp.is_mandatory && (
                                      <Badge variant="outline" className="mt-1">
                                        {t("mandatory")}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {componentDetails?.calculation_method === "amount"
                                        ? t("fixed_amount")
                                        : t("percentage")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(comp.amount)}</TableCell>
                                  <TableCell>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center">
                                            <span>{getDeductionTypeText(componentDetails!.deduction_type)}</span>
                                            <HelpCircleIcon className="h-4 w-4 ml-1" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Details about this deduction type</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="benefits" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("component_name")}</TableHead>
                            <TableHead>{t("calculation_method")}</TableHead>
                            <TableHead className="text-right">{t("amount")}</TableHead>
                            <TableHead>{t("details")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salary.template_components
                            .filter((comp) => {
                              const component = getComponentById(comp.salary_components_id)
                              return component?.component_type === "benefits"
                            })
                            .map((comp) => {
                              const componentDetails = getComponentById(comp.salary_components_id)
                              return (
                                <TableRow key={comp.id}>
                                  <TableCell>
                                    <div className="font-medium">{componentDetails?.component_name}</div>
                                    {comp.is_mandatory && (
                                      <Badge variant="outline" className="mt-1">
                                        {t("mandatory")}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {componentDetails?.calculation_method === "amount"
                                        ? t("fixed_amount")
                                        : t("percentage")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(comp.amount)}</TableCell>
                                  <TableCell>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center">
                                            <span>{t("view_details")}</span>
                                            <HelpCircleIcon className="h-4 w-4 ml-1" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Details about this benefit</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>{t("no_salary_template_assigned")}</AlertTitle>
                <AlertDescription>{t("this_employee_does_not_have_a_salary_structure_assigned_yet")}</AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("quick_setup")}</CardTitle>
                    <CardDescription>{t("create_a_salary_template_directly_in_this_interface")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("use_this_option_to_quickly_set_up_a_salary_template_with_basic_components")}
                    </p>
                    <Button onClick={() => handleNavigateToSalaryPage("create")} className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> {t("create_salary_template")}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("advanced_setup")}</CardTitle>
                    <CardDescription>{t("use_the_advanced_interface_for_more_options")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("use_this_option_for_more_advanced_configuration_and_detailed_setup")}
                    </p>
                    <Button variant="outline" onClick={() => handleNavigateToSalaryPage("create")} className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" /> {t("advanced_create")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeSalaryDetails
