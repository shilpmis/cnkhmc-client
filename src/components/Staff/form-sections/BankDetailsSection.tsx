import type React from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { NumberInput } from "../../ui/NumberInput"

interface BankDetailsSectionProps {
  form: UseFormReturn<StaffFormData>
  onNext: () => void
  onPrevious: () => void
}

export const BankDetailsSection: React.FC<BankDetailsSectionProps> = ({
  form,
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("bank_details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("bank_name")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="account_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("account_number")}</FormLabel>
              <FormControl>
                <NumberInput
                  value={field.value}
                  onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  allowEmpty={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="IFSC_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("ifsc_code")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_branch_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Branch Name</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          {t("previous")}
        </Button>
        <Button type="button" onClick={onNext}>
          {t("next")}
        </Button>
      </CardFooter>
    </Card>
  )
}
