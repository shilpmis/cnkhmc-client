import type { User } from "../types/user"

export const mockUsers: User[] = Array.from({ length: 20 }, (_, i) => ({
  id: (i + 1).toString(),
  image: `/placeholder.svg?height=40&width=40`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  mobileNumber: `+1234567890${i.toString().padStart(2, "0")}`,
  registrationDetails: `REG${(i + 1).toString().padStart(4, "0")}`,
  password: "password123",
  currentStatus: i % 2 === 0 ? "Active" : "Inactive",
  delegateResponsibilities: {
    managementDepartment: i % 2 === 0,
    studentDetails: i % 3 === 0,
    timeTable: i % 4 === 0,
    feeStructure: i % 5 === 0,
    staffManagement: i % 6 === 0,
    listOfComplaints: i % 7 === 0,
    accounts: i % 8 === 0,
    resultDetails: i % 9 === 0,
    transportDepartment: i % 10 === 0,
    hostelDepartment: i % 11 === 0,
  },
}))

