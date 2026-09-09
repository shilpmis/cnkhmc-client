// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Skeleton } from "@/components/ui/skeleton"
// import {
//   Tag,
//   Link,
//   Users,
//   AlertCircle,
//   CheckCircle2,
//   XCircle,
//   AlertTriangle,
//   ArrowRightLeft,
//   Search,
//   X,
// } from "lucide-react"
// import {
//   useGetAllFeesTypeQuery,
//   useLazyGetConcessionsInDetailQuery,
//   useUpdateConcsessionAppliedToPlanMutation,
//   useUpdateConcsessionAppliedToStudentMutation,
// } from "@/services/feesService"
// import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
// import { toast } from "@/hooks/use-toast"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
// import {
//   selectAccademicSessionsForSchool,
//   selectActiveAccademicSessionsForSchool,
//   selectAuthState,
// } from "@/redux/slices/authSlice"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import type { FeesType } from "@/types/fees"

// interface ConcessionDetailsDialogProps {
//   concessionId: number
// }

// interface StatusUpdateData {
//   id: number
//   type: "plan" | "student"
//   currentStatus: "Active" | "Inactive"
//   name: string
//   plan_id: number
//   student_id?: number
//   concession_id: number
//   planName?: string
//   studentName?: string
//   feeType?: string
//   deductionType?: string
//   deductionValue?: string
// }

// interface StudentFilters {
//   classId: string
//   divisionId: string
//   searchTerm: string
// }

// export const ConcessionDetailsDialog: React.FC<ConcessionDetailsDialogProps> = ({ concessionId }) => {
//   const { t } = useTranslation()
//   const [activeTab, setActiveTab] = useState("overview")
//   const [studentFilters, setStudentFilters] = useState<StudentFilters>({
//     classId: "0",
//     divisionId: "0",
//     searchTerm: "",
//   })

//   const [getConcessionDetails, { data: concessionDetails, isLoading, isError }] = useLazyGetConcessionsInDetailQuery()
//   const [updateConcessionStatusForPlan, { isLoading: isUpdatingPlan }] = useUpdateConcsessionAppliedToPlanMutation()
//   const [updateConcessionStatusForStudent, { isLoading: isUpdatingStudent }] =
//     useUpdateConcsessionAppliedToStudentMutation()
//   const [getAcademicClasses] = useLazyGetAcademicClassesQuery()

//   const academicClasses = useAppSelector(selectAcademicClasses)
//   const academicDivisions = useAppSelector(selectAllAcademicClasses)
//   const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
//   const authState = useAppSelector(selectAuthState)
//   const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

//   // State for confirmation dialog
//   const [confirmDialog, setConfirmDialog] = useState(false)
//   const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData | null>(null)

//   // Get fee types for name mapping
//   const { data: feeTypes } = useGetAllFeesTypeQuery(
//     { academic_session_id: currentAcademicSession?.id || 0, applicable_to: "All" },
//     { skip: !currentAcademicSession?.id },
//   )

//   // Get fee type name from ID using the API data
//   const getFeeTypeName = (feeTypeId: number): string => {
//     if (!feeTypeId) return t("unknown_fee_type")

//     if (feeTypes && feeTypes.length > 0) {
//       const feeType = feeTypes.find((type: FeesType) => type.id === feeTypeId)
//       if (feeType) {
//         return feeType.name
//       }
//     }
//     return `${t("fee_type")} ${feeTypeId}`
//   }

//   // Get available divisions for selected class
//   const getAvailableDivisions = () => {
//     if (!academicDivisions || !studentFilters.classId) return []

//     return academicDivisions.filter((div) => div.class_id.toString() === studentFilters.classId)
//   }

//   // Filter students based on current filters
//   const getFilteredStudents = () => {
//     if (!concessionDetails?.concession_holder_students) return []

//     return concessionDetails.concession_holder_students.filter((item) => {
//       const matchesClass =
//         !studentFilters.classId ||
//         item.student?.academic_class?.[0]?.class?.class_id?.toString() === studentFilters.classId

//       const matchesDivision =
//         !studentFilters.divisionId ||
//         item.student?.academic_class?.[0]?.class?.id?.toString() === studentFilters.divisionId

//       const matchesSearch =
//         !studentFilters.searchTerm ||
//         `${item.student?.first_name} ${item.student?.middle_name || ""} ${item.student?.last_name}`
//           .toLowerCase()
//           .includes(studentFilters.searchTerm.toLowerCase()) ||
//         item.student?.gr_no?.toString().includes(studentFilters.searchTerm)

//       return matchesClass && matchesDivision && matchesSearch
//     })
//   }

