// "use client"

// import type React from "react"
// import { useState, useEffect, useMemo } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { SaralDatePicker } from "@/components/ui/common/SaralDatePicker"
// import { toast } from "@/hooks/use-toast"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
// import { useLazyFetchAttendanceForDateQuery, useMarkAttendanceMutation } from "@/services/AttendanceServices"
// import type { AttendanceDetails } from "@/types/attendance"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import {
//   ChevronLeft,
//   Loader2,
//   Calendar,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Clock,
//   Search,
//   Users,
//   CalendarClock,
//   Filter,
//   Save,
// } from "lucide-react"

// interface StudentAttendanceViewProps {
//   classId: string
// }

// const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({ classId }) => {
//   const user = useAppSelector(selectCurrentUser)
//   const [fetchAttendanceForDate, { data: attendanceData, isLoading }] = useLazyFetchAttendanceForDateQuery()
//   const [markAttendanceForDate, { isLoading: isMarkingAttendance }] = useMarkAttendanceMutation()
//   const currentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
//   const [classValidation, setClassValidation] = useState<{
//     isLoading: boolean
//     isValid: boolean
//   }>({
//     isLoading: true,
//     isValid: false,
//   })
//   const [filter, setFilter] = useState<"all" | "present" | "absent" | "late" | "half_day">("all")
//   const [searchTerm, setSearchTerm] = useState("")
//   const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDetails | null>(null)

//   const navigate = useNavigate()
//   const params = useParams<{ classId: string }>()

//   // Calculate attendance statistics
//   const attendanceStats = useMemo(() => {
//     if (!attendanceRecords?.attendance_data) return { present: 0, absent: 0, late: 0, half_day: 0, total: 0 }

//     const total = attendanceRecords.attendance_data.length
//     const present = attendanceRecords.attendance_data.filter((s) => s.status === "present").length
//     const absent = attendanceRecords.attendance_data.filter((s) => s.status === "absent").length
//     const late = attendanceRecords.attendance_data.filter((s) => s.status === "late").length
//     const half_day = attendanceRecords.attendance_data.filter((s) => s.status === "half_day").length

//     return { present, absent, late, half_day, total }
//   }, [attendanceRecords])

//   // Filter and search students
//   const filteredStudents = useMemo(() => {
//     if (!attendanceRecords?.attendance_data) return []

//     return attendanceRecords.attendance_data.filter((student) => {
//       const matchesFilter = filter === "all" || student.status === filter
//       const matchesSearch =
//         student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         student.roll_number.toString().includes(searchTerm)
//       return matchesFilter && matchesSearch
//     })
//   }, [attendanceRecords, filter, searchTerm])

//   const handleAttendanceChange = (studentId: number, status: "present" | "absent" | "late" | "half_day") => {
//     if (attendanceRecords) {
//       const updatedStudents = attendanceRecords.attendance_data.map((student) =>
//         student.student_id === studentId ? { ...student, status } : student,
//       )
//       setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
//     }
//   }

//   const handleMarkAll = (status: "present" | "absent" | "late" | "half_day") => {
//     if (attendanceRecords) {
//       const updatedStudents = attendanceRecords.attendance_data.map((student) => ({ ...student, status }))
//       setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
//     }
//   }

//   const handleSubmit = async () => {
//     try {
//       if (!attendanceRecords || !selectedDate) {
//         toast({
//           title: "Error",
//           description: "No attendance data to submit",
//           variant: "destructive",
//         })
//         return
//       }

//       const res = await markAttendanceForDate({ payload: attendanceRecords })
//       if (res.data) {
//         toast({
//           variant: "default",
//           title: "Success",
//           description: "Attendance marked successfully!",
//         })
//       }
//       if ("error" in res) {
//         toast({
//           variant: "destructive",
//           title: "Failed to mark attendance",
//           description: "An error occurred while submitting the attendance data.",
//         })
//       }
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "System Error",
//         description: "An unexpected error occurred. Please try again later.",
//       })
//     }
//   }

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "present":
//         return (
//           <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
//             Present
//           </Badge>
//         )
//       case "absent":
//         return (
//           <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
//             Absent
//           </Badge>
//         )
//       case "late":
//         return (
//           <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
//             Late
//           </Badge>
//         )
//       case "half_day":
//         return (
//           <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
//             Half Day
//           </Badge>
//         )
//       default:
//         return <Badge variant="outline">Unknown</Badge>
//     }
//   }

