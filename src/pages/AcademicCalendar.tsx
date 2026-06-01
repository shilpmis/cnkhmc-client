"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/redux/hooks/useTranslation";
import { useAppDispatch } from "@/redux/hooks/useAppDispatch";
import { useAppSelector } from "@/redux/hooks/useAppSelector";
import {
  selectIsSaturdayWorking,
  setIsSaturdayWorking,
  setNonWorkingDates,
  hydrateAcademicCalendar,
} from "@/redux/slices/academicCalendarSlice";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Info,
  FileUp,
  Download,
  Save,
  Trash2,
  X,
  Search,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  useLazyGetAcademicCalendarSettingsQuery,
  useUpdateAcademicCalendarSettingsMutation,
} from "@/services/AcademicCalendarService";
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice";
import { UserRole } from "@/types/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  title: string;
  description?: string;
  category: string;
  isWorkingDay: boolean;
}

export default function AcademicCalendar() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSaturdayWorking = useAppSelector(selectIsSaturdayWorking);
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool);
  const [updateSettings, { isLoading: isSaving }] = useUpdateAcademicCalendarSettingsMutation();
  const [getSettings] = useLazyGetAcademicCalendarSettingsQuery();
  const authState = useAppSelector(selectAuthState);

  const isTeacher =
    authState.user?.role_id === 6 || // SCHOOL_TEACHER
    authState.user?.role_id === 10 || // FACULTY
    authState.user?.system_role === UserRole.SCHOOL_TEACHER;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");

  const [newEvent, setNewEvent] = useState({
    title: "",
    category: "event",
    isWorkingDay: true,
    description: "",
  });

  // ── Load settings from server on mount (Timezone-Safe Parsing) ────────────────────────
  useEffect(() => {
    if (!currentAcademicSession?.id) return;
    getSettings({ academic_session_id: currentAcademicSession.id })
      .unwrap()
      .then((data) => {
        dispatch(
          hydrateAcademicCalendar({
            nonWorkingDates: data.non_working_dates,
            isSaturdayWorking: data.is_saturday_working,
          })
        );
        // Convert YYYY-MM-DD or JSON strings back into CalendarEvent objects timezone-independently
        const loaded: CalendarEvent[] = (data.non_working_dates || []).map((item) => {
          if (item && typeof item === "string" && item.trim().startsWith("{")) {
            try {
              const obj = JSON.parse(item);
              const parts = obj.date.split("-");
              return {
                date: parseInt(parts[2], 10),
                month: parseInt(parts[1], 10) - 1,
                year: parseInt(parts[0], 10),
                title: obj.title || "Untitled Event",
                description: obj.description || "",
                category: obj.category || "event",
                isWorkingDay: obj.isWorkingDay !== false,
              };
            } catch {
              // fallback below
            }
          }

          const parts = String(item).split("T")[0].split("-");
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // 0-indexed months
          const date = parseInt(parts[2], 10);
          return {
            date,
            month,
            year,
            title: "Holiday",
            category: "holiday",
            isWorkingDay: false,
          };
        });
        setEvents(loaded);
      })
      .catch(() => {
        // No record yet — start with empty calendar
      });
  }, [currentAcademicSession?.id, getSettings, dispatch]);

  // ── Derive persisted events list (JSON stringified) ──────────────────────────────────
  const persistedDates = useMemo(() => {
    return events.map((evt) => {
      const y = evt.year;
      const m = String(evt.month + 1).padStart(2, "0");
      const day = String(evt.date).padStart(2, "0");
      return JSON.stringify({
        date: `${y}-${m}-${day}`,
        title: evt.title,
        description: evt.description || "",
        category: evt.category,
        isWorkingDay: evt.isWorkingDay,
      });
    });
  }, [events]);

  // ── Keep Redux slice in sync with actual non-working days (local) ─────────────────────
  useEffect(() => {
    const rawNonWorking = events
      .filter((e) => !e.isWorkingDay)
      .map((evt) => {
        const y = evt.year;
        const m = String(evt.month + 1).padStart(2, "0");
        const day = String(evt.date).padStart(2, "0");
        return `${y}-${m}-${day}`;
      });
    dispatch(setNonWorkingDates(rawNonWorking));
  }, [dispatch, events]);

  // ── Explicit save to server ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!currentAcademicSession?.id) {
      toast({ title: "No active academic session", variant: "destructive" });
      return;
    }
    try {
      await updateSettings({
        academic_session_id: currentAcademicSession.id,
        payload: {
          non_working_dates: persistedDates,
          is_saturday_working: isSaturdayWorking,
        },
      }).unwrap();
      toast({ title: "Calendar saved", description: "All events and calendar settings saved successfully." });
    } catch {
      toast({ title: "Save failed", description: "Could not save calendar settings.", variant: "destructive" });
    }
  };

  // ── Calendar navigation helpers ────────────────────────────────────────────────────────
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const getDayOfWeek = (day: number) =>
    new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();

  // ── Add Event dialog ───────────────────────────────────────────────────────────────────
  const openAddEvent = (day: number) => {
    setSelectedDay(day);
    setNewEvent({ title: "", category: "event", isWorkingDay: true, description: "" });
    setIsAddEventOpen(true);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || selectedDay === null) return;
    const evt: CalendarEvent = {
      date: selectedDay,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      ...newEvent,
    };
    setEvents((prev) => [...prev, evt]);
    setIsAddEventOpen(false);
    toast({ title: "Event added", description: `"${newEvent.title}" added. Click Save to persist.` });
  };

  const removeEvent = (idx: number) => setEvents((prev) => prev.filter((_, i) => i !== idx));

  // ── Excel import ────────────────────────────────────────────────────────────────────────
  const parseExcelDate = (raw: unknown): Date | null => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    if (typeof raw === "number") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + raw * 86_400_000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === "string") {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const newEvents: CalendarEvent[] = (data as any[])
          .map((row) => {
            const rawDate = row["Date (YYYY-MM-DD)"] ?? row["Date"] ?? row["date"];
            const dateObj = parseExcelDate(rawDate);
            if (!dateObj) return null;
            return {
              date: dateObj.getDate(),
              month: dateObj.getMonth(),
              year: dateObj.getFullYear(),
              isWorkingDay: String(row["Is Working Day (Yes/No)"] ?? row["IsWorkingDay"] ?? "yes").toLowerCase() === "yes",
              category: row["Category"] ?? row["category"] ?? "event",
              title: row["Title"] ?? row["title"] ?? "Untitled Event",
              description: row["Description"] ?? row["description"] ?? "",
            } as CalendarEvent;
          })
          .filter(Boolean) as CalendarEvent[];
        setEvents((prev) => [...prev, ...newEvents]);
        toast({ title: "Import Successful", description: `Imported ${newEvents.length} events.` });
      } catch (err) {
        console.error("Import error:", err);
        toast({ title: "Import Failed", description: "Check the Excel format.", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const template = [
      { "Date (YYYY-MM-DD)": "2026-04-14", "Is Working Day (Yes/No)": "No", Category: "holiday", Title: "Ambedkar Jayanti", Description: "Public Holiday" },
      { "Date (YYYY-MM-DD)": "2026-04-20", "Is Working Day (Yes/No)": "Yes", Category: "exam", Title: "Annual Exams", Description: "Final examinations" },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Academic_Calendar_Template.xlsx");
  };

  // ── Styling Tokens ──────────────────────────────────────────────────────────────────────
  const categoryColor: Record<string, string> = {
    exam:    "bg-amber-500/10 text-amber-700 border-amber-500/20",
    holiday: "bg-rose-500/10 text-rose-700 border-rose-500/20",
    meeting: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    event:   "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  };

  const categoryPills = [
    { value: "all", label: "All Items" },
    { value: "holiday", label: "Holidays" },
    { value: "exam", label: "Exams" },
    { value: "meeting", label: "Meetings" },
    { value: "event", label: "Events" },
  ];

  // ── Derived Stats Summary ───────────────────────────────────────────────────────────────
  const totalHolidaysCount = useMemo(() => {
    const defaultSaturdaysCount = isSaturdayWorking ? 0 : 4; // approximate
    const explicitHolidays = events.filter(e => !e.isWorkingDay).length;
    return explicitHolidays;
  }, [events, isSaturdayWorking]);

  const scheduledEventsCount = useMemo(() => {
    return events.filter(e => e.isWorkingDay).length;
  }, [events]);

  // ── Filter events for sidebar ──────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesCategory = selectedFilterCategory === "all" || evt.category === selectedFilterCategory;
        const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (evt.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.date - b.date));
  }, [events, selectedFilterCategory, searchQuery]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── HEADER BANNER: UNIFIED LIGHT FORMAT ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Calendar</h1>
          <p className="text-gray-600 mt-1">
            {currentAcademicSession
              ? `Active Term Session: ${(currentAcademicSession as any).session_name ?? (currentAcademicSession as any).name ?? currentAcademicSession.id}`
              : "No active academic session"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
          {!isTeacher && (
            <>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm rounded-lg"
              >
                <Download className="h-4 w-4" /> Get Template
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-lg"
              >
                <FileUp className="h-4 w-4" /> Bulk Import
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !currentAcademicSession?.id}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg font-semibold"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Persist Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── UNIFIED SUMMARY STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Total Holidays */}
        <Card className="border border-slate-200/60 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Holidays
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-4">{totalHolidaysCount}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Explicitly registered non-working dates</p>
          </CardContent>
        </Card>

        {/* Stat 2: Scheduled Events */}
        <Card className="border border-slate-200/60 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Active Events
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-4">{scheduledEventsCount}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Exams, meetings, and activities</p>
          </CardContent>
        </Card>

        {/* Stat 3: Saturday Config */}
        <Card className="border border-slate-200/60 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  Saturday Rule
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-3">{isSaturdayWorking ? "Working Saturdays" : "Saturdays Off"}</div>
            </div>
            <div className="flex items-center justify-between mt-4 border-t pt-3">
              <span className="text-[11px] text-slate-500 font-semibold">{isTeacher ? "View-Only Mode" : "Toggle weekends"}</span>
              {!isTeacher && (
                <Switch
                  checked={isSaturdayWorking}
                  onCheckedChange={(checked) => dispatch(setIsSaturdayWorking(checked))}
                  aria-label="Toggle working Saturdays"
                  className="data-[state=checked]:bg-blue-600"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stat 4: Active Session Details */}
        <Card className="border border-slate-200/60 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Academic Term
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-3 truncate">
              {currentAcademicSession ? ((currentAcademicSession as any).session_name ?? (currentAcademicSession as any).name ?? currentAcademicSession.id) : "No Term Active"}
            </div>
            <div className="text-[11px] text-slate-500 mt-3 font-semibold space-y-1">
              <div>
                Start:{" "}
                {currentAcademicSession
                  ? (() => {
                      const raw =
                        (currentAcademicSession as any).startDate ??
                        (currentAcademicSession as any).start_date ??
                        (currentAcademicSession as any).start_month;
                      if (!raw) return "—";
                      const d = new Date(raw);
                      if (!isNaN(d.getTime())) {
                        return d.toLocaleDateString("en-US", { dateStyle: "medium" });
                      }
                      return String(raw).split("T")[0];
                    })()
                  : "—"}
              </div>
              <div>
                End:{" "}
                {currentAcademicSession
                  ? (() => {
                      const raw =
                        (currentAcademicSession as any).endDate ??
                        (currentAcademicSession as any).end_date ??
                        (currentAcademicSession as any).end_month;
                      if (!raw) return "—";
                      const d = new Date(raw);
                      if (!isNaN(d.getTime())) {
                        return d.toLocaleDateString("en-US", { dateStyle: "medium" });
                      }
                      return String(raw).split("T")[0];
                    })()
                  : "—"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN WORKSPACE: SIDEBAR & CALENDAR GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── LEFT COLUMN: CALENDAR GRID (2 COLS) ── */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-200/80 flex flex-row items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <Select
                  value={String(currentDate.getMonth())}
                  onValueChange={(val) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(val, 10), 1))}
                >
                  <SelectTrigger className="h-10 border border-slate-200 rounded-lg font-bold bg-white text-slate-900 w-[140px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                    {monthNames.map((name, index) => (
                      <SelectItem key={index} value={String(index)} className="font-bold text-sm">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(currentDate.getFullYear())}
                  onValueChange={(val) => setCurrentDate(new Date(parseInt(val, 10), currentDate.getMonth(), 1))}
                >
                  <SelectTrigger className="h-10 border border-slate-200 rounded-lg font-bold bg-white text-slate-900 w-[100px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                    {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((yr) => (
                      <SelectItem key={yr} value={String(yr)} className="font-bold text-sm">{yr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-lg h-9 w-9 border border-slate-200 hover:bg-slate-100">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-lg h-9 w-9 border border-slate-200 hover:bg-slate-100">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {dayNames.map((day) => (
                  <div key={day} className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider">{day}</div>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-28 rounded-lg bg-slate-50/20 border border-transparent" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dow = getDayOfWeek(day);
                  const isSat = dow === 6;
                  const isSun = dow === 0;
                  const dayEvents = events.filter(
                    (e) => e.date === day && e.month === currentDate.getMonth() && e.year === currentDate.getFullYear()
                  );
                  const isNonWorking =
                    dayEvents.some((e) => !e.isWorkingDay) ||
                    isSun ||
                    (isSat && !isSaturdayWorking);
 
                  const isTodayCell = 
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();
 
                  return (
                    <motion.div
                      key={day}
                      className={`h-28 rounded-lg border p-2 flex flex-col items-start relative group transition-all duration-200 overflow-hidden
                        ${isNonWorking 
                          ? "bg-rose-50/30 border-rose-100 hover:bg-rose-50/50" 
                          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/30"}
                        ${isTodayCell ? "ring-2 ring-primary ring-offset-1 border-transparent" : ""}
                        ${isTeacher ? "cursor-default" : "cursor-pointer"}`}
                      whileHover={isTeacher ? undefined : { scale: 1.02 }}
                      onClick={() => !isTeacher && openAddEvent(day)}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`font-bold text-xs ${isNonWorking ? "text-rose-600" : "text-slate-600"}`}>
                          {day}
                        </span>
                        {isTodayCell && (
                          <span className="text-[8px] px-1 rounded bg-primary text-white font-extrabold uppercase tracking-wider">
                            Today
                          </span>
                        )}
                        {!isNonWorking && dayEvents.length === 0 && (
                          <div className="h-1 w-1 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      
                      {/* Inner Events List */}
                      <div className="w-full mt-1.5 space-y-1 overflow-y-auto max-h-[62px] scrollbar-thin">
                        {dayEvents.map((evt, idx) => (
                          <div
                            key={idx}
                            className={`text-[9px] font-bold px-1 py-0.5 rounded border truncate ${
                              categoryColor[evt.category] ?? categoryColor.event
                            }`}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                      
                      {/* Plus icon on hover for admin users */}
                      {dayEvents.length === 0 && !isTeacher && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-[0.5px]">
                          <Plus className="h-5 w-5 text-primary scale-90 group-hover:scale-100 transition-transform duration-200" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: INTERACTIVE EVENTS SIDEBAR ── */}
        <div>
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white h-full flex flex-col min-h-[600px]">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-200/80">
              <CardTitle className="text-lg font-bold text-slate-900">
                School Events ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col space-y-5">
              
              {/* Search & Category Pills */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search events, holidays..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-lg border-slate-200 focus-visible:ring-primary focus-visible:border-transparent font-medium"
                  />
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {categoryPills.map((pill) => (
                    <button
                      key={pill.value}
                      onClick={() => setSelectedFilterCategory(pill.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        selectedFilterCategory === pill.value
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtered Scroll List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[480px]">
                <AnimatePresence>
                  {filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                      <CalendarIcon className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                      <p className="text-xs font-bold">No matching entries found</p>
                      <p className="text-[10px] text-slate-400">Try adjusting your filters above</p>
                    </div>
                  ) : (
                    filteredEvents.map((evt, idx) => {
                      const origIdx = events.findIndex(e => e === evt);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="flex gap-3 items-start p-3.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 group"
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            categoryColor[evt.category] ?? categoryColor.event
                          }`}>
                            <Info className="h-4.5 w-4.5" />
                          </div>
                          
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-extrabold text-slate-900 truncate text-sm">{evt.title}</h4>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                              {monthNames[evt.month]} {evt.date}, {evt.year}
                            </p>
                            {evt.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-normal">
                                {evt.description}
                              </p>
                            )}
                            {!evt.isWorkingDay && (
                              <Badge className="mt-2 text-[8px] font-bold tracking-wider bg-rose-50 text-rose-600 border border-rose-100 rounded">
                                HOLIDAY
                              </Badge>
                            )}
                          </div>
                          
                          {!isTeacher && origIdx !== -1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                              onClick={() => removeEvent(origIdx)}
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* ── ADD EVENT DIALOG ── */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="rounded-xl p-6 max-w-md border border-slate-200 shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Add Event — {selectedDay != null && `${monthNames[currentDate.getMonth()]} ${selectedDay}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label className="font-bold text-xs text-slate-700">Event Title</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Sports Carnival, Diwali Break"
                className="h-10 rounded-lg border-slate-200 focus-visible:ring-primary focus-visible:border-transparent font-medium text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-xs text-slate-700">Category</Label>
              <Select value={newEvent.category} onValueChange={(v) => setNewEvent((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 font-medium text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">General Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-xs text-slate-700">Description (optional)</Label>
              <Input
                value={newEvent.description}
                onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description..."
                className="h-10 rounded-lg border-slate-200 font-medium text-sm"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Switch
                checked={newEvent.isWorkingDay}
                onCheckedChange={(v) => setNewEvent((p) => ({ ...p, isWorkingDay: v }))}
                className="data-[state=checked]:bg-blue-600"
              />
              <div>
                <p className="font-bold text-xs text-slate-900">{newEvent.isWorkingDay ? "Working Day" : "Non-working Day"}</p>
                <p className="text-[10px] text-slate-500 font-medium">Non-working days block other date pickers.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 gap-2 sm:flex-row flex-col">
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)} className="rounded-lg flex-1 h-10 border font-bold text-sm">
              <X className="mr-1.5 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleAddEvent}
              disabled={!newEvent.title.trim()}
              className="rounded-lg flex-1 h-10 bg-primary font-bold shadow-sm text-white hover:scale-105 active:scale-95 transition-transform text-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
