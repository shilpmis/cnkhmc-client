"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sliders,
  Palette,
  FileText,
  Table as TableIcon,
  CheckCircle2,
  Download,
  RotateCcw,
  Save,
  Eye,
  Building2,
  Users,
  Check,
  Sparkles,
  Layout,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  NonLecturePdfConfig,
  DEFAULT_NON_LECTURE_PDF_CONFIG,
  NonLectureTemplate,
  useGetPdfSettingsQuery,
  useSavePdfSettingsMutation,
  useUpdateNonLectureTemplateMutation,
} from "@/services/NonLectureService"

interface NonLecturePdfConfiguratorProps {
  schoolId: number
  templates: NonLectureTemplate[]
  selectedTemplateId?: string
  onSelectTemplateId?: (id: string) => void
  onExportPdf?: (template: NonLectureTemplate, customConfig?: NonLecturePdfConfig) => void
}

const THEME_PRESETS = [
  { name: "Deep Slate", color: "#1e293b", bgClass: "bg-slate-800" },
  { name: "Royal Indigo", color: "#4338ca", bgClass: "bg-indigo-700" },
  { name: "Medical Emerald", color: "#047857", bgClass: "bg-emerald-700" },
  { name: "Classic Navy", color: "#1e3a8a", bgClass: "bg-blue-900" },
  { name: "Burgundy Crimson", color: "#831843", bgClass: "bg-pink-900" },
  { name: "Charcoal Dark", color: "#374151", bgClass: "bg-gray-700" },
]

