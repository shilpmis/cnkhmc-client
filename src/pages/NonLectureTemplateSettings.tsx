import { useState, useMemo, useEffect } from "react"
import {
  useGetNonLectureTemplatesQuery,
  useGetNonLectureTemplateByIdQuery,
  useCreateNonLectureTemplateMutation,
  useUpdateNonLectureTemplateMutation,
  useDeleteNonLectureTemplateMutation,
  useAssignTeachersMutation,
  useRemoveAssignmentMutation,
  useDeleteLogMutation,
  useGetPdfSettingsQuery,
  NonLectureTemplate,
  NonLectureTopic,
  NonLecturePdfConfig,
  DEFAULT_NON_LECTURE_PDF_CONFIG,
} from "@/services/NonLectureService"
import NonLecturePdfConfigurator from "@/components/Settings/NonLecturePdfConfigurator"
import NonLecturePlanEditor from "@/components/NonLecture/NonLecturePlanEditor"
import { useGetDepartmentsQuery } from "@/services/DepartmentService"
import { useGetAcademicClassesQuery } from "@/services/AcademicService"
import { useGetAllSubjectsQuery } from "@/services/subjects"
import { useGetAllTeachingStaffQuery } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  BookOpen,
  Building2,
  GraduationCap,
  Search,
  Layers,
  CheckCircle2,
  Loader2,
  Activity,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Calendar,
  FileText,
  FileDown,
  Download,
  Settings,
  BarChart3,
  Sliders,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"

const ACTIVITY_TYPES = [
  "Clinical Posting",
  "Bedside Clinic",
  "Hospital Duty",
  "Practical / Lab",
  "Tutorial",
  "Seminar",
  "Case Presentation",
  "Community Outreach",
  "Journal Club",
]

const ACTIVITY_BADGE_COLORS: Record<string, string> = {
  "Clinical Posting": "bg-blue-50 text-blue-700 border-blue-200",
  "Bedside Clinic": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Hospital Duty": "bg-rose-50 text-rose-700 border-rose-200",
  "Practical / Lab": "bg-purple-50 text-purple-700 border-purple-200",
  "Tutorial": "bg-amber-50 text-amber-700 border-amber-200",
  "Seminar": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Case Presentation": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Community Outreach": "bg-teal-50 text-teal-700 border-teal-200",
  "Journal Club": "bg-orange-50 text-orange-700 border-orange-200",
}

