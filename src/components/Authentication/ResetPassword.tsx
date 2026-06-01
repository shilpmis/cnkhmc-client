"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const formSchema = z
  .object({
    employee_code: z.string().min(1, {
      message: "Employee code is required.",
    }),
    date_of_birth: z.string().min(1, {
      message: "Date of birth is required.",
    }),
    mobile_number: z
      .string()
      .min(10, {
        message: "Mobile number must be at least 10 digits.",
      })
      .max(10, {
        message: "Mobile number must not exceed 10 digits.",
      }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters long.",
    }),
    confirm_password: z.string().min(8, {
      message: "Confirm password must be at least 8 characters long.",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  })

export default function ResetPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_code: "",
      date_of_birth: "",
      mobile_number: "",
      password: "",
      confirm_password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:3333/api/v1/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Important for cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to reset password")
      }

      toast({
        title: "Password reset successful!",
        description: "You can now login with your new password.",
      })

      // Go back to login form after successful password reset
      setTimeout(() => {
        onBackToLogin()
      }, 1500)
    } catch (error) {
      console.error("Password reset failed:", error)
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error instanceof Error ? error.message : "Please check your information and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-800">Reset your password</h1>
        <p className="text-gray-500 mt-2">Enter your details to reset your password</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="employee_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Employee Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your employee code"
                    className="rounded-lg border-gray-200 focus:border-orange-500 focus:ring focus:ring-orange-200 transition"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Date of Birth</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="rounded-lg border-gray-200 focus:border-orange-500 focus:ring focus:ring-orange-200 transition"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Mobile Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your 10-digit mobile number"
                    className="rounded-lg border-gray-200 focus:border-orange-500 focus:ring focus:ring-orange-200 transition"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="rounded-lg border-gray-200 focus:border-orange-500 focus:ring focus:ring-orange-200 transition"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="rounded-lg border-gray-200 focus:border-orange-500 focus:ring focus:ring-orange-200 transition"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={onBackToLogin}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
