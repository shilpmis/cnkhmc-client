// import { DialogFooter } from "@/components/ui/dialog"
// import type React from "react"
// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Label } from "@/components/ui/label"
// import { Separator } from "@/components/ui/separator"
// import { SaralPagination } from "@/components/ui/common/SaralPagination"
// import { Plus, UserPlus, Users, Shield, BookOpen, RefreshCw, Edit, AlertCircle, CheckCircle } from "lucide-react"
// import type { User } from "@/types/user"
// import type { PageMeta } from "@/types/global"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import {
//   useLazyFetchManagementUsersQuery,
//   useLazyFetchOnBoardedUserQuery,
//   useLazyFetchNonOnBoardedTeacherQuery,
//   useAddUserMutation,
//   useUpdateUserMutation,
//   useOnBoardTeacherAsUserMutation,
//   useUpdateOnBoardTeacherAsUserMutation,
// } from "@/services/UserManagementService"
// import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
// import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { toast } from "@/hooks/use-toast"

// // Import zod at the top of the file
// import { z } from "zod"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from "react-hook-form"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import type { StaffType } from "@/types/staff"
// import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
// import { Switch } from "@/components/ui/switch"
// import type { AssignedClasses } from "@/types/class"

// // Predefined management roles
// const managementRoles = [
//   { id: 1, role: "ADMIN", value: "Admin", description: "Full access to all system features" },
//   {
//     id: 2,
//     role: "PRINCIPAL",
//     value: "Principal",
//     description: "School-wide access with limited administrative capabilities",
//   },
//   { id: 3, role: "HEAD TEACHER", value: "Head Teacher", description: "Department-level access and teacher management" },
//   { id: 4, role: "CLERK", value: "Clerk", description: "Administrative tasks and record management" },
//   { id: 5, role: "IT ADMIN", value: "IT Admin", description: "Technical support and system configuration" },
// ]

// // Add the user form schema after the managementRoles constant
// const userFormSchema = z.object({
//   name: z.string().min(1, { message: "Name is required" }),
//   role_id: z.string().min(1, { message: "Role is required" }),
//   is_active: z.boolean().optional().default(true),
// })

// type UserFormValues = z.infer<typeof userFormSchema>

// export const UserManagement: React.FC = () => {
//   const { t } = useTranslation()
//   const currentUser = useAppSelector((state) => state.auth.user)
//   const academicClasses = useAppSelector(selectAcademicClasses)
//   const academicDivisions = useAppSelector(selectAllAcademicClasses)
//   const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

//   // API hooks
//   const [fetchUsers, { isLoading: isLoadingManagementUsers }] = useLazyFetchManagementUsersQuery()
//   const [fetchOnBoardedUsers, { isLoading: isLoadingOnboardedUsers }] = useLazyFetchOnBoardedUserQuery()
//   const [fetchNonOnBoardedTeachers, { isLoading: isLoadingNonOnboardedTeachers, data: nonOnboardedTeachers }] =
//     useLazyFetchNonOnBoardedTeacherQuery()
//   const [getAcademicClasses, { isLoading: isLoadingClasses }] = useLazyGetAcademicClassesQuery()
//   const [addUser, { isLoading: isAddingUser }] = useAddUserMutation()
//   const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
//   const [onboardTeacher, { isLoading: isOnboardingTeacher }] = useOnBoardTeacherAsUserMutation()
//   const [updateOnBoardedStaff, { isLoading: isUpdatingTeacherClasses }] = useUpdateOnBoardTeacherAsUserMutation()

//   // State
//   const [activeTab, setActiveTab] = useState("management")
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedRole, setSelectedRole] = useState<string>("")
//   const [selectedStatus, setSelectedStatus] = useState<string>("")

//   const [managementUsers, setManagementUsers] = useState<{ users: User[]; page_meta: PageMeta } | null>(null)
//   const [onboardedTeachers, setOnboardedTeachers] = useState<{ users: User[]; page_meta: PageMeta } | null>(null)

//   // Dialog states
//   const [isManagementUserDialogOpen, setIsManagementUserDialogOpen] = useState(false)
//   const [isOnboardTeacherDialogOpen, setIsOnboardTeacherDialogOpen] = useState(false)
//   const [isClassAllocationDialogOpen, setIsClassAllocationDialogOpen] = useState(false)
//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

//   // Selected items
//   const [selectedUser, setSelectedUser] = useState<User | null>(null)
//   const [selectedTeacher, setSelectedTeacher] = useState<StaffType | null>(null)
//   const [selectedClasses, setSelectedClasses] = useState<number[]>([])
//   const [unassignClasses, setUnassignClasses] = useState<number[]>([])

//   // Fetch data on component mount
//   useEffect(() => {
//     if (currentUser?.school_id) {
//       fetchDataForActiveTab(activeTab, 1)

//       if (!academicClasses) {
//         getAcademicClasses(currentUser.school_id)
//       }
//     }
//   }, [currentUser, activeTab, selectedRole, selectedStatus])

//   // Fetch data based on active tab
//   const fetchDataForActiveTab = async (tab: string, page: number) => {
//     if (!currentUser?.school_id) return

//     if (tab === "management") {
//       try {
//         const response = await fetchUsers({
//           type: "management",
//           school_id: currentUser.school_id,
//           page,
//         })

//         if (response.data) {
//           setManagementUsers({
//             users: response.data.data,
//             page_meta: response.data.meta,
//           })
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch management users",
//           variant: "destructive",
//         })
//       }
//     } else if (tab === "staff") {
//       try {
//         const response = await fetchOnBoardedUsers({
//           school_id: currentUser.school_id,
//           page,
//         })

