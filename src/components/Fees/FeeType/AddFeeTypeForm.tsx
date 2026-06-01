import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FeesType } from "@/types/fees"
import { feeTypeSchema } from "@/utils/fees.validation"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface AddFeeTypeFormProps {
  initialData: FeesType | null
  type: "create" | "edit"
  onSubmit: (data: z.infer<typeof feeTypeSchema>) => void
  onCancel: () => void
  isLoading: boolean
}

export const AddFeeTypeForm: React.FC<AddFeeTypeFormProps> = ({ initialData, type, onSubmit, onCancel, isLoading }) => {
  const { t } = useTranslation()

  const form = useForm<z.infer<typeof feeTypeSchema>>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues:
      type === "edit" && initialData
        ? {
            name: initialData.name,
            description: initialData.description,
            status: initialData.status,
            applicable_to: initialData.applicable_to,
          }
        : {
            name: undefined,
            description: undefined,
            status: "Active",
            applicable_to: undefined,
          },
  })

  // Ensure if description is empty string, set to null before submit
  const handleSubmit = (values: z.infer<typeof feeTypeSchema>) => {
    const submitValues = {
      ...values,
      description: values.description,
    }
    onSubmit(submitValues)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("fee_type_name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
                  placeholder={t("enter_the_description_for_this_fee_type.")}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="applicable_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("applicable_to")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={type === "edit"} // Disable in edit mode
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_applicable_to")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">{t("student")}</SelectItem>
                    <SelectItem value="plan">{t("plan")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {type === "edit"
                    ? t("applicable_to_cannot_be_changed_after_creation")
                    : t("select_whether_this_fee_type_applies_to_individual_students_or_fee_plans")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("status")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_status")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">{t("active")}</SelectItem>
                    <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>{t("set_the_status_of_this_fee_type.")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} className="flex items-center justify-center space-x-2">
            {isLoading && (
              <div className="ml-2">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {!isLoading && initialData ? t("update_fee_type") : t("create_fee_type")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
