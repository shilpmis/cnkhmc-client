"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileDown, Loader2 } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AcademicClasses, Division } from "@/types/academic"
import { useDownloadExcelTemplateMutation } from "@/services/StudentServices"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAccademicSessionsForSchool, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { studentHeaderMappings, collegeStudentHeaderMappings, formatKeyToHeader } from "@/utils/headerMappings"
import * as XLSX from 'xlsx'
import { useToast } from "@/hooks/use-toast"
import { selectCurrentSchool } from "@/redux/slices/authSlice"

interface ExcelDownloadModalProps {
  academicClasses: AcademicClasses[] | null
  selctedDivisionFromParent : Division | null
}

// Define field groups for student data based on the provided mapping
const fieldGroups = {
  personal: [
    { id: "first_name", label: "First Name", table: "students" },
    { id: "middle_name", label: "Middle Name", table: "students" },
    { id: "last_name", label: "Last Name", table: "students" },
    { id: "first_name_in_guj", label: "First Name (Gujarati)", table: "students" },
    { id: "middle_name_in_guj", label: "Middle Name (Gujarati)", table: "students" },
    { id: "last_name_in_guj", label: "Last Name (Gujarati)", table: "students" },
    { id: "gender", label: "Gender", table: "students" },
    { id: "birth_date", label: "Birth Date", table: "students" },
    { id: "birth_place", label: "Birth Place", table: "student_meta" },
    { id: "birth_place_in_guj", label: "Birth Place (Gujarati)", table: "student_meta" },
    { id: "aadhar_no", label: "Aadhar Number", table: "students" },
    { id: "aadhar_dise_no", label: "Aadhar DISE Number", table: "student_meta" },
  ],
  family: [
    { id: "father_name", label: "Father's Name", table: "students" },
    { id: "father_name_in_guj", label: "Father's Name (Gujarati)", table: "students" },
    { id: "mother_name", label: "Mother's Name", table: "students" },
    { id: "mother_name_in_guj", label: "Mother's Name (Gujarati)", table: "students" },
    { id: "primary_mobile", label: "Primary Mobile", table: "students" },
    { id: "secondary_mobile", label: "Secondary Mobile", table: "student_meta" },
  ],
  academic: [
    { id: "gr_no", label: "GR Number", table: "students" },
    { id: "roll_number", label: "Roll Number", table: "students" },
    { id: "admission_date", label: "Admission Date", table: "student_meta" },
    { id: "admission_class", label: "Admission Class", table: "student_meta" },
    { id: "class", label: "Current Class", table: "students" },
    { id: "privious_school", label: "Previous School", table: "student_meta" },
    { id: "privious_school_in_guj", label: "Previous School (Gujarati)", table: "student_meta" },
  ],
  other: [
    { id: "religion", label: "Religion", table: "student_meta" },
    { id: "religion_in_guj", label: "Religion (Gujarati)", table: "student_meta" },
    { id: "caste", label: "Caste", table: "student_meta" },
    { id: "caste_in_guj", label: "Caste (Gujarati)", table: "student_meta" },
    { id: "category", label: "Category", table: "student_meta" },
  ],
  address: [
    { id: "address", label: "Address", table: "student_meta" },
    { id: "district", label: "District", table: "student_meta" },
    { id: "city", label: "City", table: "student_meta" },
    { id: "state", label: "State", table: "student_meta" },
    { id: "postal_code", label: "Postal Code", table: "student_meta" },
  ],
  bank: [
    { id: "bank_name", label: "Bank Name", table: "student_meta" },
    { id: "account_no", label: "Account Number", table: "student_meta" },
    { id: "IFSC_code", label: "IFSC Code", table: "student_meta" },
  ],
}

