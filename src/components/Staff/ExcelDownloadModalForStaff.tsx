"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileDown, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useDownloadExcelTemplateMutation } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { staffHeaderMappings, formatKeyToHeader } from "@/utils/headerMappings"
import * as XLSX from "xlsx"

interface ExcelDownloadModalProps {
  onClose?: () => void; // Add onClose prop to communicate with parent
}

const fieldGroups = {
  role: [
    { id: "staff_role", label: "Staff Role" },
    { id: "employee_code", label: "Employee Code" },
    { id: "joining_date", label: "Joining Date" },
    { id: "employment_status", label: "Employment Status" },
    { id: "staff_type", label: "Staff Type" },
    { id: "staff_category", label: "Staff Category" },
    { id: "designation", label: "Designation" },
  ],
  personal: [
    { id: "first_name", label: "First Name" },
    { id: "middle_name", label: "Middle Name" },
    { id: "last_name", label: "Last Name" },
    { id: "gender", label: "Gender" },
    { id: "birth_date", label: "Birth Date" },
    { id: "mobile_number", label: "Mobile Number" },
    { id: "email", label: "Email" },
    { id: "aadhar_no", label: "Aadhar Number" },
    { id: "marital_status", label: "Marital Status" },
    { id: "pan_card_no", label: "PAN Card No" },
  ],
  academic: [
    { id: "qualification", label: "Qualification" },
    { id: "subject_specialization", label: "Subject Specialization" },
    { id: "ug_degree", label: "UG Degree" },
    { id: "ug_passing_university", label: "UG University" },
    { id: "ug_passing_year", label: "UG Passing Year" },
    { id: "pg_degree", label: "PG Degree" },
    { id: "pg_passing_university", label: "PG University" },
    { id: "pg_passing_year", label: "PG Passing Year" },
  ],
  professional: [
    { id: "teacher_code", label: "AYUSH Teacher Code" },
    { id: "state_council_reg_no", label: "State Council Reg No" },
    { id: "ayush_registration_no", label: "AYUSH Reg No" },
    { id: "nch_registration_no", label: "NCH Reg No" },
    { id: "total_experience", label: "Total Experience" },
  ],
  address: [
    { id: "address", label: "Address" },
    { id: "city", label: "City" },
    { id: "state", label: "State" },
    { id: "postal_code", label: "Postal Code" },
  ],
  bank: [
    { id: "bank_name", label: "Bank Name" },
    { id: "account_no", label: "Account Number" },
    { id: "IFSC_code", label: "IFSC Code" },
  ],
}