//         if (response.data) {
//           setOnboardedTeachers({
//             users: response.data.data,
//             page_meta: response.data.meta,
//           })
//         }
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch onboarded teachers",
//           variant: "destructive",
//         })
//       }
//     }
//   }

//   // Handle page change
//   const handlePageChange = (page: number) => {
//     fetchDataForActiveTab(activeTab, page)
//   }

//   // Handle filter change
//   const handleFilterChange = () => {
//     fetchDataForActiveTab(activeTab, 1)
//   }

//   // Reset filters
//   const [isResetting, setIsResetting] = useState(false)

//   // Update the resetFilters function
//   const resetFilters = async () => {
//     setIsResetting(true)
//     setSearchTerm("")
//     setSelectedRole("")
//     setSelectedStatus("")

//     try {
//       await fetchDataForActiveTab(activeTab, 1)
//     } finally {
//       setIsResetting(false)
//     }
//   }

//   // Handle add management user
//   const handleAddManagementUser = () => {
//     setSelectedUser(null)
//     setIsManagementUserDialogOpen(true)
//   }

//   // Handle edit management user
//   const handleEditManagementUser = (user: User) => {
//     setSelectedUser(user)
//     setIsManagementUserDialogOpen(true)
//   }

//   // Handle onboard teacher dialog
//   const handleOnboardTeacher = () => {
//     setSelectedTeacher(null)
//     setSelectedClasses([])
//     setIsOnboardTeacherDialogOpen(true)
//     fetchNonOnBoardedTeachers({
//       page: 1,
//       school_id: currentUser!.school_id,
//       academic_sessions: CurrentAcademicSessionForSchool!.id,
//     })
//   }

//   // Handle class allocation dialog
//   const handleClassAllocation = (user: User) => {
//     setSelectedUser(user)
//     setSelectedTeacher(user.staff)

//     // Initialize selected classes from teacher's current classes
//     const currentClasses = (user.staff && user.staff.assigend_classes.map((cls: AssignedClasses) => cls.class.id)) || []
//     setSelectedClasses([...currentClasses])
//     setUnassignClasses([])

//     setIsClassAllocationDialogOpen(true)
//   }

//   // Handle status change (activate/deactivate) user
//   const handleStatusChange = (user: User) => {
//     setSelectedUser(user)
//     setIsDeleteConfirmOpen(true)
//   }

//   // Submit management user form
//   const handleSubmitManagementUser = async (values: UserFormValues) => {
//     try {
//       if (selectedUser) {
//         // Update existing user
//         await updateUser({
//           user_id: selectedUser.id,
//           payload: {
//             name: values.name,
//             is_active: values.is_active,
//           },
//         }).unwrap()

//         toast({
//           title: "Success",
//           description: "User updated successfully",
//         })
//       } else {
//         // Create new user
//         await addUser({
//           name: values.name,
//           role_id: Number.parseInt(values.role_id),
//           is_active: values.is_active,
//         }).unwrap()

//         toast({
//           title: "Success",
//           description: "User created successfully",
//         })
//       }

//       setIsManagementUserDialogOpen(false)
//       fetchDataForActiveTab("management", 1)
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: (error as { data?: { message?: string } })?.data?.message || "Failed to create/update user",
//         variant: "destructive",
//       })

//     }
//   }

//   // Submit onboard teacher form
//   const handleSubmitOnboardTeacher = async () => {
//     if (!selectedTeacher) {
//       toast({
//         title: "Error",
//         description: "Please select a teacher",
//         variant: "destructive",
//       })
//       return
//     }

//     try {
//       await onboardTeacher({
//         payload: {
//           staff_id: selectedTeacher.id,
//           assign_classes: selectedClasses,
//           is_active: true,
//         },
//       }).unwrap()

//       toast({
//         title: "Success",
//         description: "Teacher onboarded successfully",
//       })

//       setIsOnboardTeacherDialogOpen(false)
//       fetchDataForActiveTab("staff", 1)
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to onboard teacher",
//         variant: "destructive",
//       })
//     }
//   }

//   // Submit class allocation form
//   const handleSubmitClassAllocation = async () => {
//     if (!selectedTeacher || !selectedUser) return
//     console.log("manage_class_allocations", selectedTeacher)
//     try {
//       await updateOnBoardedStaff({
//         user_id: selectedUser.id,
//         payload: {
//           assign_classes: selectedClasses,
//           unassign_classes: unassignClasses,
//         },
//       }).unwrap()

//       toast({
//         title: "Success",
//         description: "Classes updated successfully",
//       })

//       setIsClassAllocationDialogOpen(false)
//       fetchDataForActiveTab("staff", 1)
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to update classes",
//         variant: "destructive",
//       })
//     }
//   }

//   // Confirm activate/deactivate user
//   const confirmDeactivateUser = async () => {
//     if (!selectedUser) return
//     try {
//       if (activeTab === "management") {
//         // Update API for Management User
//         await updateUser({
//           user_id: selectedUser.id,
//           payload: {
//             is_active: !Boolean(Number(selectedUser.is_active)), // Toggle activation status
//           },
//         }).unwrap()
//       } else if (activeTab === "staff") {
//         // Update API for Teaching Staff
//         await updateOnBoardedStaff({
//           user_id: selectedUser.id,
//           payload: {
//             is_active: !Boolean(Number(selectedUser.is_active)), // Toggle activation status
//           },
//         }).unwrap()
//       }

//       toast({
//         title: "Success",
//         description: selectedUser.is_active ? "User deactivated successfully" : "User activated successfully",
//       })

//       setIsDeleteConfirmOpen(false)
//       fetchDataForActiveTab(activeTab, 1)
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to update user status",
//         variant: "destructive",
//       })
//     }
//   }

//   // Toggle class selection
//   const toggleClassSelection = (classId: number) => {
//     if (selectedClasses.includes(classId)) {
//       setSelectedClasses(selectedClasses.filter((id) => id !== classId))

