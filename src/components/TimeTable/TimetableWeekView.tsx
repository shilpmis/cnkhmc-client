import { useEffect, useState, useMemo, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Dumbbell, Coffee, Beaker, Clock, Presentation, Edit, ClipboardList } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetSubjectsForDivisionQuery } from "@/services/subjects"
import { useLazyGetTeachingStaffQuery } from "@/services/StaffService"
import type { SubjectDivisionMaster } from "@/types/subjects"
import type { StaffType } from "@/types/staff"
import LogLectureDialog from "@/components/TimeTable/LogLectureDialog"
import EditPeriodDialog from "@/components/TimeTable/EditPeriodDialog"
import { TimeTableConfigForSchool, PeriodsConfig } from "@/types/subjects"

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
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [periodToEdit, setPeriodToEdit] = useState<PeriodsConfig | null>(null)

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

  // Extract unique time slots across the week for column headers
  const uniqueTimeSlots = useMemo(() => {
    const slots = new Map<string, { start: string, end: string, isBreak: boolean }>()
    if (timetableConfig?.class_day_config) {
      timetableConfig.class_day_config.forEach(dayConfig => {
        dayConfig.period_config?.filter(p => p.division_id === divisionId).forEach(p => {
          const key = `${p.start_time}-${p.end_time}`
          if (!slots.has(key)) {
            slots.set(key, { start: p.start_time, end: p.end_time, isBreak: p.is_break })
          }
        })
      })
    }
    return Array.from(slots.values()).sort((a, b) => a.start.localeCompare(b.start))
  }, [timetableConfig, divisionId])

  // Format time (e.g., "09:30" to "9:30 AM")
  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "pm" : "am"
    const formattedHour = hour % 12 || 12
    return `${formattedHour.toString().padStart(2, '0')}.${minutes}${ampm}`
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

  // Get teacher short name for grid display
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

  // Generate period headers
  const periodHeaders = uniqueTimeSlots.map((slot, i) => (
    <th key={i} className="border p-2 bg-muted font-medium text-center min-w-[150px]">
      <div className="flex flex-col items-center justify-center text-xs">
        <span>{formatTime(slot.start)} to</span>
        <span>{formatTime(slot.end)}</span>
      </div>
    </th>
  ))

  // Determine if a column is a lecture or non-lecture
  const isNonLectureSlot = (slot: { start: string, end: string }, dayKey: string) => {
    let nonLecture = false;
    const dayConfig = timetableConfig?.class_day_config?.find((config) => config.day === dayKey)
    if (!dayConfig) return false;
    const allPeriods = dayConfig.period_config?.filter((p) => p.division_id === divisionId) || []
    
    allPeriods.filter(p => p.start_time <= slot.start && p.end_time >= slot.end).forEach(p => {
      if (p.batch_name || p.lab_id) {
        nonLecture = true;
      }
    })
    return nonLecture;
  }

  // Class category row
  const renderClassCategoryRow = (dayKey: string, dayIndex: number) => (
    <tr key={`${dayKey}-category`}>
      <th className="border p-2 bg-muted font-medium text-left">{t("class")}</th>
      {uniqueTimeSlots.map((slot, i) => {
        if (slot.isBreak) {
          if (dayIndex === 0) {
            const letters = ["R", "E", "C", "E", "S", "S"];
            return (
              <td key={`${dayKey}-${i}-break`} rowSpan={validDays.length * 2} className="border p-2 text-center align-middle bg-gray-50 min-w-[50px] z-0 relative">
                <div className="flex flex-col items-center justify-center h-full space-y-2 font-bold text-gray-500 tracking-widest">
                  {letters.map((l, idx) => <span key={idx}>{l}</span>)}
                </div>
              </td>
            )
          }
          return null;
        }
        const nonLecture = isNonLectureSlot(slot, dayKey)
        return (
          <th key={i} className="border p-2 font-medium text-center bg-gray-50 text-xs">
            {nonLecture ? t("non_lecture") : t("lecture")}
          </th>
        )
      })}
    </tr>
  )

  const validDays = days.filter(day => {
    const dayConfig = timetableConfig?.class_day_config?.find((config) => config.day === day.value)
    return !!dayConfig
  })

  // Generate table rows for each day
  const dayRows = validDays.map((day, dayIndex) => {
    const dayConfig = timetableConfig?.class_day_config?.find((config) => config.day === day.value)
    if (!dayConfig) return null

    const allPeriods = dayConfig.period_config?.filter((p) => p.division_id === divisionId) || []

    const slotSpans = new Array(uniqueTimeSlots.length).fill(1);
    const skipSlots = new Set<number>();

    for (let i = 0; i < uniqueTimeSlots.length; i++) {
      if (skipSlots.has(i)) continue;
      if (uniqueTimeSlots[i].isBreak) continue;

      const periodsAtI = allPeriods.filter(p => p.start_time === uniqueTimeSlots[i].start && p.end_time === uniqueTimeSlots[i].end).sort((a, b) => (a.batch_name || "").localeCompare(b.batch_name || ""));
      if (periodsAtI.length === 0) continue;

      let span = 1;
      for (let j = i + 1; j < uniqueTimeSlots.length; j++) {
        if (uniqueTimeSlots[j].isBreak) break;

        const periodsAtJ = allPeriods.filter(p => p.start_time === uniqueTimeSlots[j].start && p.end_time === uniqueTimeSlots[j].end).sort((a, b) => (a.batch_name || "").localeCompare(b.batch_name || ""));
        if (periodsAtI.length !== periodsAtJ.length) break;
        if (periodsAtJ.length === 0) break;

        let allMatch = true;
        for (let k = 0; k < periodsAtI.length; k++) {
           const p1 = periodsAtI[k];
           const p2 = periodsAtJ[k];
           if (
               p1.subjects_division_masters_id !== p2.subjects_division_masters_id ||
               p1.staff_enrollment_id !== p2.staff_enrollment_id ||
               p1.lab_id !== p2.lab_id ||
               p1.is_pt !== p2.is_pt ||
               p1.is_free_period !== p2.is_free_period ||
               p1.is_library !== p2.is_library ||
               p1.is_seminar !== p2.is_seminar ||
               p1.batch_name !== p2.batch_name
           ) {
              allMatch = false;
              break;
           }
        }

        if (allMatch) {
          span++;
          skipSlots.add(j);
        } else {
          break;
        }
      }
      slotSpans[i] = span;
    }

    return (
      <Fragment key={day.value}>
        {renderClassCategoryRow(day.value, dayIndex)}
        <tr key={`${day.value}-row`}>
          <th className="border p-2 bg-muted font-medium text-left">{day.label}</th>
          {uniqueTimeSlots.map((slot, slotIndex) => {
            
            // Recess handling with rowSpan across all valid days
          if (slot.isBreak) {
            return null;
          }

          // Normal period rendering
          if (skipSlots.has(slotIndex)) return null;

          const periods = allPeriods.filter((p) => p.start_time === slot.start && p.end_time === slot.end)

          if (periods.length === 0) return <td key={`${day.value}-${slotIndex}`} className="border p-1.5 text-center text-muted-foreground text-sm"></td>
          
          const span = slotSpans[slotIndex];

          return (
            <td key={`${day.value}-${slotIndex}`} colSpan={span} className="border p-0 align-top">
              <div className="flex flex-col h-full w-full">
                {periods.map((period, index) => (
                  <div key={index} className={`group relative flex flex-col flex-1 p-2 ${index < periods.length - 1 ? 'border-b' : ''} hover:bg-slate-50/80 transition-colors`}>
                    
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      {!!period.batch_name ? (
                        <span className="font-semibold text-[11px] text-blue-700 bg-blue-50 px-1 rounded">
                          {period.batch_name}
                        </span>
                      ) : <span />}

                      {/* Quick Edit Icon */}
                      <button
                        type="button"
                        onClick={() => {
                          setPeriodToEdit(period)
                          setIsEditDialogOpen(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-black/5"
                        title={t("edit_period") || "Edit Period"}
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-0.5 items-center text-center">
                      {period.is_library && (
                        <Badge variant="outline" className="text-[10px] bg-sky-100 text-sky-800 border-sky-300 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {t("library") || "Library"}
                        </Badge>
                      )}

                      {period.is_seminar && (
                        <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1">
                          <Presentation className="h-3 w-3" /> {t("seminar") || "Seminar"}
                        </Badge>
                      )}

                      {period.is_free_period && (
                        <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-800">
                          {t("free") || "Free"}
                        </Badge>
                      )}

                      {period.subjects_division_masters_id && !period.is_free_period && !period.is_library && !period.is_seminar && (
                        <span className="text-[11px] font-medium leading-tight text-center">
                          {getSubjectName(period)}
                        </span>
                      )}
                      
                      {period.staff_enrollment_id && !period.is_free_period && !period.is_library && !period.is_seminar && (
                        <span className="text-[10px] text-muted-foreground" title={getTeacherFullName(period)}>
                          Dr. {getTeacherName(period)}
                        </span>
                      )}
                      
                      {period.lab_id && (
                        <span className="text-[10px] text-muted-foreground">
                          {timetableConfig.lab_config.find((lab) => lab.id === period.lab_id)?.name}
                        </span>
                      )}
                      
                      <div className="flex items-center justify-center gap-2 mt-1 w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodToEdit(period);
                            setIsEditDialogOpen(true);
                          }}
                          className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center justify-center font-medium"
                        >
                          <Edit className="h-2.5 w-2.5 mr-0.5" />
                          {t("edit") || "Edit"}
                        </button>

                        {!period.is_free_period && !period.is_library && !period.is_seminar && period.subjects_division_masters_id && (
                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setIsLogDialogOpen(true);
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center justify-center font-medium"
                          >
                            <ClipboardList className="h-2.5 w-2.5 mr-0.5" />
                            {t("log") || "Log"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </td>
            )
          })}
        </tr>
      </Fragment>
    )
  }).filter(Boolean)

  if (validDays.length === 0 || uniqueTimeSlots.length === 0) {
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
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse table-fixed min-w-[800px] text-sm">
          <thead>
            <tr>
              <th className="border p-2 bg-muted font-medium text-left w-24">{t("time_day")}</th>
              {periodHeaders}
            </tr>
          </thead>
          <tbody>{dayRows}</tbody>
        </table>
      </div>

      <EditPeriodDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        period={periodToEdit}
        timetableConfig={timetableConfig}
        subjects={subjects}
        staff={staff}
      />

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
