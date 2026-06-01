import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IndianRupee, Percent, Trash2, Plus, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  useUpdaetSalaryTemplateMutation,
  useCreateSalaryTemplateMutation,
  useLazyFetchSalaryComponentQuery,
  useLazyFetchSingleSalaryTemplateQuery,
} from "@/services/PayrollService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import type {
  SalaryComponent,
  SalaryTemplate,
  SalaryTemplateComponent,
  SalaryTemplateUpdatePayload,
} from "@/types/payroll"
import { useNavigate } from "react-router-dom"

// Define the schema for the salary template form
const salaryTemplateSchema = z.object({
  template_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  template_code: z.string().min(1, { message: "Code is required" }),
  description: z.string().nullable(),
  annual_ctc: z.number().min(0, { message: "Annual CTC must be a positive number" }),
  is_mandatory: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

const SalaryTemplateForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const templateId = params?.id as string
  const isEditMode = !!templateId

  const currentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // RTK Query hooks
  const [fetchSingleSalaryTemplate, { data: templateData, isLoading: isLoadingTemplate }] =
    useLazyFetchSingleSalaryTemplateQuery()
  const [fetchSalaryComponents, { data: componentsData, isLoading: isLoadingComponents }] =
    useLazyFetchSalaryComponentQuery()
  const [createSalaryTemplate, { isLoading: isCreating }] = useCreateSalaryTemplateMutation()
  const [updateSalaryTemplate, { isLoading: isUpdating }] = useUpdaetSalaryTemplateMutation()

  // State for template and components
  const [template, setTemplate] = useState<SalaryTemplate | null>(null)
  const [availableComponents, setAvailableComponents] = useState<SalaryComponent[]>([])
  const [selectedComponents, setSelectedComponents] = useState<
    Array<
      SalaryComponent & {
        isSelected: boolean
        templateValue: number | null
        templatePercentage: number | null
        isMandatory: boolean
        endMonth: string | null
        recoveryAmount: number | null
      }
    >
  >([])

  // State for remaining amount after calculations
  const [remainingAmount, setRemainingAmount] = useState<number>(0)

  // State for component dialog
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false)

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof salaryTemplateSchema>>({
    resolver: zodResolver(salaryTemplateSchema),
    defaultValues: {
      template_name: "",
      template_code: "",
      description: null,
      annual_ctc: 0,
      is_mandatory: false,
      is_active: true,
    },
  })

  // Fetch data on component mount
  useEffect(() => {
    if (currentAcademicSessionForSchool?.id) {
      fetchComponents()
      if (isEditMode && templateId) {
        fetchTemplateData(templateId)
      }
    }
  }, [currentAcademicSessionForSchool, templateId])

  // Fetch template data
  const fetchTemplateData = async (id: string) => {
    try {
      const response = await fetchSingleSalaryTemplate({
        template_id: Number(id),
      })

      if (response.data) {
        const templateData = response.data
        setTemplate(templateData)

        // Set form values
        form.reset({
          template_name: templateData.template_name,
          template_code: templateData.template_code,
          description: templateData.description ?? null,
          annual_ctc: templateData.annual_ctc,
          is_mandatory: templateData.is_mandatory,
          is_active: templateData.is_active,
        })
      }
    } catch (error) {
      console.error("Error fetching template:", error)
      toast({
        title: "Error",
        description: "Failed to fetch template details",
        variant: "destructive",
      })
    }
  }

  // Fetch components
  const fetchComponents = async () => {
    try {
      const response = await fetchSalaryComponents({
        academic_session: currentAcademicSessionForSchool!.id,
      })

      if (response.data?.data) {
        setAvailableComponents(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching components:", error)
      toast({
        title: "Error",
        description: "Failed to fetch salary components",
        variant: "destructive",
      })
    }
  }

  // Initialize selected components when template data is loaded
  useEffect(() => {
    if (template && availableComponents.length > 0) {
      const componentsWithValues = template.template_components
        .map((templateComp: SalaryTemplateComponent) => {
          const component = availableComponents.find((c) => c.id === templateComp.salary_components_id)
          if (!component) return null

          return {
            ...component,
            isSelected: true,
            templateValue: templateComp.amount,
            templatePercentage: templateComp.percentage,
            isMandatory: templateComp.is_mandatory,
            endMonth: templateComp.end_month,
            recoveryAmount: templateComp.recovery_amount,
          }
        })
        .filter(Boolean) as Array<
        SalaryComponent & {
          isSelected: boolean
          templateValue: number | null
          templatePercentage: number | null
          isMandatory: boolean
          endMonth: string | null
          recoveryAmount: number | null
        }
      >

      setSelectedComponents(componentsWithValues)
    }
  }, [template, availableComponents])

  // Calculate values based on CTC and update components
  const updateComponentValues = useCallback((ctc: number, components: typeof selectedComponents) => {
    const annualCTC = ctc || 0

    // First pass: Calculate basic salary (if any)
    const basicComponent = components.find(
      (c) => c.component_name.toLowerCase().includes("basic") && c.is_based_on_annual_ctc,
    )

    let basicValue = 0
    if (basicComponent && basicComponent.templatePercentage) {
      basicValue = (annualCTC * basicComponent.templatePercentage) / 100
    }

    // Second pass: Update all components
    const updatedComponents = components.map((component) => {
      let value = component.templateValue

      if (component.calculation_method === "percentage") {
        if (component.is_based_on_annual_ctc) {
          // Based on CTC
          value = component.templatePercentage ? (annualCTC * component.templatePercentage) / 100 : null
        } else if (basicValue > 0) {
          // Based on Basic
          value = component.templatePercentage ? (basicValue * component.templatePercentage) / 100 : null
        }
      }

      return { ...component, templateValue: value }
    })

    return updatedComponents
  }, [])

  // Watch for CTC changes and update calculations
  const ctc = form.watch("annual_ctc")

  useEffect(() => {
    const updatedComponents = updateComponentValues(ctc, selectedComponents)
    setSelectedComponents(updatedComponents)

    // Calculate remaining amount
    const totalEarnings = updatedComponents
      .filter((c) => c.component_type === "earning" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)

    const totalDeductions = updatedComponents
      .filter((c) => c.component_type === "deduction" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)

    const remaining = ctc - totalEarnings
    setRemainingAmount(remaining)
  }, [ctc, updateComponentValues])

  // Handle component selection
  const handleComponentSelection = (component: SalaryComponent) => {
    const isAlreadySelected = selectedComponents.some((c) => c.id === component.id)

    if (isAlreadySelected) {
      setSelectedComponents(selectedComponents.filter((c) => c.id !== component.id))
    } else {
      // Create a copy of the component with additional properties
      const newComponent = {
        ...component,
        isSelected: true,
        templateValue: component.amount,
        templatePercentage: component.percentage,
        isMandatory: component.is_mandatory,
        endMonth: null,
        recoveryAmount: null,
      }

      const newComponents = [...selectedComponents, newComponent]
      // Recalculate values when adding a new component
      const updatedComponents = updateComponentValues(ctc, newComponents)
      setSelectedComponents(updatedComponents)
    }

    // Close the dialog after selection
    setIsComponentDialogOpen(false)
  }

  // Handle component value change
  const handleComponentValueChange = (componentId: number, key: string, value: any) => {
    const updatedComponents = selectedComponents.map((component) => {
      if (component.id === componentId) {
        return { ...component, [key]: value }
      }
      return component
    })

    // Recalculate all values when any component changes
    const recalculatedComponents = updateComponentValues(ctc, updatedComponents)
    setSelectedComponents(recalculatedComponents)

    // Update remaining amount
    const totalEarnings = recalculatedComponents
      .filter((c) => c.component_type === "earning" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)

    const totalDeductions = recalculatedComponents
      .filter((c) => c.component_type === "deduction" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)

    const remaining = ctc - totalEarnings
    setRemainingAmount(remaining)
  }

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "₹0"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate monthly value
  const calculateMonthlyValue = (annualValue: number | null) => {
    if (annualValue === null) return null
    return annualValue / 12
  }

  // Calculate totals
  const calculateTotalEarnings = () => {
    return selectedComponents
      .filter((c) => c.component_type === "earning" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)
  }

  const calculateTotalDeductions = () => {
    return selectedComponents
      .filter((c) => c.component_type === "deduction" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)
  }

  const calculateTotalBenefits = () => {
    return selectedComponents
      .filter((c) => c.component_type === "benefits" && c.is_active)
      .reduce((sum, component) => sum + (component.templateValue || 0), 0)
  }

  const calculateNetSalary = () => {
    const totalEarnings = calculateTotalEarnings()
    const totalDeductions = calculateTotalDeductions()
    return totalEarnings - totalDeductions
  }

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof salaryTemplateSchema>) => {
    if (selectedComponents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one salary component",
        variant: "destructive",
      })
      return
    }

    try {
      // Transform selected components to the format expected by the API
      const salaryComponents: SalaryTemplateComponent[] = selectedComponents.map((component) => ({
        salary_components_id: component.id,
        amount: component.calculation_method === "amount" ? component.templateValue : null,
        percentage: component.calculation_method === "percentage" ? component.templatePercentage : null,
        is_based_on_annual_ctc: component.is_based_on_annual_ctc,
        is_mandatory: component.isMandatory,
        end_month:
          (component.component_type === "deduction" && component.deduction_type === "ends_on_selected_month") ||
          (component.component_type === "benefits" && component.benefit_type === "ends_on_selected_month")
            ? component.endMonth
            : null,
        recovery_amount:
          (component.component_type === "deduction" && component.deduction_type === "recovering_specific_amount") ||
          (component.component_type === "benefits" && component.benefit_type === "recovering_specific_amount")
            ? component.recoveryAmount
            : null,
      }))

      if (isEditMode && template?.id) {
        // Prepare update payload
        const existingComponentIds = template.template_components.map((c) => c.salary_components_id)
        const newComponentIds = salaryComponents.map((c) => c.salary_components_id)

        // Find components to add, update, and remove
        const newComponents = salaryComponents.filter((c) => !existingComponentIds.includes(c.salary_components_id))

        const existingComponents = salaryComponents.filter((c) => existingComponentIds.includes(c.salary_components_id))

        const removedComponents = template.template_components
          .filter((c) => !newComponentIds.includes(c.salary_components_id))
          .map((c) => ({ salary_components_id: c.salary_components_id }))

        const updatePayload: SalaryTemplateUpdatePayload = {
          template_name: values.template_name,
          template_code: values.template_code,
          description: values.description ?? null,
          annual_ctc: values.annual_ctc,
          is_mandatory: values.is_mandatory,
          is_active: values.is_active,
          existing_salary_components: null,
          new_salary_components: null,
          remove_salary_components: null,
        }

        if (newComponents.length > 0) {
          updatePayload.new_salary_components = newComponents
        }

        if (existingComponents.length > 0) {
          updatePayload.existing_salary_components = existingComponents
        }

        if (removedComponents.length > 0) {
          updatePayload.remove_salary_components = removedComponents
        }

        await updateSalaryTemplate({
          salary_template_id: template.id,
          payload: updatePayload,
        })

        toast({
          title: "Template updated",
          description: `${values.template_name} has been updated successfully`,
        })
      } else {
        // Create new template
        const createPayload = {
          ...values,
          template_components: salaryComponents,
          academic_session: currentAcademicSessionForSchool!.id,
        }

        await createSalaryTemplate({
          payload: createPayload,
        })

        toast({
          title: "Template added",
          description: `${values.template_name} has been added successfully`,
        })
      }

      // Navigate back to templates list
      navigate(-1)
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} template`,
        variant: "destructive",
      })
    }
  }

  // Get component type badge
  const getComponentTypeBadge = (type: string) => {
    switch (type) {
      case "earning":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Earning
          </Badge>
        )
      case "deduction":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Deduction
          </Badge>
        )
      case "benefits":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Benefit
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const isLoading = isLoadingTemplate || isLoadingComponents || isCreating || isUpdating

  if (isLoadingTemplate || isLoadingComponents) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("loading_template_data")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? t("edit_salary_template") : t("create_salary_template")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? t("update_the_details_of_the_salary_template")
              : t("create_a_new_salary_template_for_employee_payroll")}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          onKeyDown={(e) => {
            // Prevent form submission on Enter key
            if (e.key === "Enter") {
              e.preventDefault()
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("template_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="template_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("template_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("e.g._teacher_salary_structure")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="template_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("template_code")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("e.g._teach_ss")} {...field} />
                      </FormControl>
                      <FormDescription>{t("a_short_code_used_to_identify_this_template")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("enter_template_description")}
                          className="resize-none"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annual_ctc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("annual_ctc")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="mr-2">₹</span>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                          <span className="ml-2 text-muted-foreground">{t("per_year")}</span>
                        </div>
                      </FormControl>
                      <FormDescription>{t("the_total_annual_cost_to_company")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="is_mandatory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t("mandatory_template")}</FormLabel>
                          <FormDescription>{t("mandatory_templates_cannot_be_modified")}</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t("active_template")}</FormLabel>
                          <FormDescription>{t("inactive_templates_will_not_be_available")}</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("template_components")}</CardTitle>
                <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {t("add_component")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{t("add_salary_component")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2">
                      {availableComponents
                        .filter((component) => !selectedComponents.some((c) => c.id === component.id))
                        .map((component) => (
                          <div
                            key={component.id}
                            className="p-3 border rounded-md cursor-pointer hover:bg-muted/50"
                            onClick={() => handleComponentSelection(component)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{component.component_name}</span>
                              {getComponentTypeBadge(component.component_type)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {component.calculation_method === "amount"
                                ? `${formatCurrency(component.amount)} (Fixed)`
                                : component.is_based_on_annual_ctc
                                  ? `${component.percentage}% of CTC`
                                  : `${component.percentage}% of Basic`}
                            </div>
                          </div>
                        ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {selectedComponents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">{t("template_components")}</TableHead>
                            <TableHead className="w-[30%]">{t("calculation_type")}</TableHead>
                            <TableHead className="w-[15%]">{t("monthly_amount")}</TableHead>
                            <TableHead className="w-[15%]">{t("annual_amount")}</TableHead>
                            <TableHead className="w-[10%]">{t("actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Earnings Section */}
                          {selectedComponents.filter((comp) => comp.component_type === "earning").length > 0 && (
                            <>
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={5} className="font-medium">
                                  {t("earnings")}
                                </TableCell>
                              </TableRow>
                              {selectedComponents
                                .filter((comp) => comp.component_type === "earning")
                                .map((component) => (
                                  <TableRow key={component.id}>
                                    <TableCell className="font-medium">{component.component_name}</TableCell>
                                    <TableCell>
                                      {component.calculation_method === "amount" ? (
                                        <div className="flex items-center">
                                          <IndianRupee className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templateValue || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templateValue",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-24"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                        </div>
                                      ) : component.is_based_on_annual_ctc ? (
                                        <div className="flex items-center">
                                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templatePercentage || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templatePercentage",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                          <span className="ml-1">% {t("of_ctc")}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templatePercentage || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templatePercentage",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                          <span className="ml-1">% {t("of_basic")}</span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(calculateMonthlyValue(component.templateValue))}
                                    </TableCell>
                                    <TableCell>{formatCurrency(component.templateValue)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleComponentSelection(component)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </>
                          )}

                          {/* Deductions Section */}
                          {selectedComponents.filter((comp) => comp.component_type === "deduction").length > 0 && (
                            <>
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={5} className="font-medium">
                                  {t("deductions")}
                                </TableCell>
                              </TableRow>
                              {selectedComponents
                                .filter((comp) => comp.component_type === "deduction")
                                .map((component) => (
                                  <TableRow key={component.id}>
                                    <TableCell className="font-medium">{component.component_name}</TableCell>
                                    <TableCell>
                                      {component.calculation_method === "amount" ? (
                                        <div className="flex items-center">
                                          <IndianRupee className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templateValue || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templateValue",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-24"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                        </div>
                                      ) : component.is_based_on_annual_ctc ? (
                                        <div className="flex items-center">
                                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templatePercentage || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templatePercentage",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                          <span className="ml-1">% {t("of_ctc")}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templatePercentage || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templatePercentage",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                          <span className="ml-1">% {t("of_basic")}</span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(calculateMonthlyValue(component.templateValue))}
                                    </TableCell>
                                    <TableCell>{formatCurrency(component.templateValue)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleComponentSelection(component)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </>
                          )}

                          {/* Benefits Section */}
                          {selectedComponents.filter((comp) => comp.component_type === "benefits").length > 0 && (
                            <>
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={5} className="font-medium">
                                  {t("benefits")}
                                </TableCell>
                              </TableRow>
                              {selectedComponents
                                .filter((comp) => comp.component_type === "benefits")
                                .map((component) => (
                                  <TableRow key={component.id}>
                                    <TableCell className="font-medium">{component.component_name}</TableCell>
                                    <TableCell>
                                      {component.calculation_method === "amount" ? (
                                        <div className="flex items-center">
                                          <IndianRupee className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templateValue || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templateValue",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-24"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                        </div>
                                      ) : component.is_based_on_annual_ctc ? (
                                        <div className="flex items-center">
                                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templatePercentage || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templatePercentage",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                          <span className="ml-1">% {t("of_ctc")}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={component.templatePercentage || ""}
                                            onChange={(e) =>
                                              handleComponentValueChange(
                                                component.id,
                                                "templatePercentage",
                                                Number(e.target.value),
                                              )
                                            }
                                            className="w-20"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault()
                                              }
                                            }}
                                          />
                                          <span className="ml-1">% {t("of_basic")}</span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(calculateMonthlyValue(component.templateValue))}
                                    </TableCell>
                                    <TableCell>{formatCurrency(component.templateValue)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleComponentSelection(component)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </>
                          )}

                          {/* Summary Row */}
                          <TableRow className="bg-muted/50 font-medium">
                            <TableCell>{t("cost_to_company")}</TableCell>
                            <TableCell></TableCell>
                            <TableCell>{formatCurrency(calculateMonthlyValue(ctc))}</TableCell>
                            <TableCell>{formatCurrency(ctc)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>

                          {/* Net Salary Row (after deductions) */}
                          <TableRow className="bg-green-50/50 font-medium">
                            <TableCell>{t("net_salary")}</TableCell>
                            <TableCell></TableCell>
                            <TableCell>{formatCurrency(calculateMonthlyValue(calculateNetSalary()))}</TableCell>
                            <TableCell>{formatCurrency(calculateNetSalary())}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>

                          {/* Remaining Amount Row */}
                          <TableRow className="bg-blue-50/50 font-medium">
                            <TableCell>{t("remaining_amount")}</TableCell>
                            <TableCell></TableCell>
                            <TableCell>{formatCurrency(calculateMonthlyValue(remainingAmount))}</TableCell>
                            <TableCell>{formatCurrency(remainingAmount)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {t("note")}:{" "}
                      {t("any_changes_made_to_existing_components_will_be_applicable_only_for_future_association")}
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-6 text-center text-muted-foreground">
                    {t("no_components_added_yet")}. {t("click_add_component_to_add_salary_components_to_the_template")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={isLoading}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!form.formState.isValid || selectedComponents.length === 0 || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? t("updating") : t("creating")}
                </>
              ) : isEditMode ? (
                t("update_template")
              ) : (
                t("create_template")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default SalaryTemplateForm
