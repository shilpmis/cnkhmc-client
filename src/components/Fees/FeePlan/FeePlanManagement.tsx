// import type React from "react"
// import { useEffect, useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog"
// import { Badge } from "@/components/ui/badge"
// import { Pencil, Plus, Search, Eye, AlertTriangle, Trash2, CheckCircle, XCircle, Copy, Loader2, MoreVertical } from "lucide-react"
// import { AddFeePlanForm } from "./AddFeePlanForm"
// import {
//   useLazyGetAllFeesTypeQuery,
//   useLazyGetFeesPlanQuery,
//   useUpdateFeesPlanMutation,
//   useCreateFeesPlanMutation,
//   useLazyFetchDetailFeePlanQuery,
//   useLazyUpdateFeesPlanStatusQuery,
// } from "@/services/feesService"
// import type { FeesPlan } from "@/types/fees"
// import type { PageMeta } from "@/types/global"
// import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
// import {
//   selectAccademicSessionsForSchool,
//   selectActiveAccademicSessionsForSchool,
//   selectAuthState,
// } from "@/redux/slices/authSlice"
// import FeePlanDetailsDialog from "./FeePlanDetailsDialog"
// import { SaralPagination } from "@/components/ui/common/SaralPagination"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { type AcademicSession, UserRole } from "@/types/user"
// import { toast } from "@/hooks/use-toast"
// import { useLazyGetAllClassesWithOutFeesPlanQuery } from "@/services/AcademicService"
// import { Label } from "@/components/ui/label"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { AcademicClasses } from "@/types/academic"
// import { useDeleteFeesPlanMutation } from "@/services/feesService"
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu"

// type StatusFilter = "All" | "Active" | "Inactive"
// type ConfirmationDialogProps = {
//   isOpen: boolean
//   title: string
//   description: string
//   onConfirm: () => void
//   onCancel: () => void
//   confirmText: string
//   cancelText: string
//   variant?: "default" | "destructive"
// }

// const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
//   isOpen,
//   title,
//   description,
//   onConfirm,
//   onCancel,
//   confirmText,
//   cancelText,
//   variant = "default",
// }) => {
//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//           <DialogDescription>{description}</DialogDescription>
//         </DialogHeader>
//         <DialogFooter className="flex justify-end space-x-2">
//           <Button variant="outline" onClick={onCancel}>
//             {cancelText}
//           </Button>
//           <Button variant={variant} onClick={onConfirm}>
//             {confirmText}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // Schema for clone form validation
// const cloneFormSchema = z.object({
//   division_id: z.number({
//     required_error: "Please select a class",
//   }),
// })

// type CloneFormValues = z.infer<typeof cloneFormSchema>

// export const FeePlanManagement: React.FC = () => {
//   const { t } = useTranslation()
//   const AcademicDivision = useAppSelector(selectAllAcademicClasses)
//   const authState = useAppSelector(selectAuthState)
//   const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
//   const [getAllFeesType, { data: FeesTypeForSchool, isLoading: isFeeTypeLoading }] = useLazyGetAllFeesTypeQuery()
//   // const [updateFeesPlan, { isLoading: isUpdatingFeePlan }] = useUpdateFeesPlanMutation()
//   const [updateFeesPlanStatus, { isLoading: isUpdatingFeePlanStaus }] = useLazyUpdateFeesPlanStatusQuery()

//   const [createFeesPlan, { isLoading: isCreatingFeePlan }] = useCreateFeesPlanMutation();
//   const [deleteFeesPlan, { isLoading: isFeesPlanDeleting }] = useDeleteFeesPlanMutation();
//   const [getFeePlanInDetail, { data: detailedFeePlan, isLoading: isLoadingDetailedPlan }] =
//     useLazyFetchDetailFeePlanQuery()
//   const [getClassesWithoutFeesPlan, { data: classesWithoutFeesPlan, isLoading: isLoadingClasses }] =
//     useLazyGetAllClassesWithOutFeesPlanQuery()

//   const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
//   const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
//   const AcademicClassesForSchool = useAppSelector(selectAcademicClasses)

//   const [getFeesPlan, { data: FetchedFeePlans, isLoading, isFetching }] = useLazyGetFeesPlanQuery()
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
//     CurrentAcademicSessionForSchool ? CurrentAcademicSessionForSchool?.id.toString() : "",
//   )
//   const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
//   const [currentPage, setCurrentPage] = useState(1)

//   const [DialogForFeesPlan, setDialogForFeesPlan] = useState<{
//     isOpen: boolean
//     paln_id: number | null
//     type: "create" | "update"
//   }>({
//     isOpen: false,
//     paln_id: 0,
//     type: "create",
//   })

//   const [FeePlansDetail, setFeePlansDetail] = useState<{ FeesPlan: FeesPlan[]; page: PageMeta } | null>(null)

//   // New state for the details dialog
//   const [detailsDialog, setDetailsDialog] = useState<{ isOpen: boolean; planId: number | null }>({
//     isOpen: false,
//     planId: null,
//   })

//   // Clone dialog state
//   const [cloneDialog, setCloneDialog] = useState<{
//     isOpen: boolean
//     planId: number | null
//     planName: string
//   }>({
//     isOpen: false,
//     planId: null,
//     planName: "",
//   })

//   // Clone form
//   const cloneForm = useForm<CloneFormValues>({
//     resolver: zodResolver(cloneFormSchema),
//     defaultValues: {
//       division_id: 0,
//     },
//   })

