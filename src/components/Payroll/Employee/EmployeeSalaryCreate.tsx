// import { useParams } from "react-router-dom"
// import { useEffect, useState } from "react"
// import { useLazyGetSingleStaffQuery } from "@/services/StaffService"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { AlertCircle } from "lucide-react"
// import SalaryTemplateForm from "../SalaryTemplateForm"
// import type { StaffType } from "@/types/staff"

// const EmployeeSalaryCreate = () => {
//   const { employeeId } = useParams()
//   const [fetchStaff, { data: staffData, isLoading, error }] = useLazyGetSingleStaffQuery()
//   const [employee, setEmployee] = useState<StaffType | null>(null)

//   useEffect(() => {
//     if (employeeId) {
//       fetchStaff({ staff_id: Number(employeeId) })
//     }
//   }, [employeeId, fetchStaff])

//   useEffect(() => {
//     if (staffData) {
//       setEmployee(staffData)
//     }
//   }, [staffData])

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
//           <AlertDescription>Failed to load employee data. Please try again later.</AlertDescription>
//         </Alert>
//       </div>
//     )
//   }

//   return <SalaryTemplateForm mode="create" employee={employee} />
// }

// export default EmployeeSalaryCreate
