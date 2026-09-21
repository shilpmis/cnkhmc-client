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
import { Plus, Edit, Trash2, AlertCircle, RefreshCw, ShieldCheck, FileSpreadsheet } from "lucide-react"
import {
  useLazyGetLeavePolicyForSchoolPageWiseQuery,
  useLazyGetAllLeaveTypeForSchoolQuery,
  useLazyGetLeaveTypeForSchoolPageWiseQuery,
  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
  useDeleteLeavePolicyMutation,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
} from "@/services/LeaveService"
import type { LeavePolicy, LeaveType } from "@/types/leave"
import type { PageMeta } from "@/types/global"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// Schema for leave type
const leaveTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  is_paid: z.boolean(),
  affects_payroll: z.boolean(),
})

// Schema for leave policy directly mapped to leave type
export const leavePolicySchema = z.object({
  leave_type_id: z.string().min(1, { message: "Leave type is required" }),
  annual_quota: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ invalid_type_error: "Annual allowance must be a number" })
      .min(1, { message: "Annual allowance must be at least 1" })
      .max(100, { message: "Annual allowance cannot exceed 100" })
  ),
  max_consecutive_days_pct: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ invalid_type_error: "Percentage must be a number" })
      .min(1, { message: "Percentage must be at least 1%" })
      .max(100, { message: "Percentage cannot exceed 100%" })
      .optional()
  ),
  max_consecutive_days: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ invalid_type_error: "Max consecutive days must be a number" })
      .min(1, { message: "Max consecutive days must be at least 1" })
  ),
  can_carry_forward: z.boolean(),
  max_carry_forward_pct: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ invalid_type_error: "Percentage must be a number" })
      .min(0, { message: "Percentage must be 0% or greater" })
      .max(100, { message: "Percentage cannot exceed 100%" })
      .optional()
  ),
  max_carry_forward_days: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z
      .number({ invalid_type_error: "Max carryforward days must be a number" })
      .min(0, { message: "Max carryforward days must be 0 or greater" })
  ),
  deduction_rules: z.record(z.string(), z.any()).optional(),
  approval_hierarchy: z.record(z.string(), z.any()).optional(),
  requires_approval: z.boolean().optional().default(false),
})

type LeaveTypeSchema = z.infer<typeof leaveTypeSchema>
type LeavePolicySchema = z.infer<typeof leavePolicySchema>

