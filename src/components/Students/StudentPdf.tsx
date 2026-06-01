import type React from "react"
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import type { StudentEnrollment } from "@/types/student"
import type { User } from "@/types/user"
import gujFonts from "./gujarat_noto_sans.ttf";

// Register fonts
Font.register({
  family: "NotoSansGujarati",
  src: gujFonts,
});

Font.register({
  family: "Roboto" ,
  src: gujFonts,
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
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottom: "1px solid #CCCCCC",
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 100,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 5,
    color: "#1E40AF",
  },
  schoolAddress: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 15,
    textAlign: "center",
    color: "#1E40AF",
    textTransform: "uppercase",
    borderBottom: "1px solid #CCCCCC",
    paddingBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
    padding: 5,
    color: "#1E40AF",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  column: {
    flex: 1,
    paddingRight: 10,
  },
  label: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 5,
  },
  studentInfo: {
    flexDirection: "row",
    marginBottom: 15,
  },
  studentDetails: {
    flex: 1,
  },
  studentPhoto: {
    width: 100,
    alignItems: "center",
  },
  photo: {
    width: 80,
    height: 100,
    border: "1px solid #CCCCCC",
  },
  badge: {
    fontSize: 8,
    color: "#FFFFFF",
    backgroundColor: "#22C55E",
    padding: "2 5",
    borderRadius: 3,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  table: {
    flexDirection: "column",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    borderBottomStyle: "solid",
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
    textAlign: "left",
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#CCCCCC",
    borderRightStyle: "solid",
  },
  tableCellLast: {
    padding: 5,
    fontSize: 9,
    textAlign: "left",
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: "center",
    color: "#666666",
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    borderTopStyle: "solid",
    paddingTop: 5,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: "#666666",
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    marginVertical: 5,
  },
  feesBox: {
    padding: 5,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderStyle: "solid",
    marginBottom: 5,
  },
  feesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  feesLabel: {
    fontSize: 9,
    color: "#666666",
  },
  feesValue: {
    fontSize: 9,
    fontWeight: 700,
  },
  greenText: {
    color: "#22C55E",
  },
  redText: {
    color: "#EF4444",
  },
  yellowText: {
    color: "#F59E0B",
  },
  progressBar: {
    height: 5,
    backgroundColor: "#EEEEEE",
    marginTop: 2,
    marginBottom: 5,
  },
  progressFill: {
    height: 5,
    backgroundColor: "#22C55E",
  },
  concessionBox: {
    padding: 5,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderStyle: "solid",
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  concessionLeft: {
    flex: 1,
  },
  concessionRight: {
    alignItems: "flex-end",
  },
  concessionBadge: {
    fontSize: 8,
    color: "#FFFFFF",
    backgroundColor: "#6366F1",
    padding: "2 5",
    borderRadius: 3,
    marginTop: 3,
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "25%",
    right: "25%",
    fontSize: 60,
    color: "rgba(200, 200, 200, 0.3)",
    transform: "rotate(-45deg)",
    textAlign: "center",
  },
  gujaratiText: {
    fontFamily: "NotoSansGujarati",
    fontSize: 10,
    marginBottom: 5,
    color: "#333333",
  },
});

// Helper function to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "pursuing":
      return "#22C55E";
    case "failed":
      return "#EF4444";
    case "permoted":
      return "#3B82F6";
    case "drop":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

// Helper function to get fees status color
const getFeesStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "#22C55E";
    case "Partially Paid":
      return "#F59E0B";
    case "Unpaid":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

interface StudentPDFProps {
  student: StudentEnrollment;
  currentUser: User | null;
}