//   // Confirmation dialog state
//   const [confirmDialog, setConfirmDialog] = useState<{
//     isOpen: boolean
//     title: string
//     description: string
//     onConfirm: () => void
//     confirmText: string
//     cancelText: string
//     variant: "default" | "destructive"
//   }>({
//     isOpen: false,
//     title: "",
//     description: "",
//     onConfirm: () => { },
//     confirmText: t("confirm"),
//     cancelText: t("cancel"),
//     variant: "default",
//   })

//   const closeConfirmDialog = () => {
//     setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
//   }

//   const handleDelete = (feePlan: FeesPlan) => {
//     if (feePlan.status === "Active") {
//       toast({
//         variant: "destructive",
//         title: "You cannot delete an active fee plan",
//       })
//       return
//     }

//     setConfirmDialog({
//       isOpen: true,
//       title: t("delete_fee_plan"),
//       description: t("are_you_sure_you_want_to_delete_this_fee_plan?_this_action_cannot_be_undone."),
//       onConfirm: async () => {
//         // Call delete API here
//         try {
//           await deleteFeesPlan({
//             plan_id: feePlan.id,
//           }).unwrap()

//           toast({
//             variant: "default",
//             title: "Fees Plan Deleted Successfully",
//           })

//           refreshFeePlans()
//         } catch (error) {
//           toast({
//             variant: "destructive",
//             title: "Something went wrong",
//             description: (error as any)?.data?.message || t("delete_not_implemented"),
//           })
//           closeConfirmDialog()
//         }
//       },
//       confirmText: t("delete"),
//       cancelText: t("cancel"),
//       variant: "destructive",
//     })
//   }

//   const handleEdit = (feePlan_id: number) => {
//     setDialogForFeesPlan({
//       isOpen: true,
//       paln_id: feePlan_id,
//       type: "update",
//     })
//   }

//   const handleView = (feePlan_id: number) => {
//     setDetailsDialog({
//       isOpen: true,
//       planId: feePlan_id,
//     })
//   }

//   const handleClone = (feePlan: FeesPlan) => {
//     // Reset form
//     cloneForm.reset({
//       division_id: 0,
//     })

//     // Open clone dialog
//     setCloneDialog({
//       isOpen: true,
//       planId: feePlan.id,
//       planName: feePlan.name,
//     })

//     // Fetch classes without fee plans
//     getClassesWithoutFeesPlan({
//       school_id: authState.user!.school_id,
//     })

//     // Fetch detailed fee plan data
//     getFeePlanInDetail({
//       academic_session: CurrentAcademicSessionForSchool!.id,
//       plan_id: feePlan.id,
//     })
//   }

//   const handleCloneSubmit = async (values: CloneFormValues) => {
//     if (!detailedFeePlan || !cloneDialog.planId) return

//     try {
//       // Prepare data for clone
//       const response = await createFeesPlan({
//         data: {
//           fees_plan: {
//             name: `${detailedFeePlan.fees_plan.name} (Clone)`,
//             description: detailedFeePlan.fees_plan.description,
//             class_id: values.division_id,
//           },
//           plan_details: detailedFeePlan.fees_types.map((feeType) => ({
//             fees_type_id: feeType.fees_type.fees_type_id,
//             installment_type: feeType.fees_type.installment_type,
//             total_installment: feeType.fees_type.total_installment,
//             total_amount: feeType.fees_type.total_amount.toString(),
//             installment_breakDowns: feeType.installment_breakDowns.map((breakdown) => ({
//               installment_no: breakdown.installment_no,
//               due_date: new Date(breakdown.due_date).toISOString().split("T")[0],
//               installment_amount: breakdown.installment_amount,
//             })),
//           })),
//         },
//         academic_session: CurrentAcademicSessionForSchool!.id,
//       })

//       if (response.data) {
//         toast({
//           variant: "default",
//           title: t("fee_plan_cloned"),
//           description: t("fee_plan_has_been_cloned_successfully"),
//         })

//         // Close dialog and refresh list
//         setCloneDialog({
//           isOpen: false,
//           planId: null,
//           planName: "",
//         })

//         refreshFeePlans()
//       } else {
//         toast({
//           variant: "destructive",
//           title: t("error"),
//           description: (response.error as any)?.data?.message || t("failed_to_clone_fee_plan"),
//         })
//       }
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: t("error"),
//         description: t("an_unexpected_error_occurred"),
//       })
//     }
//   }

//   const handleStatusChange = (feePlan: FeesPlan, newStatus: "Active" | "Inactive") => {
//     const isActivating = newStatus === "Active"

//     setConfirmDialog({
//       isOpen: true,
//       title: isActivating ? t("activate_fee_plan") : t("deactivate_fee_plan"),
//       description: isActivating
//         ? "Activate this fee plan will cause deactivation of currently active plan for this class if has one. And Fees Conllection status for each stdent will get re structured according to this plan."
//         : t("Deactivation of this plan will cause pasue for fees collection for class assocaited with this plan.?"),
//       onConfirm: () => {
//         updateFeesPlanStatus({
//           status: newStatus,
//           plan_id: feePlan.id,
//         })
//           .then((response) => {
//             if (response.data) {
//               toast({
//                 variant: "default",
//                 title: isActivating ? t("fee_plan_activated") : t("fee_plan_deactivated"),
//                 description: isActivating
//                   ? t("fee_plan_has_been_activated_successfully")
//                   : t("fee_plan_has_been_deactivated_successfully"),
//               })
//               // Refresh the fee plans list
//               refreshFeePlans()
//             } else {
//               toast({
//                 variant: "destructive",
//                 title: t("error"),
//                 description:
//                   (response.error as any)?.data?.message ||
//                   (isActivating ? t("failed_to_activate_fee_plan") : t("failed_to_deactivate_fee_plan")),
//               })
//             }
//           })
//         closeConfirmDialog()
//       },
//       confirmText: isActivating ? t("activate") : t("deactivate"),
//       cancelText: t("cancel"),
//       variant: isActivating ? "default" : "destructive",
//     })
//   }

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page)
//     refreshFeePlans(page)
//   }

