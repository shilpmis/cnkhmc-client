import { studentColumnHeaderMapping } from "@/utils/studentColumns";
/**
 * Maps API response keys to user-friendly Excel column headers
 * Used for client-side transformation of Excel headers
 */

/**
 * Student header mappings from API keys to the heads of the final student sheet.
 * Every institution uses the same heads.
 */
export const studentHeaderMappings: Record<string, string> = studentColumnHeaderMapping;
export const collegeStudentHeaderMappings: Record<string, string> = studentColumnHeaderMapping;

/**
 * Staff-specific header mappings from API keys to friendly headers
 */
export const staffHeaderMappings: Record<string, string> = {
  // Role & Employment information
  'staff_role': 'Staff Role',
  'employee_code': 'Employee Code',
  'staff_type': 'Staff Type',
  'staff_category': 'Staff Category',
  'designation': 'Designation',
  'employment_status': 'Employment Status',
  'nature_of_appointment': 'Nature of Appointment',
  'designation_on_doa': 'Designation on DOA',
  'department': 'Department',
  'joining_date': 'Joining Date',
  'promotion_date': 'Promotion Date',
  'pay_scale': 'Pay Scale / Grade',
  'working_hours': 'Working Hours',
  'retirement_age': 'Retirement Age',
  'retirement_date': 'Retirement Date',
  'resignation_date': 'Resignation Date',
  'is_teaching_role': 'Teaching Role',
  
  // Personal information
  'first_name': 'First Name',
  'middle_name': 'Middle Name',
  'last_name': 'Last Name',
  'first_name_in_guj': 'First Name (Gujarati)',
  'middle_name_in_guj': 'Middle Name (Gujarati)',
  'last_name_in_guj': 'Last Name (Gujarati)',
  'gender': 'Gender',
  'birth_date': 'Date of Birth',
  'marital_status': 'Marital Status',
  'blood_group': 'Blood Group',
  'aadhar_no': 'Aadhar Number',
  'pan_card_no': 'PAN Card No',
  'category': 'Category',
  'nationality': 'Nationality',
  'religion': 'Religion',
  'religion_in_guj': 'Religion (Gujarati)',
  'caste': 'Caste',
  'caste_in_guj': 'Caste (Gujarati)',
  'minority': 'Minority',
  'voter_id': 'Voter ID No',
  'driving_licence': 'Driving License No',
  'driving_licence_expiry': 'Driving License Validity',
  
  // Contact & Address information
  'mobile_number': 'Mobile Number',
  'email': 'Email Address',
  'emergency_contact_name': 'Emergency Contact Name',
  'emergency_contact_number': 'Emergency Contact Number',
  'address': 'Current Address',
  'city': 'City',
  'district': 'District',
  'state': 'State',
  'postal_code': 'Postal Code',
  'permanent_address': 'Permanent Address',
  
  // Academic qualifications
  'qualification': 'Primary Qualification',
  'subject_specialization': 'Subject Specialization',
  'ug_degree': 'UG Degree',
  'ug_passing_university': 'UG University',
  'ug_passing_year': 'UG Passing Year',
  'pg_degree': 'PG Degree',
  'pg_passing_university': 'PG University',
  'pg_passing_year': 'PG Passing Year',
  'diploma_degree': 'Diploma Degree',
  'diploma_council': 'Diploma Council',
  'diploma_passing_year': 'Diploma Passing Year',
  'other_degree': 'Other Degree',
  'other_passing_university': 'Other University',
  'other_passing_year': 'Other Passing Year',
  'md_subject': 'MD Subject',
  'passing_date': 'Passing Date',

  // Professional & Council Registration
  'teacher_code': 'AYUSH Teacher Code',
  'ayush_id_no': 'AYUSH Reg / ID No',
  'ayush_registration_no': 'AYUSH Registration No',
  'state_council_reg_no': 'State Council Reg No',
  'council_name': 'Name of Council',
  'nch_registration_no': 'NCH Registration No.',
  'nch_registration_date': 'NCH Registration Date',
  'registration_authority': 'Registration Authority',
  'area_of_expertise': 'Area of Expertise',
  'total_experience': 'Total Experience (Years)',

  // University Appointments & Approvals
  'university_approval_details': 'University Approvals (Details)',
  'uni_approval_details': 'University Approvals (Details)',
  'staff_letters_details': 'All Staff Letters & Approvals',
  'all_letters_details': 'All Staff Letters & Approvals',
  'university_appointment_details': 'University Appointments (Details)',
  'university_appointment_letter_no': 'University Appointment Letter No',
  'university_appointment_date': 'University Appointment Date',
  'uni_approval_number': 'University Approval Letter No',
  'uni_approval_date': 'University Approval Date',
  'uni_approval_remarks': 'University Approval Remarks',
  'university_approval_remarks': 'University Approval Remarks',
  'university_appointment_remarks': 'University Appointment Remarks',
  
  // Bank & Statutory details
  'bank_name': 'Bank Name',
  'bank_branch_name': 'Branch Name',
  'account_no': 'Account Number',
  'IFSC_code': 'IFSC Code',
  'epf_no': 'EPF Number',
  'epf_uan_no': 'EPF UAN Number',
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