const collegeFieldGroups = {
  personal: [
    { id: "admission_number", label: "Admission ID", table: "students" },
    { id: "gr_no", label: "GR Number", table: "students" },
    { id: "first_name", label: "First Name", table: "students" },
    { id: "middle_name", label: "Middle Name", table: "students" },
    { id: "last_name", label: "Last Name", table: "students" },
    { id: "gender", label: "Gender", table: "students" },
    { id: "birth_date", label: "Date of Birth", table: "students" },
    { id: "first_name_in_guj", label: "First Name (Guj)", table: "students" },
    { id: "middle_name_in_guj", label: "Middle Name (Guj)", table: "students" },
    { id: "last_name_in_guj", label: "Last Name (Guj)", table: "students" },
    { id: "nationality", label: "Nationality", table: "student_meta" },
    { id: "country_code", label: "Country Code", table: "student_meta" },
    { id: "is_active", label: "Is Active", table: "students" },
  ],
  academic: [
    { id: "enrollment_code", label: "Student Code", table: "students" },
    { id: "admission_date", label: "Admission Date", table: "student_meta" },
    { id: "admission_standard", label: "Admission Standard", table: "student_meta" },
    { id: "roll_number", label: "Roll Number", table: "students" },
    { id: "subject_group", label: "Subject Group", table: "student_meta" },
    { id: "admission_year", label: "Admission Year", table: "student_meta" },
    { id: "ayush_id", label: "Ayush ID", table: "student_meta" },
    { id: "abc_id", label: "ABC ID", table: "student_meta" },
  ],
  contact: [
    { id: "primary_mobile", label: "Mobile No 1", table: "students" },
    { id: "secondary_mobile", label: "Mobile No 2", table: "student_meta" },
    { id: "email_id", label: "Email ID", table: "student_meta" },
    { id: "website", label: "Website", table: "student_meta" },
    { id: "mother_tongue", label: "Mother Tongue", table: "student_meta" },
  ],
  address: [
    { id: "address", label: "Current Address", table: "student_meta" },
    { id: "current_area", label: "Current Area", table: "student_meta" },
    { id: "city", label: "Current City", table: "student_meta" },
    { id: "state", label: "Current State", table: "student_meta" },
    { id: "postal_code", label: "Current PIN Code", table: "student_meta" },
    { id: "current_country", label: "Current Country", table: "student_meta" },
    { id: "permanent_address", label: "Permanent Address", table: "student_meta" },
    { id: "permanent_area", label: "Permanent Area", table: "student_meta" },
    { id: "permanent_city", label: "Permanent City", table: "student_meta" },
    { id: "permanent_state", label: "Permanent State", table: "student_meta" },
    { id: "permanent_pincode", label: "Permanent PIN Code", table: "student_meta" },
    { id: "permanent_country", label: "Permanent Country", table: "student_meta" },
  ],
  family: [
    { id: "father_name", label: "Father Name", table: "students" },
    { id: "father_name_in_guj", label: "Father Name (Guj)", table: "students" },
    { id: "father_qualification", label: "Father Qualification", table: "student_meta" },
    { id: "father_occupation", label: "Father Occupation", table: "student_meta" },
    { id: "mother_name", label: "Mother Name", table: "students" },
    { id: "mother_name_in_guj", label: "Mother Name (Guj)", table: "students" },
    { id: "mother_qualification", label: "Mother Qualification", table: "student_meta" },
    { id: "guardian_name", label: "Guardian Name", table: "student_meta" },
    { id: "guardian_name_in_guj", label: "Guardian Name (Guj)", table: "student_meta" },
    { id: "relation_with_local_guardian", label: "Relation with Guardian", table: "student_meta" },
  ],
  qualification: [
    { id: "ssc_passing_year", label: "SSC Passing Year", table: "student_meta" },
    { id: "hsc_passing_year", label: "HSC Passing Year", table: "student_meta" },
    { id: "hsc_attempts", label: "HSC Attempts", table: "student_meta" },
    { id: "hsc_obtained_marks", label: "HSC Obtained Marks", table: "student_meta" },
    { id: "hsc_pcb_marks_with_practical", label: "HSC PCB Marks", table: "student_meta" },
  ],
  college_entrance: [
    { id: "entrance_exam_name", label: "Entrance Exam Name", table: "student_meta" },
    { id: "neet_score", label: "NEET Score", table: "student_meta" },
    { id: "neet_roll_no", label: "NEET Roll No", table: "student_meta" },
    { id: "neet_application_number", label: "NEET App No", table: "student_meta" },
    { id: "neet_all_india_rank", label: "NEET Rank", table: "student_meta" },
    { id: "neet_percentile", label: "NEET Percentile", table: "student_meta" },
    { id: "general_merit", label: "General Merit", table: "student_meta" },
    { id: "category_merit", label: "Category Merit", table: "student_meta" },
  ],
  other: [
    { id: "religion", label: "Religion", table: "student_meta" },
    { id: "caste", label: "Caste", table: "student_meta" },
    { id: "sub_caste", label: "Sub Caste", table: "student_meta" },
    { id: "category", label: "Category", table: "student_meta" },
    { id: "blood_group", label: "Blood Group", table: "student_meta" },
    { id: "birth_place", label: "Birth Place", table: "student_meta" },
    { id: "birth_taluka", label: "Birth Taluka", table: "student_meta" },
    { id: "birth_district", label: "Birth District", table: "student_meta" },
  ],
  bank: [
    { id: "bank_name", label: "Bank Name", table: "student_meta" },
    { id: "bank_branch_name", label: "Bank Branch", table: "student_meta" },
    { id: "account_no", label: "Account No", table: "student_meta" },
    { id: "IFSC_code", label: "IFSC Code", table: "student_meta" },
  ],
  internship: [
    { id: "internship_provisional_number", label: "Internship Prov No", table: "student_meta" },
    { id: "internship_provisional_date", label: "Internship Prov Date", table: "student_meta" },
    { id: "internship_starting_date", label: "Internship Start Date", table: "student_meta" },
    { id: "internship_completion_date", label: "Internship Comp Date", table: "student_meta" },
  ],
  administrative: [
    { id: "admission_cancel", label: "Admission Cancel", table: "student_meta" },
    { id: "admission_cancel_date", label: "Cancel Date", table: "student_meta" },
    { id: "admission_transfer", label: "Admission Transfer", table: "student_meta" },
    { id: "admission_transfer_date", label: "Transfer Date", table: "student_meta" },
    { id: "school_udise_no", label: "School UDISE No", table: "student_meta" },
  ]
}

