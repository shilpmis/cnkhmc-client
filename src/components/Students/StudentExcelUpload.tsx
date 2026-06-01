// import type React from "react"
// import { useState, useRef, useCallback, useMemo, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { Plus, Upload, MoreHorizontal, Loader2, AlertCircle, CheckCircle2, FileText, Table, FileDown } from "lucide-react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import StudentForm from "@/components/Students/StudentForm"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectAcademicClasses } from "@/redux/slices/academicSlice"
// import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
// import { selectAccademicSessionsForSchool, selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
// import type { AcademicClasses, Division } from "@/types/academic"
// import type { PageDetailsForStudents, Student } from "@/types/student"
// import StudentTable from "@/components/Students/StudentTable"
// import {
//   useLazyFetchSingleStundetQuery,
//   useLazyFetchStudentForClassQuery,
//   useBulkUploadStudentsMutation,
// } from "@/services/StudentServices"
// import { toast } from "@/hooks/use-toast"
// import { Input } from "@/components/ui/input"
// import { downloadCSVTemplate } from "@/utils/CSVTemplateForStudents"
// import ExcelDownloadModalForStudents from "@/components/Students/ExcelDownloadModalForStudents"
// import { z } from "zod"
// import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { AcademicSession } from "@/types/user"
// import { useTranslation } from "@/redux/hooks/useTranslation"

// // Type for validation results
// type ValidationResult = {
//   row: number
//   hasErrors: boolean
//   errors: { field: string; message: string }[]
//   rawData: any
// }

// interface Props {
//   serverValidationErrors: ValidationResult[];
//   parsedData: any[];
// }


// // Define Zod schema for student data validation
// const StudentSchemaForUploadData = z.object({
//   first_name: z.string().min(1, "First Name is required"),
//   middle_name: z.string().min(1, "Name is required").nullable().or(z.literal("")),
//   last_name: z.string().min(1, "Last Name is required"),
//   phone_number: z
//     .string()
//     .regex(/^\d{10}$/, "Phone number must be 10 digits")
//     .optional()
//     .or(z.literal("")),
//   gender: z
//     .enum(["Male", "Female", "Other"], {
//       errorMap: () => ({ message: "Gender must be Male, Female, or Other" }),
//     })
//     .optional()
//     .or(z.literal("")),
//   gr_no: z.string().min(1, "GR Number is required"),
// })

// // Custom CSV parser function
// const parseCSV = (file: File): Promise<any[]> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()

//     reader.onload = (event) => {
//       try {
//         const csvData = event.target?.result as string
//         const lines = csvData.split("\n")

//         // Extract headers (first line)
//         const headers = lines[0].split(",").map(
//           (header) => header.trim().replace(/^"(.*)"$/, "$1"), // Remove quotes if present
//         )

//         // Parse data rows
//         const results = []
//         for (let i = 1; i < lines.length; i++) {
//           if (!lines[i].trim()) continue // Skip empty lines

//           const values = lines[i].split(",").map(
//             (value) => value.trim().replace(/^"(.*)"$/, "$1"), // Remove quotes if present
//           )

//           // Create object with headers as keys
//           const row: any = {}
//           headers.forEach((header, index) => {
//             row[header] = values[index] || ""
//           })

//           results.push(row)
//         }

//         resolve(results)
//       } catch (error: any) {
//         reject(new Error(`Failed to parse CSV: ${error.message}`))
//       }
//     }

//     reader.onerror = () => {
//       reject(new Error("Error reading file"))
//     }

//     reader.readAsText(file)
//   })
// }

// export default function StudentExcelUpload() {

//     const {t} = useTranslation()
//     const authState = useAppSelector(selectAuthState)
//     const AcademicClasses = useAppSelector(selectAcademicClasses)
//     const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
//     const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

//     const [getAcademicClasses] = useLazyGetAcademicClassesQuery();

