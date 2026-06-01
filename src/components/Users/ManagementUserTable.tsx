import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/types/user"
import { useEffect } from "react"
import { SaralPagination } from "../ui/common/SaralPagination"
import { PageMeta } from "@/types/global"
import { useTranslation } from "@/redux/hooks/useTranslation"

type Role = {
    id: number
    role: string
    permissions: Record<string, unknown>
}

type ManagementUserTableProps = {
    initialData: { users: User[], page_meta: PageMeta }
    roles: Role[]
    onPageChange: (page: number) => void;
    onEditUser: (user: User) => void
}

const checkIsActive = (value : any) : boolean =>{
    return value == 1
}

const ManagementUserTable: React.FC<ManagementUserTableProps> = ({ initialData, roles, onPageChange, onEditUser }) => {

    const onPageUpdate = (page: number) => {
        onPageChange(page)
    }

    const {t} = useTranslation()
    return (
        <>
            {initialData.users.length > 0 ? (<Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("name")}</TableHead>
                        {/* <TableHead>Username</TableHead> */}
                        <TableHead>{t("email")}</TableHead>
                        <TableHead>{t("role")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialData.users.map((user) => {
                        const userRole = roles.find((role) => role.id === user.role_id)
                        return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{userRole?.role || "Unknown"}</TableCell>
                                <TableCell>
                                    <Badge variant={checkIsActive(user.is_active) ? "secondary" : "destructive"}>
                                        {checkIsActive(user.is_active) ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" onClick={() => onEditUser(user)}>
                                        {/* <span className=""> */}
                                        {t("edit")}
                                        {/* </span> */}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>) : <div className="text-center">{t("no_users_found")}</div>}
            {initialData.page_meta.last_page > 1 && (<SaralPagination
                currentPage={initialData.page_meta.current_page}
                totalPages={initialData.page_meta.last_page}
                onPageChange={onPageUpdate}
            />)}
        </>
    )
}

export default ManagementUserTable

