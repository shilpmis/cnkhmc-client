import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import type { SalaryComponent } from "@/types/payroll"
import { useSalaryComponents } from "./useSalaryComponents"

// Define the schema for the salary component form
const baseSalaryComponentSchema = z.object({
  component_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  component_code: z.string().min(1, { message: "Code is required" }),
  component_type: z.enum(["earning", "deduction", "benefits"]),
  description: z.string().optional(),
  calculation_method: z.enum(["amount", "percentage"]),
  is_active: z.boolean().default(true),
  name_in_payslip: z.string().optional(),
  is_mandatory: z.boolean().default(false),
  is_mandatory_for_all_templates: z.boolean().default(false),
})

// Extended schema for earning components
const earningComponentSchema = baseSalaryComponentSchema.extend({
  amount: z.number().nullable().optional(),
  percentage: z.number().nullable().optional(),
  is_based_on_annual_ctc: z.boolean().default(false),
  is_taxable: z.boolean().default(false),
  pro_rata_calculation: z.boolean().default(false),
  consider_for_epf: z.boolean().default(false),
  consider_for_esi: z.boolean().default(false),
  consider_for_esic: z.boolean().default(false),

})

// Extended schema for deduction components
const deductionComponentSchema = baseSalaryComponentSchema.extend({
  deduction_frequency: z.enum(["once", "recurring"]),
  deduction_type: z.enum(["ends_on_selected_month", "ends_never", "recovering_specific_amount"]).nullable().optional(),
  
})

// Extended schema for benefits components
const benefitsComponentSchema = baseSalaryComponentSchema.extend({
  benefit_frequency: z.enum(["once", "recurring"]),
  benefit_type: z.enum(["ends_on_selected_month", "ends_never", "recovering_specific_amount"]).nullable().optional(),
  
})

// Union schema for all component types
const salaryComponentSchema = z.discriminatedUnion("component_type", [
  earningComponentSchema.extend({ component_type: z.literal("earning") }),
  deductionComponentSchema.extend({ component_type: z.literal("deduction") }),
  benefitsComponentSchema.extend({ component_type: z.literal("benefits") }),
])

interface SalaryComponentFormProps {
  isOpen: boolean
  onClose: (refresh?: boolean) => void
  component?: SalaryComponent | null
}