//     const [fileName, setFileName] = useState<string | null>(null)
//     const [isUploading, setIsUploading] = useState(false)
//     const [isValidating, setIsValidating] = useState(false)
//     const [uploadError, setUploadError] = useState<string | null>(null)
//     const [uploadResults, setUploadResults] = useState<ValidationResult[]>([])
//     const [bulkUploadStudents] = useBulkUploadStudentsMutation()
//     const [selectedFile, setSelectedFile] = useState<File | null>(null)
//     const [currentPage, setCurrentPage] = useState<number>(1)
//     const fileInputRef = useRef<HTMLInputElement>(null)
//     const [dialogOpenForBulkUpload, setDialogOpenForBulkUpload] = useState(false)
//     const [dialogOpenForDownLoadExcel, setDialogOpenForDownLoadExcel] = useState(false)
//     const [validationPassed, setValidationPassed] = useState(false)
//     const [parsedData, setParsedData] = useState<any[]>([])
//     const [validationDialogOpen, setValidationDialogOpen] = useState(false)
//     const [serverValidationErrors, setServerValidationErrors] = useState<ValidationResult[]>([])


//     const availableDivisions = useMemo<AcademicClasses | null>(() => {
//       if (AcademicClasses && selectedClass) {
//         return AcademicClasses.filter((cls) => cls.id.toString() === selectedClass)[0]
//       } else {
//         return null
//       }
//     }, [AcademicClasses, selectedClass])
  
//     const handleChooseFile = useCallback(() => {
//       fileInputRef.current?.click()
//     }, [])
  
//     // Function to validate CSV data with Zod
//     const validateCsvData = useCallback((data: any[]): ValidationResult[] => {
//       const results: ValidationResult[] = []
  
//       data.forEach((row, index) => {
//         try {
//           // Attempt to validate the row data against our schema
//           StudentSchemaForUploadData.parse(row)
  
//           // If validation passes, add a success result
//           results.push({
//             row: index + 2, // +2 because index is 0-based and we skip header row
//             hasErrors: false,
//             errors: [],
//             rawData: row,
//           })
//         } catch (error) {
//           if (error instanceof z.ZodError) {
//             // Format Zod validation errors
//             const formattedErrors = error.errors.map((err) => ({
//               field: err.path.join("."),
//               message: err.message,
//             }))
  
//             results.push({
//               row: index + 2,
//               hasErrors: true,
//               errors: formattedErrors,
//               rawData: row,
//             })
//           } else {
//             // Handle unexpected errors
//             results.push({
//               row: index + 2,
//               hasErrors: true,
//               errors: [{ field: "unknown", message: "Unknown validation error" }],
//               rawData: row,
//             })
//           }
//         }
//       })
  
//       return results
//     }, [])
  
//     const handleFileChange = useCallback(
//       (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0]
//         if (file) {
//           setFileName(file.name)
//           setSelectedFile(file)
//           setUploadError(null)
//           setUploadResults([])
//           setValidationPassed(false)
//           setParsedData([])
  
//           // Reset validation state
//           setIsValidating(true)
  
//           // Parse and validate the CSV file
//           parseCSV(file)
//             .then((parsedData) => {
//               setParsedData(parsedData)
  
//               const headers = Object.keys(parsedData[0])
//               const requiredHeaders = StudentSchemaForUploadData.shape
//               const missingHeaders = Object.keys(requiredHeaders).filter(header => !headers.includes(header))
  
//               if (missingHeaders.length > 0) {
//                 setUploadError(`Missing required headers: ${missingHeaders.join(", ")}`)
//                 setIsValidating(false)
//                 return
//               }
  
  
//               // Validate the parsed data
//               const validationResults = validateCsvData(parsedData)
//               setUploadResults(validationResults)
  
//               // Check if all rows passed validation
//               const allValid = validationResults.every((result) => !result.hasErrors)
//               setValidationPassed(allValid)
  
//               if (!allValid) {
//                 setUploadError("Please fix validation errors before uploading")
//               }
  
//               setIsValidating(false)
//             })
//             .catch((error) => {
//               console.error("CSV parsing error:", error)
//               setUploadError(`Failed to parse CSV file: ${error.message}`)
//               setIsValidating(false)
//             })
//         }
//       },
//       [validateCsvData],
//     )
  
