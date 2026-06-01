// import type React from "react"
// import { useState, useEffect, useCallback } from "react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Switch } from "@/components/ui/switch"
// import { PlusCircle } from "lucide-react"
// import type { User } from "@/types/user"
// import type { PageMeta } from "@/types/global"
// import {
//   useLazyFetchNonOnBoardedTeacherQuery,
//   useAddUserMutation,
//   useUpdateUserMutation,
//   useUpdateOnBoardTeacherAsUserMutation,
//   useOnBoardTeacherAsUserMutation,
// } from "@/services/UserManagementService"
// import { selectCurrentUser } from "@/redux/slices/authSlice"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { toast } from "@/hooks/use-toast"
// import { selectAcademicClasses } from "@/redux/slices/academicSlice"
// import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
// import { Division } from "@/types/academic"
// import { useTranslation } from "@/redux/hooks/useTranslation"

// const userSchema = z.object({
//   teacher_id: z.string().min(1, "Teacher is required"),
//   class_id: z.string().optional(),
//   is_active: z.boolean().optional(),
// })

// type FormData = z.infer<typeof userSchema>

// interface PropsForTeacherAsUserTable {
//   initialData: { users: User[], page: PageMeta }
//   onSucssesfullChange: (user: User | null) => void
// }

// const TeacherAsUserTable: React.FC<PropsForTeacherAsUserTable> = ({ initialData, onSucssesfullChange }) => {

//   const user = useAppSelector(selectCurrentUser)
//   const AcademicClasses = useAppSelector(selectAcademicClasses)
//   const [fetchNonOnBoardedTeachers, { data: nonOnBoardedTeachers }] = useLazyFetchNonOnBoardedTeacherQuery()
//   const [createOnBoardTeacherAsUser, { isLoading }] = useOnBoardTeacherAsUserMutation()
//   const [updateonBoardedTeacherAsUser, { isError }] = useUpdateOnBoardTeacherAsUserMutation()
//   const [getAcademicClasses] = useLazyGetAcademicClassesQuery()

//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [selectedUser, setSelectedUser] = useState<User | null>(null)
//   const [availableAcademicClasses, setAvailableAcademicClasses] = useState<Division[] | null>(null)
//   const {t} = useTranslation()

//   const form = useForm<FormData>({
//     resolver: zodResolver(userSchema),
//     defaultValues: {
//       teacher_id: "",
//       class_id: "",
//       is_active: false
//     },
//   })


//   const handleOnboard = () => {
//     setSelectedUser(null)
//     setIsDialogOpen(true)
//   }

//   const handleEdit = (user: User) => {
//     // form.reset({
//     //   class_id : user.teacher?.class_id.toString() && undefined,
//     //   is_active : checkIsActive(user.is_active),
//     // })
//     setSelectedUser(user)
//     setIsDialogOpen(true)
//   }

//   const onSubmit = async (data: FormData) => {

//     if (selectedUser) {
//       const res = await updateonBoardedTeacherAsUser({
//         user_id: Number(selectedUser.id),
//         payload: {
//           class_id: Number(data.class_id),
//           is_active: data.is_active ? data.is_active : false
//         }
//       })
//       if (res.data) {
//         onSucssesfullChange(res.data)
//         setIsDialogOpen(false)
//         toast({
//           variant: 'default',
//           title: 'Teacher Updated Successfully'
//         })
//       }
//       if (res.error) {
//         console.log("Check this", res.error)
//         toast({
//           variant: 'destructive',
//           title: 'Unsucsessfull Attempt'
//         })
//       }
//     } else {
//       const result = await createOnBoardTeacherAsUser({
//         payload: {
//           teacher_id: Number(data.teacher_id),
//           class_id: Number(data.class_id),
//           is_active: true
//         }
//       })
//       if (result.data) {
//         onSucssesfullChange(result.data)
//         setIsDialogOpen(false)
//         toast({ variant: "default", title: "Teacher Onboarded successfully" })
//       }
//       if (result.error) {
//         console.log("Check this", result.error)
//         toast({ variant: "destructive", title: `Unsucsessfull Attempt` })
//       }
//     }
//   }


//   const filterClass = useCallback((class_id: number): string => {
//     let div = availableAcademicClasses?.filter((cls) => cls.id === class_id)[0];
//     if (!div) return "Not Assigned"
//     return div?.class + " " + div?.division
//   }, [availableAcademicClasses])

//   const checkIsActive = (value: any): boolean => {
//     return value == 1
//   }

