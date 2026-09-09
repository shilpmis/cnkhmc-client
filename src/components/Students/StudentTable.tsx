

"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Edit, FileText, UserRound, X, ChevronUp, ChevronDown, ChevronsUpDown, Download, School } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SaralPagination } from "../ui/common/SaralPagination"
import type { PageDetailsForStudents, Student, StudentEnrollment } from "@/types/student"
import type { Division } from "@/types/academic"
import { useTranslation } from "@/redux/hooks/useTranslation"
import HostelAllotmentModal from "./HostelAllotmentModal"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAuthState, selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
import { useLazyFetchSingleStudentDataInDetailQuery } from "@/services/StudentServices"
import StudentProfileView from "./StudentProfileView"
import { CertificateDialog } from "./CertificateDialog"


interface StudentTableProps {
  filteredStudents: Student[]
  selectd_academic_session: number
  onEdit: (student_id: number) => void
  onDelete?: (studentId: string) => void
  selectedClass: string
  selectedDivision: Division | null
  onPageChange: (page: number) => Promise<void>
  PageDetailsForStudents: PageDetailsForStudents | null
}

export default function StudentTable({
  filteredStudents,
  selectd_academic_session,
  onEdit,
  onDelete,
  PageDetailsForStudents,
  onPageChange
}: StudentTableProps) {

  const currentUse = useAppSelector(selectCurrentUser);

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollment | null>(null)
  const { t } = useTranslation();
  const [fetchStudentDetails, { isLoading: isFetchingStundeInformation }] = useLazyFetchSingleStudentDataInDetailQuery();
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Add these state variables after existing useState declarations
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [pdfKey, setPdfKey] = useState(Date.now())
  
  const [certDialogOpen, setCertDialogOpen] = useState(false)
  const [certStudentId, setCertStudentId] = useState<number | null>(null)
  
  const [showHostelModal, setShowHostelModal] = useState(false)
  const [selectedStudentForHostel, setSelectedStudentForHostel] = useState<Student | null>(null)

  const authState = useAppSelector(selectAuthState)
  const schoolId = authState.user?.school_id || 0

  const isCollege = authState.user?.school?.school_type === 'COLLEGE'

  // Add sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Add sorted data memo
  const sortedStudents = useMemo(() => {
    if (!sortField) return filteredStudents

    return [...filteredStudents].sort((a, b) => {
      let aValue: any = a[sortField as keyof Student]
      let bValue: any = b[sortField as keyof Student]

      // Handle null/undefined values
      if (aValue == null) aValue = ''
      if (bValue == null) bValue = ''

      // Convert to string for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredStudents, sortField, sortDirection])

  // Add sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1 text-primary" /> :
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
  }

  const perPageData = PageDetailsForStudents?.per_page || 6

  const paginatedData = (page: number): Student[] => {
    const startIndex = (page - 1) * perPageData
    return sortedStudents.slice(startIndex, startIndex + perPageData)
  }

  const [dialogOpen, setDialogOpen] = useState(false)

  // Function to handle student name click
  const handleStudentClick = async (student_id: number) => {
    try {
      const response = await fetchStudentDetails({
        student_id: Number(student_id),
        academic_session_id: selectd_academic_session
      }).unwrap()
      setSelectedStudent(response)
    } catch (error) {
      console.error("Error fetching student details:", error)
    }
    setDialogOpen(true)
  }

  const StudentDetailsPDF = dynamic(() => import("./StudentPdf"), {
    ssr: false,
    loading: () => <p>Loading PDF generator...</p>,
  })

  const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), {
    ssr: false,
  })

  const handlePageChange = async (page: number) => {
    await onPageChange(page)
  }

  const handleEdit = (student: Student) => {
    onEdit(student.id)
  }

  if (!PageDetailsForStudents) {
    return <div className="text-center py-4 text-gray-500">Loading...</div>
  }

  const handleDelete = (studentId: string) => {
    if (onDelete) {
      onDelete(studentId)
    }
  }

  return (
    <div className="p-1">
      {paginatedData(currentPage).length === 0 ? (
        <div className="text-center py-4 text-gray-500">{t("no_records_found")}</div>
      ) : (
        <>

          <Table>
            <TableHeader>
              <TableRow>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('gr_no')}
                >
                  <div className="flex items-center">
                    {t("gr_no")}
                    <SortIcon field="gr_no" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center">
                    {t("name")}
                    <SortIcon field="first_name" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('roll_number')}
                >
                  <div className="flex items-center">
                    {t("roll_no")}
                    <SortIcon field="roll_number" />
                  </div>
                </TableHead>
                <TableHead>{t("gender")}</TableHead>
                <TableHead>{t("father_name")}</TableHead>
                <TableHead>{t("contact_number")}</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('aadhar_no')}
                >
                  <div className="flex items-center">
                    {t("aadhar_no")}
                    <SortIcon field="aadhar_no" />
                  </div>
                </TableHead>
                {isCollege && (
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('practical_batch')}
                  >
                    <div className="flex items-center">
                      {t("practical_batch") || "Practical Batch"}
                      <SortIcon field="practical_batch" />
                    </div>
                  </TableHead>
                )}
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData(currentPage).map((student, index) => (
                <TableRow key={index}>

                  <TableCell>{student.gr_no}</TableCell>
                  <TableCell>
                    <button
                      className="text-blue-600 hover:underline focus:outline-none"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      {student.first_name} {student.middle_name} {student.last_name}
                    </button>
                  </TableCell>
                  <TableCell>{student.fourth_year_roll_number || student.third_year_roll_number || student.second_year_roll_number || student.first_year_roll_number}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>{student.father_name}</TableCell>
                  <TableCell>{student.primary_mobile}</TableCell>
                  <TableCell>{student.aadhar_no}</TableCell>
                  {isCollege && (
                    <TableCell>{student.practical_batch || "None"}</TableCell>
                  )}
                  <TableCell>
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(student)}>
                      <Edit className="h-4 w-4 mr-1" /> {t("edit")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setCertStudentId(student.id)
                      setCertDialogOpen(true)
                    }}>
                      <FileText className="h-4 w-4 mr-1" /> Cert
                    </Button>
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => {
                      setSelectedStudentForHostel(student)
                      setShowHostelModal(true)
                    }}>
                      <School className="h-4 w-4 mr-1" /> Hostel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen} >
            <DialogContent className="max-w-4xl p-0 h-[80vh] md:h-[90vh] w-[100vw] md:w-[90vw] overflow-auto">
              <div className="flex justify-between items-center p-4 md:p-6 sticky top-0 bg-background z-10 border-b">
                <DialogTitle className="text-xl md:text-2xl font-bold">{t("student_details")}</DialogTitle>
                <div className="flex items-center gap-2">
                  {selectedStudent && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {typeof window !== "undefined" && (
                              // <PDFDownloadLink
                              //   document={<StudentDetailsPDF student={selectedStudent} currentUser={currentUse} />}
                              //   fileName={`${selectedStudent.student.first_name}_${selectedStudent.student.last_name}_details.pdf`}
                              // >
                              //   {({ blob, url, loading, error }: { blob: Blob | null; url: string | null; loading: boolean; error: Error | null }) => (
                              //     <Button
                              //       variant="outline"
                              //       size="icon"
                              //       disabled={loading}
                              //       aria-label="Download PDF"
                              //     >
                              //       <FileText className="h-4 w-4" />
                              //     </Button>
                              //   )}
                              // </PDFDownloadLink>
                              // <PDFDownloadLink
                              //   key={pdfKey}
                              //   document={<StudentDetailsPDF student={selectedStudent} currentUser={null} />}
                              //   fileName={`${selectedStudent.student.first_name}_${selectedStudent.student.last_name}_details.pdf`}
                              // >
                              //   {({ blob, url, loading, error }: { blob: Blob | null; url: string | null; loading: boolean; error: Error | null }) => (
                              //     <Button
                              //       variant="outline"
                              //       size="icon"
                              //       disabled={loading}
                              //       aria-label="Download PDF"
                              //       className="flex items-center gap-1"
                              //       onClick={() => setTimeout(() => setPdfKey(Date.now()), 500)}
                              //     >

                              //       <Download className="h-4 w-4 ml-1" />
                              //     </Button>
                              //   )}
                              // </PDFDownloadLink>
                              <></>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)} aria-label="Close">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 md:p-6">
                {isFetchingStundeInformation && (
                  <div className="flex items-center justify-center h-screen">
                    <div className="h-16 w-16 mx-auto bg-muted/50 animate-pulse rounded-full"></div>
                  </div>
                )}
                {
                  selectedStudent && (
                    <StudentProfileView student={selectedStudent} showToolBar={false} />
                  )
                }
              </div>
            </DialogContent>
          </Dialog>

          <CertificateDialog 
            open={certDialogOpen} 
            onOpenChange={setCertDialogOpen} 
            studentId={certStudentId} 
          />

      {showHostelModal && selectedStudentForHostel && (
        <HostelAllotmentModal
          isOpen={showHostelModal}
          onClose={() => {
            setShowHostelModal(false)
            setSelectedStudentForHostel(null)
          }}
          studentId={selectedStudentForHostel.id}
          schoolId={schoolId}
          studentGender={selectedStudentForHostel.gender}
        />
      )}
    </>


      )}
      <div className="w-full flex text-right p-1 mt-3">
        <SaralPagination
          currentPage={PageDetailsForStudents.current_page}
          onPageChange={handlePageChange}
          totalPages={PageDetailsForStudents!.last_page}
        />
      </div>
    </div>
  )
}