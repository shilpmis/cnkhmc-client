"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  FileDown,
  Upload,
  AlertTriangle,
  Trash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  X,
  UserX,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DialogDescription } from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import StaffForm from "@/components/Staff/StaffForm"
import StaffTable from "@/components/Staff/StaffTable"
import type { StaffRole, StaffType } from "@/types/staff"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import {
  useLazyGetOtherStaffQuery,
  useLazyGetTeachingStaffQuery,
  useLazyGetSchoolStaffRoleQuery,
  useAddStaffMutation,
  useUpdateStaffMutation,
  useBulkUploadStaffMutation,
} from "@/services/StaffService"
import type { StaffFormData } from "@/utils/staff.validation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { downloadCSVTemplate } from "@/utils/CSVTemplateForStaff"
import ExcelDownloadModalForStaff from "@/components/Staff/ExcelDownloadModalForStaff"
import type { PageMeta } from "@/types/global"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { selectSchoolStaffRoles } from "@/redux/slices/staffSlice"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"

// ------------------------
// Types
// ------------------------

type ValidationResult = {
  row: number
  hasErrors: boolean
  errors: { field: string; message: string }[]
  rawData: any
}

type FilterOptionsProps = {
  onSearchChange: (value: string) => void
  searchValue: string
  onStatusChange: (value: string) => void
  statusValue: string
  onGenderChange: (value: string) => void
  genderValue: string
  onDesignationChange: (value: string) => void
  designationValue: string
  onClearFilters: () => void
  availableDesignations: string[]
  staffStatusFilter: string
  onStaffStatusFilterChange: (value: string) => void
}

// ------------------------
// CSV Parser
// ------------------------