//   // Handle filter changes
//   const handleFilterChange = (key: keyof StudentFilters, value: string) => {
//     setStudentFilters((prev) => ({
//       ...prev,
//       [key]: value,
//       // Reset division when class changes
//       ...(key === "classId" ? { divisionId: "0" } : {}),
//     }))
//   }

//   // Clear filters
//   const clearFilters = () => {
//     setStudentFilters({
//       classId: "0",
//       divisionId: "0",
//       searchTerm: "",
//     })
//   }

//   // Count active filters
//   const activeFiltersCount = Object.values(studentFilters).filter(Boolean).length

//   useEffect(() => {
//     if (!academicDivisions) {
//       getAcademicClasses(authState.user!.school_id)
//     }
//   }, [academicDivisions, getAcademicClasses, authState.user])

//   useEffect(() => {
//     loadConcessionDetails()
//   }, [concessionId, currentAcademicSession])

//   const loadConcessionDetails = () => {
//     getConcessionDetails({ concession_id: concessionId, academic_session: currentAcademicSession!.id })
//       .unwrap()
//       .catch((error) => {
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Failed to load concession details. Please try again.",
//         })
//       })
//   }

//   // Format currency
//   const formatCurrency = (amount: string | number) => {
//     return `₹${Number(amount).toLocaleString("en-IN", {
//       maximumFractionDigits: 2,
//       minimumFractionDigits: 2,
//     })}`
//   }

//   // Get class name from class ID
//   const getClassName = (division_id: number) => {
//     if (!academicDivisions || !academicClasses) return "Loading..."

//     const division = academicDivisions.find((div) => div.id === division_id)
//     const clas = academicClasses.find((cls) => cls.id === division?.class_id)
//     return `Class ${clas?.class} ${division?.division} ${division?.aliases ? `- ${division?.aliases}` : ""}`
//   }

//   // Handle status toggle click
//   const handleStatusToggle = (data: StatusUpdateData) => {
//     setStatusUpdateData(data)
//     setConfirmDialog(true)
//   }

//   // Handle confirmation of status update
//   const handleConfirmStatusUpdate = async () => {
//     if (!statusUpdateData) return

//     try {
//       const newStatus = statusUpdateData.currentStatus === "Active" ? "Inactive" : "Active"

//       const loadingToastId = toast({
//         title: "Updating Status",
//         description: "Please wait while we update the concession status...",
//       }).id

//       if (statusUpdateData.type === "plan") {
//         await updateConcessionStatusForPlan({
//           concession_id: statusUpdateData.concession_id,
//           plan_id: statusUpdateData.plan_id,
//           payload: {
//             status: newStatus,
//           },
//         }).unwrap()
//       } else if (statusUpdateData.type === "student" && statusUpdateData.student_id) {
//         await updateConcessionStatusForStudent({
//           concession_id: statusUpdateData.concession_id,
//           plan_id: statusUpdateData.plan_id,
//           student_id: statusUpdateData.student_id,
//           payload: {
//             status: newStatus,
//           },
//         }).unwrap()
//       }

//       toast({
//         title: "Status Updated",
//         description: `Concession has been ${newStatus === "Active" ? "activated" : "deactivated"} successfully.`,
//         variant: "default",
//       })

//       loadConcessionDetails()
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Update Failed",
//         description: `${error.data.message}`,
//       })
//     } finally {
//       setConfirmDialog(false)
//       setStatusUpdateData(null)
//     }
//   }

//   const isUpdating = isUpdatingPlan || isUpdatingStudent

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <Skeleton className="h-8 w-3/4" />
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Skeleton className="h-32" />
//           <Skeleton className="h-32" />
//         </div>
//         <Skeleton className="h-64" />
//       </div>
//     )
//   }

//   if (isError || !concessionDetails) {
//     return (
//       <div className="p-6 text-center">
//         <p className="text-red-500">{t("failed_to_load_concession_details._please_try_again.")}</p>
//         <Button onClick={loadConcessionDetails} className="mt-4">
//           {t("retry")}
//         </Button>
//       </div>
//     )
//   }

//   const { concession, concession_holder_plans, concession_holder_students } = concessionDetails
//   const isPlanConcession = concession.applicable_to === "plan"
//   const isStudentConcession = concession.applicable_to === "students"

//   // Get available classes from academic divisions
//   const availableClasses = academicClasses || []
//   const filteredStudents = getFilteredStudents()

//   const totalAppliedPlans = isPlanConcession
//     ? concession_holder_plans?.length || 0
//     : [...new Set(concession_holder_students?.map((s) => s.fees_plan_id) || [])].length

//   const totalFeeTypes = isPlanConcession
//     ? [...new Set(concession_holder_plans?.map((p) => p.fees_type_id).filter(Boolean) || [])].length
//     : 0

