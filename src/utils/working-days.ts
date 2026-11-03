/** Local YYYY-MM-DD, unlike toISOString() which shifts the date back a day east of UTC. */
export const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Academic calendar `non_working_dates` holds plain YYYY-MM-DD strings (old records) or JSON
 * strings such as {"date":"2026-10-20","isWorkingDay":false,"applicableYear":"All"}.
 * Returns the dates that are off for every year; year-specific events are not included.
 */
export const parseNonWorkingDates = (raw: unknown): Set<string> => {
  const dates = new Set<string>()
  if (!Array.isArray(raw)) return dates

  for (const item of raw) {
    if (typeof item === "string" && item.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(item)
        const appliesToAll = !parsed.applicableYear || parsed.applicableYear === "All"
        if (parsed.date && parsed.isWorkingDay === false && appliesToAll) {
          dates.add(String(parsed.date).split("T")[0])
        }
      } catch {
        // skip malformed entry
      }
    } else if (item) {
      dates.add(String(item).split("T")[0])
    }
  }
  return dates
}
