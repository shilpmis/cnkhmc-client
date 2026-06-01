import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { User, UserStatus } from "@/types/user"
import { useTranslation } from "@/redux/hooks/useTranslation"

type UserTableProps = {
  users: User[]
  searchTerm: string
  statusFilter: UserStatus | null
  onEditUser: (user: User) => void
  onDeleteUser: (id: number) => void
}

export const UserTable: React.FC<UserTableProps> = ({ users, searchTerm, statusFilter, onEditUser, onDeleteUser }) => {
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter ? true : true
    return matchesSearch && matchesStatus
  })

  const {t} = useTranslation()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          {/* <TableHead>Username</TableHead> */}
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            {/* <TableCell>{user.username}</TableCell> */}
            <TableCell>{user.username || user.email}</TableCell>
            <TableCell>{user.role_id}</TableCell>
            {/* <TableCell>{user.status}</TableCell> */}
            <TableCell>
              <Button variant="outline" size="sm" className="mr-2" onClick={() => onEditUser(user)}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" className="text-white">
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

