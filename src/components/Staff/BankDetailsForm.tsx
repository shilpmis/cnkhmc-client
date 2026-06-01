import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { bankDetailsSchema } from "@/utils/staff.validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="bankName"
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
          name="ifscCode"
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

        <FormField
          control={form.control}
          name="accountNumber"
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

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  )
}

