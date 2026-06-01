"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaralPagination } from "@/components/ui/common/SaralPagination"
import { LeaveApplicationForm } from "@/components/Leave/LeaveApplicationFormData"
import { useToast } from "@/hooks/use-toast"
import type { LeaveApplication } from "@/types/leave"
import type { PageMeta } from "@/types/global"
import { LeaveBalance, useGetLeaveBalancesQuery, useLazyGetAllLeavePoliciesForUserQuery, useLazyGetStaffsLeaveAppicationQuery, useWithdrawLeaveApplicationMutation } from "@/services/LeaveService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { selectLeavePolicyForUser } from "@/redux/slices/leaveSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Calendar, Plus, FileText, Clock, CalendarDays, User, RefreshCw } from "lucide-react"
import { Label } from "@radix-ui/react-label"
import { Textarea } from "@/components/ui/textarea"

const LeaveDashboardForTeachers: React.FC = () => {
  const authState = useAppSelector(selectAuthState)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  const leavePolicyForUser = useAppSelector(selectLeavePolicyForUser)

  const [getStaffsLeaveApplications, { data: StaffsLeaveApplications, isLoading: isTeacherLeaveApplicationLoading }] =
    useLazyGetStaffsLeaveAppicationQuery()

  const [getAllLeavePoliciesForUser] = useLazyGetAllLeavePoliciesForUserQuery()

  const {
    data: leaveBalances,
    isLoading: isLeaveBalancesLoading,
    isFetching: isLeaveBalancesFetching,
    refetch: refetchLeaveBalances,
    error: leaveBalancesError,
  } = useGetLeaveBalancesQuery(
    {
      staff_id: authState.user?.staff_id || 0,
      academic_session_id: CurrentAcademicSessionForSchool?.id || 0,
    },
    {
      skip: !authState.user?.staff_id || !CurrentAcademicSessionForSchool?.id,
    },
  )

  const [leaveApplications, setLeaveApplications] = useState<{
    applications: LeaveApplication[]
    page: PageMeta
  } | null>(null)

  const [DialogForLeaveApplication, setDialogForLeaveApplication] = useState<{
    isOpen: boolean
    type: "create" | "edit"
    application: LeaveApplication | null
  }>({ isOpen: false, application: null, type: "create" })

  const [isLeaveDetailDialogOpen, setIsLeaveDetailDialogOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null)
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "cancelled">("pending")
  const [activeTab, setActiveTab] = useState("balance")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { toast } = useToast()
  const { t } = useTranslation()

  // Add these new states for the withdraw dialog
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [withdrawRemarks, setWithdrawRemarks] = useState("")
  const [leaveToWithdraw, setLeaveToWithdraw] = useState<LeaveApplication | null>(null)

  // Add the mutation hook
  const [withdrawLeaveApplication, { isLoading: isWithdrawing }] = useWithdrawLeaveApplicationMutation()

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const handleDialog = (type: "create" | "edit", application: LeaveApplication | null) => {
    if (type === "create") {
      setDialogForLeaveApplication({
        application: null,
        type: "create",
        isOpen: true,
      })
    } else {
      setDialogForLeaveApplication({
        application: application,
        type: "edit",
        isOpen: true,
      })
    }
  }

  const handleViewLeaveDetail = (leave: LeaveApplication) => {
    setSelectedLeave(leave)
    setIsLeaveDetailDialogOpen(true)
  }

  const handleWithdrawLeave = (leave: LeaveApplication) => {
    setLeaveToWithdraw(leave)
    setWithdrawRemarks("")
    setIsWithdrawDialogOpen(true)
  }

  // Add a new function to submit the withdrawal
  const submitWithdrawLeave = async () => {
    if (!leaveToWithdraw || !withdrawRemarks.trim()) {
      toast({
        variant: "destructive",
        title: t("remarks_required"),
        description: t("please_provide_remarks_for_withdrawing_the_leave"),
      })
      return
    }

    try {
      const response = await withdrawLeaveApplication({
        application_id: leaveToWithdraw.uuid,
        remarks: withdrawRemarks.trim()
      }).unwrap()

      toast({
        title: t("leave_withdrawn"),
        description: response.message || t("leave_application_withdrawn_successfully"),
      })

      setIsWithdrawDialogOpen(false)
      
      // Refresh the applications list
      if (authState.user?.staff_id) {
        getStaffsLeaveApplications({
          page: 1,
          status: statusFilter,
          staff_id: authState.user.staff_id,
          academic_session_id: CurrentAcademicSessionForSchool!.id,
        })
      }
    } catch (error) {
      console.error("Error withdrawing leave:", error)
      toast({
        variant: "destructive",
        title: t("error_withdrawing_leave"),
        description: t("please_try_again_later"),
      })
    }
  }

  // Check if date is today or in the past
  const isDateTodayOrPast = (dateString: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(dateString)
    date.setHours(0, 0, 0, 0)
    return date <= today
  }

  function handleCloseDialog() {
    setDialogForLeaveApplication({
      application: null,
      type: "create",
      isOpen: false,
    })
  }

  const onSucessesfullApplication = (application: LeaveApplication) => {
    if (DialogForLeaveApplication.type === "create" && authState.user?.staff_id) {
      getStaffsLeaveApplications({
        page: 1,
        status: "pending",
        staff_id: authState.user.staff_id,
        academic_session_id: CurrentAcademicSessionForSchool!.id,
      })
    } else {
      setLeaveApplications({
        applications: leaveApplications!.applications.map((app) => {
          if (app.id === application.id) {
            return application
          }
          return app
        }),
        page: leaveApplications!.page,
      })
    }
    handleCloseDialog()
  }

  const handleStatusFilterChange = (value: "pending" | "approved" | "rejected" | "cancelled") => {
    setStatusFilter(value)
    if (authState.user?.staff_id) {
      getStaffsLeaveApplications({
        page: 1,
        status: value,
        staff_id: authState.user.staff_id,
        academic_session_id: CurrentAcademicSessionForSchool!.id,
      })
    }
  }

  const handlePageChange = (page: number) => {
    if (authState.user?.staff_id)
      getStaffsLeaveApplications({
        page: page,
        status: statusFilter,
        academic_session_id: CurrentAcademicSessionForSchool!.id,
        staff_id: authState.user!.staff_id,
      })
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      if (authState.user?.staff_id && CurrentAcademicSessionForSchool?.id) {
        await getStaffsLeaveApplications({
          page: 1,
          status: statusFilter,
          staff_id: authState.user.staff_id,
          academic_session_id: CurrentAcademicSessionForSchool.id,
        })

        await getAllLeavePoliciesForUser({
          academic_session_id: CurrentAcademicSessionForSchool.id,
        })

        // Refresh leave balances
        await refetchLeaveBalances()
      }
      toast({
        title: "Data refreshed",
        description: "Leave information has been refreshed.",
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

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  useEffect(() => {
    // Fetch leave status and applications from API
    if (!leaveApplications && authState.user?.staff_id && CurrentAcademicSessionForSchool?.id) {
      getStaffsLeaveApplications({
        page: 1,
        status: statusFilter,
        staff_id: authState.user.staff_id,
        academic_session_id: CurrentAcademicSessionForSchool.id,
      })
    }

    if (!leavePolicyForUser && authState.user?.staff_id && CurrentAcademicSessionForSchool?.id) {
      getAllLeavePoliciesForUser({
        academic_session_id: CurrentAcademicSessionForSchool.id,
      })
    }
  }, [
    leaveApplications,
    authState.user?.staff_id,
    getStaffsLeaveApplications,
    statusFilter,
    leavePolicyForUser,
    getAllLeavePoliciesForUser,
    CurrentAcademicSessionForSchool,
  ])

  useEffect(() => {
    if (StaffsLeaveApplications)
      setLeaveApplications({
        applications: StaffsLeaveApplications.data,
        page: StaffsLeaveApplications.page,
      })
  }, [StaffsLeaveApplications])

  // Generate random colors for leave types
  const getLeaveTypeColor = (id?: number) => {
    if (id === undefined) return "bg-gray-500" // Default color for undefined IDs

    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ]
    return colors[id % colors.length]
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t("leaves")}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? t("refreshing") : t("refresh")}
          </Button>
          <Button onClick={() => handleDialog("create", null)}>
            <Plus className="mr-2 h-4 w-4" /> {t("apply_leave")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balance" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" /> {t("leave_balance")}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> {t("leave_history")}
          </TabsTrigger>
        </TabsList>

        {/* Leave Balance Tab */}
        <TabsContent value="balance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {t("leave_balance")}
              </CardTitle>
              <CardDescription>{t("view_your_leave_balance_and_usage")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLeaveBalancesLoading || isLeaveBalancesFetching ? (
                <div className="text-center py-8 text-muted-foreground">{t("loading_leave_balances")}</div>
              ) : leaveBalancesError ? (
                <div className="text-center py-8 text-destructive">
                  {t("error_loading_leave_balances")}
                  <Button variant="outline" size="sm" onClick={() => refetchLeaveBalances()} className="ml-2">
                    {t("try_again")}
                  </Button>
                </div>
              ) : leaveBalances && leaveBalances.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaveBalances.map((balanceData, index) => {
                    // Extract policy and balance from the response
                    const { policy, balance } = balanceData;
                    
                    // Handle cases where balance might be incomplete
                    const totalLeaves = typeof balance.total_leaves === 'string' 
                      ? parseFloat(balance.total_leaves) 
                      : Number(balance.total_leaves) || 0;
                      
                    const usedLeaves = typeof balance.used_leaves === 'string' 
                      ? parseFloat(balance.used_leaves) 
                      : Number(balance.used_leaves) || 0;
                      
                    const pendingLeaves = typeof balance.pending_leaves === 'string' 
                      ? parseFloat(balance.pending_leaves) 
                      : Number(balance.pending_leaves) || 0;
                      
                    const availableBalance = typeof balance.available_balance === 'string' 
                      ? parseFloat(balance.available_balance) 
                      : Number(balance.available_balance) || 0;

                    const carriedForward = typeof balance.carried_forward === 'string'
                      ? parseFloat(balance.carried_forward)
                      : Number(balance.carried_forward) || 0;
                      
                    // Calculate usage percentage
                    const usagePercentage = policy.annual_quota > 0 
                      ? (usedLeaves / policy.annual_quota) * 100 
                      : 0;
                      
                    // Get color for leave type
                    const leaveTypeColor = getLeaveTypeColor(policy.leave_type_id);

                    return (
                      <Card key={`${policy.id}-${index}`} className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${leaveTypeColor} mr-2`}></div>
                              <h4 className="font-medium">{policy.leave_type_name}</h4>
                            </div>
                            <Badge variant="outline">
                              {availableBalance} / {policy.annual_quota}
                            </Badge>
                          </div>
                          <Progress value={usagePercentage} className="h-2" />
                          
                          {/* Replace used/remaining with max consecutive days */}
                          <div className="flex justify-between mt-2 text-sm">
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>
                                <span className="font-medium">{t("max_consecutive")}: </span>
                                <span className="text-primary font-semibold">{policy.max_consecutive_days} {t("days")}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Keep pending leaves display */}
                          {pendingLeaves > 0 && (
                            <div className="flex justify-start mt-1 text-sm text-amber-500">
                              <span>
                                {t("pending")}: {pendingLeaves}
                              </span>
                            </div>
                          )}
                          
                          {/* Only show carried forward info, removing redundant consecutive days */}
                          <div className="mt-3 text-xs text-muted-foreground">
                            {policy.can_carry_forward === 1 && carriedForward > 0 && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {t("carried_forward")}: {carriedForward} {t("days")}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t("no_leave_balances_found")}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t("leave_history")}
                </CardTitle>
                <CardDescription>{t("view_your_leave_requests_and_status")}</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("filter_by_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {leaveApplications && leaveApplications.applications.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("leave_type")}</TableHead>
                        <TableHead>{t("duration")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveApplications.applications.map((application) => {
                        const leaveTypeColor = application.leave_type_id
                          ? getLeaveTypeColor(application.leave_type_id)
                          : "bg-gray-500"
                        return (
                          <TableRow
                            key={application.id}
                            className="cursor-pointer"
                            onClick={() => handleViewLeaveDetail(application)}
                          >
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${leaveTypeColor} mr-2`}></div>
                                <span>
                                  {application.leave_type_name
                                    ? application.leave_type_name
                                    : "Unknown Leave Type"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(application.from_date)} - {formatDate(application.to_date)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewLeaveDetail(application)
                                  }}
                                >
                                  {t("view")}
                                </Button>
                                {application.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDialog("edit", application)
                                      }}
                                      disabled={isDateTodayOrPast(application.from_date)}
                                      title={
                                        isDateTodayOrPast(application.from_date)
                                          ? t("cannot_edit_current_or_past_leave")
                                          : ""
                                      }
                                    >
                                      {t("edit")}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleWithdrawLeave(application)
                                      }}
                                      disabled={isDateTodayOrPast(application.from_date)}
                                      title={
                                        isDateTodayOrPast(application.from_date)
                                          ? t("cannot_withdraw_current_or_past_leave")
                                          : ""
                                      }
                                    >
                                      {t("withdraw")}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {leaveApplications?.page && (
                    <div className="mt-4">
                      <SaralPagination
                        onPageChange={handlePageChange}
                        currentPage={leaveApplications.page.current_page}
                        totalPages={leaveApplications.page.last_page}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isTeacherLeaveApplicationLoading
                    ? t("loading_leave_applications")
                    : t("no_leave_applications_found")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply/Edit Leave Dialog */}
      <Dialog
        open={DialogForLeaveApplication.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogForLeaveApplication({
              application: null,
              type: "create",
              isOpen: false,
            })
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] lg:h-[600px] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {DialogForLeaveApplication.type === "edit" ? t("edit_leave_application") : t("apply_for_leave")}
            </DialogTitle>
            <DialogDescription>
              {DialogForLeaveApplication.type === "edit"
                ? t("update_your_leave_request_details")
                : t("fill_in_the_details_to.apply_for_leave")}
            </DialogDescription>
          </DialogHeader>
          <LeaveApplicationForm
            initialData={DialogForLeaveApplication.application}
            type={DialogForLeaveApplication.type}
            onCancel={handleCloseDialog}
            onSucessesfullApplication={onSucessesfullApplication}
          />
        </DialogContent>
      </Dialog>

      {/* Leave Detail Dialog */}
      <Dialog open={isLeaveDetailDialogOpen} onOpenChange={setIsLeaveDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("leave_request_details")}</DialogTitle>
            <DialogDescription>{t("detailed_information_about_the_leave_request")}</DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${selectedLeave.leave_type_id ? getLeaveTypeColor(selectedLeave.leave_type_id) : "bg-gray-500"} mr-2`}
                    ></div>
                    <h3 className="text-lg font-medium">
                      {selectedLeave.leave_type_name ? selectedLeave.leave_type_name : "Unknown Leave Type"}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {formatDate(selectedLeave.from_date)} - {formatDate(selectedLeave.to_date)}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedLeave.status)}>{selectedLeave.status}</Badge>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-2">{t("reason")}</h4>
                <p>{selectedLeave.reason}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t("application_details")}</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("applied_on")}</p>
                        {/* <p>{formatDate(selectedLeave.created_at)}</p> */}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CalendarDays className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("leave_duration")}</p>
                        <p>
                          {formatDate(selectedLeave.from_date)} - {formatDate(selectedLeave.to_date)}
                        </p>
                      </div>
                    </div>
                    {selectedLeave.is_half_day && (
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("half_day")}</p>
                          <p>{selectedLeave.half_day_type === "first_half" ? t("first_half") : t("second_half")}</p>
                        </div>
                      </div>
                    )}
                    {selectedLeave.is_hourly_leave && (
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("hourly_leave")}</p>
                          <p>
                            {selectedLeave.total_hour} {t("hours")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedLeave.status !== "pending" && (
                  <div>
                    <h4 className="font-medium mb-2">{t("approval_details")}</h4>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {selectedLeave.status === "approved" ? t("approved_by") : t("rejected_by")}
                          </p>
                          {/* <p>{selectedLeave.approved_by || t("not_available")}</p> */}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t("updated_on")}</p>
                          {/* <p>{formatDate(selectedLeave.updated_at)}</p> */}
                        </div>
                      </div>
                      {/* {selectedLeave.comments && (
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t("comments")}</p>
                            <p>{selectedLeave.comments}</p>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveDetailDialogOpen(false)}>
              {t("close")}
            </Button>
            {selectedLeave && selectedLeave.status === "pending" && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    setIsLeaveDetailDialogOpen(false)
                    handleDialog("edit", selectedLeave)
                  }}
                  disabled={isDateTodayOrPast(selectedLeave.from_date)}
                  title={isDateTodayOrPast(selectedLeave.from_date) ? t("cannot_edit_current_or_past_leave") : ""}
                >
                  {t("edit")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsLeaveDetailDialogOpen(false)
                    handleWithdrawLeave(selectedLeave)
                  }}
                  disabled={isDateTodayOrPast(selectedLeave.from_date)}
                  title={isDateTodayOrPast(selectedLeave.from_date) ? t("cannot_withdraw_current_or_past_leave") : ""}
                >
                  {t("withdraw")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Leave Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{t("withdraw_leave_application")}</span>
              <Badge className="bg-red-100 text-red-800">
                {t("withdraw")}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {t("provide_a_reason_for_withdrawing_this_leave_application")}
            </DialogDescription>
          </DialogHeader>
          
          {leaveToWithdraw && (
            <div className="bg-muted/50 p-3 rounded-md mb-4">
              <div className="text-sm">
                <p>
                  <span className="font-medium">{t("leave_type")}:</span>{" "}
                  {leaveToWithdraw?.leave_type_name || t("unknown")}
                </p>
                <p>
                  <span className="font-medium">{t("duration")}:</span>{" "}
                  {formatDate(leaveToWithdraw.from_date)} - {formatDate(leaveToWithdraw.to_date)}
                </p>
                <p>
                  <span className="font-medium">{t("days")}:</span>{" "}
                  {leaveToWithdraw.number_of_days}
                </p>
                <p>
                  <span className="font-medium">{t("reason")}:</span>{" "}
                  {leaveToWithdraw.reason || t("not_provided")}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="withdraw-remarks">
                {t("remarks")} <span className="text-destructive">(Required)</span>
              </Label>
              <Textarea
                id="withdraw-remarks"
                value={withdrawRemarks}
                onChange={(e) => setWithdrawRemarks(e.target.value)}
                placeholder={t("please_explain_why_you_are_withdrawing_this_leave")}
                className="min-h-[100px]"
              />
              {!withdrawRemarks.trim() && (
                <p className="text-sm text-destructive">
                  {t("a_reason_is_required_when_withdrawing_a_leave_request")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsWithdrawDialogOpen(false)}
              disabled={isWithdrawing}
            >
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive"
              onClick={submitWithdrawLeave}
              disabled={!withdrawRemarks.trim() || isWithdrawing}
            >
              {isWithdrawing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("withdraw")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default LeaveDashboardForTeachers
