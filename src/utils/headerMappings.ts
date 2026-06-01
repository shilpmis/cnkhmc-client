/**
 * Maps API response keys to user-friendly Excel column headers
 * Used for client-side transformation of Excel headers
 */

/**
 * Student-specific header mappings from API keys to friendly headers
 */
export const studentHeaderMappings: Record<string, string> = {
  // Personal information
  'first_name': 'First Name',
  'middle_name': 'Middle Name',
  'last_name': 'Last Name',
  'first_name_in_guj': 'First Name (Gujarati)',
  'middle_name_in_guj': 'Middle Name (Gujarati)',
  'last_name_in_guj': 'Last Name (Gujarati)',
  'gender': 'Gender',
  'birth_date': 'Date of Birth',
  'birth_place': 'Place of Birth',
  'birth_place_in_guj': 'Place of Birth (Gujarati)',
  'aadhar_no': 'Aadhar Number',
  'aadhar_dise_no': 'Aadhar DISE Number',
  
  // Family information
  'father_name': 'Father\'s Name',
  'father_name_in_guj': 'Father\'s Name (Gujarati)',
  'mother_name': 'Mother\'s Name',
  'mother_name_in_guj': 'Mother\'s Name (Gujarati)',
  'primary_mobile': 'Primary Mobile Number',
  'secondary_mobile': 'Secondary Mobile Number',
  
  // Academic information
  'gr_no': 'GR Number',
  'roll_number': 'Roll Number',
  'admission_date': 'Admission Date',
  'admission_class': 'Admission Class',
  'class': 'Current Class',
  'division': 'Division',
  'privious_school': 'Previous School',
  'privious_school_in_guj': 'Previous School (Gujarati)',
  
  // Other details
  'religion': 'Religion',
  'religion_in_guj': 'Religion (Gujarati)',
  'caste': 'Caste',
  'caste_in_guj': 'Caste (Gujarati)',
  'category': 'Category',
  
  // Address details
  'address': 'Address',
  'district': 'District',
  'city': 'City',
  'state': 'State',
  'postal_code': 'Postal Code',
  
// Bank details
  'bank_name': 'Bank Name',
  'account_no': 'Account Number',
  'IFSC_code': 'IFSC Code',
};

/**
 * College-specific student header mappings from API keys to friendly headers
 */
