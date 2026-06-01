import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { personalDetailsSchema } from "@/utils/student.validation"

type PersonalDetailsFormProps = {
  onSubmit: (data: any) => void
  defaultValues?: any
}

export function PersonalDetailsForm({ onSubmit, defaultValues }: PersonalDetailsFormProps) {
  const form = useForm({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: defaultValues || {},
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="aadhar_dise_no"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhar/DISE Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birth_place"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Place</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birth_place_in_guj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Place (in Gujarati)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Religion</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="religion_in_guj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Religion (in Gujarati)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="caste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caste</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="caste_in_guj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caste (in Gujarati)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="OBC">OBC</SelectItem>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Next</Button>
      </form>
    </Form>
  )
}

