import type React from "react"
import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, Loader2, AlertCircle, CheckCircle2, FileText, FileDown, School } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import StudentForm from "@/components/Students/StudentForm"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import {
  selectAccademicSessionsForSchool,
  selectActiveAccademicSessionsForSchool,
  selectAuthState,
} from "@/redux/slices/authSlice"
import type { Division } from "@/types/academic"
import type { PageDetailsForStudents, Student } from "@/types/student"
import StudentTable from "@/components/Students/StudentTable"
import {
  useLazyFetchSingleStundetQuery,
  useLazyFetchStudentForClassQuery,
  useBulkUploadStudentsMutation,
} from "@/services/StudentServices"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { downloadCSVTemplate } from "@/utils/CSVTemplateForStudents"
import ExcelDownloadModalForStudents from "@/components/Students/ExcelDownloadModalForStudents"
import { z } from "zod"
import type { AcademicSession } from "@/types/user"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { StudentSchemaForUploadData, CollegeStudentSchemaForUploadData } from "@/utils/student.validation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useNavigate, useNavigation } from "react-router-dom" 
import HostelAllotmentModal from "@/components/Students/HostelAllotmentModal"
// Type for validation results
type ValidationResult = {
  row: number
  hasErrors: boolean
  errors: { field: string; message: string }[]
  rawData: any
}

// Session storage keys for this page
const SESSION_SELECTED_CLASS_KEY = "students_selected_class_id"
const SESSION_SELECTED_DIVISION_KEY = "students_selected_division_id"
const SESSION_SELECTED_PAGE_KEY = "students_selected_page"
const SESSION_SELECTED_SESSION_KEY = "students_selected_academic_session_id"

// Custom CSV parser function
const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string
        const lines = csvData.split("\n")

        // Extract headers (first line)
        const headers = lines[0].split(",").map((header) => header.trim().replace(/^"(.*)"$/, "$1")) // Remove quotes if present

        // Parse data rows
        const results = []
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue // Skip empty lines

          const values: string[] = []
          let current = ""
          let insideQuotes = false

          for (const char of lines[i]) {
            if (char === '"' && !insideQuotes) {
              insideQuotes = true // Start of quoted field
            } else if (char === '"' && insideQuotes) {
              insideQuotes = false // End of quoted field
            } else if (char === "," && !insideQuotes) {
              values.push(current.trim())
              current = "" // Reset for the next value
            } else {
              current += char // Append character to the current value
            }
          }
          values.push(current.trim()) // Add the last value

          // Create object with headers as keys
          const row: any = {}
          headers.forEach((header, index) => {
            let value: any = values[index] || null // Set null for empty fields

            // Convert specific fields to their expected types
            if (header === "Roll Number" && value !== null) {
              value = Number(value) // Convert Roll Number to a number
              if (isNaN(value)) value = null // Handle invalid numbers
            }

            row[header] = value
          })

          results.push(row)
        }

        resolve(results)
      } catch (error: any) {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    reader.readAsText(file)
  })
}

