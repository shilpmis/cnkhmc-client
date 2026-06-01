import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { User } from "@/types/user"
import { useAddUserMutation, useUpdateUserMutation } from "@/services/UserManagementService"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role_id: z.string().min(1, "Role is required"),
  username: z.string().min(3, "Username must be at least 3 characters").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
  is_active: z.boolean().optional(),
})

type Role = {
  id: number
  role: string
  permissions: Record<string, unknown>
}

type UserFormProps = {
  initialData: User | null
  roles: Role[]
  isEditing: boolean
  onSuccessfulChange: (user: User | null) => void
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, roles, isEditing, onSuccessfulChange }) => {

  const [createUser, { isError, isLoading }] = useAddUserMutation();
  const [updateUser, { }] = useUpdateUserMutation()
  const {t} = useTranslation()

  const checkIsActive = (value: any): boolean => {
    return value == 1
  }

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || "",
      role_id: initialData?.role_id ? initialData.role_id.toString() : "",
      username: initialData?.username || "",
      password: "",
      is_active: checkIsActive(initialData?.is_active),
    },
  })

  const handleSubmit = async (data: z.infer<typeof userSchema>) => {

    if (isEditing) {
      const initialName = initialData?.name?.trim() || "";
      if (initialName != data.name || checkIsActive(initialData?.is_active) != data.is_active) {
        let payload: Partial<{ name: string, is_active: boolean }> = {}
        if (initialName != data.name) payload.name = data.name
        if (checkIsActive(initialData?.is_active) != data.is_active) payload.is_active = data.is_active
        const updated_user :any = await updateUser({ payload, user_id: initialData!.id });
        if (updated_user.data) {
          onSuccessfulChange(updated_user.data)
          toast({
            variant: "default",
            title: "Updated user successfully !",
          })
        }
        if (updated_user.error) {
          console.log("Error updating user", updated_user.error)
          toast({
            variant: "destructive",
            title: "Error updating user",
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "No changes made",
          description: "No changes made to the user",
        })
      }
    } else {
      const new_user: any = await createUser({
        name: data.name,
        role_id: Number(data.role_id),
        username: data.username!,
        password: data.password!,
        is_active: true
      })
      if (new_user.data) onSuccessfulChange(new_user.data)
      if (new_user.error) {
        console.log("Error creating user", new_user.error)
        onSuccessfulChange(null)
        if (new_user.error.data?.message?.code == 'ER_DUP_ENTRY') {
          toast({
            variant: "destructive",
            title: `User for this role already created !`,
          })
        }
        else if (new_user.error.data?.message?.code == 'E_VALIDATION_ERROR') {
          toast({
            variant: "destructive",
            title: `${new_user.error.data?.message?.messages?.[0]?.message || "Validation Error"}`,
          })
        }
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEditing && (
          <>
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("role")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_a_role")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("username")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("enter_username")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("password")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder={t("enter_password")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {initialData?.role_id !== 1 && isEditing && (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? false} onCheckedChange={(checked) => { field.onChange(checked) }} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <Button type="submit">{isEditing ? t("update_user") : t("create_user")}</Button>
      </form>
    </Form>
  )
}

