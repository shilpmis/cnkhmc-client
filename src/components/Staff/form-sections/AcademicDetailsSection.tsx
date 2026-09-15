import type React from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { NumberInput } from "../../ui/NumberInput"

interface AcademicDetailsSectionProps {
  form: UseFormReturn<StaffFormData>
  onNext: () => void
  onPrevious: () => void
}

export const AcademicDetailsSection: React.FC<AcademicDetailsSectionProps> = ({
  form,
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
        {/* UG Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm border-b pb-2">Undergraduate (UG) Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="ug_degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UG Degree</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ug_passing_university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ug_passing_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Year</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      allowEmpty={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* PG Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm border-b pb-2">Postgraduate (PG) Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="pg_degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PG Degree</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pg_passing_university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pg_passing_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Year</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      allowEmpty={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Diploma Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm border-b pb-2">Diploma Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="diploma_degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diploma Degree</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diploma_council"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Council</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diploma_passing_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Year</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      allowEmpty={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Other Degree */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm border-b pb-2">Other Qualifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="other_degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="other_passing_university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="other_passing_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Year</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      allowEmpty={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
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
