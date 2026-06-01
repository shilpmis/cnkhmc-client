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
import { staffHeaderMappings, formatKeyToHeader } from "@/utils/headerMappings"
import * as XLSX from 'xlsx'

interface ExcelDownloadModalProps {
  onClose?: () => void; // Add onClose prop to communicate with parent
}

const fieldGroups = {
  role: [
    // { id: "is_teaching_role", label: "Teaching Role" },
    { id: "staff_role", label: "Staff Role" },
  ],
  personal: [
    { id: "first_name", label: "First Name" },
    { id: "middle_name", label: "Middle Name" },
    { id: "last_name", label: "Last Name" },
    { id: "gender", label: "Gender" },
    { id: "birth_date", label: "Birth Date" },
    { id: "aadhar_no", label: "Aadhar Number" },
  ],
  contact: [
    { id: "mobile_number", label: "Mobile Number" },
    { id: "email", label: "Email" },
    { id: "qualification", label: "Qualification" },
  ],
  address: [
    { id: "address", label: "Address" },
    { id: "city", label: "City" },
    { id: "state", label: "State" },
    { id: "postal_code", label: "Postal Code" },
  ],
}

export default function ExcelDownloadModalForStaff({ onClose }: ExcelDownloadModalProps) {
  const [staffType, setStaffType] = useState<"teaching" | "non-teaching">("teaching")
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const {t} = useTranslation()

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
              const friendlyHeader = staffHeaderMappings[key] || formatKeyToHeader(key);
              transformedRecord[friendlyHeader] = value;
            });
            
            return transformedRecord;
          });
          
          // Create new worksheet with transformed data
          const newWorksheet = XLSX.utils.json_to_sheet(transformedData);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Staff");
          
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
    const fieldsToInclude = Object.entries(selectedFields)
      .filter(([_, isSelected]) => isSelected)
      .map(([fieldId]) => fieldId)

    if (fieldsToInclude.length === 0) {
      alert("Please select at least one field to include")
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

      const fileName = `${staffType === "teaching" ? "Teaching_Staff" : "Non_Teaching_Staff"}_${new Date().toISOString().split("T")[0]}.xlsx`

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
      alert("Failed to download Excel file. Please try again.")
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
          <div className="flex space-x-4">
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