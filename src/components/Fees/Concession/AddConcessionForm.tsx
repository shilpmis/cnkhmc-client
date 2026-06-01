import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from "lucide-react"
import type { Concession } from "@/types/fees"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { concessionSchema } from "@/utils/fees.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface AddConcessionFormProps {
  initialData: Concession | null
  onSubmit: (data: z.infer<typeof concessionSchema>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export const AddConcessionForm: React.FC<AddConcessionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm<z.infer<typeof concessionSchema>>({
    resolver: zodResolver(concessionSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      applicable_to: initialData.applicable_to,
      concessions_to: initialData.concessions_to,
      category: initialData.category,
      status: initialData.status,
    } :{
      name: "",
      description: "",
      applicable_to: undefined,
      concessions_to: undefined,
      category: undefined,
      status: "Active",
    },
  })

  // Watch applicable_to to show relevant information
  const applicableTo = form.watch("applicable_to")
  const concessionsTo = form.watch("concessions_to")
  const {t} = useTranslation()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("concession_name")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("enter_concession_name")} />
              </FormControl>
              <FormDescription>
                {t("a_descriptive_name_for_the_concession")} (e.g., "Sibling Discount", "Merit Scholarship")
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
              <FormLabel required>{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t("enter_a_detailed_description_of_this_concession")}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>{t("explain_the_purpose_and_conditions_of_this_concession")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="applicable_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("applicable_to")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_where_this_concession_applies")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* <SelectItem value="plan">{t("fee_plan_(apply_to_fee_plans)")}</SelectItem> */}
                    <SelectItem value="students">{t("students_(apply_to_selected_students)")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t("determines_who_this_concession_will_be_applied_to")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="concessions_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("concession_type")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_concession_type")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* <SelectItem value="plan">{t("entire_plan_(apply_to_whole_fee_plan)")}</SelectItem> */}
                    <SelectItem value="fees_type">{t("fee_types_(apply_to_specific_fee_types)")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t("determines_what_this_concession_will_be_applied_to")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informational alert based on selected options */}
        {applicableTo && concessionsTo && (
          <Alert variant="default" className="bg-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("concession_application")}</AlertTitle>
            <AlertDescription>
              {applicableTo === "plan" &&
                concessionsTo === "plan" &&
                t("this_concession_will_be_applied_to_entire_fee_plans._the_deduction_will_apply_to_the_total_plan_amount.")}
              {applicableTo === "plan" &&
                concessionsTo === "fees_type" &&
                t("this_concession_will_be_applied_to_specific_fee_types_within_fee_plans._you'll_be_able_to_select_which_fee_types_when_applying_the_concession.")}              {applicableTo === "students" &&
                concessionsTo === "plan" &&
                t("this_concession_will_be_applied_to_individual_students_fee_plans._the_deduction_will_apply_to_the_total_plan_amount_for_selected_students.")}
              {applicableTo === "students" &&
                concessionsTo === "fees_type" &&
                t("this_concession_will_be_applied_to_specific_fee_types_for_individual_students._you'll_be_able_to_select_which_fee_types_when_applying_the_concession_to_a_student.")}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("category")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="family">{t("family")}</SelectItem>
                  <SelectItem value="staff">{t("staff")}</SelectItem>
                  <SelectItem value="education">{t("education")}</SelectItem>
                  <SelectItem value="sports">{t("sports")}</SelectItem>
                  <SelectItem value="financial">{t("financial")}</SelectItem>
                  <SelectItem value="other">{t("other")}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t("categorize_this_concession_for_easier_management")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("active_status")}</FormLabel>
                <FormDescription>{t("enable_or_disable_this_concession")}</FormDescription>
              </div>
                <FormControl>
                <Switch
                  checked={field.value === 'Active'}
                  onCheckedChange={(checked) => field.onChange(checked ? 'Active' : 'Inactive')}
                />
                </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Updating..." : "Creating..."}
              </>
            ) : initialData ? (
              t("update_concession")
            ) : (
              t("create_concession")
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