//       // If this class was previously assigned to the teacher, add it to unassign list
//       const currentClasses =
//         selectedTeacher && selectedTeacher.assigend_classes
//           ? selectedTeacher.assigend_classes.map((assign_class: AssignedClasses) => assign_class.class.id)
//           : []

//       if (currentClasses.includes(classId) && !unassignClasses.includes(classId)) {
//         setUnassignClasses([...unassignClasses, classId])
//       }
//     } else {
//       setSelectedClasses([...selectedClasses, classId])

//       // If this class was in the unassign list, remove it
//       if (unassignClasses.includes(classId)) {
//         setUnassignClasses(unassignClasses.filter((id) => id !== classId))
//       }
//     }
//   }

//   // Get role name by ID
//   const getRoleName = (roleId: number) => {
//     const role = managementRoles.find((r) => r.id === roleId)
//     return role ? role.value : `Role ${roleId}`
//   }

//   // Loading state
//   const isLoading =
//     isLoadingManagementUsers ||
//     isLoadingOnboardedUsers ||
//     isLoadingClasses ||
//     isAddingUser ||
//     isUpdatingUser ||
//     isOnboardingTeacher ||
//     isUpdatingTeacherClasses

//   // Add form initialization in the component
//   // Add this near the top of the component
//   const form = useForm<UserFormValues>({
//     resolver: zodResolver(userFormSchema),
//     defaultValues: {
//       name: selectedUser?.name || "",
//       role_id: selectedUser?.role_id?.toString() || "",
//       is_active: selectedUser?.is_active || true,
//     },
//   })

//   // Update form when selectedUser changes
//   useEffect(() => {
//     if (selectedUser) {
//       form.reset({
//         name: selectedUser.name || "",
//         role_id: selectedUser.role_id?.toString() || "",
//         is_active: selectedUser.is_active || false,
//       })
//     } else {
//       form.reset({
//         name: "",
//         role_id: "",
//         is_active: true,
//       })
//     }
//   }, [selectedUser, form])

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">{t("user_management")}</h1>
//           <p className="text-muted-foreground mt-1">{t("manage_users_and_their_permissions_in_the_system")}</p>
//         </div>
//       </div>

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="grid w-full grid-cols-2 mb-6">
//           <TabsTrigger value="management" className="flex items-center gap-2">
//             <Shield className="h-4 w-4" />
//             {t("management_users")}
//           </TabsTrigger>
//           <TabsTrigger value="staff" className="flex items-center gap-2">
//             <Users className="h-4 w-4" />
//             {t("teaching_staff")}
//           </TabsTrigger>
//         </TabsList>

//         {/* Management Users Tab */}
//         <TabsContent value="management">
//           <Card>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-xl font-semibold flex items-center gap-2">
//                 <Shield className="h-5 w-5 text-primary" />
//                 {t("management_users")}
//               </CardTitle>
//               <CardDescription>{t("manage_administrative_users_with_different_roles_and_permissions")}</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="flex justify-between items-center mb-6">
//                 <div className="flex gap-2">
//                   <Select value={selectedRole} onValueChange={setSelectedRole}>
//                     <SelectTrigger className="w-[150px]">
//                       <SelectValue placeholder={t("role")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">{t("all_roles")}</SelectItem>
//                       {managementRoles.map((role) => (
//                         <SelectItem key={role.id} value={role.id.toString()}>
//                           {role.value}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <Select value={selectedStatus} onValueChange={setSelectedStatus}>
//                     <SelectTrigger className="w-[150px]">
//                       <SelectValue placeholder={t("status")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">{t("all_statuses")}</SelectItem>
//                       <SelectItem value="active">{t("active")}</SelectItem>
//                       <SelectItem value="inactive">{t("inactive")}</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={resetFilters}
//                     disabled={isResetting}
//                     className="flex items-center gap-1"
//                   >
//                     <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
//                     {isResetting ? t("refreshing") : t("refresh")}
//                   </Button>
//                 </div>
//                 <Button onClick={handleAddManagementUser} size="sm" className="flex items-center gap-1">
//                   <UserPlus className="h-4 w-4" />
//                   {t("add_user")}
//                 </Button>
//               </div>

//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>{t("name")}</TableHead>
//                       <TableHead>{t("email")}</TableHead>
//                       <TableHead>{t("role")}</TableHead>
//                       <TableHead>{t("status")}</TableHead>
//                       <TableHead className="text-right">{t("actions")}</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {isLoadingManagementUsers ? (
//                       Array(5)
//                         .fill(0)
//                         .map((_, index) => (
//                           <TableRow key={index}>
//                             <TableCell colSpan={5} className="h-16 text-center">
//                               <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                     ) : managementUsers?.users && managementUsers.users.length > 0 ? (
//                       managementUsers.users.map((user) => (
//                         <TableRow key={user.id}>
//                           <TableCell className="font-medium">{user.name}</TableCell>
//                           <TableCell>{user.saral_email}</TableCell>
//                           <TableCell>
//                             <Badge variant="outline" className="bg-primary/10 text-primary">
//                               {getRoleName(user.role_id)}
//                             </Badge>
//                           </TableCell>
//                           <TableCell>
//                             <Badge variant={Boolean(Number(user.is_active)) ? "default" : "destructive"}>
//                               {Boolean(Number(user.is_active)) ? t("active") : t("inactive")}
//                             </Badge>
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex items-center justify-end space-x-2">
//                               <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 onClick={() => handleEditManagementUser(user)}
//                                 title={t("edit")}
//                               >
//                                 <Edit className="h-4 w-4" />
//                                 <span className="sr-only">{t("edit")}</span>
//                               </Button>
//                               <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 onClick={() => handleStatusChange(user)}
//                                 className={
//                                   Boolean(Number(user.is_active))
//                                     ? "text-destructive hover:text-destructive"
//                                     : "text-green-600 hover:text-green-600"
//                                 }
//                                 title={Boolean(Number(user.is_active)) ? t("deactivate") : t("activate")}
//                               >
//                                 {Boolean(Number(user.is_active)) ? (
//                                   <AlertCircle className="h-4 w-4" />
//                                 ) : (
//                                   <CheckCircle className="h-4 w-4" />
//                                 )}
//                                 <span className="sr-only">
//                                   {Boolean(Number(user.is_active)) ? t("deactivate") : t("activate")}
//                                 </span>
//                               </Button>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     ) : (
//                       <TableRow>
//                         <TableCell colSpan={5} className="h-24 text-center">
//                           {t("no_users_found")}
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>

