import type React from "react"
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer"
import gujFonts from "../Students/gujarat_noto_sans.ttf"

// Register fonts for both English and Gujarati support
Font.register({
  family: "NotoSansGujarati",
  src: gujFonts,
})

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
})

// Create PDF Styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontFamily: "Roboto",
    backgroundColor: "#FFFFFF",
    fontSize: 9,
    color: "#1F2937",
    lineHeight: 1.35,
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1E3A8A",
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  schoolName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1E3A8A",
    textTransform: "uppercase",
    lineHeight: 1.2,
  },
  schoolTrust: {
    fontSize: 8.5,
    color: "#334155",
    marginTop: 2,
    fontWeight: 500,
  },
  schoolAddress: {
    fontSize: 7.5,
    color: "#64748B",
    marginTop: 1.5,
  },
  profileHeaderCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  avatarInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    borderWidth: 1.5,
    borderColor: "#93C5FD",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1E40AF",
  },
  profileMeta: {
    marginLeft: 10,
    flex: 1,
  },
  nameEn: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0F172A",
  },
  nameGuj: {
    fontSize: 10,
    fontFamily: "NotoSansGujarati",
    color: "#475569",
    marginTop: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#EFF6FF",
    borderWidth: 0.5,
    borderColor: "#BFDBFE",
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    fontSize: 7.5,
    color: "#1E40AF",
    fontWeight: 700,
  },
  tagSecondary: {
    backgroundColor: "#F1F5F9",
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    fontSize: 7.5,
    color: "#334155",
    fontWeight: 500,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    color: "#1E3A8A",
    backgroundColor: "#F1F5F9",
    borderLeftWidth: 3,
    borderLeftColor: "#1E3A8A",
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col2: {
    width: "50%",
    paddingRight: 6,
    marginBottom: 3.5,
  },
  col3: {
    width: "33.33%",
    paddingRight: 5,
    marginBottom: 3.5,
  },
  col4: {
    width: "25%",
    paddingRight: 4,
    marginBottom: 3.5,
  },
  colFull: {
    width: "100%",
    marginBottom: 3.5,
  },
  label: {
    fontSize: 7.5,
    color: "#64748B",
    fontWeight: 500,
  },
  value: {
    fontSize: 8.5,
    color: "#0F172A",
    fontWeight: 500,
    marginTop: 0.5,
  },
  valueGuj: {
    fontSize: 8.5,
    fontFamily: "NotoSansGujarati",
    color: "#0F172A",
    marginTop: 0.5,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 3,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableRowAlternate: {
    backgroundColor: "#F8FAFC",
  },
  tableCell: {
    fontSize: 7.5,
    color: "#1E293B",
  },
  continuationBanner: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  continuationText: {
    fontSize: 8,
    color: "#334155",
  },
  signatureSection: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 16,
  },
  signatureBox: {
    width: "30%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#475569",
    borderStyle: "dashed",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#334155",
    textAlign: "center",
  },
  signatureSub: {
    fontSize: 7,
    color: "#64748B",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 15,
    left: 28,
    right: 28,
    borderTopWidth: 0.5,
    borderTopColor: "#CBD5E1",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94A3B8",
  },
})

const formatDate = (val: any): string => {
  if (!val) return "-"
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return String(val)
  }
}

const formatVal = (val: any): string => {
  if (val === null || val === undefined || val === "") return "-"
  return String(val)
}

