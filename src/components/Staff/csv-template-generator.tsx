"use client"

/**
 * This component generates CSV templates for staff data uploads
 */

export function generateTeachingStaffCSV(): string {
  // Define the CSV header row
  const headers = [
    "first_name",
    "middle_name",
    "last_name",
    "first_name_in_guj",
    "middle_name_in_guj",
    "last_name_in_guj",
    "gender",
    "birth_date",
    "aadhar_no",
    "mobile_number",
    "email",
    "qualification",
    "subject_specialization",
    "religion",
    "caste",
    "category",
    "address",
    "district",
    "city",
    "state",
    "postal_code",
    "bank_name",
    "account_no",
    "IFSC_code",
    "joining_date",
    "employment_status",
  ].join(",")

  // Add a sample row with example data
  const sampleRow = [
    "John",
    "M",
    "Doe",
    "જોન",
    "એમ",
    "ડો",
    "Male",
    "1985-06-15",
    "123456789012",
    "9876543210",
    "john.doe@example.com",
    "B.Ed",
    "Mathematics",
    "Hindu",
    "General",
    "OPEN",
    "123 Main Street",
    "Ahmedabad",
    "Ahmedabad",
    "Gujarat",
    "380001",
    "State Bank of India",
    "12345678901234",
    "SBIN0001234",
    "2020-06-01",
    "Active",
  ].join(",")

  // Add an empty row for the user to fill
  const emptyRow = Array(headers.split(",").length).fill("").join(",")

  // Combine all rows
  return `${headers}\n${sampleRow}\n${emptyRow}`
}

export function generateNonTeachingStaffCSV(): string {
  // Define the CSV header row
  const headers = [
    "first_name",
    "middle_name",
    "last_name",
    "first_name_in_guj",
    "middle_name_in_guj",
    "last_name_in_guj",
    "gender",
    "birth_date",
    "aadhar_no",
    "mobile_number",
    "email",
    "role",
    "department",
    "religion",
    "caste",
    "category",
    "address",
    "district",
    "city",
    "state",
    "postal_code",
    "bank_name",
    "account_no",
    "IFSC_code",
    "joining_date",
    "employment_status",
  ].join(",")

  // Add a sample row with example data
  const sampleRow = [
    "Jane",
    "A",
    "Smith",
    "જેન",
    "એ",
    "સ્મિથ",
    "Female",
    "1990-03-25",
    "123456789012",
    "9876543210",
    "jane.smith@example.com",
    "Clerk",
    "Administration",
    "Hindu",
    "General",
    "OPEN",
    "456 Park Avenue",
    "Ahmedabad",
    "Ahmedabad",
    "Gujarat",
    "380001",
    "Bank of Baroda",
    "98765432109876",
    "BARB0AHMEDX",
    "2019-08-15",
    "Active",
  ].join(",")

  // Add an empty row for the user to fill
  const emptyRow = Array(headers.split(",").length).fill("").join(",")

  // Combine all rows
  return `${headers}\n${sampleRow}\n${emptyRow}`
}

export function downloadCSVTemplate(staffType: "teaching" | "non-teaching") {
  // Generate the appropriate CSV content
  const csvContent = staffType === "teaching" ? generateTeachingStaffCSV() : generateNonTeachingStaffCSV()

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Create a download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `${staffType}-staff-template.csv`)

  // Append to the document, click, and clean up
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

