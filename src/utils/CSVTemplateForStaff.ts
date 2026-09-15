export function generateTeachingStaffCSV(): string {
  const headers = [
    "Sr.","Employee ID","Title","Name","Short Name","DOB","Current Address","Permenant Address",
    "District","State","Pin code No.","Mobile No.","Category","Religion","Minority","Nationality",
    "Gender","Maritial Status","Child","E-Mail","Designation","Type Of Staff","Staff Category",
    "Department","Nature of appointment","Designation on the DOA","Date Of Appointment","DOJ",
    "Date Of Promotion","Experience till Date","Blood Group","Qualification","Registration Authority",
    "Registration Number","Registration Date","Name Of Council","MD Subject Name",
    "Qulification College","Qulification University","Date of Passing","Bank Account No.","Bank IFSC Code",
    "Bank Name","Branch Address/Number/email","Aadhar Card","Pan Card","Voter Id Number",
    "Uni. Approval Date","Uni. Approval Number","Driving Licence","Driving license expiry date",
    "EPF A/C No.","UAN No.","Employee Status"
  ].join(",")

  const sampleRow = [
    "1", "EMP001", "Mr.", "John M Doe", "JD", "1985-06-15", "123 Main Street", "123 Main Street",
    "Ahmedabad", "Gujarat", "380001", "9876543210", "OPEN", "Hindu", "No", "Indian",
    "Male", "Married", "2", "john.doe@example.com", "Principal", "Teaching", "Full Time",
    "Mathematics", "Permanent", "Teacher", "2020-05-01", "2020-06-01",
    "", "10", "O+", "B.Ed", "State Council",
    "REG123", "2010-01-01", "Medical Council", "Anatomy",
    "ABC College", "XYZ University", "2010-05-01", "12345678901234", "SBIN0001234",
    "State Bank of India", "Main Branch", "123456789012", "ABCDE1234F", "VOT1234567",
    "2020-04-15", "UNI123", "DL123456", "2030-01-01",
    "EPF123", "UAN123", "Permanent"
  ].join(",")

  const emptyRow = Array(headers.split(",").length).fill("").join(",")
  return `${headers}\n${sampleRow}\n${emptyRow}`
}

export function generateNonTeachingStaffCSV(): string {
  const headers = [
    "Sr.","Employee ID","Title","Name","Short Name","DOB","Current Address","Permenant Address",
    "District","State","Pin code No.","Mobile No.","Category","Religion","Minority","Nationality",
    "Gender","Maritial Status","Child","E-Mail","Designation","Type Of Staff","Staff Category",
    "Department","Nature of appointment","Designation on the DOA","Date Of Appointment","DOJ",
    "Date Of Promotion","Experience till Date","Blood Group","Qualification","Registration Authority",
    "Registration Number","Registration Date","Name Of Council","MD Subject Name",
    "Qulification College","Qulification University","Date of Passing","Bank Account No.","Bank IFSC Code",
    "Bank Name","Branch Address/Number/email","Aadhar Card","Pan Card","Voter Id Number",
    "Uni. Approval Date","Uni. Approval Number","Driving Licence","Driving license expiry date",
    "EPF A/C No.","UAN No.","Employee Status"
  ].join(",")

  const sampleRow = [
    "2", "EMP002", "Mrs.", "Jane A Smith", "JS", "1990-03-25", "456 Park Avenue", "456 Park Avenue",
    "Ahmedabad", "Gujarat", "380001", "9876543210", "OPEN", "Hindu", "No", "Indian",
    "Female", "Married", "1", "jane.smith@example.com", "Clerk", "Non-Teaching", "Full Time",
    "Administration", "Permanent", "Clerk", "2019-07-01", "2019-08-15",
    "", "5", "A+", "B.Com", "",
    "", "", "", "", "",
    "", "", "", "98765432109876", "BARB0AHMEDX",
    "Bank of Baroda", "City Branch", "123456789012", "ABCDE1234F", "VOT1234567",
    "", "", "", "",
    "", "", "Permanent"
  ].join(",")

  const emptyRow = Array(headers.split(",").length).fill("").join(",")
  return `${headers}\n${sampleRow}\n${emptyRow}`
}

export function generateHospitalStaffCSV(): string {
  const headers = [
    "Sr.","Employee ID","Title","Name","Short Name","DOB","Current Address","Permenant Address",
    "District","State","Pin code No.","Mobile No.","Category","Religion","Minority","Nationality",
    "Gender","Maritial Status","Child","E-Mail","Designation","Type Of Staff","Staff Category",
    "Department","Nature of appointment","Designation on the DOA","Date Of Appointment","DOJ",
    "Date Of Promotion","Experience till Date","Blood Group","Qualification","Registration Authority",
    "Registration Number","Registration Date","Name Of Council","MD Subject Name",
    "Qulification College","Qulification University","Date of Passing","Bank Account No.","Bank IFSC Code",
    "Bank Name","Branch Address/Number/email","Aadhar Card","Pan Card","Voter Id Number",
    "Uni. Approval Date","Uni. Approval Number","Driving Licence","Driving license expiry date",
    "EPF A/C No.","UAN No.","Employee Status"
  ].join(",")

  const sampleRow = [
    "3", "EMP003", "Dr.", "Sarah K Patel", "SP", "1988-11-20", "789 Clinic Road", "789 Clinic Road",
    "Ahmedabad", "Gujarat", "380001", "9876543210", "OPEN", "Hindu", "No", "Indian",
    "Female", "Single", "0", "sarah.patel@example.com", "Hospital Staff", "Hospital Staff", "Hospital Staff",
    "Hospital", "Permanent", "Hospital Staff", "2021-02-01", "2021-02-15",
    "", "8", "B+", "Others", "State Council",
    "REG789", "2012-05-10", "Homoeopathic Council", "",
    "Medical College", "State University", "2012-04-15", "11223344556677", "ICIC0007890",
    "ICICI Bank", "Hospital Branch", "123456789012", "ABCDE1234F", "VOT1234567",
    "", "", "", "",
    "", "", "Permanent"
  ].join(",")

  const emptyRow = Array(headers.split(",").length).fill("").join(",")
  return `${headers}\n${sampleRow}\n${emptyRow}`
}

export function downloadCSVTemplate(staffType: "teaching" | "non-teaching" | "hospital") {
  const csvContent =
    staffType === "teaching"
      ? generateTeachingStaffCSV()
      : staffType === "hospital"
        ? generateHospitalStaffCSV()
        : generateNonTeachingStaffCSV()

  try {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${staffType}-staff-template.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading CSV template For Staff:", error);
    alert("Failed to download the CSV template. Please try again later.");
  }
}
