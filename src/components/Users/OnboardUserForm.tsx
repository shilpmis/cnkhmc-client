import type React from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type User, UserStatus } from "@/types/user"

interface OnboardUserFormProps {
  onSubmit: (data: User) => void
  initialData?: User
}

const defaultUser: Omit<User, "id"> = {
  school_id: 0,
  name: "",
  username: "",
  saral_email: "",
  password: "",
  role_id: 0,
  status: UserStatus.ACTIVE,
}

export const OnboardUserForm: React.FC<OnboardUserFormProps> = ({ onSubmit, initialData }) => {
  const { register, handleSubmit, control } = useForm<User>({
    defaultValues: initialData || defaultUser,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="school_id">School ID</Label>
          <Input id="school_id" type="number" {...register("school_id", { required: true })} />
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name", { required: true })} />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...register("username", { required: true })} />
        </div>
        <div>
          <Label htmlFor="saral_email">Saral Email</Label>
          <Input id="saral_email" type="email" {...register("saral_email", { required: true })} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password", { required: true })} />
        </div>
        <div>
          <Label htmlFor="role_id">Role ID</Label>
          <Input id="role_id" type="number" {...register("role_id", { required: true })} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <Button type="submit">{initialData ? "Update User" : "Add User"}</Button>
    </form>
  )
}

