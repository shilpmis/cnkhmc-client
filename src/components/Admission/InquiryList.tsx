"use client"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { UserPlus, Search, Filter } from "lucide-react"
import { type Inquiry, useLazyGetInquiriesQuery, useUpdateInquiryMutation } from "@/services/InquiryServices"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { transformInquiryToStudent } from "@/utils/transform-inquiry-to-student"
import type { Student } from "@/types/student"
import AdmissionInquiryForm from "./AdmissionInquiryForm"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  selectActiveAccademicSessionsForSchool,
  selectAuthState,
  selectAccademicSessionsForSchool,
} from "@/redux/slices/authSlice"
import { SaralPagination } from "../ui/common/SaralPagination"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import OnboardingForm from "../Students/OnboardingForm"
import HostelAllotmentModal from "../Students/HostelAllotmentModal"
import { useNavigate } from "react-router-dom"

export default function InquiriesManagement() {
  const academicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentacademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)
  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const navigate = useNavigate()

  const [GetInquiries, { data: inquiriesData, isLoading }] = useLazyGetInquiriesQuery()
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  const authState = useAppSelector(selectAuthState)

  const [updateInquiry, { isLoading: isUpdating }] = useUpdateInquiryMutation()

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [eligibleDialogOpen, setEligibleDialogOpen] = useState(false)
  const [inquiryToReject, setInquiryToReject] = useState<number | null>(null)
  const [inquiryToMarkEligible, setInquiryToMarkEligible] = useState<number | null>(null)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [currentInquiryForOnboarding, setCurrentInquiryForOnboarding] = useState<Inquiry | null>(null)
  const [editInquiryDialogOpen, setEditInquiryDialogOpen] = useState(false)
  const [inquiryToEdit, setInquiryToEdit] = useState<any>(null)
  const [showHostelModal, setShowHostelModal] = useState(false)
  const [newStudentData, setNewStudentData] = useState<Student | null>(null)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null)
  const { t } = useTranslation()

  const filteredInquiries = useCallback((): Inquiry[] => {
    if (!inquiriesData || !inquiriesData.data) {
      return []
    }

    let filtered = inquiriesData.data

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inquiry) => inquiry.status === statusFilter)
    }

    // Filter by class
    if (classFilter !== "all") {
      filtered = filtered.filter((inquiry) => inquiry.inquiry_for_class?.toString() === classFilter)
    }

    // Filter by search term (student name or parent name)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((inquiry) => {
        const studentName = `${inquiry.first_name} ${inquiry.middle_name || ""} ${inquiry.last_name}`.toLowerCase()
        const parentName = inquiry.father_name.toLowerCase()
        return studentName.includes(searchLower) || parentName.includes(searchLower)
      })
    }

    return filtered
  }, [statusFilter, classFilter, searchTerm, inquiriesData])

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateInquiry({ inquiry_id: id, payload: { status } }).unwrap()
      toast({
        title: "Status Updated",
        description: "The inquiry status has been updated successfully.",
      })
      GetInquiries({
        page: inquiriesData?.meta.currentPage,
        academic_session_id: selectedAcademicYear!,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to update inquiry status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReject = (id: number) => {
    setInquiryToReject(id)
    setRejectDialogOpen(true)
  }

  const handleMarkEligible = (id: number) => {
    setInquiryToMarkEligible(id)
    setEligibleDialogOpen(true)
  }

  const confirmReject = async () => {
    if (inquiryToReject) {
      try {
        await updateInquiry({ inquiry_id: inquiryToReject, payload: { status: "rejected" } }).unwrap()
        toast({
          title: "Application Rejected",
          description: "The application has been rejected successfully.",
        })
        setRejectDialogOpen(false)
        setInquiryToReject(null)
        GetInquiries({
          page: inquiriesData?.meta.currentPage,
          academic_session_id: selectedAcademicYear!,
        })
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to reject application. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const confirmMarkEligible = async () => {
    if (inquiryToMarkEligible) {
      try {
        await updateInquiry({ inquiry_id: inquiryToMarkEligible, payload: { status: "eligible" } }).unwrap()
        toast({
          title: "Application Marked Eligible",
          description: "The application has been marked as eligible successfully.",
        })
        setEligibleDialogOpen(false)
        setInquiryToMarkEligible(null)
        GetInquiries({
          page: inquiriesData?.meta.currentPage,
          academic_session_id: selectedAcademicYear!,
        })
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to mark application as eligible. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleOnboardStudent = (inquiry: Inquiry) => {
    if (!AcademicClasses) {
      toast({
        title: "Error",
        description: "Academic classes not found.",
        variant: "destructive",
      })
      return
    }
    setCurrentInquiryForOnboarding({
      ...inquiry,
      inquiry_for_class: AcademicClasses.find((item) => item.id == inquiry.inquiry_for_class)!.id,
    })
    setShowStudentForm(true)
  }

  const handleEditInquiry = (inquiry: Inquiry) => {
    setInquiryToEdit(inquiry)
    setEditInquiryDialogOpen(true)
  }

  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      pending: { text: t("pending"), color: "text-yellow-700" },
      eligible: { text: t("eligible"), color: "text-green-700" },
      ineligible: { text: t("ineligible"), color: "text-red-700" },
      approved: { text: t("approved"), color: "text-blue-700" },
      rejected: { text: t("rejected"), color: "text-red-700" },
      withdrawn: { text: t("withdrawn"), color: "text-purple-700" },
      enrolled: { text: t("Enrolled"), color: "text-green-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { text: status, color: "text-gray-700" }

    return <span className={`font-medium ${config.color}`}>{config.text}</span>
  }

  const renderActionButtons = (inquiry: Inquiry) => {
    const isEnrolled = inquiry.status === "enrolled"
    const isRejected = inquiry.status === "rejected"
    const isApproved = inquiry.status === "approved"
    const isEligible = inquiry.status === "eligible"
    const isIneligible = inquiry.status === "ineligible"

    return (
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(inquiry)}>
          {t("view")}
        </Button>

        {/* Edit button */}
        <Button variant="outline" size="sm" onClick={() => handleEditInquiry(inquiry)} disabled={isEnrolled}>
          {t("edit")}
        </Button>

        {/* Onboard Student button - only enabled for approved applications */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOnboardStudent(inquiry)}
          disabled={inquiry.status !== "approved" || Boolean(Number(inquiry.is_converted_to_student))}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          {t("onboard")}
        </Button>

        {/* Token Amount button for enrolled students */}
        {(authState.user!.role === "CLERK" || authState.user!.role === "ADMIN") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/d/pay-fees/${(inquiry as any)?.student_id}?session_id=${inquiry.academic_session_id}`,
              )
            }
            disabled={
              inquiry.status !== "enrolled" ||
              !Boolean(Number(inquiry.is_converted_to_student) || inquiry.student_enrollments_id)
            }
          >
            {t("token_amount")}
          </Button>
        )}
      </div>
    )
  }

  useEffect(() => {
    const storedYear = sessionStorage.getItem("selectedAcademicYearInquiry")
    if (storedYear) {
      setSelectedAcademicYear(Number(storedYear))
    } else {
      setSelectedAcademicYear(CurrentacademicSessions?.id || null)
    }
  }, [CurrentacademicSessions])

  useEffect(() => {
    if (selectedAcademicYear) {
      sessionStorage.setItem("selectedAcademicYearInquiry", selectedAcademicYear.toString())
    }
  }, [selectedAcademicYear])

  useEffect(() => {
    if (selectedAcademicYear) {
      GetInquiries({
        page: 1,
        academic_session_id: selectedAcademicYear,
      })
    }
  }, [selectedAcademicYear])

  useEffect(() => {
    if (!AcademicClasses) {
      getAcademicClasses(authState.user!.school_id)
    }
  }, [AcademicClasses])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <div className="h-6 w-40 bg-muted rounded mb-2 animate-pulse"></div>
        <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" /> {t("filter_inquiries")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Academic Year Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">{t("academic_year")}</Label>
                <Select
                  value={selectedAcademicYear?.toString() || ""}
                  onValueChange={(value) => setSelectedAcademicYear(Number(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("select_academic_year")} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicSessions?.map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.session_name} {Boolean(session.is_active) && `(${t("current")})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">{t("class")}</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("select_class")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_classes")}</SelectItem>
                    {AcademicClasses?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {t("class")} {cls.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">{t("status")}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("filter_by_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_inquiries")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="eligible">{t("eligible")}</SelectItem>
                    <SelectItem value="ineligible">{t("ineligible")}</SelectItem>
                    <SelectItem value="approved">{t("approved")}</SelectItem>
                    <SelectItem value="rejected">{t("rejected")}</SelectItem>
                    <SelectItem value="withdrawn">{t("withdrawn")}</SelectItem>
                    <SelectItem value="enrolled">{t("Enrolled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400" />
              <Label className="text-sm font-medium text-gray-700 mb-1 block">{t("search")}</Label>
              <Input
                placeholder={t("search_by_student_or_parent_name")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admission_inquiries")}</CardTitle>
            <CardDescription>{t("review_and_process_admission_inquiries")}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInquiries() !== undefined && filteredInquiries().length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("student_name")}</TableHead>
                      <TableHead>{t("class")}</TableHead>
                      <TableHead>{t("parent_name")}</TableHead>
                      <TableHead>{t("contact")}</TableHead>
                      <TableHead>{t("date_of_birth")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInquiries().map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">
                          {inquiry.first_name} {inquiry.middle_name ? inquiry.middle_name : ""} {inquiry.last_name}
                        </TableCell>
                        <TableCell>
                          {AcademicClasses?.find((cls) => cls.id === inquiry.inquiry_for_class)?.class}
                        </TableCell>
                        <TableCell>{inquiry.father_name}</TableCell>
                        <TableCell>{inquiry.primary_mobile}</TableCell>
                        <TableCell>{new Date(inquiry.birth_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusDisplay(inquiry.status)}</TableCell>
                        <TableCell>{renderActionButtons(inquiry)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <SaralPagination
                  currentPage={inquiriesData!.meta.current_page || inquiriesData!.meta.currentPage}
                  totalPages={inquiriesData!.meta.last_page || inquiriesData!.meta.lastPage}
                  onPageChange={(page) => {
                    GetInquiries({
                      page: page,
                      academic_session_id: selectedAcademicYear!,
                    })
                  }}
                />
              </>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/50">
                {t("no_inquiries_found_matching_the_selected_filter.")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inquiry Details Dialog */}
        {selectedInquiry && (
          <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("inquiry_details")}</DialogTitle>
                <DialogDescription>{t("review_complete_details_and_determine_eligibility")}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("student_information")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">{t("name")}:</div>
                      <div className="text-sm">
                        {selectedInquiry.first_name} {selectedInquiry.middle_name || ""} {selectedInquiry.last_name}
                      </div>
                      <div className="text-sm font-medium">{t("date_of_birth")}:</div>
                      <div className="text-sm">{new Date(selectedInquiry.birth_date).toLocaleDateString()}</div>
                      <div className="text-sm font-medium">{t("gender")}:</div>
                      <div className="text-sm">{selectedInquiry.gender}</div>
                      <div className="text-sm font-medium">{t("parent_name")}:</div>
                      <div className="text-sm">{selectedInquiry.father_name}</div>
                      <div className="text-sm font-medium">{t("contact")}:</div>
                      <div className="text-sm">{selectedInquiry.primary_mobile}</div>
                      <div className="text-sm font-medium">{t("email")}:</div>
                      <div className="text-sm">{selectedInquiry.parent_email || "N/A"}</div>
                      <div className="text-sm font-medium">{t("address")}:</div>
                      <div className="text-sm col-span-2">{selectedInquiry.address}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Previous Education Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("previous_education")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">{t("school_name")}:</div>
                      <div className="text-sm">{selectedInquiry.previous_school || "N/A"}</div>
                      <div className="text-sm font-medium">{t("last_class")}:</div>
                      <div className="text-sm">{selectedInquiry.previous_class || "N/A"}</div>
                      <div className="text-sm font-medium">{t("percentage")}(%):</div>
                      <div className="text-sm">{selectedInquiry.previous_percentage || "N/A"}</div>
                      <div className="text-sm font-medium">{t("year")}:</div>
                      <div className="text-sm">{selectedInquiry.previous_year || "N/A"}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admission Info Card */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("admission_info")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm font-medium">{t("applied_class")} (AY):</div>
                        <div className="text-sm">
                          {AcademicClasses?.find((cls) => cls.id === selectedInquiry.inquiry_for_class)?.class}(
                          {academicSessions?.find((s) => s.id === selectedInquiry.academic_session_id)?.session_name})
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{t("quota_name")}:</div>
                        <div className="text-sm">
                          {selectedInquiry.applying_for_quota
                            ? selectedInquiry.quota_type || "N/A"
                            : t("not_applying_for_any_quota")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex justify-between">
                <div className="flex space-x-2">
                  {/* Conditional buttons based on status */}
                  {selectedInquiry.status === "enrolled" ? null : selectedInquiry.status === "rejected" ? (
                    <Button
                      onClick={() => {
                        handleMarkEligible(selectedInquiry.id)
                        setSelectedInquiry(null)
                      }}
                      disabled={isUpdating}
                    >
                      {t("reconsider_application")}
                    </Button>
                  ) : selectedInquiry.status === "approved" ? (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedInquiry(null)
                        handleReject(selectedInquiry.id)
                      }}
                      disabled={isUpdating}
                    >
                      {t("reject_application")}
                    </Button>
                  ) : selectedInquiry.status === "eligible" ? (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedInquiry(null)
                          handleReject(selectedInquiry.id)
                        }}
                        disabled={isUpdating}
                      >
                        {t("reject_application")}
                      </Button>
                      <Button
                        onClick={() => {
                          handleStatusChange(selectedInquiry.id, "approved")
                          setSelectedInquiry(null)
                        }}
                        disabled={isUpdating}
                      >
                        {t("approve")}
                      </Button>
                    </>
                  ) : selectedInquiry.status === "ineligible" ? (
                    <Button
                      onClick={() => {
                        handleMarkEligible(selectedInquiry.id)
                        setSelectedInquiry(null)
                      }}
                      disabled={isUpdating}
                    >
                      {t("reconsider_application")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedInquiry(null)
                          handleReject(selectedInquiry.id)
                        }}
                        disabled={isUpdating}
                      >
                        {t("reject_application")}
                      </Button>
                      <Button
                        onClick={() => {
                          handleMarkEligible(selectedInquiry.id)
                          setSelectedInquiry(null)
                        }}
                        disabled={isUpdating}
                      >
                        {t("mark_eligible")}
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirm_rejection")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("are_you_sure_you_want_to_reject_this_application_this_action_cannot_be_undone")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReject} className="bg-red-600 hover:bg-red-700">
                {t("reject")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mark Eligible Confirmation Dialog */}
        <AlertDialog open={eligibleDialogOpen} onOpenChange={setEligibleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirm_eligibility")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("are_you_sure_you_want_to_mark_this_application_as_eligible")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMarkEligible}>{t("mark_eligible")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Student Onboarding Form Dialog */}
        {showStudentForm && currentInquiryForOnboarding && (
          <Dialog open={showStudentForm} onOpenChange={setShowStudentForm}>
            <DialogContent className="max-w-4xl h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{t("onboard_student")}</DialogTitle>
                <DialogDescription>{t("complete_the_student_details_to_enroll_them_in_the_school")}</DialogDescription>
              </DialogHeader>
              <OnboardingForm
                onClose={() => {
                  setShowStudentForm(false)
                  setCurrentInquiryForOnboarding(null)
                }}
                academic_session_id={currentInquiryForOnboarding.academic_session_id!}
                inquiry_id={currentInquiryForOnboarding.id}
                initial_data={
                  transformInquiryToStudent(currentInquiryForOnboarding, authState.user!.school_id) as Student
                }
                onSubmitSuccess={(student: any) => {
                  GetInquiries({
                    page: inquiriesData?.meta.currentPage,
                    academic_session_id: selectedAcademicYear!,
                  })
                  setShowStudentForm(false)
                  setCurrentInquiryForOnboarding(null)
                  // Show the hostel allotment modal right after successful onboarding
                  setNewStudentData(student)
                  setShowHostelModal(true)
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Hostel Allotment Modal */}
        {showHostelModal && newStudentData && (
          <HostelAllotmentModal
            isOpen={showHostelModal}
            onClose={() => setShowHostelModal(false)}
            studentId={newStudentData.id || (newStudentData as any).student?.id}
            schoolId={authState.user!.school_id}
            studentGender={newStudentData.gender || (newStudentData as any).student?.gender}
            onSuccess={() => setShowHostelModal(false)}
          />
        )}

        {/* Edit Inquiry Dialog */}
        {inquiryToEdit && (
          <Dialog open={editInquiryDialogOpen} onOpenChange={setEditInquiryDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t("edit_inquiry")}</DialogTitle>
                <DialogDescription>{t("update_inquiry_details")}</DialogDescription>
              </DialogHeader>
              <AdmissionInquiryForm
                isEditing={true}
                initialData={{
                  id: inquiryToEdit.id,
                  first_name: inquiryToEdit.first_name,
                  middle_name: inquiryToEdit.middle_name || null,
                  last_name: inquiryToEdit.last_name,
                  birth_date: inquiryToEdit.birth_date,
                  gender: inquiryToEdit.gender,
                  inquiry_for_class: inquiryToEdit.inquiry_for_class,
                  father_name: inquiryToEdit.father_name,
                  primary_mobile: inquiryToEdit.primary_mobile,
                  parent_email: inquiryToEdit.parent_email || null,
                  address: inquiryToEdit.address,
                  previous_school: inquiryToEdit.previous_school || null,
                  previous_class: inquiryToEdit.previous_class || null,
                  previous_percentage: inquiryToEdit.previous_percentage || null,
                  previous_year: inquiryToEdit.previous_year || null,
                  special_achievements: inquiryToEdit.special_achievements || null,
                  applying_for_quota: inquiryToEdit.applying_for_quota,
                  quota_type: inquiryToEdit.quota_type || null,
                  academic_session_id: inquiryToEdit.academic_session_id,
                }}
                academicSessionId={inquiryToEdit.academic_session_id}
                inquiryId={inquiryToEdit.id}
                onSuccess={() => {
                  setEditInquiryDialogOpen(false)
                  setInquiryToEdit(null)
                  GetInquiries({
                    page: inquiriesData?.meta.currentPage,
                    academic_session_id: selectedAcademicYear!,
                  })
                  toast({
                    title: "Inquiry Updated",
                    description: "The inquiry has been updated successfully.",
                  })
                }}
                onCancel={() => {
                  setEditInquiryDialogOpen(false)
                  setInquiryToEdit(null)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
