"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Dumbbell, Coffee, Beaker, Clock } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetSubjectsForDivisionQuery } from "@/services/subjects"
import { useLazyGetTeachingStaffQuery } from "@/services/StaffService"
import type { SubjectDivisionMaster } from "@/types/subjects"
import type { StaffType } from "@/types/staff"
import LogLectureDialog from "@/components/TimeTable/LogLectureDialog"
import { ClipboardList } from "lucide-react"

interface TimetableWeekViewProps {
  timetableConfig: TimeTableConfigForSchool
  divisionId: number
  days: { value: string; label: string }[]
}

export default function TimetableWeekView({ timetableConfig, divisionId, days }: TimetableWeekViewProps) {
  const { t } = useTranslation()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const [getSubjectsForDivision, { data: subjectsData }] = useLazyGetSubjectsForDivisionQuery()
  const [getTeachingStaff, { data: staffData }] = useLazyGetTeachingStaffQuery()
  const [subjects, setSubjects] = useState<SubjectDivisionMaster[]>([])
  const [staff, setStaff] = useState<StaffType[]>([])
  const [maxPeriods, setMaxPeriods] = useState<number>(0)
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null)

  // Load subjects and staff data
  useEffect(() => {
    if (currentAcademicSession && divisionId) {
      getSubjectsForDivision({
        academic_session_id: currentAcademicSession.id,
        division_id: divisionId,
      })

      getTeachingStaff({
        academic_sessions: currentAcademicSession.id,
      })
    }
  }, [currentAcademicSession, divisionId, getSubjectsForDivision, getTeachingStaff])

  // Set subjects and staff when data is loaded
  useEffect(() => {
    if (subjectsData) {
      setSubjects(subjectsData)
    }
    if (staffData) {
      setStaff(staffData.data || [])
    }
  }, [subjectsData, staffData])

  // Calculate max periods across all days
  useEffect(() => {
    if (timetableConfig?.class_day_config) {
      let max = 0
      timetableConfig.class_day_config.forEach((dayConfig) => {
        if (dayConfig.period_config) {
          const dayPeriods = dayConfig.period_config.filter((p) => p.division_id === divisionId)
          max = Math.max(max, dayPeriods.length)
        }
      })
      setMaxPeriods(max)
    }
  }, [timetableConfig, divisionId])

  // Format time (e.g., "09:30" to "9:30 AM")
  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  // Get subject name
  const getSubjectName = (period: PeriodsConfig) => {
    if (!period.subjects_division_masters_id) return t("no_subject")

    const subject = subjects.find((s) => s.id === period.subjects_division_masters_id)
    return subject ? subject.subject?.name || t("unknown_subject") : t("unknown_subject")
  }

  // Get subject code
  const getSubjectCode = (period: PeriodsConfig) => {
    if (!period.subjects_division_masters_id) return ""

    const subject = subjects.find((s) => s.id === period.subjects_division_masters_id)
    return subject ? subject.code_for_division || subject.subject?.code || "" : ""
  }

  // Get teacher short name for grid display (e.g. "Raj P.")
  const getTeacherName = (period: PeriodsConfig) => {
    if (!period.staff_enrollment_id) return ""

    const teacher = staff.find((s) => s.staff_enrollment_id === period.staff_enrollment_id)
    if (!teacher) return ""

    const firstName = teacher.first_name || ""
    const lastInitial = teacher.last_name ? teacher.last_name.charAt(0).toUpperCase() + "." : ""
    return lastInitial ? `${firstName} ${lastInitial}` : firstName
  }

  // Get teacher full name for tooltip
  const getTeacherFullName = (period: PeriodsConfig) => {
    if (!period.staff_enrollment_id) return ""
    const teacher = staff.find((s) => s.staff_enrollment_id === period.staff_enrollment_id)
    if (!teacher) return ""
    return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim()
  }

  // Get period icon
  const getPeriodIcon = (period: PeriodsConfig) => {
    if (period.is_break) {
      return <Coffee className="h-4 w-4 text-amber-600" />
    } else if (period.is_pt) {
      return <Dumbbell className="h-4 w-4 text-purple-600" />
    } else if (period.lab_id) {
      return <Beaker className="h-4 w-4 text-blue-600" />
    } else if (period.is_free_period) {
      return <Clock className="h-4 w-4 text-gray-600" />
    }
    return <BookOpen className="h-4 w-4 text-green-600" />
  }

  // Get period background color
  const getPeriodBgColor = (period: PeriodsConfig) => {
    if (period.is_break) return "bg-amber-50"
    if (period.is_pt) return "bg-purple-50"
    if (period.lab_id) return "bg-blue-50"
    if (period.is_free_period) return "bg-gray-50"
    return "bg-green-50"
  }

  // Get periods for a specific day
  const getPeriodsForDay = (dayValue: string) => {
    const dayConfig = timetableConfig?.class_day_config?.find((config) => config.day === dayValue)
    if (!dayConfig || !dayConfig.period_config) return []

    const periods = dayConfig.period_config.filter((p) => p.division_id === divisionId)
    return [...periods].sort((a, b) => a.period_order - b.period_order)
  }

  // Get period cell for a specific day and period order
  const getPeriodCell = (dayValue: string, periodOrder: number) => {
    const periods = getPeriodsForDay(dayValue)
    const period = periods.find((p) => p.period_order === periodOrder)

    if (!period) return <td key={`${dayValue}-${periodOrder}`} className="border p-2 text-center text-muted-foreground text-sm">-</td>

    return (
      <td key={`${dayValue}-${periodOrder}`} className={`border p-2 ${getPeriodBgColor(period)}`}>
        <div className="flex flex-col h-full min-h-[80px]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              {getPeriodIcon(period)}
              <span className="text-xs font-medium">
                {formatTime(period.start_time)} - {formatTime(period.end_time)}
              </span>
            </div>
            {period.is_break && (
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                {t("break")}
              </Badge>
            )}
            {period.is_pt && (
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                {t("pt")}
              </Badge>
            )}
            {period.is_free_period && (
              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                {t("free")}
              </Badge>
            )}
          </div>

          {!period.is_break && (
            <>
              {period.subjects_division_masters_id && !period.is_free_period && (
                <div className="text-sm font-medium">
                  {getSubjectName(period)}
                  {getSubjectCode(period) && (
                    <span className="text-xs text-muted-foreground ml-1">({getSubjectCode(period)})</span>
                  )}
                </div>
              )}

              {period.staff_enrollment_id && !period.is_free_period && (
                <div className="flex items-center space-x-1 mt-1" title={getTeacherFullName(period)}>
                  <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{getTeacherName(period)}</span>
                </div>
              )}

              {period.lab_id && (
                <div className="flex items-center space-x-1 mt-1">
                  <Beaker className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {timetableConfig.lab_config.find((lab) => lab.id === period.lab_id)?.name || t("unknown_lab")}
                  </span>
                </div>
              )}
              
              {!period.is_free_period && period.subjects_division_masters_id && (
                <button 
                  onClick={() => {
                    setSelectedPeriod(period);
                    setIsLogDialogOpen(true);
                  }}
                  className="mt-2 text-[10px] text-blue-600 hover:text-blue-700 flex items-center font-medium"
                >
                  <ClipboardList className="h-3 w-3 mr-1" />
                  {t("log")}
                </button>
              )}
            </>
          )}
        </div>
      </td>
    )
  }

  // Generate period headers (Period 1, Period 2, etc.)
  const periodHeaders = Array.from({ length: maxPeriods }, (_, i) => (
    <th key={i} className="border p-2 bg-muted font-medium text-center">
      {t("period")} {i + 1}
    </th>
  ))

  // Generate table rows for each day
  const dayRows = days
    .map((day) => {
      const dayConfig = timetableConfig?.class_day_config?.find((config) => config.day === day.value)
      if (!dayConfig) return null

      return (
        <tr key={day.value}>
          <th className="border p-2 bg-muted font-medium text-left">{day.label}</th>
          {Array.from({ length: maxPeriods }, (_, i) => getPeriodCell(day.value, i + 1))}
        </tr>
      )
    })
    .filter(Boolean)

  if (dayRows.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{t("no_timetable_data_available")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-muted font-medium text-left">{t("day")}</th>
              {periodHeaders}
            </tr>
          </thead>
          <tbody>{dayRows}</tbody>
        </table>
      </div>

      <LogLectureDialog 
        isOpen={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
        period={selectedPeriod}
        subjectId={selectedPeriod ? subjects.find(s => s.id === selectedPeriod.subjects_division_masters_id)?.subject_id : undefined}
        subjectName={selectedPeriod ? subjects.find(s => s.id === selectedPeriod.subjects_division_masters_id)?.subject?.name : undefined}
      />
    </div>
  )
}
