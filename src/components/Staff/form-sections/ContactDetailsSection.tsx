import type React from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormData } from "@/utils/staff.validation"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { NumberInput } from "../../ui/NumberInput"

const PREDEFINED_QUALIFICATIONS = [
  "D.Ed", "B.Ed", "M.Ed", "B.A + B.Ed", "B.Sc + B.Ed", "M.A + B.Ed", "M.Sc + B.Ed", "Ph.D",
  "Diploma", "B.Com", "BBA", "MBA", "M.Com", "ITI", "SSC", "HSC",
  "BHMS", "MD (Homoeopathy)", "PhD (Homoeopathy)"
];

const PREDEFINED_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Gujarati",
  "Social Science", "Computer Science", "Commerce", "Economics", "Physical Education",
  "Arts", "Music", "Anatomy", "Physiology", "Homoeopathic Pharmacy", "Homoeopathic Materia Medica",
  "Organon of Medicine", "Pathology", "Forensic Medicine and Toxicology", "Surgery",
  "Obstetrics and Gynaecology", "Practice of Medicine", "Community Medicine", "Repertory"
];

interface ContactDetailsSectionProps {
  form: UseFormReturn<StaffFormData>
  onNext: () => void
  onPrevious: () => void
  isTeachingRole: boolean
}

export const ContactDetailsSection: React.FC<ContactDetailsSectionProps> = ({
  form,
  onNext,
  onPrevious,
  isTeachingRole,
}) => {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("contact_details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mobile_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("mobile_no")}</FormLabel>
                <FormControl>
                  <NumberInput
                    value={field.value}
                    onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                    allowEmpty={true}
                    placeholder="Enter mobile number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {isTeachingRole && (
          <>
            <FormField
              control={form.control}
              name="qualification"
              render={({ field }) => {
                const qualValue = field.value || "";
                const isQualCustom = qualValue && !PREDEFINED_QUALIFICATIONS.includes(qualValue) && qualValue !== "Others";
                const qualSelectValue = isQualCustom ? "Others" : qualValue;

                return (
                  <FormItem>
                    <FormLabel required>{t("qualification")}</FormLabel>
                    <Select onValueChange={field.onChange} value={qualSelectValue}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Qualification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREDEFINED_QUALIFICATIONS.map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {qualSelectValue === "Others" && (
                      <FormControl>
                        <Input
                          className="mt-2"
                          placeholder="Enter qualification"
                          value={qualValue === "Others" ? "" : qualValue}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name="subject_specialization"
              render={({ field }) => {
                const subjectValue = field.value || "";
                const isSubjectCustom = subjectValue && !PREDEFINED_SUBJECTS.includes(subjectValue) && subjectValue !== "Others";
                const subjectSelectValue = isSubjectCustom ? "Others" : subjectValue;

                return (
                  <FormItem>
                    <FormLabel>{t("subject_specialization")}</FormLabel>
                    <Select onValueChange={field.onChange} value={subjectSelectValue}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREDEFINED_SUBJECTS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {subjectSelectValue === "Others" && (
                      <FormControl>
                        <Input
                          className="mt-2"
                          placeholder="Enter subject specialization"
                          value={subjectValue === "Others" ? "" : subjectValue}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </>
        )}
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
