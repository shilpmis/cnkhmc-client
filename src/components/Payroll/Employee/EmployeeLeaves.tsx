"use client"

import type React from "react"

import { useState } from "react"
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
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import { Calendar, Plus, FileText, Clock, AlertCircle, CalendarDays, User } from "lucide-react"

// Mock data types
interface LeaveType {
  id: number
  name: string
  color: string
}

interface LeaveBalance {
  leaveTypeId: number
  total: number
  used: number
  remaining: number
}

interface LeaveRequest {
  id: number
  leaveTypeId: number
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "Approved" | "Rejected" | "Pending"
  appliedOn: string
  approvedBy?: string
  approvedOn?: string
  comments?: string
}

// Mock data for leave types
const mockLeaveTypes: LeaveType[] = [
  { id: 1, name: "Casual Leave", color: "bg-blue-500" },
  { id: 2, name: "Sick Leave", color: "bg-red-500" },
  { id: 3, name: "Earned Leave", color: "bg-green-500" },
  { id: 4, name: "Maternity Leave", color: "bg-purple-500" },
  { id: 5, name: "Paternity Leave", color: "bg-yellow-500" },
  { id: 6, name: "Unpaid Leave", color: "bg-gray-500" },
]

// Mock data for leave balances
const mockLeaveBalances: LeaveBalance[] = [
  { leaveTypeId: 1, total: 12, used: 5, remaining: 7 },
  { leaveTypeId: 2, total: 10, used: 2, remaining: 8 },
  { leaveTypeId: 3, total: 15, used: 0, remaining: 15 },
  { leaveTypeId: 4, total: 180, used: 0, remaining: 180 },
  { leaveTypeId: 5, total: 15, used: 0, remaining: 15 },
  { leaveTypeId: 6, total: 0, used: 0, remaining: 0 },
]

// Mock data for leave requests
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 1,
    leaveTypeId: 1,
    startDate: "2023-12-25",
    endDate: "2023-12-26",
    days: 2,
    reason: "Family function",
    status: "Approved",
    appliedOn: "2023-12-10",
    approvedBy: "Jane Smith",
    approvedOn: "2023-12-12",
  },
  {
    id: 2,
    leaveTypeId: 2,
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    days: 3,
    reason: "Fever and cold",
    status: "Approved",
    appliedOn: "2024-01-14",
    approvedBy: "Jane Smith",
    approvedOn: "2024-01-14",
  },
  {
    id: 3,
    leaveTypeId: 1,
    startDate: "2024-02-05",
    endDate: "2024-02-05",
    days: 1,
    reason: "Personal work",
    status: "Rejected",
    appliedOn: "2024-01-25",
    approvedBy: "Jane Smith",
    approvedOn: "2024-01-27",
    comments: "High workload during this period",
  },
  {
    id: 4,
    leaveTypeId: 6,
    startDate: "2024-03-10",
    endDate: "2024-03-12",
    days: 3,
    reason: "Family emergency",
    status: "Approved",
    appliedOn: "2024-03-09",
    approvedBy: "Jane Smith",
    approvedOn: "2024-03-09",
  },
  {
    id: 5,
    leaveTypeId: 1,
    startDate: "2024-04-20",
    endDate: "2024-04-22",
    days: 3,
    reason: "Personal work",
    status: "Pending",
    appliedOn: "2024-04-10",
  },
]

interface EmployeeProps {
  employee: any
}

