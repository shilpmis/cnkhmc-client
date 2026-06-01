// "use client"

// import type React from "react"
// import { useState, useEffect, useMemo } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { SaralDatePicker } from "@/components/ui/common/SaralDatePicker"
// import { Input } from "@/components/ui/input"
// import { toast } from "@/hooks/use-toast"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
// import { useLazyFetchAttendanceForDateQuery, useMarkAttendanceMutation } from "@/services/AttendanceServices"
// import type { AttendanceDetails } from "@/types/attendance"
// import { Loader2, Search } from "lucide-react"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { useGetAcademicClassesQuery } from "@/services/AcademicService"
// import { format } from "date-fns"
 
// const AdminAttendanceView: React.FC = () => {
//     const dummyData = [
//       { id: 1, date: new Date("2025-03-07"), class: "1", division: "A", student: "John Doe", score: 85 },
//       { id: 2, date: new Date("2025-03-07"), class: "2", division: "A", student: "Jane Smith", score: 92 },
//       { id: 3, date: new Date("2025-03-08"), class: "3", division: "B", student: "Bob Johnson", score: 78 },
//       { id: 4, date: new Date("2025-03-08"), class: "4", division: "C", student: "Alice Brown", score: 95 },
//       { id: 5, date: new Date("2025-03-09"), class: "5", division: "D", student: "Charlie Wilson",score: 88},
//       { id: 6, date: new Date("2025-03-09"), class: "6", division: "E", student: "Diana Miller", score: 91 },
//       { id: 7, date: new Date("2025-03-10"), class: "7", division: "F", student: "Edward Davis", score: 82 },
//       { id: 8, date: new Date("2025-03-10"), class: "8", division: "G", student: "Fiona Clark", score: 89 },
//     ]  
//   const user = useAppSelector(selectCurrentUser)
//   const [fetchAttendanceForDate, { data: attendanceData, isLoading }] = useLazyFetchAttendanceForDateQuery()
//   const [markAttendanceForDate, { isLoading: isMarkingAttendance }] = useMarkAttendanceMutation()
//   const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>()
//   const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined)
//   const [selectedDivision, setSelectedDivision] = useState<string | undefined>(undefined)
//   const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined)
//   const [filteredData, setFilteredData] = useState(dummyData)

//   const [filter, setFilter] = useState<"all" | "present" | "absent" | "late" | "half_day">("all")
//   const [searchTerm, setSearchTerm] = useState<string>("")
//   const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDetails | null>(null)
//   const {t} = useTranslation()
//   const {data: AcademicClasses} = useGetAcademicClassesQuery(user!.school_id);

//   const availableDivisions = useMemo<any | null>(() => {
//     if (AcademicClasses && selectedClass) {
//       return AcademicClasses.filter(
//         (cls: any) => cls.class.toString() === selectedClass
//       )[0];
//     } else {
//       return null;
//     }
//   }, [AcademicClasses, selectedClass]);

//   const filteredStudents =
//     attendanceRecords?.attendance_data.filter((student) => {
//       const matchesFilter = filter === "all" || student.status === filter
//       const matchesSearch =
//         student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         student.roll_number.toString().includes(searchTerm)
//       return matchesFilter && matchesSearch
//     }) || []

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
//     if (!attendanceRecords || !selectedDate) {
//       toast({
//         title: "Error",
//         description: "No attendance data to submit",
//         variant: "destructive",
//       })
//       return
//     }

//     const res = await markAttendanceForDate({ payload: attendanceRecords })
//     if ("data" in res) {
//       toast({
//         variant: "default",
//         title: "Attendance marked successfully!",
//       })
//     } else {
//       toast({
//         variant: "destructive",
//         title: "Failed to mark attendance",
//         description: "An error occurred while submitting the attendance data.",
//       })
//     }
//   }

//   const isSunday = selectedDate && selectedDate.getDay() === 0
//   const isFutureDate = selectedDate && selectedDate > new Date()

//   useEffect(() => {
//     if (attendanceData && selectedDate && selectedClass && selectedDivision) {
//       setAttendanceRecords({
//         ...attendanceData,
//         academic_session_id : CurrentAcademicSessionForSchool!.id,
//         class_id: Number(selectedClass),
//         date: selectedDate.toISOString().split("T")[0],
//         marked_by: user!.id,
//       })
//     }
//   }, [attendanceData, selectedClass, selectedDivision, selectedDate, user])

//   useEffect(() => {
//     if (!isSunday && selectedDate && !isFutureDate && selectedClass && selectedDivision) {
//       fetchAttendanceForDate({
//         class_id: Number(selectedDivision),
//         unix_date: Math.floor(selectedDate.getTime() / 1000),
//         academic_session: CurrentAcademicSessionForSchool!.id,
//       })
//     }
//   }, [selectedDate, selectedClass, selectedDivision, fetchAttendanceForDate, isSunday, isFutureDate])


//   const handleDateSelect = (date: Date | undefined) => {
//     setSelectedDate(date)
//   }

//   // Handle class selection
//   const handleClassSelect = (value: string) => {
//     setSelectedClass(value)
//   }

//   // Handle division selection
//   const handleDivisionSelect = (value: string) => {
//     setSelectedDivision(value)
//   }

//   const handleFilter = (value: string) => {
//    setSelectedFilter(value)
//   }

//   useEffect(() => {
//     let result = dummyData

//     if (selectedDate) {
//       const dateString = format(selectedDate, "yyyy-MM-dd")
//       result = result.filter((item) => format(item.date, "yyyy-MM-dd") === dateString)
//     }

//     if (selectedClass) {
//       result = result.filter((item) => item.class === selectedClass)
//     }

//     if (selectedDivision) {
//       result = result.filter((item) => item.division === selectedDivision)
//     }

//     if(selectedFilter){
//       // result = result.filter((item) => item.status === selectedFilter)
//     }

//     setFilteredData(result)
//   }, [selectedDate, selectedClass, selectedDivision,selectedFilter])

//   console.log("filter data is --->>>>",filteredData);
  

//   return (
//     <Card className="container mx-auto p-6">
//       <CardHeader>
//         <CardTitle className="text-3xl font-bold">{t("admin_attendance_dashboard")}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//           <div className="flex flex-col">
//             <label className="text-sm font-medium text-gray-700 mb-1">{t("date")}</label>
//             <SaralDatePicker
//               date={selectedDate}
//               onDateChange={(date: Date | undefined) => handleDateSelect(date)}
//             />
//           </div>
//           <div className="flex flex-col">
//             <label className="text-sm font-medium text-gray-700 mb-1">{t("class")}</label>
//             <Select value={selectedClass} onValueChange={(value: any)=>handleClassSelect(value)}>
//               <SelectTrigger>
//                 <SelectValue placeholder={t("select_class")} />
//               </SelectTrigger>
//               <SelectContent>
//               {AcademicClasses?.map((cls: any, index: any) =>
//                     cls.divisions.length > 0 ? (
//                       <SelectItem
//                           key={index}
//                           value={cls.class.toString()}
//                       >
//                     Class {cls.class}
//                       </SelectItem>
//                     ) : null
//                     )}
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="flex flex-col">
//             <label className="text-sm font-medium text-gray-700 mb-1">{t("division")}</label>
//             <Select value={selectedDivision} onValueChange={(value:string)=>handleDivisionSelect(value)}>
//               <SelectTrigger>
//                 <SelectValue placeholder={t("select_division")} />
//               </SelectTrigger>
//               <SelectContent>
//               {availableDivisions &&
//                             availableDivisions.divisions.map(
//                               (division:any, index:any) => (
//                                 <SelectItem
//                                   key={index}
//                                   value={division.id.toString()}
//                                 >
//                                   {`${division.division} ${
//                                     division.aliases
//                                       ? "-" + division.aliases
//                                       : ""
//                                   }`}
//                                 </SelectItem>
//                               )
//                             )}
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="flex flex-col">
//             <label className="text-sm font-medium text-gray-700 mb-1">{t("filter")}</label>
//             <Select
//               value={filter}
//               onValueChange={(value: "all" | "present" | "absent" | "late" | "half_day") => handleFilter(value)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Filter attendance" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">{t("all")}</SelectItem>
//                 <SelectItem value="present">{t("present")}</SelectItem>
//                 <SelectItem value="absent">{t("absent")}</SelectItem>
//                 <SelectItem value="late">{t("late")}</SelectItem>
//                 <SelectItem value="half_day">{t("half_day")}</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="mb-6">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//             <Input
//               type="text"
//               placeholder={t("search_by_name_or_roll_number")}
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-2 w-full"
//             />
//           </div>
//         </div>

