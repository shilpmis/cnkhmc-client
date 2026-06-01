import type React from "react"
import { useEffect } from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import type { StaffRole } from "@/types/staff"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetStaffConfigurationsQuery } from "@/services/StaffService"

interface RoleSelectionSectionProps {
  form: UseFormReturn<StaffFormData>
  teachingRoles: StaffRole[] | null
  nonTeachingRoles: StaffRole[] | null
  onNext: () => void
  isEdit?: boolean
}

export const RoleSelectionSection: React.FC<RoleSelectionSectionProps> = ({
  form,
  teachingRoles,
  nonTeachingRoles,
  onNext,
  isEdit = false,
}) => {
  const { t } = useTranslation()
  const { data: allConfigs, isLoading: isLoadingConfigs } = useGetStaffConfigurationsQuery()

  // Filter configurations
  const staffTypes = allConfigs?.filter((c) => c.config_type === "STAFF_TYPE") || []
  const staffCategories = allConfigs?.filter((c) => c.config_type === "STAFF_CATEGORY") || []
  const designations = allConfigs?.filter((c) => c.config_type === "DESIGNATION") || []

  // Get current form values
  const currentStaffType = form.watch("staff_type")
  const currentStaffCategory = form.watch("staff_category")
  const currentDesignation = form.watch("designation")
  const isTeachingRole = form.watch("is_teaching_role")

  // Find IDs for cascading
  const selectedTypeObj = staffTypes.find((t) => t.name === currentStaffType)
  const selectedTypeId = selectedTypeObj ? selectedTypeObj.id : null

  const filteredCategories = selectedTypeId
    ? staffCategories.filter((c) => c.parent_id === selectedTypeId)
    : []

  const selectedCategoryObj = filteredCategories.find((c) => c.name === currentStaffCategory)
  const selectedCategoryId = selectedCategoryObj ? selectedCategoryObj.id : null

  const filteredDesignations = selectedCategoryId
    ? designations.filter((d) => d.parent_id === selectedCategoryId)
    : []

  // Auto-set is_teaching_role and try to map legacy role on staff type changes
  useEffect(() => {
    if (currentStaffType && !isEdit) {
      const isTeaching = currentStaffType.toLowerCase().includes("teaching") && !currentStaffType.toLowerCase().includes("non-teaching")
      form.setValue("is_teaching_role", isTeaching)
    }
  }, [currentStaffType, isEdit, form])

  // Try to match legacy role automatically if designation matches a role name
  useEffect(() => {
    if (currentDesignation && !isEdit) {
      const rolesList = isTeachingRole ? teachingRoles : nonTeachingRoles
      if (rolesList) {
        const match = rolesList.find(r => r.role.toLowerCase() === currentDesignation.toLowerCase())
        if (match) {
          form.setValue("staff_role_id", match.id)
        }
      }
    }
  }, [currentDesignation, isTeachingRole, teachingRoles, nonTeachingRoles, isEdit, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("role_selection")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingConfigs ? (
          <div className="text-sm text-gray-500 py-2">Loading configurations...</div>
        ) : (
          <>
            {/* Staff Type */}
            <FormField
              control={form.control}
              name="staff_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("staff_type") || "Staff Type"}</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue("staff_category", null)
                      form.setValue("designation", null)
                    }}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Staff Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Staff Category */}
            <FormField
              control={form.control}
              name="staff_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("staff_category") || "Staff Category"}</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue("designation", null)
                    }}
                    value={field.value || undefined}
                    disabled={!currentStaffType}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={currentStaffType ? "Select Staff Category" : "Select Staff Type first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Designation */}
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("designation") || "Designation"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={!currentStaffCategory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={currentStaffCategory ? "Select Designation" : "Select Staff Category first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredDesignations.map((des) => (
                        <SelectItem key={des.id} value={des.name}>
                          {des.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Legacy Role / Permission Select (hidden or read-only during edit) */}
        {!isEdit && (
          <FormField
            control={form.control}
            name="staff_role_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("system_permission_role") || "System Permission Role"}</FormLabel>
                {teachingRoles && nonTeachingRoles ? (
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select System Role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isTeachingRole
                        ? teachingRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.role}
                            </SelectItem>
                          ))
                        : nonTeachingRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.role}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-gray-500">Loading roles...</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Determines the staff member's portal access and permissions.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={onNext} disabled={!currentStaffType || !currentStaffCategory || !currentDesignation || (!isEdit && !form.watch("staff_role_id"))}>
          {t("next")}
        </Button>
      </CardFooter>
    </Card>
  )
}
