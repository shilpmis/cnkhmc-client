/**
 * The final heads of the student sheet, in sheet order. They are the only heads used for the student
 * import, the student export and the manual student entry. Keep cnkhmc-server/app/services/student_columns.ts
 * in step with this list.
 */
export type StudentColumnGroup =
  | "identity"
  | "contact"
  | "admission"
  | "personal"
  | "bank"
  | "family"
  | "academic"
  | "neet"
  | "internship"
  | "progress"

export interface StudentColumn {
  key: string
  header: string
  /** where the value is stored; derived heads are filled in by the server and ignored on import */
  table: "students" | "student_meta" | "derived"
  group: StudentColumnGroup
}

const c = (key: string, header: string, table: StudentColumn["table"], group: StudentColumnGroup): StudentColumn => ({
  key,
  header,
  table,
  group,
})

export const STUDENT_COLUMNS: StudentColumn[] = [
  c("admission_number", "AdmissionID", "students", "identity"),
  c("enrollment_code", "Enrollment number", "students", "identity"),
  c("full_name", "FULL NAME", "derived", "identity"),
  c("first_name", "FIRST_NAME", "students", "identity"),
  c("middle_name", "MIDDLE_NAME", "students", "identity"),
  c("last_name", "LAST_NAME", "students", "identity"),
  c("name_as_per_aadhar", "Name as Per Aadhar", "student_meta", "identity"),
  c("gender", "GENDER", "students", "identity"),
  c("birth_date", "DATE_OF_BIRTH", "students", "identity"),
  c("class", "CLASS", "derived", "identity"),
  c("practical_batch", "BATCH", "students", "identity"),
  c("primary_mobile", "MOBILE_NO1", "students", "contact"),
  c("address", "CORRESPONDENCE ADDRESS", "student_meta", "contact"),
  c("postal_code", "CORRESPONDENCE PIN_CODE", "student_meta", "contact"),
  c("permanent_address", "PERMANENT ADDRESS", "student_meta", "contact"),
  c("permanent_pincode", "Permanent PIN_CODE", "student_meta", "contact"),
  c("country_code", "COUNTRY_CODE", "student_meta", "contact"),
  c("nationality", "NATIONALITY", "student_meta", "contact"),
  c("university_spid_no", "UNIVERSITY SPID NUMBER", "student_meta", "admission"),
  c("admission_year", "Admission Year", "student_meta", "admission"),
  c("admission_date", "ADMISSION_DATE", "student_meta", "admission"),
  c("admission_quota", "ADMISSION_QUOTA", "student_meta", "admission"),
  c("admission_category", "ADMISSION CATEGORY", "student_meta", "admission"),
  c("tuition_fees", "TUTION FEES", "student_meta", "admission"),
  c("first_year_roll_number", "ROLL_NO 1st BHMS", "students", "admission"),
  c("second_year_roll_number", "ROLL_NO 2nd BHMS", "students", "admission"),
  c("third_year_roll_number", "ROLL_NO 3rd BHMS", "students", "admission"),
  c("fourth_year_roll_number", "ROLL_NO 4th BHMS", "students", "admission"),
  c("roll_no_internship", "ROLL_NO Internship", "student_meta", "admission"),
  c("secondary_mobile", "MOBILE_NO2", "student_meta", "contact"),
  c("religion", "RELIGION", "student_meta", "personal"),
  c("caste", "CASTE", "student_meta", "personal"),
  c("category", "CATEGORY", "student_meta", "personal"),
  c("blood_group", "BLOOD_GROUP", "student_meta", "personal"),
  c("birth_place", "BIRTH PLACE", "student_meta", "personal"),
  c("student_leaving_reason", "STUDENT_LEAVING_REASON", "student_meta", "personal"),
  c("student_lc_date", "STUDENT_LC_DATE", "student_meta", "personal"),
  c("student_lc_no", "STUDENT_LC_NO", "student_meta", "personal"),
  c("privious_school", "PREVIOUS_SCHOOL_NAME", "student_meta", "personal"),
  c("aadhar_no", "STUDENT_AADHAAR_CARDNO", "students", "personal"),
  c("aadhar_dise_no", "STUDENT_U_DIESNO", "student_meta", "personal"),
  c("bank_name", "Bank_Name", "student_meta", "bank"),
  c("bank_branch_name", "Bank_Branch_Name", "student_meta", "bank"),
  c("account_no", "Bank_Account_Number", "student_meta", "bank"),
  c("IFSC_code", "IFSC_Code", "student_meta", "bank"),
  c("bank_branch_pincode", "Branch Pin Code", "student_meta", "bank"),
  c("email_id", "EMAIL_ID", "student_meta", "contact"),
  c("father_name", "FATHER_NAME", "students", "family"),
  c("father_occupation", "FATHER_OCCUPATION", "student_meta", "family"),
  c("father_mobile", "FATHER_MOBILENO", "student_meta", "family"),
  c("mother_name", "MOTHER_NAME", "students", "family"),
  c("mother_occupation", "MOTHER_OCCUPATION", "student_meta", "family"),
  c("mother_mobile", "MOTHER_MOBILENO", "student_meta", "family"),
  c("guardian_name", "GUARDIAN_NAME", "student_meta", "family"),
  c("guardian_occupation", "GUARDIAN_OCCUPATION", "student_meta", "family"),
  c("guardian_mobile", "GUARDIAN_MOBILENO", "student_meta", "family"),
  c("guardian_relation", "Relation with Guardian", "student_meta", "family"),
  c("ssc_passing_year", "S.S.C. Passing Year", "student_meta", "academic"),
  c("hsc_passing_year", "H.S.C. Passing Year", "student_meta", "academic"),
  c("hsc_attempts", "H.S.C Number of Attempt", "student_meta", "academic"),
  c("hsc_obtained_marks", "H.S.C. Obtained Marks", "student_meta", "academic"),
  c("hsc_pcb_marks_with_practical", "H.S.C. PCB Marks (T+P)", "student_meta", "academic"),
  c("neet_score", "NEET score", "student_meta", "neet"),
  c("neet_roll_no", "NEET Roll No.", "student_meta", "neet"),
  c("neet_application_number", "NEET Application Number", "student_meta", "neet"),
  c("neet_all_india_rank", "NEET All India Rank", "student_meta", "neet"),
  c("neet_percentile", "NEET Percentile (%)", "student_meta", "neet"),
  c("general_merit", "General Merit", "student_meta", "neet"),
  c("category_merit", "Category Merit", "student_meta", "neet"),
  c("internship_provisional_number", "Internship Provisional Number", "student_meta", "internship"),
  c("internship_provisional_date", "Internship Provisional Date", "student_meta", "internship"),
  c("internship_starting_date", "Internship Starting Date", "student_meta", "internship"),
  c("internship_completion_date", "Internship Completion Date", "student_meta", "internship"),
  c("first_year_attempt", "1st year Attempt", "student_meta", "progress"),
  c("second_year_attempt", "2nd Year Attempt", "student_meta", "progress"),
  c("third_year_attempt", "3rd Year Attempt", "student_meta", "progress"),
  c("fourth_year_attempt", "4th year Attempt", "student_meta", "progress"),
  c("final_bhms_passing_date", "Final BHMS Date of Passing", "student_meta", "progress"),
  c("ayush_id", "Ayush ID", "student_meta", "progress"),
  c("abc_id", "ABC ID", "student_meta", "progress"),
  c("admission_cancel", "Admission Cancel", "student_meta", "progress"),
  c("admission_cancel_year", "Admission Cancel Year", "student_meta", "progress"),
  c("admission_cancel_date", "Admission Cancel Date", "student_meta", "progress"),
  c("admission_transfer", "Admission Transfer", "student_meta", "progress"),
  c("admission_transfer_date", "Admission Transfer Date", "student_meta", "progress"),
  c("admission_transfer_to_college", "Admission transfer to College", "student_meta", "progress"),
  c("admission_transfer_from_college", "Admission Transfer From College", "student_meta", "progress"),
  c("school_udise_no", "School UDISE No.", "student_meta", "progress"),
]

export const STUDENT_HEADERS: string[] = STUDENT_COLUMNS.map((col) => col.header)

/** key -> sheet head */
export const studentColumnHeaderMapping: Record<string, string> = Object.fromEntries(
  STUDENT_COLUMNS.map((col) => [col.key, col.header])
)

const GROUP_LABELS: Record<StudentColumnGroup, string> = {
  identity: "identity",
  contact: "contact",
  admission: "admission",
  personal: "personal",
  bank: "bank",
  family: "family",
  academic: "academic",
  neet: "neet",
  internship: "internship",
  progress: "progress",
}

/** Field groups for the export dialog; derived heads are filled in by the server, so they count as "students". */
export const studentFieldGroups: Record<string, Array<{ id: string; label: string; table: "students" | "student_meta" }>> =
  (() => {
    const groups: Record<string, Array<{ id: string; label: string; table: "students" | "student_meta" }>> = {}
    for (const col of STUDENT_COLUMNS) {
      const name = GROUP_LABELS[col.group]
      ;(groups[name] ||= []).push({
        id: col.key,
        label: col.header,
        table: col.table === "student_meta" ? "student_meta" : "students",
      })
    }
    return groups
  })()
