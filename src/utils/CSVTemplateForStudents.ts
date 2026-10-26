import { STUDENT_HEADERS } from "@/utils/studentColumns"

/**
 * Blank upload template with the final student heads. Every institution uses the same heads.
 * CLASS, FULL NAME and ADMISSION_QUOTA are filled in by the system on export; the quota is matched
 * by name on import and the rest are ignored.
 */
export const downloadCSVTemplate = (_type: "SCHOOL" | "COLLEGE" = "SCHOOL") => {
  try {
    const BOM = "﻿" // UTF-8 BOM
    const csvContent = `${STUDENT_HEADERS.map((h) => (/[",\n]/.test(h) ? `"${h.replace(/"/g, '""')}"` : h)).join(",")}\n`

    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "student_upload_template.csv")
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading CSV template:", error)
    alert("Failed to download the CSV template. Please try again later.")
  }
}
