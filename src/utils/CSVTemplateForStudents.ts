export const downloadCSVTemplate = (type: 'SCHOOL' | 'COLLEGE' = 'SCHOOL') => {
  const schoolHeaders = [
    "First Name",
    "Middle Name",
    "Last Name",
    "First Name Gujarati",
    "Middle Name Gujarati",
    "Last Name Gujarati",
    "Gender",
    "Date of Birth",
    "Birth Place",
    "Birth Place In Gujarati",
    "Aadhar No",
    "DISE Number",
    "Father Name",
    "Father Name in Gujarati",
    "Mother Name",
    "Mother Name in Gujarati",
    "Mobile No",
    "Other Mobile No",
    "GR No",
    "Roll Number",
    "Admission Date",
    "Previous School",
    "Previous School In Gujarati",
    "Religion",
    "Religion In Gujarati",
    "Caste",
    "Caste In Gujarati",
    "Category",
    "Address",
    "District",
    "City",
    "State",
    "Postal Code",
    "Bank Name",
    "Account Number",
    "IFSC Code",
  ];

  const collegeHeaders = [
    "AdmissionID",
    "GR No.",
    "FIRST_NAME",
    "MIDDLE_NAME",
    "LAST_NAME",
    "GENDER",
    "DATE_OF_BIRTH",
    "STANDARD",
    "DIVISION",
    "MOBILE_NO1",
    "CURRENT ADDRESS",
    "Current Area",
    "Current CITY",
    "Current STATE",
    "Currrent PIN_CODE",
    "Current COUNTRY",
    "PERMANENT ADDRESS",
    "Permanent Area",
    "Permanent City",
    "Permanent STATE",
    "Permanent PIN_CODE",
    "Permanent COUNTRY",
    "COUNTRY_CODE",
    "NATIONALITY",
    "STUDENT_CODE",
    "S.LANGUAGE_FIRST_NAME",
    "S.LANGUAGE_MIDDLE_NAME",
    "S.LANGUAGE_LAST_NAME",
    "ADMISSION_DATE",
    "ADMISSION_STANDARD",
    "ROLL_NO",
    "SUBJECT_GROUP",
    "MOBILE_NO2",
    "RELIGION",
    "CASTE",
    "CATEGORY",
    "BLOOD_GROUP",
    "BIRTH PLACE",
    "Birth Taluka",
    "Birth District",
    "ACTIVE",
    "STUDENT_LEAVING_REASON",
    "STUDENT_LC_DATE",
    "STUDENT_LC_NO",
    "PREVIOUS_SCHOOL_NAME",
    "STUDENT_AADHAAR_CARDNO",
    "STUDENT_U_DIESNO",
    "PEN",
    "AbhaCardNo",
    "Bank_Name",
    "Bank_Branch_Name",
    "Bank_Account_Number",
    "IFSC_Code",
    "ACTIVITY_HOUSE",
    "EMAIL_ID",
    "WEBSITE",
    "MOTHER_TOUNG",
    "FATHER_NAME",
    "S.LANGUAGE_Father Name",
    "FATHER_QUALIFICATION",
    "FATHER_OCCUPATION",
    "FATHER_EMAIL",
    "FATHER_ORGANISATION",
    "FATHER_OFFICE_ADDRESS1",
    "FATHER_OFFICE_PHONENO",
    "FATHER_MOBILENO",
    "MOTHER_NAME",
    "S.LANGUAGE_Mother Name",
    "MOTHER_QUALIFICATION",
    "MOTHER_OCCUPATION",
    "MOTHER_EMAIL",
    "MOTHER_ORGANISATION",
    "MOTHER_OFFICE_ADDRESS1",
    "MOTHER_OFFICE_PHONENO",
    "MOTHER_MOBILENO",
    "GARDIAN_NAME",
    "S.LANGUAGE_GARDIAN_Name",
    "GARDIAN_QUALIFICATION",
    "GARDIAN_OCCUPATION",
    "GARDIAN_EMAIL",
    "GARDIAN_ORGANISATION",
    "GARDIAN_OFFICE_ADDRESS1",
    "GARDIAN_OFFICE_PHONENO",
    "GARDIAN_MOBILENO",
    "Relation with Local Guardian",
    "S.S.C. Passing Year",
    "H.S.C. Passing Year",
    "How Many Attempt?",
    "H.S.C. Obtained Marks",
    "H.S.C. PCB Marks with Practical",
    "Caste",
    "Sub Caste",
    "Quota Fees",
    "Name of Entrance Exam",
    "NEET score",
    "NEET Roll No.",
    "NEET Application Number",
    "NEET All India Rank",
    "NEET Percentile (%)",
    "General Merit",
    "Category Merit",
    "Internship Provisional Number",
    "Internship Provisional Date",
    "Internship Starting Date",
    "Internship Completion Date",
    "1st year Attempt",
    "2nd Year Attempt",
    "3rd Year Attempt",
    "4th year Attempt",
    "Final BHMS Date of Passing",
    "Admission Year",
    "Ayush ID",
    "ABC ID",
    "Admission Cancel",
    "Admission Cancel Year",
    "Admission Cancel Date",
    "Admission Transfer",
    "Admission Transfer Date",
    "Admission transfer to College",
    "Admission Transfer From College",
    "School UDISE No",
  ];

  const headersToUse = type === 'COLLEGE' ? collegeHeaders : schoolHeaders;
  
  // Create a sample row based on the selected headers
  const sampleRow = headersToUse.map(h => {
    if (h === "First Name" || h === "FIRST_NAME") return "Rahul";
    if (h === "Last Name" || h === "LAST_NAME") return "Patel";
    if (h === "Gender" || h === "GENDER") return "Male";
    if (h === "Mobile No" || h === "MOBILE_NO1") return "9876543210";
    if (h === "GR No" || h === "GR No.") return "GR12345";
    return "";
  });

  try {
    const BOM = "\uFEFF"; // UTF-8 BOM
    const csvContent = `${headersToUse.join(",")}\n${sampleRow.join(",")}`;

    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const fileName = type === 'COLLEGE' ? "college_student_upload_template.csv" : "school_student_upload_template.csv";
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV template:", error);
    alert("Failed to download the CSV template. Please try again later.");
  }
};
