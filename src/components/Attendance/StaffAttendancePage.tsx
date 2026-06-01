"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import {
  useCheckInMutation,
  useCheckOutMutation,
  useRequestEditMutation,
  useGetStaffAttendanceQuery,
} from "@/services/StaffAttendanceService"

import { Clock, CheckCircle, XCircle, Edit, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { calculateTimeDifference, getCurrentTimeString } from "@/utils/time-utils"

const StaffAttendancePage = () => {
  const user = useAppSelector(selectCurrentUser)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation()
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation()
  const [requestEdit, { isLoading: isRequestingEdit }] = useRequestEditMutation()

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  const {
    data: attendanceData,
    isLoading,
    refetch,
  } = useGetStaffAttendanceQuery({
    year: currentYear,
    month: currentMonth,
  })

  const [currentTime, setCurrentTime] = useState<string>("")
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editRequestData, setEditRequestData] = useState({
    staff_attendance_id: 0,
    requested_check_in_time: "",
    requested_check_out_time: "",
    reason: "",
  })

  // Get today's attendance record
  const todayAttendance = attendanceData?.attendance.find(
    (record) => format(new Date(record.attendance_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
  )

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(format(now, "HH:mm:ss"))

      // Update elapsed time if checked in
      if (todayAttendance?.check_in_time) {
        setElapsedTime(calculateTimeDifference(todayAttendance.check_in_time, todayAttendance.check_out_time || undefined))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [todayAttendance])

  const handleCheckIn = async () => {
    try {
      if (!currentAcademicSession) {
        toast({
          title: "Error",
          description: "No active academic session found",
          variant: "destructive",
        })
        return
      }

      await checkIn({
        academic_session_id: currentAcademicSession.id,
        check_in_time: getCurrentTimeString(),
      })

      toast({
        title: "Success",
        description: "Check-in successful",
      })

      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      })
    }
  }

  const handleCheckOut = async () => {
    try {
      await checkOut({
        check_out_time: getCurrentTimeString(),
      })

      toast({
        title: "Success",
        description: "Check-out successful",
      })

      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (attendanceId: number) => {
    setEditRequestData({
      staff_attendance_id: attendanceId,
      requested_check_in_time: todayAttendance?.check_in_time || "",
      requested_check_out_time: todayAttendance?.check_out_time || "",
      reason: "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEditRequest = async () => {
    try {
      if (!editRequestData.reason) {
        toast({
          title: "Error",
          description: "Please provide a reason for the edit request",
          variant: "destructive",
        })
        return
      }

      await requestEdit(editRequestData)

      toast({
        title: "Success",
        description: "Edit request submitted successfully",
      })

      setIsEditDialogOpen(false)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit edit request",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today's Attendance Card */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>{format(today, "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <Clock className="h-12 w-12 text-indigo-500 mb-2" />
                <div className="text-3xl font-bold">{currentTime}</div>
                <div className="text-sm text-gray-500">Current Time</div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Working Hours</div>
                <div className="text-3xl font-bold">{elapsedTime}</div>
                <div className="flex mt-2">
                  {todayAttendance?.check_in_time && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                      In: {todayAttendance.check_in_time}
                    </div>
                  )}
                  {todayAttendance?.check_out_time && (
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Out: {todayAttendance.check_out_time}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-4">
              <Button
                onClick={handleCheckIn}
                disabled={isCheckingIn || !!todayAttendance?.check_in_time}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCheckingIn ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Check In
              </Button>

              <Button
                onClick={handleCheckOut}
                disabled={isCheckingOut || !todayAttendance?.check_in_time || !!todayAttendance?.check_out_time}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCheckingOut ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Check Out
              </Button>

              {todayAttendance && (
                <Button
                  onClick={() => openEditDialog(todayAttendance.id)}
                  variant="outline"
                  className="border-indigo-500 text-indigo-500 hover:bg-indigo-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Request Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>{format(today, "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Present Days:</span>
                <span className="font-bold text-green-600">{attendanceData?.statistics.presentDays || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Absent Days:</span>
                <span className="font-bold text-red-600">{attendanceData?.statistics.absentDays || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Late Days:</span>
                <span className="font-bold text-yellow-600">{attendanceData?.statistics.lateDays || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Half Days:</span>
                <span className="font-bold text-orange-600">{attendanceData?.statistics.halfDays || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Working Days:</span>
                <span className="font-bold">{attendanceData?.period.totalWorkingDays || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Your attendance for the current month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Check In</th>
                  <th className="px-4 py-2 text-left">Check Out</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Working Hours</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.attendance.slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{format(new Date(record.attendance_date), "MMM dd, yyyy")}</td>
                    <td className="px-4 py-2">{record.check_in_time || "-"}</td>
                    <td className="px-4 py-2">{record.check_out_time || "-"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          record.status === "present"
                            ? "bg-green-100 text-green-800"
                            : record.status === "absent"
                              ? "bg-red-100 text-red-800"
                              : record.status === "late"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {record.check_in_time && record.check_out_time
                        ? calculateTimeDifference(record.check_in_time, record.check_out_time)
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      {record.check_in_time && (
                        <Button
                          onClick={() => openEditDialog(record.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!attendanceData?.attendance || attendanceData.attendance.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                      No attendance records found for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Attendance Edit</DialogTitle>
            <DialogDescription>
              Submit a request to modify your attendance record. Your request will be reviewed by an administrator.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check-in-time">Check In Time</Label>
                <Input
                  id="check-in-time"
                  type="time"
                  value={editRequestData.requested_check_in_time}
                  onChange={(e) =>
                    setEditRequestData({
                      ...editRequestData,
                      requested_check_in_time: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="check-out-time">Check Out Time</Label>
                <Input
                  id="check-out-time"
                  type="time"
                  value={editRequestData.requested_check_out_time}
                  onChange={(e) =>
                    setEditRequestData({
                      ...editRequestData,
                      requested_check_out_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Edit</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you need to edit this attendance record"
                value={editRequestData.reason}
                onChange={(e) =>
                  setEditRequestData({
                    ...editRequestData,
                    reason: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRequest} disabled={isRequestingEdit}>
              {isRequestingEdit ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffAttendancePage
