export interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  division: string;
  teacherId: string;
  students: Student[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  studentId: string;
  status: "present" | "absent";
}

export const mockStudents: Student[] = [
  { id: "1", name: "John Doe", rollNumber: "001" },
  { id: "2", name: "Jane Smith", rollNumber: "002" },
  { id: "3", name: "Alice Johnson", rollNumber: "003" },
  { id: "4", name: "Bob Brown", rollNumber: "004" },
  { id: "5", name: "Charlie Davis", rollNumber: "005" },
  { id: "6", name: "Diana Evans", rollNumber: "006" },
  { id: "7", name: "Ethan Foster", rollNumber: "007" },
  { id: "8", name: "Fiona Grant", rollNumber: "008" },
  { id: "9", name: "George Harris", rollNumber: "009" },
  { id: "10", name: "Hannah Ingram", rollNumber: "010" },
  { id: "11", name: "Ian Jackson", rollNumber: "011" },
  { id: "12", name: "Julia King", rollNumber: "012" },
  { id: "13", name: "Kevin Lee", rollNumber: "013" },
  { id: "14", name: "Laura Miller", rollNumber: "014" },
  { id: "15", name: "Michael Nelson", rollNumber: "015" },
];

export const mockClasses: Class[] = [
  {
    id: "1",
    name: "Class 1A",
    grade: "1",
    division: "A",
    teacherId: "1",
    students: mockStudents.slice(0, 5),
  },
  {
    id: "2",
    name: "Class 1B",
    grade: "1",
    division: "B",
    teacherId: "2",
    students: mockStudents.slice(5, 10),
  },
  {
    id: "3",
    name: "Class 2A",
    grade: "2",
    division: "A",
    teacherId: "3",
    students: mockStudents.slice(10, 15),
  },
  {
    id: "4",
    name: "Class 2B",
    grade: "2",
    division: "B",
    teacherId: "4",
    students: [mockStudents[0], mockStudents[5], mockStudents[10]],
  },
  {
    id: "5",
    name: "Class 3A",
    grade: "3",
    division: "A",
    teacherId: "5",
    students: [mockStudents[1], mockStudents[6], mockStudents[11]],
  },
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "1",
    date: "2023-06-01",
    classId: "1",
    studentId: "1",
    status: "present",
  },
  {
    id: "2",
    date: "2023-06-01",
    classId: "1",
    studentId: "2",
    status: "absent",
  },
  {
    id: "3",
    date: "2023-06-01",
    classId: "1",
    studentId: "3",
    status: "present",
  },
  {
    id: "4",
    date: "2023-06-01",
    classId: "1",
    studentId: "4",
    status: "present",
  },
  {
    id: "5",
    date: "2023-06-01",
    classId: "1",
    studentId: "5",
    status: "absent",
  },
  {
    id: "6",
    date: "2023-06-01",
    classId: "2",
    studentId: "6",
    status: "present",
  },
  {
    id: "7",
    date: "2023-06-01",
    classId: "2",
    studentId: "7",
    status: "present",
  },
  {
    id: "8",
    date: "2023-06-01",
    classId: "2",
    studentId: "8",
    status: "absent",
  },
  {
    id: "9",
    date: "2023-06-01",
    classId: "2",
    studentId: "9",
    status: "present",
  },
  {
    id: "10",
    date: "2023-06-01",
    classId: "2",
    studentId: "10",
    status: "present",
  },
  {
    id: "11",
    date: "2023-06-02",
    classId: "1",
    studentId: "1",
    status: "present",
  },
  {
    id: "12",
    date: "2023-06-02",
    classId: "1",
    studentId: "2",
    status: "present",
  },
  {
    id: "13",
    date: "2023-06-02",
    classId: "1",
    studentId: "3",
    status: "absent",
  },
  {
    id: "14",
    date: "2023-06-02",
    classId: "1",
    studentId: "4",
    status: "present",
  },
  {
    id: "15",
    date: "2023-06-02",
    classId: "1",
    studentId: "5",
    status: "present",
  },
  {
    id: "16",
    date: "2023-06-02",
    classId: "3",
    studentId: "11",
    status: "present",
  },
  {
    id: "17",
    date: "2023-06-02",
    classId: "3",
    studentId: "12",
    status: "absent",
  },
  {
    id: "18",
    date: "2023-06-02",
    classId: "3",
    studentId: "13",
    status: "present",
  },
  {
    id: "19",
    date: "2023-06-02",
    classId: "3",
    studentId: "14",
    status: "present",
  },
  {
    id: "20",
    date: "2023-06-02",
    classId: "3",
    studentId: "15",
    status: "absent",
  },
];

export const mockUsers: any[] = [
  { id: "1", name: "Mr. Anderson", role: "teacher" },
  { id: "2", name: "Mrs. Baker", role: "teacher" },
  { id: "3", name: "Mr. Clark", role: "teacher" },
  { id: "4", name: "Ms. Davis", role: "teacher" },
  { id: "5", name: "Mr. Edwards", role: "teacher" },
  { id: "6", name: "Mrs. Fisher", role: "admin" },
  { id: "7", name: "Dr. Graham", role: "principal" },
];

export const mockUserRole: "teacher" | "admin" | "principal" = "teacher";
