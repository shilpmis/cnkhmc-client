"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useLazyFetchSingleStudentDataInDetailQuery, useLazyFetchSingleStundetQuery } from "@/services/StudentServices"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import StudentProfileView from "@/components/Students/StudentProfileView"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { StudentEnrollment } from "@/types/student"
import { useTranslation } from "@/redux/hooks/useTranslation"

export default function StudentProfilePage() {
  const {t} = useTranslation()
  const params = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState<StudentEnrollment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use RTK Query hook for fetching student details
  const [fetchStudentDetails, { isLoading: isFetching }] = useLazyFetchSingleStudentDataInDetailQuery();
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  useEffect(() => {
    const fetchStudent = async () => {
      if (!params.id) return

      setIsLoading(true)
      try {
        // Fetch detailed student information by ID
        const response = await fetchStudentDetails({
          student_id: Number(params.id),
          academic_session_id: CurrentAcademicSessionForSchool!.id,
        }).unwrap()

        if (response) {
          setStudent(response)
        } else {
          setError("Student not found")
        }
      } catch (err) {
        console.error("Error fetching student details:", err)
        setError("Failed to load student details. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudent()
  }, [params.id, fetchStudentDetails])

  const handleBack = () => {
    navigate(-1)
  }

  if (isLoading || isFetching) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-screen">
        <div className="space-y-4 text-center">
          <div className="h-16 w-16 mx-auto bg-muted/50 animate-pulse rounded-full"></div>
          <p>{t("loading_student_profile")}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <div className="p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleBack} className="mt-4">
            {t("return_to_search")}
          </Button>
        </div>
      </div>
    )
  }

  return student ? <StudentProfileView student={student} onBack={handleBack} showToolBar={true} /> : null
}

