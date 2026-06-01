"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import TeacherClassSelection from "@/components/Attendance/TeacherClassSelection"
import StudentAttendanceView from "@/components/Attendance/StudentAttendanceView"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import { selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import type { Division } from "@/types/academic"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const AttendancePage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user)
  const allAcademicClasses = useAppSelector(selectAllAcademicClasses)
  const [getAcademicClasses, { isLoading: isLoadingClasses, error: classesError }] = useLazyGetAcademicClassesQuery()

  const [allocatedClasses, setAllocatedClasses] = useState<Division[] | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const params = useParams<{ classId: string }>()

  useEffect(() => {
    if (params.classId) {
      setSelectedClass(params.classId)
    }
  }, [params.classId])

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!allAcademicClasses && user?.school_id) {
          await getAcademicClasses(user.school_id)
        }
      } catch (err) {
        setError("Failed to fetch academic classes. Please try again later.")
      }
    }

    fetchClasses()
  }, [allAcademicClasses, getAcademicClasses, user])

  useEffect(() => {
    if (allAcademicClasses) {
      if (user?.staff?.assigend_classes && user.staff.assigend_classes.length > 0) {
        const allocatedClass = user.staff.assigend_classes.map((cls) => cls.class)
        setAllocatedClasses(allocatedClass)
      } else {
        setAllocatedClasses([])
        setError("No classes have been assigned to you. Please contact your administrator.")
      }
    }
  }, [allAcademicClasses, user])

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoadingClasses || !allocatedClasses) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading classes...</p>
      </div>
    )
  }

  if (!selectedClass && allocatedClasses) {
    return <TeacherClassSelection classes={allocatedClasses} />
  }

  if (selectedClass) {
    return <StudentAttendanceView classId={selectedClass} />
  }

  return null
}

export default AttendancePage