"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateSchoolDetails, useGetSchoolQuery } from "@/services/SchoolServices"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectCurrentUser } from "@/redux/slices/authSlice"
import { Loader } from "lucide-react"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
// import { useToast } from "@/components/hooks/use-toast"

interface TypeForUpdateSchoolData {
  name?: string
  contact_number?: number
  subscription_type?: string
  established_year?: string
  school_type?: string
  address?: string
  enrollment_number_format?: string
}

const basicSchoolDataSchema = z.object({
  organization: z.object({
    name: z.string(),
    head_contact_number: z.number(),
    head_name: z.string(),
    pincode: z.number().nullable(),
    address: z.any(),
    subscription_type: z.string(),
  }),
  name: z.string().min(2, {
    message: "School name must be at least 2 characters.",
  }),
  branch_code: z.string(),
  enrollment_number_format: z.string().optional().nullable(),
  established_year: z.string().regex(/^\d{4}$/, {
    message: "Please enter a valid year (YYYY).",
  }),
  school_type: z.string({
    required_error: "Please select a school type.",
  }),
})

const contactInformationSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z
    .string()
    .min(1, {
      message: "Phone number is required",
    })
    .refine((val) => /^\d{10}$/.test(val), {
      message: "Please enter a valid 10-digit phone number.",
    }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
})

const subscriptionSchema = z.object({
  plan: z.enum(["free", "basic", "premium"], {
    required_error: "Please select a subscription plan.",
  }),
})

