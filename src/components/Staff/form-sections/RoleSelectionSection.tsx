import type React from "react"
import { useEffect, useMemo } from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import type { StaffRole } from "@/types/staff"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetStaffConfigurationsQuery } from "@/services/StaffService"

const PRIMARY_STAFF_TYPES = [
  "Teaching Staff",
  "Non-Teaching Staff",
  "Hospital Staff",
]

const DEFAULT_CATEGORIES: Record<string, string[]> = {
  "Teaching Staff": [
    "Full Time",
    "Regular",
    "Contractual",
    "Visiting / Guest",
    "Practicing Consultants",
    "Other",
  ],
  "Non-Teaching Staff": [
    "Regular",
    "Full Time",
    "Contractual",
    "Part Time",
    "Daily Wages",
    "Other",
  ],
  "Hospital Staff": [
    "Regular",
    "Full Time",
    "Contractual",
    "On Call",
    "Visiting",
    "Practicing Consultants",
    "Other",
  ],
}

const DEFAULT_DESIGNATIONS: Record<string, string[]> = {
  "Teaching Staff": [
    "Principal / Director",
    "Professor",
    "Associate Professor / Reader",
    "Assistant Professor / Lecturer",
    "Tutor / Demonstrator",
    "Consultant",
    "Guest Faculty",
    "Visiting Professor",
  ],
  "Non-Teaching Staff": [
    "Administrative Officer",
    "Accountant",
    "Head Clerk",
    "Senior Clerk",
    "Junior Clerk",
    "Office Assistant",
    "Librarian",
    "Assistant Librarian",
    "Library Attendant",
    "Laboratory Assistant",
    "Laboratory Attendant",
    "Store Keeper",
    "Driver",
    "Peon",
    "Security Guard",
    "Sweeper",
  ],
  "Hospital Staff": [
    "Medical Superintendent",
    "Deputy Medical Superintendent",
    "Resident Medical Officer (RMO)",
    "Senior Medical Officer (SMO)",
    "Medical Officer (MO)",
    "Matron / Nursing Superintendent",
    "Staff Nurse",
    "Pharmacist",
    "Lab Technician",
    "X-Ray Technician",
    "Physiotherapist",
    "Dresser",
    "Ward Boy / Aya",
    "Hospital Attendant",
    "Ambulance Driver",
    "Cook / Mess Worker",
    "Sanitary Worker",
  ],
}

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

  // Get current form values
  const currentStaffType = form.watch("staff_type")
  const currentStaffCategory = form.watch("staff_category")
  const currentDesignation = form.watch("designation")
  const isTeachingRole = form.watch("is_teaching_role")

  // Combine standard staff types with any custom types from DB
  const availableStaffTypes = useMemo(() => {
    const customTypes = allConfigs
      ?.filter((c) => c.config_type === "STAFF_TYPE" && !PRIMARY_STAFF_TYPES.includes(c.name))
      .map((c) => c.name) || []
    return [...PRIMARY_STAFF_TYPES, ...customTypes]
  }, [allConfigs])

  // Get categories based on selected staff type
  const availableCategories = useMemo(() => {
    if (!currentStaffType) return []

    // 1. Check parent-linked categories in DB
    const selectedTypeObj = allConfigs?.find((t) => t.config_type === "STAFF_TYPE" && t.name === currentStaffType)
    const linkedCategories = selectedTypeObj
      ? allConfigs?.filter((c) => c.config_type === "STAFF_CATEGORY" && c.parent_id === selectedTypeObj.id).map(c => c.name) || []
      : []

    // 2. Default presets
    const defaultCats = DEFAULT_CATEGORIES[currentStaffType] || ["Regular", "Full Time", "Contractual", "Other"]

    // 3. Any additional DB categories
    const allDbCats = allConfigs?.filter((c) => c.config_type === "STAFF_CATEGORY").map((c) => c.name) || []

    const merged = Array.from(new Set([...linkedCategories, ...defaultCats, ...allDbCats]))
    return merged
  }, [currentStaffType, allConfigs])

  // Get designations based on selected staff type and category
  const availableDesignations = useMemo(() => {
    if (!currentStaffType) return []

    // 1. Check parent-linked designations in DB
    const selectedCategoryObj = allConfigs?.find((c) => c.config_type === "STAFF_CATEGORY" && c.name === currentStaffCategory)
    const linkedDesignations = selectedCategoryObj
      ? allConfigs?.filter((d) => d.config_type === "DESIGNATION" && d.parent_id === selectedCategoryObj.id).map(d => d.name) || []
      : []

    // 2. Default presets for the staff type
    const defaultDes = DEFAULT_DESIGNATIONS[currentStaffType] || []

    // 3. All DB designations
    const allDbDes = allConfigs?.filter((c) => c.config_type === "DESIGNATION").map((c) => c.name) || []

    const merged = Array.from(new Set([...linkedDesignations, ...defaultDes, ...allDbDes]))
    return merged
  }, [currentStaffType, currentStaffCategory, allConfigs])

  // Auto-set is_teaching_role based on staff type
  useEffect(() => {
    if (currentStaffType) {
      const isTeaching = currentStaffType.toLowerCase().includes("teaching") && !currentStaffType.toLowerCase().includes("non-teaching")
      if (form.getValues("is_teaching_role") !== isTeaching) {
        form.setValue("is_teaching_role", isTeaching)
      }
    }
  }, [currentStaffType, form])

  // Auto-match system role if designation matches a role name or set default
  useEffect(() => {
    if (!isEdit) {
      const rolesList = isTeachingRole ? teachingRoles : nonTeachingRoles
      if (rolesList && rolesList.length > 0) {
        let targetRoleId = rolesList[0].id
        if (currentDesignation) {
          const match = rolesList.find(
            (r) =>
              r.role.toLowerCase() === currentDesignation.toLowerCase() ||
              currentDesignation.toLowerCase().includes(r.role.toLowerCase()) ||
              r.role.toLowerCase().includes(currentDesignation.toLowerCase())
          )
          if (match) {
            targetRoleId = match.id
          }
        } else if (currentStaffType === "Hospital Staff") {
          const hospRole = rolesList.find((r) => r.role.toLowerCase().includes("hospital")) || rolesList[0]
          targetRoleId = hospRole.id
        }

        if (form.getValues("staff_role_id") !== targetRoleId) {
          form.setValue("staff_role_id", targetRoleId)
        }
      }
    }
  }, [currentStaffType, currentDesignation, isTeachingRole, teachingRoles, nonTeachingRoles, isEdit, form])

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
                        <SelectValue placeholder="Select Staff Type (e.g. Teaching, Non-Teaching, Hospital)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStaffTypes.map((typeName) => (
                        <SelectItem key={typeName} value={typeName}>
                          {typeName}
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
                  <FormLabel required>{t("staff_category") || "Staff Category / Appointment Type"}</FormLabel>
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
                        <SelectValue placeholder={currentStaffType ? "Select Category (e.g. Regular, Full Time, Contractual)" : "Select Staff Type first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories.map((catName) => (
                        <SelectItem key={catName} value={catName}>
                          {catName}
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
                      {availableDesignations.map((desName) => (
                        <SelectItem key={desName} value={desName}>
                          {desName}
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
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          onClick={onNext}
          disabled={!currentStaffType || !currentStaffCategory || !currentDesignation}
        >
          {t("next")}
        </Button>
      </CardFooter>
    </Card>
  )
}

