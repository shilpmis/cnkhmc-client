"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  useGetLeaveApprovalHierarchyQuery,
  useCreateOrUpdateHierarchyRuleMutation,
  useDeleteHierarchyRuleMutation,
  useGetStaffHierarchyMappingsQuery,
  useUpdateStaffApproverMutation,
  useBulkAssignApproverMutation,
  useGetEligibleApproversQuery,
} from "@/services/LeaveService"
import { useGetDepartmentsQuery } from "@/services/DepartmentService"
import { useGetSchoolStaffRoleQuery } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useToast } from "@/hooks/use-toast"
import type {
  LeaveApprovalHierarchyRule,
  StaffHierarchyMapping,
  CaliberDefinition,
} from "@/types/leave"
import {
  GitBranch,
  Shield,
  Users,
  UserCheck,
  Plus,
  Trash2,
  Search,
  ArrowRight,
  CheckCircle2,
  Building,
  RefreshCw,
  Edit2,
  Sparkles,
  Layers,
  UserPlus,
  AlertCircle,
} from "lucide-react"

export const LeaveApprovalHierarchyTab: React.FC = () => {
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const schoolId = currentAcademicSession?.school_id || 1

  // API Queries
  const {
    data: hierarchyData,
    isLoading: isHierarchyLoading,
    refetch: refetchHierarchy,
  } = useGetLeaveApprovalHierarchyQuery({ academic_year: currentAcademicSession?.id })

  const { data: eligibleApprovers = [], isLoading: isApproversLoading } = useGetEligibleApproversQuery()
  const { data: departments = [] } = useGetDepartmentsQuery({ school_id: schoolId })
  const { data: staffRoles = [] } = useGetSchoolStaffRoleQuery(schoolId)

  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<"rules" | "staff-mappings">("rules")

  // Staff mappings filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedCaliber, setSelectedCaliber] = useState<string>("all")
  const [selectedApproverStatus, setSelectedApproverStatus] = useState<string>("all")
  const [staffPage, setStaffPage] = useState<number>(1)

  const {
    data: staffMappingsData,
    isLoading: isStaffMappingsLoading,
    refetch: refetchStaffMappings,
  } = useGetStaffHierarchyMappingsQuery({
    page: staffPage,
    limit: 15,
    search: searchTerm || undefined,
    department_id: selectedDepartment !== "all" ? selectedDepartment : undefined,
    role_id: selectedRole !== "all" ? selectedRole : undefined,
    caliber_level: selectedCaliber !== "all" ? selectedCaliber : undefined,
    has_approver: selectedApproverStatus !== "all" ? selectedApproverStatus : undefined,
  })

  // Mutations
  const [createOrUpdateRule, { isLoading: isSavingRule }] = useCreateOrUpdateHierarchyRuleMutation()
  const [deleteRule, { isLoading: isDeletingRule }] = useDeleteHierarchyRuleMutation()
  const [updateStaffApprover, { isLoading: isUpdatingApprover }] = useUpdateStaffApproverMutation()
  const [bulkAssignApprover, { isLoading: isBulkAssigning }] = useBulkAssignApproverMutation()

  // Rule Dialog State
  const [ruleDialog, setRuleDialog] = useState<{
    isOpen: boolean
    mode: "create" | "edit"
    data: Partial<LeaveApprovalHierarchyRule> | null
  }>({ isOpen: false, mode: "create", data: null })

  // Staff Assign Dialog State
  const [staffAssignDialog, setStaffAssignDialog] = useState<{
    isOpen: boolean
    staff: StaffHierarchyMapping | null
    approverId: string
    caliberLevel: string
  }>({ isOpen: false, staff: null, approverId: "", caliberLevel: "4" })

  // Bulk Assign Dialog State
  const [bulkAssignDialog, setBulkAssignDialog] = useState<{
    isOpen: boolean
    departmentId: string
    approverId: string
  }>({ isOpen: false, departmentId: "", approverId: "" })

  // Delete Confirm Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    ruleId: number | null
  }>({ isOpen: false, ruleId: null })

  // Caliber Badge styling helper
  const getCaliberBadge = (level: number | null | undefined) => {
    switch (level) {
      case 1:
        return <Badge className="bg-[#ed9254] hover:bg-[#d1783a] text-white font-medium">Level 1: Admin</Badge>
      case 2:
        return <Badge className="bg-slate-800 hover:bg-slate-900 text-white font-medium">Level 2: Principal</Badge>
      case 3:
        return <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[#d1783a] font-medium">Level 3: HOD</Badge>
      case 4:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">Level 4: Faculty / Staff</Badge>
      case 5:
        return <Badge variant="outline" className="text-muted-foreground font-medium">Level 5: Support Staff</Badge>
      default:
        return <Badge variant="outline">Level 4: Staff</Badge>
    }
  }

  // Handle Rule Save
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleDialog.data) return

    try {
      await createOrUpdateRule({
        ...ruleDialog.data,
        academic_year: currentAcademicSession?.id,
      }).unwrap()

      toast({
        title: `Rule ${ruleDialog.mode === "create" ? "created" : "updated"} successfully ✔️`,
        description: "The leave approval hierarchy rule has been saved.",
      })
      setRuleDialog({ isOpen: false, mode: "create", data: null })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to save hierarchy rule",
        description: err?.data?.message || "An unexpected error occurred",
      })
    }
  }

  // Handle Rule Delete
  const handleDeleteRule = async () => {
    if (!deleteDialog.ruleId) return

    try {
      await deleteRule(deleteDialog.ruleId).unwrap()
      toast({
        title: "Rule deleted ✔️",
        description: "The leave approval hierarchy rule has been removed.",
      })
      setDeleteDialog({ isOpen: false, ruleId: null })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete hierarchy rule",
        description: err?.data?.message || "An unexpected error occurred",
      })
    }
  }

  // Handle Staff Single Approver Update
  const handleSaveStaffApprover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffAssignDialog.staff) return

    try {
      await updateStaffApprover({
        staff_id: staffAssignDialog.staff.id,
        reporting_to_staff_id: staffAssignDialog.approverId ? Number(staffAssignDialog.approverId) : null,
        caliber_level: staffAssignDialog.caliberLevel ? Number(staffAssignDialog.caliberLevel) : undefined,
      }).unwrap()

      toast({
        title: "Approver updated successfully ✔️",
        description: `Reporting manager assigned for ${staffAssignDialog.staff.first_name} ${staffAssignDialog.staff.last_name}`,
      })
      setStaffAssignDialog({ isOpen: false, staff: null, approverId: "", caliberLevel: "4" })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to update approver",
        description: err?.data?.message || "An unexpected error occurred",
      })
    }
  }

  // Handle Bulk Assign
  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkAssignDialog.approverId || !bulkAssignDialog.departmentId) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Please select both a department and a designated approver.",
      })
      return
    }

    try {
      const res = await bulkAssignApprover({
        approver_staff_id: Number(bulkAssignDialog.approverId),
        department_id: bulkAssignDialog.departmentId,
      }).unwrap()

      toast({
        title: "Bulk assignment successful ✔️",
        description: res.message || `Assigned approver to staff in department.`,
      })
      setBulkAssignDialog({ isOpen: false, departmentId: "", approverId: "" })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Bulk assignment failed",
        description: err?.data?.message || "An unexpected error occurred",
      })
    }
  }

  const staffList: StaffHierarchyMapping[] = Array.isArray(staffMappingsData)
    ? staffMappingsData
    : staffMappingsData?.data || []
  const staffMeta = !Array.isArray(staffMappingsData) ? staffMappingsData?.meta : undefined

  return (
    <div className="space-y-6">
      {/* 1. VISUAL CALIBER & WORKFLOW GUIDE BANNER */}
      <Card className="border border-orange-200/70 bg-gradient-to-r from-orange-50/40 via-background to-amber-50/25 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#ed9254] text-white shadow-sm">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Leave Approval Hierarchy & Caliber System
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Leaves must be approved by authorities of higher caliber or designated reporting managers.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto bg-white/90 border-orange-200 text-[#d1783a]">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#ed9254]" /> Dynamic Authorization
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {[
              {
                level: 1,
                name: "Admin / Director",
                title: "Level 1 (Highest)",
                badgeClass: "bg-[#ed9254] text-white",
                cardClass: "border-orange-200/90 bg-orange-50/30",
                desc: "Super Approver: approves anyone",
              },
              {
                level: 2,
                name: "Principal / Dean",
                title: "Level 2 (Executive)",
                badgeClass: "bg-slate-800 text-white",
                cardClass: "border-slate-200 bg-slate-50/50",
                desc: "Approves HODs, Teachers & Staff",
              },
              {
                level: 3,
                name: "Head of Dept (HOD)",
                title: "Level 3 (Department)",
                badgeClass: "bg-orange-100 text-[#d1783a] border border-orange-200/80",
                cardClass: "border-orange-200/60 bg-white",
                desc: "Approves staff in their department",
              },
              {
                level: 4,
                name: "Faculty & Staff",
                title: "Level 4 (Operational)",
                badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
                cardClass: "border-slate-200 bg-white",
                desc: "Teachers, Readers, Lecturers, Clerks",
              },
              {
                level: 5,
                name: "Support Staff",
                title: "Level 5 (Support)",
                badgeClass: "bg-gray-50 text-slate-500 border border-slate-200",
                cardClass: "border-slate-200 bg-white",
                desc: "Peons, Attendants, Mess & Hostel",
              },
            ].map((item) => (
              <div
                key={item.level}
                className={`p-3 rounded-lg border ${item.cardClass} flex flex-col justify-between transition-all hover:shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.badgeClass}`}>
                      {item.title}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mt-1.5 text-gray-900">{item.name}</h4>
                </div>
                <p className="text-[11px] mt-2 text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. SUB-TABS: HIERARCHY RULES VS STAFF MAPPINGS */}
      <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as any)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <TabsList className="bg-gray-100/80 p-1">
            <TabsTrigger value="rules" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Shield className="h-4 w-4" />
              Approval Rules
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-orange-100 text-[#d1783a]">
                {hierarchyData?.rules?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="staff-mappings" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Users className="h-4 w-4" />
              Staff Reporting Hierarchy
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeSubTab === "rules" ? (
              <Button
                onClick={() =>
                  setRuleDialog({
                    isOpen: true,
                    mode: "create",
                    data: {
                      require_same_department: true,
                      min_approver_caliber: 3,
                      priority: 1,
                      is_active: true,
                    },
                  })
                }
                className="flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Hierarchy Rule
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setBulkAssignDialog({ isOpen: true, departmentId: "", approverId: "" })}
                className="flex items-center gap-1.5 border-orange-200 text-[#d1783a] hover:bg-orange-50 hover:text-[#d1783a]"
              >
                <Building className="h-4 w-4" /> Bulk Assign by Department
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (activeSubTab === "rules") refetchHierarchy()
                else refetchStaffMappings()
              }}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* ---------------- SUB-TAB 1: HIERARCHY RULES ---------------- */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                Role & Caliber-Based Approval Rules
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Configure which caliber or specific roles can approve leave applications for other roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHierarchyLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading hierarchy rules...
                </div>
              ) : !hierarchyData?.rules || hierarchyData.rules.length === 0 ? (
                <Alert className="bg-slate-50 border-slate-200">
                  <AlertCircle className="h-4 w-4 text-slate-600" />
                  <AlertTitle className="text-sm font-semibold">No Custom Hierarchy Rules Configured</AlertTitle>
                  <AlertDescription className="text-xs text-gray-600 mt-1">
                    The system is currently using the default institutional hierarchy (Level 1 Admin &gt; Level 2 Principal &gt; Level 3 HOD &gt; Level 4 Staff). You can click &quot;Add Hierarchy Rule&quot; to define custom role mappings.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50/75">
                      <TableRow>
                        <TableHead className="w-16">Priority</TableHead>
                        <TableHead>Applicant Role</TableHead>
                        <TableHead>Required Minimum Caliber</TableHead>
                        <TableHead>Department Restriction</TableHead>
                        <TableHead>Designated Approver Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hierarchyData.rules.map((rule) => (
                        <TableRow key={rule.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-xs font-semibold text-gray-600">
                            #{rule.priority}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            {rule.applicant_role?.role || (
                              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                Any Staff Role
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{getCaliberBadge(rule.min_approver_caliber)}</TableCell>
                          <TableCell>
                            {rule.require_same_department ? (
                              <Badge variant="outline" className="bg-orange-50 text-[#d1783a] border-orange-200 font-normal">
                                Must be in Same Dept
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 font-normal">
                                Any Dept
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {rule.approver_role?.role || (
                              <span className="text-xs text-gray-500">Any Higher Caliber</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.is_active ? "default" : "secondary"}>
                              {rule.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRuleDialog({
                                    isOpen: true,
                                    mode: "edit",
                                    data: rule,
                                  })
                                }
                                title="Edit Rule"
                              >
                                <Edit2 className="h-4 w-4 text-[#d1783a]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog({ isOpen: true, ruleId: rule.id })}
                                title="Delete Rule"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- SUB-TAB 2: STAFF REPORTING HIERARCHY ---------------- */}
        <TabsContent value="staff-mappings" className="mt-4 space-y-4">
          {/* Filters Bar */}
          <Card className="bg-gray-50/50 border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search staff name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-white text-xs"
                  />
                </div>

                {/* Department Filter */}
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Role Filter */}
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {staffRoles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Caliber Filter */}
                <Select value={selectedCaliber} onValueChange={setSelectedCaliber}>
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="All Calibers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calibers</SelectItem>
                    <SelectItem value="1">Level 1: Admin</SelectItem>
                    <SelectItem value="2">Level 2: Principal</SelectItem>
                    <SelectItem value="3">Level 3: HOD</SelectItem>
                    <SelectItem value="4">Level 4: Faculty / Staff</SelectItem>
                    <SelectItem value="5">Level 5: Support</SelectItem>
                  </SelectContent>
                </Select>

                {/* Approver Status Filter */}
                <Select value={selectedApproverStatus} onValueChange={setSelectedApproverStatus}>
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="Approver Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approver Statuses</SelectItem>
                    <SelectItem value="assigned">Has Direct Approver</SelectItem>
                    <SelectItem value="unassigned">No Direct Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Employee Direct Approver Mappings
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Explicitly assign a reporting manager of higher caliber to individual employees.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isStaffMappingsLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading staff hierarchy mappings...
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No staff members match the selected filters.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50/75">
                      <TableRow>
                        <TableHead>Employee (Applicant)</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role & Designation</TableHead>
                        <TableHead>Caliber Level</TableHead>
                        <TableHead>Assigned Approver (Approves Leaves)</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.map((staff) => (
                        <TableRow key={staff.id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">
                                {staff.first_name} {staff.middle_name || ""} {staff.last_name}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                Code: {staff.employee_code} {staff.email ? `• ${staff.email}` : ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-gray-700">
                              {staff.department_details?.name || "General / Admin"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="text-xs font-medium text-gray-800">
                                {staff.designation || staff.role_type?.role || "Staff"}
                              </span>
                              {staff.role_type && (
                                <p className="text-[11px] text-gray-500">{staff.role_type.role}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getCaliberBadge(staff.caliber_level)}</TableCell>
                          <TableCell>
                            {staff.reporting_manager ? (
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="h-4 w-4 text-[#d1783a] flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {staff.reporting_manager.first_name} {staff.reporting_manager.last_name}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    {staff.reporting_manager.designation || staff.reporting_manager.role_type?.role || "Manager"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 text-[11px] font-normal">
                                Role Hierarchy Default
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setStaffAssignDialog({
                                  isOpen: true,
                                  staff,
                                  approverId: staff.reporting_to_staff_id ? String(staff.reporting_to_staff_id) : "",
                                  caliberLevel: staff.caliber_level ? String(staff.caliber_level) : "4",
                                })
                              }
                              className="text-xs border-orange-200 text-[#d1783a] hover:bg-orange-50 hover:text-[#d1783a]"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              {staff.reporting_to_staff_id ? "Change Approver" : "Assign Approver"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination controls */}
              {staffMeta && staffMeta.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 text-xs text-gray-600">
                  <span>
                    Showing page {staffMeta.current_page} of {staffMeta.total_pages} ({staffMeta.total_items} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={staffMeta.current_page <= 1}
                      onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={staffMeta.current_page >= staffMeta.total_pages}
                      onClick={() => setStaffPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 3. ADD / EDIT RULE DIALOG */}
      <Dialog
        open={ruleDialog.isOpen}
        onOpenChange={(open) => setRuleDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveRule}>
            <DialogHeader>
              <DialogTitle>
                {ruleDialog.mode === "create" ? "Add Approval Hierarchy Rule" : "Edit Hierarchy Rule"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Define the minimum authority caliber or specific role required to approve leave requests.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Applicant Role */}
              <div className="space-y-1.5">
                <Label htmlFor="applicant_role" className="text-xs font-semibold">
                  Applicant Staff Role
                </Label>
                <Select
                  value={ruleDialog.data?.applicant_role_id ? String(ruleDialog.data.applicant_role_id) : "any"}
                  onValueChange={(val) =>
                    setRuleDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, applicant_role_id: val === "any" ? null : Number(val) },
                    }))
                  }
                >
                  <SelectTrigger id="applicant_role" className="text-xs">
                    <SelectValue placeholder="Select role (or Any Role)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Staff Role (Global)</SelectItem>
                    {staffRoles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Approver Caliber */}
              <div className="space-y-1.5">
                <Label htmlFor="min_caliber" className="text-xs font-semibold">
                  Required Minimum Approver Caliber
                </Label>
                <Select
                  value={String(ruleDialog.data?.min_approver_caliber || 2)}
                  onValueChange={(val) =>
                    setRuleDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, min_approver_caliber: Number(val) },
                    }))
                  }
                >
                  <SelectTrigger id="min_caliber" className="text-xs">
                    <SelectValue placeholder="Select Caliber Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Admin / Management</SelectItem>
                    <SelectItem value="2">Level 2 - Executive (Principal / Dean)</SelectItem>
                    <SelectItem value="3">Level 3 - Department Head (HOD)</SelectItem>
                    <SelectItem value="4">Level 4 - Faculty / Staff</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-500">
                  Only staff with this caliber or higher can approve applications matching this rule.
                </p>
              </div>

              {/* Specific Approver Role (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="approver_role" className="text-xs font-semibold">
                  Specific Approver Role (Optional)
                </Label>
                <Select
                  value={ruleDialog.data?.approver_role_id ? String(ruleDialog.data.approver_role_id) : "any"}
                  onValueChange={(val) =>
                    setRuleDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, approver_role_id: val === "any" ? null : Number(val) },
                    }))
                  }
                >
                  <SelectTrigger id="approver_role" className="text-xs">
                    <SelectValue placeholder="Any Higher Caliber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Higher Caliber Role</SelectItem>
                    {staffRoles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Same Department Required Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Department Matching</Label>
                  <p className="text-[11px] text-gray-500">
                    Approver must be in the applicant&apos;s department (e.g. for HODs)
                  </p>
                </div>
                <Switch
                  checked={Boolean(ruleDialog.data?.require_same_department)}
                  onCheckedChange={(checked) =>
                    setRuleDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, require_same_department: checked },
                    }))
                  }
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs font-semibold">
                  Evaluation Priority
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={99}
                  value={ruleDialog.data?.priority || 1}
                  onChange={(e) =>
                    setRuleDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, priority: Number(e.target.value) },
                    }))
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRuleDialog((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingRule}>
                {isSavingRule ? "Saving..." : ruleDialog.mode === "create" ? "Create Rule" : "Update Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. ASSIGN DIRECT APPROVER DIALOG */}
      <Dialog
        open={staffAssignDialog.isOpen}
        onOpenChange={(open) => setStaffAssignDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveStaffApprover}>
            <DialogHeader>
              <DialogTitle>Assign Reporting Manager / Approver</DialogTitle>
              <DialogDescription className="text-xs">
                Set the higher caliber supervisor who will review and approve leaves for this employee.
              </DialogDescription>
            </DialogHeader>

            {staffAssignDialog.staff && (
              <div className="space-y-4 py-4 text-xs">
                {/* Employee Profile Preview */}
                <div className="p-3 rounded-lg border bg-orange-50/40 border-orange-100 flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-[#ed9254] text-white font-bold text-xs">
                    {staffAssignDialog.staff.first_name[0]}
                    {staffAssignDialog.staff.last_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {staffAssignDialog.staff.first_name} {staffAssignDialog.staff.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Dept: {staffAssignDialog.staff.department_details?.name || "General"} • Code: {staffAssignDialog.staff.employee_code}
                    </p>
                  </div>
                </div>

                {/* Direct Approver Select */}
                <div className="space-y-1.5">
                  <Label htmlFor="approver_select" className="text-xs font-semibold">
                    Direct Leave Approver (Reporting Manager)
                  </Label>
                  <Select
                    value={staffAssignDialog.approverId || "none"}
                    onValueChange={(val) =>
                      setStaffAssignDialog((prev) => ({ ...prev, approverId: val === "none" ? "" : val }))
                    }
                  >
                    <SelectTrigger id="approver_select" className="text-xs">
                      <SelectValue placeholder="Select approver from higher caliber" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="none">None (Fallback to Role Hierarchy Rules)</SelectItem>
                      {eligibleApprovers
                        .filter((ea) => ea.id !== staffAssignDialog.staff?.id)
                        .map((approver) => (
                          <SelectItem key={approver.id} value={String(approver.id)}>
                            {approver.full_name} ({approver.designation} - {approver.department_name})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-500">
                    Only higher caliber authorities (Principals, HODs, Directors) can be assigned.
                  </p>
                </div>

                {/* Caliber Level Override */}
                <div className="space-y-1.5">
                  <Label htmlFor="caliber_select" className="text-xs font-semibold">
                    Staff Caliber Level
                  </Label>
                  <Select
                    value={staffAssignDialog.caliberLevel}
                    onValueChange={(val) => setStaffAssignDialog((prev) => ({ ...prev, caliberLevel: val }))}
                  >
                    <SelectTrigger id="caliber_select" className="text-xs">
                      <SelectValue placeholder="Select Caliber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Admin / Management</SelectItem>
                      <SelectItem value="2">Level 2 - Executive (Principal)</SelectItem>
                      <SelectItem value="3">Level 3 - Department Head (HOD)</SelectItem>
                      <SelectItem value="4">Level 4 - Faculty / Operational Staff</SelectItem>
                      <SelectItem value="5">Level 5 - Support Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStaffAssignDialog((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingApprover}
              >
                {isUpdatingApprover ? "Saving..." : "Save Approver Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. BULK ASSIGN BY DEPARTMENT DIALOG */}
      <Dialog
        open={bulkAssignDialog.isOpen}
        onOpenChange={(open) => setBulkAssignDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleBulkAssign}>
            <DialogHeader>
              <DialogTitle>Bulk Assign Approver by Department</DialogTitle>
              <DialogDescription className="text-xs">
                Quickly designate an HOD or supervisor to approve leaves for all employees in a specific department.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Select Department */}
              <div className="space-y-1.5">
                <Label htmlFor="bulk_dept" className="text-xs font-semibold">
                  Target Department
                </Label>
                <Select
                  value={bulkAssignDialog.departmentId}
                  onValueChange={(val) => setBulkAssignDialog((prev) => ({ ...prev, departmentId: val }))}
                >
                  <SelectTrigger id="bulk_dept" className="text-xs">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Approver */}
              <div className="space-y-1.5">
                <Label htmlFor="bulk_approver" className="text-xs font-semibold">
                  Designated Department Approver (HOD / Manager)
                </Label>
                <Select
                  value={bulkAssignDialog.approverId}
                  onValueChange={(val) => setBulkAssignDialog((prev) => ({ ...prev, approverId: val }))}
                >
                  <SelectTrigger id="bulk_approver" className="text-xs">
                    <SelectValue placeholder="Select Approver" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {eligibleApprovers.map((approver) => (
                      <SelectItem key={approver.id} value={String(approver.id)}>
                        {approver.full_name} ({approver.designation} - {approver.department_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-orange-50/70 border border-orange-200/80 text-[#a05220] text-[11px] leading-relaxed">
                <span className="font-semibold">Note:</span> This will update all staff members in the chosen department to report to this approver (excluding the approver themselves).
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkAssignDialog((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isBulkAssigning}
              >
                {isBulkAssigning ? "Assigning..." : "Apply Bulk Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Hierarchy Rule</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this leave approval hierarchy rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialog({ isOpen: false, ruleId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeletingRule}
              onClick={handleDeleteRule}
            >
              {isDeletingRule ? "Deleting..." : "Delete Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