export function LeaveManagementSettings() {
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const { t } = useTranslation()

  // API queries and mutations
  const [getLeavePolicies, { isLoading: isLeavePoliciesLoading }] = useLazyGetLeavePolicyForSchoolPageWiseQuery()
  const [getLeaveType, { isLoading: isLeaveTypeLoading }] = useLazyGetLeaveTypeForSchoolPageWiseQuery()
  const [getAllLeaveType, { data: dataForLeaveType }] = useLazyGetAllLeaveTypeForSchoolQuery()

  const [createLeaveType, { isLoading: loadingForLeaveTypeCreation }] = useCreateLeaveTypeMutation()
  const [updateLeaveType, { isLoading: loadingForLeaveTypeUpdation }] = useUpdateLeaveTypeMutation()
  const [deleteLeaveType, { isLoading: loadingForLeaveTypeDeletion }] = useDeleteLeaveTypeMutation()

  const [createLeavePolicy, { isLoading: loadingForPolicyCreation }] = useCreateLeavePolicyMutation()
  const [updateLeavePolicy, { isLoading: loadingForPolicyUpdation }] = useUpdateLeavePolicyMutation()
  const [deleteLeavePolicy, { isLoading: loadingForPolicyDeletion }] = useDeleteLeavePolicyMutation()

  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("leave-types")

  // Forms
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
      leave_type_id: "",
      annual_quota: 10,
      max_consecutive_days_pct: 30,
      max_consecutive_days: 3,
      can_carry_forward: false,
      max_carry_forward_pct: 50,
      max_carry_forward_days: 0,
      requires_approval: false,
    },
  })

  // Dialog states
  const [dialogForLeaveType, setDialogForLeaveType] = useState<{
    isOpen: boolean
    type: "add" | "edit"
    leave_type: LeaveType | null
  }>({
    isOpen: false,
    type: "add",
    leave_type: null,
  })

  const [dialogForLeavePolicy, setDialogForLeavePolicy] = useState<{
    isOpen: boolean
    type: "add" | "edit"
    leave_policy: LeavePolicy | null
  }>({
    isOpen: false,
    type: "add",
    leave_policy: null,
  })

  // Display data
  const [currentlyDispalyedLeaveTypes, setCurrentlyDispalyedLeaveTypes] = useState<{
    leave_type: LeaveType[]
    page: PageMeta
  } | null>(null)

  const [currentlyDispalyedLeavePolicy, setCurrentlyDispalyedLeavePolicy] = useState<{
    leave_policy: LeavePolicy[]
    page: PageMeta
  } | null>(null)

  // Handlers for Leave Type
  const onLeaveTypeSubmit: SubmitHandler<LeaveTypeSchema> = async (data) => {
    try {
      if (dialogForLeaveType.type === "edit") {
        const updated_type = await updateLeaveType({
          leave_type_id: dialogForLeaveType.leave_type!.id,
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
        } else {
          toast({
            variant: "default",
            title: "Leave type updated successfully ✔️",
            description: "The leave type has been updated",
          })
          fetchDataForActiveTab("leave-types", currentlyDispalyedLeaveTypes?.page?.current_page)
          setDialogForLeaveType({ isOpen: false, type: "add", leave_type: null })
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
        } else {
          toast({
            variant: "default",
            title: "Leave type created successfully ✔️",
            description: "The new leave type has been added",
          })
          fetchDataForActiveTab("leave-types", currentlyDispalyedLeaveTypes?.page?.current_page)
          setDialogForLeaveType({ isOpen: false, type: "add", leave_type: null })
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

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean
    type: "leave-type" | "leave-policy"
    id: number | null
    title: string
    description: string
  }>({
    isOpen: false,
    type: "leave-type",
    id: null,
    title: "",
    description: "",
  })

  const handleDeleteLeaveType = (leaveTypeId: number) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: "leave-type",
      id: leaveTypeId,
      title: "Delete Leave Type",
      description: "Are you sure you want to delete this leave type? Associated leave policies will also be deleted.",
    })
  }

  const handleDeletePolicy = (policyId: number) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: "leave-policy",
      id: policyId,
      title: "Delete Leave Policy",
      description: "Are you sure you want to delete this leave policy?",
    })
  }

  const executeConfirmDelete = async () => {
    if (!deleteConfirmDialog.id) return
    if (deleteConfirmDialog.type === "leave-type") {
      try {
        const res = await deleteLeaveType(deleteConfirmDialog.id)
        if ("error" in res) {
          toast({
            variant: "destructive",
            title: "Error deleting leave type",
          })
        } else {
          toast({
            variant: "default",
            title: "Leave type deleted successfully",
          })
          fetchDataForActiveTab("leave-types", currentlyDispalyedLeaveTypes?.page?.current_page)
          if (CurrentAcademicSessionForSchool) {
            getAllLeaveType({ academic_session_id: CurrentAcademicSessionForSchool.id })
          }
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error deleting leave type",
        })
      }
    } else if (deleteConfirmDialog.type === "leave-policy") {
      try {
        const res = await deleteLeavePolicy(deleteConfirmDialog.id)
        if ("error" in res) {
          toast({
            variant: "destructive",
            title: "Error deleting policy",
          })
        } else {
          toast({
            variant: "default",
            title: "Policy deleted successfully",
          })
          fetchDataForActiveTab("leave-policies", currentlyDispalyedLeavePolicy?.page?.current_page)
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error deleting policy",
        })
      }
    }
  }

  // Handlers for Leave Policy
  const onLeavePolicySubmit: SubmitHandler<LeavePolicySchema> = async (data) => {
    try {
      if (dialogForLeavePolicy.type === "add") {
        const new_policy = await createLeavePolicy({
          annual_quota: data.annual_quota,
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
            description: "The leave policy has been configured",
          })
          fetchDataForActiveTab("leave-policies", currentlyDispalyedLeavePolicy?.page?.current_page)
          leavePolicyForm.reset()
          setDialogForLeavePolicy({ isOpen: false, type: "add", leave_policy: null })
        } else {
          toast({
            variant: "destructive",
            title: "Error creating policy",
            description: "Please check your inputs and try again",
          })
        }
      } else if (dialogForLeavePolicy.type === "edit") {
        const policy_id = dialogForLeavePolicy.leave_policy!.id
        const payload = {
          annual_quota: data.annual_quota,
          leave_type_id: Number(data.leave_type_id),
          can_carry_forward: data.can_carry_forward,
          max_carry_forward_days: data.max_carry_forward_days,
          max_consecutive_days: data.max_consecutive_days,
          deduction_rules: {},
          approval_hierarchy: {},
          requires_approval: data.requires_approval ? 1 : 0,
        }

        const policy = await updateLeavePolicy({ policy_id, payload })

        if ("data" in policy) {
          toast({
            variant: "default",
            title: "Policy updated successfully ✓",
            description: "The leave policy has been updated",
          })
          fetchDataForActiveTab("leave-policies", currentlyDispalyedLeavePolicy?.page?.current_page)
          leavePolicyForm.reset()
          setDialogForLeavePolicy({ isOpen: false, type: "add", leave_policy: null })
        } else {
          toast({
            variant: "destructive",
            title: "Error updating policy",
            description: "Please check your inputs and try again",
          })
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

  // Open dialog functions
  const openLeaveTypeDialog = (type: "add" | "edit", leaveType: LeaveType | null) => {
    setDialogForLeaveType({
      isOpen: true,
      type: type,
      leave_type: leaveType,
    })

    if (type === "edit" && leaveType) {
      leaveTypeForm.reset({
        name: leaveType.leave_type_name,
        description: leaveType.leave_type_name,
        is_paid: Boolean(Number(leaveType.is_paid)),
        affects_payroll: Boolean(Number(leaveType.affects_payroll)),
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
    getAllLeaveType({
      academic_session_id: CurrentAcademicSessionForSchool!.id,
    })

    setDialogForLeavePolicy({
      isOpen: true,
      type: type,
      leave_policy: leavePolicy,
    })

    if (type === "edit" && leavePolicy) {
      const quota = leavePolicy.annual_quota || 10
      const consecDays = leavePolicy.max_consecutive_days || 3
      const carryDays = leavePolicy.max_carry_forward_days || 0
      leavePolicyForm.reset({
        annual_quota: quota,
        leave_type_id: leavePolicy.leave_type_id.toString(),
        max_consecutive_days_pct: quota > 0 ? Math.round((consecDays / quota) * 100) : 30,
        max_consecutive_days: consecDays,
        can_carry_forward: leavePolicy.can_carry_forward || false,
        max_carry_forward_pct: quota > 0 ? Math.round((carryDays / quota) * 100) : 50,
        max_carry_forward_days: carryDays,
        requires_approval: leavePolicy.requires_approval === 1 || leavePolicy.requires_approval === true,
      })
    } else {
      leavePolicyForm.reset({
        leave_type_id: "",
        annual_quota: 10,
        max_consecutive_days_pct: 30,
        max_consecutive_days: 3,
        can_carry_forward: false,
        max_carry_forward_pct: 50,
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
    fetchDataForActiveTab(activeTab as any, 1)
  }

  useEffect(() => {
    fetchDataForActiveTab(activeTab as any, 1)
    if (!dataForLeaveType && CurrentAcademicSessionForSchool) {
      getAllLeaveType({ academic_session_id: CurrentAcademicSessionForSchool.id })
    }
  }, [activeTab])

  const hasNoLeaveTypes = !currentlyDispalyedLeaveTypes?.leave_type?.length
  const hasNoLeavePolicies = !currentlyDispalyedLeavePolicy?.leave_policy?.length
  const hasNoLeaveTypesForPolicy = !dataForLeaveType?.length

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("leave_management_settings")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure Leave Types and define Leave Policies (Annual Quota, Max Consecutive Days, Carry Forward limits).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={refreshing} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? t("refreshing") : t("refresh")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leave-types" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t("leave_type")}
          </TabsTrigger>
          <TabsTrigger value="leave-policies" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {t("leave_policies")}
          </TabsTrigger>
        </TabsList>

        {/* 1. LEAVE TYPES TAB */}
        <TabsContent value="leave-types" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("leave_type")}</CardTitle>
                <CardDescription>{t("manage_different_types_of_leaves_available_in_your_organization")}</CardDescription>
              </div>
              <Button onClick={() => openLeaveTypeDialog("add", null)}>
                <Plus className="mr-2 h-4 w-4" /> {t("add_leave_type")}
              </Button>
            </CardHeader>
            <CardContent>
              {hasNoLeaveTypes ? (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_leave_types_found")}</AlertTitle>
                  <AlertDescription>
                    {t("you_haven't_created_any_leave_types_yet._click_the_add_leave_type_button_to_create_your_first_leave_type.")}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("paid")}</TableHead>
                        <TableHead>{t("affects_payroll")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentlyDispalyedLeaveTypes?.leave_type.map((leaveType) => (
                        <TableRow key={leaveType.id}>
                          <TableCell className="font-medium">{leaveType.leave_type_name}</TableCell>
                          <TableCell>
                            <Badge variant={leaveType.is_paid ? "default" : "secondary"}>
                              {leaveType.is_paid ? "Paid" : "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={leaveType.affects_payroll ? "destructive" : "outline"}>
                              {leaveType.affects_payroll ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openLeaveTypeDialog("edit", leaveType)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteLeaveType(leaveType.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. LEAVE POLICIES TAB */}
        <TabsContent value="leave-policies" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("leave_policies")}</CardTitle>
                <CardDescription>
                  Configure quotas, max consecutive days, and carry-forward limits for each leave type.
                </CardDescription>
              </div>
              <Button
                onClick={() => openLeavePolicyDialog("add", null)}
                disabled={hasNoLeaveTypesForPolicy}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("add_leave_policy")}
              </Button>
            </CardHeader>
            <CardContent>
              {hasNoLeaveTypesForPolicy && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_leave_types_available")}</AlertTitle>
                  <AlertDescription>
                    {t("you_need_to_create_at_one_leave_type_before_you_can_creat_a_leave_policy._go_to_the_leave_types_tab_to_create_a_leave_type_first.")}
                  </AlertDescription>
                </Alert>
              )}

              {!hasNoLeaveTypesForPolicy && hasNoLeavePolicies && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_leave_policies_found")}</AlertTitle>
                  <AlertDescription>
                    No policies configured yet. Click "Add Leave Policy" to configure annual quotas and rules for each leave type.
                  </AlertDescription>
                </Alert>
              )}

              {!hasNoLeavePolicies && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("leave_type")}</TableHead>
                        <TableHead>{t("annual_allowance")}</TableHead>
                        <TableHead>{t("max_consecutive_days")}</TableHead>
                        <TableHead>{t("carry_forward")}</TableHead>
                        <TableHead>Approval Required</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentlyDispalyedLeavePolicy?.leave_policy.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell className="font-semibold text-primary">{policy.leave_type?.leave_type_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{policy.annual_quota} days/yr</Badge>
                          </TableCell>
                          <TableCell>{policy.max_consecutive_days} days</TableCell>
                          <TableCell>
                            {policy.can_carry_forward ? (
                              <Badge variant="secondary">Max {policy.max_carry_forward_days} days</Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={policy.requires_approval ? "default" : "outline"}>
                              {policy.requires_approval ? "Yes" : "Auto-approved"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openLeavePolicyDialog("edit", policy)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeletePolicy(policy.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Type Dialog */}
      <Dialog
        open={dialogForLeaveType.isOpen}
        onOpenChange={(value) => {
          if (!value) leaveTypeForm.reset()
          setDialogForLeaveType({ ...dialogForLeaveType, isOpen: value })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogForLeaveType.type === "edit" ? t("edit_leave_type") : t("add_leave_type")}</DialogTitle>
            <DialogDescription>
              {dialogForLeaveType.type === "edit"
                ? t("edit_the_details_of_the_leave_type")
                : t("enter_the_details_of_the_new_leave_type")}
            </DialogDescription>
          </DialogHeader>
          <Form {...leaveTypeForm}>
            <form onSubmit={leaveTypeForm.handleSubmit(onLeaveTypeSubmit)} className="space-y-6">
              <FormField
                control={leaveTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Casual Leave, Sick Leave, Maternity Leave" />
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
                  onClick={() => setDialogForLeaveType({ ...dialogForLeaveType, isOpen: false })}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loadingForLeaveTypeCreation || loadingForLeaveTypeUpdation}>
                  {dialogForLeaveType.type === "edit" ? t("update") : t("create")}
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
        open={dialogForLeavePolicy.isOpen}
        onOpenChange={(value) => {
          if (!value) leavePolicyForm.reset()
          setDialogForLeavePolicy({ ...dialogForLeavePolicy, isOpen: value })
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogForLeavePolicy.type === "edit" ? t("edit_leave_policy") : t("add_leave_policy")}
            </DialogTitle>
            <DialogDescription>
              {dialogForLeavePolicy.type === "edit"
                ? t("edit_the_details_of_the_leave_policy")
                : "Configure policy rules and annual allowance for a leave type."}
            </DialogDescription>
          </DialogHeader>
          <Form {...leavePolicyForm}>
            <form onSubmit={leavePolicyForm.handleSubmit(onLeavePolicySubmit)} className="space-y-6">
              <FormField
                control={leavePolicyForm.control}
                name="leave_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("leave_type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={dialogForLeavePolicy.type === "edit"}
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
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={field.value !== undefined && field.value !== null ? field.value : ""}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === "") {
                            field.onChange("")
                            return
                          }
                          let val = parseInt(raw, 10)
                          if (isNaN(val)) {
                            field.onChange("")
                            return
                          }
                          if (val > 100) val = 100
                          if (val < 1) val = 1
                          field.onChange(val)

                          const consecPct = Number(leavePolicyForm.getValues("max_consecutive_days_pct")) || 30
                          const newConsec = Math.min(val, Math.max(1, Math.round(val * (consecPct / 100))))
                          leavePolicyForm.setValue("max_consecutive_days", newConsec)

                          if (leavePolicyForm.getValues("can_carry_forward")) {
                            const carryPct = Number(leavePolicyForm.getValues("max_carry_forward_pct")) || 50
                            const newCarry = Math.min(val, Math.max(0, Math.round(val * (carryPct / 100))))
                            leavePolicyForm.setValue("max_carry_forward_days", newCarry)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>{t("enter_a_value_between_1_and_100_days")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={leavePolicyForm.control}
                  name="max_consecutive_days_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Consecutive Days (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={field.value !== undefined && field.value !== null ? field.value : ""}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === "") {
                              field.onChange("")
                              return
                            }
                            let val = parseInt(raw, 10)
                            if (isNaN(val)) {
                              field.onChange("")
                              return
                            }
                            if (val > 100) val = 100
                            if (val < 1) val = 1
                            field.onChange(val)

                            const quota = Number(leavePolicyForm.getValues("annual_quota")) || 10
                            const calcDays = Math.min(quota, Math.max(1, Math.round(quota * (val / 100))))
                            leavePolicyForm.setValue("max_consecutive_days", calcDays)
                          }}
                        />
                      </FormControl>
                      <FormDescription>Set % of annual allowance (1 - 100%)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={leavePolicyForm.control}
                  name="max_consecutive_days"
                  render={({ field }) => {
                    const quota = Number(leavePolicyForm.watch("annual_quota")) || 10
                    return (
                      <FormItem>
                        <FormLabel required>{t("max_consecutive_days")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={quota}
                            value={field.value !== undefined && field.value !== null ? field.value : ""}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === "") {
                                field.onChange("")
                                return
                              }
                              let val = parseInt(raw, 10)
                              if (isNaN(val)) {
                                field.onChange("")
                                return
                              }
                              if (val > quota) val = quota
                              if (val < 1) val = 1
                              field.onChange(val)

                              if (quota > 0) {
                                const calcPct = Math.min(100, Math.max(1, Math.round((val / quota) * 100)))
                                leavePolicyForm.setValue("max_consecutive_days_pct", calcPct)
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value !== undefined && field.value !== null && field.value !== ""
                            ? `${field.value} days (${Math.min(100, Math.round((Number(field.value) / quota) * 100))}% of annual allowance)`
                            : "Enter max consecutive days"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

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
                            leavePolicyForm.setValue("max_carry_forward_pct", 0)
                          } else {
                            const quota = Number(leavePolicyForm.getValues("annual_quota")) || 10
                            const pct = Number(leavePolicyForm.getValues("max_carry_forward_pct")) || 50
                            leavePolicyForm.setValue("max_carry_forward_pct", pct)
                            leavePolicyForm.setValue("max_carry_forward_days", Math.min(quota, Math.round(quota * (pct / 100))))
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={leavePolicyForm.control}
                  name="max_carry_forward_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Carry Forward (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          disabled={!leavePolicyForm.watch("can_carry_forward")}
                          value={field.value !== undefined && field.value !== null ? field.value : ""}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === "") {
                              field.onChange("")
                              return
                            }
                            let val = parseInt(raw, 10)
                            if (isNaN(val)) {
                              field.onChange("")
                              return
                            }
                            if (val > 100) val = 100
                            if (val < 0) val = 0
                            field.onChange(val)

                            const quota = Number(leavePolicyForm.getValues("annual_quota")) || 10
                            const calcDays = Math.min(quota, Math.round(quota * (val / 100)))
                            leavePolicyForm.setValue("max_carry_forward_days", calcDays)
                          }}
                        />
                      </FormControl>
                      <FormDescription>Set % of annual allowance (0 - 100%)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={leavePolicyForm.control}
                  name="max_carry_forward_days"
                  render={({ field }) => {
                    const quota = Number(leavePolicyForm.watch("annual_quota")) || 10
                    return (
                      <FormItem>
                        <FormLabel required>{t("max_carry_forward")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={quota}
                            disabled={!leavePolicyForm.watch("can_carry_forward")}
                            value={field.value !== undefined && field.value !== null ? field.value : ""}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === "") {
                                field.onChange("")
                                return
                              }
                              let val = parseInt(raw, 10)
                              if (isNaN(val)) {
                                field.onChange("")
                                return
                              }
                              if (val > quota) val = quota
                              if (val < 0) val = 0
                              field.onChange(val)

                              if (quota > 0) {
                                const calcPct = Math.min(100, Math.max(0, Math.round((val / quota) * 100)))
                                leavePolicyForm.setValue("max_carry_forward_pct", calcPct)
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value !== undefined && field.value !== null && field.value !== ""
                            ? `${field.value} days (${Math.min(100, Math.round((Number(field.value) / quota) * 100))}% of annual allowance)`
                            : "Enter max carry forward days"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              <FormField
                control={leavePolicyForm.control}
                name="requires_approval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Requires Admin Approval</FormLabel>
                      <FormDescription>Whether applications under this policy need administrative approval.</FormDescription>
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
                  onClick={() => setDialogForLeavePolicy({ ...dialogForLeavePolicy, isOpen: false })}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loadingForPolicyCreation || loadingForPolicyUpdation}>
                  {dialogForLeavePolicy.type === "edit" ? t("update") : t("create")}
                  {(loadingForPolicyCreation || loadingForPolicyUpdation) && (
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmDialog.isOpen}
        onOpenChange={(open) => setDeleteConfirmDialog((prev) => ({ ...prev, isOpen: open }))}
        title={deleteConfirmDialog.title}
        description={deleteConfirmDialog.description}
        confirmText="Delete"
        variant="destructive"
        isLoading={loadingForLeaveTypeDeletion || loadingForPolicyDeletion}
        onConfirm={executeConfirmDelete}
      />
    </div>
  )
}