export default function ExcelDownloadModalForStaff({ onClose }: ExcelDownloadModalProps = {}) {
  const { toast } = useToast()
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const [staffType, setStaffType] = useState<"teaching" | "non-teaching" | "hospital">("teaching")

  const { t } = useTranslation()
  const authState = useAppSelector(selectAuthState)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [getExcelForStaff, { isLoading: isDownloadingExcel }] = useDownloadExcelTemplateMutation()

  useEffect(() => {
    const initialSelectedFields: Record<string, boolean> = {}
    Object.entries(fieldGroups).forEach(([_, fields]) => {
      fields.forEach((field) => {
        initialSelectedFields[field.id] = true
      })
    })
    setSelectedFields(initialSelectedFields)
  }, [])

  const handleSelectAllFieldsInGroup = (groupName: string, checked: boolean) => {
    const newSelectedFields = { ...selectedFields }
    fieldGroups[groupName as keyof typeof fieldGroups].forEach((field) => {
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

  const handleSelectAll = (checked: boolean) => {
    const newSelectedFields: Record<string, boolean> = {}
    Object.entries(fieldGroups).forEach(([_, fields]) => {
      fields.forEach((field) => {
        newSelectedFields[field.id] = checked
      })
    })
    setSelectedFields(newSelectedFields)
  }

  const isGroupFullySelected = (groupName: string) => {
    return fieldGroups[groupName as keyof typeof fieldGroups].every((field) => selectedFields[field.id])
  }

  const isGroupPartiallySelected = (groupName: string) => {
    const groupFields = fieldGroups[groupName as keyof typeof fieldGroups]
    const selectedCount = groupFields.filter((field) => selectedFields[field.id]).length
    return selectedCount > 0 && selectedCount < groupFields.length
  }

  const isAllSelected = () => {
    return Object.values(fieldGroups)
      .flat()
      .every((field) => selectedFields[field.id])
  }

  // Transform Excel file headers on the client side using headerMappings
  const transformExcelHeaders = async (excelBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          if (sheetData.length === 0) {
            resolve(excelBlob);
            return;
          }

          const originalHeaders = sheetData[0] as string[];
          const transformedHeaders = originalHeaders.map((header) => {
            return staffHeaderMappings[header] || formatKeyToHeader(header);
          });

          sheetData[0] = transformedHeaders;

          const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, firstSheetName);

          const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
          const newBlob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          resolve(newBlob);
        } catch (error) {
          console.error('Error transforming Excel headers:', error);
          resolve(excelBlob);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read Excel file"));
      reader.readAsArrayBuffer(excelBlob);
    });
  };

  const downloadExcel = async () => {
    setIsDownloading(true)
    const fieldsToInclude = Object.entries(selectedFields)
      .filter(([_, isSelected]) => isSelected)
      .map(([fieldId]) => fieldId)

    if (fieldsToInclude.length === 0) {
      toast({ variant: "destructive", title: "No fields selected", description: "Please select at least one field to include" })
      setIsDownloading(false)
      return
    }

    try {
      const response = await getExcelForStaff({
        school_id : authState.user!.school_id,
        academic_session : CurrentAcademicSessionForSchool!.id,
        fields: fieldsToInclude,
        type: staffType,
      }).unwrap()

      if (response.error) {
        throw new Error("Failed to download Excel file")
      }

      // Transform Excel headers client-side before download
      const transformedExcel = await transformExcelHeaders(response);

      const fileName = `${staffType === "teaching" ? "Teaching_Staff" : staffType === "hospital" ? "Hospital_Staff" : "Non_Teaching_Staff"}_${new Date().toISOString().split("T")[0]}.xlsx`

      const url = URL.createObjectURL(transformedExcel)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      // Close the modal using the parent's handler after successful download
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast({ variant: "destructive", title: "Download Failed", description: "Failed to download Excel file. Please try again." })
    } finally {
      setIsDownloading(false)
    }
  }

  const selectedFieldCount = Object.values(selectedFields).filter(Boolean).length

  return (
    <div>
      <Card className="border shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">{t("select_staff_type")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teaching"
                checked={staffType === "teaching"}
                onCheckedChange={() => setStaffType("teaching")}
              />
              <Label htmlFor="teaching">{t("teaching_staff")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="non-teaching"
                checked={staffType === "non-teaching"}
                onCheckedChange={() => setStaffType("non-teaching")}
              />
              <Label htmlFor="non-teaching">{t("non_teaching_staff")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hospital"
                checked={staffType === "hospital"}
                onCheckedChange={() => setStaffType("hospital")}
              />
              <Label htmlFor="hospital">{t("hospital_staff") || "Hospital Staff"}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-base">{t("select_fields")} ({selectedFieldCount} fields selected)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              {Object.entries(fieldGroups).map(([groupName, fields]) => (
                <div key={groupName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${groupName}`}
                        checked={fields.every((field) => selectedFields[field.id])}
                        onCheckedChange={(checked) => handleSelectAllFieldsInGroup(groupName, !!checked)}
                      />
                      <Label htmlFor={`group-${groupName}`} className="font-medium capitalize">
                        {groupName}
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

                  {groupName !== Object.keys(fieldGroups)[Object.keys(fieldGroups).length - 1] && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Button
        onClick={downloadExcel}
        disabled={isDownloading || selectedFieldCount === 0}
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