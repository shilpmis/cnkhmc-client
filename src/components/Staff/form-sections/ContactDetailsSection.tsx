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
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("qualification")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Qualification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="D.Ed">D.Ed</SelectItem>
                      <SelectItem value="B.Ed">B.Ed</SelectItem>
                      <SelectItem value="M.Ed">M.Ed</SelectItem>
                      <SelectItem value="B.A + B.Ed">B.A + B.Ed</SelectItem>
                      <SelectItem value="B.Sc + B.Ed">B.Sc + B.Ed</SelectItem>
                      <SelectItem value="M.A + B.Ed">M.A + B.Ed</SelectItem>
                      <SelectItem value="M.Sc + B.Ed"> M.Sc + B.Ed</SelectItem>
                      <SelectItem value="Ph.D">Ph.D</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="B.Com">B.Com</SelectItem>
                      <SelectItem value="BBA">BBA</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                      <SelectItem value="M.Com">M.Com</SelectItem>
                      <SelectItem value="ITI">ITI</SelectItem>
                      <SelectItem value="SSC">SSC</SelectItem>
                      <SelectItem value="HSC">HSC</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject_specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subject_specialization")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject specialization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Gujarati">Gujarati</SelectItem>
                      <SelectItem value="Social Science">Social Science</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="Physical Education">Physical Education</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