//   const isSunday = selectedDate && selectedDate.getDay() === 0
//   const isFutureDate = selectedDate && selectedDate > new Date()
//   const isHoliday = false // This could be implemented if you have holiday data

//   // Validate class and fetch attendance
//   useEffect(() => {
//     if (user) {
//       const isClassAssigned = user.staff?.assigend_classes?.some((cls) => cls.class.id === Number(classId))

//       setClassValidation({
//         isLoading: false,
//         isValid: Boolean(isClassAssigned),
//       })
//     }
//   }, [user, classId])

//   useEffect(() => {
//     if (params.classId !== classId) {
//       navigate(`/d/mark-attendance/${classId}`)
//     }
//   }, [params.classId, classId, navigate])

//   useEffect(() => {
//     if (
//       !isSunday &&
//       !isFutureDate &&
//       !isHoliday &&
//       selectedDate &&
//       currentAcademicSessionForSchool &&
//       classValidation.isValid
//     ) {
//       fetchAttendanceForDate({
//         class_id: Number(classId),
//         unix_date: Math.floor(selectedDate.getTime() / 1000),
//         academic_session: currentAcademicSessionForSchool.id,
//       }).catch((error) => {
//         toast({
//           title: "Failed to fetch attendance data",
//           description: "Please try refreshing the page.",
//           variant: "destructive",
//         })
//       })
//     }
//   }, [
//     selectedDate,
//     classId,
//     fetchAttendanceForDate,
//     isSunday,
//     isFutureDate,
//     isHoliday,
//     currentAcademicSessionForSchool,
//     classValidation.isValid,
//   ])

//   // Update attendance records when data is fetched
//   useEffect(() => {
//     if (attendanceData && selectedDate && user?.staff) {
//       setAttendanceRecords({
//         ...attendanceData,
//         academic_session_id: currentAcademicSessionForSchool!.id,
//         class_id: Number(classId),
//         date: selectedDate.toISOString().split("T")[0],
//         marked_by: user.staff.id,
//       })
//     }
//   }, [attendanceData, classId, selectedDate, user, currentAcademicSessionForSchool])

//   // Class validation loading state
//   if (classValidation.isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="animate-spin h-8 w-8 text-primary" />
//         <span className="ml-2 text-muted-foreground">Validating class access...</span>
//       </div>
//     )
//   }

//   // Unauthorized access
//   if (!classValidation.isValid) {
//     return (
//       <Alert variant="destructive" className="max-w-3xl mx-auto mt-8">
//         <AlertCircle className="h-4 w-4" />
//         <AlertTitle>Unauthorized Access</AlertTitle>
//         <AlertDescription className="flex flex-col gap-4">
//           <p>You are not authorized to view or manage attendance for this class.</p>
//           <Button onClick={() => navigate("/d/mark-attendance")} variant="outline" className="w-fit">
//             <ChevronLeft className="mr-2 h-4 w-4" />
//             Return to class selection
//           </Button>
//         </AlertDescription>
//       </Alert>
//     )
//   }

//   return (
//     <div className="container mx-auto px-4 py-6">
//       <div className="flex flex-col mb-8">
//         <div className="flex items-center justify-between">
//           <div>
//             <Button
//               onClick={() => navigate("/d/mark-attendance")}
//               variant="ghost"
//               className="mb-2 -ml-2 text-muted-foreground"
//             >
//               <ChevronLeft className="mr-1 h-4 w-4" />
//               Back to classes
//             </Button>
//             <h1 className="text-3xl font-bold">Class Attendance</h1>
//             <p className="text-muted-foreground mt-1">Manage daily attendance records</p>
//           </div>
//         </div>
//       </div>

