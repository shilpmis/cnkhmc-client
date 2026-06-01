"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card } from "@/components/ui/card"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectVerificationStatus, setCredentialsForVerificationStatus } from "@/redux/slices/authSlice"
import { useLocation, useNavigate } from "react-router-dom"
import { login } from "@/services/AuthService"
import { selectAuthError, selectAuthStatus, selectIsAuthenticated } from "@/redux/slices/authSlice"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"
import { School, BookOpen, Users } from "lucide-react"
import ResetPasswordForm from "@/components/Authentication/ResetPassword"
import LoginForm from "@/components/Authentication/LoginForm"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
  rememberMe: z.boolean().default(false),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { pathname } = useLocation()
  const [showResetForm, setShowResetForm] = useState(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const authStatus = useAppSelector(selectAuthStatus)
  const authError = useAppSelector(selectAuthError)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const verificationStatus = useAppSelector(selectVerificationStatus)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const user = await dispatch(login(values)).unwrap() // ✅ Ensure we get resolved/rejected values properly

      dispatch(
        setCredentialsForVerificationStatus({
          isVerificationInProgress: false,
          isVerificationFails: false,
          verificationError: null,
          isVerificationSuccess: true,
        }),
      )

      toast({
        title: "Login successful!",
        description: "Welcome back!",
      })

      setTimeout(() => {
        window.location.reload() // ✅ Delay reload to ensure toast appears
      }, 500)
    } catch (error) {
      console.error("Login failed:", error)

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Your Email or password must be wrong! Please try again.",
      })
    }
  }

  useEffect(() => {
    const isRootOrLogin = pathname === "/" || pathname === "/login"
    if (isAuthenticated && isRootOrLogin) {
      navigate("/d/students")
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <Card className="w-full overflow-hidden border-0 shadow-xl rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left side - Branding and illustration */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3LjVAjFk69d6GeBLLb3gcItn9mK7iE.png"
                  alt="SARAL Logo"
                  className="h-16 mb-12"
                />

                {showResetForm ? (
                  <>
                    <h2 className="text-white text-3xl font-bold mb-4">Reset Your Password</h2>
                    <p className="text-orange-50 text-lg mb-8">Provide your details to reset your password</p>

                    <div className="space-y-6 mt-8">
                      <div className="flex items-center space-x-3 text-white">
                        <div className="bg-white/20 p-2 rounded-full">
                          <School className="h-5 w-5" />
                        </div>
                        <span>Secure password reset process</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-white text-3xl font-bold mb-4">Welcome to SARAL</h2>
                    <p className="text-orange-50 text-lg mb-8">Your complete school management solution</p>

                    <div className="space-y-6 mt-8">
                      <div className="flex items-center space-x-3 text-white">
                        <div className="bg-white/20 p-2 rounded-full">
                          <School className="h-5 w-5" />
                        </div>
                        <span>Streamlined school administration</span>
                      </div>
                      <div className="flex items-center space-x-3 text-white">
                        <div className="bg-white/20 p-2 rounded-full">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <span>Comprehensive academic tracking</span>
                      </div>
                      <div className="flex items-center space-x-3 text-white">
                        <div className="bg-white/20 p-2 rounded-full">
                          <Users className="h-5 w-5" />
                        </div>
                        <span>Complete student management</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-300 rounded-full opacity-20 -mr-40 -mt-40"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-300 rounded-full opacity-20 -ml-40 -mb-40"></div>
            </div>

            {/* Right side - Login or Reset Password form */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              {showResetForm ? (
                <ResetPasswordForm onBackToLogin={() => setShowResetForm(false)} />
              ) : (
                <LoginForm onForgotPassword={() => setShowResetForm(true)} />
              )}
            </div>
          </div>
        </Card>

        <div className="text-center mt-6 text-gray-500 text-sm">
          © {new Date().getFullYear()} SARAL School Management System. All rights reserved.
        </div>
      </div>
    </div>
  )
}