//   const totalStudents = isStudentConcession
//     ? [...new Set(concession_holder_students?.map((s) => s.student_id) || [])].length
//     : 0

//   return (
//     <div className="space-y-6">
//       {/* Confirmation Dialog */}
//       <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               {statusUpdateData?.currentStatus === "Active" ? (
//                 <>
//                   <XCircle className="h-5 w-5 text-destructive" /> {t("deactivate_concession")}
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="h-5 w-5 text-green-500" /> {t("activate_concession")}
//                 </>
//               )}
//             </DialogTitle>
//             <DialogDescription className="pt-2 space-y-2">
//               <Alert
//                 variant={statusUpdateData?.currentStatus === "Active" ? "destructive" : "default"}
//                 className="mt-2"
//               >
//                 <AlertTriangle className="h-4 w-4" />
//                 <AlertTitle>
//                   {statusUpdateData?.currentStatus === "Active"
//                     ? "Warning: Deactivating Concession"
//                     : "Confirm Activation"}
//                 </AlertTitle>
//                 <AlertDescription>
//                   {statusUpdateData?.currentStatus === "Active"
//                     ? "Deactivating this concession will remove the discount from future fee calculations. Any previously applied discounts will remain unchanged."
//                     : "Activating this concession will apply the discount to future fee calculations."}
//                 </AlertDescription>
//               </Alert>

//               <div className="bg-muted p-3 rounded-md mt-3">
//                 <h4 className="font-medium mb-2">{t("concession_details")}</h4>
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
//                   <div className="text-muted-foreground">{t("type")}:</div>
//                   <div className="font-medium capitalize">{statusUpdateData?.type}</div>

//                   {statusUpdateData?.type === "plan" ? (
//                     <>
//                       <div className="text-muted-foreground">{t("plan_name")}:</div>
//                       <div className="font-medium">{statusUpdateData?.name}</div>
//                     </>
//                   ) : (
//                     <>
//                       <div className="text-muted-foreground">{t("student")}:</div>
//                       <div className="font-medium">{statusUpdateData?.studentName}</div>
//                       <div className="text-muted-foreground">{t("plan")}:</div>
//                       <div className="font-medium">{statusUpdateData?.planName}</div>
//                     </>
//                   )}

//                   <div className="text-muted-foreground">{t("deduction")}:</div>
//                   <div className="font-medium">{statusUpdateData?.deductionValue}</div>

//                   <div className="text-muted-foreground">{t("current_status")}:</div>
//                   <div>
//                     <Badge variant={statusUpdateData?.currentStatus === "Active" ? "default" : "destructive"}>
//                       {statusUpdateData?.currentStatus}
//                     </Badge>
//                   </div>

//                   <div className="text-muted-foreground">{t("new_status")}:</div>
//                   <div>
//                     <Badge variant={statusUpdateData?.currentStatus === "Active" ? "destructive" : "default"}>
//                       {statusUpdateData?.currentStatus === "Active" ? "Inactive" : "Active"}
//                     </Badge>
//                   </div>
//                 </div>
//               </div>
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="sm:justify-between mt-4">
//             <Button variant="outline" onClick={() => setConfirmDialog(false)} disabled={isUpdating}>
//               {t("cancel")}
//             </Button>
//             <Button
//               variant={statusUpdateData?.currentStatus === "Active" ? "destructive" : "default"}
//               onClick={handleConfirmStatusUpdate}
//               disabled={isUpdating}
//               className="min-w-[120px]"
//             >
//               {isUpdating ? "Updating..." : statusUpdateData?.currentStatus === "Active" ? "Deactivate" : "Activate"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Tabs value={activeTab} onValueChange={setActiveTab}>
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
//           <TabsTrigger value="students" disabled={isPlanConcession}>
//             {t("students")}{" "}
//             {isStudentConcession && totalStudents > 0 && (
//               <Badge variant="secondary" className="ml-2">
//                 {totalStudents}
//               </Badge>
//             )}
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-lg flex items-center">
//                   <Tag className="mr-2 h-5 w-5" />
//                   {t("concession_details")}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">{t("category")}:</span>
//                   <span className="text-sm font-medium capitalize">{concession.category}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">{t("applicable_to")}:</span>
//                   <Badge variant="outline" className="capitalize">
//                     {concession.applicable_to}
//                   </Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">{t("concession_to")}:</span>
//                   <Badge variant="outline" className="capitalize">
//                     {concession.concessions_to}
//                   </Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">{t("status")}:</span>
//                   <Badge variant={concession.status === "Active" ? "default" : "destructive"}>
//                     {concession.status || "Active"}
//                   </Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">{t("academic_session")}:</span>
//                   <span className="text-sm font-medium">
//                     {AcademicSessionsForSchool
//                       ? AcademicSessionsForSchool.find((session) => session.id === concession.academic_session_id)
//                           ?.session_name || ""
//                       : "Loading..."}
//                   </span>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-lg flex items-center">
//                   <Link className="mr-2 h-5 w-5" />
//                   {t("application_summary")}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">{t("total_applied_plans")}:</span>
//                   <span className="text-sm font-medium">{totalAppliedPlans}</span>
//                 </div>
//                 {isStudentConcession && (
//                   <div className="flex justify-between">
//                     <span className="text-sm text-muted-foreground">{t("total_students")}:</span>
//                     <span className="text-sm font-medium">{totalStudents}</span>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>{t("description")}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm">{concession.description}</p>
//             </CardContent>
//           </Card>

