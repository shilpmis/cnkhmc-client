import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Save, Loader2, BookOpen, Users, Beaker, Dumbbell, Coffee, Clock, RotateCcw, Plus } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazyGetSubjectsForDivisionQuery, useAssignSubjectToDivisionMutation, useLazyGetAllSubjectsQuery } from "@/services/subjects"
import { useLazyGetTeachingStaffQuery } from "@/services/StaffService"
import { useUpdateWeekWiseTimeTableForDivisionMutation } from "@/services/timetableService"
import { parseBackendError } from "@/lib/errorParser"
import type { TimeTableConfigForSchool, PeriodsConfig, SubjectDivisionMaster, SchoolSubject } from "@/types/subjects"
import type { StaffType } from "@/types/staff"

interface TimetableWeekEditorProps {
  timetableConfig: TimeTableConfigForSchool
  divisionId: number
  days: { value: string; label: string }[]
  onSave: () => void
}

interface PeriodState extends Partial<PeriodsConfig> {
  id?: number;
  period_order: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  subjects_division_masters_id: number | null;
  staff_enrollment_id: number | null;
  lab_id: number | null;
  is_pt: boolean;
  is_free_period: boolean;
  duration?: number;
  class_day_config_id: number;
}

export default function TimetableWeekEditor({ timetableConfig, divisionId, days, onSave }: TimetableWeekEditorProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  
  const [getSubjectsForDivision, { data: subjectsData }] = useLazyGetSubjectsForDivisionQuery()
  const [getAllSubjects, { data: allSubjectsData }] = useLazyGetAllSubjectsQuery()
  const [assignSubjectToDivision] = useAssignSubjectToDivisionMutation()
  const [getTeachingStaff, { data: staffData }] = useLazyGetTeachingStaffQuery()
  const [updateWeekWiseTimeTable, { isLoading: isUpdating }] = useUpdateWeekWiseTimeTableForDivisionMutation()

  const [subjects, setSubjects] = useState<SubjectDivisionMaster[]>([])
  const [staff, setStaff] = useState<StaffType[]>([])
  
  const [periodsState, setPeriodsState] = useState<Record<string, PeriodState[]>>({})
  const [maxPeriods, setMaxPeriods] = useState<number>(0)
  const [hasChanges, setHasChanges] = useState(false)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDayValue, setEditDayValue] = useState<string>("")
  const [editPeriodIndex, setEditPeriodIndex] = useState<number>(0)
  const [editSpan, setEditSpan] = useState<number>(1)
  const [originalSpan, setOriginalSpan] = useState<number>(1)
  const [maxAvailableSpan, setMaxAvailableSpan] = useState<number>(1)
  
  // Edit form state
  const [editSubjectId, setEditSubjectId] = useState<string>("none")
  const [editStaffId, setEditStaffId] = useState<string>("none")
  const [editLabId, setEditLabId] = useState<string>("none")
  const [editIsPt, setEditIsPt] = useState(false)
  const [editIsFree, setEditIsFree] = useState(false)
  const [editBatchName, setEditBatchName] = useState<string>("")
  
  const [isAddingBatch, setIsAddingBatch] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<PeriodState | null>(null)

  // Initialize data
  useEffect(() => {
    if (currentAcademicSession && divisionId) {
      getSubjectsForDivision({ academic_session_id: currentAcademicSession.id, division_id: divisionId })
      getAllSubjects({ academic_session_id: currentAcademicSession.id })
      getTeachingStaff({ academic_sessions: currentAcademicSession.id })
    }
  }, [currentAcademicSession, divisionId])

  useEffect(() => {
    if (subjectsData) setSubjects(subjectsData)
    if (staffData) setStaff(staffData.data || [])
  }, [subjectsData, staffData])

  // Initialize period state from config
  useEffect(() => {
    if (timetableConfig?.class_day_config) {
      let max = 0
      const initialState: Record<string, PeriodState[]> = {}
      
      days.forEach(day => {
        const dayConfig = timetableConfig.class_day_config.find(c => c.day === day.value)
        if (dayConfig) {
          const dayPeriods = dayConfig.period_config?.filter(p => p.division_id === divisionId) || []
          
          if (dayPeriods.length > 0) {
              const sorted = [...dayPeriods].sort((a, b) => a.period_order - b.period_order).map(p => ({
                ...p,
                class_day_config_id: dayConfig.id
              }))
              initialState[day.value] = sorted
              max = Math.max(max, sorted.length)
          } else {
              // Generate periods from day config
              const [startHour, startMinute] = dayConfig.day_start_time.split(":").map(Number)
              let currentMinutes = startHour * 60 + startMinute
              const periods : PeriodState[] = []
              let periodOrder = 1
              const totalBreaks = dayConfig.total_breaks || 0
              const regularPeriods = timetableConfig.max_periods_per_day
              const totalPeriods = regularPeriods + totalBreaks

              for (let i = 0; i < totalPeriods; i++) {
                const isBreak = totalBreaks > 0 && (i + 1) % Math.ceil(totalPeriods / (totalBreaks + 1)) === 0 && periods.filter((p) => p.is_break).length < totalBreaks

                const duration = isBreak ? (Array.isArray(dayConfig.break_durations) ? dayConfig.break_durations[periods.filter((p) => p.is_break).length] : dayConfig.break_durations) || 15 : timetableConfig.default_period_duration

                const periodStartHour = Math.floor(currentMinutes / 60)
                const periodStartMinute = currentMinutes % 60
                const periodStartTime = `${periodStartHour.toString().padStart(2, "0")}:${periodStartMinute.toString().padStart(2, "0")}`

                currentMinutes += duration
                const periodEndHour = Math.floor(currentMinutes / 60)
                const periodEndMinute = currentMinutes % 60
                const periodEndTime = `${periodEndHour.toString().padStart(2, "0")}:${periodEndMinute.toString().padStart(2, "0")}`

                periods.push({
                  period_order: periodOrder++,
                  start_time: periodStartTime,
                  end_time: periodEndTime,
                  is_break: isBreak,
                  subjects_division_masters_id: null,
                  staff_enrollment_id: null,
                  lab_id: null,
                  is_pt: false,
                  is_free_period: false,
                  batch_name: null,
                  duration: duration,
                  class_day_config_id: dayConfig.id
                })
              }
              initialState[day.value] = periods
              max = Math.max(max, periods.length)
          }
        } else {
          initialState[day.value] = []
        }
      })
      
      setPeriodsState(initialState)
      setMaxPeriods(max)
      setHasChanges(false)
    }
  }, [timetableConfig, divisionId, days])

  const handleCellClick = (dayValue: string, periodIndex: number, period: PeriodState, addingBatch: boolean = false, addSpan: number = 1) => {
    if (period.is_break && !addingBatch) return; // Can't edit breaks

    const dayPeriods = periodsState[dayValue];
    
    // Check if there are multiple batches at this periodIndex
    const periodsAtThisSlot = dayPeriods.filter(p => p.period_order === period.period_order);
    const hasContent = period.subjects_division_masters_id !== null || period.is_pt || period.is_free_period;
    
    let currentSpan = 1;
    let available = 1;

    // Only allow spanning if we are not adding a batch, and there is only one batch at this slot
    if (!addingBatch && periodsAtThisSlot.length === 1) {
        let startIndex = dayPeriods.findIndex(p => p === period);
        if (startIndex === -1) startIndex = periodIndex;

        if (hasContent) {
            for (let i = startIndex - 1; i >= 0; i--) {
                const prevP = dayPeriods[i];
                if (prevP.is_break || dayPeriods.filter(p => p.period_order === prevP.period_order).length > 1) break;
                if (prevP.subjects_division_masters_id === period.subjects_division_masters_id && 
                    prevP.staff_enrollment_id === period.staff_enrollment_id && 
                    prevP.lab_id === period.lab_id &&
                    prevP.is_pt === period.is_pt &&
                    prevP.is_free_period === period.is_free_period &&
                    prevP.batch_name === period.batch_name) {
                    currentSpan++;
                } else {
                    break;
                }
            }
            for (let i = startIndex + 1; i < dayPeriods.length; i++) {
                const nextP = dayPeriods[i];
                if (nextP.is_break || dayPeriods.filter(p => p.period_order === nextP.period_order).length > 1) break;
                if (nextP.subjects_division_masters_id === period.subjects_division_masters_id && 
                    nextP.staff_enrollment_id === period.staff_enrollment_id && 
                    nextP.lab_id === period.lab_id &&
                    nextP.is_pt === period.is_pt &&
                    nextP.is_free_period === period.is_free_period &&
                    nextP.batch_name === period.batch_name) {
                    currentSpan++;
                } else {
                    break;
                }
            }
        }

        available = 0;
        for (let i = startIndex; i < dayPeriods.length; i++) {
            if (dayPeriods[i].is_break || dayPeriods.filter(p => p.period_order === dayPeriods[i].period_order).length > 1) break;
            available++;
        }
        
        setEditPeriodIndex(startIndex)
    } else if (addingBatch) {
        setEditPeriodIndex(dayPeriods.findIndex(p => p === period))
        currentSpan = addSpan;
        available = addSpan;
    } else {
        setEditPeriodIndex(dayPeriods.findIndex(p => p === period))
        currentSpan = 1;
        available = 1;
    }

    setEditDayValue(dayValue)
    setEditSpan(currentSpan)
    setOriginalSpan(currentSpan)
    setMaxAvailableSpan(available)
    setIsAddingBatch(addingBatch)
    setEditingPeriod(period)
    
    setEditSubjectId(addingBatch ? "none" : (period.subjects_division_masters_id?.toString() || "none"))
    setEditStaffId(addingBatch ? "none" : (period.staff_enrollment_id?.toString() || "none"))
    setEditLabId(addingBatch ? "none" : (period.lab_id?.toString() || "none"))
    setEditIsPt(addingBatch ? false : period.is_pt)
    setEditIsFree(addingBatch ? false : period.is_free_period)
    setEditBatchName(addingBatch ? "" : (period.batch_name || ""))
    
    setEditDialogOpen(true)
  }

  const handleApplyEdit = async () => {
    let finalSubjectId = editSubjectId === "none" ? null : editSubjectId;

    // Check if new subject needs to be assigned
    if (finalSubjectId && finalSubjectId.startsWith("new_")) {
        try {
            const subjectId = Number(finalSubjectId.replace("new_", ""));
            const result = await assignSubjectToDivision({
                academic_session_id: currentAcademicSession!.id,
                division_id: divisionId,
                subjects: [{
                  subject_id: subjectId,
                  code_for_division: allSubjectsData?.find(s => s.id === subjectId)?.code || ""
                }]
            }).unwrap();
            
            finalSubjectId = result[0].id.toString();
            
            await getSubjectsForDivision({
                academic_session_id: currentAcademicSession!.id,
                division_id: divisionId,
            });
        } catch (e) {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_assign_subject") });
            return;
        }
    }

    const newState = { ...periodsState };
    if (editingPeriod) {
        const targetPeriodOrder = editingPeriod.period_order;
        const targetBatchIndex = 0; // Simplified for this logic structure
        const maxSpan = Math.max(editSpan, originalSpan);
        
        for (let i = 0; i < maxSpan; i++) {
            const pOrder = targetPeriodOrder + i;
            const periodsForOrder = newState[editDayValue].filter(p => p.period_order === pOrder);
            
            if (isAddingBatch) {
                if (i >= editSpan) continue;
                if (periodsForOrder.length === 0) continue;
                
                const basePeriod = periodsForOrder[0];
                const newPeriod = { ...basePeriod, id: undefined }; // clear ID for new batch
                newPeriod.is_pt = editIsPt;
                newPeriod.is_free_period = editIsFree;
                newPeriod.batch_name = editBatchName.trim() || null;
                
                if (editIsPt || editIsFree) {
                    newPeriod.subjects_division_masters_id = null;
                    newPeriod.staff_enrollment_id = null;
                    newPeriod.lab_id = null;
                } else {
                    newPeriod.subjects_division_masters_id = finalSubjectId ? Number(finalSubjectId) : null;
                    newPeriod.staff_enrollment_id = editStaffId === "none" ? null : Number(editStaffId);
                    newPeriod.lab_id = editLabId === "none" ? null : Number(editLabId);
                }
                
                let lastIndex = -1;
                for (let j = newState[editDayValue].length - 1; j >= 0; j--) {
                    if (newState[editDayValue][j].period_order === pOrder) {
                        lastIndex = j;
                        break;
                    }
                }
                
                if (lastIndex !== -1) {
                    newState[editDayValue].splice(lastIndex + 1, 0, newPeriod);
                }
            } else {
                // Regular edit
                if (targetBatchIndex < periodsForOrder.length) {
                    const periodToUpdate = periodsForOrder[targetBatchIndex];
                    const indexInState = newState[editDayValue].indexOf(periodToUpdate);
                    
                    if (indexInState !== -1) {
                        const updatedPeriod = { ...periodToUpdate };
                        
                        if (i < editSpan) {
                            updatedPeriod.is_pt = editIsPt;
                            updatedPeriod.is_free_period = editIsFree;
                            updatedPeriod.batch_name = editBatchName.trim() || null;
                            
                            if (editIsPt || editIsFree) {
                                updatedPeriod.subjects_division_masters_id = null;
                                updatedPeriod.staff_enrollment_id = null;
                                updatedPeriod.lab_id = null;
                            } else {
                                updatedPeriod.subjects_division_masters_id = finalSubjectId ? Number(finalSubjectId) : null;
                                updatedPeriod.staff_enrollment_id = editStaffId === "none" ? null : Number(editStaffId);
                                updatedPeriod.lab_id = editLabId === "none" ? null : Number(editLabId);
                            }
                        } else {
                            if (periodsForOrder.length > 1) {
                                newState[editDayValue].splice(indexInState, 1);
                                continue;
                            } else {
                                updatedPeriod.subjects_division_masters_id = null;
                                updatedPeriod.staff_enrollment_id = null;
                                updatedPeriod.lab_id = null;
                                updatedPeriod.is_pt = false;
                                updatedPeriod.is_free_period = false;
                                updatedPeriod.batch_name = null;
                            }
                        }
                        
                        newState[editDayValue][indexInState] = updatedPeriod;
                    }
                } else if (i < editSpan) {
                    const newPeriod: any = {
                        period_order: pOrder,
                        start_time: periodsForOrder.length > 0 ? periodsForOrder[0].start_time : editingPeriod.start_time,
                        end_time: periodsForOrder.length > 0 ? periodsForOrder[0].end_time : editingPeriod.end_time,
                        is_break: false,
                        is_pt: editIsPt,
                        is_free_period: editIsFree,
                        subjects_division_masters_id: null,
                        staff_enrollment_id: null,
                        lab_id: null,
                        batch_name: editBatchName.trim() || null
                    };
                    
                    if (!editIsPt && !editIsFree) {
                        newPeriod.subjects_division_masters_id = finalSubjectId ? Number(finalSubjectId) : null;
                        newPeriod.staff_enrollment_id = editStaffId === "none" ? null : Number(editStaffId);
                        newPeriod.lab_id = editLabId === "none" ? null : Number(editLabId);
                    }
                    
                    let lastIndex = -1;
                    for (let j = newState[editDayValue].length - 1; j >= 0; j--) {
                        if (newState[editDayValue][j].period_order === pOrder) {
                            lastIndex = j;
                            break;
                        }
                    }
                    if (lastIndex !== -1) {
                        newState[editDayValue].splice(lastIndex + 1, 0, newPeriod);
                    } else {
                        newState[editDayValue].push(newPeriod);
                    }
                }
            }
        }
    }

    setPeriodsState(newState);
    setHasChanges(true);
    setEditDialogOpen(false);
  }

  const handleSaveAll = async () => {
    try {
        const payloadDays = [];
        
        for (const [dayValue, periods] of Object.entries(periodsState)) {
            if (periods.length === 0) continue;
            
            const class_day_config_id = periods[0].class_day_config_id;
            const updatedPeriods = periods.map(p => ({
                id: p.id,
                period_order: p.period_order,
                start_time: p.start_time,
                end_time: p.end_time,
                is_break: !!p.is_break,
                subjects_division_masters_id: p.subjects_division_masters_id,
                staff_enrollment_id: p.staff_enrollment_id,
                lab_id: p.lab_id,
                is_pt: !!p.is_pt,
                is_free_period: !!p.is_free_period,
                batch_name: p.batch_name || null
            }));

            payloadDays.push({
                class_day_config_id,
                periods: updatedPeriods
            });
        }

        const payload = {
            division_id: divisionId,
            days: payloadDays
        };

        await updateWeekWiseTimeTable({ payload }).unwrap();
        
        toast({ title: t("success"), description: t("timetable_updated_successfully") });
        setHasChanges(false);
        onSave();
    } catch (error) {
        toast({ variant: "destructive", title: t("error"), description: parseBackendError(error, t) });
    }
  }

  // Options generation
  const subjectOptions = useMemo(() => {
    const options: { value: string; label: string; code: string; isNew?: boolean }[] = []
    if (subjects) {
      subjects.forEach((s) => {
        options.push({
          value: s.id.toString(),
          label: s.subject?.name || `Subject ${s.id}`,
          code: s.code_for_division || s.subject?.code || "",
        })
      })
    }
    if (allSubjectsData) {
      allSubjectsData.forEach((s) => {
        const isAlreadyAdded = subjects?.some(divSub => divSub.subject_id === s.id)
        if (!isAlreadyAdded) {
          options.push({
            value: `new_${s.id}`,
            label: `${s.name} ${s.year ? `(${s.year})` : ""} (Not Assigned)`,
            code: s.code || "",
            isNew: true,
          })
        }
      })
    }
    return options
  }, [subjects, allSubjectsData])

  const staffOptions = useMemo(() => {
    if (!editSubjectId || editSubjectId === "none" || editSubjectId.startsWith("new_")) return [];
    const subject = subjects.find(s => s.id.toString() === editSubjectId)
    if (!subject) return []

    return (subject.subject_staff_divisioin_master || [])
      .filter(ssm => ssm.status === "Active" && ssm.staff_enrollment && ssm.staff_enrollment.status === "Retained")
      .map(ssm => {
        const t = ssm.staff_enrollment.staff
        return {
          value: ssm.staff_enrollment_id.toString(),
          label: `${t?.first_name || ""} ${t?.last_name || ""}`.trim(),
        }
      })
  }, [editSubjectId, subjects])

  const labOptions = useMemo(() => {
    if (!timetableConfig.lab_config) return []
    return timetableConfig.lab_config.map(lab => ({
      value: lab.id.toString(),
      label: lab.name,
    }))
  }, [timetableConfig])

  // Render helpers
  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  const getSubjectName = (period: PeriodState) => {
    if (!period.subjects_division_masters_id) return ""
    const subject = subjects.find((s) => s.id === period.subjects_division_masters_id)
    return subject ? subject.subject?.name : ""
  }

  const getTeacherName = (period: PeriodState) => {
    if (!period.staff_enrollment_id) return ""
    const teacher = staff.find((s) => s.staff_enrollment_id === period.staff_enrollment_id)
    if (!teacher) return ""
    const firstName = teacher.first_name || ""
    const lastInitial = teacher.last_name ? teacher.last_name.charAt(0).toUpperCase() + "." : ""
    return lastInitial ? `${firstName} ${lastInitial}` : firstName
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="text-lg font-semibold">{t("week_view_editor")}</h3>
            <p className="text-sm text-muted-foreground">{t("click_on_a_period_to_edit_adjacent_similar_periods_are_merged_visually")}</p>
        </div>
        <div className="flex space-x-2">
            {hasChanges && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 self-center">{t("unsaved_changes")}</Badge>}
            <Button onClick={handleSaveAll} disabled={!hasChanges || isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t("save_all")}
            </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-muted font-medium text-left w-24 sticky left-0 z-10">{t("day")}</th>
              {Array.from({ length: maxPeriods }, (_, i) => (
                <th key={i} className="border p-2 bg-muted font-medium text-center min-w-[120px]">
                  {t("period")} {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const dayPeriods = periodsState[day.value] || [];
              if (dayPeriods.length === 0) return null;

              const renderedCells = [];
              let skipTo = -1;

              // Group periods by period_order
              const groupedPeriods = Array.from({ length: maxPeriods }, (_, i) => {
                  return dayPeriods.filter(p => p.period_order === i + 1);
              });

              for (let i = 0; i < maxPeriods; i++) {
                if (i <= skipTo) continue;

                const periodGroup = groupedPeriods[i];
                if (!periodGroup || periodGroup.length === 0) {
                  renderedCells.push(<td key={i} className="border p-2 bg-gray-50 text-center">-</td>);
                  continue;
                }

                const firstPeriod = periodGroup[0];

                // Calculate colSpan for visual merging
                let colSpan = 1;
                if (!firstPeriod.is_break) {
                    const hasContent = periodGroup.some(p => p.subjects_division_masters_id !== null || p.is_pt || p.is_free_period);
                    if (hasContent) {
                        for (let j = i + 1; j < maxPeriods; j++) {
                            const nextGroup = groupedPeriods[j];
                            if (!nextGroup || nextGroup.length !== periodGroup.length) break;
                            
                            if (nextGroup[0].is_break) break;

                            const isMatch = periodGroup.every(p => {
                                return nextGroup.some(np => 
                                    np.subjects_division_masters_id === p.subjects_division_masters_id && 
                                    np.staff_enrollment_id === p.staff_enrollment_id && 
                                    np.lab_id === p.lab_id &&
                                    np.is_pt === p.is_pt &&
                                    np.is_free_period === p.is_free_period &&
                                    np.batch_name === p.batch_name
                                );
                            });

                            if (isMatch) {
                                colSpan++;
                            } else {
                                break;
                            }
                        }
                    }
                }
                
                skipTo = i + colSpan - 1;

                renderedCells.push(
                  <td 
                    key={i} 
                    colSpan={colSpan}
                    className={`border align-top transition-colors`}
                  >
                    <div className={`flex flex-col h-full ${periodGroup.length > 1 ? "space-y-2" : ""}`}>
                        {periodGroup.map((period, pIdx) => {
                            let bgColor = "bg-white hover:bg-blue-50 cursor-pointer";
                            if (period.is_break) bgColor = "bg-amber-50";
                            else if (period.is_pt) bgColor = "bg-purple-50 hover:bg-purple-100 cursor-pointer";
                            else if (period.lab_id) bgColor = "bg-blue-50 hover:bg-blue-100 cursor-pointer";
                            else if (period.is_free_period) bgColor = "bg-gray-50 hover:bg-gray-100 cursor-pointer";
                            else if (period.subjects_division_masters_id) bgColor = "bg-green-50 hover:bg-green-100 cursor-pointer";

                            return (
                                <div key={pIdx} className={`p-2 flex-1 rounded-sm border ${bgColor}`} onClick={() => handleCellClick(day.value, i, period)}>
                                    <div className="flex flex-col h-full min-h-[70px] justify-center items-center text-center">
                                        <div className="text-[10px] text-muted-foreground mb-1">
                                            {formatTime(period.start_time)} - {formatTime(dayPeriods[dayPeriods.findIndex(p => p === firstPeriod) + colSpan - 1].end_time)}
                                        </div>
                                        
                                        {period.is_break && <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800">{t("break")}</Badge>}
                                        {period.is_pt && <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">{t("pt")}</Badge>}
                                        {period.is_free_period && <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">{t("free")}</Badge>}
                                        
                                        {!period.is_break && !period.is_pt && !period.is_free_period && (
                                            <>
                                                {period.batch_name && (
                                                    <Badge variant="outline" className="mb-1 bg-blue-100 text-blue-800">{period.batch_name}</Badge>
                                                )}
                                                {period.subjects_division_masters_id ? (
                                                    <div className="font-medium text-sm text-green-800 truncate max-w-[100px] sm:max-w-full">
                                                        {getSubjectName(period)}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400 italic">{t("not_set")}</div>
                                                )}
                                                
                                                {period.staff_enrollment_id && (
                                                    <div className="flex items-center text-xs text-gray-600 mt-1">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {getTeacherName(period)}
                                                    </div>
                                                )}
                                                
                                                {period.lab_id && (
                                                    <div className="flex items-center text-xs text-blue-700 mt-1">
                                                        <Beaker className="h-3 w-3 mr-1" />
                                                        {timetableConfig.lab_config.find(l => l.id === period.lab_id)?.name}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {!firstPeriod.is_break && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-xs h-6 mt-1 text-muted-foreground hover:bg-gray-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellClick(day.value, i, firstPeriod, true, colSpan);
                                }}
                            >
                                <Plus className="h-3 w-3 mr-1" /> Batch
                            </Button>
                        )}
                    </div>
                  </td>
                );
              }

              return (
                <tr key={day.value}>
                  <th className="border p-2 bg-muted font-medium text-left sticky left-0 z-10">{day.label}</th>
                  {renderedCells}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isAddingBatch ? t("add_batch") : t("edit_period")}</DialogTitle>
                {!isAddingBatch && <p className="text-sm text-muted-foreground">{originalSpan > 1 ? t("editing_multiple_merged_periods") : t("editing_single_period")}</p>}
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>{t("duration_consecutive_periods") || "Duration (Periods)"}</Label>
                    <Select value={editSpan.toString()} onValueChange={(v) => setEditSpan(parseInt(v))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: maxAvailableSpan }, (_, i) => i + 1).map((n) => (
                                <SelectItem key={n} value={n.toString()}>
                                    {n} {n > 1 ? (t("periods") || "Periods") : (t("period") || "Period")}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is-pt" checked={editIsPt} onCheckedChange={(c) => { setEditIsPt(!!c); if(c) setEditIsFree(false); }} />
                        <Label htmlFor="is-pt">{t("is_pt_period")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is-free" checked={editIsFree} onCheckedChange={(c) => { setEditIsFree(!!c); if(c) setEditIsPt(false); }} />
                        <Label htmlFor="is-free">{t("is_free_period")}</Label>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t("batch_name_optional") || "Batch Name (Optional)"}</Label>
                    <Input 
                        placeholder={t("e_g_batch_a") || "e.g. Batch A"} 
                        value={editBatchName} 
                        onChange={(e) => setEditBatchName(e.target.value)} 
                    />
                </div>

                {!editIsPt && !editIsFree && (
                    <>
                        <div className="space-y-2">
                            <Label>{t("subject")}</Label>
                            <Select value={editSubjectId} onValueChange={(v) => { setEditSubjectId(v); setEditStaffId("none"); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_subject")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("no_subject")}</SelectItem>
                                    {subjectOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label} {opt.code ? `(${opt.code})` : ""}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("teacher")}</Label>
                            <Select value={editStaffId} onValueChange={setEditStaffId} disabled={editSubjectId === "none" || editSubjectId.startsWith("new_")}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("select_teacher")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("no_teacher")}</SelectItem>
                                    {staffOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("lab")}</Label>
                            <Select value={editLabId} onValueChange={setEditLabId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("no_lab")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("no_lab")}</SelectItem>
                                    {labOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t("cancel")}</Button>
                <Button onClick={handleApplyEdit}>{t("apply")}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
