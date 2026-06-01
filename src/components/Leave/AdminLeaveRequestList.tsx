import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LeaveRequest } from "@/types/leave"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface AdminLeaveRequestListProps {
  leaveRequests: LeaveRequest[]
  onUpdateStatus: (requestId: string, newStatus: "approved" | "rejected") => void
}

const AdminLeaveRequestList: React.FC<AdminLeaveRequestListProps> = ({ leaveRequests, onUpdateStatus }) => {
  const {t} = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("start_date")}</TableHead>
          <TableHead>{t("end_date")}</TableHead>
          <TableHead>{t("type")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("reason")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaveRequests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.userName}</TableCell>
            <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
            <TableCell>{request.type}</TableCell>
            <TableCell>
            <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                {request.status}
              </Badge>
            </TableCell>
            <TableCell>{request.reason}</TableCell>
            <TableCell>
              {request.status === "pending" && (
                <div className="space-x-2">
                  <Button size="sm" onClick={() => onUpdateStatus(request.id, "approved")}>
                    {t("approve")}
                  </Button>
                  <Button size="sm" variant="destructive" className="text-white" onClick={() => onUpdateStatus(request.id, "rejected")}>
                    {t("reject")}
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default AdminLeaveRequestList