//   const refreshFeePlans = (page = currentPage) => {
//     if (selectedAcademicYear) {
//       getFeesPlan({
//         academic_session: Number.parseInt(selectedAcademicYear),
//         status: statusFilter,
//         page,
//       })
//     }
//   }

//   // Filter fee plans based on search term
//   const filteredFeePlans =
//     FeePlansDetail?.FeesPlan.filter(
//       (plan) =>
//         plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         plan.description?.toLowerCase().includes(searchTerm.toLowerCase()),
//     ) || []

//   useEffect(() => {
//     if (FetchedFeePlans) {
//       setFeePlansDetail({
//         FeesPlan: FetchedFeePlans.data,
//         page: FetchedFeePlans.meta,
//       })
//     }
//   }, [FetchedFeePlans])

//   /**
//    *  useEffect for fetch other essentila thing , classes , fees type etc
//    */

//   useEffect(() => {
//     if (!AcademicDivision) {
//       getAcademicClasses(authState.user!.school_id)
//     }
//     getAllFeesType({
//       academic_session_id: CurrentAcademicSessionForSchool!.id,
//       applicable_to: "plan",
//     })
//   }, [])

//   useEffect(() => {
//     refreshFeePlans(1)
//     setCurrentPage(1)
//   }, [selectedAcademicYear, statusFilter])

//   if (FeesTypeForSchool && FeesTypeForSchool.length === 0 && !isFeeTypeLoading) {
//     return (
//       <div className="text-center py-8">
//         <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
//           <AlertTriangle className="h-6 w-6 text-amber-600" />
//         </div>
//         <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_fee_types_found")}</h3>
//         <p className="text-gray-500 max-w-md mx-auto mb-4">
//           {t("you_need_to_create_fee_types_before_you_can_create_fee_plans")}
//         </p>
//       </div>
//     )
//   }

//   // Determine if we should show the skeleton loader
//   const showSkeleton = isLoading || isFetching

//   return (
//     <>
//       <div className="container mx-auto p-6 space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold">{t("fee_plan_management")}</h1>
//           {(authState.user?.role == UserRole.ADMIN || authState.user?.role == UserRole.PRINCIPAL) && (
//             <Button onClick={() => setDialogForFeesPlan({ isOpen: true, paln_id: null, type: "create" })}>
//               <Plus className="mr-2 h-4 w-4" /> {t("add_fee_plan")}
//             </Button>
//           )}
//         </div>
//         <Card>
//           <CardHeader>
//             <CardTitle>{t("fee_plans")}</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col md:flex-row gap-4 mb-4">
//               <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
//                 <SelectTrigger className="w-[180px]">
//                   <SelectValue placeholder={t("academic_year")} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {AcademicSessionsForSchool &&
//                     AcademicSessionsForSchool.map((academic: AcademicSession, index) => {
//                       return (
//                         <SelectItem key={index} value={academic.id.toString()}>
//                           {academic.session_name}
//                         </SelectItem>
//                       )
//                     })}
//                 </SelectContent>
//               </Select>
//               <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
//                 <SelectTrigger className="w-[150px]">
//                   <SelectValue placeholder={t("status")} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="All">{t("all")}</SelectItem>
//                   <SelectItem value="Active">{t("active")}</SelectItem>
//                   <SelectItem value="Inactive">{t("inactive")}</SelectItem>
//                 </SelectContent>
//               </Select>
//               <div className="relative flex-1 max-w-sm">
//                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//                 <Input
//                   placeholder={t("search_fee_plans...")}
//                   className="pl-8"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>

//             </div>

//             <div className="rounded-md border">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>{t("plan_name")}</TableHead>
//                     <TableHead>{t("class")}</TableHead>
//                     <TableHead>{t("total_amount")}</TableHead>
//                     <TableHead>{t("status")}</TableHead>
//                     <TableHead>{t("actions")}</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {showSkeleton ? (
//                     Array(5)
//                       .fill(0)
//                       .map((_, index) => (
//                         <TableRow key={`loading-${index}`}>
//                           <TableCell>
//                             <div className="h-6 w-full max-w-[200px] bg-gray-200 animate-pulse rounded"></div>
//                           </TableCell>
//                           <TableCell>
//                             <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
//                           </TableCell>
//                           <TableCell>
//                             <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
//                           </TableCell>
//                           <TableCell>
//                             <div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full"></div>
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex space-x-2">
//                               <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
//                               <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
//                               <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
//                               <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
//                               <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ))
//                   ) : filteredFeePlans.length > 0 ? (
//                     filteredFeePlans.map((feePlan) => (
//                       <TableRow key={feePlan.id}>
//                         <TableCell className="font-medium">{feePlan.name}</TableCell>
//                         <TableCell>
//                           {AcademicClassesForSchool ? (
//                             (() => {
//                               const clas = AcademicClassesForSchool.find((cls) => cls.id === feePlan.class_id)
//                               if (!clas) return "N/A"