//           <Alert>
//             <AlertCircle className="h-4 w-4" />
//             <AlertTitle>{t("concession_application_details")}</AlertTitle>
//             <AlertDescription>
//               {isPlanConcession &&
//                 concession.concessions_to === "fees_type" &&
//                 t("this_concession_applies_to_specific_fee_types_within_fee_plans.")}
//               {isPlanConcession &&
//                 concession.concessions_to === "plan" &&
//                 t("this_concession_applies_to_entire_fee_plans.")}
//               {isStudentConcession &&
//                 concession.concessions_to === "fees_type" &&
//                 t("this_concession_applies_to_specific_fee_types_for_individual_students.")}
//               {isStudentConcession &&
//                 concession.concessions_to === "plan" &&
//                 t("this_concession_applies_to_entire_fee_plans_for_individual_students.")}
//             </AlertDescription>
//           </Alert>
//         </TabsContent>

//         <TabsContent value="students">
//           {isStudentConcession && concession_holder_students && concession_holder_students.length > 0 ? (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <Users className="mr-2 h-5 w-5" />
//                     {t("students_with_concession")}
//                   </div>
//                   {activeFiltersCount > 0 && (
//                     <Badge variant="secondary">
//                       {activeFiltersCount} {t("filters_active")}
//                     </Badge>
//                   )}
//                 </CardTitle>
//                 <CardDescription>{t("students_who_have_been_granted_this_concession")}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {/* Student Filters */}
//                 <div className="space-y-4 mb-6">
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="text-sm font-medium mb-1 block">{t("class")}</label>
//                       <Select
//                         value={studentFilters.classId}
//                         onValueChange={(value) => handleFilterChange("classId", value)}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("all_classes")} />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="0">{t("all_classes")}</SelectItem>
//                           {availableClasses.map((cls) => (
//                             <SelectItem key={cls.id} value={cls.id.toString()}>
//                               Class {cls.class}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div>
//                       <label className="text-sm font-medium mb-1 block">{t("division")}</label>
//                       <Select
//                         value={studentFilters.divisionId}
//                         onValueChange={(value) => handleFilterChange("divisionId", value)}
//                         disabled={!studentFilters.classId}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("all_divisions")} />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="0">{t("all_divisions")}</SelectItem>
//                           {getAvailableDivisions().map((division) => (
//                             <SelectItem key={division.id} value={division.id.toString()}>
//                               {division.division} {division.aliases && `- ${division.aliases}`}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div>
//                       <label className="text-sm font-medium mb-1 block">{t("search")}</label>
//                       <div className="relative">
//                         <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//                         <Input
//                           placeholder={t("search_by_name_or_gr_number")}
//                           className="pl-8"
//                           value={studentFilters.searchTerm}
//                           onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
//                         />
//                         {studentFilters.searchTerm && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="absolute right-1 top-1 h-6 w-6 p-0"
//                             onClick={() => handleFilterChange("searchTerm", "")}
//                           >
//                             <X className="h-3 w-3" />
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Active Filters Display */}
//                   {activeFiltersCount > 0 && (
//                     <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
//                       <span className="text-sm font-medium">{t("active_filters")}:</span>
//                       {studentFilters.classId !== "0" && (
//                         <Badge variant="secondary" className="flex items-center gap-1">
//                           {t("class")}:{" "}
//                           {availableClasses.find((c) => c.id.toString() === studentFilters.classId)?.class}
//                           <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("classId", "0")} />
//                         </Badge>
//                       )}
//                       {studentFilters.divisionId !== "0" && (
//                         <Badge variant="secondary" className="flex items-center gap-1">
//                           {t("division")}:{" "}
//                           {getAvailableDivisions().find((d) => d.id.toString() === studentFilters.divisionId)?.division}
//                           <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("divisionId", "0")} />
//                         </Badge>
//                       )}
//                       {studentFilters.searchTerm && (
//                         <Badge variant="secondary" className="flex items-center gap-1">
//                           {t("search")}: {studentFilters.searchTerm}
//                           <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("searchTerm", "")} />
//                         </Badge>
//                       )}
//                       <Button variant="outline" size="sm" onClick={clearFilters}>
//                         {t("clear_all")}
//                       </Button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="rounded-md border">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>{t("student")}</TableHead>
//                         <TableHead>{t("gr_number")}</TableHead>
//                         <TableHead>{t("class")}</TableHead>
//                         <TableHead>{t("roll_number")}</TableHead>
//                         <TableHead>{t("fee_plan")}</TableHead>
//                         <TableHead>{t("fees_type")}</TableHead>
//                         <TableHead>{t("deduction")}</TableHead>
//                         <TableHead>{t("status")}</TableHead>
//                         <TableHead>{t("actions")}</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredStudents.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
//                             {activeFiltersCount > 0
//                               ? t("no_students_match_your_filters")
//                               : t("no_students_have_been_granted_this_concession_yet")}
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         filteredStudents.map((item, index) => {
//                           const studentClass = item.student?.academic_class?.[0]
//                           return (
//                             <TableRow key={index}>
//                               <TableCell>
//                                 <div className="flex items-center gap-2">
//                                   <Avatar className="h-8 w-8">
//                                     <AvatarImage
//                                       src={`/placeholder.svg?height=32&width=32`}
//                                       alt={item.student?.first_name}
//                                     />
//                                     <AvatarFallback>
//                                       {item.student?.first_name ? item.student.first_name.charAt(0) : `-`}
//                                       {item.student?.last_name ? item.student.last_name.charAt(0) : ``}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <div>
//                                     <div className="font-medium">
//                                       {item.student?.first_name} {item.student?.middle_name} {item.student?.last_name}
//                                     </div>
//                                   </div>
//                                 </div>
//                               </TableCell>
//                               <TableCell>{item.student?.gr_no}</TableCell>
//                               <TableCell>
// //                                Class {item?.student?.academic_class?.[0].class?.class.class} - {item?.student?.academic_class?.[0].class?.division}                                
// //                             </TableCell>
//                               <TableCell>{item.student?.roll_number}</TableCell>
//                               <TableCell>{item.fees_plan?.name}</TableCell>
//                               <TableCell>
//                                 {item.fees_type_id ? getFeeTypeName(item.fees_type_id!) : "Entire Plan"}
//                               </TableCell>
//                               <TableCell>
//                                 {item.deduction_type === "percentage"
//                                   ? `${item.percentage}%`
//                                   : formatCurrency(item.amount || 0)}
//                               </TableCell>
//                               <TableCell>
//                                 <Badge variant={item.status === "Active" ? "default" : "destructive"}>
//                                   {item.status || "Active"}
//                                 </Badge>
//                               </TableCell>
//                               <TableCell>
//                                 <DropdownMenu>
//                                   <DropdownMenuTrigger asChild>
//                                     <Button variant="outline" size="sm" className="h-8 flex items-center gap-1">
//                                       <ArrowRightLeft className="h-3.5 w-3.5" />
//                                       <span>{t("change_status")}</span>
//                                     </Button>
//                                   </DropdownMenuTrigger>
//                                   <DropdownMenuContent align="end">
//                                     <DropdownMenuItem
//                                       onClick={() =>
//                                         handleStatusToggle({
//                                           id: item.id,
//                                           type: "student",
//                                           currentStatus: item.status || "Active",
//                                           name: item.fees_plan?.name || `Plan #${item.fees_plan_id}`,
//                                           planName: item.fees_plan?.name || `Plan #${item.fees_plan_id}`,
//                                           studentName: `${item.student?.first_name} ${item.student?.last_name}`,
//                                           deductionType: item.deduction_type,
//                                           deductionValue:
//                                             item.deduction_type === "percentage"
//                                               ? `${item.percentage}%`
//                                               : formatCurrency(item.amount || 0),
//                                           concession_id: concessionId,
//                                           plan_id: item.fees_plan_id,
//                                           student_id: item.student_id,
//                                         })
//                                       }
//                                       disabled={item.status === "Active"}
//                                       className={item.status === "Active" ? "text-muted-foreground" : ""}
//                                     >
//                                       <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
//                                       <span>{t("set_active")}</span>
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem
//                                       onClick={() =>
//                                         handleStatusToggle({
//                                           id: item.id,
//                                           type: "student",
//                                           currentStatus: item.status || "Active",
//                                           name: item.fees_plan?.name || `Plan #${item.fees_plan_id}`,
//                                           planName: item.fees_plan?.name || `Plan #${item.fees_plan_id}`,
//                                           studentName: `${item.student?.first_name} ${item.student?.last_name}`,
//                                           deductionType: item.deduction_type,
//                                           deductionValue:
//                                             item.deduction_type === "percentage"
//                                               ? `${item.percentage}%`
//                                               : formatCurrency(item.amount || 0),
//                                           concession_id: concessionId,
//                                           plan_id: item.fees_plan_id,
//                                           student_id: item.student_id,
//                                         })
//                                       }
//                                       disabled={item.status !== "Active"}
//                                       className={item.status !== "Active" ? "text-muted-foreground" : ""}
//                                     >
//                                       <XCircle className="mr-2 h-4 w-4 text-destructive" />
//                                       <span>{t("set_inactive")}</span>
//                                     </DropdownMenuItem>
//                                   </DropdownMenuContent>
//                                 </DropdownMenu>
//                               </TableCell>
//                             </TableRow>
//                           )
//                         })
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-muted-foreground">{t("no_students_have_been_granted_this_concession_yet")}</p>
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }
"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import {
  Tag,
  Users,
  AlertCircle,
  Search,
  X,
  RefreshCw,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react"
import { useLazyGetConcessionsInDetailQuery, useLazyGetConcessionsHolderStudentsQuery } from "@/services/feesService"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { PageMeta } from "@/types/global"

interface ConcessionDetailDialogProps {
  concessionId: number
  isOpen: boolean
  // onClose: () => void
}

interface StudentFilters {
  classId: string
  divisionId: string
  searchTerm: string
}

type SortField = "name" | "gr_no" | "class" | "roll_number" | "deduction" | "status"
type SortDirection = "asc" | "desc"

export const ConcessionDetailDialog: React.FC<ConcessionDetailDialogProps> = ({ concessionId, isOpen }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [studentFilters, setStudentFilters] = useState<StudentFilters>({
    classId: "",
    divisionId: "",
    searchTerm: "",
  })

  // API hooks
  const [getConcessionDetails, { data: concessionDetails, isLoading: isLoadingDetails, error: detailsError }] =
    useLazyGetConcessionsInDetailQuery()

  const [
    getHolderStudents,
    {
      data: holderStudentsResponse,
      isLoading: isLoadingStudents,
      error: studentsError,
      isFetching: isFetchingStudents,
    },
  ] = useLazyGetConcessionsHolderStudentsQuery()

  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()

  // Selectors
  const academicClasses = useAppSelector(selectAcademicClasses)
  const authState = useAppSelector(selectAuthState)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Extract data and meta from API response
  const holderStudents = holderStudentsResponse?.data || []
  const paginationMeta : PageMeta | undefined = holderStudentsResponse?.meta

  // Get available divisions for selected class
  const availableDivisions = useMemo(() => {
    if (!academicClasses || !studentFilters.classId) return []
    const selectedClass = academicClasses.find((cls) => cls.id.toString() === studentFilters.classId)
    return selectedClass?.divisions || []
  }, [academicClasses, studentFilters.classId])

  // Sorting functionality (client-side for current page)
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    )
  }

  // Sort students data (client-side for current page only)
  const sortedStudents = useMemo(() => {
    if (!holderStudents || !sortField) return holderStudents

    return [...holderStudents].sort((a, b) => {
      let aValue: any = ""
      let bValue: any = ""

      switch (sortField) {
        case "name":
          aValue = `${a.first_name || ""} ${a.middle_name || ""} ${a.last_name || ""}`.toLowerCase()
          bValue = `${b.first_name || ""} ${b.middle_name || ""} ${b.last_name || ""}`.toLowerCase()
          break
        case "gr_no":
          aValue = a.gr_no || 0
          bValue = b.gr_no || 0
          break
        case "class":
          aValue = a.class_id || 0
          bValue = b.class_id || 0
          break
        case "roll_number":
          aValue = a.roll_number || 0
          bValue = b.roll_number || 0
          break
        case "deduction":
          aValue = a.deduction_type === "percentage" ? a.percentage || 0 : a.amount || 0
          bValue = b.deduction_type === "percentage" ? b.percentage || 0 : b.amount || 0
          break
        case "status":
          aValue = a.status || "Active"
          bValue = b.status || "Active"
          break
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [holderStudents, sortField, sortDirection])

  // Handle filter changes
  const handleFilterChange = (key: keyof StudentFilters, value: string) => {
    setStudentFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "classId" ? { divisionId: "" } : {}),
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Clear all filters
  const clearFilters = () => {
    setStudentFilters({
      classId: "",
      divisionId: "",
      searchTerm: "",
    })
    setCurrentPage(1)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Get class name helper
  const getClassName = (classId?: number, divisionId?: number) => {
    if (!academicClasses || !classId) return "N/A"

    const cls = academicClasses.find((c) => c.id === classId)
    if (!cls) return "N/A"

    const division = cls.divisions.find((d) => d.id === divisionId)
    return `${cls.class}${division ? ` - ${division.division}` : ""}${
      division?.aliases ? ` (${division.aliases})` : ""
    }`
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Load data functions
  const loadConcessionDetails = () => {
    if (!currentAcademicSession?.id) return

    getConcessionDetails({
      concession_id: concessionId,
      academic_session: currentAcademicSession.id,
    })
      .unwrap()
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load concession details. Please try again.",
        })
      })
  }

  const loadHolderStudents = (page: number = currentPage) => {
    if (!currentAcademicSession?.id) return

    const params: any = {
      concession_id: concessionId,
      academic_session: currentAcademicSession.id,
      page: page,
    }

    if (studentFilters.classId) {
      params.class_id = Number.parseInt(studentFilters.classId)
    }
    if (studentFilters.divisionId) {
      params.division_id = Number.parseInt(studentFilters.divisionId)
    }
    if (studentFilters.searchTerm.trim()) {
      params.search = studentFilters.searchTerm.trim()
    }

    getHolderStudents(params)
      .unwrap()
      .catch((error : any) => {
        toast({
          variant: "destructive",
          title: error.data.message || "Error",
          description: "Failed to load student data. Please try again.",
        })
      })
  }

  // Effects
  useEffect(() => {
    if (!academicClasses) {
      getAcademicClasses(authState.user!.school_id)
    }
  }, [academicClasses, getAcademicClasses, authState.user])

  useEffect(() => {
    if (isOpen && concessionId && currentAcademicSession?.id) {
      loadConcessionDetails()
      loadHolderStudents(1)
    }
  }, [isOpen, concessionId, currentAcademicSession])

  useEffect(() => {
    if (isOpen && concessionId && currentAcademicSession?.id) {
      loadHolderStudents(1)
    }
  }, [studentFilters, isOpen, concessionId, currentAcademicSession])

  useEffect(() => {
    if (isOpen && concessionId && currentAcademicSession?.id) {
      loadHolderStudents(currentPage)
    }
  }, [currentPage])

  // Count active filters
  const activeFiltersCount = Object.values(studentFilters).filter((value) => value.trim() !== "").length

  // Loading skeleton for details
  const DetailsLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-16" />
    </div>
  )

  // Loading skeleton for students table
  const StudentsLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("holder_students")}
            {paginationMeta && paginationMeta.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {paginationMeta.total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoadingDetails ? (
            <DetailsLoadingSkeleton />
          ) : detailsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Details</AlertTitle>
              <AlertDescription>
                Failed to load concession details. Please try again.
                <Button variant="outline" size="sm" className="ml-2" onClick={loadConcessionDetails}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : concessionDetails ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Tag className="mr-2 h-5 w-5" />
                      {t("concession_details")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("name")}:</span>
                      <span className="text-sm font-medium">{concessionDetails.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("category")}:</span>
                      <Badge variant="outline" className="capitalize">
                        {concessionDetails.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("applicable_to")}:</span>
                      <Badge variant="outline" className="capitalize">
                        {concessionDetails.applicable_to}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("concession_to")}:</span>
                      <Badge variant="outline" className="capitalize">
                        {concessionDetails.concessions_to}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("status")}:</span>
                      <Badge variant={concessionDetails.status === "Active" ? "default" : "destructive"}>
                        {concessionDetails.status || "Active"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      {t("application_summary")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("total_students")}:</span>
                      <span className="text-sm font-medium">{paginationMeta?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("active_concessions")}:</span>
                      <span className="text-sm font-medium">
                        {holderStudents?.filter((s) => s.status === "Active").length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("inactive_concessions")}:</span>
                      <span className="text-sm font-medium">
                        {holderStudents?.filter((s) => s.status === "Inactive").length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {concessionDetails.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("description")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{concessionDetails.description}</p>
                  </CardContent>
                </Card>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("concession_information")}</AlertTitle>
                <AlertDescription>
                  This concession is applicable to{" "}
                  <strong>{concessionDetails.applicable_to === "plan" ? "fee plans" : "individual students"}</strong>{" "}
                  and provides discounts on{" "}
                  <strong>
                    {concessionDetails.concessions_to === "plan" ? "entire fee plans" : "specific fee types"}
                  </strong>
                  .
                </AlertDescription>
              </Alert>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("students_with_concession")}
                </div>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      {activeFiltersCount} {t("filters_active")}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadHolderStudents()}
                    disabled={isFetchingStudents}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isFetchingStudents ? "animate-spin" : ""}`} />
                    {t("refresh")}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{t("manage_students_who_have_been_granted_this_concession")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">{t("filter_students")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t("class")}</label>
                      <Select
                        value={studentFilters.classId}
                        onValueChange={(value) => handleFilterChange("classId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("all_classes")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("all_classes")}</SelectItem>
                          {academicClasses?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">{t("division")}</label>
                      <Select
                        value={studentFilters.divisionId}
                        onValueChange={(value) => handleFilterChange("divisionId", value)}
                        disabled={!studentFilters.classId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("all_divisions")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("all_divisions")}</SelectItem>
                          {availableDivisions.map((division) => (
                            <SelectItem key={division.id} value={division.id.toString()}>
                              {division.division} {division.aliases && `- ${division.aliases}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">{t("search")}</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder={t("search_by_name_or_gr_number")}
                          className="pl-8"
                          value={studentFilters.searchTerm}
                          onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                        />
                        {studentFilters.searchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-6 w-6 p-0"
                            onClick={() => handleFilterChange("searchTerm", "")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="flex items-center justify-between mt-4 p-3 bg-muted/50 rounded-md">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium">{t("active_filters")}:</span>
                        {studentFilters.classId && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {t("class")}:{" "}
                            {academicClasses?.find((c) => c.id.toString() === studentFilters.classId)?.class}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("classId", "")} />
                          </Badge>
                        )}
                        {studentFilters.divisionId && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {t("division")}:{" "}
                            {availableDivisions.find((d) => d.id.toString() === studentFilters.divisionId)?.division}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => handleFilterChange("divisionId", "")}
                            />
                          </Badge>
                        )}
                        {studentFilters.searchTerm && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {t("search")}: {studentFilters.searchTerm}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => handleFilterChange("searchTerm", "")}
                            />
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        {t("clear_all")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Students Table */}
              {isLoadingStudents ? (
                <StudentsLoadingSkeleton />
              ) : studentsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Students</AlertTitle>
                  <AlertDescription>
                    Failed to load student data. Please try again.
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => loadHolderStudents()}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 select-none"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center">
                              {t("student")}
                              <SortIcon field="name" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 select-none"
                            onClick={() => handleSort("gr_no")}
                          >
                            <div className="flex items-center">
                              {t("gr_number")}
                              <SortIcon field="gr_no" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 select-none"
                            onClick={() => handleSort("class")}
                          >
                            <div className="flex items-center">
                              {t("class")}
                              <SortIcon field="class" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 select-none"
                            onClick={() => handleSort("roll_number")}
                          >
                            <div className="flex items-center">
                              {t("roll_number")}
                              <SortIcon field="roll_number" />
                            </div>
                          </TableHead>
                          <TableHead>{t("fee_plan")}</TableHead>
                          <TableHead>{t("fee_type")}</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 select-none"
                            onClick={() => handleSort("deduction")}
                          >
                            <div className="flex items-center">
                              {t("deduction")}
                              <SortIcon field="deduction" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 select-none"
                            onClick={() => handleSort("status")}
                          >
                            <div className="flex items-center">
                              {t("status")}
                              <SortIcon field="status" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isFetchingStudents ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              {Array.from({ length: 8 }).map((_, j) => (
                                <TableCell key={j}>
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : sortedStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              {activeFiltersCount > 0
                                ? t("no_students_match_your_filters")
                                : t("no_students_have_been_granted_this_concession_yet")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedStudents.map((student, index) => (
                            <TableRow key={student.id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={student.first_name} />
                                    <AvatarFallback>
                                      {student.first_name?.charAt(0) || ""}
                                      {student.last_name?.charAt(0) || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {student.first_name} {student.middle_name} {student.last_name}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{student.gr_no || "N/A"}</TableCell>
                              <TableCell>{getClassName(student.class_id, student.division_id)}</TableCell>
                              <TableCell>{student.roll_number || "N/A"}</TableCell>
                              <TableCell>{student.fees_plan_name || "N/A"}</TableCell>
                              <TableCell>
                                {student.fees_type_id ? student.fees_type_name || "N/A" : "Entire Plan"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {student.deduction_type === "percentage"
                                    ? `${student.percentage}%`
                                    : formatCurrency(student.amount || 0)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={student.status === "Active" ? "default" : "destructive"}>
                                  {student.status || "Active"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {paginationMeta && paginationMeta.last_page > 1 && (
                    <div className="mt-4">
                      <SaralPagination
                        currentPage={paginationMeta.current_page ?? paginationMeta.currentPage }
                        totalPages={paginationMeta.last_page ?? paginationMeta.lastPage}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}

                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ConcessionDetailDialog