export default function ExcelDownloadModalForStudents({ academicClasses , selctedDivisionFromParent  }: ExcelDownloadModalProps) {
  const { toast } = useToast()
  const currentSchool = useAppSelector(selectCurrentSchool)
  const isCollege = currentSchool?.school_type === 'COLLEGE'
  const activeFieldGroups = isCollege ? collegeFieldGroups : fieldGroups
  const currentHeaderMapping = isCollege ? collegeStudentHeaderMappings : studentHeaderMappings

  const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const {t} = useTranslation()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [exportAllDivisions, setExportAllDivisions] = useState(false)
  const [selectedAcademicSession, setSelectedAcademicSession] = useState<string>(
    CurrentAcademicSessionForSchool ? CurrentAcademicSessionForSchool.id.toString() : ""
  )

  const [getExcelForClass, { isLoading: isDownloadingExcle, isError }] = useDownloadExcelTemplateMutation()

  useEffect(() => {
    const initialSelectedFields: Record<string, boolean> = {}
    Object.entries(activeFieldGroups).forEach(([_, fields]) => {
      fields.forEach((field) => {
        initialSelectedFields[field.id] = true
      })
    })
    setSelectedFields(initialSelectedFields)
  }, [isCollege])

  const availableDivisions =
    academicClasses && selectedClass ? academicClasses.find((cls) => cls.id.toString() === selectedClass) : null

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSelectedDivision(null)
  }

  const handleDivisionChange = (value: string) => {
    if (!academicClasses) return

    const selectedDiv = academicClasses
      .find((cls) => cls.id.toString() === selectedClass)
      ?.divisions.find((div) => div.id.toString() === value)

    if (selectedDiv) {
      setSelectedDivision(selectedDiv)
    }
  }

  const handleAcademicSessionChange = (value: string) => {
    setSelectedAcademicSession(value)
  }

  const handleSelectAllFieldsInGroup = (groupName: string, checked: boolean) => {
    const newSelectedFields = { ...selectedFields }
    activeFieldGroups[groupName as keyof typeof activeFieldGroups].forEach((field) => {
      newSelectedFields[field.id] = checked
    })
    setSelectedFields(newSelectedFields)
  }

  const handleFieldSelect = (fieldId: string, checked: boolean) => {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldId]: checked,
    }))
  }

  // Add helper function to transform Excel headers client-side
  const transformExcelHeaders = (excelBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Transform the headers
          const transformedData = jsonData.map((record: any) => {
            const transformedRecord: Record<string, any> = {};
            
            Object.entries(record).forEach(([key, value]) => {
              // Get friendly header from mapping or format the key
              const friendlyHeader = currentHeaderMapping[key] || formatKeyToHeader(key);
              transformedRecord[friendlyHeader] = value;
            });
            
            return transformedRecord;
          });
          
          // Create new worksheet with transformed data
          const newWorksheet = XLSX.utils.json_to_sheet(transformedData);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Students");
          
          // Generate Excel file
          const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
          const transformedBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          resolve(transformedBlob);
        } catch (error) {
          console.error("Error transforming Excel headers:", error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read Excel file"));
      reader.readAsArrayBuffer(excelBlob);
    });
  };

  const downloadExcel = async () => {
    setIsDownloading(true)
    const fieldsToInclude: Record<string, string[]> = {}

    // Collect fields but don't create header mappings for the API
    Object.entries(selectedFields)
      .filter(([_, isSelected]) => isSelected)
      .forEach(([fieldId]) => {
        const field = Object.values(activeFieldGroups).flat().find(f => f.id === fieldId)
        if (field) {
          if (!fieldsToInclude[field.table]) {
            fieldsToInclude[field.table] = []
          }
          fieldsToInclude[field.table].push(fieldId)
        }
      })

    if (Object.keys(fieldsToInclude).length === 0) {
      toast({ variant: "destructive", title: "No fields selected", description: "Please select at least one field to include" })
      setIsDownloading(false)
      return
    }

    try {
      // Call API without header mappings
      const response = await getExcelForClass({
        class_id: selectedDivision!.id,
        academic_session: Number(selectedAcademicSession),
        payload: {
          student_meta: fieldsToInclude.student_meta || [],
          students: fieldsToInclude.students || [],
          export_all_divisions: exportAllDivisions
        }
      }).unwrap()

      // Transform Excel headers client-side before download
      const transformedExcel = await transformExcelHeaders(response);
      
      // Generate filename
      const className = academicClasses!.find((cls) => cls.id.toString() === selectedClass)?.class || ""
      const fileName = exportAllDivisions
        ? `Students_${className}_All_Divisions_${new Date().toISOString().split("T")[0]}.xlsx`
        : `Students_${className}_${selectedDivision?.division || ""}_${new Date().toISOString().split("T")[0]}.xlsx`

      // Download the transformed Excel
      const url = URL.createObjectURL(transformedExcel)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      URL.revokeObjectURL(url)
      document.body.removeChild(link)
      setIsOpen(false)
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast({ variant: "destructive", title: "Download Failed", description: "Failed to download Excel file. Please try again." })
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setSelectedClass(null)
      setSelectedDivision(null)
      setExportAllDivisions(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (academicClasses && selctedDivisionFromParent) {
      setSelectedClass(selctedDivisionFromParent.class_id.toString())
      setSelectedDivision(selctedDivisionFromParent)
    }
  } , [])


  const selectedFieldCount = Object.values(selectedFields).filter(Boolean).length

  return (
    <div>
      <Card className="border shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">{t("select_academic_year,_class,_and_division")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic-session">{t("select_academic_year")}</Label>
              <Select value={selectedAcademicSession} onValueChange={handleAcademicSessionChange}>
                <SelectTrigger id="academic-session">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {AcademicSessionsForSchool?.map((as) => (
                    <SelectItem key={as.id} value={as.id.toString()}>
                      {as.session_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">{t("select_class")}</Label>
              <Select value={selectedClass ?? undefined} onValueChange={handleClassChange}>
                <SelectTrigger id="class">
                  <SelectValue placeholder={t("select_class")} />
                </SelectTrigger>
                <SelectContent>
                  {academicClasses?.map((cls) =>
                    cls.divisions.length > 0 ? (
                      <SelectItem key={cls.class} value={cls.id.toString()}>
                        {cls.class}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="division">{t("select_division")}</Label>
              <Select
                value={selectedDivision ? selectedDivision.id.toString() : ""}
                onValueChange={handleDivisionChange}
                disabled={!selectedClass || exportAllDivisions}
              >
                <SelectTrigger id="division">
                  <SelectValue placeholder={t("select_division")} />
                </SelectTrigger>
                <SelectContent>
                  {availableDivisions?.divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id.toString()}>
                      {division.division} {division.aliases ? `- ${division.aliases}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="export-all-divisions"
                checked={exportAllDivisions}
                onCheckedChange={(checked) => {
                  const isChecked = !!checked
                  setExportAllDivisions(isChecked)
                  if (isChecked && !selectedDivision && selectedClass && academicClasses) {
                    const cls = academicClasses.find((c) => c.id.toString() === selectedClass)
                    if (cls && cls.divisions.length > 0) {
                      setSelectedDivision(cls.divisions[0])
                    }
                  }
                }}
                disabled={!selectedClass}
              />
              <Label htmlFor="export-all-divisions" className="text-sm font-medium">
                {t("download_all_divisions_of_class", "Download all divisions of class")}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="border shadow-sm mt-4">
            <CardHeader className="py-3">
              <CardTitle className="text-base">{t("select_fields")} ({selectedFieldCount} {t("fields_selected")})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  {Object.entries(activeFieldGroups).map(([groupName, fields]) => (
                    <div key={groupName} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${groupName}`}
                            checked={fields.every((field) => selectedFields[field.id])}
                            onCheckedChange={(checked) => handleSelectAllFieldsInGroup(groupName, !!checked)}
                          />
                          <Label htmlFor={`group-${groupName}`} className="font-medium capitalize">
                            {groupName.replace('_', ' ')}
                          </Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {fields.map((field) => (
                          <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`field-${field.id}`}
                              checked={selectedFields[field.id] || false}
                              onCheckedChange={(checked) => handleFieldSelect(field.id, !!checked)}
                            />
                            <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
                          </div>
                        ))}
                      </div>

                      {groupName !== Object.keys(activeFieldGroups)[Object.keys(activeFieldGroups).length - 1] && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      <Button
        onClick={downloadExcel}
        disabled={isDownloading || selectedFieldCount === 0 || !selectedClass || !selectedDivision || !selectedAcademicSession}
        className="w-full mt-4"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-4 w-4" />
            {t("download_excel")}
          </>
        )}
      </Button>
    </div>
  )
}