export default function NonLecturePdfConfigurator({
  schoolId,
  templates,
  selectedTemplateId = "",
  onSelectTemplateId,
  onExportPdf,
}: NonLecturePdfConfiguratorProps) {
  const { toast } = useToast()

  // API query and mutations for server-persisted default config
  const { data: serverSettingsRes, refetch: refetchSettings } = useGetPdfSettingsQuery({ school_id: schoolId })
  const [savePdfSettings, { isLoading: isSavingSettings }] = useSavePdfSettingsMutation()
  const [updateTemplate, { isLoading: isUpdatingTemplate }] = useUpdateNonLectureTemplateMutation()

  // Scope: 'global' (school default) or 'template' (override for selected template)
  const [scope, setScope] = useState<"global" | "template">("global")
  const [activeTemplateId, setActiveTemplateId] = useState<string>(selectedTemplateId)

  const activeTemplate = useMemo(() => {
    return templates.find((t) => String(t.id) === activeTemplateId) || templates[0] || null
  }, [templates, activeTemplateId])

  // Working config state
  const [config, setConfig] = useState<NonLecturePdfConfig>(() => {
    const local = localStorage.getItem("non_lecture_pdf_config")
    if (local) {
      try {
        return { ...DEFAULT_NON_LECTURE_PDF_CONFIG, ...JSON.parse(local) }
      } catch {
        // ignore
      }
    }
    return DEFAULT_NON_LECTURE_PDF_CONFIG
  })

  // Synchronize when server settings or template changes
  useEffect(() => {
    if (scope === "template" && activeTemplate?.pdf_config) {
      setConfig({ ...DEFAULT_NON_LECTURE_PDF_CONFIG, ...activeTemplate.pdf_config })
    } else if (scope === "global") {
      if (serverSettingsRes?.data) {
        setConfig({ ...DEFAULT_NON_LECTURE_PDF_CONFIG, ...serverSettingsRes.data })
      } else {
        const local = localStorage.getItem("non_lecture_pdf_config")
        if (local) {
          try {
            setConfig({ ...DEFAULT_NON_LECTURE_PDF_CONFIG, ...JSON.parse(local) })
          } catch {
            // ignore
          }
        }
      }
    }
  }, [scope, activeTemplate, serverSettingsRes])

  // Update a top-level field in config
  const updateField = <K extends keyof NonLecturePdfConfig>(key: K, value: NonLecturePdfConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  // Update a column's enabled state or custom label
  const updateColumn = (colKey: keyof NonLecturePdfConfig["columns"], field: "enabled" | "label", val: any) => {
    setConfig((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [colKey]: {
          ...prev.columns[colKey],
          [field]: val,
        },
      },
    }))
  }

  // Update a signature's enabled state or custom label
  const updateSignature = (sigKey: keyof NonLecturePdfConfig["signatures"], field: "enabled" | "label", val: any) => {
    setConfig((prev) => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        [sigKey]: {
          ...prev.signatures[sigKey],
          [field]: val,
        },
      },
    }))
  }

  // Save changes to database
  const handleSave = async () => {
    try {
      if (scope === "global") {
        await savePdfSettings({
          school_id: schoolId,
          config,
        }).unwrap()
        localStorage.setItem("non_lecture_pdf_config", JSON.stringify(config))
        toast({
          title: "Default Format Saved",
          description: "School default PDF export layout has been updated successfully.",
        })
        refetchSettings()
      } else {
        if (!activeTemplate) {
          toast({ variant: "destructive", title: "No Template Selected", description: "Please select a template." })
          return
        }
        await updateTemplate({
          id: activeTemplate.id,
          pdf_config: config,
        }).unwrap()
        toast({
          title: "Template Override Saved",
          description: `Custom PDF format applied specifically to "${activeTemplate.title}".`,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err?.data?.message || err?.message || "Failed to save PDF configuration",
      })
    }
  }

  // Reset to default
  const handleResetToDefault = () => {
    setConfig(DEFAULT_NON_LECTURE_PDF_CONFIG)
    toast({
      title: "Reset to Recommended Layout",
      description: "Default non-lecture PDF structure restored.",
    })
  }

  // Test Export with active config
  const handleExportSample = () => {
    if (onExportPdf) {
      const target = activeTemplate || {
        id: 0,
        title: "Sample Clinical Posting / Demonstration",
        code: "CP-BHMS-3",
        activity_type: "Clinical Posting",
        total_hours: 20,
        description: "Official clinical training syllabus unit covering bedside diagnostic examinations.",
        is_active: true,
        class: { class: "BHMS-III" },
        department: { name: "Practice of Medicine" },
        logs: [
          {
            id: 1,
            template_id: 0,
            staff_id: 1,
            date: new Date().toISOString().split("T")[0],
            hours_spent: 2,
            batch_name: "Batch A",
            students_count: 25,
            activity_details: "Demonstration of respiratory system auscultation and bedside case taking.",
            clinicalCases: "Bronchial asthma; Chronic bronchitis",
            learningOutcomes: "Identify vesicular breathing and wheezing sounds.",
            remarks: "Satisfactory participation by all students.",
            staff: { first_name: "Dr. K.", last_name: "Desai", employee_code: "FAC-104" },
            topic: { title: "Unit 1: Bedside Chest Auscultation" },
          },
          {
            id: 2,
            template_id: 0,
            staff_id: 1,
            date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
            hours_spent: 2,
            batch_name: "Batch B",
            students_count: 24,
            activity_details: "Palpation of abdominal quadrants and organomegaly assessment.",
            clinicalCases: "Hepatomegaly evaluation",
            learningOutcomes: "Liver edge palpation techniques practiced.",
            remarks: "Case summary submitted.",
            staff: { first_name: "Dr. K.", last_name: "Desai", employee_code: "FAC-104" },
            topic: { title: "Unit 2: Abdominal Examination & Palpation" },
          },
        ],
      } as any

      onExportPdf(target, config)
    }
  }

  // Active enabled columns list for preview
  const enabledColumns = Object.entries(config.columns).filter(([_, col]) => col.enabled)

  return (
    <div className="space-y-6">
      {/* Top Scope & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">PDF Export Format Configurator</h2>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              Interactive Designer
            </Badge>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Configure the visual layout, branding colors, metadata, table columns, and signature blocks for non-lecture logged reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScope("global")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scope === "global" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              School Default
            </button>
            <button
              type="button"
              onClick={() => setScope("template")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scope === "template" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Template Override
            </button>
          </div>

          {scope === "template" && (
            <Select
              value={activeTemplateId}
              onValueChange={(val) => {
                setActiveTemplateId(val)
                if (onSelectTemplateId) onSelectTemplateId(val)
              }}
            >
              <SelectTrigger className="h-9 text-xs w-56 border-gray-200">
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
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="h-9 text-xs gap-1.5 text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSample}
            className="h-9 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            Test Export PDF
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSavingSettings || isUpdatingTemplate}
            className="h-9 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            {scope === "global" ? "Save as Default" : "Save Override"}
          </Button>
        </div>
      </div>

      {/* Main Designer Grid: Controls (Left) vs Live Visual Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ============================================================ */}
        {/* LEFT COLUMN: CONFIGURATION CONTROLS (6 cols)                */}
        {/* ============================================================ */}
        <div className="xl:col-span-6 space-y-5">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-xl w-full grid grid-cols-4">
              <TabsTrigger value="branding" className="text-xs font-bold gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="metadata" className="text-xs font-bold gap-1.5">
                <Layout className="h-3.5 w-3.5" />
                Metadata
              </TabsTrigger>
              <TabsTrigger value="columns" className="text-xs font-bold gap-1.5">
                <TableIcon className="h-3.5 w-3.5" />
                Columns ({enabledColumns.length})
              </TabsTrigger>
              <TabsTrigger value="signatures" className="text-xs font-bold gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Signatures
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BRANDING & PAGE FORMAT */}
            <TabsContent value="branding" className="space-y-4 pt-3">
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                  <CardTitle className="text-sm font-bold text-gray-900">Theme Colors &amp; Page Setup</CardTitle>
                  <CardDescription className="text-xs">
                    Configure the header theme color, orientation, and institution text.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  {/* Theme Presets */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Header Banner Theme</Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {THEME_PRESETS.map((p) => {
                        const isSelected = config.themeColor.toLowerCase() === p.color.toLowerCase()
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => updateField("themeColor", p.color)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/30"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <span className={`h-4 w-4 rounded-full ${p.bgClass} shadow-2xs shrink-0`} />
                            <span className="font-semibold text-gray-800 truncate text-[11px]">{p.name}</span>
                            {isSelected && <Check className="h-3 w-3 text-indigo-600 ml-auto shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom Hex Color */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-600">Custom Hex Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.themeColor}
                          onChange={(e) => updateField("themeColor", e.target.value)}
                          className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                        <Input
                          value={config.themeColor}
                          onChange={(e) => updateField("themeColor", e.target.value)}
                          placeholder="#1e293b"
                          className="h-9 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-600">Page Orientation</Label>
                      <Select
                        value={config.orientation}
                        onValueChange={(val: any) => updateField("orientation", val)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape" className="text-xs">
                            Landscape (Recommended for tables)
                          </SelectItem>
                          <SelectItem value="portrait" className="text-xs">
                            Portrait
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Header Title Text */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-[11px] font-bold text-gray-600">Institution Header Banner Text</Label>
                    <Input
                      value={config.institutionName}
                      onChange={(e) => updateField("institutionName", e.target.value)}
                      placeholder="College or Hospital Name..."
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-600">Report Sub-Title</Label>
                    <Input
                      value={config.subHeader}
                      onChange={(e) => updateField("subHeader", e.target.value)}
                      placeholder="NON-LECTURE / CLINICAL & PRACTICAL LESSON PLAN LOG REPORT"
                      className="h-9 text-xs uppercase"
                    />
                  </div>

                  {/* Header Banner Visibility Switch */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                    <div>
                      <p className="font-bold text-gray-800 text-xs">Display Institution Header Banner</p>
                      <p className="text-[11px] text-gray-500">
                        Renders the colored institution header banner block at top of every page.
                      </p>
                    </div>
                    <Switch
                      checked={config.showCollegeHeader}
                      onCheckedChange={(val) => updateField("showCollegeHeader", val)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: METADATA INFORMATION */}
            <TabsContent value="metadata" className="space-y-4 pt-3">
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                  <CardTitle className="text-sm font-bold text-gray-900">Session Information &amp; Summary</CardTitle>
                  <CardDescription className="text-xs">
                    Choose which course attributes and summary metrics appear above the table.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                      <div>
                        <p className="font-bold text-gray-800">Course / Posting Title</p>
                        <p className="text-[11px] text-gray-400">e.g., Clinical Posting Unit III</p>
                      </div>
                      <Switch
                        checked={config.showCourseTitle}
                        onCheckedChange={(val) => updateField("showCourseTitle", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                      <div>
                        <p className="font-bold text-gray-800">Course Code</p>
                        <p className="text-[11px] text-gray-400">e.g., CP-BHMS-3</p>
                      </div>
                      <Switch
                        checked={config.showCourseCode}
                        onCheckedChange={(val) => updateField("showCourseCode", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                      <div>
                        <p className="font-bold text-gray-800">Class &amp; Batch Year</p>
                        <p className="text-[11px] text-gray-400">e.g., BHMS III</p>
                      </div>
                      <Switch checked={config.showClass} onCheckedChange={(val) => updateField("showClass", val)} />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                      <div>
                        <p className="font-bold text-gray-800">Department</p>
                        <p className="text-[11px] text-gray-400">e.g., Practice of Medicine</p>
                      </div>
                      <Switch
                        checked={config.showDepartment}
                        onCheckedChange={(val) => updateField("showDepartment", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                      <div>
                        <p className="font-bold text-gray-800">Activity Type</p>
                        <p className="text-[11px] text-gray-400">e.g., Bedside Clinic, Tutorial</p>
                      </div>
                      <Switch
                        checked={config.showActivityType}
                        onCheckedChange={(val) => updateField("showActivityType", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                      <div>
                        <p className="font-bold text-gray-800">Academic Session</p>
                        <p className="text-[11px] text-gray-400">e.g., 2026-2027</p>
                      </div>
                      <Switch
                        checked={config.showAcademicSession}
                        onCheckedChange={(val) => updateField("showAcademicSession", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border col-span-1 md:col-span-2">
                      <div>
                        <p className="font-bold text-gray-800">Target vs Completed Hours Progress</p>
                        <p className="text-[11px] text-gray-400">
                          Displays: &quot;Target: 20 hrs | Completed: 12 hrs (60%)&quot;
                        </p>
                      </div>
                      <Switch
                        checked={config.showHoursProgress}
                        onCheckedChange={(val) => updateField("showHoursProgress", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border col-span-1 md:col-span-2">
                      <div>
                        <p className="font-bold text-gray-800">Syllabus Guidelines &amp; Description</p>
                        <p className="text-[11px] text-gray-400">
                          Includes posting guidelines or curriculum instructions below metadata
                        </p>
                      </div>
                      <Switch
                        checked={config.showGuidelines}
                        onCheckedChange={(val) => updateField("showGuidelines", val)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: TABLE COLUMNS CONFIGURATION */}
            <TabsContent value="columns" className="space-y-4 pt-3">
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                  <CardTitle className="text-sm font-bold text-gray-900">Table Columns &amp; Headers</CardTitle>
                  <CardDescription className="text-xs">
                    Enable or disable columns and customize the exact column title printed on the PDF table.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
                    {(Object.keys(config.columns) as Array<keyof NonLecturePdfConfig["columns"]>).map((colKey) => {
                      const col = config.columns[colKey]
                      return (
                        <div
                          key={colKey}
                          className={`p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                            col.enabled ? "bg-white" : "bg-gray-50/60 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Switch
                              checked={col.enabled}
                              onCheckedChange={(val) => updateColumn(colKey, "enabled", val)}
                            />
                            <div className="space-y-0.5">
                              <span className="font-bold text-gray-900">{colKey}</span>
                              <p className="text-[10px] text-gray-400">
                                {colKey === "serialNo" && "Sequential index number (#1, #2...)"}
                                {colKey === "date" && "Date on which the posting/session was held"}
                                {colKey === "faculty" && "Teacher name and employee identifier"}
                                {colKey === "topic" && "Curriculum unit or practical demonstration title"}
                                {colKey === "hours" && "Hours spent conducting the session"}
                                {colKey === "batch" && "Assigned batch or student subgroup"}
                                {colKey === "studentsCount" && "Count of students in attendance"}
                                {colKey === "activityDetails" && "Detailed notes on practical work conducted"}
                                {colKey === "clinicalCases" && "Patient cases or pathology examined"}
                                {colKey === "learningOutcomes" && "Competencies and learning outcomes"}
                                {colKey === "remarks" && "Faculty remarks and supervisor notes"}
                              </p>
                            </div>
                          </div>

                          <div className="w-48 shrink-0">
                            <Input
                              value={col.label}
                              disabled={!col.enabled}
                              onChange={(e) => updateColumn(colKey, "label", e.target.value)}
                              placeholder="Header Title"
                              className="h-8 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: SIGNATURES & FOOTER */}
            <TabsContent value="signatures" className="space-y-4 pt-3">
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-gray-50/50">
                  <CardTitle className="text-sm font-bold text-gray-900">Signatures &amp; Footer Notes</CardTitle>
                  <CardDescription className="text-xs">
                    Configure institutional signatures, accreditation disclaimers, and page numbers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  {/* Signature Blocks */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-gray-700">Signature Blocks</Label>
                    {(Object.keys(config.signatures) as Array<keyof NonLecturePdfConfig["signatures"]>).map(
                      (sigKey) => {
                        const sig = config.signatures[sigKey]
                        return (
                          <div
                            key={sigKey}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              sig.enabled ? "bg-white border-gray-200" : "bg-gray-50/70 border-gray-100 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Switch
                                checked={sig.enabled}
                                onCheckedChange={(val) => updateSignature(sigKey, "enabled", val)}
                              />
                              <span className="font-bold text-gray-800 capitalize">
                                {sigKey === "hod" ? "HOD" : sigKey} Signature
                              </span>
                            </div>
                            <div className="w-56">
                              <Input
                                value={sig.label}
                                disabled={!sig.enabled}
                                onChange={(e) => updateSignature(sigKey, "label", e.target.value)}
                                placeholder="Signature Title..."
                                className="h-8 text-xs font-semibold"
                              />
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>

                  {/* Footer & Page Numbers */}
                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-xs font-bold text-gray-700">Footer Options</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                        <div>
                          <p className="font-bold text-gray-800">Show Page Numbers</p>
                          <p className="text-[11px] text-gray-400">e.g., &quot;Page 1 of 2&quot;</p>
                        </div>
                        <Switch
                          checked={config.showPageNumbers}
                          onCheckedChange={(val) => updateField("showPageNumbers", val)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border">
                        <div>
                          <p className="font-bold text-gray-800">Generation Timestamp</p>
                          <p className="text-[11px] text-gray-400">Date/time exported</p>
                        </div>
                        <Switch
                          checked={config.showGenerationDate}
                          onCheckedChange={(val) => updateField("showGenerationDate", val)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <Label className="text-[11px] font-bold text-gray-600">Custom Footer Disclaimer / Note</Label>
                      <Textarea
                        value={config.customFooterNote || ""}
                        onChange={(e) => updateField("customFooterNote", e.target.value)}
                        placeholder="e.g., Official Teaching & Clinical Record..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: LIVE VISUAL PDF DOCUMENT PREVIEW (6 cols)     */}
        {/* ============================================================ */}
        <div className="xl:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">Live PDF Document Preview</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold text-gray-500 bg-white">
                {config.orientation === "landscape" ? "A4 Landscape (297×210mm)" : "A4 Portrait (210×297mm)"}
              </Badge>
              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                {enabledColumns.length} Columns Active
              </Badge>
            </div>
          </div>

          {/* Interactive Scaled A4 Document Mockup */}
          <div className="bg-gray-200/80 p-4 rounded-2xl border shadow-inner overflow-hidden flex justify-center">
            <div
              className={`bg-white shadow-2xl rounded-sm border border-gray-300 transition-all duration-200 flex flex-col justify-between ${
                config.orientation === "landscape"
                  ? "w-full max-w-[780px] min-h-[490px]"
                  : "w-full max-w-[520px] min-h-[660px]"
              }`}
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "10px",
              }}
            >
              {/* Top Banner Header */}
              {config.showCollegeHeader ? (
                <div
                  className="px-6 py-3.5 text-center text-white transition-colors"
                  style={{ backgroundColor: config.themeColor }}
                >
                  <h4 className="text-[12px] font-black tracking-wide leading-tight">
                    {config.institutionName || "Institution Name"}
                  </h4>
                  <p className="text-[9px] font-medium tracking-wider opacity-90 mt-0.5">
                    {config.subHeader || "NON-LECTURE LESSON PLAN LOG REPORT"}
                  </p>
                </div>
              ) : (
                <div className="pt-4 px-6 text-center border-b pb-2">
                  <h4 className="text-[12px] font-black text-gray-800">
                    {config.institutionName || "Institution Name"}
                  </h4>
                  <p className="text-[9px] font-medium text-gray-500">{config.subHeader}</p>
                </div>
              )}

              {/* Document Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                {/* Metadata Row */}
                <div className="border-b pb-2.5 text-[9px] space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {config.showCourseTitle && (
                        <p className="font-black text-gray-900 text-[10px]">
                          Course / Posting: {activeTemplate?.title || "Clinical Posting Unit III"}{" "}
                          {config.showCourseCode && `(${activeTemplate?.code || "CP-BHMS-3"})`}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 text-gray-600 mt-0.5">
                        {config.showClass && <span>Class: {activeTemplate?.class?.class || "BHMS III"}</span>}
                        {config.showActivityType && (
                          <>
                            <span>•</span>
                            <span>Activity: {activeTemplate?.activity_type || "Clinical Posting"}</span>
                          </>
                        )}
                        {config.showDepartment && (
                          <>
                            <span>•</span>
                            <span>Dept: {activeTemplate?.department?.name || "Practice of Medicine"}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {config.showHoursProgress && (
                        <p className="font-black text-indigo-900 text-[10px]">
                          Target: {activeTemplate?.total_hours || 20} hrs | Completed: 4 hrs (20%)
                        </p>
                      )}
                      {config.showAcademicSession && (
                        <p className="text-gray-500 text-[9px]">Academic Session: 2026-2027</p>
                      )}
                    </div>
                  </div>

                  {config.showGuidelines && activeTemplate?.description && (
                    <p className="text-[8.5px] text-gray-500 italic mt-1 bg-gray-50 p-1.5 rounded border border-gray-100">
                      Guidelines: {activeTemplate.description}
                    </p>
                  )}
                </div>

                {/* Table Mockup */}
                <div className="flex-1 overflow-x-auto border rounded-sm">
                  <table className="w-full border-collapse text-[8.5px]">
                    <thead>
                      <tr className="bg-gray-100 border-b text-gray-800">
                        {enabledColumns.map(([key, col]) => (
                          <th key={key} className="py-1.5 px-2 text-left font-bold border-r last:border-r-0 truncate">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr className="hover:bg-gray-50/50">
                        {enabledColumns.map(([key]) => {
                          if (key === "serialNo") return <td key={key} className="p-1.5 font-bold border-r">1</td>
                          if (key === "date") return <td key={key} className="p-1.5 border-r">2026-10-14</td>
                          if (key === "faculty") return <td key={key} className="p-1.5 font-semibold text-indigo-700 border-r">Dr. K. Desai</td>
                          if (key === "topic") return <td key={key} className="p-1.5 font-medium border-r">Unit 1: Bedside Chest Auscultation</td>
                          if (key === "hours") return <td key={key} className="p-1.5 font-bold text-center border-r">2h</td>
                          if (key === "batch") return <td key={key} className="p-1.5 border-r">Batch A</td>
                          if (key === "studentsCount") return <td key={key} className="p-1.5 text-center border-r">25</td>
                          if (key === "activityDetails") return <td key={key} className="p-1.5 border-r">Demonstration of vesicular sounds</td>
                          if (key === "clinicalCases") return <td key={key} className="p-1.5 text-emerald-700 border-r">Asthma; Bronchitis</td>
                          if (key === "learningOutcomes") return <td key={key} className="p-1.5 border-r">Auscultation practiced</td>
                          if (key === "remarks") return <td key={key} className="p-1.5">Satisfactory</td>
                          return <td key={key} className="p-1.5 border-r">-</td>
                        })}
                      </tr>
                      <tr className="bg-gray-50/40">
                        {enabledColumns.map(([key]) => {
                          if (key === "serialNo") return <td key={key} className="p-1.5 font-bold border-r">2</td>
                          if (key === "date") return <td key={key} className="p-1.5 border-r">2026-10-12</td>
                          if (key === "faculty") return <td key={key} className="p-1.5 font-semibold text-indigo-700 border-r">Dr. K. Desai</td>
                          if (key === "topic") return <td key={key} className="p-1.5 font-medium border-r">Unit 2: Abdominal Palpation</td>
                          if (key === "hours") return <td key={key} className="p-1.5 font-bold text-center border-r">2h</td>
                          if (key === "batch") return <td key={key} className="p-1.5 border-r">Batch B</td>
                          if (key === "studentsCount") return <td key={key} className="p-1.5 text-center border-r">24</td>
                          if (key === "activityDetails") return <td key={key} className="p-1.5 border-r">Palpation of abdominal quadrants</td>
                          if (key === "clinicalCases") return <td key={key} className="p-1.5 text-emerald-700 border-r">Hepatomegaly assessment</td>
                          if (key === "learningOutcomes") return <td key={key} className="p-1.5 border-r">Edge palpation mastered</td>
                          if (key === "remarks") return <td key={key} className="p-1.5">Log signed</td>
                          return <td key={key} className="p-1.5 border-r">-</td>
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures Section */}
                {Object.values(config.signatures).some((s) => s.enabled) && (
                  <div className="pt-4 border-t mt-auto">
                    <div className="flex justify-between items-center text-[9px] text-gray-600 px-4">
                      {Object.entries(config.signatures).map(([key, sig]) => {
                        if (!sig.enabled) return null
                        return (
                          <div key={key} className="text-center">
                            <div className="border-t border-gray-400 w-28 pt-1">
                              <p className="font-bold text-gray-800 text-[8.5px]">{sig.label}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Footer */}
              <div className="px-4 py-2 border-t bg-gray-50/50 flex justify-between items-center text-[8px] text-gray-400">
                <span>
                  {config.showGenerationDate && `Generated on: ${new Date().toLocaleDateString()}`}
                </span>
                <span className="truncate max-w-[280px] font-medium text-gray-500">
                  {config.customFooterNote}
                </span>
                <span>{config.showPageNumbers && "Page 1 of 1"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
