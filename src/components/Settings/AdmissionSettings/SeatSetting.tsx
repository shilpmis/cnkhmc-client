import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Loader2, ChevronLeft, AlertCircle, RefreshCw, Edit, Plus, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Quota,
  type QuotaAllocationItem,
  useAddQuotaSeatAllocationMutation,
  useAddSeatAvailabilityMutation,
  useGetClassSeatAvailabilityQuery,
  useGetQuotasQuery,
  useUpdateQuotaSeatAllocationMutation,
  useUpdateSeatAvailabilityMutation,
} from "@/services/QuotaService"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectCurrentUser, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useGetAcademicClassesQuery } from "@/services/AcademicService"
import type { AcademicClasses } from "@/types/academic"
import { Link } from "react-router-dom"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { NumberInput } from "@/components/ui/NumberInput"

const seatAvailabilitySchema = z.object({
  class_id: z
    .number({
      required_error: "Class is required",
      invalid_type_error: "Class must be selected",
    })
    .min(1, "Class is required"),
  total_seats: z
    .number({
      required_error: "Total seats is required",
      invalid_type_error: "Total seats must be a number",
    })
    .min(2, "Seat count must be at least 2")
    .max(100, "Seat count cannot exceed 100"),
})

type SeatAvailabilityFormValues = z.infer<typeof seatAvailabilitySchema>

// Validation schema for quota allocation
const quotaAllocationSchema = z.object({
  class_id: z
    .number({
      required_error: "Class is required",
      invalid_type_error: "Class must be selected",
    })
    .min(1, "Class is required"),
  quota_id: z
    .number({
      required_error: "Quota is required",
      invalid_type_error: "Quota must be selected",
    })
    .min(1, "Quota is required"),
  total_seats: z
    .number({
      required_error: "Total seats is required",
      invalid_type_error: "Total seats must be a number",
    })
    .min(1, "Seat count must be at least 1")
    .max(100, "Seat count cannot exceed 100"),
})

type QuotaAllocationFormValues = z.infer<typeof quotaAllocationSchema>

