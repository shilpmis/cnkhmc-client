"use client"

import { useState } from "react"
import { Check, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useDeleteAcademicSessionMutation, useGetAcademicSessionsQuery } from "@/services/AcademicService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectCurrentUser } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AcademicSessionsListProps {
  onActivate: (sessionId: number) => Promise<void>
}

export function AcademicSessionsList({ onActivate }: AcademicSessionsListProps) {
  const user = useAppSelector(selectCurrentUser)
  const { data: sessions, isLoading, refetch } = useGetAcademicSessionsQuery(user?.school_id ?? 0)
  const [deleteAcademicSession] = useDeleteAcademicSessionMutation()
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<{ id: number; name: string } | null>(null)
  const { t } = useTranslation()

  const handleSetActive = async (sessionId: number) => {
    if (!sessionId) return

    setActivatingId(sessionId)
    try {
      await onActivate(sessionId)
      refetch()
    } catch (error: any) {
      console.error("Failed to activate session:", error)
      toast({
        title: "Error",
        description: "Failed to activate session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActivatingId(null)
    }
  }

  const handleDeleteClick = (session: any) => {
    setSessionToDelete({ id: session.id, name: session.session_name })
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    setDeletingId(sessionToDelete.id)
    try {
      await deleteAcademicSession(sessionToDelete.id).unwrap()
      toast({
        title: "Success",
        description: `Academic session "${sessionToDelete.name}" has been deleted.`,
      })
      refetch()
    } catch (error: any) {
      console.error("Failed to delete session:", error)

      // Extract error message from different possible error formats
      let errorMessage = "Failed to delete academic session"

      if (error.data?.message) {
        // Handle standard API error format
        errorMessage = error.data.message
      } else if (error.data?.error) {
        // Handle error object format
        errorMessage = error.data.error
      } else if (Array.isArray(error.data)) {
        // Handle array of errors format
        errorMessage = error.data.map((err: any) => err.message || err).join(", ")
      } else if (typeof error.message === "string") {
        // Handle plain error message
        errorMessage = error.message
      } else if (typeof error === "string") {
        // Handle string error
        errorMessage = error
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
      setIsDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!sessions || !sessions.sessions || sessions.sessions.length === 0) {
    return <div className="text-center p-4 text-muted-foreground">{t("no_academic_sessions_found")}</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("academic_sessions")}</TableHead>
            <TableHead>{t("start_date")}</TableHead>
            <TableHead>{t("end_date")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions?.sessions?.map((session: any) => (
            <TableRow key={session.id}>
              <TableCell>{session.session_name}</TableCell>
              <TableCell>
                {session.start_month}  {session.start_year}
              </TableCell>
              <TableCell>
                {session.end_month} {session.end_year}
              </TableCell>
              <TableCell>
                {session.is_active ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    {t("active")}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t("inactive")}</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetActive(session.id)}
                    disabled={session.is_active || activatingId === session.id}
                  >
                    {activatingId === session.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("activating")}...
                      </>
                    ) : session.is_active ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {t("active")}
                      </>
                    ) : (
                      t("set_active")
                    )}
                  </Button>
                  {/* <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(session)}
                    disabled={session.is_active || deletingId === session.id}
                  >
                    {deletingId === session.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("deleting")}...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("delete")}
                      </>
                    )}
                  </Button> */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_academic_session")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("are_you_sure_you_want_to_delete_the_academic_session")} "{sessionToDelete?.name}"?{" "}
              {t("this_action_cannot_be_undone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

