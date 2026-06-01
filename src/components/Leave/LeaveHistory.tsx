import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { LeaveRequest } from "@/types/leave"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface LeaveHistoryProps {
  leaveRequests: LeaveRequest[]
}

export function LeaveHistory({ leaveRequests }: LeaveHistoryProps) {
  const {t} = useTranslation()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("start_date")}</TableHead>
          <TableHead>{t("end_date")}</TableHead>
          <TableHead>{t("leave_type")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("reason")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaveRequests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
            <TableCell>{request.leaveType}</TableCell>
            <TableCell>
            <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
              {request.status}
            </Badge>
            </TableCell>
            <TableCell>{request.reason}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