//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div>
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <Calendar className="h-5 w-5 text-primary" />
//                 Attendance for Class {classId}
//               </CardTitle>
//               <CardDescription>Select a date and mark attendance for students</CardDescription>
//             </div>
//             <div className="flex flex-col sm:flex-row gap-3">
//               <SaralDatePicker date={selectedDate} onDateChange={(date: Date | undefined) => setSelectedDate(date)} />
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {/* Date-specific alerts */}
//           {!selectedDate ? (
//             <Alert className="mb-4">
//               <AlertCircle className="h-4 w-4" />
//               <AlertTitle>No date selected</AlertTitle>
//               <AlertDescription>Please select a date to view or record attendance.</AlertDescription>
//             </Alert>
//           ) : isSunday ? (
//             <Alert className="mb-4">
//               <AlertCircle className="h-4 w-4" />
//               <AlertTitle>Sunday</AlertTitle>
//               <AlertDescription>It's Sunday. No attendance is required.</AlertDescription>
//             </Alert>
//           ) : isFutureDate ? (
//             <Alert className="mb-4" variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertTitle>Future date</AlertTitle>
//               <AlertDescription>You cannot mark attendance for future dates.</AlertDescription>
//             </Alert>
//           ) : isLoading ? (
//             <div className="space-y-3">
//               <div className="flex justify-between items-center">
//                 <Skeleton className="h-10 w-[250px]" />
//                 <Skeleton className="h-10 w-[180px]" />
//               </div>
//               {[1, 2, 3, 4, 5].map((i) => (
//                 <Skeleton key={i} className="h-16 w-full" />
//               ))}
//             </div>
//           ) : attendanceRecords && attendanceRecords.attendance_data.length > 0 ? (
//             <div>
//               {/* Attendance stats */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <Card className="bg-green-50">
//                   <CardContent className="p-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-green-600">Present</p>
//                       <p className="text-2xl font-bold text-green-700">
//                         {attendanceStats.present}
//                         <span className="text-sm font-normal text-green-600 ml-1">/ {attendanceStats.total}</span>
//                       </p>
//                     </div>
//                     <CheckCircle className="h-8 w-8 text-green-500" />
//                   </CardContent>
//                 </Card>

//                 <Card className="bg-red-50">
//                   <CardContent className="p-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-red-600">Absent</p>
//                       <p className="text-2xl font-bold text-red-700">
//                         {attendanceStats.absent}
//                         <span className="text-sm font-normal text-red-600 ml-1">/ {attendanceStats.total}</span>
//                       </p>
//                     </div>
//                     <XCircle className="h-8 w-8 text-red-500" />
//                   </CardContent>
//                 </Card>

//                 <Card className="bg-amber-50">
//                   <CardContent className="p-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-amber-600">Late</p>
//                       <p className="text-2xl font-bold text-amber-700">
//                         {attendanceStats.late}
//                         <span className="text-sm font-normal text-amber-600 ml-1">/ {attendanceStats.total}</span>
//                       </p>
//                     </div>
//                     <Clock className="h-8 w-8 text-amber-500" />
//                   </CardContent>
//                 </Card>

//                 <Card className="bg-blue-50">
//                   <CardContent className="p-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-blue-600">Half Day</p>
//                       <p className="text-2xl font-bold text-blue-700">
//                         {attendanceStats.half_day}
//                         <span className="text-sm font-normal text-blue-600 ml-1">/ {attendanceStats.total}</span>
//                       </p>
//                     </div>
//                     <CalendarClock className="h-8 w-8 text-blue-500" />
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Search and filter */}
//               <div className="mb-6 flex flex-col sm:flex-row gap-4">
//                 <div className="relative flex-grow">
//                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Search by name or roll number..."
//                     className="pl-9"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                 </div>
//                 <div className="flex gap-2">
//                   <Select
//                     value={filter}
//                     onValueChange={(value: "all" | "present" | "absent" | "late" | "half_day") => setFilter(value)}
//                   >
//                     <SelectTrigger className="w-[180px]">
//                       <div className="flex items-center">
//                         <Filter className="mr-2 h-4 w-4" />
//                         <SelectValue placeholder="Filter attendance" />
//                       </div>
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Students</SelectItem>
//                       <SelectItem value="present">Present Only</SelectItem>
//                       <SelectItem value="absent">Absent Only</SelectItem>
//                       <SelectItem value="late">Late Only</SelectItem>
//                       <SelectItem value="half_day">Half Day Only</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               {/* Batch actions */}
//               <div className="flex flex-wrap gap-2 mb-4">
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
//                   disabled={isMarkingAttendance}
//                   onClick={() => handleMarkAll("present")}
//                 >
//                   <CheckCircle className="mr-1 h-4 w-4" />
//                   Mark All Present
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
//                   disabled={isMarkingAttendance}
//                   onClick={() => handleMarkAll("absent")}
//                 >
//                   <XCircle className="mr-1 h-4 w-4" />
//                   Mark All Absent
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
//                   disabled={isMarkingAttendance}
//                   onClick={() => handleMarkAll("late")}
//                 >
//                   <Clock className="mr-1 h-4 w-4" />
//                   Mark All Late
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
//                   disabled={isMarkingAttendance}
//                   onClick={() => handleMarkAll("half_day")}
//                 >
//                   <CalendarClock className="mr-1 h-4 w-4" />
//                   Mark All Half Day
//                 </Button>
//               </div>

