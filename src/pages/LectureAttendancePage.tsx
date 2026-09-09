import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/redux/hooks/useAuth"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetMySubjectsQuery } from "@/services/LectureAttendanceService"
import SubjectSelection from "@/components/Attendance/SubjectSelection"
import LectureAttendanceMarkingView from "@/components/Attendance/LectureAttendanceMarkingView"
import LectureAttendanceDashboard from "@/components/Attendance/LectureAttendanceDashboard"
import type { AssignedSubject } from "@/types/lectureAttendance"
import { UserRole } from "@/types/user"

const LectureAttendancePage: React.FC = () => {
  const { user, hasAnyRole } = useAuth()
  const academicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const academicYear = academicSession?.id ?? academicSession?.start_year ?? 1

  // Teachers (role_id === 5 or UserRole.SCHOOL_TEACHER or UserRole.HEAD_TEACHER)
  const isTeacher = hasAnyRole([UserRole.SCHOOL_TEACHER, UserRole.HEAD_TEACHER]) || Number(user?.role_id) === 5

  const [fetchSubjects, { data: subjectsData, isLoading }] = useLazyGetMySubjectsQuery()
  const [selectedSubject, setSelectedSubject] = useState<AssignedSubject | null>(null)

  useEffect(() => {
    if (isTeacher && academicYear) {
      fetchSubjects({ academic_session: academicYear })
    }
  }, [isTeacher, academicYear, fetchSubjects])

  if (!isTeacher) {
    // Admin / Principal / Super Admin view
    return <LectureAttendanceDashboard academicYear={academicYear} />
  }

  // Teacher view: Step 1 = Subject Selection, Step 2 = Marking & Details View
  if (selectedSubject) {
    return (
      <LectureAttendanceMarkingView
        assignedSubject={selectedSubject}
        academicYear={academicYear}
        userId={user?.staff_id ?? user?.id ?? 0}
        onBack={() => setSelectedSubject(null)}
      />
    )
  }

  return (
    <SubjectSelection
      subjects={subjectsData?.data ?? []}
      isLoading={isLoading}
      onSelect={(sub) => setSelectedSubject(sub)}
    />
  )
}

export default LectureAttendancePage
