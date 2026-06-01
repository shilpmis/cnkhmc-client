// "use client"

// import { useParams } from "react-router-dom"
// import { useEffect, useState } from "react"
// import { useLazyGetSingleStaffQuery } from "@/services/StaffService"
// import { useLazyFetchSingleStaffSalaryTemplateQuery } from "@/services/PayrollService"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { AlertCircle } from "lucide-react"
// import SalaryTemplateForm from "../SalaryTemplateForm"
// import type { StaffType } from "@/types/staff"
// import type { StaffSalaryTemplate } from "@/types/payroll"

// const EmployeeSalaryEdit = () => {
//   const { employeeId } = useParams()
//   const [fetchStaff, { data: staffData, isLoading: isLoadingStaff, error: staffError }] = useLazyGetSingleStaffQuery()
//   const [fetchSalary, { data: salaryData, isLoading: isLoadingSalary, error: salaryError }] =
//     useLazyFetchSingleStaffSalaryTemplateQuery()

//   const [employee, setEmployee] = useState<StaffType | null>(null)
//   const [salary, setSalary] = useState<StaffSalaryTemplate | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     if (employeeId) {
//       fetchStaff({ staff_id: Number(employeeId) })
//       fetchSalary({ staff_id: Number(employeeId) })
//     }
//   }, [employeeId, fetchStaff, fetchSalary])

//   useEffect(() => {
//     if (staffData) {
//       setEmployee(staffData)
//     }
//     if (salaryData) {
//       setSalary(salaryData)
//     }

//     if (!isLoadingStaff && !isLoadingSalary) {
//       setIsLoading(false)
//     }

//     if (staffError) {
//       setError("Failed to load employee data")
//     } else if (salaryError) {
//       setError("Failed to load salary template data")
//     }
//   }, [staffData, salaryData, isLoadingStaff, isLoadingSalary, staffError, salaryError])

//   if (isLoading) {
//     return (
//       <div className="space-y-4 p-6">
//         <Skeleton className="h-8 w-64" />
//         <Skeleton className="h-4 w-48" />
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
//           <Skeleton className="h-24 w-full" />
//           <Skeleton className="h-24 w-full" />
//         </div>
//       </div>
//     )
//   }

//   if (error || !employee) {
//     return (
//       <div className="p-6">
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertTitle>Error</AlertTitle>
//           <AlertDescription>{error || "Failed to load data. Please try again later."}</AlertDescription>
//         </Alert>
//       </div>
//     )
//   }

//   return <SalaryTemplateForm mode="edit" employee={employee} existingSalary={salary} />
// }

// export default EmployeeSalaryEdit
