import { useState, useEffect, useMemo, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Save, Loader2, BookOpen, Users, Beaker, Dumbbell, Coffee, Clock, RotateCcw, Plus, History, FileDown, Edit3, Eye } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useLazyGetSubjectsForDivisionQuery, useAssignSubjectToDivisionMutation, useLazyGetAllSubjectsQuery } from "@/services/subjects"
import { useLazyGetTeachingStaffQuery } from "@/services/StaffService"
import { useUpdateWeekWiseTimeTableForDivisionMutation, useSaveTimetableVersionMutation, useLazyGetTimetableVersionsQuery, useRestoreTimetableVersionMutation } from "@/services/timetableService"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { parseBackendError } from "@/lib/errorParser"
import type { TimeTableConfigForSchool, PeriodsConfig, SubjectDivisionMaster, SchoolSubject } from "@/types/subjects"
import ApiService from "@/services/ApiService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { AlertCircle } from "lucide-react"
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
  const academicClasses = useAppSelector(selectAcademicClasses)
  
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

  // Modes
  const [viewMode, setViewMode] = useState<'edit' | 'readonly'>('edit')
  const [isQuickAssignMode, setIsQuickAssignMode] = useState(false)
  const [quickAssignData, setQuickAssignData] = useState({
    subjectId: "none", staffId: "none", labId: "none", isPt: false, isFree: false, batchName: ""
  })

  // Versions
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")
  const [saveTimetableVersion] = useSaveTimetableVersionMutation()
  const [getTimetableVersions] = useLazyGetTimetableVersionsQuery()
  const [restoreTimetableVersion] = useRestoreTimetableVersionMutation()


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

  // Validation state
  const [coverageReport, setCoverageReport] = useState<any[]>([])
  const [calendarSettings, setCalendarSettings] = useState<any>(null)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [validationType, setValidationType] = useState<"under" | "over" | null>(null)

  useEffect(() => {
    if (currentAcademicSession) {
      ApiService.get(`lesson-plans/reports/coverage/${currentAcademicSession.id}`)
        .then((res: any) => {
          setCoverageReport(res.data || [])
        })
        .catch((err: any) => {
          console.error("Error fetching coverage report:", err)
        })

      ApiService.get(`academic-calendar-settings/${currentAcademicSession.id}`)
        .then((res: any) => {
          setCalendarSettings(res.data || null)
        })
        .catch((err: any) => {
          console.error("Error fetching calendar settings:", err)
        })
    }
  }, [currentAcademicSession])

  const workingDaysCount = useMemo(() => {
    const counts = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 }
    if (!currentAcademicSession) return counts

    try {
      const extractMonth = (monthString: string): number => {
        if (!monthString) return 0;
        if (monthString.includes("-")) {
          const parts = monthString.split("-");
          const monthPart = parts.find(p => p.length <= 2) || parts[1];
          return (parseInt(monthPart) || 1) - 1;
        }
        return (parseInt(monthString) || 1) - 1;
      };

      const startMonthIdx = extractMonth(currentAcademicSession.start_month);
      const endMonthIdx = extractMonth(currentAcademicSession.end_month);

      const start = new Date(parseInt(currentAcademicSession.start_year), startMonthIdx, 1);
      const end = new Date(parseInt(currentAcademicSession.end_year), endMonthIdx, 1);
      // Set to last day of the end month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);

      const holidays =
        calendarSettings?.holidays?.map((h: any) => {
          return new Date(h.date).toISOString().split("T")[0]
        }) || []

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0]
        if (holidays.includes(dateStr)) continue

        const dayOfWeek = d.getDay()
        if (dayOfWeek === 0) continue

        const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        const dayStr = dayMap[dayOfWeek]

        const isDayConfigured = timetableConfig.class_day_config?.some(
          (c) => c.day === dayStr
        )

        if (isDayConfigured && dayStr !== "sun") {
          counts[dayStr as keyof typeof counts]++
        }
      }
    } catch (e) {
      console.error("Error calculating working days:", e)
    }
    return counts
  }, [currentAcademicSession, calendarSettings, timetableConfig])

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    return endMinutes - startMinutes
  }

  const subjectHourCheck = useMemo(() => {
    if (!subjectsData || Object.keys(periodsState).length === 0) return { under: [], over: [] }
    
    const weeklyMinutes: Record<number, number> = {}
    
    subjectsData.forEach(s => {
      const sdmId = s.id;
      const processedSlots = new Set<string>();
      let lectureMinutes = 0;
      const batchMinutes: Record<string, number> = {};
      
      Object.entries(periodsState).forEach(([dayValue, periods]) => {
        const dayWorkingCount = workingDaysCount[dayValue as keyof typeof workingDaysCount] || 0;
        
        periods.forEach(p => {
          if (!p.is_break && !p.is_pt && !p.is_free_period && p.subjects_division_masters_id === sdmId) {
            const slotKey = `${dayValue}-${p.start_time}-${p.end_time}-${p.batch_name || 'lecture'}`;
            
            if (!processedSlots.has(slotKey)) {
              processedSlots.add(slotKey);
              const duration = calculateDuration(p.start_time, p.end_time);
              const totalMins = duration * dayWorkingCount;
              
              if (p.batch_name) {
                batchMinutes[p.batch_name] = (batchMinutes[p.batch_name] || 0) + totalMins;
              } else {
                lectureMinutes += totalMins;
              }
            }
          }
        })
      })
      
      let maxBatchMinutes = 0;
      Object.values(batchMinutes).forEach(mins => {
        if (mins > maxBatchMinutes) maxBatchMinutes = mins;
      });
      
      weeklyMinutes[sdmId] = lectureMinutes + maxBatchMinutes;
    })
    
    const under: any[] = []
    const over: any[] = []
    
    subjectsData.forEach(s => {
      const lpReportItem = coverageReport.find(r => r.subjectId === s.subject_id || r.subject_id === s.subject_id)
      const requiredHours = lpReportItem ? lpReportItem.totalHours || 0 : 0
      
      if (requiredHours > 0) {
        const totalMinutes = weeklyMinutes[s.id] || 0
        const allocatedHours = totalMinutes / 60
        
        if (allocatedHours < requiredHours - 0.1) {
          under.push({ id: s.subject_id, name: s.subject?.name || t("unknown_subject"), required: requiredHours, allocated: allocatedHours })
        } else if (allocatedHours > requiredHours + 0.1) {
          over.push({ id: s.subject_id, name: s.subject?.name || t("unknown_subject"), required: requiredHours, allocated: allocatedHours })
        }
      }
    })
    
    return { under, over }
  }, [periodsState, subjectsData, workingDaysCount, coverageReport, t])

  // Initialize data
  useEffect(() => {
    if (currentAcademicSession && divisionId) {
      getSubjectsForDivision({ academic_session_id: currentAcademicSession.id, division_id: divisionId })
      getAllSubjects({ academic_session_id: currentAcademicSession.id })
      getTeachingStaff({ academic_sessions: currentAcademicSession.id })
      
      // Fetch versions
      getTimetableVersions({ academic_session_id: currentAcademicSession.id, division_id: divisionId })
        .unwrap()
        .then(res => setVersions(res.data || []))
        .catch(console.error)
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
              const dayMaxOrder = sorted.reduce((acc, p) => Math.max(acc, p.period_order || 0), 0)
              max = Math.max(max, dayMaxOrder)
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
    if (viewMode === 'readonly') return;
    if (period.is_break && !addingBatch) return; // Can't edit breaks

    if (isQuickAssignMode && !addingBatch) {
      // Direct assignment
      const newState = { ...periodsState };
      const targetPeriodIndex = newState[dayValue].findIndex(p => p === period);
      if (targetPeriodIndex !== -1) {
        newState[dayValue][targetPeriodIndex] = {
          ...newState[dayValue][targetPeriodIndex],
          subjects_division_masters_id: quickAssignData.subjectId === "none" ? null : Number(quickAssignData.subjectId),
          staff_enrollment_id: quickAssignData.staffId === "none" ? null : Number(quickAssignData.staffId),
          lab_id: quickAssignData.labId === "none" ? null : Number(quickAssignData.labId),
          is_pt: quickAssignData.isPt,
          is_free_period: quickAssignData.isFree,
          batch_name: quickAssignData.batchName || null
        };
        setPeriodsState(newState);
        setHasChanges(true);
      }
      return;
    }

    const dayPeriods = periodsState[dayValue];
    
    // Check if there are multiple batches at this periodIndex
    const periodsAtThisSlot = dayPeriods.filter(p => p.period_order === period.period_order);
    const hasContent = period.subjects_division_masters_id !== null || period.is_pt || period.is_free_period;
    
    let currentSpan = 1;
    let available = 1;

    // Determine span logic based on period_order rather than array indices
    if (!addingBatch) {
        if (hasContent) {
            // Check backwards
            let currentOrder = period.period_order;
            while (currentOrder > 1) {
                const prevOrder = currentOrder - 1;
                const prevP = dayPeriods.find(p => p.period_order === prevOrder && (p.batch_name || "") === (period.batch_name || ""));
                
                if (!prevP || prevP.is_break) break;
                if (prevP.subjects_division_masters_id === period.subjects_division_masters_id && 
                    prevP.staff_enrollment_id === period.staff_enrollment_id && 
                    prevP.lab_id === period.lab_id &&
                    prevP.is_pt === period.is_pt &&
                    prevP.is_free_period === period.is_free_period) {
                    currentSpan++;
                    currentOrder--;
                } else {
                    break;
                }
            }
            
            // Check forwards
            currentOrder = period.period_order;
            while (currentOrder < maxPeriods) {
                const nextOrder = currentOrder + 1;
                const nextP = dayPeriods.find(p => p.period_order === nextOrder && (p.batch_name || "") === (period.batch_name || ""));
                
                if (!nextP || nextP.is_break) break;
                if (nextP.subjects_division_masters_id === period.subjects_division_masters_id && 
                    nextP.staff_enrollment_id === period.staff_enrollment_id && 
                    nextP.lab_id === period.lab_id &&
                    nextP.is_pt === period.is_pt &&
                    nextP.is_free_period === period.is_free_period) {
                    currentSpan++;
                    currentOrder++;
                } else {
                    break;
                }
            }
        }

        available = 0;
        let currentOrder = period.period_order;
        while (currentOrder <= maxPeriods) {
            const currentP = dayPeriods.find(p => p.period_order === currentOrder && (p.batch_name || "") === (period.batch_name || ""));
            if (!currentP) {
                // If there's no period for this batch here, we can't extend into it easily unless we create it.
                // For simplicity, we only allow extending into existing slots.
                break;
            }
            if (currentP.is_break) break;
            available++;
            currentOrder++;
        }
        
        setEditPeriodIndex(dayPeriods.findIndex(p => p === period))
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
    if (subjectHourCheck.under.length > 0) {
      setValidationType("under")
      setIsValidationDialogOpen(true)
      return
    }
    if (subjectHourCheck.over.length > 0) {
      setValidationType("over")
      setIsValidationDialogOpen(true)
      return
    }
    await executeSaveAll()
  }

  const executeSaveAll = async () => {
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

  const handleExportPDF = async () => {
    const table = document.getElementById("timetable-grid")
    if (!table) return
    const canvas = await html2canvas(table, { scale: 2 })
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("l", "pt", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save("timetable.pdf")
  }

  const handleSaveVersion = async () => {
    try {
      const flattenedPeriods = Object.values(periodsState).flat()
      await saveTimetableVersion({
        payload: {
          division_id: divisionId,
          academic_session_id: currentAcademicSession!.id,
          periods_config: flattenedPeriods
        }
      }).unwrap()
      toast({ title: t("success"), description: "Version saved successfully." })
      getTimetableVersions({ academic_session_id: currentAcademicSession!.id, division_id: divisionId })
        .unwrap()
        .then(res => setVersions(res.data || []))
    } catch (e) {
      toast({ variant: "destructive", title: t("error"), description: "Failed to save version" })
    }
  }

  const handleRestoreVersion = async () => {
    if (!selectedVersionId) return;
    try {
      await restoreTimetableVersion({ version_id: Number(selectedVersionId) }).unwrap()
      toast({ title: t("success"), description: "Version restored successfully." })
      onSave()
    } catch (e) {
      toast({ variant: "destructive", title: t("error"), description: "Failed to restore version" })
    }
  }


  // Options generation
  const subjectOptions = useMemo(() => {
    const options: { value: string; label: string; code: string; isNew?: boolean }[] = []
    
    let targetYearString: string | null = null;
    let targetClassNum: string | null = null;
    
    if (timetableConfig?.class_day_config?.length && academicClasses) {
      const classId = timetableConfig.class_day_config[0].class_id;
      const cls = academicClasses.find(c => c.id === classId);
      if (cls) {
        targetClassNum = cls.class;
        if (targetClassNum === "1") targetYearString = "1st Year";
        else if (targetClassNum === "2") targetYearString = "2nd Year";
        else if (targetClassNum === "3") targetYearString = "3rd Year";
        else targetYearString = `${targetClassNum}th Year`;
      }
    }
    
    console.log("subjectOptions debug:", {
      targetClassNum,
      targetYearString,
      allSubjectsDataLength: allSubjectsData?.length,
      sampleSubject: allSubjectsData?.[0],
      academicClasses,
      classDayConfig: timetableConfig?.class_day_config
    });

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
        // If targetYearString is determined, check against it.
        if (targetClassNum && s.year) {
          let matches = false;
          const sYearStr = s.year.toString().toLowerCase().trim();
          const classStr = targetClassNum.toString().toLowerCase().trim();
          const targetStr = (targetYearString || "").toLowerCase().trim();

          if (sYearStr === classStr || sYearStr === targetStr || sYearStr.includes(classStr) || classStr.includes(sYearStr)) {
            matches = true;
          } else {
            // Extract numbers and compare them
            const sNumMatch = sYearStr.match(/\d+/);
            const cNumMatch = classStr.match(/\d+/);
            if (sNumMatch && cNumMatch && sNumMatch[0] === cNumMatch[0]) {
              matches = true;
            } else {
              // Word to number mapping
              const wordMap: Record<string, string> = {
                'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5', 'sixth': '6'
              };
              for (const [word, num] of Object.entries(wordMap)) {
                if ((sYearStr.includes(word) || sYearStr.includes(num)) && 
                    (classStr.includes(word) || classStr.includes(num))) {
                  matches = true;
                  break;
                }
              }
            }
          }

          if (!matches) {
            return;
          }
        }

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
  }, [subjects, allSubjectsData, timetableConfig, academicClasses])

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


  // Extract unique time slots across the week for column headers
  const uniqueTimeSlots = useMemo(() => {
    const slots = new Map<string, { start: string, end: string, isBreak: boolean }>()
    Object.values(periodsState).forEach(dayPeriods => {
      dayPeriods.forEach(p => {
        const key = `${p.start_time}-${p.end_time}`
        if (!slots.has(key)) {
          slots.set(key, { start: p.start_time, end: p.end_time, isBreak: p.is_break })
        }
      })
    })
    return Array.from(slots.values()).sort((a, b) => a.start.localeCompare(b.start))
  }, [periodsState])

  const isNonLectureSlot = (slot: { start: string, end: string }, dayKey: string) => {
    let nonLecture = false;
    const dayPeriods = periodsState[dayKey] || [];
    dayPeriods.filter(p => p.start_time <= slot.start && p.end_time >= slot.end).forEach(p => {
      if (p.batch_name || p.lab_id) {
        nonLecture = true;
      }
    })
    return nonLecture;
  }

  const periodHeaders = uniqueTimeSlots.map((slot, i) => (
    <th key={i} className="border p-2 bg-muted font-medium text-center min-w-[150px]">
      <div className="flex flex-col items-center justify-center text-xs">
        <span>{formatTime(slot.start)} to</span>
        <span>{formatTime(slot.end)}</span>
      </div>
    </th>
  ))

  const renderClassCategoryRow = (dayKey: string, dayIndex: number) => (
    <tr key={`${dayKey}-category`}>
      <th className="border p-2 bg-muted font-medium text-left sticky left-0 z-10">{t("class")}</th>
      {uniqueTimeSlots.map((slot, i) => {
        if (slot.isBreak) {
          if (dayIndex === 0) {
            const letters = ["R", "E", "C", "E", "S", "S"];
            return (
              <td key={`${dayKey}-${i}-break`} rowSpan={days.length * 2} className="border p-2 text-center align-middle bg-gray-50 min-w-[50px] z-0 relative">
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

  return (

    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="text-lg font-semibold">{t("week_view_editor")}</h3>
            <p className="text-sm text-muted-foreground">{t("click_on_a_period_to_edit_adjacent_similar_periods_are_merged_visually")}</p>
        </div>
        <div className="flex flex-wrap space-x-2 gap-y-2 items-center">
            <Button variant={viewMode === 'edit' ? "default" : "outline"} onClick={() => setViewMode('edit')} size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Mode
            </Button>
            <Button variant={viewMode === 'readonly' ? "default" : "outline"} onClick={() => setViewMode('readonly')} size="sm">
              <Eye className="mr-2 h-4 w-4" /> Read-Only
            </Button>
            
            {viewMode === 'readonly' && (
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            )}

            <Button onClick={handleSaveVersion} variant="outline" size="sm">
               <History className="mr-2 h-4 w-4" /> Save as Version
            </Button>
            
            <div className="flex items-center space-x-1 border rounded p-1">
               <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                 <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Select Version" /></SelectTrigger>
                 <SelectContent>
                   {versions.map(v => (
                     <SelectItem key={v.id} value={v.id.toString()}>Version {v.id}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Button onClick={handleRestoreVersion} disabled={!selectedVersionId} size="sm" variant="secondary">Restore</Button>
            </div>

            {hasChanges && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t("unsaved_changes")}</Badge>}
            <Button onClick={handleSaveAll} disabled={!hasChanges || isUpdating} size="sm">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t("save_all")}
            </Button>
        </div>
      </div>

      {viewMode === 'edit' && (
        <Card className="mb-4 bg-slate-50 border-blue-100">
           <CardContent className="p-3">
             <div className="flex items-center space-x-4 mb-2">
                <Checkbox id="quickAssign" checked={isQuickAssignMode} onCheckedChange={(v) => setIsQuickAssignMode(!!v)} />
                <Label htmlFor="quickAssign" className="font-semibold text-blue-700">Enable Quick Click Assign Mode</Label>
             </div>
             {isQuickAssignMode && (
                <div className="grid grid-cols-6 gap-2 items-end">
                   <div>
                     <Label className="text-xs">Subject</Label>
                     <Select value={quickAssignData.subjectId} onValueChange={(v) => setQuickAssignData(p => ({...p, subjectId: v}))}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Subject" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.subject?.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label className="text-xs">Teacher</Label>
                     <Select value={quickAssignData.staffId} onValueChange={(v) => setQuickAssignData(p => ({...p, staffId: v}))}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Teacher" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {staff.map(s => <SelectItem key={s.staff_enrollment_id} value={s.staff_enrollment_id.toString()}>{s.first_name} {s.last_name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                   </div>
                   <div className="flex flex-col space-y-1">
                     <div className="flex items-center space-x-2">
                       <Checkbox checked={quickAssignData.isPt} onCheckedChange={(c) => setQuickAssignData(p => ({...p, isPt: !!c}))} />
                       <Label className="text-xs">PT</Label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Checkbox checked={quickAssignData.isFree} onCheckedChange={(c) => setQuickAssignData(p => ({...p, isFree: !!c}))} />
                       <Label className="text-xs">Free</Label>
                     </div>
                   </div>
                   <div className="col-span-2">
                     <Label className="text-xs">Batch</Label>
                     <Input className="h-8" value={quickAssignData.batchName} onChange={(e) => setQuickAssignData(p => ({...p, batchName: e.target.value}))} placeholder="Batch Name" />
                   </div>
                </div>
             )}
           </CardContent>
        </Card>
      )}

      
      <div className="overflow-x-auto bg-white rounded-lg border" id="timetable-grid">
        <table className="w-full border-collapse table-fixed min-w-[800px] text-sm">
          <thead>
            <tr>
              <th className="border p-2 bg-muted font-medium text-left w-24 sticky left-0 z-10">{t("time_day")}</th>
              {periodHeaders}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIndex) => {
              const dayPeriods = periodsState[day.value] || [];
              if (dayPeriods.length === 0) return null;

              const slotSpans = new Array(uniqueTimeSlots.length).fill(1);
              const skipSlots = new Set<number>();

              for (let i = 0; i < uniqueTimeSlots.length; i++) {
                if (skipSlots.has(i)) continue;
                if (uniqueTimeSlots[i].isBreak) continue;

                const periodsAtI = dayPeriods.filter(p => p.start_time === uniqueTimeSlots[i].start && p.end_time === uniqueTimeSlots[i].end).sort((a, b) => (a.batch_name || "").localeCompare(b.batch_name || ""));
                if (periodsAtI.length === 0) continue;

                let span = 1;
                for (let j = i + 1; j < uniqueTimeSlots.length; j++) {
                  if (uniqueTimeSlots[j].isBreak) break;

                  const periodsAtJ = dayPeriods.filter(p => p.start_time === uniqueTimeSlots[j].start && p.end_time === uniqueTimeSlots[j].end).sort((a, b) => (a.batch_name || "").localeCompare(b.batch_name || ""));
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
                    <td className="border p-2 font-medium bg-muted sticky left-0 z-10">
                      {day.label}
                    </td>
                    {uniqueTimeSlots.map((slot, slotIndex) => {
                      if (slot.isBreak) {
                        return null;
                      }

                      if (skipSlots.has(slotIndex)) return null;

                      const periodsAtSlot = dayPeriods.filter(p => p.start_time === slot.start && p.end_time === slot.end);

                      if (periodsAtSlot.length === 0) {
                        return <td key={`${day.value}-${slotIndex}`} className="border p-1.5 text-center text-muted-foreground text-sm"></td>;
                      }
                      
                      const span = slotSpans[slotIndex];

                      return (
                        <td key={`${day.value}-${slotIndex}`} colSpan={span} className="border align-top transition-colors">
                          <div className={`flex flex-col h-full ${periodsAtSlot.length > 1 ? "space-y-2" : ""}`}>
                            {periodsAtSlot.map((period, pIdx) => {
                              let bgColor = "bg-white hover:bg-blue-50 cursor-pointer";
                              if (period.is_pt) bgColor = "bg-purple-50 hover:bg-purple-100 cursor-pointer";
                              else if (period.lab_id) bgColor = "bg-blue-50 hover:bg-blue-100 cursor-pointer";
                              else if (period.is_free_period) bgColor = "bg-gray-50 hover:bg-gray-100 cursor-pointer";
                              else if (period.subjects_division_masters_id) bgColor = "bg-green-50 hover:bg-green-100 cursor-pointer";

                              return (
                                <div key={pIdx} className={`p-2 flex-1 rounded-sm border ${bgColor}`} onClick={() => handleCellClick(day.value, period.period_order - 1, period)}>
                                  <div className="flex flex-col h-full min-h-[70px] justify-center items-center text-center">
                                    
                                    {period.is_pt && <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">{t("pt")}</Badge>}
                                    {period.is_free_period && <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">{t("free")}</Badge>}
                                    
                                    {!period.is_pt && !period.is_free_period && (
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

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-xs h-6 mt-1 text-muted-foreground hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(day.value, periodsAtSlot[0].period_order - 1, periodsAtSlot[0], true, span);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Batch
                            </Button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
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

      {/* Validation Dialog */}
      <AlertDialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {validationType === "under" ? "Syllabus Hours Under-Allocation" : "Syllabus Hours Over-Allocation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {validationType === "under" ? (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">The following subjects have fewer allocated hours than required in the Lesson Plan. You cannot proceed with saving.</p>
                  <ul className="list-disc pl-5">
                    {subjectHourCheck.under.map((sub: any, i: number) => (
                      <li key={i}>
                        {sub.name}: {sub.allocated.toFixed(1)}h allocated / {sub.required.toFixed(1)}h required
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-amber-600 font-medium">The following subjects have more allocated hours than required in the Lesson Plan.</p>
                  <ul className="list-disc pl-5">
                    {subjectHourCheck.over.map((sub: any, i: number) => (
                      <li key={i}>
                        {sub.name}: {sub.allocated.toFixed(1)}h allocated / {sub.required.toFixed(1)}h required
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {validationType === "over" && (
              <AlertDialogAction onClick={executeSaveAll}>Save Anyway</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
