"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileSpreadsheet,
  Layers,
  GraduationCap,
  Pencil,
  Tag,
  Settings2,
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AcademicYearLevel = "All" | "1st Year" | "2nd Year" | "3rd Year" | "4th Year";

export interface CalendarCategory {
  id: string;
  label: string;
  colorClass: string;
  dotColor: string;
  isCustom?: boolean;
}

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  title: string;
  description?: string;
  category: string;
  isWorkingDay: boolean;
  applicableYear?: AcademicYearLevel;
}

const COLOR_PALETTES = [
  { name: "Rose", colorClass: "bg-rose-500/10 text-rose-700 border-rose-500/20", dotColor: "bg-rose-500" },
  { name: "Amber", colorClass: "bg-amber-500/10 text-amber-700 border-amber-500/20", dotColor: "bg-amber-500" },
  { name: "Emerald", colorClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dotColor: "bg-emerald-500" },
  { name: "Indigo", colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20", dotColor: "bg-indigo-500" },
  { name: "Purple", colorClass: "bg-purple-500/10 text-purple-700 border-purple-500/20", dotColor: "bg-purple-500" },
  { name: "Teal", colorClass: "bg-teal-500/10 text-teal-700 border-teal-500/20", dotColor: "bg-teal-500" },
  { name: "Cyan", colorClass: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20", dotColor: "bg-cyan-500" },
  { name: "Pink", colorClass: "bg-pink-500/10 text-pink-700 border-pink-500/20", dotColor: "bg-pink-500" },
  { name: "Orange", colorClass: "bg-orange-500/10 text-orange-700 border-orange-500/20", dotColor: "bg-orange-500" },
  { name: "Blue", colorClass: "bg-blue-500/10 text-blue-700 border-blue-500/20", dotColor: "bg-blue-500" },
];

const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: "holiday", label: "Holiday", colorClass: "bg-rose-500/10 text-rose-700 border-rose-500/20", dotColor: "bg-rose-500" },
  { id: "exam", label: "Exam", colorClass: "bg-amber-500/10 text-amber-700 border-amber-500/20", dotColor: "bg-amber-500" },
  { id: "meeting", label: "Meeting", colorClass: "bg-purple-500/10 text-purple-700 border-purple-500/20", dotColor: "bg-purple-500" },
  { id: "event", label: "General Event", colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20", dotColor: "bg-indigo-500" },
  { id: "activity", label: "Academic Activity", colorClass: "bg-teal-500/10 text-teal-700 border-teal-500/20", dotColor: "bg-teal-500" },
];

const YEAR_OPTIONS: {
  value: AcademicYearLevel;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeBorder: string;
}[] = [
  {
    value: "All",
    label: "All Years (Common / Institute-wide)",
    shortLabel: "All Years",
    badgeBg: "bg-slate-100 text-slate-700",
    badgeBorder: "border-slate-300",
  },
  {
    value: "1st Year",
    label: "1st Year",
    shortLabel: "1st Yr",
    badgeBg: "bg-blue-50 text-blue-700",
    badgeBorder: "border-blue-200",
  },
  {
    value: "2nd Year",
    label: "2nd Year",
    shortLabel: "2nd Yr",
    badgeBg: "bg-emerald-50 text-emerald-700",
    badgeBorder: "border-emerald-200",
  },
  {
    value: "3rd Year",
    label: "3rd Year",
    shortLabel: "3rd Yr",
    badgeBg: "bg-amber-50 text-amber-700",
    badgeBorder: "border-amber-200",
  },
  {
    value: "4th Year",
    label: "4th Year",
    shortLabel: "4th Yr",
    badgeBg: "bg-purple-50 text-purple-700",
    badgeBorder: "border-purple-200",
  },
];

const normalizeYear = (raw: unknown): AcademicYearLevel => {
  if (!raw) return "All";
  const s = String(raw).trim().toLowerCase();
  if (s.includes("1st") || s === "1" || s.includes("first")) return "1st Year";
  if (s.includes("2nd") || s === "2" || s.includes("second")) return "2nd Year";
  if (s.includes("3rd") || s === "3" || s.includes("third")) return "3rd Year";
  if (s.includes("4th") || s === "4" || s.includes("fourth")) return "4th Year";
  return "All";
};

const CATEGORIES_STORAGE_KEY = "saral.academicCalendar.customCategories";

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
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isManageCategoryOpen, setIsManageCategoryOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState<AcademicYearLevel | "All">("All");

  const loadStoredCategories = (): CalendarCategory[] => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to load saved categories", e);
      }
    }
    return DEFAULT_CATEGORIES;
  };

  // Dynamic Categories State
  const [categories, setCategories] = useState<CalendarCategory[]>(loadStoredCategories);

  // Sync categories whenever window gains focus or storage changes
  useEffect(() => {
    const handleSync = () => {
      setCategories(loadStoredCategories());
    };
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Date calculation helpers for duration
  const computeEndDate = (startStr: string, dur: number | string): string => {
    if (!startStr) return "";
    const numDur = Math.max(1, Number(dur) || 1);
    const [y, m, d] = startStr.split("-").map(Number);
    const target = new Date(y, m - 1, d + numDur - 1);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const computeDuration = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 1;
    const [y1, m1, d1] = startStr.split("-").map(Number);
    const [y2, m2, d2] = endStr.split("-").map(Number);
    const t1 = new Date(y1, m1 - 1, d1).getTime();
    const t2 = new Date(y2, m2 - 1, d2).getTime();
    if (isNaN(t1) || isNaN(t2) || t2 < t1) return 1;
    const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  // Single Entry Form State
  const [eventForm, setEventForm] = useState<{
    dateStr: string; // YYYY-MM-DD
    duration: number | ""; // in days
    endDateStr: string; // YYYY-MM-DD
    title: string;
    category: string;
    isWorkingDay: boolean;
    description: string;
    applicableYear: AcademicYearLevel;
  }>({
    dateStr: new Date().toISOString().split("T")[0],
    duration: 1,
    endDateStr: new Date().toISOString().split("T")[0],
    title: "",
    category: "event",
    isWorkingDay: true,
    description: "",
    applicableYear: "All",
  });

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  // Helper to ensure any category from loaded events or imported files exists in `categories`
  const registerCategoryIfMissing = (catId: string, label?: string) => {
    const normalizedId = catId.trim().toLowerCase().replace(/\s+/g, "_");
    if (!normalizedId) return "event";

    setCategories((prev) => {
      if (prev.some((c) => c.id === normalizedId)) return prev;
      const palette = COLOR_PALETTES[prev.length % COLOR_PALETTES.length];
      const newCat: CalendarCategory = {
        id: normalizedId,
        label: label || catId.charAt(0).toUpperCase() + catId.slice(1),
        colorClass: palette.colorClass,
        dotColor: palette.dotColor,
        isCustom: true,
      };
      return [...prev, newCat];
    });

    return normalizedId;
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryLabel.trim();
    if (!trimmed) {
      toast({ title: "Category name required", description: "Please enter a name for the new category.", variant: "destructive" });
      return;
    }
    const id = trimmed.toLowerCase().replace(/\s+/g, "_");
    if (categories.some((c) => c.id === id)) {
      toast({ title: "Category already exists", description: `A category with the name "${trimmed}" already exists.`, variant: "destructive" });
      return;
    }
    const palette = COLOR_PALETTES[selectedPaletteIdx % COLOR_PALETTES.length];
    const newCat: CalendarCategory = {
      id,
      label: trimmed,
      colorClass: palette.colorClass,
      dotColor: palette.dotColor,
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
    setEventForm((prev) => ({ ...prev, category: id }));
    setNewCategoryLabel("");
    toast({ title: "Category Created", description: `"${trimmed}" category added successfully.` });
    setIsManageCategoryOpen(false);
  };

  const handleDeleteCategory = (catId: string) => {
    const inUse = events.some((e) => e.category.toLowerCase() === catId.toLowerCase());
    if (inUse) {
      toast({
        title: "Cannot delete category",
        description: "This category is currently assigned to one or more calendar events.",
        variant: "destructive",
      });
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (eventForm.category === catId) {
      setEventForm((prev) => ({ ...prev, category: categories[0]?.id || "event" }));
    }
    toast({ title: "Category Deleted", description: "Category removed successfully." });
  };

  // ── Load settings from server on mount ────────────────────────
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
              const rawCat = obj.category || "event";
              registerCategoryIfMissing(rawCat);

              return {
                date: parseInt(parts[2], 10),
                month: parseInt(parts[1], 10) - 1,
                year: parseInt(parts[0], 10),
                title: obj.title || "Untitled Event",
                description: obj.description || "",
                category: rawCat.toLowerCase(),
                isWorkingDay: obj.isWorkingDay !== false,
                applicableYear: normalizeYear(obj.applicableYear || obj.year || obj.targetYear),
              };
            } catch {
              // fallback below
            }
          }

          const parts = String(item).split("T")[0].split("-");
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const date = parseInt(parts[2], 10);
          return {
            date,
            month,
            year,
            title: "Holiday",
            category: "holiday",
            isWorkingDay: false,
            applicableYear: "All",
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
        applicableYear: evt.applicableYear || "All",
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
      toast({ title: "Calendar saved", description: "All events, categories, and calendar settings saved successfully." });
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

  // ── Dynamic Category Helpers ───────────────────────────────────────────────────────────
  const getCategory = (catId: string) => {
    const found = categories.find((c) => c.id.toLowerCase() === catId.toLowerCase());
    if (found) return found;
    return {
      id: catId,
      label: catId.charAt(0).toUpperCase() + catId.slice(1),
      colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
      dotColor: "bg-indigo-500",
    };
  };

  // ── Single Entry Form Actions (Add & Edit) ─────────────────────────────────────────────
  const openNewEntryForm = (presetDay?: number) => {
    const targetDate = presetDay
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), presetDay)
      : currentDate;

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(presetDay || targetDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    setEditingIndex(null);
    setEventForm({
      dateStr,
      duration: 1,
      endDateStr: dateStr,
      title: "",
      category: categories[0]?.id || "event",
      isWorkingDay: true,
      description: "",
      applicableYear: selectedYearFilter !== "All" ? selectedYearFilter : "All",
    });
    setIsEventDialogOpen(true);
  };

  const openEditEntryForm = (index: number) => {
    const evt = events[index];
    if (!evt) return;

    const yyyy = evt.year;
    const mm = String(evt.month + 1).padStart(2, "0");
    const dd = String(evt.date).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    setEditingIndex(index);
    setEventForm({
      dateStr,
      duration: 1,
      endDateStr: dateStr,
      title: evt.title,
      category: evt.category,
      isWorkingDay: evt.isWorkingDay,
      description: evt.description || "",
      applicableYear: evt.applicableYear || "All",
    });
    setIsEventDialogOpen(true);
  };

  const handleSaveEntry = () => {
    if (!eventForm.title.trim() || !eventForm.dateStr) {
      toast({ title: "Required Fields Missing", description: "Please enter an event title and select a date.", variant: "destructive" });
      return;
    }

    const [startY, startM, startD] = eventForm.dateStr.split("-").map(Number);
    const durationCount = Math.max(1, eventForm.duration || 1);
    const newEventsList: CalendarEvent[] = [];

    for (let i = 0; i < durationCount; i++) {
      const cur = new Date(startY, startM - 1, startD + i);
      newEventsList.push({
        date: cur.getDate(),
        month: cur.getMonth(),
        year: cur.getFullYear(),
        title: eventForm.title.trim(),
        category: eventForm.category,
        isWorkingDay: eventForm.isWorkingDay,
        description: eventForm.description.trim(),
        applicableYear: eventForm.applicableYear,
      });
    }

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < events.length) {
      setEvents((prev) => {
        const next = [...prev];
        next.splice(editingIndex, 1, ...newEventsList);
        return next;
      });
      toast({
        title: "Entry Updated",
        description: `"${eventForm.title}" updated${durationCount > 1 ? ` for ${durationCount} days` : ""}. Click Persist Changes to save.`,
      });
    } else {
      setEvents((prev) => [...prev, ...newEventsList]);
      toast({
        title: "Entry Added",
        description: `"${eventForm.title}" added${durationCount > 1 ? ` for ${durationCount} days (${eventForm.dateStr} to ${eventForm.endDateStr})` : ""} under category "${getCategory(eventForm.category).label}".`,
      });
    }

    if (startY !== currentDate.getFullYear() || (startM - 1) !== currentDate.getMonth()) {
      setCurrentDate(new Date(startY, startM - 1, 1));
    }

    setIsEventDialogOpen(false);
  };

  const removeEvent = (idx: number) => setEvents((prev) => prev.filter((_, i) => i !== idx));

  // ── Excel Export (Individual Year & All Years) ──────────────────────────────────────────
  const exportToExcel = (targetYear: AcademicYearLevel | "All") => {
    const exportedEvents = events.filter((evt) => {
      if (targetYear === "All") return true;
      return evt.applicableYear === targetYear || evt.applicableYear === "All" || !evt.applicableYear;
    });

    if (exportedEvents.length === 0) {
      toast({
        title: "No events to export",
        description: `There are no events registered for ${targetYear === "All" ? "any year" : targetYear}.`,
        variant: "destructive",
      });
      return;
    }

    const sorted = [...exportedEvents].sort((a, b) => a.year - b.year || a.month - b.month || a.date - b.date);

    const dataRows = sorted.map((evt) => {
      const d = new Date(evt.year, evt.month, evt.date);
      const dateStr = `${evt.year}-${String(evt.month + 1).padStart(2, "0")}-${String(evt.date).padStart(2, "0")}`;
      const dayName = dayNames[d.getDay()];
      const catObj = getCategory(evt.category);
      return {
        "Date (YYYY-MM-DD)": dateStr,
        "Day": dayName,
        "Month": monthNames[evt.month],
        "Year": evt.year,
        "Title": evt.title,
        "Applicable Year": evt.applicableYear || "All Years",
        "Category": catObj.label,
        "Is Working Day": evt.isWorkingDay ? "Yes" : "No",
        "Description": evt.description || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);

    const colWidths = [
      { wch: 18 }, // Date
      { wch: 8 },  // Day
      { wch: 12 }, // Month
      { wch: 8 },  // Year
      { wch: 28 }, // Title
      { wch: 16 }, // Applicable Year
      { wch: 16 }, // Category
      { wch: 15 }, // Is Working Day
      { wch: 35 }, // Description
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetTitle = targetYear === "All" ? "Academic Calendar" : `${targetYear} Calendar`;
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));

    const sessionName = currentAcademicSession
      ? ((currentAcademicSession as any).session_name ?? (currentAcademicSession as any).name ?? currentAcademicSession.id)
      : "Calendar";

    const fileName =
      targetYear === "All"
        ? `Academic_Calendar_${String(sessionName).replace(/[^a-zA-Z0-9_-]/g, "_")}_All_Years.xlsx`
        : `Academic_Calendar_${String(sessionName).replace(/[^a-zA-Z0-9_-]/g, "_")}_${targetYear.replace(/\s+/g, "_")}.xlsx`;

    XLSX.writeFile(wb, fileName);

    toast({
      title: "Calendar Exported Successfully",
      description: `Exported ${sorted.length} events for ${targetYear === "All" ? "All Years" : targetYear} to ${fileName}`,
    });
  };

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
            const rawYearLevel = row["Applicable Year"] ?? row["Year Level"] ?? row["Target Year"] ?? row["year_level"] ?? row["Year"] ?? row["year"];
            const rawCat = String(row["Category"] ?? row["category"] ?? "event").trim();
            const registeredCatId = registerCategoryIfMissing(rawCat);

            return {
              date: dateObj.getDate(),
              month: dateObj.getMonth(),
              year: dateObj.getFullYear(),
              isWorkingDay: String(row["Is Working Day (Yes/No)"] ?? row["Is Working Day"] ?? row["IsWorkingDay"] ?? "yes").toLowerCase() === "yes",
              category: registeredCatId,
              title: row["Title"] ?? row["title"] ?? "Untitled Event",
              description: row["Description"] ?? row["description"] ?? "",
              applicableYear: normalizeYear(rawYearLevel),
            } as CalendarEvent;
          })
          .filter(Boolean) as CalendarEvent[];
        setEvents((prev) => [...prev, ...newEvents]);
        toast({ title: "Import Successful", description: `Imported ${newEvents.length} events with dynamic categories & years.` });
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
      {
        "Date (YYYY-MM-DD)": "2026-04-14",
        "Is Working Day (Yes/No)": "No",
        "Category": "Holiday",
        "Applicable Year": "All Years",
        "Title": "Ambedkar Jayanti",
        "Description": "General Public Holiday for all batches",
      },
      {
        "Date (YYYY-MM-DD)": "2026-04-20",
        "Is Working Day (Yes/No)": "Yes",
        "Category": "Exam",
        "Applicable Year": "1st Year",
        "Title": "1st BHMS Anatomy Terminal Exam",
        "Description": "Written examination for 1st year students",
      },
      {
        "Date (YYYY-MM-DD)": "2026-04-22",
        "Is Working Day (Yes/No)": "Yes",
        "Category": "Exam",
        "Applicable Year": "2nd Year",
        "Title": "2nd BHMS Pathology Exam",
        "Description": "Theory and practical assessment",
      },
      {
        "Date (YYYY-MM-DD)": "2026-04-25",
        "Is Working Day (Yes/No)": "Yes",
        "Category": "Clinical Posting",
        "Applicable Year": "3rd Year",
        "Title": "3rd BHMS Hospital Clinical Rotation",
        "Description": "Clinical and bedside viva at OPD",
      },
      {
        "Date (YYYY-MM-DD)": "2026-04-28",
        "Is Working Day (Yes/No)": "Yes",
        "Category": "Seminar",
        "Applicable Year": "4th Year",
        "Title": "4th BHMS Practice of Medicine National Seminar",
        "Description": "Guest lecture and interactive case study presentation",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    ws["!cols"] = [
      { wch: 18 }, // Date
      { wch: 22 }, // Working day
      { wch: 18 }, // Category
      { wch: 18 }, // Applicable Year
      { wch: 35 }, // Title
      { wch: 45 }, // Description
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Academic Calendar Template");
    XLSX.writeFile(wb, "Academic_Calendar_Template_With_Categories.xlsx");
  };

  // ── Derived Stats Summary ───────────────────────────────────────────────────────────────
  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: events.length,
      "1st Year": 0,
      "2nd Year": 0,
      "3rd Year": 0,
      "4th Year": 0,
    };
    events.forEach((e) => {
      const yr = e.applicableYear || "All";
      if (yr === "1st Year") counts["1st Year"]++;
      else if (yr === "2nd Year") counts["2nd Year"]++;
      else if (yr === "3rd Year") counts["3rd Year"]++;
      else if (yr === "4th Year") counts["4th Year"]++;
    });
    return counts;
  }, [events]);

  const totalHolidaysCount = useMemo(() => {
    return events.filter((e) => !e.isWorkingDay).length;
  }, [events]);

  const scheduledEventsCount = useMemo(() => {
    return events.filter((e) => e.isWorkingDay).length;
  }, [events]);

  // ── Filter events for calendar cells & sidebar ──────────────────────────────────────────
  const isEventMatchingYear = (evt: CalendarEvent, filter: AcademicYearLevel | "All") => {
    if (filter === "All") return true;
    return evt.applicableYear === filter || evt.applicableYear === "All" || !evt.applicableYear;
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesYear = isEventMatchingYear(evt, selectedYearFilter);
        const matchesCategory =
          selectedFilterCategory === "all" || evt.category.toLowerCase() === selectedFilterCategory.toLowerCase();
        const matchesSearch =
          evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (evt.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (evt.applicableYear || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          getCategory(evt.category).label.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesYear && matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.year - b.year || a.month - b.month || a.date - b.date);
  }, [events, selectedYearFilter, selectedFilterCategory, searchQuery, categories]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Academic Calendar</h1>
            <Badge variant="outline" className="text-xs font-bold text-blue-700 bg-blue-50 border-blue-200">
              Years 1, 2, 3, 4
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            {currentAcademicSession
              ? `Active Term Session: ${(currentAcademicSession as any).session_name ?? (currentAcademicSession as any).name ?? currentAcademicSession.id}`
              : "No active academic session"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />

          {/* Single Entry Button */}
          {!isTeacher && (
            <Button
              onClick={() => openNewEntryForm()}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg font-semibold"
            >
              <Plus className="h-4 w-4" /> Add Event Entry
            </Button>
          )}

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-sm rounded-lg font-semibold"
              >
                <Download className="h-4 w-4" /> Export Calendar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 shadow-lg bg-white border border-slate-200">
              <DropdownMenuLabel className="text-xs text-slate-500 font-bold px-2 py-1 flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export Options (.xlsx)
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => exportToExcel("All")}
                className="cursor-pointer font-medium text-sm py-2 rounded-lg hover:bg-slate-100"
              >
                <Layers className="h-4 w-4 mr-2 text-slate-700" />
                All Years (Complete Sheet)
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-slate-100" />
              <DropdownMenuItem
                onClick={() => exportToExcel("1st Year")}
                className="cursor-pointer font-medium text-sm py-2 rounded-lg hover:bg-blue-50 text-blue-700"
              >
                <span className="h-2 w-2 rounded-full bg-blue-600 mr-2" />
                1st Year Calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToExcel("2nd Year")}
                className="cursor-pointer font-medium text-sm py-2 rounded-lg hover:bg-emerald-50 text-emerald-700"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-600 mr-2" />
                2nd Year Calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToExcel("3rd Year")}
                className="cursor-pointer font-medium text-sm py-2 rounded-lg hover:bg-amber-50 text-amber-700"
              >
                <span className="h-2 w-2 rounded-full bg-amber-600 mr-2" />
                3rd Year Calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToExcel("4th Year")}
                className="cursor-pointer font-medium text-sm py-2 rounded-lg hover:bg-purple-50 text-purple-700"
              >
                <span className="h-2 w-2 rounded-full bg-purple-600 mr-2" />
                4th Year Calendar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isTeacher && (
            <>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm rounded-lg"
              >
                <Download className="h-4 w-4" /> Template
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
                className="gap-2 bg-slate-900 hover:bg-black text-white shadow-sm rounded-lg font-semibold"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Persist Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── YEAR SELECTION TABS BAR ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-600 shrink-0 ml-1" />
          <span className="font-bold text-sm text-slate-800">Filter Calendar by Year:</span>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {YEAR_OPTIONS.map((opt) => {
            const isSelected = selectedYearFilter === opt.value;
            const count = opt.value === "All" ? events.length : yearCounts[opt.value] || 0;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedYearFilter(opt.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SUMMARY STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-200/60 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                Holidays
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-4">{totalHolidaysCount}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Non-working dates across session</p>
          </CardContent>
        </Card>

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

        <Card className="border border-slate-200/60 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Categories
              </span>
              {!isTeacher && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManageCategoryOpen(true)}
                  className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-2"
                >
                  <Settings2 className="h-3.5 w-3.5 mr-1" /> Manage
                </Button>
              )}
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-3 truncate">
              {categories.length} Categories
            </div>
            <div className="text-[11px] text-slate-500 mt-3 font-semibold space-y-1">
              <div>Filtered: {filteredEvents.length} items</div>
              <div>Total: {events.length} entries</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN WORKSPACE: CALENDAR GRID & EVENTS SIDEBAR ── */}
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

              <div className="flex items-center gap-2">
                {selectedYearFilter !== "All" && (
                  <Badge variant="secondary" className="font-bold text-xs bg-slate-100 text-slate-800">
                    Showing: {selectedYearFilter} + Common
                  </Badge>
                )}
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-lg h-9 w-9 border border-slate-200 hover:bg-slate-100">
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-lg h-9 w-9 border border-slate-200 hover:bg-slate-100">
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </Button>
                </div>
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

                  const rawDayEvents = events.filter(
                    (e) => e.date === day && e.month === currentDate.getMonth() && e.year === currentDate.getFullYear()
                  );

                  const dayEvents = rawDayEvents.filter((e) => isEventMatchingYear(e, selectedYearFilter));

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
                      onClick={() => !isTeacher && openNewEntryForm(day)}
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
                        {dayEvents.map((evt, idx) => {
                          const yearOpt = YEAR_OPTIONS.find((y) => y.value === evt.applicableYear);
                          const catObj = getCategory(evt.category);
                          return (
                            <div
                              key={idx}
                              className={`text-[9px] font-bold px-1 py-0.5 rounded border truncate flex items-center justify-between gap-1 ${catObj.colorClass}`}
                            >
                              <span className="truncate">{evt.title}</span>
                              {evt.applicableYear && evt.applicableYear !== "All" && (
                                <span className={`text-[7px] px-1 rounded font-extrabold shrink-0 ${yearOpt?.badgeBg ?? "bg-slate-100 text-slate-600"}`}>
                                  {yearOpt?.shortLabel ?? evt.applicableYear}
                                </span>
                              )}
                            </div>
                          );
                        })}
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

        {/* ── RIGHT COLUMN: EVENTS SIDEBAR ── */}
        <div>
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white h-full flex flex-col min-h-[600px]">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-200/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Events ({filteredEvents.length})
                </CardTitle>
                {!isTeacher && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openNewEntryForm()}
                    className="gap-1.5 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Entry
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col space-y-5">
              {/* Search & Dynamic Category Filter Pills */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search events, categories, years..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-lg border-slate-200 focus-visible:ring-primary focus-visible:border-transparent font-medium"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedFilterCategory("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      selectedFilterCategory === "all"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedFilterCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        selectedFilterCategory === cat.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${cat.dotColor}`} />
                      {cat.label}
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
                      <p className="text-[10px] text-slate-400">Click &quot;New Entry&quot; above to create one</p>
                    </div>
                  ) : (
                    filteredEvents.map((evt, idx) => {
                      const origIdx = events.findIndex((e) => e === evt);
                      const yearOpt = YEAR_OPTIONS.find((y) => y.value === evt.applicableYear);
                      const catObj = getCategory(evt.category);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="flex gap-3 items-start p-3.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 group"
                        >
                          <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${catObj.colorClass}`}
                          >
                            <Info className="h-4.5 w-4.5" />
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 truncate text-sm">{evt.title}</h4>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold border ${catObj.colorClass}`}>
                                  {catObj.label}
                                </span>
                                <span
                                  className={`text-[8px] px-2 py-0.5 rounded font-extrabold border ${
                                    yearOpt?.badgeBg ?? "bg-slate-100 text-slate-700"
                                  } ${yearOpt?.badgeBorder ?? "border-slate-200"}`}
                                >
                                  {evt.applicableYear || "All Years"}
                                </span>
                              </div>
                            </div>
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
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => openEditEntryForm(origIdx)}
                                title="Edit Entry"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                onClick={() => removeEvent(origIdx)}
                                title="Delete Entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

      {/* ── SINGLE ENTRY MODAL FORM (ADD & EDIT) ── */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="rounded-xl p-6 max-w-lg border border-slate-200 shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              {editingIndex !== null ? "Edit Calendar Entry" : "Add Calendar Entry"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingIndex !== null
                ? "Update the details and target year for this calendar event."
                : "Create a single academic event, exam date, or holiday for specific or all years."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Event Category & Target Year Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs text-slate-700">Category *</Label>
                  <button
                    type="button"
                    onClick={() => setIsManageCategoryOpen(true)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> New
                  </button>
                </div>
                <Select
                  value={eventForm.category}
                  onValueChange={(v) => setEventForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 font-medium text-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${cat.dotColor}`} />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-xs text-slate-700">Target Year Level *</Label>
                <Select
                  value={eventForm.applicableYear}
                  onValueChange={(v: AcademicYearLevel) => setEventForm((p) => ({ ...p, applicableYear: v }))}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 font-medium text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {YEAR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Event Title */}
            <div className="space-y-1">
              <Label className="font-bold text-xs text-slate-700">Event Title *</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. 1st BHMS Anatomy Terminal Exam, Diwali Vacation"
                className="h-10 rounded-lg border-slate-200 focus-visible:ring-primary focus-visible:border-transparent font-medium text-sm"
                autoFocus
              />
            </div>

            {/* Date, Duration & End Date */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold text-xs text-slate-700">Start Date *</Label>
                  <Input
                    type="date"
                    value={eventForm.dateStr}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEventForm((p) => ({
                        ...p,
                        dateStr: newStart,
                        endDateStr: computeEndDate(newStart, p.duration),
                      }));
                    }}
                    className="h-10 rounded-lg border-slate-200 bg-white font-medium text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-bold text-xs text-slate-700">Duration (Days) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={eventForm.duration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setEventForm((p) => ({
                          ...p,
                          duration: "",
                          endDateStr: computeEndDate(p.dateStr, 1),
                        }));
                        return;
                      }
                      const parsed = parseInt(val, 10);
                      const dur = isNaN(parsed) ? 1 : Math.max(1, parsed);
                      setEventForm((p) => ({
                        ...p,
                        duration: dur,
                        endDateStr: computeEndDate(p.dateStr, dur),
                      }));
                    }}
                    className="h-10 rounded-lg border-slate-200 bg-white font-medium text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-bold text-xs text-slate-700">End Date</Label>
                  <Input
                    type="date"
                    min={eventForm.dateStr}
                    value={eventForm.endDateStr}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const dur = computeDuration(eventForm.dateStr, newEnd);
                      setEventForm((p) => ({
                        ...p,
                        endDateStr: newEnd,
                        duration: dur,
                      }));
                    }}
                    className="h-10 rounded-lg border-slate-200 bg-white font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Working Day vs Non-working Day toggle */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Switch
                checked={eventForm.isWorkingDay}
                onCheckedChange={(v) => setEventForm((p) => ({ ...p, isWorkingDay: v }))}
                className="data-[state=checked]:bg-blue-600"
              />
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {eventForm.isWorkingDay ? "Working Day (Classes / Exams Scheduled)" : "Non-Working Day / Holiday"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {eventForm.isWorkingDay
                    ? "Timetable and attendance can be taken on this day."
                    : "Blocks timetables and attendance marking for this day."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2 sm:flex-row flex-col">
            <Button
              variant="outline"
              onClick={() => setIsEventDialogOpen(false)}
              className="rounded-lg flex-1 h-10 border font-bold text-sm"
            >
              <X className="mr-1.5 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleSaveEntry}
              disabled={!eventForm.title.trim() || !eventForm.dateStr}
              className="rounded-lg flex-1 h-10 bg-blue-600 hover:bg-blue-700 font-bold shadow-sm text-white text-sm"
            >
              {editingIndex !== null ? (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Update Entry
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" /> Add to Calendar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MANAGE CATEGORIES MODAL ── */}
      <Dialog open={isManageCategoryOpen} onOpenChange={setIsManageCategoryOpen}>
        <DialogContent className="rounded-xl p-6 max-w-md border border-slate-200 shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Manage Event Categories
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add new custom categories with custom color badges, or view and manage existing categories.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* New Category Form */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <Label className="font-bold text-xs text-slate-700">Add New Category</Label>
              <div className="space-y-2">
                <Input
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="e.g. Sports Day, Guest Lecture, Practical Exam"
                  className="h-9 rounded-lg border-slate-200 font-medium text-sm bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Select Color Theme:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTES.map((pal, idx) => (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() => setSelectedPaletteIdx(idx)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition-all ${
                          selectedPaletteIdx === idx
                            ? "ring-2 ring-blue-500 ring-offset-1 border-blue-400 bg-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${pal.dotColor}`} />
                        <span className="text-[10px] text-slate-700">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryLabel.trim()}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg mt-1"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
                </Button>
              </div>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <Label className="font-bold text-xs text-slate-700">Existing Categories ({categories.length})</Label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${cat.dotColor}`} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cat.colorClass}`}>
                        {cat.label}
                      </span>
                    </div>
                    {cat.isCustom && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="h-6 w-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsManageCategoryOpen(false)}
              className="w-full rounded-lg h-9 font-bold text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
