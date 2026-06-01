import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { admissionDetailsSchema } from "@/utils/student.validation"

type AdmissionDetailsFormProps = {
  onSubmit: (data: any) => void
  onPrevious: () => void
  defaultValues?: any
}

export function AdmissionDetailsForm({ onSubmit, onPrevious, defaultValues }: AdmissionDetailsFormProps) {
  const form = useForm({
    resolver: zodResolver(admissionDetailsSchema),
    defaultValues: defaultValues || {},
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="admission_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admission Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="admission_std"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admission Standard</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select standard" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Standard {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="division"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Division</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["A", "B", "C", "D", "E", "F", "G", "H"].map((division) => (
                      <SelectItem key={division} value={division}>
                        Division {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="mobile_number_2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternate Mobile Number</FormLabel>
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
            name="previous_school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous School</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="previous_school_in_guj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous School (in Gujarati)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}

