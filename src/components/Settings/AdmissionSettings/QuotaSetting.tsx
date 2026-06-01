import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, ChevronLeft, RefreshCw, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import {
  useAddQuotaMutation,
  useGetQuotaAllocationsQuery,
  useGetQuotasQuery,
  useUpdateQuotaMutation,
  useGetClassSeatAvailabilityQuery,
  useAddQuotaSeatAllocationMutation,
} from "@/services/QuotaService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { toast } from "@/hooks/use-toast"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { selectAccademicSessionsForSchool, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useGetAcademicClassesQuery } from "@/services/AcademicService"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Validation schema for quota
const quotaSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  eligibility_criteria: z.string().optional(),
  is_active: z.boolean().default(true),
})

type QuotaFormValues = z.infer<typeof quotaSchema>

// Reusable quota form component
function QuotaForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEditing,
}: {
  defaultValues: QuotaFormValues
  onSubmit: (data: QuotaFormValues) => void
  isSubmitting: boolean
  isEditing: boolean
}) {
  const { t } = useTranslation()

  const form = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaSchema),
    defaultValues,
  })

  // Update form values when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues) {
      form.reset({...defaultValues , is_active : Boolean(Number(defaultValues.is_active))})
    }
  }, [defaultValues, form])


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_quota_name")} {...field} />
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
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_description")} {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>{t("brief_description_of_this_quota")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eligibility_criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("eligibility_criteria")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("enter_eligibility_criteria")}
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>{t("criteria_for_students_to_qualify_for_this_quota")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("active_status")}</FormLabel>
                <FormDescription>
                  {Boolean(Number(field.value)) ? t("this_quota_is_active") : t("this_quota_is_inactive")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={Boolean(Number(field.value))} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? t("updating") : t("saving")}...
              </>
            ) : isEditing ? (
              t("update_quota")
            ) : (
              t("save_quota")
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function QuotaManagement() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionParam = searchParams.get("session")

  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const allAcademicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const user = useAppSelector((state: any) => state.auth.currentUser)

  const [selectedAcademicSession, setSelectedAcademicSession] = useState<string | null>(
    sessionParam || (currentAcademicSession ? currentAcademicSession.id.toString() : null),
  )

  // Update URL when session changes
  useEffect(() => {
    if (selectedAcademicSession) {
      searchParams.set("session", selectedAcademicSession)
      setSearchParams(searchParams)
    }
  }, [selectedAcademicSession])

  const { data: quotas, isLoading: isLoadingQuotas, isError, error, refetch: refetchQuotas } = useGetQuotasQuery({
    academic_session_id : currentAcademicSession!.id
  })

  // const {
  //   data: allocations,
  //   isLoading: isLoadingAllocations,
  //   refetch: refetchAllocations,
  // } = useGetQuotaAllocationsQuery()

  const { data: classSeats, isLoading: isLoadingSeats, refetch: refetchSeats } = useGetClassSeatAvailabilityQuery({
    acadamic_session_id : currentAcademicSession!.id,
  })

  const {
    isLoading: isLoadingClasses,
    data: classesData,
    refetch: refetchClasses,
  } = useGetAcademicClassesQuery(user?.school_id)

  const [addQuota, { isLoading: isAddingQuota }] = useAddQuotaMutation()
  const [updateQuota, { isLoading: isUpdatingQuota }] = useUpdateQuotaMutation()
  const [addQuotaSeatAllocation, { isLoading: isAddingAllocation }] = useAddQuotaSeatAllocationMutation()

  const [newQuota, setNewQuota] = useState<QuotaFormValues>({
    name: "",
    description: "",
    eligibility_criteria: "",
    is_active: true,
  })

  const [isQuotaDialogOpen, setIsQuotaDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("quotas")

  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false)
  const [selectedQuota, setSelectedQuota] = useState<{ id: number; isActive: boolean } | null>(null)

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchQuotas(), refetchSeats(), refetchClasses()])
      toast({
        title: t("data_refreshed"),
        description: t("the_latest_data_has_been_loaded"),
      })
    } catch (error) {
      toast({
        title: t("refresh_failed"),
        description: t("could_not_refresh_data"),
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Helper function to extract error message from different error formats
  const getErrorMessage = (error: any): string => {
    if (error?.data?.error) {
      return error.data.error
    } else if (error?.data?.errors?.messages) {
      return error.data.errors.messages.map((msg: any) => msg.message).join(", ")
    } else if (error?.data?.message) {
      return error.data.message
    } else if (error?.message) {
      return error.message
    } else if (typeof error === "string") {
      return error
    } else {
      return t("an_unknown_error_occurred")
    }
  }

  const handleAddQuota = async (data: QuotaFormValues) => {
    try {
      await addQuota({
        name: data.name,
        description: data.description || "",
        eligibility_criteria: data.eligibility_criteria || "",
        is_active: data.is_active,
        academic_session_id: Number(selectedAcademicSession),
      }).unwrap()

      toast({
        title: t("success"),
        description: t("quota_added_successfully"),
      })

      resetQuotaForm()
      setIsQuotaDialogOpen(false)
      refetchQuotas()
    } catch (err: any) {
      const errorMessage = getErrorMessage(err)
      toast({
        title: t("failed_to_add_quota"),
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Failed to add quota:", err)
    }
  }

  const handleUpdateQuota = async (data: QuotaFormValues) => {
    if (editingId === null) return

    try {
      await updateQuota({
        payload: {
          name: data.name,
          description: data.description || "",
          eligibility_criteria: data.eligibility_criteria || "",
          is_active: data.is_active,
        },
        quota_id: editingId,
        academic_session_id: Number(selectedAcademicSession),
      }).unwrap()

      toast({
        title: t("success"),
        description: t("quota_updated_successfully"),
      })

      resetQuotaForm()
      setIsQuotaDialogOpen(false)
      setIsEditing(false)
      setEditingId(null)
      refetchQuotas()
    } catch (err: any) {
      const errorMessage = getErrorMessage(err)
      toast({
        title: t("failed_to_update_quota"),
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Failed to update quota:", err)
    }
  }

  const handleToggleQuotaStatus = async (id: number, isActive: boolean) => {
    // Set the selected quota and open the dialog if deactivating
    if (isActive) {
      setSelectedQuota({ id, isActive })
      setIsWarningDialogOpen(true)
    } else {
      // Directly activate without confirmation
      toggleQuotaStatus(id, isActive)
    }
  }

  const toggleQuotaStatus = async (id: number, isActive: boolean) => {
    try {
      await updateQuota({
        payload: {
          id: id,
          is_active: !isActive,
        },
        quota_id : id,
        academic_session_id: currentAcademicSession!.id,
      }).unwrap()

      toast({
        title: t("success"),
        description: isActive ? t("quota_deactivated_successfully") : t("quota_activated_successfully"),
      })

      refetchQuotas()
      // refetchAllocations()
    } catch (err: any) {
      const errorMessage = getErrorMessage(err)
      toast({
        title: t("failed_to_update_quota_status"),
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Failed to update quota status:", err)
    } finally {
      // Reset the selected quota state
      setSelectedQuota(null)
      setIsWarningDialogOpen(false)
    }
  }

  const handleEditClick = (quota: any) => {
    setNewQuota({
      name: quota.name,
      description: quota.description || "",
      eligibility_criteria: quota.eligibility_criteria || "",
      is_active: quota.is_active,
    })
    setIsEditing(true)
    setEditingId(quota.id)
    setIsQuotaDialogOpen(true)
  }

  const resetQuotaForm = () => {
    setNewQuota({
      name: "",
      description: "",
      eligibility_criteria: "",
      is_active: true,
    })
  }

  if (isLoadingQuotas || isLoadingSeats || isLoadingClasses) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col space-y-6">
          <Link
            to="/d/settings/admission"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 w-fit"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("back_to_admission_settings")}
          </Link>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{t("quota_management")}</h1>
          </div>

          <div className="space-y-6">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-64 w-full bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-6">
        {/* Back button */}
        <Link
          to="/d/settings/admission"
          className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 w-fit"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("back_to_admission_settings")}
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{t("quota_management")}</h1>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>{getErrorMessage(error) || t("failed_to_load_quotas")}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("quota_categories")}</CardTitle>
              <CardDescription>{t("manage_quota_categories_for_admission")}</CardDescription>
            </div>
            <Dialog open={isQuotaDialogOpen} onOpenChange={setIsQuotaDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetQuotaForm()
                    setIsEditing(false)
                    setEditingId(null)
                  }}
                >
                  {t("add_new_quota")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? t("edit_quota") : t("create_new_quota")}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? t("update_quota_details") : t("add_a_new_quota_category_for_admission.")}.{" "}
                    {t("click_save_when_you_are_done.")}
                  </DialogDescription>
                </DialogHeader>
                <QuotaForm
                  defaultValues={newQuota}
                  onSubmit={isEditing ? handleUpdateQuota : handleAddQuota}
                  isSubmitting={isAddingQuota || isUpdatingQuota}
                  isEditing={isEditing}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("eligibility_criteria")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotas && quotas.length > 0 ? (
                  quotas.map((quota) => (
                    <TableRow key={quota.id}>
                      <TableCell className="font-medium">{quota.name}</TableCell>
                      <TableCell>{quota.description || "-"}</TableCell>
                      <TableCell>{quota.eligibility_criteria || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={quota.is_active ? "default" : "secondary"} className="capitalize">
                          {quota.is_active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(quota)}>
                            <Edit className="h-4 w-4 mr-1" />
                            {t("edit")}
                          </Button>
                          <Button
                            variant={quota.is_active ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleToggleQuotaStatus(quota.id, quota.is_active)}
                          >
                            {quota.is_active ? (
                              <XCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            {quota.is_active ? t("deactivate") : t("activate")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-muted-foreground">{t("no_quotas_found")}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            resetQuotaForm()
                            setIsQuotaDialogOpen(true)
                          }}
                        >
                          {t("add_your_first_quota")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <AlertDialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("disable_quota_warning")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "Disabling this quota type will still keep it allocated to students if already allocated. Alternatively, set seat allocation to 0 for all classes where this quota is allocated.",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  // Reset the selected quota state on cancel
                  setSelectedQuota(null)
                }}
              >
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedQuota) {
                    toggleQuotaStatus(selectedQuota.id, selectedQuota.isActive)
                  }
                }}
              >
                {t("proceed")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

