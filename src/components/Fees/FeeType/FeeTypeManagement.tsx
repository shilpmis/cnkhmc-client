import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Search, AlertTriangle, Trash2 } from "lucide-react"
import { AddFeeTypeForm } from "./AddFeeTypeForm"
import { useCreateFeesTypeMutation, useLazyGetFeesTypeQuery, useUpdateFeesTypeMutation , useDeleteFeesTypeMutation } from "@/services/feesService"
import type { FeesType } from "@/types/fees"
import type { PageMeta } from "@/types/global"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import type { feeTypeSchema } from "@/utils/fees.validation"
import type { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  selectAccademicSessionsForSchool,
  selectActiveAccademicSessionsForSchool,
  selectAuthState,
} from "@/redux/slices/authSlice"
import { UserRole, type AcademicSession } from "@/types/user"
import { Skeleton } from "@/components/ui/skeleton"
import { DialogDescription } from "@radix-ui/react-dialog"

type ApplicableToFilter = "All" | "student" | "plan"
type StatusFilter = "Active" | "Inactive"

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

export const FeeTypeManagement: React.FC = () => {
  const authState = useAppSelector(selectAuthState)
  const [getFeesType, { data: FeesType, isLoading: loadingFeesType, error: feesTypeError, isFetching }] =
    useLazyGetFeesTypeQuery()
  const [createFeesType, { isLoading: isCreateFeesTypeLoading }] = useCreateFeesTypeMutation()
  const [updateFeesType, { isLoading: isUpdateFeesTypeLoading }] = useUpdateFeesTypeMutation()
  const [deleteFeesType, { isLoading: isDeleteFeesTypeLoading }] = useDeleteFeesTypeMutation()
  const { t } = useTranslation()

  const AcademicSessionsForSchool = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    CurrentAcademicSessionForSchool ? CurrentAcademicSessionForSchool?.id.toString() : "",
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active")
  const [applicableToFilter, setApplicableToFilter] = useState<ApplicableToFilter>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const [DialogForFeeType, setDialogForFeeType] = useState<{
    isOpen: boolean
    type: "create" | "edit"
    data: FeesType | null
  }>({
    isOpen: false,
    data: null,
    type: "create",
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

  const [DataForFeesType, setDataForFeesType] = useState<{ type: FeesType[]; page: PageMeta } | null>(null)

  // Filter fee types based on search term only (server handles other filters)
  const filteredFeeTypes =
    DataForFeesType?.type.filter((feeType) => {
      return (
        feeType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feeType.description && feeType.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }) || []

  const handleSubmit = async (values: z.infer<typeof feeTypeSchema>) => {
    if (DialogForFeeType.type === "edit") {
      const fees_type = await updateFeesType({
        id: DialogForFeeType.data!.id,
        data: {
          name: values.name,
          description: values.description,
          status: values.status,
          // applicable_to is not included as it cannot be updated
        },
      })
      if (fees_type.data) {
        toast({
          variant: "default",
          title: t("fee_type_updated_successfully"),
        })
        refreshFeeTypes()
        setDialogForFeeType({ isOpen: false, data: null, type: "create" }) // Close dialog only on success
      } else {
        console.log("Error updating Fee Type", (fees_type.error as any)?.data?.message)
        toast({
          variant: "destructive",
          title: (fees_type.error as any)?.data?.message || t("error_updating_fee_type"),
        })
      }
    } else if (DialogForFeeType.type === "create") {
      const fees_type = await createFeesType({
        data: {
          name: values.name,
          description: values.description,
          status: values.status,
          academic_session_id: CurrentAcademicSessionForSchool!.id,
          applicable_to: values.applicable_to,
        },
      })
      if (fees_type.data) {
        refreshFeeTypes()
        toast({
          variant: "default",
          title: t("fee_type_created_successfully"),
        })
        setDialogForFeeType({ isOpen: false, data: null, type: "create" }) // Close dialog only on success
      } else {
        console.log("Error creating Fee Type", fees_type.error)
        toast({
          variant: "destructive",
          title: (fees_type.error as any)?.data?.message || t("error_creating_fee_type"),
        })
      }
    }
  }

  const handleDelete = (feeType: FeesType) => {
    if (feeType.status === "Active") {
      toast({
        variant: "destructive",
        title: "You cannot delete an active fee type",
      })
      return
    }

    setConfirmDialog({
      isOpen: true,
      title: t("delete_fee_type"),
      description: t("are_you_sure_you_want_to_delete_this_fee_type?_this_action_cannot_be_undone."),
      onConfirm: async () => {
        // Call delete API here
        try {
          await deleteFeesType({
            fees_type_id: feeType.id,
          }).unwrap()

          toast({
            variant: "default",
            title: "Fees Type Deleted Successfully",
          })

          refreshFeeTypes()
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

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    refreshFeeTypes(page)
  }

  const refreshFeeTypes = (page = currentPage) => {
    if (selectedAcademicYear) {
      getFeesType({
        page,
        academic_session: Number.parseInt(selectedAcademicYear),
        applicable_to: applicableToFilter,
        status: statusFilter,
      })
    }
  }

  useEffect(() => {
    refreshFeeTypes(1)
    setCurrentPage(1)
  }, [selectedAcademicYear, statusFilter, applicableToFilter])

  useEffect(() => {
    if (FeesType && FeesType.data) {
      setDataForFeesType({
        type: FeesType.data,
        page: FeesType.meta,
      })
    }
  }, [FeesType])

  // Determine if we should show the skeleton loader
  const showSkeleton = loadingFeesType || isFetching

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("fee_type_management")}</h1>
          <Dialog
            open={DialogForFeeType.isOpen}
            onOpenChange={(open) => {
              if (open) {
                setDialogForFeeType({ isOpen: true, data: null, type: "create" })
              } else {
                setDialogForFeeType({ isOpen: false, data: null, type: "create" })
              }
            }}
          >
            <DialogTrigger asChild>
              {(authState.user?.role == UserRole.ADMIN || authState.user?.role == UserRole.PRINCIPAL) && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {t("add_fee_type")}
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{DialogForFeeType.type === "edit" ? t("edit_fee_type") : t("add_new_fee_type")}</DialogTitle>
              </DialogHeader>
              <AddFeeTypeForm
                initialData={DialogForFeeType.data}
                type={DialogForFeeType.type}
                onCancel={() => setDialogForFeeType({ isOpen: false, data: null, type: "create" })}
                onSubmit={handleSubmit}
                isLoading={isCreateFeesTypeLoading || isUpdateFeesTypeLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("fee_types")}</CardTitle>
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
              <Select
                value={applicableToFilter}
                onValueChange={(value: ApplicableToFilter) => setApplicableToFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("applicable_to")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t("all")}</SelectItem>
                  <SelectItem value="student">{t("student")}</SelectItem>
                  <SelectItem value="plan">{t("plan")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="All">{t("all")}</SelectItem> */}
                  <SelectItem value="Active">{t("active")}</SelectItem>
                  <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={t("search_fee_types...")}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
            </div>

            {showSkeleton ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-4 py-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-16 ml-auto" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4 py-3 border-t">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : feesTypeError ? (
              <div className="rounded-md bg-red-50 p-4 my-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{t("error_loading_fee_types")}</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{(feesTypeError as any)?.data?.message || t("please_try_again_later")}</p>
                    </div>
                    <div className="mt-4">
                      <Button size="sm" variant="outline" onClick={() => refreshFeeTypes(1)}>
                        {t("try_again")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : DataForFeesType ? (
              <div className="rounded-md border">
                {filteredFeeTypes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("applicable_to")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead>{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeeTypes.map((feeType) => (
                        <TableRow key={feeType.id}>
                          <TableCell className="font-medium">{feeType.name}</TableCell>
                          <TableCell>{feeType.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {feeType.applicable_to || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={feeType.status === "Active" ? "default" : "destructive"}>
                              {feeType.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {(authState.user?.role == UserRole.ADMIN || authState.user?.role == UserRole.PRINCIPAL) && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setDialogForFeeType({ isOpen: true, data: feeType, type: "edit" })}
                                  disabled={CurrentAcademicSessionForSchool?.id !== feeType.academic_session_id}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(feeType)}
                                className="text-red-500 hover:text-red-600 hover:border-red-600"
                                disabled={(authState.user?.role !== UserRole.ADMIN && authState.user?.role !== UserRole.PRINCIPAL)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_fee_types_found")}</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      {searchTerm || applicableToFilter !== "All"
                        ? t("try_adjusting_your_filters")
                        : t("you_need_to_create_fee_types_before_you_can_create_fee_plans")}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-4">
              {DataForFeesType && DataForFeesType.type.length > 0 && (
                <SaralPagination
                  currentPage={DataForFeesType.page.current_page}
                  totalPages={DataForFeesType.page.last_page}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
