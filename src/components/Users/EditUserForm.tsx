// import type React from "react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { Button } from "@/components/ui/button"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from "@/components/ui/input"
// import type { User } from "@/types/user"

// const editUserSchema = z.object({
//   name: z.string().min(2, "Name is required"),
// })

// type EditUserFormProps = {
//   user: User
//   onSubmit: (data: User) => void
//   onCancel: () => void
// }

// export const EditUserForm: React.FC<EditUserFormProps> = ({ user, onSubmit, onCancel }) => {
//   const form = useForm<z.infer<typeof editUserSchema>>({
//     resolver: zodResolver(editUserSchema),
//     defaultValues: {
//       name: user.name,
//     },
//   })

//   const handleSubmit = (data: z.infer<typeof editUserSchema>) => {
//     onSubmit({ ...user, ...data })
//   }

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
//         <FormField
//           control={form.control}
//           name="name"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Name</FormLabel>
//               <FormControl>
//                 <Input {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <div>
//           <FormLabel>Username</FormLabel>
//           <Input value={user.username} disabled />
//         </div>
//         <div>
//           <FormLabel>Email</FormLabel>
//           <Input value={user.saral_email} disabled />
//         </div>
//         <div className="flex justify-between">
//           <Button
//             type="button"
//             variant={user.is_active ? "destructive" : "default"}
//             // onClick={() => onSubmit({ ...user, is_active: user.is_active ? "INACTIVE" : "ACTIVE" })}
//           >
//             {user.is_active ? "Deactivate" : "Activate"} Account
//           </Button>
//           <div>
//             <Button type="button" variant="outline" onClick={onCancel} className="mr-2">
//               Cancel
//             </Button>
//             <Button type="submit">Save Changes</Button>
//           </div>
//         </div>
//       </form>
//     </Form>
//   )
// }

