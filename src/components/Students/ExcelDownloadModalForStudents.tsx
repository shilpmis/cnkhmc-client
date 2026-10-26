"use client"

import { useState, useEffect, useMemo } from "react"
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
import { uploadExportToStorage } from "@/services/StorageService"
import { studentFieldGroups } from "@/utils/studentColumns"

interface ExcelDownloadModalProps {
  academicClasses: AcademicClasses[] | null
  selctedDivisionFromParent : Division | null
}

// The heads of the final student sheet
const fieldGroups = studentFieldGroups
const collegeFieldGroups = studentFieldGroups

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

  const computedFieldGroups: Record<string, Array<{ id: string; label: string; table: string }>> = isCollege
    ? collegeFieldGroups
    : fieldGroups
  const effectiveHeaderMapping = currentHeaderMapping

  useEffect(() => {
    const initialSelectedFields: Record<string, boolean> = {}
    Object.values(computedFieldGroups).forEach((fields) => {
      fields.forEach((field) => {
        initialSelectedFields[field.id] = true
      })
    })
    setSelectedFields(initialSelectedFields)
  }, [computedFieldGroups])

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
    const group = computedFieldGroups[groupName]
    if (group) {
      group.forEach((field) => {
        newSelectedFields[field.id] = checked
      })
      setSelectedFields(newSelectedFields)
    }
  }

  const handleFieldSelect = (fieldId: string, checked: boolean) => {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldId]: checked,
    }))
  }

  // Add helper function to transform Excel headers client-side
  const transformExcelHeaders = (excelBlob: Blob): Promise<Blob> => {
    const STUDENT_DATE_FIELDS = [
      "birth_date",
      "admission_date",
      "student_lc_date",
      "internship_provisional_date",
      "internship_starting_date",
      "internship_completion_date",
      "final_bhms_passing_date",
      "admission_cancel_date",
      "admission_transfer_date",
    ];

    const STUDENT_TEXT_FIELDS = [
      "aadhar_no",
      "primary_mobile",
      "secondary_mobile",
      "aadhar_dise_no",
      "gr_no",
      "roll_number",
      "account_no",
      "IFSC_code",
      "pen",
      "abha_card_no",
      "school_udise_no",
      "father_mobile",
      "mother_mobile",
      "guardian_mobile",
      "neet_roll_no",
      "neet_application_number",
      "ayush_id",
      "abc_id",
      "admission_number",
      "enrollment_code",
      "student_code",
      "student_lc_no",
      "internship_provisional_number",
      "postal_code",
      "permanent_pincode",
    ];

    const formatExcelDate = (val: any): string => {
      if (val === null || val === undefined || val === "") return "";
      if (val instanceof Date) {
        if (isNaN(val.getTime())) return "";
        const y = val.getUTCFullYear();
        const m = String(val.getUTCMonth() + 1).padStart(2, "0");
        const d = String(val.getUTCDate()).padStart(2, "0");
        return `${d}/${m}/${y}`;
      }
      if (typeof val === "number" && val > 0) {
        // Excel serial date (e.g. 22153, 39790)
        const days = val > 60 ? val - 25569 : val - 25568;
        const date = new Date(Math.round(days * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          const y = date.getUTCFullYear();
          const m = String(date.getUTCMonth() + 1).padStart(2, "0");
          const d = String(date.getUTCDate()).padStart(2, "0");
          return `${d}/${m}/${y}`;
        }
      }
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (!trimmed) return "";
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
        const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, y, m, d] = match;
          return `${d}/${m}/${y}`;
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, "0");
          const d = String(parsed.getDate()).padStart(2, "0");
          return `${d}/${m}/${y}`;
        }
        return trimmed;
      }
      return String(val);
    };

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          if (sheetData.length === 0) {
            resolve(excelBlob);
            return;
          }

          const originalHeaders = sheetData[0] as string[];

          // Format all data rows
          for (let r = 1; r < sheetData.length; r++) {
            const row = sheetData[r];
            if (!row) continue;
            for (let c = 0; c < originalHeaders.length; c++) {
              const headerKey = originalHeaders[c];
              const cellVal = row[c];
              if (cellVal === null || cellVal === undefined || cellVal === "") {
                row[c] = "";
                continue;
              }

              if (STUDENT_DATE_FIELDS.includes(headerKey)) {
                row[c] = formatExcelDate(cellVal);
              } else if (STUDENT_TEXT_FIELDS.includes(headerKey)) {
                row[c] = String(cellVal).trim();
              }
            }
          }

          const transformedHeaders = originalHeaders.map((header) => {
            return effectiveHeaderMapping[header] || formatKeyToHeader(header);
          });

          sheetData[0] = transformedHeaders;

          const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData);

          // Force text cell type 's' on text/date columns to avoid Excel scientific notation / date auto-conversion
          for (let r = 1; r < sheetData.length; r++) {
            for (let c = 0; c < originalHeaders.length; c++) {
              const headerKey = originalHeaders[c];
              if (STUDENT_TEXT_FIELDS.includes(headerKey) || STUDENT_DATE_FIELDS.includes(headerKey)) {
                const cellRef = XLSX.utils.encode_cell({ r, c });
                if (newWorksheet[cellRef]) {
                  newWorksheet[cellRef].t = "s";
                  newWorksheet[cellRef].z = "@";
                }
              }
            }
          }

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
        const field = Object.values(computedFieldGroups).flat().find(f => f.id === fieldId)
        if (field) {
          const targetTable = field.table === 'students' ? 'students' : 'student_meta'
          if (!fieldsToInclude[targetTable]) {
            fieldsToInclude[targetTable] = []
          }
          fieldsToInclude[targetTable].push(fieldId)
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

      // Store in cloud storage (DigitalOcean Spaces)
      uploadExportToStorage(transformedExcel, 'students', fileName).catch((err) =>
        console.error("Failed to archive transformed student excel to cloud:", err)
      )

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
                  {Object.entries(computedFieldGroups).map(([groupName, fields]) => (
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

                      {groupName !== Object.keys(computedFieldGroups)[Object.keys(computedFieldGroups).length - 1] && (
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
