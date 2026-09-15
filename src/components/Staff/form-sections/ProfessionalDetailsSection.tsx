import React, { useEffect } from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFieldArray, type UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetStaffConfigurationsQuery } from "@/services/StaffService"
import { Plus, Trash2, FileText } from "lucide-react"

interface ProfessionalDetailsSectionProps {
  form: UseFormReturn<StaffFormData>
  onNext: () => void
  onPrevious: () => void
}

const DEFAULT_LETTER_TYPES = [
  "University Approval Letter",
  "University Appointment Letter",
  "PG Teacher Recognition Letter",
  "State Council Recognition Letter",
  "Promotion Order Letter",
  "Transfer Order Letter",
]

export const ProfessionalDetailsSection: React.FC<ProfessionalDetailsSectionProps> = ({
  form,
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation()
  const { data: allConfigs } = useGetStaffConfigurationsQuery()

  const configuredLetterTypes = allConfigs
    ?.filter((c) => c.config_type === "LETTER_TYPE")
    ?.map((c) => c.name) || []

  // Combine configured types with default fallback types
  const availableLetterTypes = Array.from(
    new Set([...configuredLetterTypes, ...DEFAULT_LETTER_TYPES])
  )

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "letters",
  })

  // If letters array is empty, populate with legacy university approval letter if available
  useEffect(() => {
    const existingLetters = form.getValues("letters")
    if (!existingLetters || existingLetters.length === 0) {
      const approvalNo = form.getValues("university_approval_letter_no")
      const approvalDate = form.getValues("university_approval_date")
      const apptNo = form.getValues("university_appointment_letter_no")
      const apptDate = form.getValues("university_appointment_date")

      const initialLetters: any[] = []
      if (approvalNo || approvalDate) {
        initialLetters.push({
          letter_type: "University Approval Letter",
          letter_no: approvalNo || "",
          letter_date: approvalDate || "",
          remarks: "",
        })
      }
      if (apptNo || apptDate) {
        initialLetters.push({
          letter_type: "University Appointment Letter",
          letter_no: apptNo || "",
          letter_date: apptDate || "",
          remarks: "",
        })
      }

      if (initialLetters.length > 0) {
        form.setValue("letters", initialLetters)
      }
    }
  }, [form])

  const handleAddLetter = (type?: string) => {
    append({
      letter_type: type || (availableLetterTypes[0] || "University Approval Letter"),
      letter_no: "",
      letter_date: "",
      remarks: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Details & Letters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {/* Basic Professional Identifiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="teacher_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Code</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Enter teacher code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state_council_reg_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State Council Reg No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Enter council reg no" />
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

        {/* NCH Registration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nch_registration_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NCH Registration No</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Enter NCH reg no" />
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
                <FormLabel>NCH Registration Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dynamic Letters & Approvals Section */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Letters & Approvals
              </h4>
              <p className="text-xs text-muted-foreground">
                Add university approval, appointment, or any custom letters configured in Settings.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddLetter()}
              className="h-8"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Letter
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="p-4 border border-dashed rounded-lg text-center bg-muted/20">
              <p className="text-sm text-muted-foreground mb-3">No letters added yet.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {availableLetterTypes.slice(0, 3).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleAddLetter(type)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add {type}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-3 border rounded-lg bg-card/60 relative space-y-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Letter #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`letters.${index}.letter_type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Letter Type</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val)
                              // If letter type matches university approval, keep legacy field synced
                              if (val.toLowerCase().includes("approval")) {
                                const currentNo = form.getValues(`letters.${index}.letter_no`)
                                const currentDate = form.getValues(`letters.${index}.letter_date`)
                                if (currentNo) form.setValue("university_approval_letter_no", currentNo)
                                if (currentDate) form.setValue("university_approval_date", currentDate)
                              }
                            }}
                            value={field.value || availableLetterTypes[0]}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select letter type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableLetterTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name={`letters.${index}.letter_no`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Letter No</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="e.g. UNI/2024/098"
                              className="h-9"
                              onChange={(e) => {
                                field.onChange(e)
                                const letterType = form.getValues(`letters.${index}.letter_type`)
                                if (letterType?.toLowerCase().includes("approval")) {
                                  form.setValue("university_approval_letter_no", e.target.value)
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`letters.${index}.letter_date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Letter Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ""}
                              className="h-9"
                              onChange={(e) => {
                                field.onChange(e)
                                const letterType = form.getValues(`letters.${index}.letter_type`)
                                if (letterType?.toLowerCase().includes("approval")) {
                                  form.setValue("university_approval_date", e.target.value)
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`letters.${index}.remarks`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Remarks / Notes (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="e.g. Approved for Associate Professor, Valid till 2028"
                            className="h-8 text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
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