export default function NonLectureTemplateSettings() {
  const { toast } = useToast()
  const user = useAppSelector(selectCurrentUser)
  const schoolId = user?.school_id || 1
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Navigation tab: 'configurator' (Master Grid) vs 'directory' (Cards)
  const [activeTab, setActiveTab] = useState<string>("configurator")

  // API Queries
  const { data: templatesRes, isLoading, refetch } = useGetNonLectureTemplatesQuery(
    {
      school_id: schoolId,
      academic_session_id: currentAcademicSession?.id,
    },
    { skip: !schoolId }
  )

  const { data: departments = [] } = useGetDepartmentsQuery({ school_id: schoolId }, { skip: !schoolId })
  const { data: classes = [] } = useGetAcademicClassesQuery(schoolId, { skip: !schoolId })
  const { data: subjects = [] } = useGetAllSubjectsQuery(
    { academic_session_id: Number(currentAcademicSession?.id) },
    { skip: !currentAcademicSession?.id }
  )
  const { data: teachingStaff = [] } = useGetAllTeachingStaffQuery(
    { academic_sessions: currentAcademicSession?.id || new Date().getFullYear() },
    { skip: !currentAcademicSession }
  )
  const { data: serverPdfSettingsRes } = useGetPdfSettingsQuery({ school_id: schoolId }, { skip: !schoolId })

  // Mutations
  const [createTemplate, { isLoading: isCreating }] = useCreateNonLectureTemplateMutation()
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateNonLectureTemplateMutation()
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteNonLectureTemplateMutation()
  const [assignTeachers, { isLoading: isAssigning }] = useAssignTeachersMutation()
  const [removeAssignment] = useRemoveAssignmentMutation()
  const [deleteLog] = useDeleteLogMutation()

  // State for Filters and Search
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState<string>("all")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [filterActivityType, setFilterActivityType] = useState<string>("all")

  // Configurator state (Curriculum Master Grid)
  const [selectedConfigTemplateId, setSelectedConfigTemplateId] = useState<string>("")
  const [configuratorSubTab, setConfiguratorSubTab] = useState<string>("topics")

  // Selected Template Detailed Query
  const { data: detailedTemplateRes, isLoading: isDetailedLoading, refetch: refetchDetailed } = useGetNonLectureTemplateByIdQuery(
    { id: Number(selectedConfigTemplateId) },
    { skip: !selectedConfigTemplateId }
  )
  const activeConfigTemplate = detailedTemplateRes?.data

  // Template Form Dialog
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    code: string
    activityType: string
    totalHours: number
    description: string
    departmentId: string
    classId: string
    subjectId: string
    topics: NonLectureTopic[]
  }>({
    title: "",
    code: "",
    activityType: "Clinical Posting",
    totalHours: 10,
    description: "",
    departmentId: "",
    classId: "",
    subjectId: "",
    topics: [],
  })

  // Quick Add Topic Modal inside Configurator
  const [isQuickTopicDialogOpen, setIsQuickTopicDialogOpen] = useState(false)
  const [quickTopicData, setQuickTopicData] = useState<{
    title: string
    hours: number
    activityType: string
    learningObjectives: string
    remarks: string
  }>({
    title: "",
    hours: 2,
    activityType: "Clinical Posting",
    learningObjectives: "",
    remarks: "",
  })

  // Teacher Assignment Dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<NonLectureTemplate | null>(null)
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([])
  const [assignClassId, setAssignClassId] = useState<string>("")
  const [assignBatchName, setAssignBatchName] = useState<string>("All")
  const [assignNotes, setAssignNotes] = useState<string>("")
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>("")

  // View Details Dialog
  const [viewingTemplate, setViewingTemplate] = useState<NonLectureTemplate | null>(null)

  // Delete Confirm Dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const templates = templatesRes?.data || []

  // Auto-select first template in configurator if not selected
  useEffect(() => {
    if (templates.length > 0 && !selectedConfigTemplateId) {
      setSelectedConfigTemplateId(String(templates[0].id))
    }
  }, [templates, selectedConfigTemplateId])

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchSearch =
        tmpl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tmpl.code && tmpl.code.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchClass = filterClass === "all" || String(tmpl.class_id) === filterClass
      const matchDept = filterDepartment === "all" || String(tmpl.department_id) === filterDepartment
      const matchActivity = filterActivityType === "all" || tmpl.activity_type === filterActivityType
      return matchSearch && matchClass && matchDept && matchActivity
    })
  }, [templates, searchTerm, filterClass, filterDepartment, filterActivityType])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = templates.length
    const totalHours = templates.reduce((sum, t) => sum + Number(t.total_hours || 0), 0)
    const totalAssignments = templates.reduce((sum, t) => sum + (t.assignments_count || 0), 0)
    const totalLogs = templates.reduce((sum, t) => sum + (t.logs_count || 0), 0)
    return { totalCount, totalHours, totalAssignments, totalLogs }
  }, [templates])

  // ============================================================
  // EXPORT FUNCTIONS: LOGGED SESSIONS & SYLLABUS
  // ============================================================

  function hexToRgb(hex: string): [number, number, number] {
    let c = (hex || "#1e293b").replace("#", "")
    if (c.length === 3) {
      c = c.split("").map((x) => x + x).join("")
    }
    const num = parseInt(c, 16)
    if (isNaN(num)) return [30, 41, 59]
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
  }

  // 1. Export Logged Activities to PDF (Configurable & Dynamic)
  const handleExportLoggedSessionsPDF = (
    targetTemplate: NonLectureTemplate,
    customConfig?: NonLecturePdfConfig
  ) => {
    const logs = targetTemplate.logs || []

    // Resolve effective PDF config: custom argument > template override > school setting > localStorage > default
    const config: NonLecturePdfConfig =
      customConfig ||
      targetTemplate.pdf_config ||
      serverPdfSettingsRes?.data ||
      (() => {
        const local = localStorage.getItem("non_lecture_pdf_config")
        if (local) {
          try {
            return { ...DEFAULT_NON_LECTURE_PDF_CONFIG, ...JSON.parse(local) }
          } catch {}
        }
        return DEFAULT_NON_LECTURE_PDF_CONFIG
      })()

    const orientation = config.orientation || "landscape"
    const doc = new jsPDF({ orientation, unit: "mm", format: config.pageSize || "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 12
    const usableWidth = pageWidth - margin * 2

    // Header banner
    let currentY = 0
    if (config.showCollegeHeader) {
      const [r, g, b] = hexToRgb(config.themeColor || "#1e293b")
      doc.setFillColor(r, g, b)
      doc.rect(0, 0, pageWidth, 21, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12.5)
      doc.setFont("helvetica", "bold")
      doc.text(
        config.institutionName || "C. N. Kothari Homoeopathic Medical College & Research Centre - VYARA",
        pageWidth / 2,
        9,
        { align: "center" }
      )

      doc.setFontSize(8.5)
      doc.setFont("helvetica", "normal")
      doc.text(
        config.subHeader || "NON-LECTURE / CLINICAL & PRACTICAL LESSON PLAN LOG REPORT",
        pageWidth / 2,
        16.5,
        { align: "center" }
      )
      currentY = 27
    } else {
      currentY = 16
    }

    // Metadata section
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")

    const leftMetaParts = []
    if (config.showCourseTitle) {
      const codePart = config.showCourseCode && targetTemplate.code ? ` (${targetTemplate.code})` : ""
      leftMetaParts.push(`Course / Posting: ${targetTemplate.title}${codePart}`)
    }
    if (leftMetaParts.length > 0) {
      doc.text(leftMetaParts.join(" "), margin, currentY)
    }

    const targetHours = Number(targetTemplate.total_hours || 0)
    const loggedHours = logs.reduce(
      (sum, l: any) => sum + Number(l.hours_spent || l.hoursSpent || 0),
      0
    )
    const pct = targetHours > 0 ? Math.min(100, Math.round((loggedHours / targetHours) * 100)) : 0

    if (config.showHoursProgress) {
      doc.text(
        `Target: ${targetHours} hrs | Completed: ${loggedHours} hrs (${pct}%)`,
        pageWidth - margin,
        currentY,
        { align: "right" }
      )
    }

    currentY += 5

    // Second line of metadata
    const subMetaParts = []
    if (config.showClass) subMetaParts.push(`Class: ${targetTemplate.class?.class || "General"}`)
    if (config.showActivityType) subMetaParts.push(`Activity: ${targetTemplate.activity_type}`)
    if (config.showDepartment) subMetaParts.push(`Dept: ${targetTemplate.department?.name || "General"}`)

    if (subMetaParts.length > 0) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.text(subMetaParts.join(" | "), margin, currentY)
    }

    if (config.showAcademicSession) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.text(
        `Academic Session: ${currentAcademicSession?.session_name || "Current Session"}`,
        pageWidth - margin,
        currentY,
        { align: "right" }
      )
    }

    // Guidelines note
    if (config.showGuidelines && targetTemplate.description) {
      currentY += 4.5
      doc.setFont("helvetica", "italic")
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      const gLines = doc.splitTextToSize(`Guidelines: ${targetTemplate.description}`, usableWidth)
      doc.text(gLines, margin, currentY)
      currentY += gLines.length * 3.2
    } else {
      currentY += 3.5
    }

    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 3.5

    // Dynamic Columns Calculation
    const colDefs: Record<string, any> = config.columns || DEFAULT_NON_LECTURE_PDF_CONFIG.columns
    const enabledColKeys = (Object.keys(colDefs) as Array<keyof typeof colDefs>).filter(
      (k) => colDefs[k].enabled
    )

    const finalColKeys =
      enabledColKeys.length > 0
        ? enabledColKeys
        : ["serialNo", "date", "faculty", "topic", "hours", "activityDetails"]

    const rawCols = finalColKeys.map((k) => ({
      key: k,
      header: colDefs[k]?.label || k,
      nominalWidth: colDefs[k]?.width || 25,
    }))

    const totalNominal = rawCols.reduce((sum, c) => sum + c.nominalWidth, 0)
    const cols = rawCols.map((c) => ({
      ...c,
      width: (c.nominalWidth / totalNominal) * usableWidth,
    }))

    // Draw Table Header
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, currentY, usableWidth, 7, "F")
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)

    let hX = margin
    cols.forEach((c) => {
      doc.text(c.header, hX + 1.5, currentY + 4.8)
      hX += c.width
    })

    currentY += 7

    // Data Rows
    if (logs.length === 0) {
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text("No activity logs recorded yet for this non-lecture session.", margin + 5, currentY + 10)
      currentY += 20
    } else {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(30, 41, 59)

      logs.forEach((log: any, idx: number) => {
        const facultyName = log.staff
          ? `${log.staff.first_name || ""} ${log.staff.last_name || ""}`.trim()
          : "Faculty"
        const topicName = log.topic?.title || "Custom Practical / Unit"
        const hrs = `${log.hours_spent || log.hoursSpent || 1}`
        const batchStr = `${log.batch_name || log.batchName || "All"}`
        const stdsStr = `${log.students_count || log.studentsCount || "-"}`
        const details = log.activity_details || log.activityDetails || "-"
        const cases = log.clinical_cases || log.clinicalCases || "-"
        const outcomes = log.learning_outcomes || log.learningOutcomes || "-"
        const remarks = log.remarks || "-"

        // Map column values to wrapped lines
        const cellLinesMap: Record<string, string[]> = {}
        cols.forEach((col) => {
          let cellText = "-"
          if (col.key === "serialNo") cellText = `${idx + 1}`
          else if (col.key === "date") cellText = log.date || "-"
          else if (col.key === "faculty") cellText = facultyName
          else if (col.key === "topic") cellText = topicName
          else if (col.key === "hours") cellText = `${hrs}h`
          else if (col.key === "batch") cellText = batchStr
          else if (col.key === "studentsCount") cellText = stdsStr
          else if (col.key === "activityDetails") cellText = details
          else if (col.key === "clinicalCases") cellText = cases
          else if (col.key === "learningOutcomes") cellText = outcomes
          else if (col.key === "remarks") cellText = remarks

          cellLinesMap[col.key] = doc.splitTextToSize(cellText, Math.max(8, col.width - 3))
        })

        const maxLines = Math.max(...cols.map((c) => cellLinesMap[c.key]?.length || 1), 1)
        const rowHeight = maxLines * 3.5 + 3

        if (currentY + rowHeight > pageHeight - 25) {
          doc.addPage()
          currentY = 15
          doc.setFillColor(241, 245, 249)
          doc.rect(margin, currentY, usableWidth, 7, "F")
          doc.setFontSize(7.5)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)
          let rx = margin
          cols.forEach((c) => {
            doc.text(c.header, rx + 1.5, currentY + 4.8)
            rx += c.width
          })
          currentY += 7
          doc.setFont("helvetica", "normal")
          doc.setFontSize(7)
          doc.setTextColor(30, 41, 59)
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, currentY, usableWidth, rowHeight, "F")
        }

        let rX = margin
        cols.forEach((col) => {
          const lines = cellLinesMap[col.key] || ["-"]
          doc.text(lines, rX + 1.5, currentY + 3.5)
          rX += col.width
        })

        doc.setDrawColor(226, 232, 240)
        doc.line(margin, currentY + rowHeight, margin + usableWidth, currentY + rowHeight)
        currentY += rowHeight
      })
    }

    // Dynamic Signatures Section
    const sigDefs = config.signatures || DEFAULT_NON_LECTURE_PDF_CONFIG.signatures
    const enabledSigs = (Object.keys(sigDefs) as Array<keyof typeof sigDefs>)
      .filter((k) => sigDefs[k]?.enabled)
      .map((k) => sigDefs[k].label)

    if (enabledSigs.length > 0) {
      if (currentY + 22 > pageHeight - 16) {
        doc.addPage()
        currentY = 20
      } else {
        currentY += 12
      }

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(71, 85, 105)

      const sigSlotWidth = usableWidth / enabledSigs.length
      enabledSigs.forEach((sigLabel, sIdx) => {
        const sigX = margin + sIdx * sigSlotWidth + 5
        doc.text(`${sigLabel}: __________________`, sigX, currentY)
      })
    }

    // Footer Notes & Page Numbers
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(148, 163, 184)

      if (config.showPageNumbers) {
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" })
      }

      if (config.showGenerationDate) {
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, pageHeight - 5)
      }

      if (config.customFooterNote) {
        doc.setFontSize(6.5)
        doc.text(config.customFooterNote, pageWidth / 2, pageHeight - 5, { align: "center" })
      }
    }

    const cleanName = (targetTemplate.code || targetTemplate.title).replace(/[^a-zA-Z0-9]/g, "_")
    doc.save(`NonLecture_Logs_${cleanName}.pdf`)
    toast({ title: "PDF Exported", description: "Configured activity logs report downloaded successfully." })
  }

  // 2. Export Logged Activities to Excel
  const handleExportLoggedSessionsExcel = (targetTemplate: NonLectureTemplate) => {
    const logs = targetTemplate.logs || []
    if (logs.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No activity logs recorded yet to export.",
      })
      return
    }

    const rows = logs.map((l: any, idx: number) => ({
      "S.No": idx + 1,
      "Date": l.date || "",
      "Course / Template": targetTemplate.title,
      "Code": targetTemplate.code || "",
      "Activity Type": targetTemplate.activity_type || "",
      "Class": targetTemplate.class?.class || "General",
      "Department": targetTemplate.department?.name || "General",
      "Faculty": l.staff ? `${l.staff.first_name || ""} ${l.staff.last_name || ""}`.trim() : "Faculty",
      "Curriculum Unit / Topic": l.topic?.title || "Custom Practical / Unit",
      "Hours Spent": Number(l.hours_spent || l.hoursSpent || 1),
      "Batch / Group": l.batch_name || l.batchName || "All",
      "Students Attended": l.students_count || l.studentsCount || "",
      "Activity Details & Work Done": l.activity_details || l.activityDetails || "",
      "Clinical Cases Discussed": l.clinical_cases || l.clinicalCases || "",
      "Learning Outcomes Achieved": l.learning_outcomes || l.learningOutcomes || "",
      "Remarks": l.remarks || "",
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Logged Activities")
    const cleanName = (targetTemplate.code || targetTemplate.title).replace(/[^a-zA-Z0-9]/g, "_")
    XLSX.writeFile(wb, `NonLecture_Logs_${cleanName}.xlsx`)
    toast({ title: "Excel Exported", description: "Non-lecture activity logs downloaded in Excel format." })
  }

  // 3. Export Curriculum Syllabus Sheet to PDF
  const handleExportSyllabusPDF = (targetTemplate: NonLectureTemplate) => {
    const topics = targetTemplate.topics || []
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14

    // Header
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, pageWidth, 22, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text(
      "C. N. Kothari Homoeopathic Medical College & Research Centre",
      pageWidth / 2,
      9,
      { align: "center" }
    )

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("NON-LECTURE CURRICULUM & LESSON PLAN SYLLABUS SHEET", pageWidth / 2, 16.5, { align: "center" })

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(`${targetTemplate.title} (${targetTemplate.code || "NL"})`, margin, 30)

    doc.setFontSize(8.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(71, 85, 105)
    doc.text(
      `Activity Type: ${targetTemplate.activity_type} | Class: ${targetTemplate.class?.class || "General"} | Total Planned Hours: ${targetTemplate.total_hours} hrs`,
      margin,
      36
    )

    if (targetTemplate.description) {
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      const descLines = doc.splitTextToSize(`Guidelines: ${targetTemplate.description}`, pageWidth - margin * 2)
      doc.text(descLines, margin, 42)
    }

    let currentY = targetTemplate.description ? 50 : 42
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 4

    const cols = [
      { header: "Unit #", width: 16 },
      { header: "Curriculum Unit / Topic Title", width: 70 },
      { header: "Hours", width: 16 },
      { header: "Activity Type", width: 30 },
      { header: "Learning Objectives & Competencies", width: 50 },
    ]

    doc.setFillColor(241, 245, 249)
    doc.rect(margin, currentY, 182, 7, "F")
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)

    let hX = margin
    cols.forEach((c) => {
      doc.text(c.header, hX + 2, currentY + 4.8)
      hX += c.width
    })
    currentY += 7

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(30, 41, 59)

    topics.forEach((tp: any, idx: number) => {
      const titleLines = doc.splitTextToSize(tp.title || "", cols[1].width - 4)
      const objLines = doc.splitTextToSize(
        tp.learning_objectives || tp.learningObjectives || "—",
        cols[4].width - 4
      )
      const lineCount = Math.max(titleLines.length, objLines.length, 1)
      const rowHeight = lineCount * 4 + 3

      if (currentY + rowHeight > pageHeight - 20) {
        doc.addPage()
        currentY = 15
        doc.setFillColor(241, 245, 249)
        doc.rect(margin, currentY, 182, 7, "F")
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        let rx = margin
        cols.forEach((c) => {
          doc.text(c.header, rx + 2, currentY + 4.8)
          rx += c.width
        })
        currentY += 7
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.5)
        doc.setTextColor(30, 41, 59)
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, currentY, 182, rowHeight, "F")
      }

      let rX = margin
      doc.text(`#${tp.topic_order || tp.topicOrder || idx + 1}`, rX + 2, currentY + 4)
      rX += cols[0].width
      doc.text(titleLines, rX + 2, currentY + 4)
      rX += cols[1].width
      doc.text(`${tp.hours || 1}h`, rX + 2, currentY + 4)
      rX += cols[2].width
      doc.text(tp.activity_type || tp.activityType || targetTemplate.activity_type, rX + 2, currentY + 4)
      rX += cols[3].width
      doc.text(objLines, rX + 2, currentY + 4)

      doc.setDrawColor(226, 232, 240)
      doc.line(margin, currentY + rowHeight, margin + 182, currentY + rowHeight)
      currentY += rowHeight
    })

    // Signatures
    if (currentY + 25 > pageHeight - 15) {
      doc.addPage()
      currentY = 20
    } else {
      currentY += 12
    }

    doc.setFontSize(8.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(71, 85, 105)
    doc.text("Course Coordinator: ____________", margin, currentY)
    doc.text("HOD: ____________", pageWidth / 2 - 15, currentY)
    doc.text("Principal: ____________", pageWidth - margin - 45, currentY)

    const cleanName = (targetTemplate.code || targetTemplate.title).replace(/[^a-zA-Z0-9]/g, "_")
    doc.save(`NonLecture_Syllabus_${cleanName}.pdf`)
    toast({ title: "Syllabus Exported", description: "Curriculum syllabus sheet downloaded successfully." })
  }

  // ============================================================
  // TEMPLATE MANAGEMENT HANDLERS
  // ============================================================

  const handleOpenTemplateDialog = (tmpl?: NonLectureTemplate) => {
    if (tmpl) {
      setEditingTemplateId(tmpl.id)
      setFormData({
        title: tmpl.title,
        code: tmpl.code || "",
        activityType: tmpl.activity_type || "Clinical Posting",
        totalHours: Number(tmpl.total_hours || 0),
        description: tmpl.description || "",
        departmentId: tmpl.department_id ? String(tmpl.department_id) : "",
        classId: tmpl.class_id ? String(tmpl.class_id) : "",
        subjectId: tmpl.subject_id ? String(tmpl.subject_id) : "",
        topics: tmpl.topics
          ? tmpl.topics.map((t, idx) => ({
              id: t.id,
              topic_order: t.topic_order || (t as any).topicOrder || idx + 1,
              title: t.title,
              hours: Number(t.hours || 1),
              activity_type: t.activity_type || (t as any).activityType || tmpl.activity_type,
              learning_objectives: t.learning_objectives || (t as any).learningObjectives || "",
              remarks: t.remarks || "",
            }))
          : [],
      })
    } else {
      setEditingTemplateId(null)
      setFormData({
        title: "",
        code: "",
        activityType: "Clinical Posting",
        totalHours: 10,
        description: "",
        departmentId: "",
        classId: "",
        subjectId: "",
        topics: [
          {
            topic_order: 1,
            title: "Unit 1: Introduction & Case Taking Orientation",
            hours: 2,
            activity_type: "Clinical Posting",
            learning_objectives: "Orientation to clinical case taking format and bedside ethics.",
            remarks: "",
          },
          {
            topic_order: 2,
            title: "Unit 2: Systemic Examination & Physical Diagnostics",
            hours: 2,
            activity_type: "Clinical Posting",
            learning_objectives: "Hands-on examination of general physical signs.",
            remarks: "",
          },
        ],
      })
    }
    setIsTemplateDialogOpen(true)
  }

  const handleAddTopicRow = () => {
    const nextOrder = formData.topics.length + 1
    setFormData((prev) => ({
      ...prev,
      topics: [
        ...prev.topics,
        {
          topic_order: nextOrder,
          title: `Session ${nextOrder}: New Practical/Clinical Unit`,
          hours: 1,
          activity_type: prev.activityType,
          learning_objectives: "",
          remarks: "",
        },
      ],
    }))
  }

  const handleUpdateTopicField = (index: number, field: keyof NonLectureTopic, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.topics]
      updated[index] = { ...updated[index], [field]: value }
      if (field === "hours") {
        const newTotal = updated.reduce((sum, t) => sum + Number(t.hours || 0), 0)
        return { ...prev, topics: updated, totalHours: newTotal }
      }
      return { ...prev, topics: updated }
    })
  }

  const handleRemoveTopicRow = (index: number) => {
    setFormData((prev) => {
      const updated = prev.topics.filter((_, i) => i !== index)
      const reordered = updated.map((t, idx) => ({ ...t, topic_order: idx + 1 }))
      const newTotal = reordered.reduce((sum, t) => sum + Number(t.hours || 0), 0)
      return { ...prev, topics: reordered, totalHours: newTotal }
    })
  }

  const handleSaveTemplate = async () => {
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Template title is required",
      })
      return
    }

    try {
      const payload: any = {
        title: formData.title.trim(),
        code: formData.code.trim() || undefined,
        activity_type: formData.activityType,
        total_hours: formData.totalHours,
        description: formData.description.trim() || undefined,
        department_id: formData.departmentId ? Number(formData.departmentId) : null,
        class_id: formData.classId ? Number(formData.classId) : null,
        subject_id: formData.subjectId ? Number(formData.subjectId) : null,
        academic_session_id: currentAcademicSession?.id || null,
        school_id: schoolId,
        topics: formData.topics,
      }

      if (editingTemplateId) {
        await updateTemplate({ id: editingTemplateId, ...payload }).unwrap()
        toast({
          title: "Template Updated",
          description: "Non-lecture lesson plan template updated successfully.",
        })
      } else {
        const res = await createTemplate(payload).unwrap()
        toast({
          title: "Template Created",
          description: "Non-lecture lesson plan template created successfully.",
        })
        if (res.data?.id) {
          setSelectedConfigTemplateId(String(res.data.id))
        }
      }
      setIsTemplateDialogOpen(false)
      refetch()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error Saving Template",
        description: err?.data?.message || err.message || "Failed to save template",
      })
    }
  }

  // Quick Add Topic in Master Grid Configurator
  const handleSaveQuickTopic = async () => {
    if (!activeConfigTemplate || !quickTopicData.title.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Topic title is required" })
      return
    }

    try {
      const currentTopics = activeConfigTemplate.topics || []
      const newTopic = {
        topic_order: currentTopics.length + 1,
        title: quickTopicData.title.trim(),
        hours: Number(quickTopicData.hours || 1),
        activity_type: quickTopicData.activityType || activeConfigTemplate.activity_type,
        learning_objectives: quickTopicData.learningObjectives.trim() || undefined,
        remarks: quickTopicData.remarks.trim() || undefined,
      }

      const updatedTopics = [...currentTopics, newTopic]
      const newTotalHours = updatedTopics.reduce((sum, t) => sum + Number(t.hours || 0), 0)

      await updateTemplate({
        id: activeConfigTemplate.id,
        total_hours: newTotalHours,
        topics: updatedTopics,
      }).unwrap()

      toast({ title: "Topic Added", description: "New curriculum topic added to this template." })
      setIsQuickTopicDialogOpen(false)
      setQuickTopicData({
        title: "",
        hours: 2,
        activityType: activeConfigTemplate.activity_type || "Clinical Posting",
        learningObjectives: "",
        remarks: "",
      })
      refetchDetailed()
      refetch()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err?.data?.message || "Could not add topic" })
    }
  }

  // Delete Single Topic in Configurator
  const handleDeleteTopicFromTemplate = async (topicId: number) => {
    if (!activeConfigTemplate) return
    try {
      const remainingTopics = (activeConfigTemplate.topics || []).filter((t) => t.id !== topicId)
      const reordered = remainingTopics.map((t, idx) => ({ ...t, topic_order: idx + 1 }))
      const newTotalHours = reordered.reduce((sum, t) => sum + Number(t.hours || 0), 0)

      await updateTemplate({
        id: activeConfigTemplate.id,
        total_hours: newTotalHours,
        topics: reordered,
      }).unwrap()

      toast({ title: "Topic Removed", description: "Topic removed from template." })
      refetchDetailed()
      refetch()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: "Could not remove topic" })
    }
  }

  // Assign Teachers
  const handleOpenAssignDialog = (tmpl: NonLectureTemplate) => {
    setSelectedTemplateForAssign(tmpl)
    setSelectedStaffIds([])
    setAssignClassId(tmpl.class_id ? String(tmpl.class_id) : "")
    setAssignBatchName("All")
    setAssignNotes("")
    setStaffSearchQuery("")
    setIsAssignDialogOpen(true)
  }

  const handleSaveAssignment = async () => {
    if (!selectedTemplateForAssign) return
    if (selectedStaffIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select at least one teacher to assign.",
      })
      return
    }

    try {
      await assignTeachers({
        template_id: selectedTemplateForAssign.id,
        staff_ids: selectedStaffIds,
        class_id: assignClassId ? Number(assignClassId) : undefined,
        batch_name: assignBatchName || "All",
        academic_session_id: currentAcademicSession?.id,
        notes: assignNotes.trim() || undefined,
      }).unwrap()

      toast({
        title: "Teachers Assigned",
        description: `Successfully assigned ${selectedStaffIds.length} teacher(s) to this non-lecture session.`,
      })
      setIsAssignDialogOpen(false)
      refetch()
      refetchDetailed()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error Assigning Teachers",
        description: err?.data?.message || err.message || "Failed to assign teachers",
      })
    }
  }

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      await removeAssignment({ id: assignmentId }).unwrap()
      toast({
        title: "Assignment Removed",
        description: "Teacher unassigned from this session.",
      })
      refetch()
      refetchDetailed()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove assignment",
      })
    }
  }

  const handleDeleteLogEntry = async (logId: number) => {
    try {
      await deleteLog({ id: logId }).unwrap()
      toast({ title: "Log Deleted", description: "Activity log entry removed." })
      refetchDetailed()
      refetch()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete log entry" })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteTemplate({ id: deleteConfirmId }).unwrap()
      toast({
        title: "Template Deleted",
        description: "Non-lecture template has been removed.",
      })
      setDeleteConfirmId(null)
      refetch()
      if (String(deleteConfirmId) === selectedConfigTemplateId) {
        setSelectedConfigTemplateId("")
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete template",
      })
    }
  }

  const filteredStaffList = useMemo(() => {
    if (!staffSearchQuery.trim()) return teachingStaff
    const q = staffSearchQuery.toLowerCase()
    return teachingStaff.filter((s: any) => {
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase()
      const code = (s.employee_code || "").toLowerCase()
      const desig = (s.designation || "").toLowerCase()
      return name.includes(q) || code.includes(q) || desig.includes(q)
    })
  }, [teachingStaff, staffSearchQuery])

  // Active Config Template Stats
  const activeTemplateStats = useMemo(() => {
    if (!activeConfigTemplate) return { targetHours: 0, loggedHours: 0, pct: 0, remaining: 0 }
    const logs = activeConfigTemplate.logs || []
    const logged = logs.reduce((sum, l: any) => sum + Number(l.hours_spent || l.hoursSpent || 0), 0)
    const target = Number(activeConfigTemplate.total_hours || 0)
    const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0
    const remaining = Math.max(0, target - logged)
    return { targetHours: target, loggedHours: logged, pct, remaining }
  }, [activeConfigTemplate])

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700 shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Non-Lecture Lesson Plan Configurator
              </h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Curriculum Master Grid
              </Badge>
            </div>
            <p className="text-gray-500 font-medium text-sm mt-0.5">
              Configure non-lecture curriculum topics, clinical postings, and practical sessions without Excel,
              and export logged activities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOpenTemplateDialog()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md gap-2"
          >
            <Plus className="h-4 w-4" />
            New Non-Lecture Template
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation: Configurator Master Grid vs Directory Cards */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-3">
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger
              value="configurator"
              className="gap-2 font-bold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs"
            >
              <BarChart3 className="h-4 w-4" />
              Curriculum Master Grid
            </TabsTrigger>
            <TabsTrigger
              value="directory"
              className="gap-2 font-bold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs"
            >
              <Layers className="h-4 w-4" />
              Templates Directory ({templates.length})
            </TabsTrigger>
            <TabsTrigger
              value="pdf_format"
              className="gap-2 font-bold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs"
            >
              <Sliders className="h-4 w-4" />
              PDF Export Format
            </TabsTrigger>
          </TabsList>

          {activeTab === "configurator" && activeConfigTemplate && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <FileDown className="h-4 w-4" />
                    Export Logged Sessions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="text-xs">Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleExportLoggedSessionsPDF(activeConfigTemplate)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-rose-600" />
                    Export Logged Sessions (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportLoggedSessionsExcel(activeConfigTemplate)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Export Logged Sessions (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleExportSyllabusPDF(activeConfigTemplate)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                    Export Syllabus Sheet (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setActiveTab("pdf_format")}
                    className="gap-2 text-xs cursor-pointer font-semibold text-indigo-600"
                  >
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    Configure PDF Format...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: CURRICULUM MASTER GRID CONFIGURATOR (MATCHING SUBJECTS) */}
        {/* ============================================================ */}
        <TabsContent value="configurator" className="pt-4">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Control Column (3 cols) */}
            <div className="xl:col-span-3 space-y-5">
              <Card className="border-none shadow-sm sticky top-6">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-800">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    Select Course / Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Select Non-Lecture Template */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Non-Lecture Template
                    </Label>
                    <Select value={selectedConfigTemplateId} onValueChange={setSelectedConfigTemplateId}>
                      <SelectTrigger className="h-10 text-xs border-gray-200">
                        <SelectValue placeholder="Choose Template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                            {t.title} ({t.activity_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeConfigTemplate && (
                    <>
                      {/* Syllabus Coverage Card */}
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                            Syllabus Coverage
                          </span>
                          <Badge className="bg-indigo-600 text-white border-none font-bold text-xs">
                            {activeTemplateStats.pct}%
                          </Badge>
                        </div>
                        <Progress value={activeTemplateStats.pct} className="h-2 bg-indigo-200/50" />
                        <div className="flex justify-between text-[11px] font-semibold text-indigo-800">
                          <span>Logged: {activeTemplateStats.loggedHours}h</span>
                          <span>Target: {activeTemplateStats.targetHours}h</span>
                        </div>
                      </div>

                      {/* Completed vs Target Cards */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                          <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Completed</p>
                          <p className="text-base font-black text-gray-800">{activeTemplateStats.loggedHours}h</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                          <AlertCircle className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Remaining</p>
                          <p className="text-base font-black text-gray-800">{activeTemplateStats.remaining}h</p>
                        </div>
                      </div>

                      {/* Assigned Faculty Section */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                            Assigned Faculty ({activeConfigTemplate.assignments?.length || 0})
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] text-indigo-600 p-0 hover:bg-transparent hover:underline"
                            onClick={() => handleOpenAssignDialog(activeConfigTemplate)}
                          >
                            + Assign
                          </Button>
                        </div>

                        {activeConfigTemplate.assignments && activeConfigTemplate.assignments.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {activeConfigTemplate.assignments.map((assign: any) => (
                              <div
                                key={assign.id}
                                className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg border text-xs"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {assign.staff?.first_name} {assign.staff?.last_name}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {assign.batch_name || "All Batches"} • {assign.staff?.employee_code}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleRemoveAssignment(assign.id)}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No faculty assigned yet.</p>
                        )}
                      </div>

                      {/* Export Hub Card */}
                      <div className="border-t pt-3 space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <FileDown className="h-3.5 w-3.5 text-indigo-500" />
                          Download &amp; Export
                        </Label>
                        <div className="space-y-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-8 border-gray-200 text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => handleExportLoggedSessionsPDF(activeConfigTemplate)}
                          >
                            <FileText className="h-3.5 w-3.5 text-rose-600 mr-2" />
                            Export Logged Sessions (PDF)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-8 border-gray-200 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleExportLoggedSessionsExcel(activeConfigTemplate)}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 mr-2" />
                            Export Logged Sessions (Excel)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-8 border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleExportSyllabusPDF(activeConfigTemplate)}
                          >
                            <Download className="h-3.5 w-3.5 text-blue-600 mr-2" />
                            Export Syllabus Sheet (PDF)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                            onClick={() => setActiveTab("pdf_format")}
                          >
                            <Sliders className="h-3.5 w-3.5 text-indigo-600 mr-2" />
                            Configure PDF Format
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Master Grid Column (9 cols) */}
            <div className="xl:col-span-9 space-y-4">
              {!activeConfigTemplate ? (
                <Card className="border-2 border-dashed border-gray-200 rounded-3xl py-32 text-center flex flex-col items-center justify-center bg-gray-50/50">
                  <div className="p-5 bg-white rounded-full shadow-md mb-4 text-indigo-400">
                    <BookOpen className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Select a Non-Lecture Template</h3>
                  <p className="text-gray-500 text-sm max-w-sm mt-1">
                    Choose a clinical posting or tutorial template from the left sidebar to configure its curriculum
                    master grid and view recorded logs.
                  </p>
                </Card>
              ) : isDetailedLoading ? (
                <div className="flex items-center justify-center py-40">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Template Title Banner */}
                  <Card className="border-none shadow-sm bg-white overflow-hidden border-t-4 border-t-indigo-600">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs font-bold ${
                                ACTIVITY_BADGE_COLORS[activeConfigTemplate.activity_type] || "bg-gray-100"
                              }`}
                            >
                              {activeConfigTemplate.activity_type}
                            </Badge>
                            {activeConfigTemplate.code && (
                              <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {activeConfigTemplate.code}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-2xl font-extrabold text-gray-900 mt-1">
                            {activeConfigTemplate.title}
                          </CardTitle>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>Class: {activeConfigTemplate.class?.class || "General"}</span>
                            <span>•</span>
                            <span>Department: {activeConfigTemplate.department?.name || "General"}</span>
                            <span>•</span>
                            <span>Total Hours: {activeConfigTemplate.total_hours} hrs</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => handleOpenAssignDialog(activeConfigTemplate)}
                          >
                            <Users className="h-3.5 w-3.5" />
                            Assign Faculty
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => handleOpenTemplateDialog(activeConfigTemplate)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Template
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setActiveTab("pdf_format")}
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            PDF Format
                          </Button>

                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-xs"
                            onClick={() => setIsQuickTopicDialogOpen(true)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Unit / Topic
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Sub-Tabs: Curriculum Topics vs Logged Activity History */}
                  <Tabs value={configuratorSubTab} onValueChange={setConfiguratorSubTab}>
                    <TabsList className="bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger value="topics" className="gap-2 text-xs font-bold">
                        <BookOpen className="h-3.5 w-3.5" />
                        Curriculum Syllabus Units ({activeConfigTemplate.topics?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="logs" className="gap-2 text-xs font-bold">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Logged Activities History ({activeConfigTemplate.logs?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="plan" className="gap-2 text-xs font-bold">
                        <FileText className="h-3.5 w-3.5" />
                        Lesson Plan
                      </TabsTrigger>
                    </TabsList>

                    {/* SUB-TAB 3: Lesson plan with the standard heads */}
                    <TabsContent value="plan" className="pt-3">
                      <NonLecturePlanEditor templateId={Number(activeConfigTemplate.id)} />
                    </TabsContent>

                    {/* SUB-TAB 1: Curriculum Topics Configurator Grid */}
                    <TabsContent value="topics" className="pt-3">
                      <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow>
                              <TableHead className="w-14 text-center">Unit #</TableHead>
                              <TableHead className="w-72">Curriculum Unit / Topic</TableHead>
                              <TableHead className="w-20">Hours</TableHead>
                              <TableHead className="w-36">Activity Type</TableHead>
                              <TableHead>Competencies / Objectives</TableHead>
                              <TableHead className="w-16 text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeConfigTemplate.topics && activeConfigTemplate.topics.length > 0 ? (
                              activeConfigTemplate.topics.map((tp: any, idx: number) => (
                                <TableRow key={tp.id} className="hover:bg-indigo-50/20 transition-colors">
                                  <TableCell className="font-bold text-center text-xs text-gray-500">
                                    #{tp.topic_order || tp.topicOrder || idx + 1}
                                  </TableCell>
                                  <TableCell>
                                    <p className="font-semibold text-xs text-gray-900">{tp.title}</p>
                                    {tp.remarks && (
                                      <p className="text-[11px] text-gray-400 mt-0.5">{tp.remarks}</p>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-bold text-xs text-indigo-700">
                                    {tp.hours} hrs
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-[10px]">
                                      {tp.activity_type || tp.activityType || activeConfigTemplate.activity_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-600">
                                    {tp.learning_objectives || tp.learningObjectives || "—"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                      onClick={() => handleDeleteTopicFromTemplate(tp.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-xs text-gray-400">
                                  No curriculum topics defined yet. Click &quot;Add Unit / Topic&quot; above to add units.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>

                    {/* SUB-TAB 2: Logged Activities History Grid */}
                    <TabsContent value="logs" className="pt-3">
                      <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-3 border-b bg-gray-50/50 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-bold text-gray-900">
                              Logged Activities Record ({activeConfigTemplate.logs?.length || 0})
                            </CardTitle>
                            <CardDescription className="text-xs">
                              All clinical demonstrations, postings, and practical sessions logged by faculty for this template.
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                              onClick={() => handleExportLoggedSessionsPDF(activeConfigTemplate)}
                            >
                              <FileText className="h-3.5 w-3.5 text-rose-600" />
                              Export PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleExportLoggedSessionsExcel(activeConfigTemplate)}
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                              Export Excel
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          {(!activeConfigTemplate.logs || activeConfigTemplate.logs.length === 0) ? (
                            <div className="p-12 text-center text-gray-400 text-xs">
                              No activities logged yet by assigned faculty for this non-lecture session.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader className="bg-gray-50/80">
                                <TableRow>
                                  <TableHead className="w-24">Date</TableHead>
                                  <TableHead className="w-48">Topic / Unit</TableHead>
                                  <TableHead className="w-36">Faculty</TableHead>
                                  <TableHead className="w-16">Hours</TableHead>
                                  <TableHead className="w-24">Batch</TableHead>
                                  <TableHead>Work Conducted &amp; Cases</TableHead>
                                  <TableHead className="w-14 text-center">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {activeConfigTemplate.logs.map((l: any) => (
                                  <TableRow key={l.id} className="hover:bg-indigo-50/20 text-xs transition-colors">
                                    <TableCell className="font-bold text-gray-900">{l.date}</TableCell>
                                    <TableCell className="font-medium text-gray-800">
                                      {l.topic?.title || "Custom Unit"}
                                    </TableCell>
                                    <TableCell className="font-semibold text-indigo-700">
                                      {l.staff ? `${l.staff.first_name} ${l.staff.last_name}` : "Faculty"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-indigo-50 text-indigo-800 font-bold">
                                        {l.hours_spent || l.hoursSpent}h
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {l.batch_name || l.batchName || "All"}
                                      {l.students_count ? ` (${l.students_count} stds)` : ""}
                                    </TableCell>
                                    <TableCell className="space-y-0.5">
                                      <p className="text-gray-800">{l.activity_details || l.activityDetails}</p>
                                      {l.clinical_cases && (
                                        <p className="text-[11px] text-emerald-700 font-semibold">
                                          Cases: {l.clinical_cases}
                                        </p>
                                      )}
                                      {l.learning_outcomes && (
                                        <p className="text-[11px] text-gray-500">
                                          Outcomes: {l.learning_outcomes}
                                        </p>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                        onClick={() => handleDeleteLogEntry(l.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: TEMPLATES DIRECTORY (CARDS OVERVIEW)                  */}
        {/* ============================================================ */}
        <TabsContent value="directory" className="pt-4 space-y-5">
          {/* Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-indigo-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Templates</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalCount}</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <Layers className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned Hours</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalHours} hrs</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Teachers</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalAssignments}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Logs</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalLogs}</h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Activity className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filters */}
          <Card className="shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by template name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-full md:w-48">
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-52">
                <Select value={filterActivityType} onValueChange={setFilterActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Activity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity Types</SelectItem>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Cards Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Non-Lecture Templates Found</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Create non-lecture curriculum templates for bedside clinics, hospital postings, practicals, or
                  tutorials.
                </p>
                <Button onClick={() => handleOpenTemplateDialog()} className="mt-2 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const badgeClass =
                  ACTIVITY_BADGE_COLORS[template.activity_type] || "bg-gray-100 text-gray-800 border-gray-200"

                const loggedHours = Number(template.total_logged_hours || 0)
                const targetHours = Number(template.total_hours || 0)
                const percent = targetHours > 0 ? Math.min(100, Math.round((loggedHours / targetHours) * 100)) : 0

                return (
                  <Card
                    key={template.id}
                    className="flex flex-col justify-between hover:shadow-lg transition-all duration-200 border-t-4 border-t-indigo-600 bg-white"
                  >
                    <div>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 text-xs ${badgeClass}`}>
                            {template.activity_type}
                          </Badge>
                          {template.code && (
                            <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {template.code}
                            </span>
                          )}
                        </div>

                        <CardTitle className="text-lg font-bold text-gray-900 mt-2 leading-snug line-clamp-2">
                          {template.title}
                        </CardTitle>

                        {template.description && (
                          <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3 pb-3">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="truncate">{template.class?.class || "All Classes"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded">
                            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="truncate">{template.department?.name || "General"}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-indigo-50/50">
                          <span className="text-gray-600 font-medium">Curriculum Units:</span>
                          <span className="font-bold text-indigo-700">{template.topics_count || 0} Units</span>
                        </div>

                        {/* Hours progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Logged vs Planned:</span>
                            <span className="font-semibold text-gray-800">
                              {loggedHours} / {targetHours} hrs ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Assigned Teachers Preview */}
                        <div className="border-t pt-2.5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-700 flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-indigo-500" /> Assigned ({template.assignments?.length || 0})
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-indigo-600 p-0 hover:bg-transparent hover:underline"
                              onClick={() => handleOpenAssignDialog(template)}
                            >
                              + Assign
                            </Button>
                          </div>

                          {template.assignments && template.assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {template.assignments.slice(0, 3).map((a) => (
                                <Badge
                                  key={a.id}
                                  variant="secondary"
                                  className="text-[10px] bg-gray-100 text-gray-700 font-medium"
                                >
                                  {a.staff?.first_name} {a.staff?.last_name} ({a.batch_name || "All"})
                                </Badge>
                              ))}
                              {template.assignments.length > 3 && (
                                <Badge variant="outline" className="text-[10px] text-gray-500">
                                  +{template.assignments.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">No teachers assigned yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    <CardFooter className="border-t bg-gray-50/60 p-3 flex items-center justify-between gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => {
                          setSelectedConfigTemplateId(String(template.id))
                          setActiveTab("configurator")
                        }}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Master Grid
                      </Button>

                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs h-8 px-2 border-gray-200">
                              <FileDown className="h-3.5 w-3.5 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleExportLoggedSessionsPDF(template)}
                              className="text-xs gap-2"
                            >
                              <FileText className="h-4 w-4 text-rose-600" />
                              Export Logs (PDF)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportLoggedSessionsExcel(template)}
                              className="text-xs gap-2"
                            >
                              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                              Export Logs (Excel)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportSyllabusPDF(template)}
                              className="text-xs gap-2"
                            >
                              <Download className="h-4 w-4 text-blue-600" />
                              Export Syllabus (PDF)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 w-8 p-0"
                          onClick={() => handleOpenTemplateDialog(template)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs h-8 w-8 p-0"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: PDF EXPORT FORMAT CONFIGURATOR                        */}
        {/* ============================================================ */}
        <TabsContent value="pdf_format" className="pt-4">
          <NonLecturePdfConfigurator
            schoolId={schoolId}
            templates={templates}
            selectedTemplateId={selectedConfigTemplateId}
            onSelectTemplateId={setSelectedConfigTemplateId}
            onExportPdf={handleExportLoggedSessionsPDF}
          />
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* QUICK ADD TOPIC MODAL (FOR MASTER GRID CONFIGURATOR)         */}
      {/* ============================================================ */}
      <Dialog open={isQuickTopicDialogOpen} onOpenChange={setIsQuickTopicDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              Add Unit / Topic to Curriculum
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new clinical demonstration, bedside topic, or practical unit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Unit / Topic Title *</Label>
              <Input
                placeholder="e.g. Case Taking in Respiratory Disorders"
                value={quickTopicData.title}
                onChange={(e) => setQuickTopicData({ ...quickTopicData, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Duration (Hours) *</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={quickTopicData.hours}
                  onChange={(e) => setQuickTopicData({ ...quickTopicData, hours: Number(e.target.value) || 1 })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Activity Type</Label>
                <Select
                  value={quickTopicData.activityType}
                  onValueChange={(val) => setQuickTopicData({ ...quickTopicData, activityType: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Learning Objectives / Competencies</Label>
              <Textarea
                rows={2}
                placeholder="Competencies, clinical outcomes, or skills to be assessed..."
                value={quickTopicData.learningObjectives}
                onChange={(e) => setQuickTopicData({ ...quickTopicData, learningObjectives: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Guidelines / Remarks</Label>
              <Input
                placeholder="Optional notes or references..."
                value={quickTopicData.remarks}
                onChange={(e) => setQuickTopicData({ ...quickTopicData, remarks: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsQuickTopicDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveQuickTopic}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Add to Curriculum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* CREATE / EDIT TEMPLATE MODAL WITH DYNAMIC TOPICS BUILDER      */}
      {/* ============================================================ */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              {editingTemplateId ? "Edit Non-Lecture Template" : "New Non-Lecture Lesson Plan Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the non-lecture syllabus, clinical units, and planned hours directly without requiring an Excel upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Template Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Clinical Medicine Ward Postings & OPD Case Discussion"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template Code (Optional)</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. NL-MED-01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Activity Type *</Label>
                <Select
                  value={formData.activityType}
                  onValueChange={(val) => setFormData({ ...formData, activityType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Class</Label>
                <Select
                  value={formData.classId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, classId: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- All / Not specific --</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject</Label>
                <Select
                  value={formData.subjectId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, subjectId: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not linked to a subject --</SelectItem>
                    {subjects.map((sub: any) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400">Teachers with a timetable period for this subject can log the diary against this plan.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department</Label>
                <Select
                  value={formData.departmentId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, departmentId: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- General / None --</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Total Target Hours *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description / Syllabus Guidelines</Label>
              <Textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Guidelines, learning outcomes, or hospital posting schedules..."
              />
            </div>

            {/* Topics / Syllabus Units Interactive Table */}
            <div className="border rounded-xl p-4 bg-gray-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    Curriculum Topics &amp; Sessions ({formData.topics.length} Units)
                  </h4>
                  <p className="text-xs text-gray-500">
                    Add individual clinical units or practical exercises teachers will record logs against.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTopicRow}
                  className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Unit / Topic
                </Button>
              </div>

              {formData.topics.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg bg-white">
                  <p className="text-xs text-gray-400">No units added yet. Click &quot;Add Unit / Topic&quot; above.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {formData.topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border shadow-2xs"
                    >
                      <div className="col-span-1 text-center font-bold text-xs text-gray-500">
                        #{topic.topic_order}
                      </div>

                      <div className="col-span-5">
                        <Input
                          placeholder="Topic / Unit Title *"
                          value={topic.title}
                          onChange={(e) => handleUpdateTopicField(idx, "title", e.target.value)}
                          className="h-8 text-xs font-medium"
                        />
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            placeholder="Hours"
                            value={topic.hours}
                            onChange={(e) => handleUpdateTopicField(idx, "hours", Number(e.target.value))}
                            className="h-8 text-xs"
                          />
                          <span className="text-[11px] text-gray-500">hrs</span>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <Input
                          placeholder="Objectives / Competency"
                          value={topic.learning_objectives || ""}
                          onChange={(e) => handleUpdateTopicField(idx, "learning_objectives", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTopicRow(idx)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={isCreating || isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTemplateId ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* ASSIGN TEACHERS MODAL                                        */}
      {/* ============================================================ */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Assign Teachers to Non-Lecture Session
            </DialogTitle>
            <DialogDescription>
              Assign faculty members who will be responsible for conducting and logging this session.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplateForAssign && (
            <div className="space-y-4 py-2">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-indigo-950">{selectedTemplateForAssign.title}</h4>
                  <p className="text-xs text-indigo-700">
                    {selectedTemplateForAssign.activity_type} • {selectedTemplateForAssign.total_hours} hrs target
                  </p>
                </div>
                <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
                  {selectedTemplateForAssign.class?.class || "General"}
                </Badge>
              </div>

              {/* Assignment Scope */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Target Batch / Division</Label>
                  <Select value={assignBatchName} onValueChange={setAssignBatchName}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Batches (Whole Class)</SelectItem>
                      <SelectItem value="Batch A">Batch A</SelectItem>
                      <SelectItem value="Batch B">Batch B</SelectItem>
                      <SelectItem value="Batch C">Batch C</SelectItem>
                      <SelectItem value="Batch D">Batch D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Notes / Shift Instructions</Label>
                  <Input
                    className="h-9 text-xs"
                    placeholder="e.g. Morning Ward Posting 9am-12pm"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Currently Assigned Teachers */}
              {selectedTemplateForAssign.assignments && selectedTemplateForAssign.assignments.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50/50 space-y-2">
                  <p className="text-xs font-bold text-gray-700">Currently Assigned Faculty:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplateForAssign.assignments.map((assign) => (
                      <div
                        key={assign.id}
                        className="flex items-center gap-1.5 bg-white border border-gray-200 text-xs px-2.5 py-1 rounded-md shadow-2xs"
                      >
                        <span className="font-semibold text-gray-800">
                          {assign.staff?.first_name} {assign.staff?.last_name}
                        </span>
                        <span className="text-gray-400 font-mono">({assign.batch_name || "All"})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-transparent ml-1"
                          onClick={() => handleRemoveAssignment(assign.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Select Teachers to Assign *</Label>
                  <span className="text-xs text-indigo-600 font-medium">
                    {selectedStaffIds.length} selected
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    className="pl-8 h-8 text-xs"
                    placeholder="Search teacher by name, code or designation..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-48 border rounded-lg p-2 bg-white">
                  <div className="space-y-1">
                    {filteredStaffList.map((staff: any) => {
                      const isSelected = selectedStaffIds.includes(staff.id)
                      return (
                        <div
                          key={staff.id}
                          onClick={() => {
                            setSelectedStaffIds((prev) =>
                              isSelected ? prev.filter((id) => id !== staff.id) : [...prev, staff.id]
                            )
                          }}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs ${
                            isSelected ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {staff.first_name} {staff.last_name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {staff.employee_code} • {staff.designation || "Teaching Staff"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleSaveAssignment}
              disabled={isAssigning || selectedStaffIds.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign Selected Faculty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        onConfirm={handleConfirmDelete}
        title="Delete Non-Lecture Template"
        description="Are you sure you want to delete this template? All associated topic definitions and teacher assignments will be deleted."
      />
    </div>
  )
}
