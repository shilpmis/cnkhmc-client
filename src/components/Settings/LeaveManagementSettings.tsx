"use client"

import { useEffect, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, AlertCircle, RefreshCw } from "lucide-react"
import {
  useLazyGetLeavePolicyForSchoolPageWiseQuery,
  useLazyGetAllLeaveTypeForSchoolQuery,
  useLazyGetLeaveTypeForSchoolPageWiseQuery,
  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
} from "@/services/LeaveService"
import type { LeavePolicy, LeaveType } from "@/types/leave"
import type { PageMeta } from "@/types/global"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectSchoolStaffRoles } from "@/redux/slices/staffSlice"
import { useLazyGetSchoolStaffRoleQuery } from "@/services/StaffService"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { selectLeaveTypeForSchool } from "@/redux/slices/leaveSlice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NumberInput } from "../ui/NumberInput"

// Schema for leave type
const leaveTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  is_paid: z.boolean(),
  affects_payroll: z.boolean(),
})

// Schema for leave policy with improved validation
export const leavePolicySchema = z
  .object({
    staff_role_id: z.string().min(1, { message: "Staff role is required" }),
    leave_type_id: z.string().min(1, { message: "Leave type is required" }),
    annual_quota: z
      .number({ invalid_type_error: "Annual allowance must be a number" })
      .min(1, { message: "Annual allowance must be at least 1" })
      .max(100, { message: "Annual allowance cannot exceed 100" }),
    max_consecutive_days: z
      .number({ invalid_type_error: "Max consecutive days must be a number" })
      .min(1, { message: "Max consecutive days must be at least 1" }),
    can_carry_forward: z.boolean(),
    max_carry_forward_days: z
      .number({ invalid_type_error: "Max carryforward days must be a number" })
      .min(0, { message: "Max carryforward days must be 0 or greater" }),
    deduction_rules: z.record(z.string(), z.any()).optional(),
    approval_hierarchy: z.record(z.string(), z.any()).optional(),
    requires_approval: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    // Max consecutive days should be between 30-35% of annual allowance
    const minConsecutiveDays = Math.floor(data.annual_quota * 0.3)
    const maxConsecutiveDays = Math.ceil(data.annual_quota * 0.35)

    if (data.max_consecutive_days < minConsecutiveDays || data.max_consecutive_days > maxConsecutiveDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_consecutive_days"],
        message: `Max consecutive days should be between ${minConsecutiveDays} and ${maxConsecutiveDays} (30-35% of annual allowance)`,
      })
    }

    // Max carry forward days cannot be greater than 50% of annual allowance
    const maxCarryForwardAllowed = Math.floor(data.annual_quota * 0.5)

    if (data.can_carry_forward && data.max_carry_forward_days > maxCarryForwardAllowed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_carry_forward_days"],
        message: `Max carryforward days cannot exceed ${maxCarryForwardAllowed} (50% of annual allowance)`,
      })
    }
  })

type LeaveTypeSchema = z.infer<typeof leaveTypeSchema>
type LeavePolicySchema = z.infer<typeof leavePolicySchema>