//               {managementUsers?.page_meta && (
//                 <div className="mt-4 flex justify-center">
//                   <SaralPagination
//                     currentPage={managementUsers.page_meta.current_page}
//                     totalPages={managementUsers.page_meta.last_page}
//                     onPageChange={handlePageChange}
//                   />
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Teaching Staff Tab */}
//         <TabsContent value="staff">
//           <Card>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-xl font-semibold flex items-center gap-2">
//                 <BookOpen className="h-5 w-5 text-primary" />
//                 {t("teaching_staff")}
//               </CardTitle>
//               <CardDescription>{t("manage_teaching_staff_access_and_class_allocations")}</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="flex justify-between items-center mb-6">
//                 <div className="flex gap-2">
//                   <Select value={selectedStatus} onValueChange={setSelectedStatus}>
//                     <SelectTrigger className="w-[150px]">
//                       <SelectValue placeholder={t("status")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">{t("all_statuses")}</SelectItem>
//                       <SelectItem value="active">{t("active")}</SelectItem>
//                       <SelectItem value="inactive">{t("inactive")}</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={resetFilters}
//                     disabled={isResetting}
//                     className="flex items-center gap-1"
//                   >
//                     <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
//                     {isResetting ? t("refreshing") : t("refresh")}
//                   </Button>
//                 </div>
//                 <Button onClick={handleOnboardTeacher} size="sm" className="flex items-center gap-1">
//                   <Plus className="h-4 w-4" />
//                   {t("onboard_teacher")}
//                 </Button>
//               </div>

//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>{t("name")}</TableHead>
//                       <TableHead>{t("email")}</TableHead>
//                       <TableHead>{t("assigned_classes")}</TableHead>
//                       <TableHead>{t("status")}</TableHead>
//                       <TableHead className="text-right">{t("actions")}</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {isLoadingOnboardedUsers ? (
//                       Array(5)
//                         .fill(0)
//                         .map((_, index) => (
//                           <TableRow key={index}>
//                             <TableCell colSpan={5} className="h-16 text-center">
//                               <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                     ) : onboardedTeachers?.users && onboardedTeachers.users.length > 0 ? (
//                       onboardedTeachers.users.map((teacher) => (
//                         <TableRow key={teacher.id}>
//                           <TableCell className="font-medium">
//                             {teacher.staff?.first_name} {teacher.staff?.middle_name} {teacher.staff?.last_name}
//                           </TableCell>
//                           <TableCell>{teacher.saral_email}</TableCell>
//                           <TableCell>
//                             <div className="flex flex-wrap gap-1">
//                               {teacher.staff?.assigend_classes && teacher.staff.assigend_classes.length > 0 ? (
//                                 teacher.staff.assigend_classes.map((cls) => (
//                                   <Badge
//                                     key={cls.id}
//                                     variant="outline"
//                                     className="bg-blue-50 text-blue-700 border-blue-200"
//                                   >
//                                     Class{" "}
//                                     {academicClasses?.find((academicClass) => academicClass.id === cls.class?.class_id)
//                                       ?.class || "N/A"}{" "}
//                                     {cls.class?.division || ""}
//                                     {cls.class?.aliases && <span className="ml-1 text-xs">({cls.class.aliases})</span>}
//                                   </Badge>
//                                 ))
//                               ) : (
//                                 <span className="text-muted-foreground text-sm">{t("no_classes_assigned")}</span>
//                               )}
//                             </div>
//                           </TableCell>
//                           <TableCell>
//                             <Badge variant={Boolean(Number(teacher.is_active)) ? "default" : "secondary"}>
//                               {Boolean(Number(teacher.is_active)) ? t("active") : t("inactive")}
//                             </Badge>
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex items-center justify-end space-x-2">
//                               <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 onClick={() => handleClassAllocation(teacher)}
//                                 title={t("manage_classes")}
//                               >
//                                 <BookOpen className="h-4 w-4" />
//                                 <span className="sr-only">{t("manage_classes")}</span>
//                               </Button>
//                               <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 onClick={() => handleStatusChange(teacher)}
//                                 className={
//                                   Boolean(Number(teacher.is_active))
//                                     ? "text-destructive hover:text-destructive"
//                                     : "text-green-600 hover:text-green-600"
//                                 }
//                                 title={Boolean(Number(teacher.is_active)) ? t("deactivate") : t("activate")}
//                               >
//                                 {Boolean(Number(teacher.is_active)) ? (
//                                   <AlertCircle className="h-4 w-4" />
//                                 ) : (
//                                   <CheckCircle className="h-4 w-4" />
//                                 )}
//                                 <span className="sr-only">
//                                   {Boolean(Number(teacher.is_active)) ? t("deactivate") : t("activate")}
//                                 </span>
//                               </Button>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     ) : (
//                       <TableRow>
//                         <TableCell colSpan={5} className="h-24 text-center">
//                           {t("no_teachers_found")}
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>

