// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import type { LeaveRequest } from "@/types/leave"
// import LeaveManagement from "@/pages/LeaveDashboardForTeachers"

// // Mock function to simulate fetching data from an API
// const fetchUserData = () => {
//   return new Promise<{
//     leaveRequests: LeaveRequest[]
//     totalLeaves: { sick: number; vacation: number; personal: number }
//     monthlySalary: number
//   }>((resolve) => {
//     setTimeout(() => {
//       resolve({
//         leaveRequests: [
//           {
//             id: "1",
//             userId: "user1",
//             userName: "John Doe",
//             startDate: "2023-06-01",
//             endDate: "2023-06-03",
//             reason: "Family vacation",
//             status: "approved",
//             type: "vacation",
//             leaveType: "vacation",
//             createdAt: "2023-05-15T10:00:00Z",
//             updatedAt: "2023-05-16T14:00:00Z",
//           },
//           {
//             id: "2",
//             userId: "user1",
//             userName: "John Doe",
//             startDate: "2023-07-10",
//             endDate: "2023-07-11",
//             reason: "Doctor appointment",
//             status: "pending",
//             type: "sick",
//             leaveType: "sick",
//             createdAt: "2023-06-30T09:00:00Z",
//             updatedAt: "2023-06-30T09:00:00Z",
//           },
//           {
//             id: "3",
//             userId: "user1",
//             userName: "John Doe",
//             startDate: "2023-08-15",
//             endDate: "2023-08-15",
//             reason: "Personal errand",
//             status: "rejected",
//             type: "personal",
//             leaveType: "personal",
//             createdAt: "2023-07-20T11:00:00Z",
//             updatedAt: "2023-07-21T09:00:00Z",
//           },
//         ],
//         totalLeaves: {
//           sick: 10,
//           vacation: 15,
//           personal: 5,
//         },
//         monthlySalary: 5000,
//       })
//     }, 1000) // Simulate a 1-second delay
//   })
// }

// const LeaveManagementContainer: React.FC = () => {
//   const [userData, setUserData] = useState<{
//     leaveRequests: LeaveRequest[]
//     totalLeaves: { sick: number; vacation: number; personal: number }
//     monthlySalary: number
//   } | null>(null)

//   useEffect(() => {
//     const loadUserData = async () => {
//       const data = await fetchUserData()
//       setUserData(data)
//     }

//     loadUserData()
//   }, [])

//   if (!userData) {
//     return <div>Loading...</div>
//   }

//   return (
//     <LeaveManagement
//       initialLeaveRequests={userData.leaveRequests}
//       totalLeaves={userData.totalLeaves}
//       monthlySalary={userData.monthlySalary}
//     />
//   )
// }

// export default LeaveManagementContainer