//         {!selectedDate || !selectedClass || !selectedDivision ? (
//           <div
//             className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow"
//             role="alert"
//           >
//             <div className="flex">
//               <div className="py-1">
//                 <svg
//                   className="fill-current h-6 w-6 text-yellow-500 mr-4"
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-bold">{t("incomplete_selection")}</p>
//                 <p className="text-sm">{t("please_select_a_date,_class,_and_division_to_view_or_record_attendance.")}</p>
//               </div>
//             </div>
//           </div>
//         ) : isSunday ? (
//           <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md shadow" role="alert">
//             <div className="flex">
//               <div className="py-1">
//                 <svg
//                   className="fill-current h-6 w-6 text-blue-500 mr-4"
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-bold">{t("sunday_notice")}</p>
//                 <p className="text-sm">{t("it's_sunday._no_attendance_is_required.")}</p>
//               </div>
//             </div>
//           </div>
//         ) : isFutureDate ? (
//           <div
//             className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md shadow"
//             role="alert"
//           >
//             <div className="flex">
//               <div className="py-1">
//                 <svg
//                   className="fill-current h-6 w-6 text-orange-500 mr-4"
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-bold">{t("future_date")}</p>
//                 <p className="text-sm">{t("you_cannot_mark_attendance_for_future_dates.")}</p>
//               </div>
//             </div>
//           </div>
//         ) : isLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
//           </div>
//         ) : attendanceRecords && attendanceRecords.attendance_data.length > 0 ? (
//           <>
//             <div className="flex justify-end space-x-2 mb-4">
//               <Button
//                 disabled={isMarkingAttendance || attendanceRecords.is_marked}
//                 onClick={() => handleMarkAll("present")}
//                 className="bg-green-500 hover:bg-green-600"
//               >
//                 {t("mark_all_present")}
//               </Button>
//               <Button
//                 disabled={isMarkingAttendance || attendanceRecords.is_marked}
//                 onClick={() => handleMarkAll("absent")}
//                 variant="outline"
//                 className="border-red-500 text-red-500 hover:bg-red-50"
//               >
//                 {t("mark_all_absent")}
//               </Button>
//               <Button
//                 disabled={isMarkingAttendance || attendanceRecords.is_marked}
//                 onClick={() => handleMarkAll("late")}
//                 variant="secondary"
//                 className="bg-yellow-500 hover:bg-yellow-600"
//               >
//                 {t("mark_all_late")}
//               </Button>
//               <Button
//                 disabled={isMarkingAttendance || attendanceRecords.is_marked}
//                 onClick={() => handleMarkAll("half_day")}
//                 variant="secondary"
//                 className="bg-orange-500 hover:bg-orange-600"
//               >
//                 {t("mark_all_half_day")}
//               </Button>
//             </div>

