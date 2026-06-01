import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useCreateAcademicSessionMutation } from "@/services/AcademicService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"

const formSchema = z
  .object({
    start_month: z.string({
      required_error: "Start month is required",
    }),
    start_year: z.string({
      required_error: "Start year is required",
    }),
    end_month: z.string({
      required_error: "End month is required",
    }),
    end_year: z.string({
      required_error: "End year is required",
    }),
  })
  .refine(
    (data) => {
      const startDate = new Date(`${data.start_year}-${data.start_month}`)
      const endDate = new Date(`${data.end_year}-${data.end_month}`)
      return endDate > startDate
    },
    {
      message: "End date must be after start date",
      path: ["end_month"],
    },
  )

export function AcademicSessionForm({ onSuccess }: { onSuccess?: () => void }) {
  const user = useAppSelector(selectCurrentUser)
  const AcademicSessionForSchool = useAppSelector(selectAccademicSessionsForSchool);
  const [createAcademicSession, { isLoading }] = useCreateAcademicSessionMutation()
  const { t } = useTranslation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_month: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`,
      start_year: `${new Date().getFullYear()}`,
      end_month: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`,
      end_year: `${new Date().getFullYear() + 1}`,
    },
  })

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.school_id) {
      toast({
        title: "Error",
        description: "School ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      await createAcademicSession({
        school_id: user.school_id,
        start_month: `${values.start_year}-${values.start_month}`,
        end_month: `${values.end_year}-${values.end_month}`,
        start_year: values.start_year,
        end_year: values.end_year,
      }).unwrap()

      toast({
        title: "Success",
        description: "Academic session created successfully",
      })

      if (onSuccess) {
        onSuccess()
      }
      //  refresh the page or redirect the user after successful creation , 
      // needed in condition where newly created session is first for school and need othet api to reacall as per id .
      window.location.reload(); 
    } catch (error: any) {
      console.log("Failed to create academic session:", error)

      // Extract error message from different possible error formats
      let errorMessage = "Failed to create academic session"

      if (error.data?.message) {
        // Handle standard API error format
        errorMessage = error.data.message
      } else if (error.data?.error) {
        // Handle error object format
        errorMessage = error.data.error
      } else if (Array.isArray(error.data)) {
        // Handle array of errors format
        errorMessage = error.data.map((err: any) => err.message || err).join(", ")
      } else if (typeof error.message === "string") {
        // Handle plain error message
        errorMessage = error.message
      } else if (typeof error === "string") {
        // Handle string error
        errorMessage = error
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="start_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("start_month")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
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
              name="start_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("start_year")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="end_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("end_month")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
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
              name="end_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("end_year")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            AcademicSessionForSchool?.length !== 0 ?  t("create_academic_session") : t("create_academic_session_and_active")
          )}
        </Button>
      </form>
    </Form>
  )
}

