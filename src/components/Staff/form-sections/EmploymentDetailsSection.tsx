import type React from "react"
import { useMemo, useEffect, useRef } from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Info } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetDepartmentsQuery } from "@/services/DepartmentService"
import { useGetStaffConfigurationsQuery } from "@/services/StaffService"
import { useGetAllLeavePoliciesForSchoolQuery } from "@/services/LeaveService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

interface EmploymentDetailsSectionProps {
  form: UseFormReturn<StaffFormData>
  onPrevious: () => void
  isApiInProgress: boolean
  formType: "create" | "update" | "view"
}

export const EmploymentDetailsSection: React.FC<EmploymentDetailsSectionProps> = ({
  form,
  onPrevious,
  isApiInProgress,
  formType,
}) => {
  const { t } = useTranslation()
  const school_id = useAppSelector((state) => state.auth.user?.school_id)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const initializedPoliciesRef = useRef(false)
  
  const { data: departments, isLoading: isDepartmentsLoading } = useGetDepartmentsQuery(
    { school_id: school_id! },
    { skip: !school_id }
  )
  const { data: allConfigs, isLoading: isConfigsLoading } = useGetStaffConfigurationsQuery()
  
  const { data: leavePolicies, isLoading: isPoliciesLoading } = useGetAllLeavePoliciesForSchoolQuery(
    { academic_session_id: currentAcademicSession?.id },
    { skip: !school_id }
  )

  const currentStaffType = form.watch("staff_type")

  const isPolicyMatchingStaff = (policy: any, staffType: string | null | undefined): boolean => {
    if (!policy.applicable_staff_type) return true
    if (!staffType) return true

    const pLower = policy.applicable_staff_type.trim().toLowerCase()
    const sLower = staffType.trim().toLowerCase()

    if (sLower.includes('hospital')) {
      return pLower.includes('hospital')
    }
    if (sLower.includes('non-teaching') || sLower.includes('non teaching')) {
      return pLower.includes('non-teaching') || pLower.includes('non teaching')
    }
    if (sLower.includes('teaching')) {
      if (pLower.includes('hospital') || pLower.includes('non-teaching') || pLower.includes('non teaching')) {
        return false
      }
      const isStaffNonVacational = sLower.includes('non vact') || sLower.includes('non-vact') || sLower.includes('non vacat')
      const isPolicyNonVacational = pLower.includes('non vact') || pLower.includes('non-vact') || pLower.includes('non vacat')
      const isStaffVacational = !isStaffNonVacational && (sLower.includes('vact') || sLower.includes('vacat'))
      const isPolicyVacational = !isPolicyNonVacational && (pLower.includes('vact') || pLower.includes('vacat'))

      if (isStaffNonVacational) return isPolicyNonVacational
      if (isStaffVacational) return isPolicyVacational
      return true
    }

    return pLower === sLower
  }

  const applicableLeavePolicies = useMemo(() => {
    if (!leavePolicies) return []
    const filtered = leavePolicies.filter((p) => isPolicyMatchingStaff(p, currentStaffType))
    return filtered.length > 0 ? filtered : leavePolicies
  }, [leavePolicies, currentStaffType])

  // Pre-select applicable leave policies on create once when policies are loaded
  useEffect(() => {
    if (!initializedPoliciesRef.current && formType === "create" && applicableLeavePolicies && applicableLeavePolicies.length > 0) {
      const currentVal = form.getValues("leave_policy_ids")
      if (!currentVal || currentVal.length === 0) {
        form.setValue("leave_policy_ids", applicableLeavePolicies.map((p) => p.id))
      }
      initializedPoliciesRef.current = true
    }
  }, [formType, applicableLeavePolicies, form])

  // Whenever staff_type changes, automatically filter selected leave_policy_ids to only applicable ones
  useEffect(() => {
    if (leavePolicies && leavePolicies.length > 0 && currentStaffType) {
      const currentVal = form.getValues("leave_policy_ids") || []
      const applicableIds = new Set(applicableLeavePolicies.map((p) => p.id))
      const filtered = currentVal.filter((id: number) => applicableIds.has(id))
      const nextVal = filtered.length > 0 ? filtered : applicableLeavePolicies.map((p) => p.id)
      if (JSON.stringify(currentVal) !== JSON.stringify(nextVal)) {
        form.setValue("leave_policy_ids", nextVal)
      }
    }
  }, [currentStaffType, applicableLeavePolicies, leavePolicies, form])

  const availableStatuses = useMemo(() => {
    return (
      allConfigs
        ?.filter((c) => c.config_type === "EMPLOYMENT_STATUS")
        .map((c) => ({ value: c.name, label: c.name })) || []
    )
  }, [allConfigs])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("employee_details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select 
                onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                value={field.value != null ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger disabled={isDepartmentsLoading}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
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
          name="joining_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("joining_date")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("employee_status") || "Employee Status"}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger disabled={isConfigsLoading}>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
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
          name="pay_scale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay Scale</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="retirement_age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retirement Age</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={40}
                  max={75}
                  placeholder="e.g. 60"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                An alert will appear on the staff list when this staff member reaches this age. Leave blank to use the default (60 years).
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Leave Policies Checklist */}
        <FormField
          control={form.control}
          name="leave_policy_ids"
          render={({ field }) => {
            const selectedIds = field.value || []
            const allSelected = (applicableLeavePolicies?.length || 0) > 0 && selectedIds.length === applicableLeavePolicies?.length

            const handleToggleAll = () => {
              if (!applicableLeavePolicies) return
              if (allSelected) {
                field.onChange([])
              } else {
                field.onChange(applicableLeavePolicies.map((p) => p.id))
              }
            }

            const handleTogglePolicy = (policyId: number, checked: boolean) => {
              if (checked) {
                if (!selectedIds.includes(policyId)) {
                  field.onChange([...selectedIds, policyId])
                }
              } else {
                field.onChange(selectedIds.filter((id) => id !== policyId))
              }
            }

            return (
              <FormItem className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      Applicable Leave Policies
                    </span>
                    <FormDescription className="text-xs">
                      Select which leave policies apply to this staff member.
                    </FormDescription>
                  </div>
                  {applicableLeavePolicies && applicableLeavePolicies.length > 0 && formType !== "view" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleAll}
                      className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                {isPoliciesLoading ? (
                  <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/20">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                    <span className="text-xs text-muted-foreground">Loading leave policies...</span>
                  </div>
                ) : !applicableLeavePolicies || applicableLeavePolicies.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>No leave policies configured for this academic year. Leave policies can be created under Settings &gt; Leave Management.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {applicableLeavePolicies.map((policy) => {
                      const isChecked = selectedIds.includes(policy.id)
                      const checkboxId = `leave-policy-${policy.id}`
                      return (
                        <div
                          key={policy.id}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border text-left transition-all ${
                            isChecked
                              ? "border-primary/50 bg-primary/5 shadow-xs"
                              : "border-border/60 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (formType !== "view") {
                                handleTogglePolicy(policy.id, Boolean(checked))
                              }
                            }}
                            disabled={formType === "view"}
                            className="mt-0.5 shrink-0"
                          />
                          <label
                            htmlFor={checkboxId}
                            className={`flex-1 min-w-0 space-y-0.5 ${
                              formType !== "view" ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold leading-tight truncate">
                                {policy.leave_type?.leave_type_name || `Leave #${policy.leave_type_id}`}
                              </p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                                {policy.annual_quota}d/yr
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                              <span>Max: {policy.max_consecutive_days}d cons.</span>
                              <span>•</span>
                              <span>
                                CF: {policy.can_carry_forward ? `Yes (${policy.max_carry_forward_days || 0}d)` : "No"}
                              </span>
                              {policy.staff_role && (
                                <>
                                  <span>•</span>
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                                    {policy.staff_role.role}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )
          }}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          {t("previous")}
        </Button>
        <Button type="submit" disabled={isApiInProgress}>
          {isApiInProgress && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {formType === "create" ? t("Create") : "Update"}
        </Button>
      </CardFooter>
    </Card>
  )
}
