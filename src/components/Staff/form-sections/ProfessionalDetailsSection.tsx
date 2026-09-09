import type React from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface ProfessionalDetailsSectionProps {
  form: UseFormReturn<StaffFormData>
  onNext: () => void
  onPrevious: () => void
}

export const ProfessionalDetailsSection: React.FC<ProfessionalDetailsSectionProps> = ({
  form,
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ayush_id_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AYUSH ID No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teacher_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Code</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state_council_reg_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State Council Reg No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ayush_registration_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AYUSH Registration No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="date_of_registration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Registration</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nch_registration_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NCH Registration No {form.watch("is_teaching_role") && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nch_registration_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NCH Registration Date {form.watch("is_teaching_role") && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="university_appointment_letter_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Univ. Appointment Letter No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="university_appointment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Univ. Appointment Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="university_approval_letter_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Univ. Approval Letter No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="university_approval_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Univ. Approval Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="area_of_expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area of Expertise</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          {t("previous")}
        </Button>
        <Button type="button" onClick={onNext}>
          {t("next")}
        </Button>
      </CardFooter>
    </Card>
  )
}