const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")

    if (isExcel) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)
          resolve(json)
        } catch (error: any) {
          reject(new Error(`Failed to parse Excel: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error("Error reading Excel file"))
      reader.readAsBinaryString(file)
    } else {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const csvData = event.target?.result as string
          const lines = csvData.split("\n").filter((l) => l.trim().length > 0)
          if (!lines.length) {
            resolve([])
            return
          }
          const headers = lines[0].split(",").map((header) => header.trim().replace(/^"(.*)"$/, "$1"))
          const results: any[] = []
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((value) => value.trim().replace(/^"(.*)"$/, "$1"))
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ""
            })
            results.push(row)
          }
          resolve(results)
        } catch (error: any) {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error("Error reading CSV file"))
      reader.readAsText(file)
    }
  })
}

// ------------------------
// Filter Options Component
// ------------------------

const FilterOptions: React.FC<FilterOptionsProps> = ({
  onSearchChange,
  searchValue,
  onStatusChange,
  statusValue,
  onGenderChange,
  genderValue,
  onDesignationChange,
  designationValue,
  onClearFilters,
  availableDesignations,
  staffStatusFilter,
  onStaffStatusFilterChange,
}) => {
  const { t } = useTranslation()

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{t("filters")}</span>
          <span className="text-xs text-muted-foreground">{t("use_filters_to_narrow_down")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_by_name_or_phone")}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Staff Status Filter (server-side) */}
        <Select value={staffStatusFilter} onValueChange={onStaffStatusFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by staff status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Staff</SelectItem>
            <SelectItem value="resigned_retired">Resigned / Retired</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        {/* <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("filter_by_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t("all_status")}</SelectItem>
            <SelectItem value="Active">{t("active")}</SelectItem>
            <SelectItem value="Inactive">{t("inactive")}</SelectItem>
          </SelectContent>
        </Select> */}

        {/* Designation Filter */}
        <Select value={designationValue} onValueChange={onDesignationChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("filter_by_designation")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t("all_designations")}</SelectItem>
            {availableDesignations.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Gender Filter + Clear */}
        <div className="flex flex-col gap-2">
          <Select value={genderValue} onValueChange={onGenderChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filter_by_gender")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t("all_genders")}</SelectItem>
              <SelectItem value="Male">{t("male")}</SelectItem>
              <SelectItem value="Female">{t("female")}</SelectItem>
              <SelectItem value="Other">{t("other")}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onClearFilters} className="w-full">
            <X className="h-4 w-4 mr-2" />
            {t("clear_filters")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ------------------------
// Main Component
// ------------------------

export const Staff: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authState = useAppSelector(selectAuthState)
  const StaffRolesForSchool = useAppSelector(selectSchoolStaffRoles)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [getTeachingStaff, { data: teachingStaff, isLoading: isTeachingStaffLoading }] = useLazyGetTeachingStaffQuery()
  const [getOtherStaff, { data: otherStaff, isLoading: isTeachingOtherLoading }] = useLazyGetOtherStaffQuery()
  const [AddNewStaff, { isLoading: isNewStaffCreating }] = useAddStaffMutation()
  const [updateStaff, { isLoading: isStaffGettingUpdate }] = useUpdateStaffMutation()
  const [getStaffRoles] = useLazyGetSchoolStaffRoleQuery()
  const [bulkUploadstaff] = useBulkUploadStaffMutation()

  const [activeTab, setActiveTab] = useState<string>("teaching")

  // Filters
  const [searchValue, setSearchValue] = useState<string>("")
  const [statusValue, setStatusValue] = useState<string>("All")
  const [genderValue, setGenderValue] = useState<string>("All")
  const [designationValue, setDesignationValue] = useState<string>("All")
  const [staffStatusFilter, setStaffStatusFilter] = useState<string>("current")

  // Retirement warnings: list of staff who've reached their configured retirement age
  const [retirementWarnings, setRetirementWarnings] = useState<{ id: number; name: string; age: number; threshold: number }[]>([])

  const [staffTypeForUpload, setStaffTypeForUpload] = useState<"teaching" | "non-teaching" | null>(null)

  const [currentDisplayDataForTeachers, setCurrentDisplayDataForTeachers] = useState<{
    satff: StaffType[]
    meta: PageMeta
  } | null>(null)

  const [currentDisplayDataForOtherStaff, setCurrentDisplayDataForOtherStaff] = useState<{
    satff: StaffType[]
    meta: PageMeta
  } | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [openDialogForStaffForm, setOpenDialogForStaffForm] = useState<{
    isOpen: boolean
    type: "add" | "edit" | "view"
    selectedStaff: StaffType | null
  }>({ isOpen: false, type: "add", selectedStaff: null })

  const [teacherInitialData, setTeacherInitialData] = useState<StaffType | null>(null)
  const [otherInitialData, setOtherInitialData] = useState<StaffType | null>(null)

  const [openDialogForStaffBulkUpload, setOpenDialogForStaffBulkUpload] = useState(false)
  const [dialogOpenForDownLoadExcel, setDialogOpenForDownLoadExcel] = useState(false)
  const [isdelete, setIsDelete] = useState(false)

  // CSV upload states
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResults, setUploadResults] = useState<ValidationResult[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationPassed, setValidationPassed] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [serverValidationErrors, setServerValidationErrors] = useState<ValidationResult[]>([])

  const [currentPage, setCurrentPage] = useState<number>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [AllRolesForSchoolStaff, setAllRolesForSchoolStaff] = useState<{
    teachingStaff: string[]
    nonTeachingStaff: string[]
  }>({
    teachingStaff: [],
    nonTeachingStaff: [],
  })

  // Schema for bulk upload validation
  const staffSchemaFoeBulkUpload = useMemo(() => {
    return z.object({
      first_name: z.string().min(1, "First Name is required"),
      middle_name: z.string().min(3, "Middle Name is required").nullable().or(z.literal("")),
      last_name: z.string().min(1, "Last Name is required"),
      phone_number: z
        .string()
        .regex(/^\d{10}$/, "Phone number must be 10 digits")
        .optional()
        .or(z.literal("")),
      gender: z
        .enum(["Male", "Female", "Other"], {
          errorMap: () => ({
            message: "Gender must be Male, Female, or Other",
          }),
        })
        .optional()
        .or(z.literal("")),
      employment_status: z.enum(["Permanent", "Trial_Period", "Resigned", "Contract_Based", "Notice_Period"]),
      role: z.string().min(1, "Role is required"),
    })
  }, [])

  // ------------------------
  // Effects
  // ------------------------

  useEffect(() => {
    if (StaffRolesForSchool && StaffRolesForSchool.length === 0) {
      toast({
        title: "No Staff Roles",
        description: "Please create staff roles before managing staff.",
        variant: "destructive",
      })
    }
  }, [StaffRolesForSchool])

  useEffect(() => {
    if (activeTab === "teaching") {
      getTeachingStaff({
        academic_sessions: CurrentAcademicSessionForSchool!.id,
        page: 1,
        status_filter: staffStatusFilter,
      }).then((response) => {
        if (response.data) {
          setCurrentDisplayDataForTeachers({
            satff: response.data.data,
            meta: response.data.meta,
          })
        }
      })
    } else {
      getOtherStaff({
        academic_sessions: CurrentAcademicSessionForSchool!.id,
        page: 1,
        status_filter: staffStatusFilter,
      }).then((response) => {
        if (response.data) {
          setCurrentDisplayDataForOtherStaff({
            satff: response.data.data,
            meta: response.data.meta,
          })
        }
      })
    }
  }, [activeTab, CurrentAcademicSessionForSchool, staffStatusFilter])

  useEffect(() => {
    if (teachingStaff) {
      setCurrentDisplayDataForTeachers({
        satff: teachingStaff.data,
        meta: teachingStaff.meta,
      })
    }
  }, [teachingStaff])

  useEffect(() => {
    if (otherStaff) {
      setCurrentDisplayDataForOtherStaff({
        satff: otherStaff.data,
        meta: otherStaff.meta,
      })
    }
  }, [otherStaff])

  useEffect(() => {
    if (!StaffRolesForSchool) {
      getStaffRoles(authState.user!.school_id)
    }
  }, [StaffRolesForSchool])

  useEffect(() => {
    if (StaffRolesForSchool) {
      const teachingStaff = StaffRolesForSchool.filter((role) => role.is_teaching_role).map((role) => role.role)
      const nonTeachingStaff = StaffRolesForSchool.filter((role) => !role.is_teaching_role).map((role) => role.role)

      setAllRolesForSchoolStaff({
        nonTeachingStaff,
        teachingStaff,
      })
    }
  }, [StaffRolesForSchool])

  // Check for retirement-eligible staff (configurable per-staff retirement_age, default 60)
  useEffect(() => {
    const allStaff = [
      ...(currentDisplayDataForTeachers?.satff ?? []),
      ...(currentDisplayDataForOtherStaff?.satff ?? []),
    ]
    const today = new Date()

    const calcAge = (birthDate: Date | null): number => {
      if (!birthDate) return 0
      const birth = new Date(birthDate)
      return (
        today.getFullYear() -
        birth.getFullYear() -
        (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
          ? 1
          : 0)
      )
    }

    const warnings = allStaff
      .filter((s) => {
        if (!s.birth_date) return false
        const threshold = s.retirement_age ?? 60
        return calcAge(s.birth_date) >= threshold
      })
      .map((s) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        age: calcAge(s.birth_date),
        threshold: s.retirement_age ?? 60,
      }))

    setRetirementWarnings(warnings)
  }, [currentDisplayDataForTeachers, currentDisplayDataForOtherStaff])

  // ------------------------
  // Filtering Logic
  // ------------------------

  const availableDesignations = useMemo(() => {
    if (activeTab === "teaching") return AllRolesForSchoolStaff.teachingStaff
    if (activeTab === "non-teaching") return AllRolesForSchoolStaff.nonTeachingStaff
    return []
  }, [activeTab, AllRolesForSchoolStaff])

  const filteredStaff = useMemo(() => {
    const list =
      activeTab === "teaching"
        ? currentDisplayDataForTeachers?.satff ?? []
        : currentDisplayDataForOtherStaff?.satff ?? []

    return list.filter((staff) => {
      const fullName = `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.toLowerCase()
      const phone = (staff as any).phone_number ?? ""
      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue.toLowerCase()) ||
        phone.toString().includes(searchValue.toLowerCase())

      const status = (staff as any).employment_status ?? "Active"
      const matchesStatus = statusValue === "All" || status === statusValue

      const gender = (staff as any).gender ?? ""
      const matchesGender = genderValue === "All" || gender === genderValue

      const role = (staff as any).role ?? ""
      const matchesDesignation = designationValue === "All" || role === designationValue

      return matchesSearch && matchesStatus && matchesGender && matchesDesignation
    })
  }, [
    activeTab,
    currentDisplayDataForTeachers,
    currentDisplayDataForOtherStaff,
    searchValue,
    statusValue,
    genderValue,
    designationValue,
  ])

  const handleClearFilters = () => {
    setSearchValue("")
    setStatusValue("All")
    setGenderValue("All")
    setDesignationValue("All")
    setStaffStatusFilter("current")
  }

  // ------------------------
  // CSV Validation & Upload
  // ------------------------

  const validateCsvData = useCallback(
    (data: any[]): ValidationResult[] => {
      const results: ValidationResult[] = []

      data.forEach((row, index) => {
        try {
          const validRoles =
            staffTypeForUpload === "teaching"
              ? AllRolesForSchoolStaff.teachingStaff
              : AllRolesForSchoolStaff.nonTeachingStaff

          if (!validRoles.includes(row.role)) {
            results.push({
              row: index + 2,
              hasErrors: true,
              errors: [
                {
                  field: "role",
                  message: `Invalid role for ${staffTypeForUpload} staff`,
                },
              ],
              rawData: row,
            })
          }

          staffSchemaFoeBulkUpload.parse(row)

          results.push({
            row: index + 2,
            hasErrors: false,
            errors: [],
            rawData: row,
          })
        } catch (error) {
          if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            }))

            const existingResult = results.find((result) => result.row === index + 2)
            if (existingResult) {
              existingResult.errors.push(...formattedErrors)
              existingResult.hasErrors = true
            } else {
              results.push({
                row: index + 2,
                hasErrors: true,
                errors: formattedErrors,
                rawData: row,
              })
            }
          } else {
            results.push({
              row: index + 2,
              hasErrors: true,
              errors: [{ field: "unknown", message: "Unknown validation error" }],
              rawData: row,
            })
          }
        }
      })

      return results
    },
    [AllRolesForSchoolStaff, staffTypeForUpload, staffSchemaFoeBulkUpload],
  )

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

        setIsValidating(true)

        parseFile(file)
          .then((parsed) => {
            if (!parsed.length) {
              setUploadError("Empty file.")
              setIsValidating(false)
              return
            }

            setParsedData(parsed)

            const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")

            if (isExcel) {
              // For Excel, we trust the server's mapping logic for headers like "Mobile No."
              setValidationPassed(true)
              setIsValidating(false)
              return
            }

            const headers = Object.keys(parsed[0])
            const requiredHeaders = staffSchemaFoeBulkUpload.shape
            const missingHeaders = Object.keys(requiredHeaders).filter((header) => !headers.includes(header))

            if (missingHeaders.length > 0) {
              setUploadError(`Missing required headers: ${missingHeaders.join(", ")}`)
              setIsValidating(false)
              return
            }

            const validationResults = validateCsvData(parsed)
            setUploadResults(validationResults)

            const allValid = validationResults.every((result) => !result.hasErrors)
            setValidationPassed(allValid)

            if (!allValid) {
              setUploadError("Please fix validation errors before uploading")
            }

            setIsValidating(false)
          })
          .catch((error) => {
            console.error("File parsing error:", error)
            setUploadError(`Failed to parse file: ${error.message}`)
            setIsValidating(false)
          })
      }
    },
    [validateCsvData, staffSchemaFoeBulkUpload],
  )

  const handleStaffTypeChange = (value: "teaching" | "non-teaching") => {
    setStaffTypeForUpload(value)
    setFileName(null)
    setSelectedFile(null)
    setUploadError(null)
    setUploadResults([])
    setValidationPassed(false)
    setParsedData([])
  }

  const handleFileUploadSubmit = async () => {
    if (!fileName) return alert("Please select a file.")
    if (!StaffRolesForSchool) return alert("Staff roles not loaded. Please try again later.")

    try {
      setIsUploading(true)
      const file = fileInputRef.current?.files?.[0]
      if (!file) return alert("Please select a file.")

      const fileData = await parseFile(file)

      // (staffData is not used in the current API call but kept for possible future use)
      const staffData = fileData.map((row: any) => ({
        ...row,
        staff_role_id:
          staffTypeForUpload === "teaching"
            ? StaffRolesForSchool.find((role: StaffRole) => role.is_teaching_role && role.role === row.role)?.id
            : StaffRolesForSchool.find((role: StaffRole) => !role.is_teaching_role && role.role === row.role)?.id,
      }))
      void staffData // to avoid TS "unused" warning if you like

      const response = await bulkUploadstaff({
        academic_session: CurrentAcademicSessionForSchool!.id,
        file: file,
        type: staffTypeForUpload as "teaching" | "non-teaching",
      })

      if (response.data) {
        if (response.data.totalInserted) {
          setOpenDialogForStaffBulkUpload(false)

          toast({
            title: "Upload Successful",
            description: `Successfully uploaded ${response.data.totalInserted} staff members`,
            variant: "default",
          })

          setFileName(null)
          setSelectedFile(null)
          setUploadResults([])
          setValidationPassed(false)
          setParsedData([])
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }

          staffTypeForUpload && fetchDataForActiveTab(staffTypeForUpload as "teaching" | "non-teaching", 1)
          setFileName(null)
          setStaffTypeForUpload(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
          setOpenDialogForStaffBulkUpload(false)
        }
      } else {
        const errors = (response.error as any).data?.errors
        if (errors) {
          const dbValidationResults: ValidationResult[] = errors.map((error: any, index: number) => ({
            row: index + 1,
            hasErrors: true,
            errors: [
              {
                field: error.field,
                message: error.message,
              },
            ],
            rawData: {},
          }))
          setServerValidationErrors([...dbValidationResults])
          setValidationPassed(false)
        }
      }
    } catch (error: any) {
      if (error?.errors) {
        alert(`Validation error: ${error.errors.join(", ")}`)
      } else {
        console.error("Upload error:", error)
        alert("Upload failed! Try again.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  // ------------------------
  // General helpers
  // ------------------------

  async function fetchDataForActiveTab(type: "teaching" | "non-teaching", page = 1) {
    try {
      setIsLoading(true)
      setError(null)

      if (type === "teaching") {
        const response = await getTeachingStaff({
          academic_sessions: CurrentAcademicSessionForSchool!.id,
          page,
          status_filter: staffStatusFilter,
        })
        if (response.data) {
          setCurrentDisplayDataForTeachers({
            satff: response.data.data,
            meta: response.data.meta,
          })
        }
      } else {
        const response = await getOtherStaff({
          academic_sessions: CurrentAcademicSessionForSchool!.id,
          page,
          status_filter: staffStatusFilter,
        })
        if (response.data) {
          setCurrentDisplayDataForOtherStaff({
            satff: response.data.data,
            meta: response.data.meta,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  function onPageChange(page: number) {
    setCurrentPage(page)
    fetchDataForActiveTab(activeTab as "teaching" | "non-teaching", page)
  }

  const getUniqueFields = useMemo(() => {
    if (!uploadResults.length) return []

    const allFields = new Set<string>()
    uploadResults.forEach((result) => {
      if (result.rawData) {
        Object.keys(result.rawData).forEach((field) => {
          allFields.add(field)
        })
      }
    })
    return Array.from(allFields).sort()
  }, [uploadResults])

  const sortedValidationResults = useMemo(() => {
    if (!uploadResults.length) return []
    return [...uploadResults].sort((a, b) => {
      if (a.hasErrors && !b.hasErrors) return -1
      if (!a.hasErrors && b.hasErrors) return 1
      return a.row - b.row
    })
  }, [uploadResults])

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadDemo = (staffType: "teaching" | "non-teaching") => {
    downloadCSVTemplate(staffType)
  }

  const handleStaffFormOpenChange = (open: boolean) => {
    if (!open) {
      setOpenDialogForStaffForm({
        isOpen: open,
        type: "add",
        selectedStaff: null,
      })
    }
  }

  const handleStaffFormClose = () => {
    setOpenDialogForStaffForm({
      isOpen: false,
      type: "add",
      selectedStaff: null,
    })
  }

  const handleEditStaff = useCallback(
    (staff_id: number) => {
      const teacher = currentDisplayDataForTeachers?.satff.find((t) => t.id === staff_id)
      if (teacher) {
        setOpenDialogForStaffForm({
          isOpen: true,
          type: "edit",
          selectedStaff: teacher,
        })
        setTeacherInitialData(teacher)
      }
    },
    [currentDisplayDataForTeachers],
  )

  const handleEditOtherStaff = useCallback(
    (staff_id: number) => {
      const other = currentDisplayDataForOtherStaff?.satff.find((t) => t.id === staff_id)
      if (other) {
        setOpenDialogForStaffForm({
          isOpen: true,
          type: "edit",
          selectedStaff: other,
        })
        setOtherInitialData(other)
      }
    },
    [currentDisplayDataForOtherStaff],
  )

  const handleAddStaffSubmit = async (data: StaffFormData) => {
    try {
      const new_staff = await AddNewStaff({
        payload: data,
        academic_sessions: CurrentAcademicSessionForSchool!.id,
      })

      if (new_staff.data) {
        toast({
          title: "Success",
          description: "Staff added successfully",
        })

        setOpenDialogForStaffForm({
          isOpen: false,
          type: "add",
          selectedStaff: null,
        })

        const staffType = Boolean(Number(new_staff.data.is_teching_staff)) ? "teaching" : "non-teaching"

        setTimeout(() => {
          if (staffType === "teaching") {
            getTeachingStaff({
              academic_sessions: CurrentAcademicSessionForSchool!.id,
              page: 1,
            })
          } else {
            getOtherStaff({
              academic_sessions: CurrentAcademicSessionForSchool!.id,
              page: 1,
            })
          }
        }, 300)

        setActiveTab(staffType)
      } else if (new_staff.error) {
        toast({
          title: "Error",
          description: "Staff not added",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong !",
        variant: "destructive",
      })
    }
  }

  const handleSubmitForEditStaff = async (data: StaffFormData) => {
    try {
      const updated_staff = await updateStaff({
        payload: data,
        staff_id: openDialogForStaffForm.selectedStaff!.id,
      })

      if (updated_staff.data) {
        toast({
          title: "Success",
          description: "Staff updated successfully",
        })

        setOpenDialogForStaffForm({
          isOpen: false,
          type: "add",
          selectedStaff: null,
        })

        const staffType = Boolean(Number(updated_staff.data.is_teching_staff)) ? "teaching" : "non-teaching"

        setActiveTab(staffType)

        setTimeout(() => {
          if (staffType === "teaching") {
            getTeachingStaff({
              academic_sessions: CurrentAcademicSessionForSchool!.id,
              page: 1,
            })
          } else {
            getOtherStaff({
              academic_sessions: CurrentAcademicSessionForSchool!.id,
              page: 1,
            })
          }
        }, 300)
      } else {
        toast({
          title: "Error",
          description: "Staff not updated",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong !",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    // Just opens confirmation dialog; you can wire actual delete API to the "Delete" button below.
    setIsDelete(true)
  }

  // ------------------------
  // Render
  // ------------------------

  if (StaffRolesForSchool && StaffRolesForSchool.length === 0) {
    return (
      <Alert className="my-6" variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>No Staff Roles Created</AlertTitle>
        <AlertDescription>
          {authState.user?.role_id === 1 ? (
            <>
              <p>You need to create staff roles before you can manage staff members.</p>
              <div className="mt-4">
                <Button
                  onClick={() => navigate("/d/settings/staff")}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Staff Roles
                </Button>
              </div>
            </>
          ) : (
            <p>
              The administrator has not created any staff roles yet. Please contact your administrator to set up staff
              roles before managing staff.
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 max-w-full mx-auto">
        {/* Header & actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-0">{t("staff_management")}</h2>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            {/* Add Staff */}
            <Button
              onClick={() =>
                setOpenDialogForStaffForm({
                  isOpen: true,
                  type: "add",
                  selectedStaff: null,
                })
              }
              disabled={!StaffRolesForSchool || StaffRolesForSchool.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" /> {t("add_staff")}
            </Button>

            {/* Bulk Upload */}
            <Dialog open={openDialogForStaffBulkUpload} onOpenChange={setOpenDialogForStaffBulkUpload}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!StaffRolesForSchool || StaffRolesForSchool.length === 0}>
                  <Upload className="h-4 w-4 ms-2" />
                  <span>{t("upload_csv")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("upload_staff_csv_data")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Step 1: Staff type */}
                  <Card className="border shadow-sm">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{t("select_staff_type")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={staffTypeForUpload || ""}
                        onValueChange={handleStaffTypeChange}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="teaching" id="upload-teaching" />
                          <Label htmlFor="upload-teaching">{t("teaching_staff")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="non-teaching" id="upload-non-teaching" />
                          <Label htmlFor="upload-non-teaching">{t("non_teaching_staff")}</Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {staffTypeForUpload && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadDemo(staffTypeForUpload)}
                          className="w-1/2 mr-2"
                        >
                          {t("download_demo_CSV")}
                        </Button>
                        <Button variant="outline" onClick={handleChooseFile} className="w-1/2 mr-2">
                          {t("choose_file")}
                        </Button>
                      </div>

                      <Input
                        ref={fileInputRef}
                        id="excel-file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
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

                      {/* Summary */}
                      {uploadResults.length > 0 && (
                        <div
                          className={`p-3 rounded-md ${
                            validationPassed
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                          }`}
                        >
                          <div className="flex items-center">
                            {validationPassed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            )}
                            <p
                              className={`text-sm font-medium ${
                                validationPassed ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              {validationPassed
                                ? `All ${uploadResults.length} rows passed validation. Ready to upload.`
                                : `${
                                    uploadResults.filter((r) => r.hasErrors).length
                                  } of ${uploadResults.length} rows have validation errors.`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Server-side validation errors */}
                      {serverValidationErrors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>{t("server_validation_errors")}</AlertTitle>
                          <AlertDescription>
                            {serverValidationErrors.map((err) => (
                              <div key={err.row}>
                                Row {err.row}:{" "}
                                {err.errors.map((e) => `${e.field ?? ""} ${e.message}`).join(", ")}
                              </div>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Optional: View full validation results */}
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
                            !validationPassed ||
                            isValidating ||
                            !StaffRolesForSchool ||
                            StaffRolesForSchool.length === 0
                          }
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("uploading")}
                            </>
                          ) : (
                            t("upload")
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Download Excel */}
            <Button
              variant="outline"
              onClick={() => setDialogOpenForDownLoadExcel(true)}
              disabled={!StaffRolesForSchool || StaffRolesForSchool.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {t("download_excel")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <FilterOptions
          onSearchChange={setSearchValue}
          onStatusChange={setStatusValue}
          onGenderChange={setGenderValue}
          onDesignationChange={setDesignationValue}
          onClearFilters={handleClearFilters}
          searchValue={searchValue}
          statusValue={statusValue}
          genderValue={genderValue}
          designationValue={designationValue}
          availableDesignations={availableDesignations}
          staffStatusFilter={staffStatusFilter}
          onStaffStatusFilterChange={setStaffStatusFilter}
        />

        {/* Retirement warnings */}
        {retirementWarnings.length > 0 && (
          <div className="mb-4 p-4 rounded-lg border border-amber-300 bg-amber-50 flex items-start gap-3">
            <UserX className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Retirement Age Alert</p>
              <p className="text-xs text-amber-700 mt-1">
                The following staff members have reached or exceeded their configured retirement age:
              </p>
              <ul className="mt-2 space-y-0.5">
                {retirementWarnings.map((w) => (
                  <li key={w.id} className="text-xs text-amber-900 font-medium">
                    • {w.name} — Age: {w.age} (Retirement age: {w.threshold})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Tabs + Staff table */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teaching">{t("teaching_staff")}</TabsTrigger>
            <TabsTrigger value="non-teaching">{t("non_teaching_staff")}</TabsTrigger>
          </TabsList>

          {/* Teaching */}
          <TabsContent value="teaching">
            {isTeachingStaffLoading || isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading teaching staff...</span>
              </div>
            ) : currentDisplayDataForTeachers && currentDisplayDataForTeachers.satff.length > 0 ? (
              <StaffTable
                staffList={{
                  staff: currentDisplayDataForTeachers.satff,
                  page_meta: currentDisplayDataForTeachers.meta,
                }}
                filteredStaff={filteredStaff}
                onEdit={handleEditStaff}
                onDelete={handleDelete}
                type="teaching"
                onPageChange={onPageChange}
              />
            ) : (
              <Alert className="my-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>No teaching staff found</AlertTitle>
                <AlertDescription>
                  There are no teaching staff records available.
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setOpenDialogForStaffForm({
                          isOpen: true,
                          type: "add",
                          selectedStaff: null,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add teaching staff
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Non-teaching */}
          <TabsContent value="non-teaching">
            {isTeachingOtherLoading || isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading non-teaching staff...</span>
              </div>
            ) : currentDisplayDataForOtherStaff && currentDisplayDataForOtherStaff.satff.length > 0 ? (
              <StaffTable
                staffList={{
                  staff: currentDisplayDataForOtherStaff.satff,
                  page_meta: currentDisplayDataForOtherStaff.meta,
                }}
                filteredStaff={filteredStaff}
                onEdit={handleEditOtherStaff}
                onDelete={handleDelete}
                type="non-teaching"
                onPageChange={onPageChange}
              />
            ) : (
              <Alert className="my-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>No non-teaching staff found</AlertTitle>
                <AlertDescription>
                  There are no non-teaching staff records available.
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setOpenDialogForStaffForm({
                          isOpen: true,
                          type: "add",
                          selectedStaff: null,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add non-teaching staff
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add / Edit Staff dialog */}
      <Dialog open={openDialogForStaffForm.isOpen} onOpenChange={handleStaffFormOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{openDialogForStaffForm.type === "add" ? "Add New Staff" : "Edit Staff"}</DialogTitle>
          </DialogHeader>

          {openDialogForStaffForm.type === "add" && (
            <StaffForm
              isApiInProgress={isStaffGettingUpdate || isNewStaffCreating}
              onSubmit={handleAddStaffSubmit}
              formType="create"
              onClose={handleStaffFormClose}
            />
          )}

          {openDialogForStaffForm.type === "edit" && openDialogForStaffForm.selectedStaff && (
            <StaffForm
              isApiInProgress={isStaffGettingUpdate || isNewStaffCreating}
              onSubmit={handleSubmitForEditStaff}
              initial_data={openDialogForStaffForm.selectedStaff}
              formType="update"
              onClose={handleStaffFormClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog (wire delete API inside Delete button) */}
      <Dialog open={isdelete} onOpenChange={setIsDelete}>
        <DialogContent className="max-w-md rounded-2xl shadow-lg">
          <DialogHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mx-auto mb-4 w-14 h-14 flex items-center justify-center bg-red-100 rounded-full"
            >
              <Trash className="text-red-600 w-7 h-7" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold text-gray-800">{t("delete_confirmation")}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t("are_you_sure_you_want_to_delete_staff?")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDelete(false)}
              className="px-6 py-2 rounded-lg"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="px-6 py-2 rounded-lg bg-red-600 text-white"
              // TODO: call delete API here, then refresh list & close
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Excel dialog */}
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
            <DialogTitle>{t("download_staff_data")}</DialogTitle>
          </DialogHeader>
          <ExcelDownloadModalForStaff onClose={() => setDialogOpenForDownLoadExcel(false)} />
        </DialogContent>
      </Dialog>

      {/* Validation results dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("validation_results")}</DialogTitle>
          </DialogHeader>
          {sortedValidationResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("no_validation_results_to_show")}</p>
          ) : (
            <div className="space-y-4">
              {sortedValidationResults.map((result) => (
                <Card key={result.row}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Row {result.row} {result.hasErrors ? "(Errors)" : "(OK)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.hasErrors ? (
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>
                            <strong>{err.field}:</strong> {err.message}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-600">{t("no_errors_for_this_row")}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Staff
