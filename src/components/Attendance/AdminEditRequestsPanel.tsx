"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useGetEditRequestsQuery, useProcessEditRequestMutation } from "@/services/StaffAttendanceService"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { SaralPagination } from "../ui/common/SaralPagination"

const AdminEditRequestsPanel = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending")
  const {
    data: editRequests,
    isLoading,
    refetch,
  } = useGetEditRequestsQuery({
    status,
    page: currentPage,
    perPage: 10,
  })
  const [processEditRequest, { isLoading: isProcessing }] = useProcessEditRequestMutation()

  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null)
  const [processAction, setProcessAction] = useState<"approved" | "rejected">("approved")
  const [adminRemarks, setAdminRemarks] = useState("")

  const openProcessDialog = (requestId: number, action: "approved" | "rejected") => {
    setSelectedRequest(requestId)
    setProcessAction(action)
    setAdminRemarks("")
    setIsProcessDialogOpen(true)
  }

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    if (!adminRemarks.trim()) {
      toast({
        title: "Error",
        description: "Please provide remarks for this action",
        variant: "destructive",
      })
      return
    }

    try {
      await processEditRequest({
        id: selectedRequest,
        payload: {
          status: processAction,
          admin_remarks: adminRemarks,
        },
      })

      toast({
        title: "Success",
        description: `Request ${processAction} successfully`,
      })

      setIsProcessDialogOpen(false)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${processAction} request`,
        variant: "destructive",
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    )
  }

  return (
    <Card className="container mx-auto p-6">
      <CardHeader>
        <CardTitle>Staff Attendance Edit Requests</CardTitle>
        <CardDescription>Review and process attendance edit requests from staff members</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" onValueChange={(value) => setStatus(value as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Staff</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Current Times</th>
                    <th className="px-4 py-2 text-left">Requested Times</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Requested On</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editRequests?.data.map((request) => (
                    <tr key={request.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {/* {request.attendance?.staff?.first_name} {request.attendance?.staff?.last_name} */}
                        {/* <div className="text-xs text-gray-500">{request.attendance?.staff?.employee_code}</div> */}
                      </td>
                      <td className="px-4 py-2">
                        {request.attendance?.attendance_date
                          ? format(new Date(request.attendance.attendance_date), "MMM dd, yyyy")
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div>In: {request.attendance?.check_in_time || "-"}</div>
                        <div>Out: {request.attendance?.check_out_time || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div>In: {request.requested_check_in_time || "-"}</div>
                        <div>Out: {request.requested_check_out_time || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{request.reason}</div>
                      </td>
                      <td className="px-4 py-2">
                        {request.created_at ? format(parseISO(request.created_at), "MMM dd, yyyy HH:mm") : "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => openProcessDialog(request.id, "approved")}
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-green-500 text-green-500 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => openProcessDialog(request.id, "rejected")}
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!editRequests?.data || editRequests.data.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                        No pending edit requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Staff</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Original Times</th>
                    <th className="px-4 py-2 text-left">Approved Times</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Admin Remarks</th>
                    <th className="px-4 py-2 text-left">Processed On</th>
                  </tr>
                </thead>
                <tbody>
                  {editRequests?.data.map((request) => (
                    <tr key={request.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {/* {request.attendance?.staff?.first_name} {request.attendance?.staff?.last_name}
                        <div className="text-xs text-gray-500">{request.attendance?.staff?.employee_code}</div> */}
                      </td>
                      <td className="px-4 py-2">
                        {request.attendance?.attendance_date
                          ? format(new Date(request.attendance.attendance_date), "MMM dd, yyyy")
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div>In: {request.attendance?.check_in_time || "-"}</div>
                        <div>Out: {request.attendance?.check_out_time || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div>In: {request.requested_check_in_time || "-"}</div>
                        <div>Out: {request.requested_check_out_time || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{request.reason}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{request.admin_remarks}</div>
                      </td>
                      <td className="px-4 py-2">
                        {request.actioned_at ? format(parseISO(request.actioned_at), "MMM dd, yyyy HH:mm") : "-"}
                      </td>
                    </tr>
                  ))}
                  {(!editRequests?.data || editRequests.data.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                        No approved edit requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Staff</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Current Times</th>
                    <th className="px-4 py-2 text-left">Requested Times</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Admin Remarks</th>
                    <th className="px-4 py-2 text-left">Processed On</th>
                  </tr>
                </thead>
                <tbody>
                  {editRequests?.data.map((request) => (
                    <tr key={request.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {/* {request.attendance?.staff?.first_name} {request.attendance?.staff?.last_name}
                        <div className="text-xs text-gray-500">{request.attendance?.staff?.employee_code}</div> */}
                      </td>
                      <td className="px-4 py-2">
                        {request.attendance?.attendance_date
                          ? format(new Date(request.attendance.attendance_date), "MMM dd, yyyy")
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        <div>In: {request.attendance?.check_in_time || "-"}</div>
                        <div>Out: {request.attendance?.check_out_time || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div>In: {request.requested_check_in_time || "-"}</div>
                        <div>Out: {request.requested_check_out_time || "-"}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{request.reason}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="max-w-xs truncate">{request.admin_remarks}</div>
                      </td>
                      <td className="px-4 py-2">
                        {request.actioned_at ? format(parseISO(request.actioned_at), "MMM dd, yyyy HH:mm") : "-"}
                      </td>
                    </tr>
                  ))}
                  {(!editRequests?.data || editRequests.data.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                        No rejected edit requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {editRequests?.meta && editRequests.meta.last_page > 1 && (
          <div className="flex justify-center mt-6">
            <SaralPagination
              currentPage={currentPage}
              totalPages={editRequests.meta.last_page}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </CardContent>

      {/* Process Request Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{processAction === "approved" ? "Approve" : "Reject"} Edit Request</DialogTitle>
            <DialogDescription>
              {processAction === "approved"
                ? "Approving this request will update the staff attendance record with the requested times."
                : "Rejecting this request will keep the original attendance record unchanged."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div>
              <label htmlFor="admin-remarks" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Remarks
              </label>
              <Textarea
                id="admin-remarks"
                placeholder="Provide a reason for your decision"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessRequest}
              disabled={isProcessing}
              className={
                processAction === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              {processAction === "approved" ? "Approve" : "Reject"} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default AdminEditRequestsPanel