export const collegeStudentHeaderMappings: Record<string, string> = {
  // Personal information
  'admission_number': 'AdmissionID',
  'gr_no': 'GR No.',
  'first_name': 'FIRST_NAME',
  'middle_name': 'MIDDLE_NAME',
  'last_name': 'LAST_NAME',
  'gender': 'GENDER',
  'birth_date': 'DATE_OF_BIRTH',
  'class': 'STANDARD',
  'division': 'DIVISION',
  'primary_mobile': 'MOBILE_NO1',
  'address': 'CURRENT ADDRESS',
  'current_area': 'Current Area',
  'city': 'Current CITY',
  'state': 'Current STATE',
  'postal_code': 'Currrent PIN_CODE',
  'current_country': 'Current COUNTRY',
  
  // Permanent address details
  'permanent_address': 'PERMANENT ADDRESS',
  'permanent_area': 'Permanent Area',
  'permanent_city': 'Permanent City',
  'permanent_state': 'Permanent STATE',
  'permanent_pincode': 'Permanent PIN_CODE',
  'permanent_country': 'Permanent COUNTRY',
  
  // Citizenship & ID
  'country_code': 'COUNTRY_CODE',
  'nationality': 'NATIONALITY',
  'enrollment_code': 'STUDENT_CODE',
  'aadhar_no': 'STUDENT_AADHAAR_CARDNO',
  'aadhar_dise_no': 'STUDENT_U_DIESNO',
  'pen': 'PEN',
  'abha_card_no': 'AbhaCardNo',
  
  // Gujarati translations
  'first_name_in_guj': 'S.LANGUAGE_FIRST_NAME',
  'middle_name_in_guj': 'S.LANGUAGE_MIDDLE_NAME',
  'last_name_in_guj': 'S.LANGUAGE_LAST_NAME',
  'father_name_in_guj': 'S.LANGUAGE_Father Name',
  'mother_name_in_guj': 'S.LANGUAGE_Mother Name',
  'guardian_name_in_guj': 'S.LANGUAGE_GARDIAN_Name',
  
  // Admission details
  'admission_date': 'ADMISSION_DATE',
  'admission_standard': 'ADMISSION_STANDARD',
  'roll_number': 'ROLL_NO',
  'subject_group': 'SUBJECT_GROUP',
  'secondary_mobile': 'MOBILE_NO2',
  
  // Personal Details
  'religion': 'RELIGION',
  'caste': 'CASTE',
  'sub_caste': 'Sub Caste',
  'category': 'CATEGORY',
  'blood_group': 'BLOOD_GROUP',
  'birth_place': 'BIRTH PLACE',
  'birth_taluka': 'Birth Taluka',
  'birth_district': 'Birth District',
  'is_active': 'ACTIVE',
  'student_leaving_reason': 'STUDENT_LEAVING_REASON',
  'student_lc_date': 'STUDENT_LC_DATE',
  'student_lc_no': 'STUDENT_LC_NO',
  'privious_school': 'PREVIOUS_SCHOOL_NAME',
  
  // Bank Details
  'bank_name': 'Bank_Name',
  'bank_branch_name': 'Bank_Branch_Name',
  'account_no': 'Bank_Account_Number',
  'IFSC_code': 'IFSC_Code',
  
  // Other details
  'activity_house': 'ACTIVITY_HOUSE',
  'email_id': 'EMAIL_ID',
  'website': 'WEBSITE',
  'mother_tongue': 'MOTHER_TOUNG',
  
  // Family information - Father
  'father_name': 'FATHER_NAME',
  'father_qualification': 'FATHER_QUALIFICATION',
  'father_occupation': 'FATHER_OCCUPATION',
  'father_email': 'FATHER_EMAIL',
  'father_organisation': 'FATHER_ORGANISATION',
  'father_office_address': 'FATHER_OFFICE_ADDRESS1',
  'father_office_phone': 'FATHER_OFFICE_PHONENO',
  'father_mobile': 'FATHER_MOBILENO',
  
  // Family information - Mother
  'mother_name': 'MOTHER_NAME',
  'mother_qualification': 'MOTHER_QUALIFICATION',
  'mother_occupation': 'MOTHER_OCCUPATION',
  'mother_email': 'MOTHER_EMAIL',
  'mother_organisation': 'MOTHER_ORGANISATION',
  'mother_office_address': 'MOTHER_OFFICE_ADDRESS1',
  'mother_office_phone': 'MOTHER_OFFICE_PHONENO',
  'mother_mobile': 'MOTHER_MOBILENO',
  
  // Guardian details
  'guardian_name': 'GARDIAN_NAME',
  'guardian_qualification': 'GARDIAN_QUALIFICATION',
  'guardian_occupation': 'GARDIAN_OCCUPATION',
  'guardian_email': 'GARDIAN_EMAIL',
  'guardian_organisation': 'GARDIAN_ORGANISATION',
  'guardian_office_address': 'GARDIAN_OFFICE_ADDRESS1',
  'guardian_office_phone': 'GARDIAN_OFFICE_PHONENO',
  'guardian_mobile': 'GARDIAN_MOBILENO',
  'relation_with_local_guardian': 'Relation with Local Guardian',
  
  // Educational qualification
  'ssc_passing_year': 'S.S.C. Passing Year',
  'hsc_passing_year': 'H.S.C. Passing Year',
  'hsc_attempts': 'How Many Attempt?',
  'hsc_obtained_marks': 'H.S.C. Obtained Marks',
  'hsc_pcb_marks_with_practical': 'H.S.C. PCB Marks with Practical',
  
  // College Specific
  'quota_fees': 'Quota Fees',
  'entrance_exam_name': 'Name of Entrance Exam',
  'neet_score': 'NEET score',
  'neet_roll_no': 'NEET Roll No.',
  'neet_application_number': 'NEET Application Number',
  'neet_all_india_rank': 'NEET All India Rank',
  'neet_percentile': 'NEET Percentile (%)',
  'general_merit': 'General Merit',
  'category_merit': 'Category Merit',
  
  // Internship
  'internship_provisional_number': 'Internship Provisional Number',
  'internship_provisional_date': 'Internship Provisional Date',
  'internship_starting_date': 'Internship Starting Date',
  'internship_completion_date': 'Internship Completion Date',
  
  // Attempts
  'first_year_attempt': '1st year Attempt',
  'second_year_attempt': '2nd Year Attempt',
  'third_year_attempt': '3rd Year Attempt',
  'fourth_year_attempt': '4th year Attempt',
  
  // Enrollment Progress
  'final_bhms_passing_date': 'Final BHMS Date of Passing',
  'admission_year': 'Admission Year',
  'ayush_id': 'Ayush ID',
  'abc_id': 'ABC ID',
  
  // Cancel/Transfer
  'admission_cancel': 'Admission Cancel',
  'admission_cancel_year': 'Admission Cancel Year',
  'admission_cancel_date': 'Admission Cancel Date',
  'admission_transfer': 'Admission Transfer',
  'admission_transfer_date': 'Admission Transfer Date',
  'admission_transfer_to_college': 'Admission transfer to College',
  'admission_transfer_from_college': 'Admission Transfer From College',
  'school_udise_no': 'School UDISE No',
};

/**
 * Staff-specific header mappings from API keys to friendly headers
 */
export const staffHeaderMappings: Record<string, string> = {
  // Role information
  'staff_role': 'Staff Role',
  'is_teaching_role': 'Teaching Role',
  
  // Personal information
  'first_name': 'First Name',
  'middle_name': 'Middle Name',
  'last_name': 'Last Name',
  'gender': 'Gender',
  'birth_date': 'Date of Birth',
  'aadhar_no': 'Aadhar Number',
  
  // Contact information
  'mobile_number': 'Mobile Number',
  'email': 'Email Address',
  'qualification': 'Qualification',
  
  // Address details
  'address': 'Address',
  'city': 'City',
  'state': 'State',
  'postal_code': 'Postal Code',
};

/**
 * Formats a snake_case API key to a Title Case header
 * Example: "first_name_in_guj" -> "First Name In Guj"
 * 
 * @param key The API key to format
 * @returns Formatted header text
 */
export function formatKeyToHeader(key: string): string {
  if (!key) return '';
  
  // Handle special case for uppercase abbreviations
  if (key.toUpperCase() === 'IFSC_CODE') return 'IFSC Code';
  
  // Special case abbreviations that should remain uppercase
  const uppercaseAbbreviations = ['gr', 'ifsc', 'dise', 'id', 'sms'];
  
  // Split by underscore and format each word
  return key
    .split('_')
    .map(word => {
      // Keep abbreviations uppercase
      if (uppercaseAbbreviations.includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      
      // Capitalize first letter of other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
