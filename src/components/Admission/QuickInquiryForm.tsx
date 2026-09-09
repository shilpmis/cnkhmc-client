import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAddInquiryMutation } from "@/services/InquiryServices"
import { toast } from "@/hooks/use-toast"
import { useGetClassSeatAvailabilityQuery } from "@/services/QuotaService"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useGetQuotasQuery } from "@/services/QuotaService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAccademicSessionsForSchool, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

// Define the form schema with Zod
const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name is required" }),
  middle_name: z.string().optional(),
  last_name: z.string().min(2, { message: "Last name is required" }),
  birth_date: z.string().min(1, { message: "Date of birth is required" }),
  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
  }),
  inquiry_for_class: z.coerce.number({
    required_error: "Class is required",
    invalid_type_error: "Class must be a number",
  }),
  father_name: z.string().min(2, { message: "Parent name is required" }),
  primary_mobile: z.coerce
    .number({
      required_error: "Contact number is required",
      invalid_type_error: "Contact number must be a number",
    })
    .refine((val) => val.toString().length >= 10, { message: "Contact number must be at least 10 digits" }),
  address: z.string().min(5, { message: "Address is required" }),
  previous_school: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 3, { message: "School Name must be at least 3 characters" }),
  applying_for_quota: z.boolean().default(false),
  quota_type: z.number().nullable().optional(),
})

// Define the props for the component
interface QuickInquiryFormProps {
  isOpen: boolean
  onClose: () => void
  academicSessionId: number | null
}

export const QuickInquiryForm: React.FC<QuickInquiryFormProps> = ({ isOpen, onClose, academicSessionId }) => {
  const { t } = useTranslation()
  const [addInquiry, { isLoading: isAddingInquiry }] = useAddInquiryMutation()

  const academicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentacademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Fetch available classes
  const { data: classSeats, isLoading: isLoadingSeats } = useGetClassSeatAvailabilityQuery(
    { acadamic_session_id: academicSessionId! }, 
    { skip: !academicSessionId }
  )


  // Fetch available quotas
  const { data: quotas, isLoading: isLoadingQuotas } = useGetQuotasQuery(
    { academic_session_id: academicSessionId! },
    { skip: !academicSessionId }
  )

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      birth_date: "",
      gender: "male",
      inquiry_for_class: undefined,
      father_name: "",
      primary_mobile: undefined,
      address: "",
      previous_school: "",
      applying_for_quota: false,
      quota_type: null,
    },
  })

  // Watch for quota selection to conditionally show quota type field
  const applyingForQuota = form.watch("applying_for_quota")

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!academicSessionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Academic session is required. Please select an academic year.",
      })
      return
    }

    try {
      // Submit the form data to the API
      await addInquiry({
        first_name: values.first_name,
        middle_name: values.middle_name || null,
        last_name: values.last_name,
        birth_date: values.birth_date,
        gender: values.gender,
        inquiry_for_class: values.inquiry_for_class,
        father_name: values.father_name,
        primary_mobile: values.primary_mobile,
        address: values.address,
        previous_school: values.previous_school || null,
        applying_for_quota: values.applying_for_quota,
        quota_type: values.applying_for_quota ? (values.quota_type ?? null) : null,
        academic_session_id: academicSessionId,
        status: "pending",
        admin_notes: null,
        parent_email: null,
        previous_percentage: null,
        previous_year: null,
        special_achievements: null,
        previous_class: null,
      }).unwrap()

      // Show success message
      toast({
        title: "Success",
        description: "Inquiry submitted successfully",
      })

      // Reset form and close dialog
      form.reset()
      onClose()
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("quick_inquiry_form")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Student Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("first_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enter_first_name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("middle_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enter_middle_name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("last_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enter_last_name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date of Birth and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("date_of_birth")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gender")}</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">{t("male")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">{t("female")}</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>    
            {/* Class Applying For */}
            <FormField
              control={form.control}
              name="inquiry_for_class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("inquiry_for_class")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_class")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingSeats ? (
                        <SelectItem value="loading" disabled>
                          {t("loading...")}
                        </SelectItem>
                      ) : classSeats && classSeats.length > 0 ? (
                        classSeats.map((seat) => (
                          <SelectItem key={seat.class_id} value={seat.class_id.toString()}>
                            {seat.class.class} {seat.class.division}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Only shows the classes which has seat allocation for 2025-2026 academic session and are open for admissions by admin.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Name and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="father_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("parent_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("enter_parent_name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primary_mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("contact_number")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("enter_contact_number")}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(value === "" ? undefined : Number(value))
                        }}
                        value={field.value === undefined ? "" : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("address")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("enter_address")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Previous School */}
            <FormField
              control={form.control}
              name="previous_school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("previous_school")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_previous_school")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quota Application */}
            <FormField
              control={form.control}
              name="applying_for_quota"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("applying_for_quota")}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Quota Type - Conditional */}
            {applyingForQuota && (
              <FormField
                control={form.control}
                name="quota_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quota_type")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_quota_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingQuotas ? (
                          <SelectItem value="loading" disabled>
                            {t("loading...")}
                          </SelectItem>
                        ) : quotas && quotas.length > 0 ? (
                          quotas.map((quota) => (
                            <SelectItem key={quota.id} value={quota.id.toString()}>
                              {quota.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            {t("no_quotas_available")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Academic Session Info */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {t("creating_inquiry_for_academic_session")}:{" "}
              {academicSessionId ? academicSessions?.find((session)=> session.id == academicSessionId)?.session_name : t("please_select_an_academic_year")}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isAddingInquiry || !academicSessionId}>
                {isAddingInquiry ? t("submitting...") : t("submit_inquiry")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