export const Students: React.FC = () => {
  const { t } = useTranslation()
  const navaigate = useNavigate()
  const authState = useAppSelector(selectAuthState)
  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const AcademicDivisions = useAppSelector(selectAllAcademicClasses)
  const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const [getStudentForClass, { data: studentDataForSelectedClass ,isLoading : isStudentsLoading }] = useLazyFetchStudentForClassQuery()
  const [getSingleStudent, { data: studentDataForEditStudent, isLoading: isStudentForEditLoading, isError }] =
    useLazyFetchSingleStundetQuery()

  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [SelectedSession, setSelectedSession] = useState<number | null>(null)
  const [searchValue, setSearchValue] = useState<string>("")

  const [listedStudentForSelectedClass, setListedStudentForSelectedClass] = useState<Student[] | null>(null)
  const [paginationDataForSelectedClass, setPaginationDataForSelectedClass] = useState<PageDetailsForStudents | null>(
    null,
  )

  const [openDialogForStudent, setOpenDialogForStudent] = useState<{
    isOpen: boolean
    type: "add" | "edit"
    selectedStudent: Student | null
  }>({ isOpen: false, type: "add", selectedStudent: null })

  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResults, setUploadResults] = useState<ValidationResult[]>([])
  const [bulkUploadStudents] = useBulkUploadStudentsMutation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [hasRestoredSession, setHasRestoredSession] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dialogOpenForBulkUpload, setDialogOpenForBulkUpload] = useState(false)
  const [dialogOpenForDownLoadExcel, setDialogOpenForDownLoadExcel] = useState(false)
  const [validationPassed, setValidationPassed] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [serverValidationErrors, setServerValidationErrors] = useState<ValidationResult[]>([])

  const [showHostelModal, setShowHostelModal] = useState(false)
  const [newStudentData, setNewStudentData] = useState<Student | null>(null)

  const isCollege = authState.user?.school?.school_type === 'COLLEGE'
  const activeUploadSchema = isCollege ? CollegeStudentSchemaForUploadData : StudentSchemaForUploadData

  const handleClassChange = useCallback((value: string) => {
    setSelectedClass(value)
    setSelectedDivision(null) // Reset division when class changes
    setCurrentPage(1)
    setSearchValue("") // Clear search when class changes
    sessionStorage.setItem(SESSION_SELECTED_CLASS_KEY, value)
    sessionStorage.setItem(SESSION_SELECTED_DIVISION_KEY, "")
    sessionStorage.setItem(SESSION_SELECTED_PAGE_KEY, "1")
  }, [])

  const handleDivisionChange = useCallback(
    async (value: string) => {
      if (AcademicClasses && SelectedSession) {
        const selectedClassObj = AcademicClasses.find((cls) => cls.id.toString() === selectedClass)

        if (selectedClassObj) {
          const selectedDiv = selectedClassObj.divisions.find((div) => div.id.toString() === value)

          if (selectedDiv) {
            setSelectedDivision(selectedDiv)
            setCurrentPage(1)
            setSearchValue("") // Clear search when division changes
            sessionStorage.setItem(SESSION_SELECTED_DIVISION_KEY, value)
            sessionStorage.setItem(SESSION_SELECTED_PAGE_KEY, "1")

            // Fetch students for the selected division and session
            await getStudentForClass({
              class_id: selectedDiv.id,
              academic_session: SelectedSession,
              page: 1,
            })
          }
        }
      }
    },
    [AcademicClasses, SelectedSession, selectedClass, getStudentForClass],
  )

  const handleAcademicSessionChange = useCallback(
    async (value: number) => {
      setSelectedSession(value)
      sessionStorage.setItem(SESSION_SELECTED_SESSION_KEY, value.toString())

      // Fetch students for the selected division and session if both are selected
      if (selectedDivision) {
        await getStudentForClass({
          class_id: selectedDivision.id,
          academic_session: value,
        })
      }
    },
    [selectedDivision, getStudentForClass],
  )

  const filteredStudents = useMemo(() => {
    if (listedStudentForSelectedClass) {
      return listedStudentForSelectedClass.filter((student) => {
        const searchLower = searchValue.toLowerCase()
        return (
          student.first_name?.toLowerCase().includes(searchLower) ||
          student.last_name?.toLowerCase().includes(searchLower) ||
          student.middle_name?.toLowerCase().includes(searchLower) ||
          student.gr_no?.toString().includes(searchLower) ||
          student.first_year_roll_number?.toString().includes(searchLower) ||
          student.second_year_roll_number?.toString().includes(searchLower) ||
          student.third_year_roll_number?.toString().includes(searchLower) ||
          student.fourth_year_roll_number?.toString().includes(searchLower) ||
          student.aadhar_no?.toString().includes(searchLower) ||
          student.father_name?.toLowerCase().includes(searchLower) ||
          student.primary_mobile?.toString().includes(searchLower)
        )
      })
    }
    return []
  }, [listedStudentForSelectedClass, searchValue])

  const availableDivisions = useMemo(() => {
    if (AcademicClasses && selectedClass) {
      const selectedClassObj = AcademicClasses.find((cls) => cls.id.toString() === selectedClass)
      return selectedClassObj ? selectedClassObj.divisions : []
    }
    return []
  }, [AcademicClasses, selectedClass])

  const handleAddEditStudent = useCallback(
    async (student_id: number) => {
      // Always use a valid session id
      const sessionToUse = SelectedSession ?? CurrentAcademicSessionForSchool?.id
      if (!sessionToUse) {
        toast({
          variant: "destructive",
          title: "No academic session selected",
          description: "Please select an academic session first.",
        })
        return
      }
      try {
        const response = await getSingleStudent({
          student_id: student_id,
          student_meta: true,
          academic_session_id: sessionToUse,
        })

        if (response.data) {
          setOpenDialogForStudent({
            isOpen: true,
            selectedStudent: response.data,
            type: "edit",
          })
        }
      } catch (error) {
        console.error("Error fetching student data:", error)
        toast({
          variant: "destructive",
          title: "Failed to load student data",
          description: "Please try again later",
        })
      }
    },
    [getSingleStudent, authState.user, toast, SelectedSession, CurrentAcademicSessionForSchool],
  )

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Function to validate CSV data with Zod

  const validateCsvData = useCallback((data: any[]): ValidationResult[] => {
    const results: ValidationResult[] = []

    data.forEach((row, index) => {
      // Set all optional fields to null if not provided
      const sanitizedRow = Object.keys(activeUploadSchema.shape).reduce(
        (acc, key) => {
          acc[key] = row[key] !== undefined && row[key] !== "" ? row[key] : null
          return acc
        },
        {} as Record<string, any>,
      )

      try {
        // Attempt to validate the sanitized row data against the schema
        activeUploadSchema.parse(sanitizedRow)

        // If validation passes, add a success result
        results.push({
          row: index + 2, // +2 because index is 0-based and we skip the header row
          hasErrors: false,
          errors: [],
          rawData: sanitizedRow,
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Format Zod validation errors
          const formattedErrors = error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          }))

          results.push({
            row: index + 2,
            hasErrors: true,
            errors: formattedErrors,
            rawData: sanitizedRow,
          })
        }
      }

      // Add a warning for optional fields with null values (highlight in yellow)
      Object.keys(sanitizedRow).forEach((key) => {
        if (sanitizedRow[key] === null) {
          results[results.length - 1].errors.push({
            field: key,
            message: "Optional field not provided (valid)",
          })
        }
      })
    })

    return results
  }, [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setFileName(file.name)
        setSelectedFile(file)
        setUploadError(null)
        setUploadResults([])
        setValidationPassed(false)
        setParsedData([])

        // Reset validation state
        setIsValidating(true)

        // Parse and validate the CSV file
        parseCSV(file)
          .then((parsedData) => {
            setParsedData(parsedData)

            const headers = Object.keys(parsedData[0])
            const requiredHeaders = activeUploadSchema.shape
            const missingHeaders = Object.keys(requiredHeaders).filter((header) => !headers.includes(header))

            if (missingHeaders.length > 0) {
              setUploadError(`Missing required headers: ${missingHeaders.join(", ")}`)
              setIsValidating(false)
              return
            }

            // Validate the parsed data
            const validationResults = validateCsvData(parsedData)
            setUploadResults(validationResults)

            // Check if all rows passed validation
            const allValid = validationResults.every((result) => !result.hasErrors)
            setValidationPassed(allValid)

            if (!allValid) {
              setUploadError("Please fix validation errors before uploading")
            }

            setIsValidating(false)
          })
          .catch((error) => {
            console.error("CSV parsing error:", error)
            setUploadError(`Failed to parse CSV file: ${error.message}`)
            setIsValidating(false)
          })
      }
    },
    [validateCsvData],
  )

  const handleDownloadDemo = useCallback(() => {
    downloadCSVTemplate(isCollege ? 'COLLEGE' : 'SCHOOL')
  }, [isCollege])

  const handleFileUploadSubmit = async () => {
    if (!CurrentAcademicSessionForSchool) {
      setUploadError("Please select an academic session first")
      return
    }

    if (!selectedFile) {
      setUploadError("Please select a file to upload")
      return
    }

    if (!selectedClass || !selectedDivision) {
      setUploadError("Please select a class and division first")
      return
    }

    if (!validationPassed) {
      setUploadError("Please fix validation errors before uploading")
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)

      const response: any = await bulkUploadStudents({
        academic_session: CurrentAcademicSessionForSchool!.id,
        school_id: authState.user!.school_id,
        division_id: selectedDivision.id,
        file: selectedFile,
      })

      // Handle success response
      if (response.data) {
        // If upload was successful
        if (response.data.totalInserted) {
          // Close the dialog
          setDialogOpenForBulkUpload(false)

          // Show success toast
          toast({
            title: "Upload Successful",
            description: `Successfully uploaded ${response.data.totalInserted} students`,
            variant: "default",
          })

          // Reset file selection
          setFileName(null)
          setSelectedFile(null)
          setUploadResults([])
          setValidationPassed(false)
          setParsedData([])
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }

          /**
           * Refetch the student list for the selected class
           */
          if (selectedDivision) {
            await getStudentForClass({
              class_id: selectedDivision.id,
              academic_session: CurrentAcademicSessionForSchool!.id,
            })

            // Make sure the UI updates with the new data
            if (studentDataForSelectedClass) {
              setListedStudentForSelectedClass(studentDataForSelectedClass.data)
              setPaginationDataForSelectedClass(studentDataForSelectedClass.meta)
            }
          }
        }
      } else {
        const errors = response.error.data.errors
        if (errors) {
          const dbValidationResults: ValidationResult[] = errors.map((error: any) => ({
            row: error.row,
            hasErrors: true,
            errors: error.errors.map((err: any) => ({
              field: err.field,
              message: err.message,
            })),
            rawData: {}, // You can add raw data if needed
          }))
          console.log("dbValidationResults", dbValidationResults)
          setServerValidationErrors(dbValidationResults)
          setValidationPassed(false)
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      setUploadError(error.data?.message || "Failed to upload students. Please try again.")

      // Show error toast
      toast({
        title: "Upload Failed",
        description: error.data?.message || "Failed to upload students. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handlePageChange = useCallback(
    async (page: number) => {
      setCurrentPage(page)
      sessionStorage.setItem(SESSION_SELECTED_PAGE_KEY, page.toString())
      if (selectedDivision && SelectedSession) {
        await getStudentForClass({ class_id: selectedDivision.id, page: page, academic_session: SelectedSession }).then(
          (response) => {
            setPaginationDataForSelectedClass(response.data.meta)
          },
        )
      }
    },
    [setCurrentPage, selectedDivision, getStudentForClass, SelectedSession],
  )

  // Get all unique fields from the parsed data
  const getUniqueFields = useMemo(() => {
    if (!uploadResults.length) return []

    // Get all unique field names from all rows
    const allFields = new Set<string>()
    uploadResults.forEach((result) => {
      if (result.rawData) {
        Object.keys(result.rawData).forEach((field) => {
          allFields.add(field)
        })
      }
    })

    console.log(Array.from(allFields).sort())
    // Convert to array and sort
    return Array.from(allFields).sort()
  }, [uploadResults])

  useEffect(() => {
    // Restore class/division/page/session from sessionStorage after AcademicClasses are loaded
    if (!AcademicClasses || AcademicClasses.length === 0 || hasRestoredSession) return
    const savedClass = sessionStorage.getItem(SESSION_SELECTED_CLASS_KEY)
    const savedDivision = sessionStorage.getItem(SESSION_SELECTED_DIVISION_KEY)
    const savedPage = sessionStorage.getItem(SESSION_SELECTED_PAGE_KEY)
    const savedSession = sessionStorage.getItem(SESSION_SELECTED_SESSION_KEY)

    let classToSet = ""
    let divisionToSet: Division | null = null
    let pageToSet = 1
    let sessionToSet: number | null = null

    if (savedSession && !isNaN(Number(savedSession))) {
      sessionToSet = Number(savedSession)
      setSelectedSession(sessionToSet)
    }

    if (savedClass && AcademicClasses.some((cls) => cls.id.toString() === savedClass)) {
      classToSet = savedClass
      const classObj = AcademicClasses.find((cls) => cls.id.toString() === savedClass)
      if (classObj && savedDivision) {
        const division = classObj.divisions.find((div) => div.id.toString() === savedDivision)
        if (division) {
          divisionToSet = division
        }
      }
      if (savedPage && !isNaN(Number(savedPage))) {
        pageToSet = Number(savedPage)
      }
    } else {
      // fallback to first class/division
      const firstClassWithDivisions = AcademicClasses.find((cls) => cls.divisions.length > 0)
      if (firstClassWithDivisions) {
        classToSet = firstClassWithDivisions.id.toString()
        divisionToSet = firstClassWithDivisions.divisions[0]
      }
    }

    setSelectedClass(classToSet)
    setSelectedDivision(divisionToSet)
    setCurrentPage(pageToSet)
    setHasRestoredSession(true)

    // Fetch students for this division and session if both are set
    const sessionId = sessionToSet || SelectedSession
    if (divisionToSet && sessionId) {
      getStudentForClass({ class_id: divisionToSet.id, academic_session: sessionId, page: pageToSet })
    }
  }, [AcademicClasses, SelectedSession, hasRestoredSession])

  // Only auto-select first class/division if session restore has NOT happened
  useEffect(() => {
    if (
      AcademicClasses &&
      AcademicClasses.length > 0 &&
      !selectedClass &&
      !hasRestoredSession &&
      SelectedSession
    ) {
      const firstClassWithDivisions = AcademicClasses.find((cls) => cls.divisions.length > 0)
      if (firstClassWithDivisions) {
        setSelectedClass(firstClassWithDivisions.id.toString())
        setSelectedDivision(firstClassWithDivisions.divisions[0])
        getStudentForClass({ class_id: firstClassWithDivisions.divisions[0].id, academic_session: SelectedSession })
      }
    }
  }, [AcademicClasses, selectedClass, getStudentForClass, SelectedSession, hasRestoredSession])

  useEffect(() => {
    if (CurrentAcademicSessionForSchool) {
      setSelectedSession(CurrentAcademicSessionForSchool.id)
      sessionStorage.setItem(SESSION_SELECTED_SESSION_KEY, CurrentAcademicSessionForSchool.id.toString())
      
      // Refetch students when the global academic session changes
      if (hasRestoredSession && selectedDivision) {
        getStudentForClass({
          class_id: selectedDivision.id,
          academic_session: CurrentAcademicSessionForSchool.id,
          page: 1, 
        })
        setCurrentPage(1)
        sessionStorage.setItem(SESSION_SELECTED_PAGE_KEY, "1")
      }
    }
  }, [CurrentAcademicSessionForSchool, hasRestoredSession, selectedDivision, getStudentForClass])

  useEffect(() => {
    if (!AcademicClasses && authState.user) {
      getAcademicClasses(authState.user.school_id)
    }
  }, [AcademicClasses])

  useEffect(() => {
    if (studentDataForSelectedClass) {
      setPaginationDataForSelectedClass(studentDataForSelectedClass.meta)
      setListedStudentForSelectedClass(studentDataForSelectedClass.data)
    }
  }, [studentDataForSelectedClass])

  // Sort validation results to show rows with errors first
  const sortedValidationResults = useMemo(() => {
    if (!uploadResults.length) return []

    // Create a copy to avoid mutating the original array
    return [...uploadResults].sort((a, b) => {
      // Sort by error status first (errors first)
      if (a.hasErrors && !b.hasErrors) return -1
      if (!a.hasErrors && b.hasErrors) return 1

      // Then sort by row number
      return a.row - b.row
    })
  }, [uploadResults])

  return (
    <>
      <div className="p-6 bg-white shadow-md rounded-lg max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{t("student_managment")}</h2>
          <div className="flex space-x-2">
            <Button
              onClick={() =>
                setOpenDialogForStudent({ ...openDialogForStudent, isOpen: true, type: "add", selectedStudent: null })
              }
              disabled={!AcademicClasses || AcademicClasses.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" /> {t("add_student")}
            </Button>

            {/* Upload CSV */}
            <Dialog
              open={dialogOpenForBulkUpload}
              onOpenChange={(open) => {
                if (!open) {
                  setFileName(null)
                  setSelectedFile(null)
                  setUploadError(null)
                  // Don't reset validation results here so they can be viewed in the separate dialog
                  setDialogOpenForBulkUpload(false)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpenForBulkUpload(true)}
                  disabled={!AcademicClasses || AcademicClasses.length === 0}
                >
                  <Upload className="mr-2 h-4 w-4" /> {t("upload_csv")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[700px] overflow-auto">
                <DialogTitle>{t("upload_csv_file")}</DialogTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="upload-academic-session" className="text-sm font-medium">
                        {t("academic_year")}
                      </label>
                      <Select
                        value={SelectedSession ? SelectedSession.toString() : " "}
                        onValueChange={(value) => handleAcademicSessionChange(Number(value))}
                        disabled
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Academic Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=" " disabled>
                            {t("academic_years")}
                          </SelectItem>
                          {AcademicSessionsForSchool &&
                            AcademicSessionsForSchool.map((as: AcademicSession, index) => (
                              <SelectItem key={index} value={as.id.toString()}>
                                {`${as.session_name}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="upload-class" className="text-sm font-medium">
                        {t("class")}
                      </label>
                      <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=" " disabled>
                            {t("classes")}
                          </SelectItem>
                          {AcademicClasses?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              Class {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="upload-division" className="text-sm font-medium">
                        {t("division")}
                      </label>
                      <Select
                        value={selectedDivision ? selectedDivision.id.toString() : " "}
                        onValueChange={handleDivisionChange}
                        disabled={!availableDivisions.length}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=" " disabled>
                            {t("divisions")}
                          </SelectItem>
                          {availableDivisions.map((division) => (
                            <SelectItem key={division.id} value={division.id.toString()}>
                              {`${division.division} ${division.aliases ? "-" + division.aliases : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleDownloadDemo} className="w-1/2 mr-2">
                      {t("download_demo_CSV_template")}
                    </Button>
                    <Button variant="outline" onClick={handleChooseFile} className="w-1/2 mr-2">
                      {t("choose_CSV_file")}
                    </Button>
                  </div>
                  <Input
                    ref={fileInputRef}
                    id="excel-file"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {fileName && (
                    <div className="flex items-center">
                      <p className="text-sm text-muted-foreground">{fileName}</p>
                      {isValidating ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                      ) : validationPassed ? (
                        <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                      ) : uploadResults.length > 0 ? (
                        <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}

                  {uploadError && <p className="text-sm text-red-500 mt-2">{uploadError}</p>}

                  {/* Validation status summary */}
                  {uploadResults.length > 0 && (
                    <div
                      className={`p-3 rounded-md ${validationPassed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                    >
                      <div className="flex items-center">
                        {validationPassed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className={`text-sm font-medium ${validationPassed ? "text-green-700" : "text-red-700"}`}>
                          {validationPassed
                            ? `All ${uploadResults.length} rows passed validation. Ready to upload.`
                            : `${uploadResults.filter((r) => r.hasErrors).length} of ${uploadResults.length} rows have validation errors.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {serverValidationErrors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md mt-4">
                      <h3 className="text-red-700 font-bold mb-2">{t("server_validation_errors")}</h3>
                      <ul className="list-disc list-inside text-red-700">
                        {serverValidationErrors.map((error, index) => (
                          <li key={index}>
                            <strong>Row {error.row}:</strong>
                            <ul className="list-disc list-inside ml-4">
                              {/* </ul> */}
                              {error.errors.map((err, idx) => (
                                <li key={idx}>
                                  <strong>{err.field}:</strong> {err.message}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Button to view validation results in a separate dialog */}
                  {uploadResults.length > 0 && (
                    <Button variant="outline" className="w-full" onClick={() => setValidationDialogOpen(true)}>
                      <FileText className="mr-2 h-4 w-4" />
                      {t("view_validation_results")}
                    </Button>
                  )}

                  <div className="flex justify-end">
                    <Button
                      className="w-1/2"
                      onClick={handleFileUploadSubmit}
                      disabled={
                        isUploading ||
                        !selectedFile ||
                        !selectedClass ||
                        !selectedDivision ||
                        !validationPassed ||
                        isValidating
                      }
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        t("upload")
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Separate Dialog for Validation Results */}
            <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
              <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>{t("CSV_validation_results")}</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-2 bg-gray-50 border-t border-b text-xs">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="bg-green-50 px-2 py-1 rounded border border-green-200 text-green-500 mr-1">
                        ✓
                      </span>
                      <span>{t("valid_data")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-red-50 px-2 py-1 rounded border border-red-200 text-red-500 mr-1">i</span>
                      <span>{t("invalid_data_with_error_message")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-yellow-50 px-2 py-1 rounded border border-yellow-200 text-yellow-500 mr-1">
                        !
                      </span>
                      <span>Optional field not provided (valid)</span>
                    </div>
                  </div>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t("validation_summary")}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      Showing all {uploadResults.length} rows: {uploadResults.filter((r) => !r.hasErrors).length} valid,{" "}
                      <span className="font-bold text-red-500">
                        {uploadResults.filter((r) => r.hasErrors).length} with errors
                      </span>
                      {uploadResults.filter((r) => r.hasErrors).length > 0 && " (shown first)"}
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider border-r"
                          >
                            Row
                          </th>
                          {getUniqueFields.map((field) => (
                            <th
                              key={field}
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider border-r"
                            >
                              {field}
                            </th>
                          ))}
                          <th
                            scope="col"
                            className="px-3 py-2 text-center text-xs font-medium text-black uppercase tracking-wider w-16"
                          >
                            {t("status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedValidationResults.map((result, index) => (
                          <tr key={index} className={result.hasErrors ? "bg-red-50" : ""}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-r">
                              {result.row - 1}
                            </td>
                            {getUniqueFields.map((field) => {
                              // Find if this field has an error or warning
                              const fieldError = result.errors.find((err) => err.field === field)

                              return (
                                <td
                                  key={field}
                                  className={`px-3 py-2 text-sm border-r ${
                                    fieldError?.message.includes("Optional field not provided")
                                      ? "bg-yellow-50" // Highlight warnings in yellow
                                      : fieldError
                                        ? "bg-red-50" // Highlight errors in red
                                        : "bg-green-50" // Highlight valid fields in green
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={
                                        fieldError?.message.includes("Optional field not provided")
                                          ? "text-yellow-500 text-xs"
                                          : fieldError
                                            ? "text-red-500 text-xs"
                                            : "sr-only"
                                      }
                                    >
                                      {fieldError ? fieldError.message : "Valid field"}
                                    </span>
                                    <span
                                      className={`ml-2 ${
                                        fieldError?.message.includes("Optional field not provided")
                                          ? "text-yellow-500 font-bold"
                                          : fieldError
                                            ? "text-red-500 font-bold"
                                            : "text-green-500"
                                      }`}
                                    >
                                      {fieldError ? "!" : "✓"}
                                    </span>
                                  </div>
                                </td>
                              )
                            })}
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              {result.hasErrors ? (
                                <span className="text-red-500 font-bold text-lg">i</span>
                              ) : (
                                <span className="text-green-500 text-lg">✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setValidationDialogOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => setDialogOpenForDownLoadExcel(true)}
              className="flex items-center"
              disabled={!AcademicClasses || AcademicClasses.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" /> {t("download_excel")}
            </Button>
          </div>
        </div>

        {/* Add warning alert when no academic classes exist */}
        {(!AcademicClasses || AcademicClasses.length === 0) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>{t("no_academic_classes_found")}</AlertTitle>
            <AlertDescription>
              {authState.user?.role_id === 1 ? (
                <>
                  {t("you_need_to_create_academic_classes_before_managing_students.")}
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (navaigate( "/d/settings/academic"))}
                      className="bg-white text-destructive hover:bg-white/90"
                    >
                      <School className="mr-2 h-4 w-4" />
                      {t("create_academic_classes")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {t("the_administrator_has_not_created_any_academic_classes_yet.")}
                  <div className="mt-2">{t("please_contact_your_administrator_to_set_up_classes_and_divisions.")}</div>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!AcademicSessionsForSchool || AcademicSessionsForSchool.length === 0 ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("search_students")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-600">{t("please_create_academic_sessions_for_your_school.")}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("search_students")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-2">
                <Select
                  value={SelectedSession ? SelectedSession.toString() : " "}
                  onValueChange={(value) => handleAcademicSessionChange(Number(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("select_academic_year")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" " disabled>
                      {t("academic_years")}
                    </SelectItem>
                    {AcademicSessionsForSchool &&
                      AcademicSessionsForSchool.map((as: AcademicSession, index) => (
                        <SelectItem key={index} value={as.id.toString()}>
                          {`${as.session_name}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedClass}
                  onValueChange={handleClassChange}
                  disabled={!AcademicClasses || AcademicClasses.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("select_class")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" " disabled>
                      {t("classes")}
                    </SelectItem>
                    {AcademicClasses?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        Class {cls.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedDivision ? selectedDivision.id.toString() : " "}
                  onValueChange={handleDivisionChange}
                  disabled={!availableDivisions.length}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" " disabled>
                      {t("divisions")}
                    </SelectItem>
                    {availableDivisions.map((division) => (
                      <SelectItem key={division.id} value={division.id.toString()}>
                        {`${division.division} ${division.aliases ? "-" + division.aliases : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t("search_students")}
                  value={searchValue || ""}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        )}
        {selectedClass && !selectedDivision && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("division_not_selected")}</AlertTitle>
            <AlertDescription>
              {t("please_select_a_division_to_view_students")}
            </AlertDescription>
          </Alert>
        )}

        {selectedClass && !selectedDivision && !listedStudentForSelectedClass && (
          <div className="text-center py-4 text-gray-500">{t("no_records_found")}</div>
        )}

      {showHostelModal && newStudentData && (
        <HostelAllotmentModal
          isOpen={showHostelModal}
          onClose={() => setShowHostelModal(false)}
          studentId={newStudentData.id}
          schoolId={authState.user!.school_id}
          studentGender={newStudentData.gender}
          onSuccess={() => setShowHostelModal(false)}
        />
      )}

      {selectedClass && selectedDivision && (
          isStudentsLoading ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("students")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Improved Skeleton */}
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="rounded-full bg-gray-200 h-8 w-8" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            studentDataForSelectedClass && listedStudentForSelectedClass && (
              <StudentTable
                selectd_academic_session={SelectedSession!}
                selectedClass={selectedClass}
                selectedDivision={selectedDivision}
                PageDetailsForStudents={paginationDataForSelectedClass}
                filteredStudents={filteredStudents}
                onPageChange={handlePageChange}
                onEdit={handleAddEditStudent}
              />
            )
          )
        )}
      </div>

      <Dialog
        open={openDialogForStudent.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setOpenDialogForStudent({
              isOpen: false,
              type: "add",
              selectedStudent: null,
            })
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{openDialogForStudent.type === "edit" ? t("edit_student") : t("add_new_student")}</DialogTitle>
          </DialogHeader>
          <>
            <div className="w-full lg:h-[600px] overflow-auto">
              {openDialogForStudent.type === "add" && (
                <StudentForm
                  onClose={() => {
                    setOpenDialogForStudent({
                      isOpen: false,
                      type: "add",
                      selectedStudent: null,
                    })
                  }}
                  onSubmitSuccess={async (student_data: Student) => {
                    setOpenDialogForStudent({
                      isOpen: false,
                      type: "add",
                      selectedStudent: null,
                    })
                    const divison = AcademicDivisions?.find((cls) => cls.id === student_data.class_id)

                    if (divison) {
                      setSelectedClass(divison.class_id.toString())
                      setSelectedDivision(divison)
                      if (!SelectedSession) setSelectedSession(CurrentAcademicSessionForSchool!.id)
                      await getStudentForClass({
                        class_id: divison.class_id,
                        academic_session: CurrentAcademicSessionForSchool!.id,
                        page: 1,
                        student_meta: false,
                      })
                    }

                    // Show the hostel allotment modal right after successful student creation
                    setNewStudentData(student_data)
                    setShowHostelModal(true)
                  }}
                  form_type="create"
                />
              )}
              {openDialogForStudent.type === "edit" && !isStudentForEditLoading && (
                <StudentForm
                  onClose={() => {
                    setOpenDialogForStudent({
                      isOpen: false,
                      type: "edit",
                      selectedStudent: null,
                    })
                  }}
                  onSubmitSuccess={(student_data: Student) => {
                    setOpenDialogForStudent({
                      isOpen: false,
                      type: "add",
                      selectedStudent: null,
                    })
                    if (selectedDivision && SelectedSession) {
                      getStudentForClass({
                        class_id: student_data.class_id,
                        academic_session: SelectedSession,
                        page: currentPage,
                        student_meta: false,
                      })
                    }
                  }}
                  form_type="update"
                  initial_data={studentDataForEditStudent}
                  setListedStudentForSelectedClass={setListedStudentForSelectedClass}
                  setPaginationDataForSelectedClass={setPaginationDataForSelectedClass}
                />
              )}
              {openDialogForStudent.type === "edit" && isStudentForEditLoading && (
                <div className="w-full h-full flex justify-center items-center">
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </div>
          </>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpenForDownLoadExcel}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpenForDownLoadExcel(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("download_student_data")}</DialogTitle>
          </DialogHeader>
          <ExcelDownloadModalForStudents 
            academicClasses={AcademicClasses}
            selctedDivisionFromParent={selectedDivision}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Students