const EmployeeLeaves: React.FC<EmployeeProps> = ({ employee }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("balance")
  const [isLeaveDetailDialogOpen, setIsLeaveDetailDialogOpen] = useState(false)
  const [isApplyLeaveDialogOpen, setIsApplyLeaveDialogOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Get leave type name
  const getLeaveTypeName = (leaveTypeId: number) => {
    const leaveType = mockLeaveTypes.find((type) => type.id === leaveTypeId)
    return leaveType ? leaveType.name : "Unknown"
  }

  // Get leave type color
  const getLeaveTypeColor = (leaveTypeId: number) => {
    const leaveType = mockLeaveTypes.find((type) => type.id === leaveTypeId)
    return leaveType ? leaveType.color : "bg-gray-500"
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Approved":
        return "default"
      case "Rejected":
        return "destructive"
      case "Pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Handle view leave detail
  const handleViewLeaveDetail = (leave: LeaveRequest) => {
    setSelectedLeave(leave)
    setIsLeaveDetailDialogOpen(true)
  }

  // Handle apply leave
  const handleApplyLeave = () => {
    setIsApplyLeaveDialogOpen(true)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t("leaves")}</h2>
        <Button onClick={handleApplyLeave}>
          <Plus className="mr-2 h-4 w-4" /> {t("apply_leave")}
        </Button>
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
              <CardDescription>{t("view_employee_leave_balance_and_usage")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLeaveBalances.map((balance) => {
                  const leaveType = mockLeaveTypes.find((type) => type.id === balance.leaveTypeId)
                  if (!leaveType) return null

                  const usagePercentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0

                  return (
                    <Card key={balance.leaveTypeId} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${leaveType.color} mr-2`}></div>
                            <h4 className="font-medium">{leaveType.name}</h4>
                          </div>
                          <Badge variant="outline">
                            {balance.remaining} / {balance.total}
                          </Badge>
                        </div>
                        <Progress value={usagePercentage} className="h-2" />
                        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                          <span>
                            {t("used")}: {balance.used}
                          </span>
                          <span>
                            {t("remaining")}: {balance.remaining}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("leave_history")}
              </CardTitle>
              <CardDescription>{t("view_employee_leave_requests_and_status")}</CardDescription>
            </CardHeader>
            <CardContent>
              {mockLeaveRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("no_leave_requests_found")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("leave_type")}</TableHead>
                      <TableHead>{t("duration")}</TableHead>
                      <TableHead>{t("days")}</TableHead>
                      <TableHead>{t("applied_on")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLeaveRequests.map((leave) => (
                      <TableRow key={leave.id} className="cursor-pointer" onClick={() => handleViewLeaveDetail(leave)}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${getLeaveTypeColor(leave.leaveTypeId)} mr-2`}></div>
                            <span>{getLeaveTypeName(leave.leaveTypeId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </TableCell>
                        <TableCell>{leave.days}</TableCell>
                        <TableCell>{formatDate(leave.appliedOn)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(leave.status)}>{leave.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewLeaveDetail(leave)
                            }}
                          >
                            {t("view_details")}
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
                    <div className={`w-3 h-3 rounded-full ${getLeaveTypeColor(selectedLeave.leaveTypeId)} mr-2`}></div>
                    <h3 className="text-lg font-medium">{getLeaveTypeName(selectedLeave.leaveTypeId)}</h3>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)} ({selectedLeave.days}{" "}
                    {t("days")})
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
                        <p>{formatDate(selectedLeave.appliedOn)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CalendarDays className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("leave_duration")}</p>
                        <p>
                          {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLeave.status !== "Pending" && (
                  <div>
                    <h4 className="font-medium mb-2">{t("approval_details")}</h4>
                    <div className="space-y-2">
                      {selectedLeave.approvedBy && (
                        <div className="flex items-start">
                          <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {selectedLeave.status === "Approved" ? t("approved_by") : t("rejected_by")}
                            </p>
                            <p>{selectedLeave.approvedBy}</p>
                          </div>
                        </div>
                      )}
                      {selectedLeave.approvedOn && (
                        <div className="flex items-start">
                          <Clock className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t("approved_on")}</p>
                            <p>{formatDate(selectedLeave.approvedOn)}</p>
                          </div>
                        </div>
                      )}
                      {selectedLeave.comments && (
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t("comments")}</p>
                            <p>{selectedLeave.comments}</p>
                          </div>
                        </div>
                      )}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyLeaveDialogOpen} onOpenChange={setIsApplyLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("apply_for_leave")}</DialogTitle>
            <DialogDescription>{t("fill_in_the_details_to_apply_for_leave")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Leave application form would go here */}
            <p className="text-center text-muted-foreground py-8">{t("leave_application_form_placeholder")}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyLeaveDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                setIsApplyLeaveDialogOpen(false)
                toast({
                  title: "Leave application submitted",
                  description: "Your leave application has been submitted for approval",
                })
              }}
            >
              {t("submit_application")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EmployeeLeaves