//     const handleDownloadDemo = useCallback(() => {
//       downloadCSVTemplate()
//     }, [])
  
  
//     const handleFileUploadSubmit = async () => {
      
//       if(!CurrentAcademicSessionForSchool){
//         setUploadError("Please select an academic session first")
//         return
//       }
  
//       if (!selectedFile) {
//         setUploadError("Please select a file to upload")
//         return
//       }
  
//       if (!selectedClass || !selectedDivision) {
//         setUploadError("Please select a class and division first")
//         return
//       }
  
//       if (!validationPassed) {
//         setUploadError("Please fix validation errors before uploading")
//         return
//       }
  
//       try {
//         setIsUploading(true)
//         setUploadError(null)
  
//         const response: any = await bulkUploadStudents({
//           academic_session: CurrentAcademicSessionForSchool!.id,
//           school_id: authState.user!.school_id,
//           class_id: selectedDivision.id,
//           file: selectedFile,
//         })
  
//         // Handle success response
//         if (response.data) {
  
//           // If upload was successful
//           if (response.data.totalInserted) {
//             // Close the dialog
//             setDialogOpenForBulkUpload(false)
  
//             // Show success toast
//             toast({
//               title: "Upload Successful",
//               description: `Successfully uploaded ${response.data.totalInserted} students`,
//               variant: "default",
//             })
  
//             // Reset file selection
//             setFileName(null)
//             setSelectedFile(null)
//             setUploadResults([])
//             setValidationPassed(false)
//             setParsedData([])
//             if (fileInputRef.current) {
//               fileInputRef.current.value = ""
//             }
  
//             /**
//              * Refetch the student list for the selected class
//              */
//             if (selectedDivision) {
//               await getStudentForClass({ class_id: selectedDivision.id, academic_session: CurrentAcademicSessionForSchool!.id })
  
//               // Make sure the UI updates with the new data
//               if (studentDataForSelectedClass) {
//                 setListedStudentForSelectedClass(studentDataForSelectedClass.data)
//                 setPaginationDataForSelectedClass(studentDataForSelectedClass.meta)
//               }
//             }
//           }
//         } else {
//           let errors = response.error.data.errors;
//           if (errors) {
//             const dbValidationResults: ValidationResult[] = errors.map((error: any) => ({
//               row: error.row,
//               hasErrors: true,
//               errors: error.errors.map((err: any) => ({
//                 field: err.field,
//                 message: err.message,
//               })),
//               rawData: {}, // You can add raw data if needed
//             }))
//             console.log("dbValidationResults", dbValidationResults)
//             setServerValidationErrors(dbValidationResults)
//             setValidationPassed(false)
//           }
//         }
  
//       } catch (error: any) {
//         console.error("Upload error:", error)
//         setUploadError(error.data?.message || "Failed to upload students. Please try again.")
  
//         // Show error toast
//         toast({
//           title: "Upload Failed",
//           description: error.data?.message || "Failed to upload students. Please try again.",
//           variant: "destructive",
//         })
//       } finally {
//         setIsUploading(false)
//       }
//     }

//       // Get all unique fields from the parsed data
//       const getUniqueFields = useMemo(() => {
//         if (!uploadResults.length) return []
    
//         // Get all unique field names from all rows
//         const allFields = new Set<string>()
//         uploadResults.forEach((result) => {
//           if (result.rawData) {
//             Object.keys(result.rawData).forEach((field) => {
//               allFields.add(field)
//             })
//           }
//         })
    
//         console.log(Array.from(allFields).sort())
//         // Convert to array and sort
//         return Array.from(allFields).sort()
//       }, [uploadResults])
    

//         // Sort validation results to show rows with errors first
//         const sortedValidationResults = useMemo(() => {
//           if (!uploadResults.length) return []
      
//           // Create a copy to avoid mutating the original array
//           return [...uploadResults].sort((a, b) => {
//             // Sort by error status first (errors first)
//             if (a.hasErrors && !b.hasErrors) return -1
//             if (!a.hasErrors && b.hasErrors) return 1
      
//             // Then sort by row number
//             return a.row - b.row
//           })
//         }, [uploadResults])
  
  
//   return (
//     <>

//     </>
//   )
// }