// Seat Availability Form Component
function SeatAvailabilityForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEditing,
  availableClasses,
  allClasses,
  classSeats,
}: {
  defaultValues: SeatAvailabilityFormValues
  onSubmit: (data: SeatAvailabilityFormValues) => void
  isSubmitting: boolean
  isEditing: boolean
  availableClasses: AcademicClasses[]
  allClasses: AcademicClasses[]
  classSeats: any[] | undefined
}) {
  const { t } = useTranslation()

  const form = useForm<SeatAvailabilityFormValues>({
    resolver: zodResolver(seatAvailabilitySchema),
    defaultValues,
    context: { classSeats }, // Pass classSeats as context for validation
  })

  // Update form values when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("class")}</FormLabel>
              <Select
                disabled={isEditing}
                value={field.value ? field.value.toString() : ""}
                onValueChange={(value) => field.onChange(Number.parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_class")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(isEditing ? allClasses : availableClasses)?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {t("class")} {cls.class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {isEditing
                  ? t("class_cannot_be_changed_once_set")
                  : t("select_the_class_for_which_you_want_to_set_seat_availability")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="total_seats"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("total_seats")}</FormLabel>
              <FormControl>
                <NumberInput
                 {...field}
                 value={field.value !== undefined ? String(field.value) : ""}
                 onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                />
              </FormControl>
              <FormDescription>
                {t("seat_count_must_be_between_2_and_100")}
              </FormDescription>
              <FormMessage />
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
              t("update_seats")
            ) : (
              t("save_seats")
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// Quota Allocation Form Component
function QuotaAllocationForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEditing,
  quotas,
  classId,
  getClassName,
  classSeats,
  currentQuotaId,
}: {
  defaultValues: QuotaAllocationFormValues
  onSubmit: (data: QuotaAllocationFormValues) => void
  isSubmitting: boolean
  isEditing: boolean
  quotas: Quota[]
  classId: number | null
  getClassName: (classId: number) => string
  classSeats: any[] | undefined
  currentQuotaId: number | null
}) {
  const { t } = useTranslation()

  const form = useForm<QuotaAllocationFormValues>({
    resolver: zodResolver(quotaAllocationSchema),
    defaultValues,
    context: { classSeats }, // Pass classSeats as context for validation
  })

  const [isQuotaDisabled, setIsQuotaDisabled] = useState(false)

  // Update form values when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  // Watch for changes in the selected quota and check if it is disabled
  useEffect(() => {
    const selectedQuota = quotas.find((quota) => quota.id === form.getValues("quota_id"))
    setIsQuotaDisabled(selectedQuota ? !Boolean(selectedQuota.is_active) : false)
  }, [form.watch("quota_id"), quotas])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("class")}</FormLabel>
              <FormControl>
                <Input value={classId ? getClassName(classId) : ""} disabled className="bg-muted/50" />
              </FormControl>
              <FormDescription>{t("class_for_quota_allocation")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quota_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("quota")}</FormLabel>
              <Select
                disabled={isEditing}
                value={field.value ? field.value.toString() : ""}
                onValueChange={(value) => field.onChange(Number.parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_quota")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {quotas?.map((quota) => {
                    const isQuotaAllocated = classSeats?.some(
                      (seat) =>
                        seat.class_id === classId &&
                        seat.quota_allocation.some((allocation: QuotaAllocationItem) => allocation.quota_id === quota.id)
                    )

                    return (
                      <SelectItem
                        key={quota.id}
                        value={quota.id.toString()}
                        disabled={isQuotaAllocated}
                      >
                        {quota.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormDescription>
                {isEditing
                  ? t("quota_cannot_be_changed_once_set")
                  : t("select_the_quota_for_which_you_want_to_allocate_seats")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isQuotaDisabled && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("the_selected_quota_is_disabled_by_admin_and_cannot_be_assigned")}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="total_seats"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("total_seats")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("enter_total_seats")}
                  {...field}
                  onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                {t("ensure_allocation_does_not_exceed_available_seats")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting || isQuotaDisabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? t("updating") : t("saving")}...
              </>
            ) : isEditing ? (
              t("update_allocation")
            ) : (
              t("save_allocation")
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function SeatsManagement() {
  const { t } = useTranslation()

  const user = useAppSelector(selectCurrentUser)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const {
    data: classSeats,
    isLoading: isLoadingSeats,
    isError: isErrorSeats,
    error: seatsError,
    refetch: refetchSeats,
  } = useGetClassSeatAvailabilityQuery({
    acadamic_session_id: currentAcademicSession!.id,
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const { data: quotas, isLoading: isLoadingQuotas, refetch: refetchQuotas } = useGetQuotasQuery({
    academic_session_id : currentAcademicSession!.id,
  })

  const [addSeatAvailability, { isLoading: isAddingSeats }] = useAddSeatAvailabilityMutation()
  const [updateSeatAvailability, { isLoading: isSeatsAreUpdating }] = useUpdateSeatAvailabilityMutation()
  const [addQuotaSeatAllocation, { isLoading: isAddingQuotaAllocation }] = useAddQuotaSeatAllocationMutation()
  const [updateQuotaSeatAllocation, { isLoading: isUpdatingQuotaAllocation }] = useUpdateQuotaSeatAllocationMutation()

  const {
    isLoading: isLoadingClasses,
    data: classesData,
    refetch: refetchClasses,
  } = useGetAcademicClassesQuery(user!.school_id)

  const [selectedClass, setSelectedClass] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [seatDialogData, setSeatDialogData] = useState<{
    isOpen: boolean
    isEdit: boolean
    class_id: number | null
    total_seats: number
  }>({
    isOpen: false,
    isEdit: false,
    class_id: null,
    total_seats: 0,
  })

  const [quotaDialogData, setQuotaDialogData] = useState<{
    isOpen: boolean
    isEdit: boolean
    quota_id: number | null
    class_id: number | null
    total_seats: number
  }>({
    isOpen: false,
    isEdit: false,
    quota_id: null,
    class_id: null,
    total_seats: 10,
  })

  const defaultStandards = [
    { id: 1, class: "Nursery" },
    { id: 2, class: "LKG" },
    { id: 3, class: "UKG" },
    { id: 4, class: "1" },
    { id: 5, class: "2" },
    { id: 6, class: "3" },
    { id: 7, class: "4" },
    { id: 8, class: "5" },
    { id: 9, class: "6" },
    { id: 10, class: "7" },
    { id: 11, class: "8" },
    { id: 12, class: "9" },
    { id: 13, class: "10" },
    { id: 14, class: "11" },
    { id: 15, class: "12" },
  ]

  const sortClasses = (classes: AcademicClasses[] | undefined) => {
    if (!classes) return []
    return [...classes].sort((a, b) => {
      // Create a shallow copy using spread operator
      const indexA = defaultStandards.findIndex((std) => std.id === a.id)
      const indexB = defaultStandards.findIndex((std) => std.id === b.id)
      return indexA - indexB
    })
  }

  const filteredSeats =
    selectedClass === "all" ? classSeats : classSeats?.filter((seat) => seat.class_id.toString() === selectedClass)

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchSeats(), refetchQuotas(), refetchClasses()])
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

  const handleSeatDialogOpen = (isEdit: boolean, classId: number | null = null, totalSeats = 0) => {
    setSeatDialogData({
      isOpen: true,
      isEdit,
      class_id: classId,
      total_seats: totalSeats,
    })
  }

  const handleSeatDialogClose = () => {
    setSeatDialogData({ isOpen: false, isEdit: false, class_id: null, total_seats: 0 })
  }

  const handleSaveSeat = async (data: SeatAvailabilityFormValues) => {
    
    try {
      if (seatDialogData.isEdit) {
        const currentClassSeat = classSeats?.find((seat) => seat.class_id === data.class_id);
        if (currentClassSeat) {
          if (data.total_seats < currentClassSeat.quota_allocated_seats) {
            toast({
              title: "Error",
              description: `Total seats cannot be less than allocated quota seats (${currentClassSeat.quota_allocated_seats})`,
              variant: "destructive",
            });
            return;
          }
    
          if (data.total_seats < currentClassSeat.filled_seats) {
            toast({
              title: "Error",
              description: `Total seats cannot be less than filled seats (${currentClassSeat.filled_seats})`,
              variant: "destructive",
            });
            return;
          }
          console.log("Editing seat availability for class ID:", data.class_id, "with total seats:", data.total_seats , currentClassSeat.quota_allocated_seats);
        }

        // Placeholder for API call for editing seat availability

        await updateSeatAvailability({
          class_id: data.class_id,
          total_seats: data.total_seats,
        }).unwrap();
        // await editSeatAvailability({ ...data }).unwrap();
      } else {
        await addSeatAvailability({
          class_id: data.class_id,
          academic_session_id: currentAcademicSession!.id,
          total_seats: data.total_seats,
        }).unwrap();
      }

      toast({
        title: t("success"),
        description: seatDialogData.isEdit
          ? t("the_seat_allocation_has_been_updated_successfully")
          : t("the_seat_availability_has_been_added_successfully"),
      });

      handleSeatDialogClose();
      refetchSeats();
    } catch (error) {
      toast({
        title: t("error"),
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleQuotaDialogOpen = (
    isEdit: boolean,
    quota: QuotaAllocationItem | null = null,
    classId: number | null = null,
  ) => {
    setQuotaDialogData({
      isOpen: true,
      isEdit,
      quota_id: quota?.quota_id || null,
      class_id: classId,
      total_seats: quota?.total_seats || 10,
    })
  }

  const handleQuotaDialogClose = () => {
    setQuotaDialogData({
      isOpen: false,
      isEdit: false,
      quota_id: null,
      class_id: null,
      total_seats: 10,
    })
  }

  const handleSaveQuota = async (data: QuotaAllocationFormValues) => {

    const currentClassSeat = classSeats?.find((seat) => seat.class_id === data.class_id);
    if (currentClassSeat) {
      const currentQuota = currentClassSeat.quota_allocation.find(
        (quota) => quota.quota_id === data.quota_id
      );
      const currentQuotaAllocation = currentQuota ? currentQuota.total_seats : 0;

      const availableSeats =
        currentClassSeat.total_seats -
        (currentClassSeat.quota_allocated_seats - currentQuotaAllocation);

      if (data.total_seats > availableSeats) {
        toast({
          title: "Error",
          description: `Quota allocation exceeds available seats (${availableSeats})`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (quotaDialogData.isEdit) {
        const quotaAllocationId = currentClassSeat?.quota_allocation.find(
          (quota) => quota.quota_id === data.quota_id
        )?.id;

        if (!quotaAllocationId) {
          toast({
            title: "Error",
            description: "Quota allocation ID not found for update.",
            variant: "destructive",
          });
          return;
        }

        await updateQuotaSeatAllocation({
          quota_allocation_id: quotaAllocationId,
          payload: {
            total_seats: data.total_seats,
          },
        }).unwrap();
      } else {
        await addQuotaSeatAllocation({
          quota_id: data.quota_id,
          class_id: data.class_id,
          total_seats: data.total_seats,
          academic_session_id: currentAcademicSession!.id,
        }).unwrap();
      }

      toast({
        title: t("success"),
        description: quotaDialogData.isEdit
          ? t("the_quota_allocation_has_been_updated_successfully")
          : t("the_quota_allocation_has_been_added_successfully"),
      });

      handleQuotaDialogClose();
      refetchSeats();
    } catch (error) {
      toast({
        title: t("error"),
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const getClassName = (classId: number) => {
    const classSeat = classSeats?.find((seat) => seat.class_id === classId)
    return classSeat ? `${t("class")} ${classSeat.class.class}` : `${t("class")} ${classId}`
  }

  const getQuotaName = (quotaId: number) => {
    const quota = quotas?.find((q) => q.id === quotaId)
    return quota ? quota.name : `${t("quota")} ${quotaId}`
  }

  const getQuotaAllocationPercentage = (classSeat: any) => {
    if (!classSeat || !classSeat.total_seats) return 0
    return Math.round((classSeat.quota_allocated_seats / classSeat.total_seats) * 100)
  }

  const getFilledSeatsPercentage = (classSeat: any) => {
    if (!classSeat || !classSeat.total_seats) return 0
    return Math.round((classSeat.filled_seats / classSeat.total_seats) * 100)
  }

  const availableClassesForSeats = sortClasses(
    classesData?.filter((cls: AcademicClasses) => {
      return !classSeats?.some((seat) => seat.class_id === cls.id)
    }),
  )

  const sortedClassesData = sortClasses(classesData)

  if (isLoadingSeats || isLoadingQuotas || isLoadingClasses) {
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
            <h1 className="text-3xl font-bold tracking-tight">{t("seat_management")}</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                <div className="h-64 w-full bg-muted rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("seat_management")}</h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button variant="outline" size="icon" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            <Button onClick={() => handleSeatDialogOpen(false)}>{t("add_seat_availability")}</Button>
          </div>
        </div>

        {/* {isErrorSeats && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>{getErrorMessage(seatsError)}</AlertDescription>
          </Alert>
        )} */}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("seats_overview")}</TabsTrigger>
            <TabsTrigger value="allocation">{t("quota_allocation")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("available_seats_by_class")}</CardTitle>
                <CardDescription>{t("manage_the_total_number_of_seats_available_for_each_class")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Label htmlFor="filter-class" className="w-24">
                    {t("filter_by")}:
                  </Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="filter-class" className="w-[180px]">
                      <SelectValue placeholder={t("select_class")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_classes")}</SelectItem>
                      {classSeats?.map((seat) => (
                        <SelectItem key={seat.class_id} value={seat.class_id.toString()}>
                          {t("class")} {seat.class.class}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("class")}</TableHead>
                      <TableHead>{t("total_seats")}</TableHead>
                      <TableHead>{t("allocated_to_quotas")}</TableHead>
                      <TableHead>{t("general_seats")}</TableHead>
                      <TableHead>{t("filled")}</TableHead>
                      <TableHead>{t("available")}</TableHead>
                      <TableHead>{t("utilization")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeats && filteredSeats.length > 0 ? (
                      filteredSeats.map((seat) => (
                        <TableRow key={seat.id}>
                          <TableCell className="font-medium">
                            {t("class")} {seat.class.class}
                          </TableCell>
                          <TableCell>{seat.total_seats}</TableCell>
                          <TableCell>{seat.quota_allocated_seats}</TableCell>
                          <TableCell>{seat.general_available_seats}</TableCell>
                          <TableCell>{seat.filled_seats}</TableCell>
                          <TableCell>{seat.remaining_seats}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={getFilledSeatsPercentage(seat)} className="h-2 w-20" />
                              <span className="text-xs">{getFilledSeatsPercentage(seat)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSeatDialogOpen(true, seat.class_id, seat.total_seats)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              {t("edit")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground text-red-600 w-full">
                            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground opacity-50 text-red-500" />
                            <p className="mt-4">{t("no_seat_data_available")}</p>
                            <p className="text-sm">{t("add_seat_availability_to_get_started")}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}                       
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("quota_allocation_by_class")}</CardTitle>
                <CardDescription>{t("manage_quota_seats_for_each_class")}</CardDescription>
              </CardHeader>
              <CardContent>
                {classSeats && classSeats.length > 0 ? (
                  classSeats.map((classSeat) => (
                    <div key={classSeat.id} className="mb-8 border rounded-lg overflow-hidden">
                      <div className="bg-muted p-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            {t("class")} {classSeat.class.class}
                          </h3>
                          <div className="text-xs text-muted-foreground mt-1">
                            {t("total_seats")}: {classSeat.total_seats} |{t("quota_allocated")}:{" "}
                            {classSeat.quota_allocated_seats} |{t("general_seats")}: {classSeat.general_available_seats}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={getQuotaAllocationPercentage(classSeat)} className="h-2 w-24" />
                          <span className="text-xs">
                            {getQuotaAllocationPercentage(classSeat)}% {t("allocated")}
                          </span>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("quota_name")}</TableHead>
                            <TableHead>{t("allocated_seats")}</TableHead>
                            <TableHead>{t("filled")}</TableHead>
                            <TableHead>{t("available")}</TableHead>
                            <TableHead>{t("actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classSeat.quota_allocation.length > 0 ? (
                            classSeat.quota_allocation.map((allocation) => (
                              <TableRow key={allocation.id}>
                                <TableCell className="font-medium">{getQuotaName(allocation.quota_id)}</TableCell>
                                <TableCell>{allocation.total_seats}</TableCell>
                                <TableCell>{allocation.filled_seats}</TableCell>
                                <TableCell>{allocation.total_seats - allocation.filled_seats}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuotaDialogOpen(true, allocation, classSeat.class_id)}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                    {t("edit")}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                {t("no_quota_allocations_for_this_class")}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell colSpan={4}></TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => handleQuotaDialogOpen(false, null, classSeat.class_id)}>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                {t("add_quota")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-red-600">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground opacity-50 text-red-500" />
                    <p className="mt-4">{t("no_seat_data_available")}</p>
                    <p className="text-sm">{t("add_seat_availability_to_get_started")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Seat Dialog */}
      <Dialog open={seatDialogData.isOpen} onOpenChange={handleSeatDialogClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {seatDialogData.isEdit ? t("edit_seat_availability") : t("add_seat_availability")}
            </DialogTitle>
            <DialogDescription>
              {seatDialogData.isEdit
                ? t("update_the_total_number_of_seats_for") +
                  ` ${seatDialogData.class_id !== null ? getClassName(seatDialogData.class_id) : t("unknown_class")}`
                : t("set_the_total_number_of_seats_for_a_class")}
            </DialogDescription>
          </DialogHeader>
          <SeatAvailabilityForm
            defaultValues={{
              class_id: seatDialogData.class_id || 0,
              total_seats: seatDialogData.total_seats,
            }}
            onSubmit={handleSaveSeat}
            isSubmitting={isAddingSeats}
            isEditing={seatDialogData.isEdit}
            availableClasses={availableClassesForSeats}
            allClasses={sortedClassesData}
            classSeats={classSeats}
          />
        </DialogContent>
      </Dialog>

      {/* Quota Dialog */}
      <Dialog open={quotaDialogData.isOpen} onOpenChange={handleQuotaDialogClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{quotaDialogData.isEdit ? t("edit_quota_allocation") : t("add_quota_allocation")}</DialogTitle>
            <DialogDescription>
              {quotaDialogData.isEdit
                ? t("update_seats_for") +
                  ` ${getQuotaName(quotaDialogData.quota_id || 0)} ${t("in")} ${getClassName(
                    quotaDialogData.class_id || 0,
                  )}`
                : t("allocate_seats_from_a_quota_to") + `  ${getClassName(quotaDialogData.class_id || 0)}`}
            </DialogDescription>
          </DialogHeader>
          <QuotaAllocationForm
            defaultValues={{
              class_id: quotaDialogData.class_id || 0,
              quota_id: quotaDialogData.quota_id || 0,
              total_seats: quotaDialogData.total_seats,
            }}
            onSubmit={handleSaveQuota}
            isSubmitting={isAddingQuotaAllocation}
            isEditing={quotaDialogData.isEdit}
            quotas={quotas || []}
            classId={quotaDialogData.class_id}
            getClassName={getClassName}
            classSeats={classSeats}
            currentQuotaId={quotaDialogData.quota_id}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