//               {filteredStudents.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
//                   <h3 className="mt-2 text-lg font-medium">No students found</h3>
//                   <p className="text-sm text-muted-foreground">Try adjusting your search or filter to find students.</p>
//                 </div>
//               ) : (
//                 <Tabs defaultValue="table" className="w-full">
//                   <TabsList className="mb-4">
//                     <TabsTrigger value="table">Table View</TabsTrigger>
//                     <TabsTrigger value="cards">Card View</TabsTrigger>
//                   </TabsList>

//                   {/* Table View */}
//                   <TabsContent value="table">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead>Roll No.</TableHead>
//                           <TableHead>Name</TableHead>
//                           <TableHead className="w-[180px]">Attendance</TableHead>
//                           <TableHead className="w-[100px]">Status</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {filteredStudents.map((student) => (
//                           <TableRow key={student.student_id}>
//                             <TableCell className="font-medium">{student.roll_number}</TableCell>
//                             <TableCell>{student.student_name}</TableCell>
//                             <TableCell>
//                               <Select
//                                 value={student.status}
//                                 disabled={isMarkingAttendance}
//                                 onValueChange={(value: "present" | "absent" | "late" | "half_day") =>
//                                   handleAttendanceChange(student.student_id, value)
//                                 }
//                               >
//                                 <SelectTrigger className="w-[140px]">
//                                   <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   <SelectItem value="present">Present</SelectItem>
//                                   <SelectItem value="absent">Absent</SelectItem>
//                                   <SelectItem value="late">Late</SelectItem>
//                                   <SelectItem value="half_day">Half Day</SelectItem>
//                                 </SelectContent>
//                               </Select>
//                             </TableCell>
//                             <TableCell>{getStatusBadge(student.status)}</TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </TabsContent>

//                   {/* Card View */}
//                   <TabsContent value="cards">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                       {filteredStudents.map((student) => (
//                         <Card
//                           key={student.student_id}
//                           className={`
//                           border-l-4 
//                           ${student.status === "present" ? "border-l-green-500" : ""} 
//                           ${student.status === "absent" ? "border-l-red-500" : ""}
//                           ${student.status === "late" ? "border-l-amber-500" : ""}
//                           ${student.status === "half_day" ? "border-l-blue-500" : ""}
//                         `}
//                         >
//                           <CardContent className="p-4">
//                             <div className="flex justify-between items-center mb-2">
//                               <div>
//                                 <p className="font-medium">{student.student_name}</p>
//                                 <p className="text-sm text-muted-foreground">Roll No: {student.roll_number}</p>
//                               </div>
//                               {getStatusBadge(student.status)}
//                             </div>
//                             <div className="mt-4">
//                               <Select
//                                 value={student.status}
//                                 disabled={isMarkingAttendance}
//                                 onValueChange={(value: "present" | "absent" | "late" | "half_day") =>
//                                   handleAttendanceChange(student.student_id, value)
//                                 }
//                               >
//                                 <SelectTrigger className="w-full">
//                                   <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   <SelectItem value="present">Present</SelectItem>
//                                   <SelectItem value="absent">Absent</SelectItem>
//                                   <SelectItem value="late">Late</SelectItem>
//                                   <SelectItem value="half_day">Half Day</SelectItem>
//                                 </SelectContent>
//                               </Select>
//                             </div>
//                           </CardContent>
//                         </Card>
//                       ))}
//                     </div>
//                   </TabsContent>
//                 </Tabs>
//               )}

//               <div className="mt-6 flex justify-end">
//                 <Button onClick={handleSubmit} disabled={isMarkingAttendance} className="gap-2">
//                   {isMarkingAttendance ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Submitting...
//                     </>
//                   ) : attendanceData?.is_marked ? (
//                     <>
//                       <Save className="h-4 w-4" />
//                       Update Attendance
//                     </>
//                   ) : (
//                     <>
//                       <Save className="h-4 w-4" />
//                       Submit Attendance
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <Alert className="mb-4">
//               <AlertCircle className="h-4 w-4" />
//               <AlertTitle>No students</AlertTitle>
//               <AlertDescription>There are no students registered for this class.</AlertDescription>
//             </Alert>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// export default StudentAttendanceView


"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaralDatePicker } from "@/components/ui/common/SaralDatePicker"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import {
  useLazyFetchAttendanceForDateQuery,
  useMarkAttendanceMutation,
  // useUpdateStudentAttendanceMutation,
} from "@/services/AttendanceServices"
import type { AttendanceDetails, StudentAttendanceUpdate } from "@/types/attendance"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ChevronLeft,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Users,
  CalendarClock,
  Filter,
  Save,
  RefreshCw,
  CheckSquare,
} from "lucide-react"