export default function GeneralSettings() {
  const [loading, setLoading] = useState({
    basicSchoolData: false,
    contactInformation: false,
    subscription: false,
  })

  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)

  /**
   * FIX : Already have school data inside user state ,
   * Need to think and fix this
   */

  const { data, error, isLoading, isFetching, isSuccess, isError } = useGetSchoolQuery(user!.school_id)

  const basicSchoolDataForm = useForm<z.infer<typeof basicSchoolDataSchema>>({
    resolver: zodResolver(basicSchoolDataSchema),
    defaultValues: {
      organization: {
        name: "",
        head_contact_number: 0,
        head_name: "",
        pincode: null,
        address: "",
        subscription_type: "",
      },
      name: "",
      branch_code: "",
      enrollment_number_format: "",
      established_year: "",
      school_type: " ",
    },
  })

  const contactInformationForm = useForm<z.infer<typeof contactInformationSchema>>({
    resolver: zodResolver(contactInformationSchema),
    defaultValues: {
      email: "",
      phone: "",
      address: "",
    },
  })

  const subscriptionForm = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      plan: "free",
    },
  })

  const { t } = useTranslation()

  async function onSubmitBasicSchoolData(values: z.infer<typeof basicSchoolDataSchema>) {
    setLoading((prev) => ({ ...prev, basicSchoolData: true }))

    // Simulate API call
    const payload: TypeForUpdateSchoolData = {}

    if (data?.name !== values.name.trim()) payload.name = values.name.trim()
    if (data?.school_type !== values.school_type.trim()) payload.school_type = values.school_type.trim()
    if (data?.established_year !== values.established_year.trim())
      payload.established_year = values.established_year.trim()
    if (data?.enrollment_number_format !== values.enrollment_number_format?.trim())
      payload.enrollment_number_format = values.enrollment_number_format?.trim()

    const updated_school = await dispatch(updateSchoolDetails({ id: user!.school_id, schoolData: payload }))
    if (updated_school?.meta.requestStatus === "rejected") {
      toast({
        variant: "destructive",
        title: `Error :: ${updated_school.payload.message} ! `,
      })
    } else {
      toast({
        variant: "default",
        title: "Basic School Details updated Succesfully ! ",
      })
    }
    setLoading((prev) => ({ ...prev, basicSchoolData: false }))
  }

  async function onSubmitContactInformation(values: z.infer<typeof contactInformationSchema>) {
    setLoading((prev) => ({ ...prev, contactInformation: true }))

    // Simulate API call
    const payload: TypeForUpdateSchoolData = {}

    if (data?.address !== values.address.trim()) payload.address = values.address.trim()
    if (data?.contact_number != Number.parseInt(values.phone.trim()))
      payload.contact_number = Number.parseInt(values.phone.trim())

    const updated_school = await dispatch(updateSchoolDetails({ id: user!.school_id, schoolData: payload }))

    if (updated_school?.meta.requestStatus === "rejected") {
      toast({
        variant: "destructive",
        title: `Error :: ${updated_school.payload.message} ! `,
      })
    } else {
      toast({
        variant: "default",
        title: "Contact Information updated successfully!",
      })
    }

    setLoading((prev) => ({ ...prev, contactInformation: false }))
  }

  /**
   * TODO :  Currrently not working
   *
   * @param values
   */
  async function onSubmitSubscription(values: z.infer<typeof subscriptionSchema>) {
    setLoading((prev) => ({ ...prev, subscription: true }))

    // Simulate API call
    try {
      // Replace with actual API call when implemented
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Subscription updated",
        description: `Your subscription has been updated to the ${values.plan} plan.`,
      })

      console.log(values)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update subscription",
        description: "Please try again later.",
      })
    } finally {
      setLoading((prev) => ({ ...prev, subscription: false }))
    }
  }

  /**
   * FIXME :: Fix this use regarding school_type ,
   * while fetching data from server , it is not setting the value of school_type
   *
   */
  useEffect(() => {
    if (!data) return;
    basicSchoolDataForm.reset({
      organization: {
        name: data.organization?.name || "",
        head_contact_number: data.organization?.head_contact_number || 0,
        head_name: data.organization?.head_name || "",
        pincode: data.organization?.pincode || null,
        address: data.organization?.address || "",
        subscription_type: data.organization?.subscription_type || "",
      },
      name: data.name || "",
      branch_code: data.branch_code || "",
      enrollment_number_format: data.enrollment_number_format || "",
      established_year: data.established_year || "",
      school_type: data.school_type === "Private" ? "Private" : data.school_type === "Public" ? "Public" : "Charter",
    })
    console.log(basicSchoolDataForm.getValues("organization.subscription_type"))
  }, [data])

  useEffect(() => {
    if (!data) return;
    contactInformationForm.reset({
      email: data.email || "",
      address: data.address || "",
      phone: data.contact_number?.toString() || "",
    })
  }, [data])

  console.log(basicSchoolDataForm.formState.errors)

  return (
    <>
      {isSuccess && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t("general_settings")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("manage_your_school's_basic_information,_contact_details,_and_subscription")}
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={data.organization.organization_logo || "/placeholder.svg"} // Replace with your image path
                    alt="Organization Icon"
                    className="h-20 w-20 rounded-full" // Adjust size and style as needed
                  />
                  <div className="flex flex-col">
                    <CardTitle>{t("organization_details")} </CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Form {...basicSchoolDataForm}>
              <form onSubmit={basicSchoolDataForm.handleSubmit(onSubmitBasicSchoolData)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={basicSchoolDataForm.control}
                      name="organization.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("organization_name")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={basicSchoolDataForm.control}
                      name="organization.head_contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("head_contact_number")}</FormLabel>
                          <FormControl>
                            <Input placeholder=" " {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={basicSchoolDataForm.control}
                      name="organization.head_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("head_name")}</FormLabel>
                          <FormControl>
                            <Input placeholder="" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={basicSchoolDataForm.control}
                      name="organization.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pincode")}</FormLabel>
                          <FormControl>
                            <Input placeholder="pincode" {...field} value={field.value ?? ""} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={basicSchoolDataForm.control}
                      name="organization.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("address")}</FormLabel>
                          <FormControl>
                            <Input placeholder="address" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={basicSchoolDataForm.control}
                      name="organization.subscription_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("subscription_type")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </form>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <Building2 className="h-5 w-5" /> */}
                {t("basic_school_data")}
              </CardTitle>
              <CardDescription>{t("update_your_school's_fundamental_information")}</CardDescription>
            </CardHeader>
            <Form {...basicSchoolDataForm}>
              <form onSubmit={basicSchoolDataForm.handleSubmit(onSubmitBasicSchoolData)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={basicSchoolDataForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("school_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter school name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicSchoolDataForm.control}
                    name="branch_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("branch_code")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter short-key/username for school" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicSchoolDataForm.control}
                    name="established_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("established_year")}</FormLabel>
                        <FormControl>
                          <Input placeholder="YYYY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicSchoolDataForm.control}
                    name="school_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("school_type")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="School type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value=" " disabled>
                              {t("select_type")}
                            </SelectItem>
                            <SelectItem value="Public">{t("public")}</SelectItem>
                            <SelectItem value="Private">{t("private")}</SelectItem>
                            <SelectItem value="Charter">{t("charter")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicSchoolDataForm.control}
                    name="enrollment_number_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment Number Format</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. STU-{YYYY}-{SEQ}" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <p className="text-[0.8rem] text-muted-foreground mt-1">
                          Use dynamic placeholders: <code className="bg-muted px-1 rounded">{"{YYYY}"}</code> for 4-digit year, <code className="bg-muted px-1 rounded">{"{YY}"}</code> for 2-digit year, and <code className="bg-muted px-1 rounded">{"{SEQ}"}</code> for auto-incrementing sequence.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading.basicSchoolData}>
                    {loading.basicSchoolData ? "Saving..." : t("save")}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <Mail className="h-5 w-5" /> */}
                {t("contact_information")}
              </CardTitle>
              <CardDescription>{t("update_your_school's_contact_details")}</CardDescription>
            </CardHeader>
            <Form {...contactInformationForm}>
              <form onSubmit={contactInformationForm.handleSubmit(onSubmitContactInformation)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={contactInformationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email_address")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="school@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contactInformationForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("phone_number")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact number for school"
                            {...field}
                            onChange={(e) => {
                              // Only allow numeric input
                              const value = e.target.value.replace(/\D/g, "")
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contactInformationForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("address")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter school address" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading.contactInformation}>
                    {loading.contactInformation ? "Saving..." : t("save")}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center items-center h-full">
          <Loader className="h-10 w-10 animate-spin" />
        </div>
      )}
    </>
  )
}
