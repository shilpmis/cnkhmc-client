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

const DEFAULT_STAFF_OPTIONS = [
  "Teaching",
  "Non Teaching",
  "Hospital",
  "Mess",
  "Hostel",
  "Other",
]

const DEFAULT_STAFF_TYPES = [
  "Full Time",
  "Guest/Visiting",
  "On Call",
  "Part Time",
  "Practising Consultant",
  "Adhoc",
  "Contractual",
]

const DEFAULT_STAFF_CATEGORIES = [
  "Medical",
  "Para-Medical",
  "Auxillary",
  "Administrative",
]

const DEFAULT_DESIGNATIONS: Record<string, string[]> = {
  "Teaching": [
    "Principal / Director",
    "Professor",
    "Associate Professor / Reader",
    "Assistant Professor / Lecturer",
    "Tutor / Demonstrator",
    "Consultant",
    "Guest Faculty",
    "Visiting Professor",
  ],
  "Non Teaching": [
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
  "Hospital": [
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
  "Mess": [
    "Mess Manager",
    "Head Cook",
    "Cook",
    "Mess Worker / Helper",
    "Store Incharge",
  ],
  "Hostel": [
    "Hostel Warden",
    "Assistant Warden",
    "Hostel Attendant",
    "Caretaker",
  ],
  "Other": [
    "Consultant",
    "Supervisor",
    "Assistant",
    "Worker",
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
  const currentStaffType = form.watch("staff_type") // First Selection: Staff (e.g. Teaching, Hospital, etc.)
  const currentEmploymentStatus = form.watch("employment_status") // Second Selection: Staff Type (e.g. Full Time, On Call, etc.)
  const currentStaffCategory = form.watch("staff_category") // Third Selection: Staff Category (Medical, Para-Medical, etc.)
  const currentDesignation = form.watch("designation")
  const isTeachingRole = form.watch("is_teaching_role")

  // Check if "Hospital" is selected as the Staff option
  const isHospitalSelected = useMemo(() => {
    return currentStaffType?.toLowerCase() === "hospital"
  }, [currentStaffType])

  // 1. First Selection Options ("Staff"): Teaching, Non Teaching, Hospital, Mess, Hostel, Other + DB configs
  const availableStaffOptions = useMemo(() => {
    const dbTypes = allConfigs
      ?.filter((c) => c.config_type === "STAFF_TYPE")
      .map((c) => c.name) || []
    return Array.from(new Set([...DEFAULT_STAFF_OPTIONS, ...dbTypes]))
  }, [allConfigs])

  // 2. Second Selection Options ("Staff Type"): Full Time, Guest/Visiting, On Call, Part Time, Practising Consultant, Adhoc, Contractual + DB configs
  const availableStaffTypes = useMemo(() => {
    const dbTypes = allConfigs
      ?.filter((c) => c.config_type === "EMPLOYMENT_STATUS")
      .map((c) => c.name) || []
    return Array.from(new Set([...DEFAULT_STAFF_TYPES, ...dbTypes]))
  }, [allConfigs])

  // 3. Third Selection Options ("Staff Category"): Medical, Para-Medical, Auxillary, Administrative + DB configs (Visible when Staff = Hospital)
  const availableStaffCategories = useMemo(() => {
    const dbCats = allConfigs
      ?.filter((c) => c.config_type === "STAFF_CATEGORY")
      .map((c) => c.name) || []
    return Array.from(new Set([...DEFAULT_STAFF_CATEGORIES, ...dbCats]))
  }, [allConfigs])

  // 4. Designations based on selected staff selection
  const availableDesignations = useMemo(() => {
    if (!currentStaffType) return []

    // DB designations linked to parent or general
    const dbDesignations = allConfigs
      ?.filter((c) => c.config_type === "DESIGNATION")
      .map((c) => c.name) || []

    const defaultDes = DEFAULT_DESIGNATIONS[currentStaffType] || DEFAULT_DESIGNATIONS["Other"] || []
    return Array.from(new Set([...defaultDes, ...dbDesignations]))
  }, [currentStaffType, allConfigs])

  // Auto-set is_teaching_role based on selected staff
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
        <CardTitle>{t("role_selection") || "Role & Classification Selection"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingConfigs ? (
          <div className="text-sm text-gray-500 py-2">Loading configurations...</div>
        ) : (
          <>
            {/* 1. First Selection: Staff */}
            <FormField
              control={form.control}
              name="staff_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Staff</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      // If selected staff is not Hospital, reset staff_category
                      if (val?.toLowerCase() !== "hospital") {
                        form.setValue("staff_category", null)
                      }
                    }}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Staff (Teaching, Non Teaching, Hospital, Mess, Hostel, Other)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStaffOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Second Selection: Staff Type */}
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Staff Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Staff Type (Full Time, Guest/Visiting, On Call, Part Time, etc.)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStaffTypes.map((typeOption) => (
                        <SelectItem key={typeOption} value={typeOption}>
                          {typeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Third Selection: Staff Category (ONLY visible when Staff = Hospital) */}
            {isHospitalSelected && (
              <FormField
                control={form.control}
                name="staff_category"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <FormLabel required>Staff Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Staff Category (Medical, Para-Medical, Auxillary, Administrative)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStaffCategories.map((catName) => (
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
            )}

            {/* 4. Designation Selection */}
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={!currentStaffType}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={currentStaffType ? "Select Designation" : "Select Staff first"} />
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
          disabled={
            !currentStaffType ||
            !currentEmploymentStatus ||
            (isHospitalSelected && !currentStaffCategory)
          }
        >
          {t("next")}
        </Button>
      </CardFooter>
    </Card>
  )
}
