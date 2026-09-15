"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  selectActiveAccademicSessionsForSchool,
  selectAccademicSessionsForSchool,
  selectAuthState,
} from "@/redux/slices/authSlice"
import { Loader2, Plus, Pencil, AlertCircle, Search, Trash2, FileUp } from "lucide-react"
import SyllabusUploadDialog from "./SyllabusUploadDialog"
import { 
  useLazyGetAllSubjectsQuery, 
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation 
} from "@/services/subjects"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
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
import { SaralPagination } from "@/components/ui/common/SaralPagination"

// Define the form schema
const subjectFormSchema = z.object({
  name: z.string().min(2, {
    message: "Subject name must be at least 2 characters.",
  }),
  code: z.string().optional(),
  description: z.string().optional(),
  academic_session_id: z.number({
    required_error: "Please select an academic session.",
  }).optional(),
  status: z.enum(["Active", "Inactive"]),
  year: z.string().optional(),
})

export default function SubjectSettings() {
  const { t } = useTranslation()
  const authState = useAppSelector(selectAuthState)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const academicSessions = useAppSelector(selectAccademicSessionsForSchool)

  // State variables
  const [selectedAcademicSession, setSelectedAcademicSession] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
   const [searchQuery, setSearchQuery] = useState("")
   const [selectedYear, setSelectedYear] = useState<string>("All")
   const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedSubjectForSyllabus, setSelectedSubjectForSyllabus] = useState<any>(null)
  const [isSyllabusDialogOpen, setIsSyllabusDialogOpen] = useState(false)
  
  const [subjectToDeleteSyllabus, setSubjectToDeleteSyllabus] = useState<any>(null)
  const [isDeleteSyllabusDialogOpen, setIsDeleteSyllabusDialogOpen] = useState(false)
  const [isDeletingSyllabus, setIsDeletingSyllabus] = useState(false)

  // API hooks
  const [getAllSubjects, { data: subjects, isLoading }] = useLazyGetAllSubjectsQuery()
  const [createSubject, { isLoading: isCreating }] = useCreateSubjectMutation()
  const [updateSubject, { isLoading: isUpdating }] = useUpdateSubjectMutation()
  const [deleteSubject, { isLoading: isDeleting }] = useDeleteSubjectMutation()

  // Setup form
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "Active",
      year: "",
    },
  })

  // Load subjects when academic session changes
  useEffect(() => {
    if (currentAcademicSession) {
      setSelectedAcademicSession(currentAcademicSession.id)
    }
  }, [currentAcademicSession])

  useEffect(() => {
    if (selectedAcademicSession) {
      getAllSubjects({ academic_session_id: selectedAcademicSession })
    }
  }, [selectedAcademicSession, getAllSubjects])

  // Handle academic session change
  const handleAcademicSessionChange = useCallback(async (value: string) => {
    const sessionId = Number(value)
    setSelectedAcademicSession(sessionId)
    setSelectedYear("All")
    setCurrentPage(1) // Reset to first page when changing session
  }, [])

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof subjectFormSchema>) => {
    try {
      // Append year to name if selected and not already present
      let finalName = data.name
      if (data.year && !data.name.toLowerCase().includes(data.year.toLowerCase())) {
        finalName = `${data.name} (${data.year})`
      }

      if (editingSubject) {
        await updateSubject({
          id: editingSubject.id,
          name: finalName,
          code: data.code?.trim() || undefined,
          description: data.description || "",
          academic_session_id: selectedAcademicSession!,
          year: data.year,
        }).unwrap()

        toast({
          title: t("subject_updated"),
          description: t("subject_has_been_updated_successfully"),
        })
      } else {
        await createSubject({
          name: finalName,
          code: data.code?.trim() || undefined,
          description: data.description || "",
          academic_session_id: currentAcademicSession!.id,
          year: data.year,
        }).unwrap()

        toast({
          title: t("subject_created"),
          description: t("subject_has_been_created_successfully"),
        })
      }

      // Reset form and close dialog
      form.reset()
      setEditingSubject(null)
      setIsDialogOpen(false)

      // Refresh subjects list
      if (selectedAcademicSession) {
        getAllSubjects({ academic_session_id: selectedAcademicSession })
      }
    } catch (error: any) {
      console.error("Error saving subject:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error?.data?.message || t("failed_to_save_subject"),
      })
    }
  }

  const handleEdit = (subject: any) => {
    setEditingSubject(subject)
    form.reset({
      name: subject.name,
      code: subject.code || "",
      description: subject.description || "",
      status: subject.status as any,
      year: subject.year || "",
    })
    setIsDialogOpen(true)
  }

  const confirmDelete = (id: number) => {
    setSubjectToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return

    try {
      await deleteSubject({ id: subjectToDelete }).unwrap()
      toast({
        title: t("subject_deleted"),
        description: t("subject_has_been_deleted_successfully"),
      })
      // Refresh list
      getAllSubjects({ academic_session_id: selectedAcademicSession! })
    } catch (error: any) {
      console.error("Error deleting subject:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error?.data?.message || t("failed_to_delete_subject"),
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  const handleDeleteSyllabus = async () => {
    if (!subjectToDeleteSyllabus || !selectedAcademicSession) return

    try {
      setIsDeletingSyllabus(true)
      const LessonPlanService = (await import("@/services/LessonPlanService")).default
      await LessonPlanService.deleteSyllabus(subjectToDeleteSyllabus.id, selectedAcademicSession)
      
      toast({
        title: "Syllabus Deleted",
        description: "The syllabus has been deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting syllabus:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: error?.response?.data?.message || "Failed to delete syllabus",
      })
    } finally {
      setIsDeletingSyllabus(false)
      setIsDeleteSyllabusDialogOpen(false)
      setSubjectToDeleteSyllabus(null)
    }
  }

  // Filter subjects based on search query and year
  const filteredSubjects = React.useMemo(() => {
    if (!subjects) return []

    return subjects.filter((subject) => {
      const matchesSearch =
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesYear = selectedYear === "All" || subject.year === selectedYear

      return matchesSearch && matchesYear
    })
  }, [subjects, searchQuery, selectedYear])

  // Calculate pagination
  const paginatedSubjects = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSubjects.slice(startIndex, endIndex)
  }, [filteredSubjects, currentPage, itemsPerPage])

  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredSubjects.length / itemsPerPage)
  }, [filteredSubjects, itemsPerPage])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("subject_settings")}</CardTitle>
            <CardDescription>{t("manage_subjects_across_academic_sessions")}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingSubject(null)
              form.reset({ name: "", code: "", description: "", status: "Active", year: "" })
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSubject(null)
                form.reset({ name: "", code: "", description: "", status: "Active", year: "" })
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t("add_new_subject")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubject ? t("edit_subject") : t("add_new_subject")}</DialogTitle>
                <DialogDescription>
                  {editingSubject 
                    ? t("update_subject_details_for_this_academic_session")
                    : t("create_a_new_subject_for_the_selected_academic_session")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    name="academic_session_id"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("academic_session")}</FormLabel>
                        <Select
                          defaultValue={currentAcademicSession?.id?.toString()}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={true}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_academic_year")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicSessions?.map((session) => (
                              <SelectItem
                                key={session.id}
                                value={session.id.toString()}
                                disabled={session.id !== currentAcademicSession?.id}
                              >
                                {session.session_name}
                                {session.id === currentAcademicSession?.id && " (" + t("current") + ")"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t("only_current_academic_session_is_allowed")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("subject_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("eg_mathematics")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("year")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_year")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1st Year">{t("1st_year")}</SelectItem>
                            <SelectItem value="2nd Year">{t("2nd_year")}</SelectItem>
                            <SelectItem value="3rd Year">{t("3rd_year")}</SelectItem>
                            <SelectItem value="4th Year">{t("4th_year")}</SelectItem>
                            <SelectItem value="5th Year">{t("5th_year")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t("assign_this_subject_to_a_specific_year")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("subject_code")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("eg_math")} {...field} />
                        </FormControl>
                        <FormDescription>{t("a_short_code_to_identify_the_subject")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("description")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t("enter_subject_description")} className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("status")}</FormLabel>
                        <Select defaultValue={field.value} onValueChange={(value) => field.onChange(value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_status")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">{t("active")}</SelectItem>
                            <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingSubject ? t("update_subject") : t("create_subject")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Academic session selector */}
            <div className="flex items-center gap-4">
              <div className="max-w-xs">
                <Label htmlFor="academic-session">{t("academic_year")}</Label>
                <Select value={selectedAcademicSession?.toString() || ""} onValueChange={handleAcademicSessionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_academic_year")} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicSessions?.map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.session_name}
                        {session.id === currentAcademicSession?.id && " (" + t("current") + ")"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search input */}
              <div className="flex-grow max-w-sm">
                <Label htmlFor="search">{t("search")}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t("search_by_name_code_or_description")}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Year Filter */}
              <div className="w-48">
                <Label htmlFor="year-filter">{t("filter_by_year")}</Label>
                <Select value={selectedYear} onValueChange={(value) => {
                  setSelectedYear(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger id="year-filter">
                    <SelectValue placeholder={t("select_year")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t("all_years")}</SelectItem>
                    <SelectItem value="1st Year">{t("1st_year")}</SelectItem>
                    <SelectItem value="2nd Year">{t("2nd_year")}</SelectItem>
                    <SelectItem value="3rd Year">{t("3rd_year")}</SelectItem>
                    <SelectItem value="4th Year">{t("4th_year")}</SelectItem>
                    <SelectItem value="5th Year">{t("5th_year")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* No academic sessions warning */}
            {!academicSessions ||
              (academicSessions.length === 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("no_academic_sessions_found")}</AlertTitle>
                  <AlertDescription>{t("please_create_academic_sessions_before_managing_subjects")}</AlertDescription>
                </Alert>
              ))}

            {/* Subjects table */}
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedSubjects.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("subject_name")}</TableHead>
                        <TableHead>{t("subject_code")}</TableHead>
                        <TableHead>{t("year")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{subject.code || "-"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{subject.year || "-"}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{subject.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={subject.status === "Active" ? "default" : "secondary"}>
                              {subject.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(subject)}>
                              <Pencil className="h-4 w-4 mr-2 text-primary" />
                              {t("edit")}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedSubjectForSyllabus(subject)
                                setIsSyllabusDialogOpen(true)
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              {t("syllabus")}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSubjectToDeleteSyllabus(subject)
                                setIsDeleteSyllabusDialogOpen(true)
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Syllabus
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(subject.id)}>
                              <Trash2 className="h-4 w-4 mr-2 text-rose-500" />
                              {t("delete")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <SaralPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t("no_subjects_found")}</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {selectedAcademicSession
                    ? t("no_subjects_have_been_added_for_this_academic_session_yet")
                    : t("please_select_an_academic_session_to_view_subjects")}
                </p>
                {selectedAcademicSession && selectedAcademicSession === currentAcademicSession?.id && (
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("add_your_first_subject")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("this_action_cannot_be_undone_this_will_permanently_delete_the_subject")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubject}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SyllabusUploadDialog 
        isOpen={isSyllabusDialogOpen}
        onOpenChange={setIsSyllabusDialogOpen}
        subject={selectedSubjectForSyllabus}
        academicSessionId={selectedAcademicSession!}
      />

      <AlertDialog open={isDeleteSyllabusDialogOpen} onOpenChange={setIsDeleteSyllabusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Syllabus?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the syllabus for <strong>{subjectToDeleteSyllabus?.name}</strong>? This action cannot be undone and will remove all lesson plans, topics, and subtopics associated with this subject.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSyllabus}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSyllabus}
              disabled={isDeletingSyllabus}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isDeletingSyllabus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