const StaffDetailsPDF = ({ staff, school }: any) => {
  if (!staff) return null

  const schoolName =
    school?.name || "C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE & RESEARCH CENTRE"

  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/college-logo.jpeg`
      : "/college-logo.jpeg"

  const fullNameEn = [staff.first_name, staff.middle_name, staff.last_name].filter(Boolean).join(" ")
  const fullNameGuj = [staff.first_name_in_guj, staff.middle_name_in_guj, staff.last_name_in_guj].filter(Boolean).join(" ")

  const experiences: any[] = staff.experiences || staff.staff_experiences || []
  const letters: any[] = staff.letters || []

  // Check educational qualification rows
  const educationRows = [
    {
      level: "Undergraduate (UG)",
      degree: staff.ug_degree,
      institution: staff.ug_passing_university,
      year: staff.ug_passing_year,
    },
    {
      level: "Postgraduate (PG)",
      degree: staff.pg_degree,
      institution: staff.pg_passing_university,
      year: staff.pg_passing_year,
    },
    {
      level: "Diploma",
      degree: staff.diploma_degree,
      institution: staff.diploma_council,
      year: staff.diploma_passing_year,
    },
    {
      level: "Other Qualification",
      degree: staff.other_degree,
      institution: staff.other_passing_university,
      year: staff.other_passing_year,
    },
  ].filter((r) => r.degree || r.institution || r.year)

  const initials =
    ((staff.first_name?.[0] || "S") + (staff.last_name?.[0] || "")).toUpperCase()

  return (
    <Document>
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        {/* Refined Institutional Header */}
        <View style={styles.header}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.schoolName}>{schoolName}</Text>
            <Text style={styles.schoolTrust}>(Managed by: Vyara Pradesh Seva Samiti)</Text>
            <Text style={styles.schoolAddress}>
              Kakrapar Road, Vyara, Dist. Tapi, Gujarat - 394650 | Phone: 02626-220117
            </Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarInitials}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.nameEn}>{fullNameEn || "Staff Member"}</Text>
            {Boolean(fullNameGuj) && <Text style={styles.nameGuj}>{fullNameGuj}</Text>}
            <View style={styles.tagRow}>
              <Text style={styles.tag}>ID: {formatVal(staff.id)}</Text>
              {Boolean(staff.employee_code) && (
                <Text style={styles.tag}>Code: {staff.employee_code}</Text>
              )}
              <Text style={styles.tagSecondary}>Staff: {formatVal(staff.staff_type)}</Text>
              <Text style={styles.tagSecondary}>Type: {formatVal(staff.employment_status)}</Text>
              {Boolean(staff.staff_category) && (
                <Text style={styles.tagSecondary}>Category: {staff.staff_category}</Text>
              )}
              {Boolean(staff.designation || staff.role) && (
                <Text style={styles.tag}>Designation: {staff.designation || staff.role}</Text>
              )}
              {Boolean(staff.department || staff.department_details?.name) && (
                <Text style={styles.tagSecondary}>
                  Dept: {staff.department || staff.department_details?.name}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 1. Personal & Demographic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Personal & Demographic Details</Text>
          <View style={styles.grid}>
            <View style={styles.col4}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>{formatVal(staff.gender)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>{formatDate(staff.birth_date)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Marital Status</Text>
              <Text style={styles.value}>{formatVal(staff.marital_status)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Blood Group</Text>
              <Text style={styles.value}>{formatVal(staff.blood_group)}</Text>
            </View>

            <View style={styles.col4}>
              <Text style={styles.label}>Aadhar Number</Text>
              <Text style={styles.value}>{formatVal(staff.aadhar_no)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>PAN Card No</Text>
              <Text style={styles.value}>{formatVal(staff.pan_card_no)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value}>{formatVal(staff.category)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Nationality</Text>
              <Text style={styles.value}>{formatVal(staff.nationality || "Indian")}</Text>
            </View>

            <View style={styles.col4}>
              <Text style={styles.label}>Religion</Text>
              <Text style={styles.value}>{formatVal(staff.religion)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Religion (Guj)</Text>
              <Text style={styles.valueGuj}>{formatVal(staff.religion_in_guj)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Caste</Text>
              <Text style={styles.value}>{formatVal(staff.caste)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Caste (Guj)</Text>
              <Text style={styles.valueGuj}>{formatVal(staff.caste_in_guj)}</Text>
            </View>
          </View>
        </View>

        {/* 2. Contact & Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Contact & Address Details</Text>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>Mobile Number</Text>
              <Text style={styles.value}>{formatVal(staff.mobile_number)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>{formatVal(staff.email)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Emergency Contact</Text>
              <Text style={styles.value}>
                {staff.emergency_contact_name
                  ? `${staff.emergency_contact_name} (${formatVal(staff.emergency_contact_number)})`
                  : "-"}
              </Text>
            </View>

            <View style={styles.col2}>
              <Text style={styles.label}>Current Address</Text>
              <Text style={styles.value}>
                {[staff.address, staff.city, staff.district, staff.state, staff.postal_code]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Permanent Address</Text>
              <Text style={styles.value}>{formatVal(staff.permanent_address || staff.address)}</Text>
            </View>
          </View>
        </View>

        {/* 3. Academic & Educational Qualifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Academic Qualifications & Specialization</Text>
          <View style={styles.grid}>
            <View style={styles.col2}>
              <Text style={styles.label}>Primary Qualification</Text>
              <Text style={styles.value}>{formatVal(staff.qualification)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Subject Specialization</Text>
              <Text style={styles.value}>{formatVal(staff.subject_specialization)}</Text>
            </View>
          </View>

          {educationRows.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Level</Text>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Degree / Exam</Text>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>University / Council</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Year</Text>
              </View>
              {educationRows.map((row, idx) => (
                <View
                  key={idx}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlternate : {}]}
                >
                  <Text style={[styles.tableCell, { width: "25%", fontWeight: 700 }]}>{row.level}</Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>{formatVal(row.degree)}</Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>{formatVal(row.institution)}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>
                    {formatVal(row.year)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. Professional & Council Registration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Professional & Medical Council Registration</Text>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>AYUSH Teacher Code</Text>
              <Text style={styles.value}>{formatVal(staff.teacher_code)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>AYUSH Reg / ID No</Text>
              <Text style={styles.value}>{formatVal(staff.ayush_registration_no || staff.ayush_id_no)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>State Council Reg No</Text>
              <Text style={styles.value}>{formatVal(staff.state_council_reg_no)}</Text>
            </View>

            <View style={styles.col3}>
              <Text style={styles.label}>NCH Reg No</Text>
              <Text style={styles.value}>{formatVal(staff.nch_registration_no)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>NCH Reg Date</Text>
              <Text style={styles.value}>{formatDate(staff.nch_registration_date || staff.date_of_registration)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Area of Expertise</Text>
              <Text style={styles.value}>{formatVal(staff.area_of_expertise)}</Text>
            </View>
          </View>
        </View>

        {/* Footer Page 1 */}
        <View style={styles.footer} fixed>
          <Text>
            Generated on: {new Date().toLocaleString("en-GB")} | Document Reference: STF-{staff.id}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        {/* Institutional Header (Page 2) */}
        <View style={styles.header}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.schoolName}>{schoolName}</Text>
            <Text style={styles.schoolTrust}>(Managed by: Vyara Pradesh Seva Samiti)</Text>
            <Text style={styles.schoolAddress}>
              Kakrapar Road, Vyara, Dist. Tapi, Gujarat - 394650 | Phone: 02626-220117
            </Text>
          </View>
        </View>

        {/* Staff Reference Sub-banner for Page 2 */}
        <View style={styles.continuationBanner}>
          <Text style={styles.continuationText}>
            Staff Record: <Text style={{ fontWeight: 700 }}>{fullNameEn || "Staff Member"}</Text> | ID: {formatVal(staff.id)}
            {staff.employee_code ? ` | Code: ${staff.employee_code}` : ""}
            {staff.designation || staff.role ? ` | ${staff.designation || staff.role}` : ""}
          </Text>
        </View>

        {/* 5. University Appointments & Approvals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. University Appointments & Approvals</Text>
          <View style={styles.grid}>
            <View style={styles.col2}>
              <Text style={styles.label}>University Appointment Letter No</Text>
              <Text style={styles.value}>{formatVal(staff.university_appointment_letter_no)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>University Appointment Date</Text>
              <Text style={styles.value}>{formatDate(staff.university_appointment_date)}</Text>
            </View>

            <View style={styles.col2}>
              <Text style={styles.label}>University Approval Letter No</Text>
              <Text style={styles.value}>{formatVal(staff.university_approval_letter_no || staff.uni_approval_number)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>University Approval Date</Text>
              <Text style={styles.value}>{formatDate(staff.university_approval_date || staff.uni_approval_date)}</Text>
            </View>
          </View>

          {letters.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "35%" }]}>Letter Type</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Letter No</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Remarks</Text>
              </View>
              {letters.map((l, idx) => (
                <View
                  key={idx}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlternate : {}]}
                >
                  <Text style={[styles.tableCell, { width: "35%", fontWeight: 700 }]}>
                    {formatVal(l.letter_type)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%" }]}>{formatVal(l.letter_no)}</Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>{formatDate(l.letter_date)}</Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>{formatVal(l.remarks)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 6. Previous Professional Experiences */}
        {experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Previous Professional Experiences</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Institute / Organization</Text>
                <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Designation / Post</Text>
                <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Department</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Regulation</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Period</Text>
              </View>
              {experiences.map((exp, idx) => (
                <View
                  key={idx}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlternate : {}]}
                >
                  <Text style={[styles.tableCell, { width: "30%", fontWeight: 700 }]}>
                    {formatVal(exp.institute_name)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "22%" }]}>{formatVal(exp.post_name)}</Text>
                  <Text style={[styles.tableCell, { width: "18%" }]}>{formatVal(exp.department)}</Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{formatVal(exp.appointment_regulation)}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>
                    {formatDate(exp.from_date)} - {formatDate(exp.to_date)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. Employment, Service & Retirement Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Employment, Service & Retirement Details</Text>
          <View style={styles.grid}>
            <View style={styles.col4}>
              <Text style={styles.label}>Date of Joining</Text>
              <Text style={styles.value}>{formatDate(staff.joining_date)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Employment Status</Text>
              <Text style={styles.value}>{formatVal(staff.employment_status)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Pay Scale / Grade</Text>
              <Text style={styles.value}>{formatVal(staff.pay_scale)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Retirement Age</Text>
              <Text style={styles.value}>{staff.retirement_age ? `${staff.retirement_age} Years` : "-"}</Text>
            </View>

            <View style={styles.col4}>
              <Text style={styles.label}>Retirement Date</Text>
              <Text style={styles.value}>{formatDate(staff.retirement_date)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Resignation / Last Date</Text>
              <Text style={styles.value}>{formatDate(staff.resignation_date)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.value}>{formatVal(staff.department || staff.department_details?.name)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Working Hours</Text>
              <Text style={styles.value}>{staff.working_hours ? `${staff.working_hours} hrs/week` : "-"}</Text>
            </View>
          </View>
        </View>

        {/* 8. Bank & Statutory Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Bank & Statutory Information</Text>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>Bank Name</Text>
              <Text style={styles.value}>{formatVal(staff.bank_name)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Branch Name</Text>
              <Text style={styles.value}>{formatVal(staff.bank_branch_name)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Account Number</Text>
              <Text style={styles.value}>{formatVal(staff.account_no)}</Text>
            </View>

            <View style={styles.col3}>
              <Text style={styles.label}>IFSC Code</Text>
              <Text style={styles.value}>{formatVal(staff.IFSC_code)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>EPF Number</Text>
              <Text style={styles.value}>{formatVal(staff.epf_no)}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>EPF UAN Number</Text>
              <Text style={styles.value}>{formatVal(staff.epf_uan_no)}</Text>
            </View>
          </View>
        </View>

        {/* Signature Verification Block */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Staff Signature</Text>
            <Text style={styles.signatureSub}>{fullNameEn}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>HOD / Section In-Charge</Text>
            <Text style={styles.signatureSub}>Signature & Seal</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Principal / Director</Text>
            <Text style={styles.signatureSub}>{schoolName}</Text>
          </View>
        </View>

        {/* Footer Page 2 */}
        <View style={styles.footer} fixed>
          <Text>
            Generated on: {new Date().toLocaleString("en-GB")} | Document Reference: STF-{staff.id}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export default StaffDetailsPDF