export const mockClasses = [
    { id: "class-1", name: "Nursery" },
    { id: "class-2", name: "LKG" },
    { id: "class-3", name: "UKG" },
    { id: "class-4", name: "Class 1" },
    { id: "class-5", name: "Class 2" },
    { id: "class-6", name: "Class 3" },
    { id: "class-7", name: "Class 4" },
    { id: "class-8", name: "Class 5" },
    { id: "class-9", name: "Class 6" },
    { id: "class-10", name: "Class 7" },
    { id: "class-11", name: "Class 8" },
    { id: "class-12", name: "Class 9" },
    { id: "class-13", name: "Class 10" },
    { id: "class-14", name: "Class 11 - Science" },
    { id: "class-15", name: "Class 11 - Commerce" },
    { id: "class-16", name: "Class 11 - Arts" },
    { id: "class-17", name: "Class 12 - Science" },
    { id: "class-18", name: "Class 12 - Commerce" },
    { id: "class-19", name: "Class 12 - Arts" },
  ]
  
  export const mockSeats = [
    { id: "seat-1", classId: "class-1", totalSeats: 40, quotaSeats: 15, filled: 25 },
    { id: "seat-2", classId: "class-2", totalSeats: 40, quotaSeats: 15, filled: 30 },
    { id: "seat-3", classId: "class-3", totalSeats: 40, quotaSeats: 15, filled: 28 },
    { id: "seat-4", classId: "class-4", totalSeats: 45, quotaSeats: 18, filled: 32 },
    { id: "seat-5", classId: "class-5", totalSeats: 45, quotaSeats: 18, filled: 35 },
    { id: "seat-6", classId: "class-6", totalSeats: 45, quotaSeats: 18, filled: 30 },
    { id: "seat-7", classId: "class-7", totalSeats: 45, quotaSeats: 18, filled: 28 },
    { id: "seat-8", classId: "class-8", totalSeats: 45, quotaSeats: 18, filled: 25 },
    { id: "seat-9", classId: "class-9", totalSeats: 50, quotaSeats: 20, filled: 30 },
    { id: "seat-10", classId: "class-10", totalSeats: 50, quotaSeats: 20, filled: 35 },
    { id: "seat-11", classId: "class-11", totalSeats: 50, quotaSeats: 20, filled: 40 },
    { id: "seat-12", classId: "class-12", totalSeats: 50, quotaSeats: 20, filled: 38 },
    { id: "seat-13", classId: "class-13", totalSeats: 50, quotaSeats: 20, filled: 42 },
    { id: "seat-14", classId: "class-14", totalSeats: 40, quotaSeats: 15, filled: 25 },
    { id: "seat-15", classId: "class-15", totalSeats: 40, quotaSeats: 15, filled: 20 },
    { id: "seat-16", classId: "class-16", totalSeats: 40, quotaSeats: 15, filled: 15 },
    { id: "seat-17", classId: "class-17", totalSeats: 40, quotaSeats: 15, filled: 30 },
    { id: "seat-18", classId: "class-18", totalSeats: 40, quotaSeats: 15, filled: 25 },
    { id: "seat-19", classId: "class-19", totalSeats: 40, quotaSeats: 15, filled: 20 },
  ]
  
  export const mockQuotas = [
    {
      id: "quota-1",
      name: "RTE Quota",
      description: "Right to Education",
      criteria: "For economically weaker sections as per RTE Act",
      createdAt: "2023-01-15T10:30:00Z",
    },
    {
      id: "quota-2",
      name: "Staff Quota",
      description: "For staff children",
      criteria: "Children of teaching and non-teaching staff of the school",
      createdAt: "2023-01-20T11:45:00Z",
    },
    {
      id: "quota-3",
      name: "Sports Quota",
      description: "For sports excellence",
      criteria: "Students with district/state/national level achievements in sports",
      createdAt: "2023-02-05T09:15:00Z",
    },
    {
      id: "quota-4",
      name: "Management Quota",
      description: "Management discretion",
      criteria: "At the discretion of school management",
      createdAt: "2023-02-10T14:20:00Z",
    },
  ]
  
  export const mockInquiries = [
    {
      id: "inq-1",
      studentName: "Rahul Sharma",
      class: "Class 5",
      parentName: "Vikram Sharma",
      contact: "9876543210",
      email: "vikram.sharma@example.com",
      date: "2023-03-15T10:30:00Z",
      status: "pending",
    },
    {
      id: "inq-2",
      studentName: "Priya Patel",
      class: "Class 3",
      parentName: "Nitin Patel",
      contact: "9876543211",
      email: "nitin.patel@example.com",
      date: "2023-03-16T11:45:00Z",
      status: "eligible",
    },
    {
      id: "inq-3",
      studentName: "Arjun Singh",
      class: "Class 7",
      parentName: "Rajinder Singh",
      contact: "9876543212",
      email: "rajinder.singh@example.com",
      date: "2023-03-17T09:15:00Z",
      status: "ineligible",
    },
    {
      id: "inq-4",
      studentName: "Ananya Gupta",
      class: "Class 1",
      parentName: "Sanjay Gupta",
      contact: "9876543213",
      email: "sanjay.gupta@example.com",
      date: "2023-03-18T14:20:00Z",
      status: "approved",
    },
    {
      id: "inq-5",
      studentName: "Rohan Verma",
      class: "Class 9",
      parentName: "Prakash Verma",
      contact: "9876543214",
      email: "prakash.verma@example.com",
      date: "2023-03-19T16:30:00Z",
      status: "pending",
    },
    {
      id: "inq-6",
      studentName: "Neha Kapoor",
      class: "Class 11 - Science",
      parentName: "Rajesh Kapoor",
      contact: "9876543215",
      email: "rajesh.kapoor@example.com",
      date: "2023-03-20T10:00:00Z",
      status: "eligible",
    },
    {
      id: "inq-7",
      studentName: "Karan Malhotra",
      class: "Class 6",
      parentName: "Sunil Malhotra",
      contact: "9876543216",
      email: "sunil.malhotra@example.com",
      date: "2023-03-21T11:30:00Z",
      status: "pending",
    },
    {
      id: "inq-8",
      studentName: "Ishita Joshi",
      class: "Class 2",
      parentName: "Deepak Joshi",
      contact: "9876543217",
      email: "deepak.joshi@example.com",
      date: "2023-03-22T13:45:00Z",
      status: "approved",
    },
  ]
  
  export interface InquiriesForStudent {
    id: number
    student_name: string
    parent_name: string
    contact_number: string
    email: string
    grade_applying: string
    status: string
    created_at: string
    updated_at: string
  }
  
  export interface DashboardData {
    totalInquiries: number
    pendingApplications: number
    acceptedAdmissions: number
    rejectedApplications: number
    upcomingInterviews: number
  }
  
  export interface AdmissionTrend {
    grade: string
    inquiries: number
  }
  
  