//                               // const classInfo = AcademicClassesForSchool.find((cls) => cls.id === division.class_id)
//                               return (
//                                 <span>
//                                   Class - {clas.class}
//                                 </span>
//                               )
//                             })()
//                           ) : (
//                             <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
//                           )}
//                         </TableCell>
//                         <TableCell>₹{Number(feePlan.total_amount).toLocaleString()}</TableCell>
//                         <TableCell>
//                           <Badge variant={feePlan.status === "Active" ? "default" : "destructive"}>
//                             {feePlan.status === "Active" ? "Active" : "Inactive"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                               <Button variant="outline" size="icon" aria-label={t("actions")}> 
//                                 <MoreVertical className="h-5 w-5" />
//                               </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="end">
//                               <DropdownMenuItem onClick={() => handleView(feePlan.id)}>
//                                 <Eye className="h-4 w-4 mr-2" /> {t("view")}
//                               </DropdownMenuItem>
//                               {(authState.user?.role == UserRole.ADMIN || authState.user?.role == UserRole.PRINCIPAL) && (
//                                 <>
//                                   <DropdownMenuItem
//                                     onClick={() => handleEdit(feePlan.id)}
//                                     disabled={CurrentAcademicSessionForSchool?.id !== feePlan.academic_session_id}
//                                   >
//                                     <Pencil className="h-4 w-4 mr-2" /> {t("edit")}
//                                   </DropdownMenuItem>
//                                   <DropdownMenuItem
//                                     onClick={() => handleClone(feePlan)}
//                                     disabled={isCreatingFeePlan}
//                                   >
//                                     <Copy className="h-4 w-4 mr-2 text-blue-500" /> {t("clone")}
//                                   </DropdownMenuItem>
//                                   <DropdownMenuSeparator />
//                                   {CurrentAcademicSessionForSchool?.id === feePlan.academic_session_id && (
//                                     <>
//                                       {feePlan.status === "Active" ? (
//                                         <DropdownMenuItem
//                                           onClick={() => handleStatusChange(feePlan, "Inactive")}
//                                           disabled={isUpdatingFeePlanStaus}
//                                         >
//                                           <XCircle className="h-4 w-4 mr-2 text-amber-500" /> {t("deactivate")}
//                                         </DropdownMenuItem>
//                                       ) : (
//                                         <DropdownMenuItem
//                                           onClick={() => handleStatusChange(feePlan, "Active")}
//                                           disabled={isUpdatingFeePlanStaus}
//                                         >
//                                           <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> {t("activate")}
//                                         </DropdownMenuItem>
//                                       )}
//                                       <DropdownMenuItem
//                                         onClick={() => handleDelete(feePlan)}
//                                       >
//                                         <Trash2 className="h-4 w-4 mr-2 text-red-500" /> {t("delete")}
//                                       </DropdownMenuItem>
//                                     </>
//                                   )}
//                                 </>
//                               )}
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={5} className="h-24 text-center">
//                         <div className="flex flex-col items-center justify-center">
//                           <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
//                           <p className="text-muted-foreground">{t("no_fee_plans_found")}</p>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </div>

//             {FeePlansDetail?.page && FeePlansDetail.page.last_page > 1 && (
//               <div className="mt-4">
//                 <SaralPagination
//                   currentPage={FeePlansDetail.page.current_page}
//                   totalPages={FeePlansDetail.page.last_page}
//                   onPageChange={handlePageChange}
//                 />
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Dialog For Create and Edit Fees Plan */}
//       <Dialog
//         open={DialogForFeesPlan.isOpen}
//         onOpenChange={(open) => {
//           // Only allow closing if open is false (triggered by close button)
//           if (!open) {
//             setDialogForFeesPlan({
//               isOpen: false,
//               paln_id: null,
//               type: "create",
//             })
//           }
//         }}
//       >
//         <DialogContent
//           className="max-w-5xl max-h-[90vh] overflow-auto"
//           onInteractOutside={(e) => e.preventDefault()}
//           onEscapeKeyDown={(e) => e.preventDefault()}
//         >
//           <DialogHeader>
//             <DialogTitle>
//               {DialogForFeesPlan.type === "update" ? t("edit_fee_plan") : t("create_new_fee_plan")}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="h-full">
//             <AddFeePlanForm
//               type={DialogForFeesPlan.type}
//               plan_id={DialogForFeesPlan.paln_id}
//               onSuccessfulSubmit={() => {
//                 refreshFeePlans()
//                 setDialogForFeesPlan({
//                   isOpen: false,
//                   paln_id: null,
//                   type: "create",
//                 })
//               }}
//               onCancel={() => {
//                 setDialogForFeesPlan({
//                   isOpen: false,
//                   paln_id: null,
//                   type: "create",
//                 })
//               }}
//             />
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Fee Plan Details Dialog */}
//       <FeePlanDetailsDialog
//         isOpen={detailsDialog.isOpen}
//         onClose={() => setDetailsDialog({ isOpen: false, planId: null })}
//         planId={detailsDialog.planId}
//         academic_sessions={Number(selectedAcademicYear)}
//       />

//       {/* Clone Fee Plan Dialog */}
//       <Dialog
//         open={cloneDialog.isOpen}
//         onOpenChange={(open) => {
//           if (!open) {
//             setCloneDialog({
//               isOpen: false,
//               planId: null,
//               planName: "",
//             })
//           }
//         }}
//       >
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{t("clone_fee_plan")}</DialogTitle>
//             <DialogDescription>
//               {t("create_a_copy_of")} "{cloneDialog.planName}" {t("for_another_class")}
//             </DialogDescription>
//           </DialogHeader>

//           {isLoadingDetailedPlan ? (
//             <div className="py-8 flex justify-center">
//               <Loader2 className="h-8 w-8 animate-spin text-primary" />
//             </div>
//           ) : detailedFeePlan ? (
//             <Form {...cloneForm}>
//               <form onSubmit={cloneForm.handleSubmit(handleCloneSubmit)} className="space-y-6">
//                 <div className="grid gap-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <Label>{t("original_plan_name")}</Label>
//                       <div className="p-2 border rounded-md mt-1 bg-muted/50">{detailedFeePlan.fees_plan.name}</div>
//                     </div>
//                     <div>
//                       <Label>{t("original_class")}</Label>
//                       <div className="p-2 border rounded-md mt-1 bg-muted/50">
//                         {AcademicClassesForSchool
//                           ? (() => {
//                             const classInfo = AcademicClassesForSchool.find((cls) => cls.id === detailedFeePlan.fees_plan.class_id)
//                             if (!classInfo) return "N/A"