//   useEffect(() => {
//     if (isDialogOpen && !selectedUser) {
//       fetchNonOnBoardedTeachers({ page: 1, school_id: user!.school_id })
//     }
//   }, [isDialogOpen, selectedUser, fetchNonOnBoardedTeachers, user])

//   useEffect(() => {
//     if (selectedUser) {
//       form.reset({
//         is_active: checkIsActive(selectedUser.is_active),
//         teacher_id: selectedUser.teacher?.id?.toString() || "",
//         class_id: selectedUser.teacher?.class_id?.toString() || "",
//       })
//     } else {
//       form.reset({
//         is_active: false,
//         teacher_id: "",
//         class_id: "",
//       })
//     }
//   }, [selectedUser, form])


//   useEffect(() => {
//     if (!AcademicClasses) {
//       getAcademicClasses(user!.school_id)
//     }
//   }, [])

//   useEffect(() => {
//     if (AcademicClasses) {
//       let clas: Division[] = []
//       AcademicClasses.map((cls) => {
//         clas.push(...cls.divisions)
//       })
//       setAvailableAcademicClasses(clas);
//     }
//   }, [AcademicClasses])

//   useEffect(() => {

//   }, [initialData])


//   return (
//     <div className="container mx-auto p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">{t("teacher_access_management")}</h1>
//         <Button onClick={handleOnboard}>
//           <PlusCircle className="mr-2 h-4 w-4" />{t("onboard_teachers")} 
//         </Button>
//       </div>

//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>{t("name")}</TableHead>
//             <TableHead>{t("assigned_class")}</TableHead>
//             <TableHead>{t("status")}</TableHead>
//             <TableHead>{t("actions")}</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {initialData && initialData.users.map((user) => {
//             return (<TableRow key={user.id}>

//               <TableCell className="font-medium">
//                 {user.teacher?.first_name} {user.teacher?.last_name}
//               </TableCell>
//               <TableCell>
//                 {
//                   !AcademicClasses && <div>Loading...</div>
//                 }
//                 {
//                   (AcademicClasses && user.teacher_id && user.teacher?.class_id) && filterClass(user.teacher.class_id)
//                 }
//               </TableCell>
//               <TableCell>
//                 <Badge variant={checkIsActive(user.is_active) ? "secondary" : "destructive"}>
//                   {checkIsActive(user.is_active) ? "Active" : "Inactive"}
//                 </Badge>
//               </TableCell>
//               <TableCell>
//                 <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(user)}>
//                   Edit
//                 </Button>
//                 {/* <Button variant={ user.is_active  ? "ghost" : "default"} size="sm">
//                   { user.is_active  ? "Deactivate" : "Activate"}
//                 </Button> */}
//               </TableCell>
//             </TableRow>)
//           })}
//         </TableBody>
//       </Table>

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{selectedUser ? t("edit_teacher_access") : t("onboard_new_teacher")}</DialogTitle>
//             <DialogDescription>
//               {selectedUser ? t("edit_the_details_for_this_teacher.") : t("provide_the_details_to_onboard_a_new_teacher.")}
//             </DialogDescription>
//           </DialogHeader>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               {selectedUser && (<FormField
//                 // control={form.control}
//                 name="teacher_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("name")}</FormLabel>
//                     <FormControl>
//                       <Input value={selectedUser.teacher?.first_name + " " + selectedUser.teacher?.last_name} disabled />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />)}
//               {!selectedUser && (<FormField
//                 control={form.control}
//                 name="teacher_id"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("teacher")}</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("select_a_teacher")} />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {nonOnBoardedTeachers?.map((teacher) => (
//                           <SelectItem key={teacher.id} value={teacher.id.toString()}>
//                             {teacher.first_name} {teacher.last_name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />)}
//               <FormField
//                 control={form.control}
//                 name="class_id"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>{t("assigned_class")}</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("select_a_class")} />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {availableAcademicClasses && availableAcademicClasses.map((cls, index) => {
//                           return (<SelectItem key={index} value={cls.id.toString()}>{cls.class} - {cls.division}</SelectItem>)
//                         })}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               {selectedUser && (
//                 <FormField
//                   control={form.control}
//                   name="is_active"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                       <div className="space-y-0.5">
//                         <FormLabel className="text-base">{t("active_status")}</FormLabel>
//                       </div>
//                       <FormControl>
//                         <Switch checked={checkIsActive(field.value)} onCheckedChange={field.onChange} />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               )}
//               <div className="flex justify-end space-x-2">
//                 <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
//                   {t("cancel")}
//                 </Button>
//                 <Button type="submit">{selectedUser ? t("update_user") : t("create_user")}</Button>
//               </div>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }

// export default TeacherAsUserTable