//             <div className="bg-white overflow-hidden shadow-xl rounded-lg">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead className="bg-indigo-100 text-indigo-800">{t("roll_number")}</TableHead>
//                     <TableHead className="bg-indigo-100 text-indigo-800">{t("name")}</TableHead>
//                     <TableHead className="bg-indigo-100 text-indigo-800">{t("attendance")}</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredStudents.map((student) => (
//                     <TableRow key={student.student_id} className="hover:bg-gray-50">
//                       <TableCell>{student.roll_number}</TableCell>
//                       <TableCell>{student.student_name}</TableCell>
//                       <TableCell>
//                         <Select
//                           value={student.status}
//                           disabled={isMarkingAttendance}
//                           onValueChange={(value: "present" | "absent" | "late" | "half_day") =>
//                             handleAttendanceChange(student.student_id, value)
//                           }
//                         >
//                           <SelectTrigger className="w-[120px]">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="present">{t("present")}</SelectItem>
//                             <SelectItem value="absent">{t("absent")}</SelectItem>
//                             <SelectItem value="late">{t("late")}</SelectItem>
//                             <SelectItem value="half_day">{t("half_day")}</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>

//             <div className="mt-6 flex justify-end">
//               <Button
//                 onClick={handleSubmit}
//                 disabled={isMarkingAttendance || attendanceRecords.is_marked}
//                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
//               >
//                 {isMarkingAttendance ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Marking...
//                   </>
//                 ) : attendanceData?.is_marked ? (
//                   "Update Attendance"
//                 ) : (
//                   "Submit Attendance"
//                 )}
//               </Button>
//             </div>
//           </>
//         ) : (
//           <div
//             className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow"
//             role="alert"
//           >
//             <div className="flex">
//               <div className="py-1">
//                 <svg
//                   className="fill-current h-6 w-6 text-yellow-500 mr-4"
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="font-bold">{t("no_students")}</p>
//                 <p className="text-sm">{t("there_are_no_students_in_this_class_for_the_selected_date.")}</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   )
// }

// export default AdminAttendanceView


"use client"
"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaralDatePicker } from "@/components/ui/common/SaralDatePicker"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice"
import { 
  useLazyFetchAttendanceForDateQuery, 
  useMarkAttendanceMutation,
  useUpdateAttendanceMutation 
} from "@/services/AttendanceServices"
import type { AttendanceDetails } from "@/types/attendance"
import { Loader2, Search, ChevronLeft, ChevronRight, Calendar, Users, UserCheck, UserX, Clock, UserMinus, Save, Edit3, RotateCcw } from 'lucide-react'
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetAcademicClassesQuery } from "@/services/AcademicService"
import { addDays, subDays, format } from "date-fns"

interface AttendanceChange {
  student_id: number;
  status: "present" | "absent" | "late" | "half_day";
}

