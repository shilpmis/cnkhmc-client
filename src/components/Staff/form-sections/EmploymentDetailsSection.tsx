import type React from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetDepartmentsQuery } from "@/services/DepartmentService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"

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
  const { data: departments, isLoading: isDepartmentsLoading } = useGetDepartmentsQuery({ school_id: school_id! }, { skip: !school_id })

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
                value={field.value?.toString() || ""}
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
              <FormLabel required>{t("employee_status")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Permanent">{t("permanent")}</SelectItem>
                  <SelectItem value="Trial_Period">{t("trial_period")}</SelectItem>
                  <SelectItem value="Resigned">{t("resigned")}</SelectItem>
                  <SelectItem value="Contract_Based">{t("contract_base")}</SelectItem>
                  <SelectItem value="Notice_Period">{t("notice_period")}</SelectItem>
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