//               {onboardedTeachers?.page_meta && (
//                 <div className="mt-4 flex justify-center">
//                   <SaralPagination
//                     currentPage={onboardedTeachers.page_meta.current_page}
//                     totalPages={onboardedTeachers.page_meta.last_page}
//                     onPageChange={handlePageChange}
//                   />
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Management User Dialog */}
//       <Dialog open={isManagementUserDialogOpen} onOpenChange={setIsManagementUserDialogOpen}>
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>{selectedUser ? t("edit_management_user") : t("add_management_user")}</DialogTitle>
//             <DialogDescription>
//               {selectedUser
//                 ? t("update_user_details_and_permissions")
//                 : t("create_a_new_management_user_with_specific_role")}
//             </DialogDescription>
//           </DialogHeader>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(handleSubmitManagementUser)} className="space-y-4">
//               <div className="grid gap-4">
//                 <FormField
//                   control={form.control}
//                   name="name"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>{t("name")}</FormLabel>
//                       <FormControl>
//                         <Input {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="role_id"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>{t("role")}</FormLabel>
//                       <Select onValueChange={field.onChange} defaultValue={field.value}>
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder={t("select_role")} />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem key={0} value={" "}>
//                             Select Any Role
//                           </SelectItem>
//                           {managementRoles.map((role) => (
//                             <SelectItem className="cursor" key={role.id} value={role.id.toString()}>
//                               {role.value}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <p className="text-sm text-muted-foreground">
//                         {field.value
//                           ? managementRoles.find((r) => r.id.toString() === field.value)?.description
//                           : t("select_a_role_to_see_description")}
//                       </p>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {selectedUser && (
//                   <FormField
//                     control={form.control}
//                     name="is_active"
//                     render={({ field }) => (
//                       <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-1">
//                         <FormControl>
//                           <Switch checked={Boolean(Number(field.value))} onCheckedChange={field.onChange} />
//                         </FormControl>
//                         <div className="space-y-1 leading-none">
//                           <FormLabel>{t("active_user")}</FormLabel>
//                         </div>
//                       </FormItem>
//                     )}
//                   />
//                 )}
//               </div>

//               <DialogFooter>
//                 <Button type="button" variant="outline" onClick={() => setIsManagementUserDialogOpen(false)}>
//                   {t("cancel")}
//                 </Button>
//                 <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
//                   {isLoading || form.formState.isSubmitting ? (
//                     <>
//                       <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}
//                     </>
//                   ) : selectedUser ? (
//                     t("update_user")
//                   ) : (
//                     t("create_user")
//                   )}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>

//       {/* Onboard Teacher Dialog */}
//       <Dialog open={isOnboardTeacherDialogOpen} onOpenChange={setIsOnboardTeacherDialogOpen}>
//         <DialogContent className="sm:max-w-[600px]">
//           <DialogHeader>
//             <DialogTitle>{t("onboard_teacher")}</DialogTitle>
//             <DialogDescription>
//               {t("select_a_teacher_and_assign_classes_to_onboard_them_to_the_platform")}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4 py-2">
//             <div className="space-y-2">
//               <Label>{t("select_teacher")}</Label>
//               <Select
//                 onValueChange={(value) => {
//                   const teacher = nonOnboardedTeachers?.find((t) => t.id.toString() === value)
//                   teacher && setSelectedTeacher(teacher)
//                 }}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder={t("select_a_teacher")} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {isLoadingNonOnboardedTeachers ? (
//                     <SelectItem value="loading" disabled>
//                       {t("loading...")}
//                     </SelectItem>
//                   ) : nonOnboardedTeachers && nonOnboardedTeachers.length > 0 ? (
//                     nonOnboardedTeachers.map((teacher) => (
//                       <SelectItem key={teacher.id} value={teacher.id.toString()}>
//                         {teacher.first_name} {teacher.middle_name} {teacher.last_name}
//                       </SelectItem>
//                     ))
//                   ) : (
//                     <SelectItem value="none" disabled>
//                       {t("no_teachers_available")}
//                     </SelectItem>
//                   )}
//                 </SelectContent>
//               </Select>
//             </div>

//             {selectedTeacher && (
//               <>
//                 <Separator />

//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <Label>{t("assign_classes")}</Label>
//                     <p className="text-sm text-muted-foreground">
//                       {t("selected")}: {selectedClasses.length}
//                     </p>
//                   </div>

//                   {isLoadingClasses ? (
//                     <div className="text-center py-4">
//                       <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
//                       <p className="mt-2 text-sm text-muted-foreground">{t("loading_classes...")}</p>
//                     </div>
//                   ) : academicDivisions && academicDivisions.length > 0 ? (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
//                       {academicDivisions.map((cls) => (
//                         <div key={cls.id} className="flex items-center space-x-2">
//                           <Checkbox
//                             id={`class-${cls.id}`}
//                             checked={selectedClasses.includes(cls.id)}
//                             onCheckedChange={() => toggleClassSelection(cls.id)}
//                           />
//                           <Label htmlFor={`class-${cls.id}`} className="text-sm">
//                             Class{" "}
//                             {academicClasses?.find((academicClass) => academicClass.id === cls.class_id)?.class ||
//                               "N/A"}{" "}
//                             {cls.division}
//                           </Label>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center py-4">
//                       <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground" />
//                       <p className="mt-2 text-sm text-muted-foreground">{t("no_classes_available")}</p>
//                     </div>
//                   )}