const StudentDetailsPDF: React.FC<StudentPDFProps> = ({ student, currentUser }) => {
  // Calculate fees payment percentage
  const feesPaymentPercentage = student.fees_status
    ? Math.round(
        (Number.parseFloat(String(student.fees_status.paid_amount)) / Number.parseFloat(student.fees_status.total_amount)) *
          100,
      )
    : 0;

  // Format currency
  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0.00";
    return `₹${Number.parseFloat(amount.toString()).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Capitalize first letter
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>STUDENT RECORD</Text>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.schoolName}>{currentUser?.school?.name || "School Name"}</Text>
            <Text style={styles.schoolAddress}>{currentUser?.school?.address || "School Address"}</Text>
            <Text style={styles.schoolAddress}>
              {currentUser?.school?.city || "City"}, {currentUser?.school?.state || "State"} -{" "}
              {currentUser?.school?.pincode || "Pincode"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Image style={styles.logo} src="/placeholder.svg?height=80&width=80" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Student Profile</Text>

        {/* Student Basic Info */}
        <View style={styles.studentInfo}>
          <View style={styles.studentDetails}>
            <Text style={[styles.value, { fontSize: 14, fontWeight: 700 }]}>
              {student.student.first_name} {student.student.middle_name} {student.student.last_name}
            </Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Enrollment Code</Text>
                <Text style={styles.value}>{student.student.enrollment_code || "N/A"}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>GR Number</Text>
                <Text style={styles.value}>{student.student.gr_no || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Class</Text>
                <Text style={styles.value}>
                  {student.class?.class.class}-{student.class?.division}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Roll Number</Text>
                <Text style={styles.value}>{student.student.roll_number || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Status</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(student.status) }]}>
                  <Text>{capitalize(student.status)}</Text>
                </View>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Gender</Text>
                <Text style={styles.value}>{student.student.gender || "N/A"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.studentPhoto}>
            <Image style={styles.photo} src="/placeholder.svg?height=100&width=80" />
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>{student.student?.birth_date ? formatDate(student.student?.birth_date) : "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Birth Place</Text>
              <Text style={styles.value}>{student.student.student_meta?.birth_place || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Blood Group</Text>
              <Text style={styles.value}>{student.student.student_meta?.blood_group || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Religion</Text>
              <Text style={styles.value}>{student.student.student_meta?.religion || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Caste</Text>
              <Text style={styles.value}>{student.student.student_meta?.caste || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value}>{student.student.student_meta?.category || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Aadhar Number</Text>
              <Text style={styles.value}>{student.student.aadhar_no || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Aadhar DISE Number</Text>
              <Text style={styles.value}>{student.student.student_meta?.aadhar_dise_no || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Identification Mark</Text>
              <Text style={styles.value}>{student.student.student_meta?.identification_mark || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Father's Name</Text>
              <Text style={styles.value}>{student.student.father_name || "N/A"}</Text>
              <Text style={[styles.label, { fontSize: 8 }]}>{student.student.father_name_in_guj || ""}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Mother's Name</Text>
              <Text style={styles.value}>{student.student.mother_name || "N/A"}</Text>
              <Text style={[styles.label, { fontSize: 8 }]}>{student.student.mother_name_in_guj || ""}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Primary Mobile</Text>
              <Text style={styles.value}>{student.student.primary_mobile || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Secondary Mobile</Text>
              <Text style={styles.value}>{student.student.student_meta?.secondary_mobile || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{student.student.student_meta?.address || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>City</Text>
              <Text style={styles.value}>{student.student.student_meta?.city || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>District</Text>
              <Text style={styles.value}>{student.student.student_meta?.district || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>State</Text>
              <Text style={styles.value}>{student.student.student_meta?.state || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Postal Code</Text>
              <Text style={styles.value}>{student.student.student_meta?.postal_code || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Academic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Admission Date</Text>
              <Text style={styles.value}>{student.student.student_meta?.admission_date && formatDate(student.student.student_meta?.admission_date)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Admission Class</Text>
              <Text style={styles.value}>Class {student.student.student_meta?.admission_class_id || "N/A"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>New Admission</Text>
              <Text style={styles.value}>{student.is_new_admission ? "Yes" : "No"}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Previous School</Text>
              <Text style={styles.value}>{student.student.student_meta?.privious_school || "N/A"}</Text>
              <Text style={[styles.label, { fontSize: 8 }]}>{student.student.student_meta?.privious_school_in_guj || ""}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Quota</Text>
              <Text style={styles.value}>{student.quota?.name || "N/A"}</Text>
            </View>
          </View>
          {student.remarks && (
            <>
              <View style={styles.separator} />
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Remarks</Text>
                  <Text style={styles.value}>{student.remarks}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Fees Information */}
        {student.fees_status && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fees Information</Text>
            <View style={styles.feesBox}>
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Total Fees</Text>
                <Text style={styles.feesValue}>{formatCurrency(student.fees_status.total_amount)}</Text>
              </View>
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Paid Amount</Text>
                <Text style={[styles.feesValue, styles.greenText]}>
                  {formatCurrency(student.fees_status.paid_amount)}
                </Text>
              </View>
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Due Amount</Text>
                <Text style={[styles.feesValue, styles.redText]}>{formatCurrency(student.fees_status.due_amount)}</Text>
              </View>
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Discounted Amount</Text>
                <Text style={[styles.feesValue, styles.yellowText]}>
                  {formatCurrency(student.fees_status.discounted_amount)}
                </Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Payment Status</Text>
                <View style={[styles.badge, { backgroundColor: getFeesStatusColor(student.fees_status.status) }]}>
                  <Text>{student.fees_status.status}</Text>
                </View>
              </View>
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Payment Progress</Text>
                <Text style={styles.feesValue}>{feesPaymentPercentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${feesPaymentPercentage}%` }]} />
              </View>
            </View>

            {/* Payment History */}
            {student.fees_status.paid_fees && student.fees_status.paid_fees.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: 5, marginBottom: 3 }]}>Payment History</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableCell}>Installment</Text>
                    <Text style={styles.tableCell}>Amount</Text>
                    <Text style={styles.tableCell}>Date</Text>
                    <Text style={styles.tableCell}>Mode</Text>
                    <Text style={styles.tableCellLast}>Status</Text>
                  </View>
                  {student.fees_status.paid_fees.map((payment, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableCell}>#{payment.installment_id}</Text>
                      <Text style={styles.tableCell}>{formatCurrency(payment.paid_amount)}</Text>
                      <Text style={styles.tableCell}>{formatDate(payment.payment_date)}</Text>
                      <Text style={styles.tableCell}>{payment.payment_mode}</Text>
                      <Text style={styles.tableCellLast}>{payment.status}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Concessions */}
            {student.provided_concession && student.provided_concession.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: 5, marginBottom: 3 }]}>Applied Concessions</Text>
                {student.provided_concession.map((concession, index) => (
                  <View key={index} style={styles.concessionBox}>
                    <View style={styles.concessionLeft}>
                      <Text style={[styles.value, { fontSize: 9 }]}>
                        {concession.concession_id && `Concession #${concession.concession_id}`}
                      </Text>
                      <Text style={[styles.label, { fontSize: 8 }]}>{concession.fees_plan?.name || ""}</Text>
                    </View>
                    <View style={styles.concessionRight}>
                      {concession.deduction_type === "percentage" ? (
                        <Text style={[styles.value, { fontSize: 9 }]}>{concession.percentage}%</Text>
                      ) : (
                        <Text style={[styles.value, { fontSize: 9 }]}>{formatCurrency(concession.amount)}</Text>
                      )}
                      <View style={styles.concessionBadge}>
                        <Text>{concession.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Gujarati Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gujarati Details</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Name in Gujarati</Text>
              <Text style={styles.gujaratiText}>
                {`${student.student.first_name_in_guj || ""} ${student.student.middle_name_in_guj || ""} ${student.student.last_name_in_guj || ""}`.trim() || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        {(student.student.student_meta?.bank_name || student.student.student_meta?.account_no) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Bank Name</Text>
                <Text style={styles.value}>{student.student.student_meta?.bank_name || "N/A"}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Account Number</Text>
                <Text style={styles.value}>{student.student.student_meta?.account_no || "N/A"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This document is generated from the School Management System. Printed on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default StudentDetailsPDF;

