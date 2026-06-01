"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SaralDatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  disableFutureDates?: boolean
  disablePastDates?: boolean
  fromYear?: number
  toYear?: number
  /**
   * When true (default), the picker disables dates that are non-working per the
   * Academic Calendar (holidays, Sundays, non-working Saturdays).
   * Set to false to allow selecting any date regardless of the calendar.
   */
  disableAcademicCalendarDates?: boolean
}

export function SaralDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  disableFutureDates = false,
  disablePastDates = false,
  fromYear,
  toYear,
  disableAcademicCalendarDates = true,
}: SaralDatePickerProps) {

  /**
   * Only handle future/past restrictions here.
   * Academic Calendar restrictions are delegated to the Calendar component,
   * so it can apply the custom 'holiday' styling.
   */
  const isDateDisabled = React.useCallback(
    (d: Date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (disableFutureDates && d > today) return true
      if (disablePastDates && d < today) return true
      
      // If caller passed a custom `disabled` boolean or function, we merge it below
      if (typeof disabled === "boolean" && disabled) return true

      return false
    },
    [disableFutureDates, disablePastDates, disabled]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-9 justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled === true}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={isDateDisabled}
          disableAcademicCalendarDates={disableAcademicCalendarDates}
          initialFocus
          fromYear={fromYear}
          toYear={toYear}
        />
      </PopoverContent>
    </Popover>
  )
}