const AdminAttendanceView: React.FC = () => {
  const user = useAppSelector(selectCurrentUser)
  const [fetchAttendanceForDate, { data: attendanceData, isLoading }] = useLazyFetchAttendanceForDateQuery()
  const [markAttendanceForDate, { isLoading: isMarkingAttendance }] = useMarkAttendanceMutation()
  const [updateAttendanceForDate, { isLoading: isUpdatingAttendance }] = useUpdateAttendanceMutation()
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined)
  const [selectedDivision, setSelectedDivision] = useState<string | undefined>(undefined)
  const [filter, setFilter] = useState<"all" | "present" | "absent" | "late" | "half_day">("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDetails | null>(null)
  const [originalAttendanceRecords, setOriginalAttendanceRecords] = useState<AttendanceDetails | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  
  const {t} = useTranslation()
  const {data: AcademicClasses} = useGetAcademicClassesQuery(user!.school_id);

  const availableDivisions = useMemo<any | null>(() => {
    if (AcademicClasses && selectedClass) {
      return AcademicClasses.filter(
        (cls: any) => cls.class.toString() === selectedClass
      )[0];
    } else {
      return null;
    }
  }, [AcademicClasses, selectedClass]);

  // Check if there are any changes made to attendance
  const hasChanges = useMemo(() => {
    if (!attendanceRecords || !originalAttendanceRecords) return false
    
    return attendanceRecords.attendance_data.some((current, index) => {
      const original = originalAttendanceRecords.attendance_data[index]
      return original && current.status !== original.status
    })
  }, [attendanceRecords, originalAttendanceRecords])

  // Get attendance statistics
  const attendanceStats = useMemo(() => {
    if (!attendanceRecords) return { present: 0, absent: 0, late: 0, half_day: 0, total: 0 }
    
    const stats = attendanceRecords.attendance_data.reduce((acc, student) => {
      acc[student.status]++
      acc.total++
      return acc
    }, { present: 0, absent: 0, late: 0, half_day: 0, total: 0 })
    
    return stats
  }, [attendanceRecords])

  const filteredStudents =
    attendanceRecords?.attendance_data.filter((student) => {
      const matchesFilter = filter === "all" || student.status === filter
      const matchesSearch =
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number.toString().includes(searchTerm)
      return matchesFilter && matchesSearch
    }) || []

  const handleAttendanceChange = (studentId: number, status: "present" | "absent" | "late" | "half_day") => {
    if (attendanceRecords && (!attendanceRecords.is_marked || isEditMode)) {
      const updatedStudents = attendanceRecords.attendance_data.map((student) =>
        student.student_id === studentId ? { ...student, status } : student,
      )
      setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
    }
  }

  const handleMarkAll = (status: "present" | "absent" | "late" | "half_day") => {
    if (attendanceRecords && (!attendanceRecords.is_marked || isEditMode)) {
      const updatedStudents = attendanceRecords.attendance_data.map((student) => ({ ...student, status }))
      setAttendanceRecords({ ...attendanceRecords, attendance_data: updatedStudents })
    }
  }

  const handleSubmit = async () => {
    if (!attendanceRecords || !selectedDate) {
      toast({
        title: "Error",
        description: "No attendance data to submit",
        variant: "destructive",
      })
      return
    }

    const res = await markAttendanceForDate({ payload: attendanceRecords })
    if ("data" in res) {
      toast({
        variant: "default",
        title: "Attendance marked successfully!",
      })
      // Refetch data to get updated state
      refetchAttendanceData()
    } else {
      toast({
        variant: "destructive",
        title: "Failed to mark attendance",
        description: "An error occurred while submitting the attendance data.",
      })
    }
  }

  const handleUpdate = async () => {
    if (!attendanceRecords || !selectedDate || !selectedDivision) {
      toast({
        title: "Error",
        description: "Missing required data for update",
        variant: "destructive",
      })
      return
    }

    // Create update payload
    const updatePayload: AttendanceChange[] = attendanceRecords.attendance_data.map(student => ({
      student_id: student.student_id,
      status: student.status
    }))

    const res = await updateAttendanceForDate({
      payload: updatePayload,
      class_id: Number(selectedDivision),
      unix_date: Math.floor(selectedDate.getTime() / 1000)
    })

    if ("data" in res) {
      toast({
        variant: "default",
        title: "Attendance updated successfully!",
      })
      setIsEditMode(false)
      // Refetch data to get updated state
      refetchAttendanceData()
    } else {
      toast({
        variant: "destructive",
        title: "Failed to update attendance",
        description: "An error occurred while updating the attendance data.",
      })
    }
  }

  const handleCancelEdit = () => {
    if (originalAttendanceRecords) {
      setAttendanceRecords({ ...originalAttendanceRecords })
    }
    setIsEditMode(false)
  }

  const refetchAttendanceData = () => {
    if (!isSunday && selectedDate && !isFutureDate && selectedClass && selectedDivision) {
      fetchAttendanceForDate({
        class_id: Number(selectedDivision),
        unix_date: Math.floor(selectedDate.getTime() / 1000),
        academic_session: CurrentAcademicSessionForSchool!.id,
      })
    }
  }

  // Navigation functions
  const handlePreviousDay = () => {
    if (selectedDate) {
      const previousDay = subDays(selectedDate, 1)
      setSelectedDate(previousDay)
      setIsEditMode(false)
    }
  }

  const handleNextDay = () => {
    if (selectedDate) {
      const nextDay = addDays(selectedDate, 1)
      const today = new Date()
      if (nextDay <= today) {
        setSelectedDate(nextDay)
        setIsEditMode(false)
      }
    }
  }

  const isSunday = selectedDate && selectedDate.getDay() === 0
  const isFutureDate = selectedDate && selectedDate > new Date()
  const isToday = selectedDate && selectedDate.toDateString() === new Date().toDateString()

  useEffect(() => {
    if (attendanceData && selectedDate && selectedClass && selectedDivision) {
      const processedData = {
        ...attendanceData,
        academic_session_id : CurrentAcademicSessionForSchool!.id,
        class_id: Number(selectedClass),
        date: selectedDate.toISOString().split("T")[0],
        marked_by: user!.id,
      }
      setAttendanceRecords(processedData)
      setOriginalAttendanceRecords(JSON.parse(JSON.stringify(processedData))) // Deep copy
    }
  }, [attendanceData, selectedClass, selectedDivision, selectedDate, user])

  useEffect(() => {
    refetchAttendanceData()
  }, [selectedDate, selectedClass, selectedDivision, fetchAttendanceForDate, isSunday, isFutureDate])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setIsEditMode(false)
  }

  const handleClassSelect = (value: string) => {
    setSelectedClass(value)
    setIsEditMode(false)
  }

  const handleDivisionSelect = (value: string) => {
    setSelectedDivision(value)
    setIsEditMode(false)
  }

  // Get status badge with improved styling
  const getStatusBadge = (status: string, isClickable: boolean = false, isSelected: boolean = false) => {
    const baseClasses = `
      inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
      ${isClickable ? "cursor-pointer hover:scale-105 hover:shadow-md" : ""}
      ${isSelected ? "ring-2 ring-primary ring-offset-2 shadow-md" : ""}
    `
    
    const getIcon = (status: string) => {
      switch (status) {
        case "present": return <UserCheck className="h-3 w-3" />
        case "absent": return <UserX className="h-3 w-3" />
        case "late": return <Clock className="h-3 w-3" />
        case "half_day": return <UserMinus className="h-3 w-3" />
        default: return null
      }
    }
    
    switch (status) {
      case "present":
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-200`}>
            {getIcon(status)}
            {t("present")}
          </Badge>
        )
      case "absent":
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200 hover:bg-red-200`}>
            {getIcon(status)}
            {t("absent")}
          </Badge>
        )
      case "late":
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200`}>
            {getIcon(status)}
            {t("late")}
          </Badge>
        )
      case "half_day":
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200`}>
            {getIcon(status)}
            {t("half_day")}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className={baseClasses}>
            {status}
          </Badge>
        )
    }
  }

  const isProcessing = isMarkingAttendance || isUpdatingAttendance

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("attendance_management")}</h1>
          <p className="text-muted-foreground mt-1">
            {selectedDate ? format(selectedDate, "EEEE, MMMM do, yyyy") : "Select a date to manage attendance"}
          </p>
        </div>
        
        {attendanceRecords && (
          <div className="flex items-center gap-2">
            <Badge variant={attendanceRecords.is_marked ? "default" : "secondary"} className="px-3 py-1">
              {attendanceRecords.is_marked ? "Marked" : "Not Marked"}
            </Badge>
          </div>
        )}
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters & Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("date")}</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousDay}
                  disabled={!selectedDate}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <SaralDatePicker
                    date={selectedDate}
                    onDateChange={handleDateSelect}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDay}
                  disabled={!selectedDate || isToday}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("class")}</label>
              <Select value={selectedClass} onValueChange={handleClassSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_class")} />
                </SelectTrigger>
                <SelectContent>
                  {AcademicClasses?.map((cls: any, index: any) =>
                    cls.divisions.length > 0 ? (
                      <SelectItem key={index} value={cls.class.toString()}>
                        Class {cls.class}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("division")}</label>
              <Select value={selectedDivision} onValueChange={handleDivisionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t("select_division")} />
                </SelectTrigger>
                <SelectContent>
                  {availableDivisions &&
                    availableDivisions.divisions.map((division:any, index:any) => (
                      <SelectItem key={index} value={division.id.toString()}>
                        {`${division.division} ${division.aliases ? "-" + division.aliases : ""}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("filter")}</label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter attendance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="present">{t("present")}</SelectItem>
                  <SelectItem value="absent">{t("absent")}</SelectItem>
                  <SelectItem value="late">{t("late")}</SelectItem>
                  <SelectItem value="half_day">{t("half_day")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={t("search_by_name_or_roll_number")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {!selectedDate || !selectedClass || !selectedDivision ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">{t("incomplete_selection")}</p>
                <p className="text-sm text-muted-foreground">{t("please_select_a_date,_class,_and_division_to_view_or_record_attendance.")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isSunday ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Calendar className="h-12 w-12 text-blue-500 mx-auto" />
              <div>
                <p className="font-medium text-blue-700">{t("sunday_notice")}</p>
                <p className="text-sm text-blue-600">{t("it's_sunday._no_attendance_is_required.")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isFutureDate ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Calendar className="h-12 w-12 text-orange-500 mx-auto" />
              <div>
                <p className="font-medium text-orange-700">{t("future_date")}</p>
                <p className="text-sm text-orange-600">{t("you_cannot_mark_attendance_for_future_dates.")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading attendance data...</p>
            </div>
          </CardContent>
        </Card>
      ) : attendanceRecords && attendanceRecords.attendance_data.length > 0 ? (
        <>
          {/* Statistics Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{attendanceStats.total}</div>
                  <div className="text-sm text-gray-500">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                  <div className="text-sm text-gray-500">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                  <div className="text-sm text-gray-500">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                  <div className="text-sm text-gray-500">Late</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{attendanceStats.half_day}</div>
                  <div className="text-sm text-gray-500">Half Day</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={isProcessing || (attendanceRecords.is_marked && !isEditMode)}
                    onClick={() => handleMarkAll("present")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {t("mark_all_present")}
                  </Button>
                  <Button
                    disabled={isProcessing || (attendanceRecords.is_marked && !isEditMode)}
                    onClick={() => handleMarkAll("absent")}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    size="sm"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    {t("mark_all_absent")}
                  </Button>
                  <Button
                    disabled={isProcessing || (attendanceRecords.is_marked && !isEditMode)}
                    onClick={() => handleMarkAll("late")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {t("mark_all_late")}
                  </Button>
                  <Button
                    disabled={isProcessing || (attendanceRecords.is_marked && !isEditMode)}
                    onClick={() => handleMarkAll("half_day")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    {t("mark_all_half_day")}
                  </Button>
                </div>

                <div className="flex gap-2">
                  {attendanceRecords.is_marked && !isEditMode && (
                    <Button
                      onClick={() => setIsEditMode(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit Attendance
                    </Button>
                  )}
                  
                  {isEditMode && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">{t("roll_number")}</TableHead>
                      <TableHead className="font-semibold">{t("name")}</TableHead>
                      <TableHead className="font-semibold">{t("attendance")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.student_id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                        <TableCell>{student.student_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {["present", "absent", "late", "half_day"].map((status) => (
                              <div
                                key={status}
                                onClick={() => 
                                  !isProcessing && 
                                  (!attendanceRecords.is_marked || isEditMode) && 
                                  handleAttendanceChange(student.student_id, status as any)
                                }
                              >
                                {getStatusBadge(
                                  status, 
                                  !isProcessing && (!attendanceRecords.is_marked || isEditMode),
                                  student.status === status
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Submit/Update Button */}
          <div className="flex justify-end">
            {!attendanceRecords.is_marked ? (
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-2"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Attendance
                  </>
                )}
              </Button>
            ) : isEditMode ? (
              <Button
                onClick={handleUpdate}
                disabled={isProcessing || !hasChanges}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-2"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Attendance
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">{t("no_students")}</p>
                <p className="text-sm text-muted-foreground">{t("there_are_no_students_in_this_class_for_the_selected_date.")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdminAttendanceView