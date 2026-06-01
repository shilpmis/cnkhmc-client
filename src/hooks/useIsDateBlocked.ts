/**
 * useIsDateBlocked
 *
 * Central hook for checking whether a date is a non-working day.
 * Uses the academic calendar Redux state (populated by AdminLayout on login,
 * or by AcademicCalendar page when user edits settings).
 *
 * Returns:
 *   isBlocked(date)  — true if the date is a holiday / non-working
 *   nonWorkingDates  — the raw YYYY-MM-DD list
 *   isSaturdayWorking — the Saturday toggle value
 *   blockedCount     — total number of explicitly marked non-working dates
 */
import { useMemo } from "react"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import {
  selectNonWorkingDates,
  selectIsSaturdayWorking,
} from "@/redux/slices/academicCalendarSlice"

export function useIsDateBlocked() {
  const nonWorkingDates = useAppSelector(selectNonWorkingDates)
  const isSaturdayWorking = useAppSelector(selectIsSaturdayWorking)

  // Build a fast lookup Set once per nonWorkingDates reference change
  const nonWorkingSet = useMemo(
    () => new Set(nonWorkingDates || []),
    [nonWorkingDates]
  )

  const isBlocked = useMemo(
    () =>
      (date: Date | undefined | null): boolean => {
        if (!date) return false

        const local = new Date(date)

        // Sundays always blocked
        if (local.getDay() === 0) return true

        // Saturdays blocked when configured as non-working
        if (!isSaturdayWorking && local.getDay() === 6) return true

        // Explicit holiday from academic calendar
        // Check local representation
        const y = local.getFullYear()
        const m = String(local.getMonth() + 1).padStart(2, "0")
        const d = String(local.getDate()).padStart(2, "0")
        const localKey = `${y}-${m}-${d}`

        // Check UTC representation to perfectly capture timezone-constructed dates
        const yUtc = date.getUTCFullYear()
        const mUtc = String(date.getUTCMonth() + 1).padStart(2, "0")
        const dUtc = String(date.getUTCDate()).padStart(2, "0")
        const utcKey = `${yUtc}-${mUtc}-${dUtc}`

        return nonWorkingSet.has(localKey) || nonWorkingSet.has(utcKey)
      },
    [nonWorkingSet, isSaturdayWorking]
  )

  return {
    isBlocked,
    nonWorkingDates,
    isSaturdayWorking,
    blockedCount: (nonWorkingDates || []).length,
  }
}
