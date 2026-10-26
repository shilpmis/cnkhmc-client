import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import {
  Plus,
  UserPlus,
  Users,
  Shield,
  BookOpen,
  RefreshCw,
  Edit,
  UserX,
  UserCheck,
  AlertCircle,
  Trash2,
  Key,
  ShieldCheck,
  FileCode,
  Sparkles,
} from "lucide-react"
import type { User, PolicyTemplate, PolicyRule } from "@/types/user"
import { ACTIONS, ACTION_LABELS, MODULES } from "@/permissions/catalog"
import type { PageMeta } from "@/types/global"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  useLazyFetchManagementUsersQuery,
  useLazyFetchOnBoardedUserQuery,
  useLazyFetchNonOnBoardedTeacherQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useOnBoardTeacherAsUserMutation,
  useUpdateOnBoardTeacherAsUserMutation,
  useFetchPoliciesQuery,
  useCreatePolicyMutation,
  useDeletePolicyMutation,
} from "@/services/UserManagementService"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { StaffType } from "@/types/staff"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import type { AssignedClasses } from "@/types/class"

// Predefined management roles
const managementRoles = [
  { id: 1, role: "ADMIN", value: "Admin", description: "Full access to all system features" },
  {
    id: 2,
    role: "PRINCIPAL",
    value: "Principal",
    description: "School-wide access with limited administrative capabilities",
  },
  { id: 3, role: "HEAD TEACHER", value: "Head Teacher", description: "Department-level access and teacher management" },
  { id: 4, role: "CLERK", value: "Clerk", description: "Administrative tasks and record management" },
  { id: 5, role: "IT ADMIN", value: "IT Admin", description: "Technical support and system configuration" },
]

const userFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  role_id: z.string().min(1, { message: "Role is required" }),
  is_active: z.boolean().optional().default(true),
})

type UserFormValues = z.infer<typeof userFormSchema>