//                   <p className="text-sm text-muted-foreground">
//                     {t("note_class_assignment_is_optional_and_can_be_updated_later")}
//                   </p>
//                 </div>
//               </>
//             )}
//           </div>

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => setIsOnboardTeacherDialogOpen(false)}>
//               {t("cancel")}
//             </Button>
//             <Button onClick={handleSubmitOnboardTeacher} disabled={!selectedTeacher || isLoading}>
//               {isLoading ? (
//                 <>
//                   <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("onboarding")}
//                 </>
//               ) : (
//                 t("onboard_teacher")
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Class Allocation Dialog */}
//       <Dialog open={isClassAllocationDialogOpen} onOpenChange={setIsClassAllocationDialogOpen}>
//         <DialogContent className="sm:max-w-[600px]">
//           <DialogHeader>
//             <DialogTitle>{t("manage_class_allocations")}</DialogTitle>
//             <DialogDescription>
//               {selectedTeacher && (
//                 <>
//                   {t("update_class_allocations_for")} {selectedTeacher?.first_name} {selectedTeacher?.last_name}
//                 </>
//               )}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4 py-2">
//             <div className="space-y-2">
//               <div className="flex justify-between items-center">
//                 <Label>{t("assigned_classes")}</Label>
//                 <p className="text-sm text-muted-foreground">
//                   {t("selected")}: {selectedClasses.length}
//                 </p>
//               </div>

//               {isLoadingClasses ? (
//                 <div className="text-center py-4">
//                   <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
//                   <p className="mt-2 text-sm text-muted-foreground">{t("loading_classes...")}</p>
//                 </div>
//               ) : academicDivisions && academicDivisions.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
//                   {academicDivisions &&
//                     academicDivisions.map((cls) => (
//                       <div key={cls.id} className="flex items-center space-x-2">
//                         <Checkbox
//                           id={`class-alloc-${cls.id}`}
//                           checked={selectedClasses.includes(cls.id)}
//                           onCheckedChange={() => toggleClassSelection(cls.id)}
//                         />
//                         <Label htmlFor={`class-alloc-${cls.id}`} className="text-sm">
//                           Class Class{" "}
//                           {academicClasses?.find((academicClass) => academicClass.id === cls.class_id)?.class || "N/A"}{" "}
//                           {cls.division}
//                         </Label>
//                       </div>
//                     ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-4">
//                   <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground" />
//                   <p className="mt-2 text-sm text-muted-foreground">{t("no_classes_available")}</p>
//                 </div>
//               )}

//               {selectedTeacher?.assigend_classes && selectedTeacher.assigend_classes.length > 0 && (
//                 <div className="pt-2">
//                   <p className="text-sm font-medium mb-2">{t("current_assignments")}:</p>
//                   <div className="flex flex-wrap gap-2">
//                     {selectedTeacher.assigend_classes.map((cls) => (
//                       <Badge key={cls.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
//                         Class{" "}
//                         {academicClasses?.find((academicClass) => academicClass.id === cls.class?.class_id)?.class ||
//                           "N/A"}{" "}
//                         {cls.class?.division}
//                         {cls.class?.aliases && <span className="ml-1 text-xs">({cls.class.aliases})</span>}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => setIsClassAllocationDialogOpen(false)}>
//               {t("cancel")}
//             </Button>
//             <Button onClick={handleSubmitClassAllocation} disabled={isLoading}>
//               {isLoading ? (
//                 <>
//                   <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t("updating")}
//                 </>
//               ) : (
//                 t("update_classes")
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Activate/Deactivate User Confirmation Dialog */}
//       <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>{Boolean(Number(selectedUser?.is_active)) ? t("deactivate_user") : t("activate_user")}</DialogTitle>
//             <DialogDescription>
//               {Boolean(Number(selectedUser?.is_active))
//                 ? t("are_you_sure_you_want_to_deactivate_this_user")
//                 : t("are_you_sure_you_want_to_activate_this_user")}
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="flex justify-end space-x-2 mt-4">
//             <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
//               {t("cancel")}
//               {selectedUser?.is_active}
//             </Button>
//             <Button className="text-white" variant={Boolean(Number(selectedUser?.is_active)) ? "destructive" : "default"} onClick={confirmDeactivateUser}>
//               {Boolean(Number(selectedUser?.is_active)) ? t("deactivate") : t("activate") }
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }



import { DialogFooter } from "@/components/ui/dialog"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { Plus, UserPlus, Users, Shield, BookOpen, RefreshCw, Edit, UserX, UserCheck, AlertCircle } from 'lucide-react'
import type { User } from "@/types/user"
import type { PageMeta } from "@/types/global"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  useLazyFetchManagementUsersQuery,
  useLazyFetchOnBoardedUserQuery,
  useLazyFetchNonOnBoardedTeacherQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useOnBoardTeacherAsUserMutation,
  useUpdateOnBoardTeacherAsUserMutation,
} from "@/services/UserManagementService"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"

// Import zod at the top of the file
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { StaffType } from "@/types/staff"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { Switch } from "@/components/ui/switch"
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