interface StudentAttendanceViewProps {
  classId: string
}

const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({ classId }) => {
  const user = useAppSelector(selectCurrentUser)
  const [fetchAttendanceForDate, { data: attendanceData, isLoading }] = useLazyFetchAttendanceForDateQuery()
  const [markAttendanceForDate, { isLoading: isMarkingAttendance }] = useMarkAttendanceMutation()
  // const [updateStudentAttendance, { isLoading: isUpdatingAttendance }] = useUpdateStudentAttendanceMutation()
  // const [fetchAttendanceForDate, { isLoading: isCheckingStatus }] = useLazyfetchAttendanceForDateQuery()

  const currentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [classValidation, setClassValidation] = useState<{
    isLoading: boolean
    isValid: boolean
    className: string
  }>({
    isLoading: true,
    isValid: false,
    className: "",
  })
  const [filter, setFilter] = useState<"all" | "present" | "absent" | "late" | "half_day">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDetails | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [isAttendanceMarked, setIsAttendanceMarked] = useState<boolean>(false)
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false)

  const navigate = useNavigate()
  const params = useParams<{ classId: string }>()

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!attendanceRecords?.attendance_data) return { present: 0, absent: 0, late: 0, half_day: 0, total: 0 }

    const total = attendanceRecords.attendance_data.length
    const present = attendanceRecords.attendance_data.filter((s) => s.status === "present").length
    const absent = attendanceRecords.attendance_data.filter((s) => s.status === "absent").length
    const late = attendanceRecords.attendance_data.filter((s) => s.status === "late").length
    const half_day = attendanceRecords.attendance_data.filter((s) => s.status === "half_day").length

    return { present, absent, late, half_day, total }
  }, [attendanceRecords])

  // Filter and search students
  const filteredStudents = useMemo(() => {
    if (!attendanceRecords?.attendance_data) return []

    return attendanceRecords.attendance_data.filter((student) => {
      const matchesFilter = filter === "all" || student.status === filter
      const matchesSearch =
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number.toString().includes(searchTerm)
      return matchesFilter && matchesSearch
    })
  }, [attendanceRecords, filter, searchTerm])

  const handleAttendanceChange = (studentId: number, status: "present" | "absent" | "late" | "half_day") => {
    if (attendanceRecords) {
      const updatedStudents = attendanceRecords.attendance_data.map((student) =>
        student.student_id === studentId ? { ...student, status } : student,
      )
      setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
    }
  }

  const handleMarkAll = (status: "present" | "absent" | "late" | "half_day") => {
    if (attendanceRecords) {
      const updatedStudents = attendanceRecords.attendance_data.map((student) => ({ ...student, status }))
      setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
    }
  }

  const handleSelectStudent = (studentId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedStudents([...selectedStudents, studentId])
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    }
  }

  const handleSelectAllStudents = (isChecked: boolean) => {
    if (isChecked && attendanceRecords) {
      setSelectedStudents(attendanceRecords.attendance_data.map((student) => student.student_id))
    } else {
      setSelectedStudents([])
    }
  }

  const handleBulkStatusChange = (status: "present" | "absent" | "late" | "half_day") => {
    if (attendanceRecords && selectedStudents.length > 0) {
      const updatedStudents = attendanceRecords.attendance_data.map((student) =>
        selectedStudents.includes(student.student_id) ? { ...student, status } : student,
      )
      setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
    }
  }

  const handleSubmit = async () => {
    try {
      if (!attendanceRecords || !selectedDate) {
        toast({
          title: "Error",
          description: "No attendance data to submit",
          variant: "destructive",
        })
        return
      }

      const res = await markAttendanceForDate({ payload: attendanceRecords })
      if (res.data) {
        toast({
          variant: "default",
          title: "Success",
          description: "Attendance marked successfully!",
        })

        // Refetch to verify attendance was marked
        await fetchAttendanceForDate({
          class_id: Number(classId),
          unix_date: Math.floor(selectedDate.getTime() / 1000),
          academic_session: currentAcademicSessionForSchool!.id,
        })
          .unwrap()
          .then((data: any) => {
            setIsAttendanceMarked(data.is_marked)
            setIsUpdateMode(data.is_marked)
          })
          .catch((error: any) => {
            console.error("Failed to check attendance status:", error)
          })

        // Refetch attendance data to get the latest state

      }
      if ("error" in res) {
        toast({
          variant: "destructive",
          title: "Failed to mark attendance",
          description: "An error occurred while submitting the attendance data.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred. Please try again later.",
      })
    }
  }

  const handleUpdateSelectedStudents = async () => {
    if (!attendanceRecords || !selectedDate || selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "No students selected for update",
        variant: "destructive",
      })
      return
    }

    // try {
    //   // Create updates array for selected students only
    //   const updates: StudentAttendanceUpdate[] = attendanceRecords.attendance_data
    //     .filter((student) => selectedStudents.includes(student.student_id))
    //     .map((student) => ({
    //       student_id: student.student_id,
    //       status: student.status,
    //     }))

    //   const res = await updateStudentAttendance({
    //     class_id: Number(classId),
    //     date: selectedDate.toISOString().split("T")[0],
    //     academic_session_id: currentAcademicSessionForSchool!.id,
    //     updates,
    //   })

    //   if ("data" in res && res.data.success) {
    //     toast({
    //       variant: "default",
    //       title: "Success",
    //       description: `Updated attendance for ${updates.length} student(s)`,
    //     })

    //     // Refetch attendance data to get the latest state
    //     await fetchAttendanceForDate({
    //       class_id: Number(classId),
    //       unix_date: Math.floor(selectedDate.getTime() / 1000),
    //       academic_session: currentAcademicSessionForSchool!.id,
    //     })

    //     // Clear selections after successful update
    //     setSelectedStudents([])
    //   } else {
    //     toast({
    //       variant: "destructive",
    //       title: "Update Failed",
    //       description: "Failed to update student attendance records.",
    //     })
    //   }
    // } catch (error) {
    //   toast({
    //     variant: "destructive",
    //     title: "System Error",
    //     description: "An unexpected error occurred while updating attendance.",
    //   })
    // }
  }

  const refreshAttendanceData = async () => {
    if (!selectedDate || !currentAcademicSessionForSchool) return

    try {
      // Check if attendance is marked for this date
      const statusResult = await fetchAttendanceForDate({
        class_id: Number(classId),
        unix_date: Math.floor(selectedDate.getTime() / 1000),
        academic_session: currentAcademicSessionForSchool.id,
      }).unwrap()

      if (statusResult) {
        setIsAttendanceMarked(statusResult.is_marked)
        setIsUpdateMode(statusResult.is_marked)
      }

      // Fetch the attendance data
      // await fetchAttendanceForDate({
      //   class_id: Number(classId),
      //   unix_date: Math.floor(selectedDate.getTime() / 1000),
      //   academic_session: currentAcademicSessionForSchool.id,
      // })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh attendance data.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            Present
          </Badge>
        )
      case "absent":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            Absent
          </Badge>
        )
      case "late":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
            Late
          </Badge>
        )
      case "half_day":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            Half Day
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const isSunday = selectedDate && selectedDate.getDay() === 0
  const isFutureDate = selectedDate && selectedDate > new Date()
  const isHoliday = false // This could be implemented if you have holiday data

  // Validate class and fetch attendance
  useEffect(() => {
    if (user) {
      const assignedClass = user.staff?.assigend_classes?.find((cls) => cls.class.id === Number(classId))

      setClassValidation({
        isLoading: false,
        isValid: Boolean(assignedClass),
        className: assignedClass ? `${assignedClass.class.class.class} - ` : "",
      })
    }
  }, [user, classId])

  useEffect(() => {
    if (params.classId !== classId) {
      navigate(`/d/mark-attendance/${classId}`)
    }
  }, [params.classId, classId, navigate])

  // Check attendance status and fetch data when date changes
  useEffect(() => {
    const checkAndFetchAttendance = async () => {
      if (
        !isSunday &&
        !isFutureDate &&
        !isHoliday &&
        selectedDate &&
        currentAcademicSessionForSchool &&
        classValidation.isValid
      ) {
        try {
          // First check if attendance is already marked
          const statusResult = await await fetchAttendanceForDate({
            class_id: Number(classId),
            unix_date: Math.floor(selectedDate.getTime() / 1000),
            academic_session: currentAcademicSessionForSchool.id,
          }).unwrap()

          setIsAttendanceMarked(statusResult.is_marked)
          setIsUpdateMode(statusResult.is_marked)

          // Then fetch the attendance data

        } catch (error) {
          toast({
            title: "Failed to fetch attendance data",
            description: "Please try refreshing the page.",
            variant: "destructive",
          })
        }
      }
    }

    checkAndFetchAttendance()
  }, [
    selectedDate,
    classId,
    fetchAttendanceForDate,
    isSunday,
    isFutureDate,
    isHoliday,
    currentAcademicSessionForSchool,
    classValidation.isValid,
  ])

  // Update attendance records when data is fetched
  useEffect(() => {
    if (attendanceData && selectedDate && user?.staff) {
      setAttendanceRecords({
        ...attendanceData,
        academic_session_id: currentAcademicSessionForSchool!.id,
        class_id: Number(classId),
        date: selectedDate.toISOString().split("T")[0],
        marked_by: user.staff.id,
        is_marked: attendanceData.is_marked,
      })

      // If data is fetched and is_marked is true, update our state
      if (attendanceData.is_marked) {
        setIsAttendanceMarked(true)
        setIsUpdateMode(true)
      }
    }
  }, [attendanceData, classId, selectedDate, user, currentAcademicSessionForSchool])

  // Reset selected students when date changes
  useEffect(() => {
    setSelectedStudents([])
  }, [selectedDate])

  // Class validation loading state
  if (classValidation.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2 text-muted-foreground">Validating class access...</span>
      </div>
    )
  }

  // Unauthorized access
  if (!classValidation.isValid) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unauthorized Access</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <p>You are not authorized to view or manage attendance for this class.</p>
          <Button onClick={() => navigate("/d/mark-attendance")} variant="outline" className="w-fit">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Return to class selection
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => navigate("/d/mark-attendance")}
              variant="ghost"
              className="mb-2 -ml-2 text-muted-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to classes
            </Button>
            <h1 className="text-3xl font-bold">Class Attendance</h1>
            <p className="text-muted-foreground mt-1">{classValidation.className}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Attendance for {selectedDate?.toLocaleDateString()}
                {isAttendanceMarked && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" /> Marked
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isUpdateMode
                  ? "Select students to update their attendance status"
                  : "Mark attendance for all students"}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center">
                <SaralDatePicker date={selectedDate} onDateChange={(date: Date | undefined) => setSelectedDate(date)} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshAttendanceData}
                  disabled={isLoading}
                  className="ml-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Date-specific alerts */}
          {!selectedDate ? (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No date selected</AlertTitle>
              <AlertDescription>Please select a date to view or record attendance.</AlertDescription>
            </Alert>
          ) : isSunday ? (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sunday</AlertTitle>
              <AlertDescription>It's Sunday. No attendance is required.</AlertDescription>
            </Alert>
          ) : isFutureDate ? (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Future date</AlertTitle>
              <AlertDescription>You cannot mark attendance for future dates.</AlertDescription>
            </Alert>
          ) : isLoading  ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : attendanceRecords && attendanceRecords.attendance_data.length > 0 ? (
            <div>
              {/* Attendance stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-green-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Present</p>
                      <p className="text-2xl font-bold text-green-700">
                        {attendanceStats.present}
                        <span className="text-sm font-normal text-green-600 ml-1">/ {attendanceStats.total}</span>
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </CardContent>
                </Card>

                <Card className="bg-red-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Absent</p>
                      <p className="text-2xl font-bold text-red-700">
                        {attendanceStats.absent}
                        <span className="text-sm font-normal text-red-600 ml-1">/ {attendanceStats.total}</span>
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </CardContent>
                </Card>

                <Card className="bg-amber-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Late</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {attendanceStats.late}
                        <span className="text-sm font-normal text-amber-600 ml-1">/ {attendanceStats.total}</span>
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500" />
                  </CardContent>
                </Card>

                <Card className="bg-blue-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Half Day</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {attendanceStats.half_day}
                        <span className="text-sm font-normal text-blue-600 ml-1">/ {attendanceStats.total}</span>
                      </p>
                    </div>
                    <CalendarClock className="h-8 w-8 text-blue-500" />
                  </CardContent>
                </Card>
              </div>

              {/* Search and filter */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or roll number..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filter}
                    onValueChange={(value: "all" | "present" | "absent" | "late" | "half_day") => setFilter(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter attendance" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="present">Present Only</SelectItem>
                      <SelectItem value="absent">Absent Only</SelectItem>
                      <SelectItem value="late">Late Only</SelectItem>
                      <SelectItem value="half_day">Half Day Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Batch actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {isUpdateMode && selectedStudents.length > 0 ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
                      disabled={true}
                      onClick={() => handleBulkStatusChange("present")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Mark Selected Present
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                      disabled={true}
                      onClick={() => handleBulkStatusChange("absent")}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Mark Selected Absent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
                      disabled={true}
                      onClick={() => handleBulkStatusChange("late")}
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Mark Selected Late
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                      disabled={true}
                      onClick={() => handleBulkStatusChange("half_day")}
                    >
                      <CalendarClock className="mr-1 h-4 w-4" />
                      Mark Selected Half Day
                    </Button>
                  </>
                ) : !isUpdateMode ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
                      disabled={isMarkingAttendance}
                      onClick={() => handleMarkAll("present")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Mark All Present
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                      disabled={isMarkingAttendance}
                      onClick={() => handleMarkAll("absent")}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Mark All Absent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
                      disabled={isMarkingAttendance}
                      onClick={() => handleMarkAll("late")}
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Mark All Late
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                      disabled={isMarkingAttendance}
                      onClick={() => handleMarkAll("half_day")}
                    >
                      <CalendarClock className="mr-1 h-4 w-4" />
                      Mark All Half Day
                    </Button>
                  </>
                ) : null}
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                  <h3 className="mt-2 text-lg font-medium">No students found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filter to find students.</p>
                </div>
              ) : (
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Card View</TabsTrigger>
                  </TabsList>

                  {/* Table View */}
                  <TabsContent value="table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {/* {isUpdateMode && (
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={
                                  selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                                }
                                onCheckedChange={handleSelectAllStudents}
                              />
                            </TableHead>
                          )} */}
                          <TableHead>Roll No.</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-[180px]">Attendance</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student, index) => (
                          <TableRow key={`${student.student_id}-${index}`}>
                            {/* {isUpdateMode && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedStudents.includes(student.student_id)}
                                  onCheckedChange={(checked) => handleSelectStudent(student.student_id, !!checked)}
                                />
                              </TableCell>
                            )} */}
                            <TableCell className="font-medium">{student.roll_number}</TableCell>
                            <TableCell>{student.student_name}</TableCell>
                            <TableCell>
                              <Select
                                value={student.status}
                                disabled={
                                  isMarkingAttendance ||
                                  (isUpdateMode && !selectedStudents.includes(student.student_id))
                                }
                                onValueChange={(value: "present" | "absent" | "late" | "half_day") =>
                                  handleAttendanceChange(student.student_id, value)
                                }
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="half_day">Half Day</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{getStatusBadge(student.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  {/* Card View */}
                  <TabsContent value="cards">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map((student, index) => (
                        <Card
                          key={`${student.student_id}-${index}`}
                          className={`
                          border-l-4 
                          ${student.status === "present" ? "border-l-green-500" : ""} 
                          ${student.status === "absent" ? "border-l-red-500" : ""}
                          ${student.status === "late" ? "border-l-amber-500" : ""}
                          ${student.status === "half_day" ? "border-l-blue-500" : ""}
                        `}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              {isUpdateMode && (
                                <Checkbox
                                  checked={selectedStudents.includes(student.student_id)}
                                  onCheckedChange={(checked) => handleSelectStudent(student.student_id, !!checked)}
                                  className="mr-2"
                                />
                              )}
                              <div className={isUpdateMode ? "flex-1" : ""}>
                                <p className="font-medium">{student.student_name}</p>
                                <p className="text-sm text-muted-foreground">Roll No: {student.roll_number}</p>
                              </div>
                              {getStatusBadge(student.status)}
                            </div>
                            <div className="mt-4">
                              <Select
                                value={student.status}
                                disabled={
                                  isMarkingAttendance ||
                                  (isUpdateMode && !selectedStudents.includes(student.student_id))
                                }
                                onValueChange={(value: "present" | "absent" | "late" | "half_day") =>
                                  handleAttendanceChange(student.student_id, value)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="half_day">Half Day</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          ) : (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No students</AlertTitle>
              <AlertDescription>There are no students registered for this class.</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          {!isSunday &&
            !isFutureDate &&
            attendanceRecords &&
            (isUpdateMode ? (
              <div className="flex gap-3">
                <p className="text-sm text-muted-foreground self-center mr-2">
                  {selectedStudents.length} student(s) selected
                </p>
                <Button
                  onClick={handleUpdateSelectedStudents}
                  disabled={false || selectedStudents.length === 0}
                  className="gap-2"
                >
                  {false ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Update Selected
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={handleSubmit} disabled={isMarkingAttendance} className="gap-2">
                {isMarkingAttendance ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Submit Attendance
                  </>
                )}
              </Button>
            ))}
        </CardFooter>
      </Card>
    </div>
  )
}

export default StudentAttendanceView