//                             return (
//                               <span>
//                                 {classInfo?.class || ""}
//                               </span>
//                             )
//                           })()
//                           : "Loading..."}
//                       </div>
//                     </div>
//                   </div>

//                   <div>
//                     <Label>{t("total_amount")}</Label>
//                     <div className="p-2 border rounded-md mt-1 bg-muted/50">
//                       ₹{Number(detailedFeePlan.fees_plan.total_amount).toLocaleString()}
//                     </div>
//                   </div>

//                   <div>
//                     <Label>{t("fee_types")}</Label>
//                     <div className="p-2 border rounded-md mt-1 bg-muted/50">
//                       {detailedFeePlan.fees_types.map((feeType, index) => (
//                         <Badge key={index} variant="outline" className="mr-2 mb-2">
//                           {FeesTypeForSchool?.find((type) => type.id === feeType.fees_type.fees_type_id)?.name || feeType.fees_type.fees_type_id}
//                         </Badge>
//                       ))}
//                     </div>
//                   </div>

//                   <FormField
//                     control={cloneForm.control}
//                     name="division_id"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel required>{t("select_target_class")}</FormLabel>
//                         <Select
//                           onValueChange={(value) => field.onChange(Number.parseInt(value))}
//                           value={field.value ? field.value.toString() : undefined}
//                         >
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder={t("select_a_class")} />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {classesWithoutFeesPlan &&
//                               classesWithoutFeesPlan.map((cls: AcademicClasses) => (
//                                 <SelectItem key={cls.id} value={cls.id.toString()} className="hover:bg-slate-50">
//                                   {/* {AcademicClassesForSchool && AcademicClassesForSchool.find((clas) => clas.id === cls.class_id)?.class}
//                                   -{cls.division} {cls.aliases} */}
//                                   Class {cls.class}
//                                 </SelectItem>
//                               ))}
//                             {isLoadingClasses && (
//                               <SelectItem value="loading" disabled>
//                                 {t("loading...")}
//                               </SelectItem>
//                             )}
//                             {!isLoadingClasses && classesWithoutFeesPlan && classesWithoutFeesPlan.length === 0 && (
//                               <SelectItem value="none" disabled>
//                                 {t("no_classes_available")}
//                               </SelectItem>
//                             )}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <DialogFooter>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setCloneDialog({ isOpen: false, planId: null, planName: "" })}
//                   >
//                     {t("cancel")}
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={isCreatingFeePlan || !classesWithoutFeesPlan || classesWithoutFeesPlan.length === 0}
//                   >
//                     {isCreatingFeePlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                     {t("clone_fee_plan")}
//                   </Button>
//                 </DialogFooter>
//               </form>
//             </Form>
//           ) : (
//             <div className="py-8 text-center">
//               <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
//               <p>{t("failed_to_load_fee_plan_details")}</p>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Confirmation Dialog */}
//       <ConfirmationDialog
//         isOpen={confirmDialog.isOpen}
//         title={confirmDialog.title}
//         description={confirmDialog.description}
//         onConfirm={confirmDialog.onConfirm}
//         onCancel={closeConfirmDialog}
//         confirmText={confirmDialog.confirmText}
//         cancelText={confirmDialog.cancelText}
//         variant={confirmDialog.variant}
//       />
//     </>
//   )
// }



import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Search, Eye, AlertTriangle, Trash2, CheckCircle, XCircle, Copy, Loader2, MoreVertical } from 'lucide-react'
import { AddFeePlanForm } from "./AddFeePlanForm"
import {
  useLazyGetAllFeesTypeQuery,
  useLazyGetFeesPlanQuery,
  useUpdateFeesPlanMutation,
  useCreateFeesPlanMutation,
  useLazyFetchDetailFeePlanQuery,
  useLazyUpdateFeesPlanStatusQuery,
} from "@/services/feesService"
import type { FeesPlan } from "@/types/fees"
import type { PageMeta } from "@/types/global"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import {
  selectAccademicSessionsForSchool,
  selectActiveAccademicSessionsForSchool,
  selectAuthState,
} from "@/redux/slices/authSlice"
import FeePlanDetailsDialog from "./FeePlanDetailsDialog"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { type AcademicSession, UserRole } from "@/types/user"
import { toast } from "@/hooks/use-toast"
import { useLazyGetAllClassesWithOutFeesPlanQuery } from "@/services/AcademicService"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AcademicClasses } from "@/types/academic"
import { useDeleteFeesPlanMutation } from "@/services/feesService"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type StatusFilter = "All" | "Active" | "Inactive"
type ConfirmationDialogProps = {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmText: string
  cancelText: string
  variant?: "default" | "destructive"
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  variant = "default",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Schema for clone form validation
const cloneFormSchema = z.object({
  division_id: z.number({
    required_error: "Please select a class",
  }),
})

type CloneFormValues = z.infer<typeof cloneFormSchema>

export const FeePlanManagement: React.FC = () => {
  const { t } = useTranslation()
  const AcademicDivision = useAppSelector(selectAllAcademicClasses)
  const authState = useAppSelector(selectAuthState)
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const [getAllFeesType, { data: FeesTypeForSchool, isLoading: isFeeTypeLoading }] = useLazyGetAllFeesTypeQuery()
  // const [updateFeesPlan, { isLoading: isUpdatingFeePlan }] = useUpdateFeesPlanMutation()
  const [updateFeesPlanStatus, { isLoading: isUpdatingFeePlanStaus }] = useLazyUpdateFeesPlanStatusQuery()

  const [createFeesPlan, { isLoading: isCreatingFeePlan }] = useCreateFeesPlanMutation();
  const [deleteFeesPlan, { isLoading: isFeesPlanDeleting }] = useDeleteFeesPlanMutation();
  const [getFeePlanInDetail, { data: detailedFeePlan, isLoading: isLoadingDetailedPlan }] =
    useLazyFetchDetailFeePlanQuery()
  const [getClassesWithoutFeesPlan, { data: classesWithoutFeesPlan, isLoading: isLoadingClasses }] =
    useLazyGetAllClassesWithOutFeesPlanQuery()

  const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const AcademicClassesForSchool = useAppSelector(selectAcademicClasses)

  const [getFeesPlan, { data: FetchedFeePlans, isLoading, isFetching }] = useLazyGetFeesPlanQuery()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    CurrentAcademicSessionForSchool ? CurrentAcademicSessionForSchool?.id.toString() : "",
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const [DialogForFeesPlan, setDialogForFeesPlan] = useState<{
    isOpen: boolean
    paln_id: number | null
    type: "create" | "update"
  }>({
    isOpen: false,
    paln_id: 0,
    type: "create",
  })

  const [FeePlansDetail, setFeePlansDetail] = useState<{ FeesPlan: FeesPlan[]; page: PageMeta } | null>(null)

  // New state for the details dialog
  const [detailsDialog, setDetailsDialog] = useState<{ isOpen: boolean; planId: number | null }>({
    isOpen: false,
    planId: null,
  })

  // Clone dialog state
  const [cloneDialog, setCloneDialog] = useState<{
    isOpen: boolean
    planId: number | null
    planName: string
  }>({
    isOpen: false,
    planId: null,
    planName: "",
  })

  // Clone form
  const cloneForm = useForm<CloneFormValues>({
    resolver: zodResolver(cloneFormSchema),
    defaultValues: {
      division_id: 0,
    },
  })

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    confirmText: string
    cancelText: string
    variant: "default" | "destructive"
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { },
    confirmText: t("confirm"),
    cancelText: t("cancel"),
    variant: "default",
  })

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const handleDelete = (feePlan: FeesPlan) => {
    if (feePlan.status === "Active") {
      toast({
        variant: "destructive",
        title: "You cannot delete an active fee plan",
      })
      return
    }

    setConfirmDialog({
      isOpen: true,
      title: t("delete_fee_plan"),
      description: t("are_you_sure_you_want_to_delete_this_fee_plan?_this_action_cannot_be_undone."),
      onConfirm: async () => {
        try {
          await deleteFeesPlan({
            plan_id: feePlan.id,
          }).unwrap()

          toast({
            variant: "default",
            title: "Fees Plan Deleted Successfully",
          })

          // Check if current page will be empty after deletion
          const currentPagePlans = filteredFeePlans.length
          const isLastItemOnPage = currentPagePlans === 1
          const shouldGoToPreviousPage = isLastItemOnPage && currentPage > 1

          if (shouldGoToPreviousPage) {
            // Go to previous page
            setCurrentPage(currentPage - 1)
            refreshFeePlans(currentPage - 1)
          } else {
            // Refresh current page
            refreshFeePlans()
          }

          // Keep the dialog open as requested
          // closeConfirmDialog() - commented out to keep dialog open
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Something went wrong",
            description: (error as any)?.data?.message || t("delete_not_implemented"),
          })
          closeConfirmDialog()
        }
      },
      confirmText: t("delete"),
      cancelText: t("cancel"),
      variant: "destructive",
    })
  }

  const handleEdit = (feePlan_id: number) => {
    setDialogForFeesPlan({
      isOpen: true,
      paln_id: feePlan_id,
      type: "update",
    })
  }

  const handleView = (feePlan_id: number) => {
    setDetailsDialog({
      isOpen: true,
      planId: feePlan_id,
    })
  }

  const handleClone = (feePlan: FeesPlan) => {
    // Reset form
    cloneForm.reset({
      division_id: 0,
    })

    // Open clone dialog
    setCloneDialog({
      isOpen: true,
      planId: feePlan.id,
      planName: feePlan.name,
    })

    // Fetch classes without fee plans
    getClassesWithoutFeesPlan({
      school_id: authState.user!.school_id,
    })

    // Fetch detailed fee plan data
    getFeePlanInDetail({
      academic_session: CurrentAcademicSessionForSchool!.id,
      plan_id: feePlan.id,
    })
  }

  const handleCloneSubmit = async (values: CloneFormValues) => {
    if (!detailedFeePlan || !cloneDialog.planId) return

    try {
      // Prepare data for clone
      const response = await createFeesPlan({
        data: {
          fees_plan: {
            name: `${detailedFeePlan.fees_plan.name} (Clone)`,
            description: detailedFeePlan.fees_plan.description,
            class_id: values.division_id,
          },
          plan_details: detailedFeePlan.fees_types.map((feeType) => ({
            fees_type_id: feeType.fees_type.fees_type_id,
            installment_type: feeType.fees_type.installment_type,
            total_installment: feeType.fees_type.total_installment,
            total_amount: feeType.fees_type.total_amount.toString(),
            installment_breakDowns: feeType.installment_breakDowns.map((breakdown) => ({
              installment_no: breakdown.installment_no,
              due_date: new Date(breakdown.due_date).toISOString().split("T")[0],
              installment_amount: breakdown.installment_amount,
            })),
          })),
        },
        academic_session: CurrentAcademicSessionForSchool!.id,
      })

      if (response.data) {
        toast({
          variant: "default",
          title: t("fee_plan_cloned"),
          description: t("fee_plan_has_been_cloned_successfully"),
        })

        // Close dialog and refresh list
        setCloneDialog({
          isOpen: false,
          planId: null,
          planName: "",
        })

        refreshFeePlans()
      } else {
        toast({
          variant: "destructive",
          title: t("error"),
          description: (response.error as any)?.data?.message || t("failed_to_clone_fee_plan"),
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("an_unexpected_error_occurred"),
      })
    }
  }

  const handleStatusChange = (feePlan: FeesPlan, newStatus: "Active" | "Inactive") => {
    const isActivating = newStatus === "Active"

    setConfirmDialog({
      isOpen: true,
      title: isActivating ? t("activate_fee_plan") : t("deactivate_fee_plan"),
      description: isActivating
        ? "Activate this fee plan will cause deactivation of currently active plan for this class if has one. And Fees Conllection status for each stdent will get re structured according to this plan."
        : t("Deactivation of this plan will cause pasue for fees collection for class assocaited with this plan.?"),
      onConfirm: () => {
        updateFeesPlanStatus({
          status: newStatus,
          plan_id: feePlan.id,
        })
          .then((response) => {
            if (response.data) {
              toast({
                variant: "default",
                title: isActivating ? t("fee_plan_activated") : t("fee_plan_deactivated"),
                description: isActivating
                  ? t("fee_plan_has_been_activated_successfully")
                  : t("fee_plan_has_been_deactivated_successfully"),
              })
              // Refresh the fee plans list
              refreshFeePlans()
            } else {
              toast({
                variant: "destructive",
                title: t("error"),
                description:
                  (response.error as any)?.data?.message ||
                  (isActivating ? t("failed_to_activate_fee_plan") : t("failed_to_deactivate_fee_plan")),
              })
            }
          })
        closeConfirmDialog()
      },
      confirmText: isActivating ? t("activate") : t("deactivate"),
      cancelText: t("cancel"),
      variant: isActivating ? "default" : "destructive",
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    refreshFeePlans(page)
  }

  const refreshFeePlans = (page = currentPage) => {
    if (selectedAcademicYear) {
      getFeesPlan({
        academic_session: Number.parseInt(selectedAcademicYear),
        status: statusFilter,
        page,
      })
    }
  }

  // Filter fee plans based on search term
  const filteredFeePlans =
    FeePlansDetail?.FeesPlan.filter(
      (plan) =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  useEffect(() => {
    if (FetchedFeePlans) {
      setFeePlansDetail({
        FeesPlan: FetchedFeePlans.data,
        page: FetchedFeePlans.meta,
      })
    }
  }, [FetchedFeePlans])

  /**
   *  useEffect for fetch other essentila thing , classes , fees type etc
   */

  useEffect(() => {
    if (!AcademicDivision) {
      getAcademicClasses(authState.user!.school_id)
    }
    getAllFeesType({
      academic_session_id: CurrentAcademicSessionForSchool!.id,
      applicable_to: "plan",
    })
  }, [])

  useEffect(() => {
    refreshFeePlans(1)
    setCurrentPage(1)
  }, [selectedAcademicYear, statusFilter])

  if (FeesTypeForSchool && FeesTypeForSchool.length === 0 && !isFeeTypeLoading) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_fee_types_found")}</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-4">
          {t("you_need_to_create_fee_types_before_you_can_create_fee_plans")}
        </p>
      </div>
    )
  }

  // Determine if we should show the skeleton loader
  const showSkeleton = isLoading || isFetching

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("fee_plan_management")}</h1>
          {(authState.user?.role == UserRole.ADMIN || authState.user?.role == UserRole.PRINCIPAL) && (
            <Button onClick={() => setDialogForFeesPlan({ isOpen: true, paln_id: null, type: "create" })}>
              <Plus className="mr-2 h-4 w-4" /> {t("add_fee_plan")}
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("fee_plans")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("academic_year")} />
                </SelectTrigger>
                <SelectContent>
                  {AcademicSessionsForSchool &&
                    AcademicSessionsForSchool.map((academic: AcademicSession, index) => {
                      return (
                        <SelectItem key={index} value={academic.id.toString()}>
                          {academic.session_name}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t("all")}</SelectItem>
                  <SelectItem value="Active">{t("active")}</SelectItem>
                  <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={t("search_fee_plans...")}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("plan_name")}</TableHead>
                    <TableHead>{t("class")}</TableHead>
                    <TableHead>{t("total_amount")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showSkeleton ? (
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={`loading-${index}`}>
                          <TableCell>
                            <div className="h-6 w-full max-w-[200px] bg-gray-200 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full"></div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
                              <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
                              <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
                              <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
                              <div className="h-9 w-9 bg-gray-200 animate-pulse rounded-md"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : filteredFeePlans.length > 0 ? (
                    filteredFeePlans.map((feePlan) => (
                      <TableRow key={feePlan.id}>
                        <TableCell className="font-medium">{feePlan.name}</TableCell>
                        <TableCell>
                          {AcademicClassesForSchool ? (
                            (() => {
                              const clas = AcademicClassesForSchool.find((cls) => cls.id === feePlan.class_id)
                              if (!clas) return "N/A"

                              // const classInfo = AcademicClassesForSchool.find((cls) => cls.id === division.class_id)
                              return (
                                <span>
                                  Class - {clas.class}
                                </span>
                              )
                            })()
                          ) : (
                            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                          )}
                        </TableCell>
                        <TableCell>₹{Number(feePlan.total_amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={feePlan.status === "Active" ? "default" : "destructive"}>
                            {feePlan.status === "Active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" aria-label={t("actions")}> 
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(feePlan.id)}>
                                <Eye className="h-4 w-4 mr-2" /> {t("view")}
                              </DropdownMenuItem>
                              {(authState.user?.role == UserRole.ADMIN || authState.user?.role == UserRole.PRINCIPAL) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(feePlan.id)}
                                    disabled={CurrentAcademicSessionForSchool?.id !== feePlan.academic_session_id}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" /> {t("edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleClone(feePlan)}
                                    disabled={isCreatingFeePlan}
                                  >
                                    <Copy className="h-4 w-4 mr-2 text-blue-500" /> {t("clone")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {CurrentAcademicSessionForSchool?.id === feePlan.academic_session_id && (
                                    <>
                                      {feePlan.status === "Active" ? (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(feePlan, "Inactive")}
                                          disabled={isUpdatingFeePlanStaus}
                                        >
                                          <XCircle className="h-4 w-4 mr-2 text-amber-500" /> {t("deactivate")}
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(feePlan, "Active")}
                                          disabled={isUpdatingFeePlanStaus}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> {t("activate")}
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(feePlan)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2 text-red-500" /> {t("delete")}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                          <p className="text-muted-foreground">{t("no_fee_plans_found")}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {FeePlansDetail?.page && FeePlansDetail.page.last_page > 1 && (
              <div className="mt-4">
                <SaralPagination
                  currentPage={FeePlansDetail.page.current_page}
                  totalPages={FeePlansDetail.page.last_page}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog For Create and Edit Fees Plan */}
      <Dialog
        open={DialogForFeesPlan.isOpen}
        onOpenChange={(open) => {
          // Only allow closing if open is false (triggered by close button)
          if (!open) {
            setDialogForFeesPlan({
              isOpen: false,
              paln_id: null,
              type: "create",
            })
          }
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {DialogForFeesPlan.type === "update" ? t("edit_fee_plan") : t("create_new_fee_plan")}
            </DialogTitle>
          </DialogHeader>
          <div className="h-full">
            <AddFeePlanForm
              type={DialogForFeesPlan.type}
              plan_id={DialogForFeesPlan.paln_id}
              onSuccessfulSubmit={() => {
                refreshFeePlans()
                setDialogForFeesPlan({
                  isOpen: false,
                  paln_id: null,
                  type: "create",
                })
              }}
              onCancel={() => {
                setDialogForFeesPlan({
                  isOpen: false,
                  paln_id: null,
                  type: "create",
                })
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Plan Details Dialog */}
      <FeePlanDetailsDialog
        isOpen={detailsDialog.isOpen}
        onClose={() => setDetailsDialog({ isOpen: false, planId: null })}
        planId={detailsDialog.planId}
        academic_sessions={Number(selectedAcademicYear)}
      />

      {/* Clone Fee Plan Dialog */}
      <Dialog
        open={cloneDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCloneDialog({
              isOpen: false,
              planId: null,
              planName: "",
            })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clone_fee_plan")}</DialogTitle>
            <DialogDescription>
              {t("create_a_copy_of")} "{cloneDialog.planName}" {t("for_another_class")}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetailedPlan ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailedFeePlan ? (
            <Form {...cloneForm}>
              <form onSubmit={cloneForm.handleSubmit(handleCloneSubmit)} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("original_plan_name")}</Label>
                      <div className="p-2 border rounded-md mt-1 bg-muted/50">{detailedFeePlan.fees_plan.name}</div>
                    </div>
                    <div>
                      <Label>{t("original_class")}</Label>
                      <div className="p-2 border rounded-md mt-1 bg-muted/50">
                        {AcademicClassesForSchool
                          ? (() => {
                            const classInfo = AcademicClassesForSchool.find((cls) => cls.id === detailedFeePlan.fees_plan.class_id)
                            if (!classInfo) return "N/A"

                            return (
                              <span>
                                {classInfo?.class || ""}
                              </span>
                            )
                          })()
                          : "Loading..."}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>{t("total_amount")}</Label>
                    <div className="p-2 border rounded-md mt-1 bg-muted/50">
                      ₹{Number(detailedFeePlan.fees_plan.total_amount).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <Label>{t("fee_types")}</Label>
                    <div className="p-2 border rounded-md mt-1 bg-muted/50">
                      {detailedFeePlan.fees_types.map((feeType, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {FeesTypeForSchool?.find((type) => type.id === feeType.fees_type.fees_type_id)?.name || feeType.fees_type.fees_type_id}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={cloneForm.control}
                    name="division_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("select_target_class")}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number.parseInt(value))}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_a_class")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classesWithoutFeesPlan &&
                              classesWithoutFeesPlan.map((cls: AcademicClasses) => (
                                <SelectItem key={cls.id} value={cls.id.toString()} className="hover:bg-slate-50">
                                  Class {cls.class}
                                </SelectItem>
                              ))}
                            {isLoadingClasses && (
                              <SelectItem value="loading" disabled>
                                {t("loading...")}
                              </SelectItem>
                            )}
                            {!isLoadingClasses && classesWithoutFeesPlan && classesWithoutFeesPlan.length === 0 && (
                              <SelectItem value="none" disabled>
                                {t("no_classes_available")}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCloneDialog({ isOpen: false, planId: null, planName: "" })}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingFeePlan || !classesWithoutFeesPlan || classesWithoutFeesPlan.length === 0}
                  >
                    {isCreatingFeePlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("clone_fee_plan")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <div className="py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p>{t("failed_to_load_fee_plan_details")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
      />
    </>
  )
}