export function LeaveManagementSettings() {
  const staffRole = useAppSelector(selectSchoolStaffRoles)
  const AlleaveTypeForSchool = useAppSelector(selectLeaveTypeForSchool)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const auth = useAppSelector(selectAuthState)
  const [getStaffForSchool, { isLoading, isError }] = useLazyGetSchoolStaffRoleQuery()
  const [getLeavePolicies, { isLoading: isLeavePoliciesLoading }] = useLazyGetLeavePolicyForSchoolPageWiseQuery()
  const [getLeaveType, { isLoading: isLeaveTypeLoading }] = useLazyGetLeaveTypeForSchoolPageWiseQuery()

  const [getAllLeaveType, { data: dataForLeaveType, isLoading: isAllLeaveTypeLoading }] =
    useLazyGetAllLeaveTypeForSchoolQuery()

  const [createLeaveType, { isLoading: loadingForLeaveTypeCreation, isError: ErrorWhileTypeCreation }] =
    useCreateLeaveTypeMutation()
  const [updateLeaveType, { isLoading: loadingForLeaveTypeUpdation, isError: ErrorWhileTypeUpdation }] =
    useUpdateLeaveTypeMutation()

  const [createLeavePolicy, { isLoading: loadingForPolicyCreation, isError: ErrorWhilePolicyCreation }] =
    useCreateLeavePolicyMutation()
  const [updateLeavePolicy, { isLoading: loadingForPolicyUpdation, isError: ErrorWhilePolicyUpdation }] =
    useUpdateLeavePolicyMutation()

  const [refreshing, setRefreshing] = useState(false)

  const leaveTypeForm = useForm<LeaveTypeSchema>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      is_paid: false,
      affects_payroll: false,
    },
  })

  const leavePolicyForm = useForm<LeavePolicySchema>({
    resolver: zodResolver(leavePolicySchema),
    defaultValues: {
      staff_role_id: "",
      leave_type_id: "",
      annual_quota: 10, // Default to a reasonable value
      max_consecutive_days: 3,
      can_carry_forward: false,
      max_carry_forward_days: 0,
      requires_approval: false,
    },
  })

  // Watch annual_quota to update validation hints
  const annualQuota = leavePolicyForm.watch("annual_quota")
  const minConsecutiveDays = Math.floor(annualQuota * 0.3)
  const maxConsecutiveDays = Math.ceil(annualQuota * 0.35)
  const maxCarryForwardAllowed = Math.floor(annualQuota * 0.5)

  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("leave-types")

  const [DialogForLeaveType, setDialogForLeaveType] = useState<{
    type: "add" | "edit"
    leave_type: LeaveType | null
    isOpen: boolean
  }>({
    isOpen: false,
    type: "add",
    leave_type: null,
  })

  const [DialogForLeavePolicy, setDialogForLeavePolicy] = useState<{
    type: "add" | "edit"
    leave_policy: LeavePolicy | null
    isOpen: boolean
  }>({
    isOpen: false,
    type: "add",
    leave_policy: null,
  })

  const [currentlyDispalyedLeaveTypes, setCurrentlyDispalyedLeaveTypes] = useState<{
    leave_type: LeaveType[]
    page: PageMeta
  } | null>(null)

  const [currentlyDispalyedLeavePolicy, setCurrentlyDispalyedLeavePolicy] = useState<{
    leave_policy: LeavePolicy[]
    page: PageMeta
  } | null>(null)

  const onLeaveTypeSubmit: SubmitHandler<LeaveTypeSchema> = async (data) => {
    try {
      if (DialogForLeaveType.type === "edit") {
        const updated_type = await updateLeaveType({
          leave_type_id: DialogForLeaveType.leave_type!.id,
          payload: {
            leave_type_name: data.name,
            is_paid: data.is_paid,
            affects_payroll: data.affects_payroll,
            requires_proof: false,
            is_active: true,
          },
        })

        if ("error" in updated_type) {
          toast({
            variant: "destructive",
            title: "Error updating leave type",
            description: "Please try again later",
          })
          console.log(updated_type)
        } else {
          toast({
            variant: "default",
            title: "Leave type updated successfully ✔️",
            description: "The leave type has been updated",
            duration: 3000,
          })
          fetchDataForActiveTab("leave-types", currentlyDispalyedLeaveTypes?.page?.current_page)
          setDialogForLeaveType({
            isOpen: false,
            type: "add",
            leave_type: null,
          })
        }
      } else {
        const new_type = await createLeaveType({
          leave_type_name: data.name,
          is_paid: data.is_paid,
          affects_payroll: data.affects_payroll,
          requires_proof: false,
          is_active: true,
          academic_session_id: CurrentAcademicSessionForSchool!.id,
          school_id: CurrentAcademicSessionForSchool!.school_id,
        } as any)

        if ("error" in new_type) {
          toast({
            variant: "destructive",
            title: "Error creating leave type",
            description: "Please try again later",
          })
          console.log(new_type)
        } else {
          toast({
            variant: "default",
            title: "Leave type created successfully ✔️",
            description: "The new leave type has been added",
            duration: 3000,
          })
          fetchDataForActiveTab("leave-types", currentlyDispalyedLeaveTypes?.page?.current_page)
          setDialogForLeaveType({
            isOpen: false,
            type: "add",
            leave_type: null,
          })
        }
      }
    } catch (error) {
      console.error("Error submitting leave type:", error)
      toast({
        variant: "destructive",
        title: "An unexpected error occurred",
        description: "Please try again later",
      })
    }
  }

  const onLeavePolicySubmit: SubmitHandler<LeavePolicySchema> = async (data) => {
    try {
      if (DialogForLeavePolicy.type === "add") {
        const new_policy = await createLeavePolicy({
          annual_quota: data.annual_quota,
          staff_role_id: Number(data.staff_role_id),
          leave_type_id: Number(data.leave_type_id),
          can_carry_forward: data.can_carry_forward,
          max_carry_forward_days: data.max_carry_forward_days,
          max_consecutive_days: data.max_consecutive_days,
          deduction_rules: {},
          approval_hierarchy: {},
          requires_approval: data.requires_approval ? 1 : 0,
          academic_session_id: CurrentAcademicSessionForSchool!.id,
          school_id: CurrentAcademicSessionForSchool!.school_id,
        } as any)

        if ("data" in new_policy) {
          toast({
            variant: "default",
            title: "Policy created successfully ✓",
            description: "The new leave policy has been added",
            duration: 3000,
          })
          fetchDataForActiveTab("leave-policies", currentlyDispalyedLeavePolicy?.page?.current_page)
          leavePolicyForm.reset()
          setDialogForLeavePolicy({
            isOpen: false,
            type: "add",
            leave_policy: null,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error creating policy",
            description: "Please check your inputs and try again",
          })
          console.log(new_policy)
        }
      } else if (DialogForLeavePolicy.type === "edit") {
        const policy_id = DialogForLeavePolicy.leave_policy!.id

        const payload = {
          annual_quota: data.annual_quota,
          staff_role_id: Number(data.staff_role_id),
          leave_type_id: Number(data.leave_type_id),
          can_carry_forward: data.can_carry_forward,
          max_carry_forward_days: data.max_carry_forward_days,
          max_consecutive_days: data.max_consecutive_days,
          deduction_rules: {},
          approval_hierarchy: {},
          requires_approval: data.requires_approval ? 1 : 0,
        }

        const policy = await updateLeavePolicy({ policy_id: policy_id, payload: payload })

        if ("data" in policy) {
          toast({
            variant: "default",
            title: "Policy updated successfully ✓",
            description: "The leave policy has been updated",
            duration: 3000,
          })
          fetchDataForActiveTab("leave-policies", currentlyDispalyedLeavePolicy?.page?.current_page)
          leavePolicyForm.reset()
          setDialogForLeavePolicy({
            isOpen: false,
            type: "add",
            leave_policy: null,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error updating policy",
            description: "Please check your inputs and try again",
          })
          console.log(policy.error)
        }
      }
    } catch (error) {
      console.error("Error submitting leave policy:", error)
      toast({
        variant: "destructive",
        title: "An unexpected error occurred",
        description: "Please try again later",
      })
    }
  }

  const openLeaveTypeDialog = (type: "add" | "edit", leaveType: LeaveType | null) => {
    setDialogForLeaveType({
      isOpen: true,
      type: type,
      leave_type: leaveType,
    })

    if (type === "edit" && leaveType) {
      leaveTypeForm.reset({
        name: leaveType?.leave_type_name,
        description: leaveType?.leave_type_name,
        is_paid: Boolean(Number(leaveType?.is_paid)),
        affects_payroll: Boolean(Number(leaveType?.affects_payroll)),
      })
    } else {
      leaveTypeForm.reset({
        name: "",
        description: "",
        is_paid: false,
        affects_payroll: false,
      })
    }

    getAllLeaveType({
      academic_session_id: CurrentAcademicSessionForSchool!.id,
    })
  }

  const openLeavePolicyDialog = (type: "add" | "edit", leavePolicy: LeavePolicy | null) => {
    // First, fetch required data
    getStaffForSchool(auth.user!.school_id)
    getAllLeaveType({
      academic_session_id: CurrentAcademicSessionForSchool!.id,
    })

    // Then open dialog and set form values
    setDialogForLeavePolicy({
      isOpen: true,
      type: type,
      leave_policy: leavePolicy,
    })

    if (type === "edit" && leavePolicy) {
      leavePolicyForm.reset({
        annual_quota: leavePolicy?.annual_quota || 10,
        staff_role_id: leavePolicy?.staff_role_id.toString(),
        can_carry_forward: leavePolicy?.can_carry_forward || false,
        leave_type_id: leavePolicy?.leave_type_id.toString(),
        max_carry_forward_days: leavePolicy?.max_carry_forward_days || 0,
        max_consecutive_days: leavePolicy?.max_consecutive_days || 3,
        requires_approval: leavePolicy?.requires_approval === 1,
      })
    } else {
      leavePolicyForm.reset({
        staff_role_id: "",
        leave_type_id: "",
        annual_quota: 10,
        max_consecutive_days: 3,
        can_carry_forward: false,
        max_carry_forward_days: 0,
        requires_approval: false,
      })
    }
  }

  async function fetchDataForActiveTab(type: "leave-types" | "leave-policies", page = 1) {
    try {
      setRefreshing(true)

      if (type === "leave-policies") {
        const leave_policy = await getLeavePolicies({
          page: page,
          academic_session_id: CurrentAcademicSessionForSchool!.id,
        })

        if (leave_policy.data) {
          setCurrentlyDispalyedLeavePolicy({
            leave_policy: leave_policy.data.data,
            page: leave_policy.data.page,
          })
        }
      }

      if (type === "leave-types") {
        const leave_type = await getLeaveType({
          page: page,
          academic_session_id: CurrentAcademicSessionForSchool!.id,
        })

        if (leave_type.data) {
          setCurrentlyDispalyedLeaveTypes({
            leave_type: leave_type.data.data,
            page: leave_type.data.page,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Please try refreshing the page",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const refreshData = () => {
    fetchDataForActiveTab(activeTab as "leave-types" | "leave-policies", 1)
  }

  useEffect(() => {
    if (!currentlyDispalyedLeavePolicy || !currentlyDispalyedLeaveTypes) {
      fetchDataForActiveTab(activeTab as "leave-types" | "leave-policies", 1)
    }

    if (!dataForLeaveType) {
      getAllLeaveType({
        academic_session_id: CurrentAcademicSessionForSchool!.id,
      })
    }
  }, [activeTab])

  // Helper function to check if there are no leave types
  const hasNoLeaveTypes = !currentlyDispalyedLeaveTypes?.leave_type.length

  // Helper function to check if there are no leave policies
  const hasNoLeavePolicies = !currentlyDispalyedLeavePolicy?.leave_policy.length

  // Helper function to check if there are no leave types for policy creation
  const hasNoLeaveTypesForPolicy = !dataForLeaveType?.length

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">{t("leave_management_settings")}</h1>

      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={refreshData} disabled={refreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? t("refreshing") : t("refresh")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leave-types">{t("leave_type")}</TabsTrigger>
          <TabsTrigger value="leave-policies">{t("leave_policies")}</TabsTrigger>
        </TabsList>

        <TabsContent value="leave-types">
          <Card>
            <CardHeader>
              <CardTitle>{t("leave_type")}</CardTitle>
              <CardDescription>{t("manage_different_types_of_leaves_available_in_your_organization")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={() => openLeaveTypeDialog("add", null)}>
                  <Plus className="mr-2 h-4 w-4" /> {t("add_leave_type")}
                </Button>
              </div>

              {hasNoLeaveTypes ? (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_leave_types_found")}</AlertTitle>
                  <AlertDescription>
                    {t(
                      "you_haven't_created_any_leave_types_yet._click_the_add_leave_type_button_to_create_your_first_leave_type.",
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("paid")}</TableHead>
                      <TableHead>{t("affects_payroll")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentlyDispalyedLeaveTypes?.leave_type.map((leaveType) => (
                      <TableRow key={leaveType.id}>
                        <TableCell>{leaveType.leave_type_name}</TableCell>
                        <TableCell>{leaveType.is_paid ? "Yes" : "No"}</TableCell>
                        <TableCell>{leaveType.affects_payroll ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openLeaveTypeDialog("edit", leaveType)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-policies">
          <Card>
            <CardHeader>
              <CardTitle>{t("leave_policies")}</CardTitle>
              <CardDescription>{t("set_leave_policies_for_different_staff_roles")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={() => openLeavePolicyDialog("add", null)} disabled={hasNoLeaveTypesForPolicy}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("add_leave_policy")}
                </Button>
              </div>

              {hasNoLeaveTypesForPolicy && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_leave_types_available")}</AlertTitle>
                  <AlertDescription>
                    {t(
                      "you_need_to_create_at_one_leave_type_before_you_can_creat_a_leave_policy._go_to_the_leave_types_tab_to_create_a_leave_type_first.",
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!hasNoLeaveTypesForPolicy && hasNoLeavePolicies && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_leave_policies_found")}</AlertTitle>
                  <AlertDescription>
                    {t(
                      "you_haven't_created_any_leave_policies_yet._click_the_Aadd_leave_policy_button_to_create_your_first_policy.",
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!hasNoLeavePolicies && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("staff_role")}</TableHead>
                      <TableHead>{t("leave_type")}</TableHead>
                      <TableHead>{t("annual_allowance")}</TableHead>
                      <TableHead>{t("max_consecutive_days")}</TableHead>
                      <TableHead>{t("carry_forward")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentlyDispalyedLeavePolicy?.leave_policy.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>{policy.staff_role.role}</TableCell>
                        <TableCell>{policy.leave_type.leave_type_name}</TableCell>
                        <TableCell>{policy.annual_quota}</TableCell>
                        <TableCell>{policy.max_consecutive_days}</TableCell>
                        <TableCell>
                          {policy.can_carry_forward ? `Yes (Max ${policy.max_carry_forward_days} days)` : "No"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openLeavePolicyDialog("edit", policy)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Type Dialog */}
      <Dialog
        open={DialogForLeaveType.isOpen}
        onOpenChange={(value) => {
          if (!value) {
            leaveTypeForm.reset()
          }
          setDialogForLeaveType({
            ...DialogForLeaveType,
            isOpen: value,
          })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{DialogForLeaveType.type === "edit" ? t("edit_leave_type") : t("add_leave_type")}</DialogTitle>
            <DialogDescription>
              {DialogForLeaveType.type === "edit"
                ? t("edit_the_details_of_the_leave_type")
                : t("enter_the_details_of_the_new_leave_type")}
            </DialogDescription>
          </DialogHeader>
          <Form {...leaveTypeForm}>
            <form onSubmit={leaveTypeForm.handleSubmit(onLeaveTypeSubmit)} className="space-y-8">
              <FormField
                control={leaveTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Sick Leave, Casual Leave" />
                    </FormControl>
                    <FormDescription>{t("enter_a_descriptive_name_for_this_leave_type")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leaveTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of this leave type" />
                    </FormControl>
                    <FormDescription>{t("optional:_provide_additional_details_about_this_leave_type")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={leaveTypeForm.control}
                name="is_paid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("paid_leave")}</FormLabel>
                      <FormDescription>{t("is_this_a_paid_leave_type?")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={leaveTypeForm.control}
                name="affects_payroll"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("affect_role")}</FormLabel>
                      <FormDescription>{t("does_this_leave_type_affect_payroll_calculations?")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogForLeaveType({ ...DialogForLeaveType, isOpen: false })}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loadingForLeaveTypeCreation || loadingForLeaveTypeUpdation}>
                  {DialogForLeaveType.type === "edit" ? t("update") : t("create")}
                  {(loadingForLeaveTypeCreation || loadingForLeaveTypeUpdation) && (
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Leave Policy Dialog */}
      <Dialog
        open={DialogForLeavePolicy.isOpen}
        onOpenChange={(value) => {
          if (!value) {
            leavePolicyForm.reset()
          }
          setDialogForLeavePolicy({
            ...DialogForLeavePolicy,
            isOpen: value,
          })
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {DialogForLeavePolicy.type === "edit" ? t("edit_leave_policy") : t("add_leave_policy")}
            </DialogTitle>
            <DialogDescription>
              {DialogForLeavePolicy.type === "edit"
                ? t("edit_the_details_of_the_leave_policy")
                : t("enter_the_details_of_the_new_leave_policy")}
            </DialogDescription>
          </DialogHeader>
          <Form {...leavePolicyForm}>
            <form onSubmit={leavePolicyForm.handleSubmit(onLeavePolicySubmit)} className="space-y-6">
              <FormField
                control={leavePolicyForm.control}
                name="staff_role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("staff_role")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={DialogForLeavePolicy.type === "edit"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_staff_role")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffRole && staffRole.length > 0 ? (
                          staffRole.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id.toString()}>
                              {staff.role}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-roles" disabled>
                            {t("no_staff_roles_available")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("select_the_staff_role_this_policy_applies_to")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={leavePolicyForm.control}
                name="leave_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("leave_type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={DialogForLeavePolicy.type === "edit"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_leave_types")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataForLeaveType && dataForLeaveType.length > 0 ? (
                          dataForLeaveType.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.leave_type_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-types" disabled>
                            {t("no_leave_types_available")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("select_the_type_of_leave_for_this_policy")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={leavePolicyForm.control}
                name="annual_quota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("annual_allowance")}</FormLabel>
                    <FormControl>
                      <NumberInput
                        {...field}
                        min={1}
                        max={100}
                        value={field.value ? field.value.toString() : ""}
                        onChange={(value) => {
                          const numValue = Number(value)
                          if (!isNaN(numValue)) {
                            field.onChange(numValue)
                            const minConsecutive = Math.floor(numValue * 0.3)
                            const maxConsecutive = Math.ceil(numValue * 0.35)
                            const currentConsecutive = leavePolicyForm.getValues("max_consecutive_days")
                            if (currentConsecutive < minConsecutive || currentConsecutive > maxConsecutive) {
                              leavePolicyForm.setValue("max_consecutive_days", minConsecutive)
                            }
                            if (leavePolicyForm.getValues("can_carry_forward")) {
                              const maxCarryForward = Math.floor(numValue * 0.5)
                              const currentCarryForward = leavePolicyForm.getValues("max_carry_forward_days")
                              if (currentCarryForward > maxCarryForward) {
                                leavePolicyForm.setValue("max_carry_forward_days", maxCarryForward)
                              }
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>{t("enter_a_value_between_1_and_100_days")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={leavePolicyForm.control}
                name="max_consecutive_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("max_consecutive_days")}</FormLabel>
                    <FormControl>
                      <NumberInput
                        {...field}
                        min={minConsecutiveDays}
                        max={maxConsecutiveDays}
                        value={field.value ? field.value.toString() : ""}
                        onChange={(value) => {
                          const numValue = Number(value)
                          if (!isNaN(numValue)) {
                            field.onChange(numValue)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {`Should be between ${minConsecutiveDays} and ${maxConsecutiveDays} days (30-35% of annual allowance)`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={leavePolicyForm.control}
                name="can_carry_forward"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base" required>
                        {t("allow_carry_forward")}
                      </FormLabel>
                      <FormDescription>{t("can_unused_leaves_be_carried_forward_to_the_next_year?")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) {
                            leavePolicyForm.setValue("max_carry_forward_days", 0)
                          } else {
                            // Set a default value when enabling
                            const maxAllowed = Math.floor(leavePolicyForm.getValues("annual_quota") * 0.5)
                            leavePolicyForm.setValue("max_carry_forward_days", maxAllowed)
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={leavePolicyForm.control}
                name="max_carry_forward_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("max_carry_forward")}</FormLabel>
                    <FormControl>
                      <NumberInput
                        {...field}
                        min={0}
                        max={maxCarryForwardAllowed}
                        value={field.value ? field.value.toString() : ""}
                        disabled={!leavePolicyForm.watch("can_carry_forward")}
                        onChange={(value) => {
                          const numValue = Number(value)
                          if (!isNaN(numValue)) {
                            field.onChange(numValue)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {`Cannot exceed ${maxCarryForwardAllowed} days (50% of annual allowance)`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogForLeavePolicy({ ...DialogForLeavePolicy, isOpen: false })}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loadingForPolicyCreation || loadingForPolicyUpdation}>
                  {DialogForLeavePolicy.type === "edit" ? t("update") : t("create")}
                  {(loadingForPolicyCreation || loadingForPolicyUpdation) && (
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