export const UserManagement: React.FC = () => {
  const { t } = useTranslation()
  const currentUser = useAppSelector((state) => state.auth.user)
  const academicClasses = useAppSelector(selectAcademicClasses)
  const academicDivisions = useAppSelector(selectAllAcademicClasses)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // API hooks
  const [fetchUsers, { isLoading: isLoadingManagementUsers }] = useLazyFetchManagementUsersQuery()
  const [fetchOnBoardedUsers, { isLoading: isLoadingOnboardedUsers }] = useLazyFetchOnBoardedUserQuery()
  const [fetchNonOnBoardedTeachers, { isLoading: isLoadingNonOnboardedTeachers, data: nonOnboardedTeachers }] =
    useLazyFetchNonOnBoardedTeacherQuery()
  const [getAcademicClasses, { isLoading: isLoadingClasses }] = useLazyGetAcademicClassesQuery()
  const [addUser, { isLoading: isAddingUser }] = useAddUserMutation()
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation()
  const [onboardTeacher, { isLoading: isOnboardingTeacher }] = useOnBoardTeacherAsUserMutation()
  const [updateOnBoardedStaff, { isLoading: isUpdatingTeacherClasses }] = useUpdateOnBoardTeacherAsUserMutation()

  // Permission Templates (Policies) hooks
  const { data: policiesList, isLoading: isLoadingPolicies, refetch: refetchPolicies } = useFetchPoliciesQuery()
  const [createPolicy, { isLoading: isCreatingPolicy }] = useCreatePolicyMutation()
  const [deletePolicy, { isLoading: isDeletingPolicy }] = useDeletePolicyMutation()

  // State
  const [activeTab, setActiveTab] = useState("management")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedStaffCategory, setSelectedStaffCategory] = useState<string>("all")
  const [onboardDialogStaffCategory, setOnboardDialogStaffCategory] = useState<string>("all")

  const [managementUsers, setManagementUsers] = useState<{ users: User[]; page_meta: PageMeta } | null>(null)
  const [onboardedTeachers, setOnboardedTeachers] = useState<{ users: User[]; page_meta: PageMeta } | null>(null)

  // Dialog states
  const [isManagementUserDialogOpen, setIsManagementUserDialogOpen] = useState(false)
  const [isOnboardTeacherDialogOpen, setIsOnboardTeacherDialogOpen] = useState(false)
  const [isClassAllocationDialogOpen, setIsClassAllocationDialogOpen] = useState(false)
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isCreatePolicyDialogOpen, setIsCreatePolicyDialogOpen] = useState(false)

  // User Policy selection state
  const [selectedUserPolicyIds, setSelectedUserPolicyIds] = useState<number[]>([])

  // Create Policy Template form state
  const [newPolicyName, setNewPolicyName] = useState("")
  const [newPolicyDesc, setNewPolicyDesc] = useState("")
  const [newPolicyRules, setNewPolicyRules] = useState<{ action: string; subject: string; inverted?: boolean }[]>([
    { action: "read", subject: "Student" },
  ])

  // Selected items
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<StaffType | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [unassignClasses, setUnassignClasses] = useState<number[]>([])
  const [onboardUsername, setOnboardUsername] = useState<string>("")
  const [onboardPassword, setOnboardPassword] = useState<string>("")

  // Helper to categorize staff members
  const getStaffCategory = (staff?: StaffType | null, userRoleId?: number) => {
    if (staff) {
      const rawStaffType = (staff.staff_type || "").trim().toLowerCase()
      if (rawStaffType.includes("hospital")) {
        return { label: "Hospital Staff", variant: "secondary" as const, color: "bg-emerald-100 text-emerald-800 border-emerald-200" }
      }
      if (
        rawStaffType.includes("non-teaching") ||
        rawStaffType.includes("non teaching") ||
        rawStaffType.includes("hostel") ||
        rawStaffType.includes("mess") ||
        rawStaffType === "other"
      ) {
        return { label: "Non-Teaching Staff", variant: "outline" as const, color: "bg-amber-100 text-amber-800 border-amber-200" }
      }
      if (rawStaffType.includes("teaching")) {
        return { label: "Teaching Staff", variant: "default" as const, color: "bg-blue-100 text-blue-800 border-blue-200" }
      }

      // Check role_type.is_teaching_role if staff_type is empty or ambiguous
      const roleTypeTeaching = staff.role_type?.is_teaching_role
      if (roleTypeTeaching === false || roleTypeTeaching === 0) {
        return { label: "Non-Teaching Staff", variant: "outline" as const, color: "bg-amber-100 text-amber-800 border-amber-200" }
      }
      if (roleTypeTeaching === true || roleTypeTeaching === 1) {
        return { label: "Teaching Staff", variant: "default" as const, color: "bg-blue-100 text-blue-800 border-blue-200" }
      }

      // Check is_teching_staff flag on staff record
      if (staff.is_teching_staff === false || staff.is_teching_staff === 0) {
        return { label: "Non-Teaching Staff", variant: "outline" as const, color: "bg-amber-100 text-amber-800 border-amber-200" }
      }
      if (staff.is_teching_staff === true || staff.is_teching_staff === 1) {
        return { label: "Teaching Staff", variant: "default" as const, color: "bg-blue-100 text-blue-800 border-blue-200" }
      }
    }

    // Fallback if staff object is missing or completely ambiguous
    if (userRoleId === 12) {
      return { label: "Non-Teaching Staff", variant: "outline" as const, color: "bg-amber-100 text-amber-800 border-amber-200" }
    }
    if (userRoleId === 6) {
      return { label: "Teaching Staff", variant: "default" as const, color: "bg-blue-100 text-blue-800 border-blue-200" }
    }
    return { label: "Staff", variant: "secondary" as const, color: "bg-gray-100 text-gray-800 border-gray-200" }
  }

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.school_id) {
      fetchDataForActiveTab(activeTab, 1)

      if (!academicClasses) {
        getAcademicClasses(currentUser.school_id)
      }
    }
  }, [currentUser, activeTab, selectedRole, selectedStatus, selectedStaffCategory])

  // Fetch data based on active tab
  const fetchDataForActiveTab = async (tab: string, page: number) => {
    if (!currentUser?.school_id) return

    if (tab === "management") {
      try {
        const response = await fetchUsers({
          type: "management",
          school_id: currentUser.school_id,
          page,
        })

        if (response.data) {
          setManagementUsers({
            users: response.data.data,
            page_meta: response.data.meta,
          })
        }
      } catch (error) {
        toast({
          title: t("error"),
          description: "Failed to fetch management users",
          variant: "destructive",
        })
      }
    } else if (tab === "staff") {
      try {
        const response = await fetchOnBoardedUsers({
          school_id: currentUser.school_id,
          page,
          staff_category: selectedStaffCategory !== "all" ? selectedStaffCategory : undefined,
        })

        if (response.data) {
          setOnboardedTeachers({
            users: response.data.data,
            page_meta: response.data.meta,
          })
        }
      } catch (error) {
        toast({
          title: t("error"),
          description: "Failed to fetch onboarded staff",
          variant: "destructive",
        })
      }
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchDataForActiveTab(activeTab, page)
  }

  // Reset filters
  const [isResetting, setIsResetting] = useState(false)

  const resetFilters = async () => {
    setIsResetting(true)
    setSearchTerm("")
    setSelectedRole("")
    setSelectedStatus("")
    setSelectedStaffCategory("all")

    try {
      await fetchDataForActiveTab(activeTab, 1)
    } finally {
      setIsResetting(false)
    }
  }

  // Filtered staff users in table
  const filteredStaffUsers = useMemo(() => {
    if (!onboardedTeachers?.users) return []
    return onboardedTeachers.users.filter((user) => {
      const staffName = `${user.staff?.first_name || ""} ${user.staff?.middle_name || ""} ${user.staff?.last_name || ""} ${user.name || ""}`.toLowerCase()
      const username = (user.username || user.email || "").toLowerCase()
      const matchesSearch = !searchTerm || staffName.includes(searchTerm.toLowerCase()) || username.includes(searchTerm.toLowerCase())

      const matchesStatus =
        !selectedStatus ||
        selectedStatus === "all" ||
        (selectedStatus === "active" && Boolean(Number(user.is_active))) ||
        (selectedStatus === "inactive" && !Boolean(Number(user.is_active)))

      return matchesSearch && matchesStatus
    })
  }, [onboardedTeachers, searchTerm, selectedStatus])

  // Handle add management user
  const handleAddManagementUser = () => {
    setSelectedUser(null)
    setSelectedUserPolicyIds([])
    setIsManagementUserDialogOpen(true)
  }

  // Handle edit management user
  const handleEditManagementUser = (user: User) => {
    setSelectedUser(user)
    setSelectedUserPolicyIds(user.policies ? user.policies.map((p) => p.id) : [])
    setIsManagementUserDialogOpen(true)
  }

  // Handle onboard staff member
  const handleOnboardTeacher = (category?: string) => {
    setSelectedTeacher(null)
    setSelectedClasses([])
    setUnassignClasses([])
    setOnboardUsername("")
    setOnboardPassword("")
    setSelectedUserPolicyIds([])
    const cat = category || onboardDialogStaffCategory || "all"
    if (category) {
      setOnboardDialogStaffCategory(category)
    }
    if (currentUser?.school_id) {
      fetchNonOnBoardedTeachers({
        page: 1,
        school_id: currentUser.school_id,
        academic_sessions: CurrentAcademicSessionForSchool?.id,
        staff_category: cat !== "all" ? cat : undefined,
      })
    }
    setIsOnboardTeacherDialogOpen(true)
  }

  // Switch category filter inside onboard dialog
  const handleDialogCategoryChange = (category: string) => {
    setOnboardDialogStaffCategory(category)
    setSelectedTeacher(null)
    setSelectedClasses([])
    if (currentUser?.school_id) {
      fetchNonOnBoardedTeachers({
        page: 1,
        school_id: currentUser.school_id,
        academic_sessions: CurrentAcademicSessionForSchool?.id,
        staff_category: category !== "all" ? category : undefined,
      })
    }
  }

  // Handle class allocation for teacher
  const handleClassAllocation = (teacherUser: User) => {
    setSelectedUser(teacherUser)
    setSelectedUserPolicyIds(teacherUser.policies ? teacherUser.policies.map((p) => p.id) : [])
    if (teacherUser.staff) {
      setSelectedTeacher(teacherUser.staff)
      const currentClassIds = teacherUser.staff.assigend_classes
        ? teacherUser.staff.assigend_classes.map((cls: AssignedClasses) => cls.class.id)
        : []
      setSelectedClasses(currentClassIds)
      setUnassignClasses([])
    }
    setIsClassAllocationDialogOpen(true)
  }

  // Handle status change (activate/deactivate)
  const handleStatusChange = (user: User) => {
    setSelectedUser(user)
    setIsStatusConfirmOpen(true)
  }

  // Handle delete user click
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setIsDeleteConfirmOpen(true)
  }

  // Toggle user policy selection
  const toggleUserPolicy = (policyId: number) => {
    setSelectedUserPolicyIds((prev) =>
      prev.includes(policyId) ? prev.filter((id) => id !== policyId) : [...prev, policyId]
    )
  }

  // Create new Policy Template
  const handleCreatePolicyTemplate = async () => {
    if (!newPolicyName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Template name is required" })
      return
    }

    try {
      await createPolicy({
        name: newPolicyName.trim(),
        description: newPolicyDesc.trim() || undefined,
        rules: newPolicyRules,
      }).unwrap()

      toast({ title: "Template Created", description: `Permission Template "${newPolicyName}" created successfully.` })
      setIsCreatePolicyDialogOpen(false)
      setNewPolicyName("")
      setNewPolicyDesc("")
      setNewPolicyRules([{ action: "read", subject: "Student" }])
      refetchPolicies()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: err?.data?.message || "Failed to create permission template",
      })
    }
  }

  // Delete Policy Template
  const handleDeletePolicyTemplate = async (policyId: number, name: string) => {
    try {
      await deletePolicy(policyId).unwrap()
      toast({ title: "Template Deleted", description: `Deleted policy template "${name}".` })
      refetchPolicies()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err?.data?.message || "Failed to delete permission template",
      })
    }
  }

  // Submit management user form
  const handleSubmitManagementUser = async (values: UserFormValues) => {
    try {
      if (selectedUser) {
        // Update existing user with attached policies
        await updateUser({
          user_id: selectedUser.id,
          payload: {
            name: values.name,
            is_active: values.is_active,
            policy_ids: selectedUserPolicyIds,
          },
        }).unwrap()

        toast({
          title: t("success"),
          description: "User and permission templates updated successfully",
        })
      } else {
        // Create new user with attached policies
        await addUser({
          name: values.name,
          username: values.username,
          password: values.password,
          role_id: Number.parseInt(values.role_id),
          is_active: values.is_active ?? true,
          policy_ids: selectedUserPolicyIds,
        }).unwrap()

        toast({
          title: t("success"),
          description: "User created with selected permission templates successfully",
        })
      }

      setIsManagementUserDialogOpen(false)
      fetchDataForActiveTab("management", 1)
    } catch (error) {
      toast({
        title: t("error"),
        description: (error as { data?: { message?: string } })?.data?.message || "Failed to create/update user",
        variant: "destructive",
      })
    }
  }

  // Submit onboard staff form
  const handleSubmitOnboardTeacher = async () => {
    if (!selectedTeacher) {
      toast({
        title: t("error"),
        description: "Please select a staff member",
        variant: "destructive",
      })
      return
    }

    try {
      if (!onboardUsername || onboardUsername.trim().length < 3) {
        toast({
          title: t("error"),
          description: "Please enter a valid username (at least 3 characters)",
          variant: "destructive",
        })
        return
      }

      if (!onboardPassword || onboardPassword.trim().length < 8) {
        toast({
          title: t("error"),
          description: "Password must be at least 8 characters",
          variant: "destructive",
        })
        return
      }

      await onboardTeacher({
        payload: {
          staff_id: selectedTeacher.id,
          username: onboardUsername.trim(),
          password: onboardPassword.trim(),
          assign_classes: selectedClasses,
          is_active: true,
          policy_ids: selectedUserPolicyIds,
        },
      }).unwrap()

      toast({
        title: t("success"),
        description: "Staff member onboarded successfully",
      })

      setIsOnboardTeacherDialogOpen(false)
      fetchDataForActiveTab("staff", 1)
    } catch (error) {
      toast({
        title: t("error"),
        description: "Failed to onboard staff member",
        variant: "destructive",
      })
    }
  }

  // Submit class allocation form
  const handleSubmitClassAllocation = async () => {
    if (!selectedTeacher || !selectedUser) return
    try {
      await updateOnBoardedStaff({
        user_id: selectedUser.id,
        payload: {
          assign_classes: selectedClasses,
          unassign_classes: unassignClasses,
          policy_ids: selectedUserPolicyIds,
        },
      }).unwrap()

      toast({
        title: t("success"),
        description: "Classes updated successfully",
      })

      setIsClassAllocationDialogOpen(false)
      fetchDataForActiveTab("staff", 1)
    } catch (error) {
      toast({
        title: t("error"),
        description: "Failed to update classes",
        variant: "destructive",
      })
    }
  }

  // Confirm activate/deactivate user
  const confirmDeactivateUser = async () => {
    if (!selectedUser) return
    try {
      if (activeTab === "management") {
        // Update API for Management User
        await updateUser({
          user_id: selectedUser.id,
          payload: {
            is_active: !Boolean(Number(selectedUser.is_active)),
          },
        }).unwrap()
      } else if (activeTab === "staff") {
        // Update API for Teaching Staff
        await updateOnBoardedStaff({
          user_id: selectedUser.id,
          payload: {
            is_active: !Boolean(Number(selectedUser.is_active)),
          },
        }).unwrap()
      }

      toast({
        title: t("success"),
        description: selectedUser.is_active ? "User deactivated successfully" : "User activated successfully",
      })

      setIsStatusConfirmOpen(false)
      fetchDataForActiveTab(activeTab, 1)
    } catch (error) {
      toast({
        title: t("error"),
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    try {
      await deleteUser(userToDelete.id).unwrap()
      toast({
        title: t("success"),
        description: t("user_deleted_successfully"),
      })
      setIsDeleteConfirmOpen(false)
      setUserToDelete(null)
      fetchDataForActiveTab(activeTab, 1)
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.data?.message || t("failed_to_delete_user"),
        variant: "destructive",
      })
    }
  }

  // Toggle class selection
  const toggleClassSelection = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId))

      const currentClasses =
        selectedTeacher && selectedTeacher.assigend_classes
          ? selectedTeacher.assigend_classes.map((assign_class: AssignedClasses) => assign_class.class.id)
          : []

      if (currentClasses.includes(classId) && !unassignClasses.includes(classId)) {
        setUnassignClasses([...unassignClasses, classId])
      }
    } else {
      setSelectedClasses([...selectedClasses, classId])

      if (unassignClasses.includes(classId)) {
        setUnassignClasses(unassignClasses.filter((id) => id !== classId))
      }
    }
  }

  // Get role name by ID
  const getRoleName = (roleId: number) => {
    const role = managementRoles.find((r) => r.id === roleId)
    return role ? role.value : `Role ${roleId}`
  }

  // Loading state
  const isLoading =
    isLoadingManagementUsers ||
    isLoadingOnboardedUsers ||
    isLoadingClasses ||
    isAddingUser ||
    isUpdatingUser ||
    isOnboardingTeacher ||
    isUpdatingTeacherClasses

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: selectedUser?.name || "",
      username: selectedUser?.username || "",
      password: "",
      role_id: selectedUser?.role_id?.toString() || "",
      is_active: selectedUser?.is_active || true,
    },
  })

  // Update form when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        name: selectedUser.name || "",
        username: selectedUser.username || "",
        password: "••••••••",
        role_id: selectedUser.role_id?.toString() || "",
        is_active: selectedUser.is_active || false,
      })
    } else {
      form.reset({
        name: "",
        username: "",
        password: "",
        role_id: "",
        is_active: true,
      })
    }
  }, [selectedUser])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("user_management")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_users_and_their_permissions_in_the_system")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("management_users")}
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("staff")}
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Key className="h-4 w-4 text-purple-600" />
            Permission Templates (IAM)
          </TabsTrigger>
        </TabsList>

        {/* Management Users Tab */}
        <TabsContent value="management">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t("management_users")}
              </CardTitle>
              <CardDescription>{t("manage_administrative_users_with_different_roles_and_permissions")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {/* Search and Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder={t("search_users")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedRole || undefined} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={t("role")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all_roles")}</SelectItem>
                        {managementRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedStatus || undefined} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={t("status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all_statuses")}</SelectItem>
                        <SelectItem value="active">{t("active")}</SelectItem>
                        <SelectItem value="inactive">{t("inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-between items-center">
                  <div></div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      disabled={isResetting}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
                      {isResetting ? t("refreshing") : t("refresh")}
                    </Button>
                    <Button onClick={handleAddManagementUser} size="sm" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t("add_user")}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>Permission Templates (IAM)</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingManagementUsers ? (
                      Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={6} className="h-16 text-center">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : managementUsers?.users && managementUsers.users.length > 0 ? (
                      managementUsers.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.username || user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              {getRoleName(user.role_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.policies && user.policies.length > 0 ? (
                                user.policies.map((p) => (
                                  <Badge key={p.id} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold">
                                    <Key className="h-2.5 w-2.5 mr-1 text-purple-600 inline" />
                                    {p.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[11px] text-gray-400 font-normal">Role Defaults</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={Boolean(Number(user.is_active)) ? "default" : "destructive"}>
                              {Boolean(Number(user.is_active)) ? t("active") : t("inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditManagementUser(user)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-4 w-4" />
                                {t("edit")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(user)}
                                className={`flex items-center gap-1 ${
                                  Boolean(Number(user.is_active))
                                    ? "text-destructive hover:text-destructive"
                                    : "text-green-600 hover:text-green-600"
                                }`}
                              >
                                {Boolean(Number(user.is_active)) ? (
                                  <>
                                    <UserX className="h-4 w-4" />
                                    {t("deactivate")}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4" />
                                    {t("activate")}
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(user)}
                                disabled={currentUser?.id === user.id}
                                className="flex items-center gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("delete")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t("no_users_found")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {managementUsers?.page_meta && (
                <div className="mt-4 flex justify-center">
                  <SaralPagination
                    currentPage={managementUsers.page_meta.current_page}
                    totalPages={managementUsers.page_meta.last_page}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Staff Members as Users
              </CardTitle>
              <CardDescription>
                Manage user access for Teaching, Non-Teaching, and Hospital Staff. Control class allocations and IAM Permission Templates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {/* Category Pills & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    {[
                      { id: "all", label: "All Staff" },
                      { id: "teaching", label: "Teaching Staff" },
                      { id: "non-teaching", label: "Non-Teaching Staff" },
                      { id: "hospital", label: "Hospital Staff" },
                    ].map((tab) => (
                      <Button
                        key={tab.id}
                        type="button"
                        size="sm"
                        variant={selectedStaffCategory === tab.id ? "default" : "ghost"}
                        className={`text-xs h-8 rounded-lg font-medium transition-all ${
                          selectedStaffCategory === tab.id
                            ? "bg-white text-gray-900 shadow-xs hover:bg-white"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        onClick={() => setSelectedStaffCategory(tab.id)}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      disabled={isResetting}
                      className="flex items-center gap-2 h-9"
                    >
                      <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
                      {isResetting ? t("refreshing") : t("refresh")}
                    </Button>
                    <Button onClick={() => handleOnboardTeacher()} size="sm" className="flex items-center gap-2 h-9">
                      <Plus className="h-4 w-4" />
                      Onboard Staff Member
                    </Button>
                  </div>
                </div>

                {/* Search and Status Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search staff by name or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedStatus || undefined} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={t("status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all_statuses")}</SelectItem>
                        <SelectItem value="active">{t("active")}</SelectItem>
                        <SelectItem value="inactive">{t("inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>Staff Category & Role</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("assigned_classes")}</TableHead>
                      <TableHead>Permission Templates (IAM)</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOnboardedUsers ? (
                      Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={7} className="h-16 text-center">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : filteredStaffUsers.length > 0 ? (
                      filteredStaffUsers.map((teacher) => {
                        const catInfo = getStaffCategory(teacher.staff, teacher.role_id)
                        const isTeacher = catInfo.label === "Teaching Staff"
                        return (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium">
                              {teacher.staff?.first_name} {teacher.staff?.middle_name} {teacher.staff?.last_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start gap-1">
                                <Badge variant={catInfo.variant} className={catInfo.color}>
                                  {catInfo.label}
                                </Badge>
                                {teacher.staff?.role_type?.role && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {teacher.staff.role_type.role}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{teacher.username || teacher.email}</TableCell>
                            <TableCell>
                              {isTeacher ? (
                                <div className="flex flex-wrap gap-1">
                                  {teacher.staff?.assigend_classes && teacher.staff.assigend_classes.length > 0 ? (
                                    teacher.staff.assigend_classes.map((cls) => (
                                      <Badge
                                        key={cls.id}
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        {academicClasses?.find((academicClass) => academicClass.id === cls.class?.class_id)
                                          ?.class || "N/A"}
                                        {cls.class?.aliases && <span className="ml-1 text-xs">({cls.class.aliases})</span>}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-sm">{t("no_classes_assigned")}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs italic">Not Applicable</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {teacher.policies && teacher.policies.length > 0 ? (
                                  teacher.policies.map((p) => (
                                    <Badge key={p.id} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold">
                                      <Key className="h-2.5 w-2.5 mr-1 text-purple-600 inline" />
                                      {p.name}
                                    </Badge>
                                  ))
                                ) : !isTeacher ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-medium">
                                    Personal Leave Only
                                  </Badge>
                                ) : (
                                  <span className="text-[11px] text-gray-400 font-normal">Role Defaults</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={Boolean(Number(teacher.is_active)) ? "default" : "secondary"}>
                                {Boolean(Number(teacher.is_active)) ? t("active") : t("inactive")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleClassAllocation(teacher)}
                                  className="flex items-center gap-1"
                                >
                                  {isTeacher ? (
                                    <>
                                      <BookOpen className="h-4 w-4" />
                                      Classes & IAM
                                    </>
                                  ) : (
                                    <>
                                      <Key className="h-4 w-4 text-purple-600" />
                                      IAM Permissions
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(teacher)}
                                  className={`flex items-center gap-1 ${
                                    Boolean(Number(teacher.is_active))
                                      ? "text-destructive hover:text-destructive"
                                      : "text-green-600 hover:text-green-600"
                                  }`}
                                >
                                  {Boolean(Number(teacher.is_active)) ? (
                                    <>
                                      <UserX className="h-4 w-4" />
                                      {t("deactivate")}
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4" />
                                      {t("activate")}
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(teacher)}
                                  disabled={currentUser?.id === teacher.id}
                                  className="flex items-center gap-1 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t("delete")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No staff found matching the selected filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {onboardedTeachers?.page_meta && (
                <div className="mt-4 flex justify-center">
                  <SaralPagination
                    currentPage={onboardedTeachers.page_meta.current_page}
                    totalPages={onboardedTeachers.page_meta.last_page}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Templates (AWS IAM Policies) Tab */}
        <TabsContent value="policies">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-600" />
                  Permission Templates (AWS IAM Style)
                </CardTitle>
                <CardDescription>
                  Define reusable granular policy templates with fine-grained actions and subjects to grant precise permissions to users.
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsCreatePolicyDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Create Permission Template
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPolicies ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : policiesList && policiesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policiesList.map((policy) => (
                    <Card key={policy.id} className="border-gray-200 shadow-xs hover:border-purple-200 transition-all rounded-xl">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                        <div>
                          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-purple-600" />
                            {policy.name}
                          </CardTitle>
                          {policy.description && (
                            <CardDescription className="text-xs text-gray-500 mt-0.5">
                              {policy.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePolicyTemplate(policy.id, policy.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-2">
                        <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Granted Rules ({Array.isArray(policy.rules) ? policy.rules.length : 0})
                        </Label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Array.isArray(policy.rules) && policy.rules.length > 0 ? (
                            policy.rules.map((rule, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={
                                  rule.inverted
                                    ? "bg-red-50 text-red-800 border-red-200 text-xs font-mono py-0.5 px-2"
                                    : "bg-purple-50 text-purple-800 border-purple-200 text-xs font-mono py-0.5 px-2"
                                }
                              >
                                {rule.inverted && <span className="mr-1 font-bold uppercase">deny</span>}
                                <span className="font-semibold text-purple-900">
                                  {Array.isArray(rule.action) ? rule.action.join(", ") : rule.action}
                                </span>
                                <span className="mx-1 text-purple-400">:</span>
                                <span>{Array.isArray(rule.subject) ? rule.subject.join(", ") : rule.subject}</span>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No explicit rules defined</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-2xl">
                  <Key className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-gray-700">No permission templates found</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Create Permission Template" above to build your first IAM policy template.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Management User Dialog */}
      <Dialog open={isManagementUserDialogOpen} onOpenChange={setIsManagementUserDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? t("edit_management_user") : t("add_management_user")}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? t("update_user_details_and_permissions")
                : t("create_a_new_management_user_with_specific_role")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitManagementUser)} className="space-y-4">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!selectedUser && (
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a unique username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!selectedUser && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min. 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("role")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_role")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key={0} value={" "}>
                            Select Any Role
                          </SelectItem>
                          {managementRoles.map((role) => (
                            <SelectItem className="cursor" key={role.id} value={role.id.toString()}>
                              {role.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {field.value
                          ? managementRoles.find((r) => r.id.toString() === field.value)?.description
                          : t("select_a_role_to_see_description")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Granular Permission Templates Section (AWS IAM Style) */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <Label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-purple-600" />
                      Granular Permission Templates (AWS IAM Style)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Multi-select policies</span>
                  </Label>

                  {isLoadingPolicies ? (
                    <div className="text-xs text-gray-400 py-2">Loading permission templates...</div>
                  ) : policiesList && policiesList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
                      {policiesList.map((policy) => {
                        const isChecked = selectedUserPolicyIds.includes(policy.id)
                        return (
                          <div
                            key={policy.id}
                            className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors ${
                              isChecked
                                ? "bg-white border-purple-400 shadow-2xs"
                                : "bg-white/70 border-gray-200 hover:bg-white"
                            }`}
                          >
                            <Checkbox
                              id={`user-policy-${policy.id}`}
                              checked={isChecked}
                              onCheckedChange={() => toggleUserPolicy(policy.id)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={`user-policy-${policy.id}`}
                                className="text-xs font-bold text-gray-800 cursor-pointer flex items-center justify-between"
                              >
                                <span>{policy.name}</span>
                                {isChecked && (
                                  <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1 py-0">Attached</Badge>
                                )}
                              </label>
                              {policy.description && (
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">{policy.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Array.isArray(policy.rules) &&
                                  policy.rules.slice(0, 3).map((r, rIdx) => (
                                    <Badge
                                      key={rIdx}
                                      variant="secondary"
                                      className="text-[9px] px-1 py-0 bg-gray-100 text-gray-600 font-mono"
                                    >
                                      {Array.isArray(r.action) ? r.action.join(",") : r.action} :{" "}
                                      {Array.isArray(r.subject) ? r.subject.join(",") : r.subject}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No custom permission templates defined yet.</p>
                  )}
                </div>

                {selectedUser && (
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-1">
                        <FormControl>
                          <Switch checked={Boolean(Number(field.value))} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t("active_user")}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsManagementUserDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
                  {isLoading || form.formState.isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}
                    </>
                  ) : selectedUser ? (
                    t("update_user")
                  ) : (
                    t("create_user")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Onboard Staff Dialog */}
      <Dialog open={isOnboardTeacherDialogOpen} onOpenChange={setIsOnboardTeacherDialogOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Onboard Staff Member as User
            </DialogTitle>
            <DialogDescription>
              Create user credentials for teaching, non-teaching, or hospital staff. Non-teaching and hospital staff initially access only personal leaves until IAM permission templates are assigned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Category Filter Pills for Onboard Dialog */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Filter Staff by Category</Label>
              <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: "all", label: "All Categories" },
                  { id: "teaching", label: "Teaching Staff" },
                  { id: "non-teaching", label: "Non-Teaching Staff" },
                  { id: "hospital", label: "Hospital Staff" },
                ].map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={onboardDialogStaffCategory === cat.id ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 text-xs px-2.5 rounded-md ${
                      onboardDialogStaffCategory === cat.id
                        ? "bg-white text-gray-900 shadow-2xs hover:bg-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => handleDialogCategoryChange(cat.id)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Select Staff Member */}
            <div className="space-y-2">
              <Label>Select Staff Member</Label>
              <Select
                value={selectedTeacher ? selectedTeacher.id.toString() : undefined}
                onValueChange={(value) => {
                  const staff = nonOnboardedTeachers?.find((t) => t.id.toString() === value)
                  staff && setSelectedTeacher(staff)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member to onboard" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {isLoadingNonOnboardedTeachers ? (
                    <SelectItem value="loading" disabled>
                      {t("loading...")}
                    </SelectItem>
                  ) : nonOnboardedTeachers && nonOnboardedTeachers.length > 0 ? (
                    nonOnboardedTeachers.map((staff) => {
                      const catInfo = getStaffCategory(staff)
                      return (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          <div className="flex items-center justify-between w-full gap-3">
                            <span className="font-medium">{staff.first_name} {staff.middle_name} {staff.last_name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              ({catInfo.label}{staff.role ? ` • ${staff.role}` : ""})
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="none" disabled>
                      No non-onboarded staff available in this category
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Staff Category Badge & Notice */}
            {selectedTeacher && (
              <div className="p-3 rounded-xl border bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Selected Staff Type:</span>
                  <Badge variant={getStaffCategory(selectedTeacher).variant} className={getStaffCategory(selectedTeacher).color}>
                    {getStaffCategory(selectedTeacher).label}
                  </Badge>
                </div>
                {getStaffCategory(selectedTeacher).label !== "Teaching Staff" ? (
                  <div className="flex items-start gap-2 pt-1 text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Default Access: Personal Leave Only.</strong> This user will only be able to view and apply for personal leaves from the start. You can grant additional feature access below using IAM Permission Templates.
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Teaching staff receive standard teacher portal access, with optional class assignments and IAM permission templates.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="Enter a unique username for login"
                value={onboardUsername}
                onChange={(e) => setOnboardUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This username will be used by the staff member to log in.</p>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={onboardPassword}
                onChange={(e) => setOnboardPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">The staff member will use this password to log in.</p>
            </div>

            {/* Class Assignment (Only for Teaching Staff) */}
            {selectedTeacher && getStaffCategory(selectedTeacher).label === "Teaching Staff" && (
              <>
                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>{t("assign_classes")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("selected")}: {selectedClasses.length}
                    </p>
                  </div>

                  {isLoadingClasses ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">{t("loading_classes...")}</p>
                    </div>
                  ) : academicDivisions && academicDivisions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-1 border rounded-lg bg-white">
                      {academicDivisions.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={() => toggleClassSelection(cls.id)}
                          />
                          <Label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                            {academicClasses?.find((academicClass) => academicClass.id === cls.class_id)?.class ||
                              "N/A"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">{t("no_classes_available")}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Class assignment is optional and can be updated at any time.
                  </p>
                </div>
              </>
            )}

            {/* Granular Permission Templates Section (AWS IAM Style) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-purple-600" />
                  Granular Permission Templates (AWS IAM Style)
                </span>
                <span className="text-[10px] text-gray-400 font-normal">Multi-select policies</span>
              </Label>

              {isLoadingPolicies ? (
                <div className="text-xs text-gray-400 py-2">Loading permission templates...</div>
              ) : policiesList && policiesList.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
                  {policiesList.map((policy) => {
                    const isChecked = selectedUserPolicyIds.includes(policy.id)
                    return (
                      <div
                        key={policy.id}
                        className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors ${
                          isChecked
                            ? "bg-white border-purple-400 shadow-2xs"
                            : "bg-white/70 border-gray-200 hover:bg-white"
                        }`}
                      >
                        <Checkbox
                          id={`onboard-staff-policy-${policy.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleUserPolicy(policy.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`onboard-staff-policy-${policy.id}`}
                            className="text-xs font-bold text-gray-800 cursor-pointer flex items-center justify-between"
                          >
                            <span>{policy.name}</span>
                            {isChecked && (
                              <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1 py-0">Attached</Badge>
                            )}
                          </label>
                          {policy.description && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{policy.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No custom permission templates defined yet.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOnboardTeacherDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmitOnboardTeacher} disabled={!selectedTeacher || isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("onboarding")}
                </>
              ) : (
                "Onboard Staff Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Allocation & IAM Permissions Dialog */}
      <Dialog open={isClassAllocationDialogOpen} onOpenChange={setIsClassAllocationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTeacher && getStaffCategory(selectedTeacher, selectedUser?.role_id).label === "Teaching Staff" ? (
                <>
                  <BookOpen className="h-5 w-5 text-primary" />
                  Manage Classes & IAM Permission Templates
                </>
              ) : (
                <>
                  <Key className="h-5 w-5 text-purple-600" />
                  Manage IAM Permission Templates
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTeacher ? (
                <>
                  Update access permissions and configuration for {selectedTeacher?.first_name} {selectedTeacher?.last_name}
                </>
              ) : selectedUser ? (
                <>
                  Update access permissions for {selectedUser.name}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Class assignment section only for Teaching Staff */}
            {selectedTeacher && getStaffCategory(selectedTeacher, selectedUser?.role_id).label === "Teaching Staff" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{t("assigned_classes")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("selected")}: {selectedClasses.length}
                  </p>
                </div>

                {isLoadingClasses ? (
                  <div className="text-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">{t("loading_classes...")}</p>
                  </div>
                ) : academicDivisions && academicDivisions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1 border rounded-lg bg-white">
                    {academicDivisions.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-alloc-${cls.id}`}
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={() => toggleClassSelection(cls.id)}
                        />
                        <Label htmlFor={`class-alloc-${cls.id}`} className="text-sm cursor-pointer">
                          {academicClasses?.find((academicClass) => academicClass.id === cls.class_id)?.class || "N/A"}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">{t("no_classes_available")}</p>
                  </div>
                )}

                {selectedTeacher?.assigend_classes && selectedTeacher.assigend_classes.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">{t("current_assignments")}:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacher.assigend_classes.map((cls) => (
                        <Badge key={cls.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {academicClasses?.find((academicClass) => academicClass.id === cls.class?.class_id)?.class ||
                            "N/A"}
                          {cls.class?.aliases && <span className="ml-1 text-xs">({cls.class.aliases})</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note for Non-Teaching / Hospital staff */}
            {selectedTeacher && getStaffCategory(selectedTeacher, selectedUser?.role_id).label !== "Teaching Staff" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-semibold mb-0.5">Base Role: Personal Leave Only</p>
                  <p className="text-amber-700">
                    By default, this user has access to personal leaves only. Select any IAM Permission Templates below to grant additional system features.
                  </p>
                </div>
              </div>
            )}

            {/* Granular Permission Templates Section (AWS IAM Style) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-purple-600" />
                  Granular Permission Templates (AWS IAM Style)
                </span>
                <span className="text-[10px] text-gray-400 font-normal">Multi-select policies</span>
              </Label>

              {isLoadingPolicies ? (
                <div className="text-xs text-gray-400 py-2">Loading permission templates...</div>
              ) : policiesList && policiesList.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/50">
                  {policiesList.map((policy) => {
                    const isChecked = selectedUserPolicyIds.includes(policy.id)
                    return (
                      <div
                        key={policy.id}
                        className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors ${
                          isChecked
                            ? "bg-white border-purple-400 shadow-2xs"
                            : "bg-white/70 border-gray-200 hover:bg-white"
                        }`}
                      >
                        <Checkbox
                          id={`alloc-staff-policy-${policy.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleUserPolicy(policy.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`alloc-staff-policy-${policy.id}`}
                            className="text-xs font-bold text-gray-800 cursor-pointer flex items-center justify-between"
                          >
                            <span>{policy.name}</span>
                            {isChecked && (
                              <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1 py-0">Attached</Badge>
                            )}
                          </label>
                          {policy.description && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{policy.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No custom permission templates defined yet.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsClassAllocationDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmitClassAllocation} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("updating")}
                </>
              ) : selectedTeacher && getStaffCategory(selectedTeacher, selectedUser?.role_id).label === "Teaching Staff" ? (
                "Update Classes & Permissions"
              ) : (
                "Update Permissions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate User Confirmation Dialog */}
      <Dialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{Boolean(Number(selectedUser?.is_active)) ? t("deactivate_user") : t("activate_user")}</DialogTitle>
            <DialogDescription>
              {Boolean(Number(selectedUser?.is_active))
                ? t("are_you_sure_you_want_to_deactivate_this_user")
                : t("are_you_sure_you_want_to_activate_this_user")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsStatusConfirmOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              className="text-white"
              variant={Boolean(Number(selectedUser?.is_active)) ? "destructive" : "default"}
              onClick={confirmDeactivateUser}
            >
              {Boolean(Number(selectedUser?.is_active)) ? t("deactivate") : t("activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("delete_user")}</DialogTitle>
            <DialogDescription>
              {t("are_you_sure_you_want_to_delete_this_user")}
              {userToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  {userToDelete.name ? `${userToDelete.name} (${userToDelete.username || userToDelete.email})` : (userToDelete.username || userToDelete.email)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeletingUser}>
              {t("cancel")}
            </Button>
            <Button
              className="text-white"
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Permission Template Dialog (AWS IAM Style) */}
      <Dialog open={isCreatePolicyDialogOpen} onOpenChange={setIsCreatePolicyDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Create Permission Template (AWS IAM Style)
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Build a reusable granular permission template with action & subject rule statements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Template Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Student & Fees Manager, Hostel Supervisor"
                value={newPolicyName}
                onChange={(e) => setNewPolicyName(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Description</Label>
              <Textarea
                placeholder="Describe what access this permission template grants..."
                value={newPolicyDesc}
                onChange={(e) => setNewPolicyDesc(e.target.value)}
                className="text-xs rounded-xl h-20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-700">Rule Statements (Actions & Subjects)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPolicyRules((prev) => [...prev, { action: "read", subject: "Student" }])}
                  className="h-7 text-[11px] gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Rule
                </Button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                {newPolicyRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-2xs">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase">Action</Label>
                      <Select
                        value={rule.action}
                        onValueChange={(val) =>
                          setNewPolicyRules((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, action: val } : r))
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONS.map((action) => (
                            <SelectItem key={action} value={action}>
                              {ACTION_LABELS[action]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase">Target Subject / Module</Label>
                      <Select
                        value={rule.subject}
                        onValueChange={(val) =>
                          setNewPolicyRules((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, subject: val } : r))
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">all (All System Modules)</SelectItem>
                          {MODULES.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                              {module.label}
                              <span className="ml-2 text-[10px] text-gray-400">{module.covers}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <label
                      className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 mt-4 cursor-pointer"
                      title="A deny rule blocks the action even if another rule allows it"
                    >
                      <Checkbox
                        checked={!!rule.inverted}
                        onCheckedChange={(checked) =>
                          setNewPolicyRules((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, inverted: checked === true } : r))
                          )
                        }
                      />
                      Deny
                    </label>

                    {newPolicyRules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewPolicyRules((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1 text-gray-400 hover:text-red-600 mt-4"
                        title="Remove rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setIsCreatePolicyDialogOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleCreatePolicyTemplate}
              disabled={isCreatingPolicy}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl gap-2"
            >
              {isCreatingPolicy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default UserManagement