// Add the user form schema after the managementRoles constant
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
  const [onboardTeacher, { isLoading: isOnboardingTeacher }] = useOnBoardTeacherAsUserMutation()
  const [updateOnBoardedStaff, { isLoading: isUpdatingTeacherClasses }] = useUpdateOnBoardTeacherAsUserMutation()

  // State
  const [activeTab, setActiveTab] = useState("management")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")

  const [managementUsers, setManagementUsers] = useState<{ users: User[]; page_meta: PageMeta } | null>(null)
  const [onboardedTeachers, setOnboardedTeachers] = useState<{ users: User[]; page_meta: PageMeta } | null>(null)

  // Dialog states
  const [isManagementUserDialogOpen, setIsManagementUserDialogOpen] = useState(false)
  const [isOnboardTeacherDialogOpen, setIsOnboardTeacherDialogOpen] = useState(false)
  const [isClassAllocationDialogOpen, setIsClassAllocationDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Selected items
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<StaffType | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [unassignClasses, setUnassignClasses] = useState<number[]>([])
  const [onboardUsername, setOnboardUsername] = useState<string>("")
  const [onboardPassword, setOnboardPassword] = useState<string>("")

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.school_id) {
      fetchDataForActiveTab(activeTab, 1)

      if (!academicClasses) {
        getAcademicClasses(currentUser.school_id)
      }
    }
  }, [currentUser, activeTab, selectedRole, selectedStatus])

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
          title: "Error",
          description: "Failed to fetch management users",
          variant: "destructive",
        })
      }
    } else if (tab === "staff") {
      try {
        const response = await fetchOnBoardedUsers({
          school_id: currentUser.school_id,
          page,
        })

        if (response.data) {
          setOnboardedTeachers({
            users: response.data.data,
            page_meta: response.data.meta,
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch onboarded teachers",
          variant: "destructive",
        })
      }
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchDataForActiveTab(activeTab, page)
  }

  // Handle filter change
  const handleFilterChange = () => {
    fetchDataForActiveTab(activeTab, 1)
  }

  // Reset filters
  const [isResetting, setIsResetting] = useState(false)

  // Update the resetFilters function
  const resetFilters = async () => {
    setIsResetting(true)
    setSearchTerm("")
    setSelectedRole("")
    setSelectedStatus("")

    try {
      await fetchDataForActiveTab(activeTab, 1)
    } finally {
      setIsResetting(false)
    }
  }

  // Handle add management user
  const handleAddManagementUser = () => {
    setSelectedUser(null)
    setIsManagementUserDialogOpen(true)
  }

  // Handle edit management user
  const handleEditManagementUser = (user: User) => {
    setSelectedUser(user)
    setIsManagementUserDialogOpen(true)
  }

  // Handle onboard teacher dialog
  const handleOnboardTeacher = () => {
    setSelectedTeacher(null)
    setSelectedClasses([])
    setOnboardUsername("")
    setOnboardPassword("")
    setIsOnboardTeacherDialogOpen(true)
    fetchNonOnBoardedTeachers({
      page: 1,
      school_id: currentUser!.school_id,
      academic_sessions: CurrentAcademicSessionForSchool!.id,
    })
  }

  // Handle class allocation dialog
  const handleClassAllocation = (user: User) => {
    setSelectedUser(user)
    setSelectedTeacher(user.staff)

    // Initialize selected classes from teacher's current classes
    const currentClasses = (user.staff && user.staff.assigend_classes.map((cls: AssignedClasses) => cls.class.id)) || []
    setSelectedClasses([...currentClasses])
    setUnassignClasses([])

    setIsClassAllocationDialogOpen(true)
  }

  // Handle status change (activate/deactivate) user
  const handleStatusChange = (user: User) => {
    setSelectedUser(user)
    setIsDeleteConfirmOpen(true)
  }

  // Submit management user form
  const handleSubmitManagementUser = async (values: UserFormValues) => {
    try {
      if (selectedUser) {
        // Update existing user
        await updateUser({
          user_id: selectedUser.id,
          payload: {
            name: values.name,
            is_active: values.is_active,
          },
        }).unwrap()

        toast({
          title: "Success",
          description: "User updated successfully",
        })
      } else {
        // Create new user
        await addUser({
          name: values.name,
          username: values.username,
          password: values.password,
          role_id: Number.parseInt(values.role_id),
          is_active: values.is_active ?? true,
        }).unwrap()

        toast({
          title: "Success",
          description: "User created successfully",
        })
      }

      setIsManagementUserDialogOpen(false)
      fetchDataForActiveTab("management", 1)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as { data?: { message?: string } })?.data?.message || "Failed to create/update user",
        variant: "destructive",
      })

    }
  }

  // Submit onboard teacher form
  const handleSubmitOnboardTeacher = async () => {
    if (!selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive",
      })
      return
    }

    try {
      if (!onboardUsername || onboardUsername.trim().length < 3) {
        toast({
          title: "Error",
          description: "Please enter a valid username (at least 3 characters)",
          variant: "destructive",
        })
        return
      }

      if (!onboardPassword || onboardPassword.trim().length < 8) {
        toast({
          title: "Error",
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
        },
      }).unwrap()

      toast({
        title: "Success",
        description: "Teacher onboarded successfully",
      })

      setIsOnboardTeacherDialogOpen(false)
      fetchDataForActiveTab("staff", 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to onboard teacher",
        variant: "destructive",
      })
    }
  }

  // Submit class allocation form
  const handleSubmitClassAllocation = async () => {
    if (!selectedTeacher || !selectedUser) return
    console.log("manage_class_allocations", selectedTeacher)
    try {
      await updateOnBoardedStaff({
        user_id: selectedUser.id,
        payload: {
          assign_classes: selectedClasses,
          unassign_classes: unassignClasses,
        },
      }).unwrap()

      toast({
        title: "Success",
        description: "Classes updated successfully",
      })

      setIsClassAllocationDialogOpen(false)
      fetchDataForActiveTab("staff", 1)
    } catch (error) {
      toast({
        title: "Error",
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
            is_active: !Boolean(Number(selectedUser.is_active)), // Toggle activation status
          },
        }).unwrap()
      } else if (activeTab === "staff") {
        // Update API for Teaching Staff
        await updateOnBoardedStaff({
          user_id: selectedUser.id,
          payload: {
            is_active: !Boolean(Number(selectedUser.is_active)), // Toggle activation status
          },
        }).unwrap()
      }

      toast({
        title: "Success",
        description: selectedUser.is_active ? "User deactivated successfully" : "User activated successfully",
      })

      setIsDeleteConfirmOpen(false)
      fetchDataForActiveTab(activeTab, 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  // Toggle class selection
  const toggleClassSelection = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId))

      // If this class was previously assigned to the teacher, add it to unassign list
      const currentClasses =
        selectedTeacher && selectedTeacher.assigend_classes
          ? selectedTeacher.assigend_classes.map((assign_class: AssignedClasses) => assign_class.class.id)
          : []

      if (currentClasses.includes(classId) && !unassignClasses.includes(classId)) {
        setUnassignClasses([...unassignClasses, classId])
      }
    } else {
      setSelectedClasses([...selectedClasses, classId])

      // If this class was in the unassign list, remove it
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

  // Add form initialization in the component
  // Add this near the top of the component
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: selectedUser?.name || "",
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
        role_id: selectedUser.role_id?.toString() || "",
        is_active: selectedUser.is_active || false,
      })
    } else {
      form.reset({
        name: "",
        username: "",
        role_id: "",
        is_active: true,
      })
    }
  }, [selectedUser, form])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("user_management")}</h1>
          <p className="text-muted-foreground mt-1">{t("manage_users_and_their_permissions_in_the_system")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("management_users")}
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("teaching_staff")}
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
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                            <TableCell colSpan={5} className="h-16 text-center">
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

        {/* Teaching Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t("teaching_staff")}
              </CardTitle>
              <CardDescription>{t("manage_teaching_staff_access_and_class_allocations")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {/* Search and Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder={t("search_teachers")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                    <Button onClick={handleOnboardTeacher} size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {t("onboard_teacher")}
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
                      <TableHead>{t("assigned_classes")}</TableHead>
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
                            <TableCell colSpan={5} className="h-16 text-center">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : onboardedTeachers?.users && onboardedTeachers.users.length > 0 ? (
                      onboardedTeachers.users.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            {teacher.staff?.first_name} {teacher.staff?.middle_name} {teacher.staff?.last_name}
                          </TableCell>
                          <TableCell>{teacher.username || teacher.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {teacher.staff?.assigend_classes && teacher.staff.assigend_classes.length > 0 ? (
                                teacher.staff.assigend_classes.map((cls) => (
                                  <Badge
                                    key={cls.id}
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {academicClasses?.find((academicClass) => academicClass.id === cls.class?.class_id)
                                      ?.class || "N/A"}{" "}
                                    {cls.class?.division || ""}
                                    {cls.class?.aliases && <span className="ml-1 text-xs">({cls.class.aliases})</span>}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">{t("no_classes_assigned")}</span>
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
                                <BookOpen className="h-4 w-4" />
                                {t("manage_classes")}
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t("no_teachers_found")}
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
      </Tabs>

      {/* Management User Dialog */}
      <Dialog open={isManagementUserDialogOpen} onOpenChange={setIsManagementUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

      {/* Onboard Teacher Dialog */}
      <Dialog open={isOnboardTeacherDialogOpen} onOpenChange={setIsOnboardTeacherDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("onboard_teacher")}</DialogTitle>
            <DialogDescription>
              {t("select_a_teacher_and_assign_classes_to_onboard_them_to_the_platform")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("select_teacher")}</Label>
              <Select
                onValueChange={(value) => {
                  const teacher = nonOnboardedTeachers?.find((t) => t.id.toString() === value)
                  teacher && setSelectedTeacher(teacher)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_a_teacher")} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingNonOnboardedTeachers ? (
                    <SelectItem value="loading" disabled>
                      {t("loading...")}
                    </SelectItem>
                  ) : nonOnboardedTeachers && nonOnboardedTeachers.length > 0 ? (
                    nonOnboardedTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.first_name} {teacher.middle_name} {teacher.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {t("no_teachers_available")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="Enter a unique username for this teacher"
                value={onboardUsername}
                onChange={(e) => setOnboardUsername(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This will be used by the teacher to log in.</p>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={onboardPassword}
                onChange={(e) => setOnboardPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">The teacher will use this password to log in.</p>
            </div>

            {selectedTeacher && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
                      {academicDivisions.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={() => toggleClassSelection(cls.id)}
                          />
                          <Label htmlFor={`class-${cls.id}`} className="text-sm">
                            {academicClasses?.find((academicClass) => academicClass.id === cls.class_id)?.class ||
                              "N/A"}{" "}
                            {cls.division}
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

                  <p className="text-sm text-muted-foreground">
                    {t("note_class_assignment_is_optional_and_can_be_updated_later")}
                  </p>
                </div>
              </>
            )}
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
                t("onboard_teacher")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Allocation Dialog */}
      <Dialog open={isClassAllocationDialogOpen} onOpenChange={setIsClassAllocationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("manage_class_allocations")}</DialogTitle>
            <DialogDescription>
              {selectedTeacher && (
                <>
                  {t("update_class_allocations_for")} {selectedTeacher?.first_name} {selectedTeacher?.last_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {academicDivisions &&
                    academicDivisions.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-alloc-${cls.id}`}
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={() => toggleClassSelection(cls.id)}
                        />
                        <Label htmlFor={`class-alloc-${cls.id}`} className="text-sm">
                          {academicClasses?.find((academicClass) => academicClass.id === cls.class_id)?.class || "N/A"}{" "}
                          {cls.division}
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
                          "N/A"}{" "}
                        {cls.class?.division}
                        {cls.class?.aliases && <span className="ml-1 text-xs">({cls.class.aliases})</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
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
              ) : (
                t("update_classes")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate User Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
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
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              {t("cancel")}
              {selectedUser?.is_active}
            </Button>
            <Button className="text-white" variant={Boolean(Number(selectedUser?.is_active)) ? "destructive" : "default"} onClick={confirmDeactivateUser}>
              {Boolean(Number(selectedUser?.is_active)) ? t("deactivate") : t("activate") }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}