"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SaralDatePicker } from "@/components/ui/common/SaralDatePicker"
import type { LeaveApplication } from "@/types/leave"
import type { PageMeta } from "@/types/global"
import { useTranslation } from "@/redux/hooks/useTranslation"
import {
  useLazyFetchLeaveApplicationOfOtherStaffForAdminQuery,
  useLazyFetchLeaveApplicationOfTeachingStaffForAdminQuery,
  useUpdateStatusForStaffLeaveApplicationMutation,
} from "@/services/LeaveService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calendar, Filter, RefreshCw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import LeaveRequestsTable from "@/components/Leave/LeaveRequestsTable"

const AdminLeaveManagement: React.FC = () => {
  const { t } = useTranslation()
  const [getLeaveApplicationsForTeachingStaff, { data: leaveRequestsForTeacher, isLoading: loadingForTeachersLeave }] =
    useLazyFetchLeaveApplicationOfTeachingStaffForAdminQuery()
  const [getLeaveApplicationsForOtherStaff, { data: leaveRequestsForOthers, isLoading: loadingForOtherStaffLeave }] =
    useLazyFetchLeaveApplicationOfOtherStaffForAdminQuery()
  const [updateStatusForApplication, { isLoading: loadingForupdateStatusForApplication }] =
    useUpdateStatusForStaffLeaveApplicationMutation()
  const [activeTab, setActiveTab] = useState("teacher")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [LeaveRequestsForTeachingStaff, setLeaveRequestsForTeachingStaff] = useState<{
    applications: LeaveApplication[]
    page: PageMeta
  } | null>(null)
  const [LeaveRequestsForOtherStaff, setLeaveRequestsForOtherStaff] = useState<{
    applications: LeaveApplication[]
    page: PageMeta
  } | null>(null)

  const [DialogForApplication, setDialogForApplication] = useState<{
    isOpen: boolean
    application: LeaveApplication | null
    dialog_type: "create" | "edit"
    action: "approve" | "reject" | null
  }>({
    isOpen: false,
    application: null,
    dialog_type: "create",
    action: null,
  })

  const [actionReason, setActionReason] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "cancelled" | "all">("pending")

  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const { toast } = useToast()

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await fetchLeaveApplication(
        activeTab as "teacher" | "other",
        statusFilter,
        1,
        selectedDate ? new Date(selectedDate).toISOString().split("T")[0] : undefined,
      )
      toast({
        title: "Data refreshed",
        description: "Leave requests have been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        variant: "destructive",
        title: "Error refreshing data",
        description: "Please try again later.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const confirmStatusChange = async () => {
    if (!DialogForApplication.application || !DialogForApplication.action) return

    // Validate remarks are provided
    if (!actionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Remarks required",
        description: "Please provide remarks for this action.",
      })
      return
    }

    try {
      await updateStatusForApplication({
        application_id: DialogForApplication.application.uuid,
        status: DialogForApplication.action === "approve" ? "approved" : "rejected",
        remarks: actionReason.trim(),
        academic_session_id: CurrentAcademicSessionForSchool!.id,
      }).unwrap()

      fetchLeaveApplication(activeTab as "teacher" | "other", statusFilter, 1)

      toast({
        title: "Leave request updated",
        description: `The leave request has been ${DialogForApplication.action === "approve" ? "approved" : "rejected"}.`,
      })

      setDialogForApplication({
        isOpen: false,
        application: null,
        dialog_type: "create",
        action: null,
      })
      setActionReason("")
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Please try again later.",
      })
    }
  }

  const openStatusChangeDialog = (application: LeaveApplication, action: "approve" | "reject") => {
    setDialogForApplication({
      isOpen: true,
      application,
      dialog_type: "edit",
      action,
    })
  }

  const handleStatusChange = useCallback(
    async (requestId: string, newStatus: "approved" | "rejected", staff_type: "teacher" | "other") => {
      try {
        const status = await updateStatusForApplication({
          application_id: requestId,
          status: newStatus,
          remarks: actionReason.trim(),
          academic_session_id: CurrentAcademicSessionForSchool!.id,
        }).unwrap()

        fetchLeaveApplication(staff_type, statusFilter, 1)
        toast({
          title: "Leave request updated",
          description: `The leave request has been ${newStatus}.`,
        })
      } catch (error) {
        console.error("Error updating status:", error)
        toast({
          variant: "destructive",
          title: "Error updating status",
          description: "Please try again later.",
        })
      }
    },
    [actionReason, statusFilter, CurrentAcademicSessionForSchool, updateStatusForApplication, toast],
  )

  // Clear the relevant leave request state before fetching new data on tab, status, or page change to prevent data accumulation and stale data display.
  useEffect(() => {
    setLeaveRequestsForTeachingStaff(null)
    setLeaveRequestsForOtherStaff(null)
    fetchLeaveApplication(activeTab as "teacher" | "other", statusFilter, 1)
  }, [activeTab, statusFilter])

  const onPageChange = useCallback(
    (page: number) => {
      if (activeTab === "teacher") setLeaveRequestsForTeachingStaff(null)
      else setLeaveRequestsForOtherStaff(null)
      fetchLeaveApplication(
        activeTab as "teacher" | "other",
        statusFilter,
        page,
        selectedDate ? new Date(selectedDate).toISOString().split("T")[0] : undefined,
      )
    },
    [activeTab, statusFilter, selectedDate],
  )

  const clearDateFilter = () => {
    setSelectedDate(undefined)
    fetchLeaveApplication(activeTab as "teacher" | "other", statusFilter, 1)
  }

  const clearStatusFilter = () => {
    setStatusFilter("all")
  }

  async function fetchLeaveApplication(
    type: "teacher" | "other",
    status: "pending" | "approved" | "rejected" | "cancelled" | "all",
    page = 1,
    date?: string,
  ) {
    try {
      const params: any = {
        page: page,
        date: date,
        academic_session_id: CurrentAcademicSessionForSchool!.id,
        role: type === "teacher" ? "teaching" : "non-teaching",
        status: status,
      }

      if (status !== "all") {
        params.status = status
      }

      if (type === "teacher") {
        getLeaveApplicationsForTeachingStaff(params)
      } else {
        getLeaveApplicationsForOtherStaff(params)
      }
    } catch (error) {
      console.error("Error fetching leave applications:", error)
    }
  }

  useEffect(() => {
    if (leaveRequestsForTeacher) {
      setLeaveRequestsForTeachingStaff({
        applications: leaveRequestsForTeacher.data,
        page: leaveRequestsForTeacher.meta,
      })
    }

    if (leaveRequestsForOthers) {
      setLeaveRequestsForOtherStaff({
        applications: leaveRequestsForOthers.data,
        page: leaveRequestsForOthers.meta,
      })
    }
  }, [leaveRequestsForOthers, leaveRequestsForTeacher])

  useEffect(() => {
    fetchLeaveApplication(activeTab as "teacher" | "other", statusFilter, 1)
  }, [activeTab, statusFilter])

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate)
      const formattedDate = date.toISOString().split("T")[0]
      fetchLeaveApplication(activeTab as "teacher" | "other", statusFilter, 1, formattedDate)
    }
  }, [selectedDate])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "all":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const renderSkeletonLoader = () => {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <div className="space-x-2">
              <Skeleton className="h-8 w-16 inline-block" />
              <Skeleton className="h-8 w-16 inline-block" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderEmptyState = () => {
    const isLoading = activeTab === "teacher" ? loadingForTeachersLeave : loadingForOtherStaffLeave

    if (isLoading) {
      return renderSkeletonLoader()
    }

    const currentData =
      activeTab === "teacher" ? LeaveRequestsForTeachingStaff?.applications : LeaveRequestsForOtherStaff?.applications

    if (!currentData || currentData.length === 0) {
      return (
        <Alert className="my-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>{t("no_leave_applications_found")}</AlertTitle>
          <AlertDescription>
            {statusFilter === "all"
              ? t("there_are_no_leave_applications_of_any_status_for")
              : `${t("there_are_no")} ${statusFilter} ${t("leave_applications_for")}`}{" "}
            {activeTab === "teacher" ? t("teaching") : t("non_teaching")} {t("staff")}
            {selectedDate ? ` on ${new Date(selectedDate).toLocaleDateString()}` : ""}.
            {statusFilter !== "all" && (
              <div className="mt-2">
                {t("try_checking")}{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setStatusFilter("all")}>
                  {t("all")}
                </Button>{" "}
                {t("applications_instead.")}
              </div>
            )}
            {selectedDate && (
              <div className="mt-2">
                <Button variant="outline" size="sm" className="mt-2" onClick={clearDateFilter}>
                  {t("clear_date_filter")}
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-3xl font-bold text-primary">{t("leave_management")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing || loadingForTeachersLeave || loadingForOtherStaffLeave}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="teacher">{t("teacher_leave_requests")}</TabsTrigger>
              <TabsTrigger value="other">{t("other_staff_leave_requests")}</TabsTrigger>
            </TabsList>

            {/* Filter Controls */}
            <div className="space-y-4 bg-muted/50 p-4 rounded-md">
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SaralDatePicker date={selectedDate} onDateChange={(date) => setSelectedDate(date)} />
                  {selectedDate && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearDateFilter}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={statusFilter}
                    onValueChange={(value: "pending" | "approved" | "rejected" | "cancelled" | "all") =>
                      setStatusFilter(value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="approved">{t("approved")}</SelectItem>
                      <SelectItem value="rejected">{t("rejected")}</SelectItem>
                      <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(statusFilter !== "all" || selectedDate) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("active_filters")}:</span>

                  {statusFilter !== "all" && (
                    <Badge className={`${getStatusBadgeColor(statusFilter)} flex items-center space-x-1`}>
                      <span>{statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                      <button
                        onClick={clearStatusFilter}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                        aria-label="Clear status filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}

                  {selectedDate && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <span>{new Date(selectedDate).toLocaleDateString()}</span>
                      <button
                        onClick={clearDateFilter}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                        aria-label="Clear date filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {renderEmptyState()}

            <TabsContent value="teacher" className="mt-0">
              {LeaveRequestsForTeachingStaff && LeaveRequestsForTeachingStaff.applications.length > 0 && (
                <LeaveRequestsTable
                  leaveRequests={LeaveRequestsForTeachingStaff}
                  handleStatusChange={(id, status) =>
                    openStatusChangeDialog(
                      LeaveRequestsForTeachingStaff.applications.find((app) => app.id.toString() === id)!,
                      status === "approved" ? "approve" : "reject",
                    )
                  }
                  staff_type="teacher"
                  onPageChange={onPageChange}
                  statusFilter={statusFilter}
                />
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-0">
              {LeaveRequestsForOtherStaff && LeaveRequestsForOtherStaff.applications.length > 0 && (
                <LeaveRequestsTable
                  leaveRequests={LeaveRequestsForOtherStaff}
                  handleStatusChange={(id, status) =>
                    openStatusChangeDialog(
                      LeaveRequestsForOtherStaff.applications.find((app) => app.id.toString() === id)!,
                      status === "approved" ? "approve" : "reject",
                    )
                  }
                  staff_type="other"
                  onPageChange={onPageChange}
                  statusFilter={statusFilter}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={DialogForApplication.isOpen}
        onOpenChange={(value) => {
          if (!value) {
            setDialogForApplication({
              isOpen: false,
              application: null,
              dialog_type: "create",
              action: null,
            })
            setActionReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>
                {DialogForApplication.action === "approve" ? t("approve_leave_request") : t("reject_leave_request")}
              </span>
              {DialogForApplication.action && (
                <Badge
                  className={
                    DialogForApplication.action === "approve"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {DialogForApplication.action}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {DialogForApplication.application && (
            <div className="bg-muted/50 p-3 rounded-md mb-4">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Staff:</span> {DialogForApplication.application.first_name}{" "}
                  {DialogForApplication.application.last_name}
                </p>
                <p>
                  <span className="font-medium">Leave Type:</span> {DialogForApplication.application?.leave_type_name}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {new Date(DialogForApplication.application.from_date).toLocaleDateString()} to{" "}
                  {new Date(DialogForApplication.application.to_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Reason:</span>{" "}
                  {DialogForApplication.application.reason || "Not provided"}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">
                {t("reason")} {DialogForApplication.action === "reject" ? "(Required)" : "(Optional)"}
              </Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  DialogForApplication.action === "approve"
                    ? "Add any additional notes (optional)"
                    : "Please provide a reason for rejection"
                }
                className="min-h-[100px]"
              />
              {DialogForApplication.action === "reject" && !actionReason.trim() && (
                <p className="text-sm text-destructive">{t("a_reason_is_required_when_rejecting_a_leave_request")}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogForApplication({ ...DialogForApplication, isOpen: false })}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={
                (DialogForApplication.action === "reject" && !actionReason.trim()) ||
                loadingForupdateStatusForApplication
              }
              className={
                DialogForApplication.action === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-white"
              }
            >
              {loadingForupdateStatusForApplication
                ? "Processing..."
                : DialogForApplication.action === "approve"
                  ? t("approve")
                  : t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminLeaveManagement
