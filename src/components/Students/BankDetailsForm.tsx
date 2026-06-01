import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { bankDetailsSchema } from "@/utils/student.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"

type BankDetailsFormProps = {
  onSubmit: (data: any) => void
  onPrevious: () => void
  defaultValues?: any
}

export function BankDetailsForm({ onSubmit, onPrevious, defaultValues }: BankDetailsFormProps) {
  const form = useForm({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: defaultValues || {},
  })

  const {t} = useTranslation()
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>IFSC Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>
    </Form>
  )
}