export const SalaryComponentForm = ({ isOpen, onClose, component }: SalaryComponentFormProps) => {
  const { t } = useTranslation()
  const { createComponent, updateComponent, isSubmitting } = useSalaryComponents()
  const [componentType, setComponentType] = useState<"earning" | "deduction" | "benefits">(
    component?.component_type || "earning",
  )

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof salaryComponentSchema>>({
    resolver: zodResolver(salaryComponentSchema),
    defaultValues: {
      component_name: "",
      component_code: "",
      component_type: "earning" as const,
      description: "",
      calculation_method: "amount",
      is_active: true,
      name_in_payslip: "",
      ...(componentType === "earning" && {
        amount: null,
        percentage: null,
        is_based_on_annual_ctc: false,
        is_taxable: false,
        pro_rata_calculation: false,
        consider_for_epf: false,
        consider_for_esi: false,
        consider_for_esic: false,
        is_mandatory: false,
        is_mandatory_for_all_templates: false,
      }),
      ...(componentType === "deduction" && {
        deduction_frequency: "once",
        deduction_type: null,
      }),
      ...(componentType === "benefits" && {
        benefit_frequency: "once" as const,
        benefit_type: null,
      }),
    },
  })

  // Set form values when component changes
  useEffect(() => {
    if (component) {
      // Set common fields
      form.setValue("component_name", component.component_name)
      form.setValue("component_code", component.component_code || "")
      form.setValue("component_type", component.component_type)
      form.setValue("description", component.description || "")
      form.setValue("calculation_method", component.calculation_method)
      form.setValue("is_active", component.is_active)
      form.setValue("name_in_payslip", component.name_in_payslip || "")

      // Set type-specific fields
      if (component.component_type === "earning") {
        form.setValue("amount", component.amount)
        form.setValue("percentage", component.percentage)
        form.setValue("is_based_on_annual_ctc", component.is_based_on_annual_ctc || false)
        form.setValue("is_taxable", component.is_taxable || false)
        form.setValue("pro_rata_calculation", component.pro_rata_calculation || false)
        form.setValue("consider_for_epf", component.consider_for_epf || false)
        form.setValue("consider_for_esi", component.consider_for_esi || false)
        form.setValue("consider_for_esic", component.consider_for_esic || false)
        form.setValue("is_mandatory", component.is_mandatory || false)
        form.setValue("is_mandatory_for_all_templates", component.is_mandatory_for_all_templates || false)
      } else if (component.component_type === "deduction") {
        form.setValue("deduction_frequency", component.deduction_frequency || "once")
        form.setValue("deduction_type", component.deduction_type)
      } else if (component.component_type === "benefits") {
        form.setValue("benefit_frequency", component.benefit_frequency || "once")
        form.setValue("benefit_type", component.benefit_type)
      }

      setComponentType(component.component_type)
    }
  }, [component, form])

  // Watch for component type changes
  const watchComponentType = form.watch("component_type")
  useEffect(() => {
    setComponentType(watchComponentType)
  }, [watchComponentType])

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof salaryComponentSchema>) => {
    try {
      // Prepare data based on component type
      let formData: any = { ...values }

      // For deduction and benefits, set other fields to null/false
      if (values.component_type === "deduction") {
        formData = {
          ...formData,
          amount: null,
          percentage: null,
          is_based_on_annual_ctc: false,
          is_taxable: false,
          pro_rata_calculation: false,
          consider_for_epf: false,
          consider_for_esi: false,
          consider_for_esic: false,
          benefit_frequency: null,
          benefit_type: null,
        }
      } else if (values.component_type === "benefits") {
        formData = {
          ...formData,
          amount: null,
          percentage: null,
          is_based_on_annual_ctc: false,
          is_taxable: false,
          pro_rata_calculation: false,
          consider_for_epf: false,
          consider_for_esi: false,
          consider_for_esic: false,
          deduction_frequency: null,
          deduction_type: null,
        }
      } else {
        // For earning, set deduction and benefit fields to null
        formData = {
          ...formData,
          deduction_frequency: null,
          deduction_type: null,
          benefit_frequency: null,
          benefit_type: null,
        }

        // Validate amount/percentage based on calculation method
        if (values.calculation_method === "amount" && !values.amount) {
          form.setError("amount", {
            type: "manual",
            message: "Amount is required for fixed amount calculation",
          })
          return
        }

        if (values.calculation_method === "percentage" && !values.percentage) {
          form.setError("percentage", {
            type: "manual",
            message: "Percentage is required for percentage-based calculation",
          })
          return
        }
      }

      if (component) {
        // Update existing component
        await updateComponent(component.id, formData)
        toast({
          title: "Component updated",
          description: `${values.component_name} has been updated successfully`,
        })
      } else {
        // Create new component
        await createComponent(formData)        
        toast({
          title: "Component added",
          description: `${values.component_name} has been added successfully`,
        })
      }
      console.log("Form submitted successfully", formData)
      // onClose(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save component",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{component ? t("edit_salary_component") : t("add_salary_component")}</DialogTitle>
          <DialogDescription>
            {component
              ? t("update_the_details_of_the_salary_component")
              : t("create_a_new_salary_component_for_payroll_calculation")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("basic_information")}</h3>

                  <FormField
                    control={form.control}
                    name="component_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("component_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("e.g._basic_salary")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="component_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("component_code")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("e.g._basic")} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t("a_short_code_used_to_identify_this_component_in_the_system")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="component_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("component_type")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!!component} // Disable type change for existing components
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_component_type")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="earning">{t("earning")}</SelectItem>
                            <SelectItem value="deduction">{t("deduction")}</SelectItem>
                            <SelectItem value="benefits">{t("benefit")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {componentType === "earning"
                            ? t("earnings_are_components_that_add_to_the_employee_salary")
                            : componentType === "deduction"
                              ? t("deductions_are_components_that_reduce_the_employee_salary")
                              : t("benefits_are_non-monetary_components_provided_to_employees")}
                        </FormDescription>
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
                          <Textarea placeholder={t("enter_component_description")} className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("calculation_details")}</h3>

                  <FormField
                    control={form.control}
                    name="calculation_method"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{t("calculation_method")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="amount" id="flat-amount" />
                              <Label htmlFor="flat-amount">{t("flat_amount")}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="percentage" id="percentage-basic" />
                              <Label htmlFor="percentage-basic">{t("percentage_of_basic_salary")}</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {componentType === "earning" && (
                    <>
                      {form.watch("calculation_method") === "amount" ? (
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("default_amount")}</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="mr-2">₹</span>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                {t("the_default_amount_to_be_used_when_assigning_this_component_to_employees")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("default_percentage")}</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    value={field.value || ""}
                                    className="w-24"
                                  />
                                  <span className="ml-2">%</span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                {t("the_default_percentage_of_basic_salary_to_be_used_for_this_component")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="name_in_payslip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("name_in_payslip")}</FormLabel>
                        <FormControl>
                          <Input placeholder={form.watch("component_name")} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>{t("how_this_component_will_appear_in_employee_payslips")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {componentType === "earning" && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{t("component_settings")}</h3>

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("active")}</FormLabel>
                              <FormDescription>
                                {t("inactive_components_will_not_be_available_for_selection_in_salary_structures")}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_based_on_annual_ctc"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("based_on_annual_ctc")}</FormLabel>
                              <FormDescription>
                                {t("calculate_this_component_based_on_the_employee_annual_ctc")}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_taxable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("taxable")}</FormLabel>
                              <FormDescription>
                                {t("this_component_will_be_considered_for_income_tax_calculations")}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pro_rata_calculation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("pro_rata_calculation")}</FormLabel>
                              <FormDescription>
                                {t("calculate_this_component_on_a_pro-rata_basis_for_partial_month_attendance")}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{t("statutory_settings")}</h3>

                      <FormField
                        control={form.control}
                        name="consider_for_epf"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("consider_for_epf")}</FormLabel>
                              <FormDescription>
                                {t("include_this_component_when_calculating_employee_provident_fund_contributions")}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="consider_for_esi"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("consider_for_esi")}</FormLabel>
                              <FormDescription>
                                {t("include_this_component_when_calculating_employee_state_insurance_contributions")}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="consider_for_esic"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("consider_for_esic")}</FormLabel>
                              <FormDescription>
                                {t(
                                  "include_this_component_when_calculating_employee_state_insurance_corporation_contributions",
                                )}
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {componentType === "deduction" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("deduction_settings")}</h3>

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t("active")}</FormLabel>
                            <FormDescription>
                              {t("inactive_components_will_not_be_available_for_selection_in_salary_structures")}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deduction_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("deduction_frequency")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("select_deduction_frequency")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="once">{t("once")}</SelectItem>
                              <SelectItem value="recurring">{t("recurring")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {field.value === "once"
                              ? t("this_deduction_will_be_applied_only_once")
                              : t("this_deduction_will_be_applied_in_every_payroll_cycle")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("deduction_frequency") === "recurring" && (
                      <FormField
                        control={form.control}
                        name="deduction_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("deduction_type")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select_deduction_type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ends_on_selected_month">{t("ends_on_selected_month")}</SelectItem>
                                <SelectItem value="ends_never">{t("ends_never")}</SelectItem>
                                <SelectItem value="recovering_specific_amount">
                                  {t("recovering_specific_amount")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t("specify_how_this_recurring_deduction_should_be_handled")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {componentType === "benefits" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("benefit_settings")}</h3>

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t("active")}</FormLabel>
                            <FormDescription>
                              {t("inactive_components_will_not_be_available_for_selection_in_salary_structures")}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="benefit_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("benefit_frequency")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("select_benefit_frequency")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="once">{t("once")}</SelectItem>
                              <SelectItem value="recurring">{t("recurring")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {field.value === "once"
                              ? t("this_benefit_will_be_applied_only_once")
                              : t("this_benefit_will_be_applied_in_every_payroll_cycle")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("benefit_frequency") === "recurring" && (
                      <FormField
                        control={form.control}
                        name="benefit_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("benefit_type")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select_benefit_type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ends_on_selected_month">{t("ends_on_selected_month")}</SelectItem>
                                <SelectItem value="ends_never">{t("ends_never")}</SelectItem>
                                <SelectItem value="recovering_specific_amount">
                                  {t("recovering_specific_amount")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t("specify_how_this_recurring_benefit_should_be_handled")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {component && component.is_mandatory && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700">{t("mandatory_component")}</p>
                    <p className="text-sm text-amber-600">
                      {t("this_is_a_mandatory_component_and_some_fields_cannot_be_modified")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onClose()} disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? component
                    ? t("updating...")
                    : t("creating...")
                  : component
                    ? t("update_component")
                    : t("add_component")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
