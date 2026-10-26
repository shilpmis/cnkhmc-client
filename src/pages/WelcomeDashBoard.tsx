"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  MessageSquare,
  Settings,
  Users,
  Bell,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  School,
  Package,
  Building2,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Archive,
  Layers,
  ShieldCheck,
  DollarSign,
  UserCheck,
  Mail,
  MailOpen,
  ShieldAlert,
  ReceiptText,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAuthState } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import FeeReceiptMakerDialog from "@/components/Fees/Reports/FeeReceiptMakerDialog"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Link } from "react-router-dom"
import { useGetDeadStocksQuery, useGetInventoryDepartmentsQuery } from "@/services/DeadStockService"

type UserRole = "admin" | "clerk" | "teacher" | "inventory" | "hostel" | string

interface QuickAction {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

export function WelcomeDashboard() {
  const { t } = useTranslation()
  const auth = useAppSelector(selectAuthState)
  const [greeting, setGreeting] = useState("")
  const [isReceiptMakerOpen, setIsReceiptMakerOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const { toast } = useToast()
  const [secureMessages, setSecureMessages] = useState<any[]>([])
  const [isMessagesDialogOpen, setIsMessagesDialogOpen] = useState(false)
  const [isUnreadAlertOpen, setIsUnreadAlertOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  // Check if user is allowed to fetch Inventory Data
  const canFetchInventory = useMemo(() => {
    const roleStr = (auth.user?.role || auth.user?.system_role || "").toUpperCase()
    const roleId = auth.user?.role_id

    const hasInventoryPolicy = auth.user?.policies?.some((policy) =>
      policy.rules?.some((rule) => {
        const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject]
        return subjects.some(
          (s) =>
            s === "DeadStock" ||
            s === "Inventory" ||
            s.toLowerCase().includes("inventory") ||
            s.toLowerCase().includes("deadstock")
        )
      })
    )

    const isAllowedRole =
      roleStr.includes("ADMIN") ||
      roleStr.includes("SUPER_ADMIN") ||
      roleStr.includes("PRINCIPAL") ||
      roleStr.includes("CLERK") ||
      roleStr.includes("DEVELOPER") ||
      roleStr.includes("IT_ADMIN") ||
      roleStr.includes("INVENTORY") ||
      roleStr.includes("DEADSTOCK") ||
      roleId === 1 ||
      roleId === 2 ||
      roleId === 4 ||
      roleId === 5 ||
      roleId === 11

    return Boolean(hasInventoryPolicy || isAllowedRole)
  }, [auth.user])

  // Fetch Inventory Data when applicable with skip flag
  const { data: deadStockRes, isLoading: isLoadingStock } = useGetDeadStocksQuery(undefined, {
    skip: !canFetchInventory,
  })
  const { data: departmentsRes, isLoading: isLoadingDepts } = useGetInventoryDepartmentsQuery(undefined, {
    skip: !canFetchInventory,
  })

  const deadStocks = deadStockRes?.data || []
  const departments = departmentsRes?.data || []

  // Check user role and policies
  const userRoleCategory = useMemo(() => {
    const roleStr = (auth.user?.role || auth.user?.system_role || "").toUpperCase()
    
    // Check if user has Inventory role or policy assigned
    const hasInventoryPolicy = auth.user?.policies?.some((policy) =>
      policy.rules?.some((rule) => {
        const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject]
        return subjects.some(
          (s) =>
            s === "DeadStock" ||
            s === "Inventory" ||
            s.toLowerCase().includes("inventory") ||
            s.toLowerCase().includes("deadstock")
        )
      })
    ) || roleStr.includes("INVENTORY") || roleStr.includes("DEADSTOCK") || roleStr.includes("STORE")

    const isAdmin =
      roleStr.includes("ADMIN") ||
      roleStr.includes("SUPER_ADMIN") ||
      roleStr.includes("PRINCIPAL") ||
      roleStr.includes("DEVELOPER") ||
      roleStr.includes("IT_ADMIN") ||
      auth.user?.role_id === 1

    if (hasInventoryPolicy && !isAdmin) {
      return "inventory"
    }
    if (roleStr.includes("TEACHER") || roleStr.includes("FACULTY")) {
      return "teacher"
    }
    if (roleStr.includes("CLERK") || roleStr.includes("ACCOUNTANT")) {
      return "clerk"
    }
    if (roleStr.includes("HOSTEL")) {
      return "hostel"
    }

    return "admin"
  }, [auth.user])

  const isLeadership = [
    "admin", "super_admin", "principal", "hod", "it_admin", "org_admin", "developer",
    "school admin", "school_admin", "super admin", "it admin", "org admin"
  ].includes(auth.user?.role?.toLowerCase() || "") ||
  [
    "ADMIN", "SUPER_ADMIN", "PRINCIPAL", "HOD", "IT_ADMIN", "ORG_ADMIN", "DEVELOPER"
  ].includes(auth.user?.system_role || "") ||
  [1, 2, 5, 9, 11, 12].includes(auth.user?.role_id || 0)

  const getRecipientRoleKey = (): string => {
    const roleLower = auth.user?.role?.toLowerCase() || ""
    const sysRole = auth.user?.system_role || ""
    const roleId = auth.user?.role_id

    if (sysRole === "ADMIN" || sysRole === "SUPER_ADMIN" || roleId === 1 || roleId === 11 || roleLower.includes("admin")) {
      return "admin"
    }
    if (sysRole === "PRINCIPAL" || roleId === 2 || roleLower.includes("principal")) {
      return "principal"
    }
    if (sysRole === "HOD" || roleId === 9 || roleLower.includes("hod")) {
      return "hod"
    }
    if (sysRole === "IT_ADMIN" || roleId === 5 || roleLower.includes("it_admin")) {
      return "it_admin"
    }
    return roleLower
  }

  const recipientRoleKey = getRecipientRoleKey()

  // Load secure messages
  const loadSecureMessages = () => {
    try {
      const allMessages = JSON.parse(localStorage.getItem("saral_secure_messages") || "[]")
      const filtered = allMessages.filter((msg: any) => msg.recipient === recipientRoleKey)
      setSecureMessages(filtered)
      return filtered
    } catch (e) {
      console.error("Error loading secure messages", e)
      return []
    }
  }

  const handleMarkAsRead = (id: string) => {
    try {
      const allMessages = JSON.parse(localStorage.getItem("saral_secure_messages") || "[]")
      const updated = allMessages.map((msg: any) => msg.id === id ? { ...msg, read: true } : msg)
      localStorage.setItem("saral_secure_messages", JSON.stringify(updated))
      loadSecureMessages()
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, read: true })
      }
    } catch (e) {
      console.error("Error marking message as read", e)
    }
  }

  useEffect(() => {
    if (isLeadership) {
      const filtered = loadSecureMessages()
      const unread = filtered.filter((m: any) => !m.read)
      if (unread.length > 0) {
        setTimeout(() => {
          toast({
            title: t("New Secure Messages"),
            description: `You have ${unread.length} new secure message(s) from school staff.`,
          })
          setIsUnreadAlertOpen(true)
        }, 1200)
      }
    }
  }, [isLeadership, recipientRoleKey])

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting(t("Good Morning"))
    else if (hour < 18) setGreeting(t("Good Afternoon"))
    else setGreeting(t("Good Evening"))

    setNotifications([
      {
        id: "1",
        title: "new_announcement",
        message: "there_is_a_staff_meeting_scheduled_for_tomorrow",
        time: "10m ago",
        read: false,
      },
      {
        id: "2",
        title: "leave_request_approved",
        message: "your_leave_request_has_been_approved",
        time: "2h ago",
        read: true,
      },
      {
        id: "3",
        title: "system_update",
        message: "the_system_will_be_updated_tonight_at_2am",
        time: "5h ago",
        read: true,
      },
    ])
  }, [])

  // Role-specific quick actions
  const getQuickActions = (): QuickAction[] => {
    switch (userRoleCategory) {
      case "inventory":
        return [
          {
            title: "Dead Stock Register",
            description: "View, add, and track dead stock assets and equipment",
            icon: <ClipboardList className="h-5 w-5" />,
            href: "/d/inventory/dead-stock",
            color: "bg-amber-500/10 text-amber-600",
          },
          {
            title: "Inventory Departments",
            description: "Manage department locations and issue stock items",
            icon: <Building2 className="h-5 w-5" />,
            href: "/d/inventory/departments",
            color: "bg-blue-500/10 text-blue-600",
          },
          {
            title: "Issue & Transfer Stock",
            description: "Issue stock to department or process returns",
            icon: <Package className="h-5 w-5" />,
            href: "/d/inventory/dead-stock",
            color: "bg-emerald-500/10 text-emerald-600",
          },
          {
            title: "Audit & Stock Reports",
            description: "Generate and export inventory valuation reports",
            icon: <FileSpreadsheet className="h-5 w-5" />,
            href: "/d/inventory/dead-stock",
            color: "bg-purple-500/10 text-purple-600",
          },
        ]
      case "clerk":
        return [
          {
            title: t("fee_collection"),
            description: t("record_and_manage_student_fee_payments"),
            icon: <CreditCard className="h-5 w-5" />,
            href: "/d/fee",
            color: "bg-emerald-500/10 text-emerald-500",
          },
          {
            title: t("student_records"),
            description: t("access_and_update_student_information"),
            icon: <GraduationCap className="h-5 w-5" />,
            href: "/d/students",
            color: "bg-blue-500/10 text-blue-500",
          },
          {
            title: t("admissions"),
            description: t("process_new_student_applications"),
            icon: <ClipboardList className="h-5 w-5" />,
            href: "/d/admissions",
            color: "bg-rose-500/10 text-rose-500",
          },
          {
            title: "Inventory & Dead Stock",
            description: "Access dead stock register and inventory records",
            icon: <Package className="h-5 w-5" />,
            href: "/d/inventory/dead-stock",
            color: "bg-amber-500/10 text-amber-600",
          },
        ]
      case "teacher":
        const teacherActions: QuickAction[] = [
          {
            title: t("my_classes"),
            description: t("view_your_class_schedule_and_students"),
            icon: <BookOpen className="h-5 w-5" />,
            href: "/d/teacher/dashboard",
            color: "bg-sky-500/10 text-sky-500",
          },
          {
            title: t("daily_log"),
            description: "Submit daily teaching logs and diary entries",
            icon: <ClipboardList className="h-5 w-5" />,
            href: "/d/teacher/logs",
            color: "bg-indigo-500/10 text-indigo-500",
          },
          {
            title: t("take_attendance"),
            description: t("mark_attendance_for_your_classes"),
            icon: <Clock className="h-5 w-5" />,
            href: "/d/mark-attendance",
            color: "bg-amber-500/10 text-amber-500",
          },
          {
            title: t("leave_requests"),
            description: t("submit_and_track_your_leave_applications"),
            icon: <Briefcase className="h-5 w-5" />,
            href: "/d/leave-applications",
            color: "bg-purple-500/10 text-purple-500",
          },
        ]
        if (canFetchInventory) {
          teacherActions.push(
            {
              title: "Dead Stock Register",
              description: "View, add, and track dead stock assets and equipment",
              icon: <ClipboardList className="h-5 w-5" />,
              href: "/d/inventory/dead-stock",
              color: "bg-amber-500/10 text-amber-600",
            },
            {
              title: "Inventory Departments",
              description: "Manage department locations and issue stock items",
              icon: <Building2 className="h-5 w-5" />,
              href: "/d/inventory/departments",
              color: "bg-blue-500/10 text-blue-600",
            }
          )
        }
        return teacherActions
      case "hostel":
        return [
          {
            title: "Hostel Management",
            description: "Manage hostel rooms, beds, and allocations",
            icon: <Building2 className="h-5 w-5" />,
            href: "/d/hostels",
            color: "bg-teal-500/10 text-teal-600",
          },
          {
            title: "Student Records",
            description: "View student directory and hostel details",
            icon: <GraduationCap className="h-5 w-5" />,
            href: "/d/students",
            color: "bg-blue-500/10 text-blue-500",
          },
        ]
      case "admin":
      default:
        return [
          {
            title: t("manage_users"),
            description: t("add_edit_or_deactivate_user_accounts"),
            icon: <Users className="h-5 w-5" />,
            href: "/d/users",
            color: "bg-blue-500/10 text-blue-500",
          },
          {
            title: "Fee Receipts & Financial Desk",
            description: "Issue official student fee receipts and customize templates",
            icon: <ReceiptText className="h-5 w-5" />,
            href: "/d/fee",
            color: "bg-emerald-500/10 text-emerald-600",
          },
          {
            title: "Inventory & Dead Stock",
            description: "Manage dead stock register & inventory departments",
            icon: <Package className="h-5 w-5" />,
            href: "/d/inventory/dead-stock",
            color: "bg-amber-500/10 text-amber-600",
          },
          {
            title: t("school_settings"),
            description: t("configure_school_details_and_policies"),
            icon: <School className="h-5 w-5" />,
            href: "/d/settings",
            color: "bg-purple-500/10 text-purple-500",
          },
          {
            title: t("academic_calendar"),
            description: t("manage_terms_holidays_and_events"),
            icon: <Calendar className="h-5 w-5" />,
            href: "/d/calendar",
            color: "bg-green-500/10 text-green-500",
          },
        ]
    }
  }

  // Role welcome message
  const getWelcomeSubtitle = (): string => {
    switch (userRoleCategory) {
      case "inventory":
        return "Welcome to your Inventory & Dead Stock Management Portal"
      case "clerk":
        return "Welcome to Administrative & Fee Management Portal"
      case "teacher":
        return "Welcome to your Teacher Dashboard & Class Portal"
      case "hostel":
        return "Welcome to Hostel Management Portal"
      case "admin":
      default:
        return "Welcome to your Administrative Executive Desk"
    }
  }

  // Calculate Inventory metrics
  const inventoryStats = useMemo(() => {
    const totalItems = deadStocks.length
    const totalValue = deadStocks.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
    const availableQty = deadStocks.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0)
    const totalDepts = departments.length

    return { totalItems, totalValue, availableQty, totalDepts }
  }, [deadStocks, departments])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-orange-500/15 via-orange-400/10 to-background p-6 shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                {greeting}, {auth.user?.name || t("user")}
              </h1>
              {userRoleCategory === "inventory" && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                  Inventory Desk
                </Badge>
              )}
            </div>
            <p className="mt-1 text-slate-600">{getWelcomeSubtitle()}</p>
          </div>

          <div className="flex items-center gap-3">
            {isLeadership && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReceiptMakerOpen(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-full border-emerald-500/40 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 shadow-sm text-xs font-semibold px-3.5 py-1.5"
              >
                <ReceiptText className="h-4 w-4 text-emerald-600" />
                Make Fee Receipt
              </Button>
            )}

            {isLeadership && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  loadSecureMessages()
                  setIsMessagesDialogOpen(true)
                }}
                className="relative rounded-full border-primary/20 bg-background/50 hover:bg-background shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <MessageSquare className="h-5 w-5 text-primary" />
                {secureMessages.filter((m: any) => !m.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-bounce shadow-sm">
                    {secureMessages.filter((m: any) => !m.read).length}
                  </span>
                )}
              </Button>
            )}

            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src="" />
              <AvatarFallback className="bg-orange-600 text-white font-bold">
                {auth.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Secure Support Inbox Section for Leadership */}
      {isLeadership && (
        <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="border-b bg-white flex flex-row items-center justify-between p-6">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
                {t("Secure Support Inbox")}
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-gray-500">
                {t("Confidential messages sent by teaching staff regarding diary, attendance, or calendar issues.")}
              </CardDescription>
            </div>
            {secureMessages.filter((m: any) => !m.read).length > 0 && (
              <Badge className="bg-rose-500 text-white font-bold px-3 py-1 rounded-full text-[10px] animate-pulse">
                {secureMessages.filter((m: any) => !m.read).length} {t("New")}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {secureMessages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
                  <MailOpen className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-700 text-sm">{t("No Messages Found")}</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {t("Your secure support inbox is empty. Teachers' messages will appear here.")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
                {secureMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg)
                      handleMarkAsRead(msg.id)
                    }}
                    className={`py-4 flex justify-between items-start gap-4 cursor-pointer hover:bg-indigo-50/30 px-3 rounded-xl transition-all duration-200 ${!msg.read ? "bg-indigo-50/10 border-l-4 border-indigo-500 pl-2" : ""}`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${!msg.read ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <h4 className={`text-sm font-semibold text-gray-800 truncate ${!msg.read ? "font-bold text-indigo-950" : ""}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-xs text-gray-500 truncate leading-relaxed max-w-2xl">
                        {msg.message}
                      </p>
                    </div>
                    {!msg.read && (
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full flex-shrink-0 mt-2 shadow-sm" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Stats Grid (For Inventory Role or users with Inventory policy) */}
      {canFetchInventory ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Registered Items</CardTitle>
              <Package className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{inventoryStats.totalItems}</div>
              <p className="text-xs text-slate-500 mt-1">Total items in Dead Stock Register</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Stock Value</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                ₹{inventoryStats.totalValue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-500 mt-1">Cumulative financial value of stock</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Departments</CardTitle>
              <Building2 className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{inventoryStats.totalDepts}</div>
              <p className="text-xs text-slate-500 mt-1">Departments issued inventory items</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Available Quantity</CardTitle>
              <Archive className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{inventoryStats.availableQty}</div>
              <p className="text-xs text-slate-500 mt-1">Available in store for issue</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">{t("quick_actions")}</h2>
          <span className="text-xs text-slate-400 capitalize">
            Tailored for {userRoleCategory} desk
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getQuickActions().map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                    {action.icon}
                  </div>
                  <CardTitle className="text-base font-semibold mt-3 text-slate-800 group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-xs text-slate-500 leading-relaxed">
                  {action.description}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium" asChild>
                    <Link to={action.href}>
                      <span>Access Section</span>
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Inventory Detailed Overview Section */}
      {canFetchInventory && (
        <Card className="border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Package className="h-5 w-5 text-amber-500" />
                Dead Stock Overview
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Recent equipment and physical stock entries registered in the system
              </CardDescription>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs" asChild>
              <Link to="/d/inventory/dead-stock">
                <Plus className="h-4 w-4" />
                Manage Register
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingStock ? (
              <div className="p-8 text-center text-slate-500 text-sm">{t("loading...")}</div>
            ) : deadStocks.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Package className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No Inventory Registered</p>
                <p className="text-xs text-slate-400">Click "Manage Register" to add dead stock items.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Total Qty</TableHead>
                      <TableHead className="text-xs">Available Qty</TableHead>
                      <TableHead className="text-xs">Unit Price</TableHead>
                      <TableHead className="text-xs">Total Amount</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deadStocks.slice(0, 5).map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/70 text-xs">
                        <TableCell className="font-semibold text-slate-800">{item.itemName}</TableCell>
                        <TableCell className="text-slate-600">{item.supplierName || "-"}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.availableQuantity > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}>
                            {item.availableQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{Number(item.unitPrice || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="font-semibold">₹{Number(item.totalAmount || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">
                          <Link to="/d/inventory/dead-stock" className="text-orange-600 hover:underline font-medium">
                            View →
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notifications & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-800">{t("recent_activity")}</CardTitle>
            <CardDescription className="text-xs">{t("your_recent_actions_and_updates")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRoleCategory === "inventory" && (
                <>
                  <ActivityItem
                    icon={<Package className="h-4 w-4 text-amber-600" />}
                    title="Dead Stock Register Access"
                    description="You have full access to view, issue, and manage physical dead stock assets."
                    timestamp="Active Session"
                  />
                  <ActivityItem
                    icon={<Building2 className="h-4 w-4 text-blue-600" />}
                    title="Department Allocations"
                    description="Issue items directly to school departments and track returns."
                    timestamp="Active Session"
                  />
                </>
              )}
              {userRoleCategory === "admin" && (
                <>
                  <ActivityItem
                    icon={<Users className="h-4 w-4 text-blue-600" />}
                    title={t("new_teacher_added")}
                    description={t("you_added_a_new_teacher_to_the_system")}
                    timestamp="2 hours ago"
                  />
                  <ActivityItem
                    icon={<Settings className="h-4 w-4 text-purple-600" />}
                    title={t("system_settings_updated")}
                    description={t("you_updated_the_academic_year_settings")}
                    timestamp="Yesterday"
                  />
                </>
              )}
              {userRoleCategory === "clerk" && (
                <>
                  <ActivityItem
                    icon={<CreditCard className="h-4 w-4 text-emerald-600" />}
                    title={t("fee_payment_recorded")}
                    description={t("you_recorded_a_fee_payment_for_student_john_doe")}
                    timestamp="1 hour ago"
                  />
                </>
              )}
              {userRoleCategory === "teacher" && (
                <>
                  <ActivityItem
                    icon={<CheckCircle className="h-4 w-4 text-amber-600" />}
                    title={t("attendance_marked")}
                    description={t("you_marked_attendance_for_your_assigned_classes")}
                    timestamp="3 hours ago"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800">{t("notifications")}</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">
                  {unreadCount} {t("new")}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">{t("your_recent_notifications_and_alerts")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>{t("no_notifications")}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl border text-xs ${!notification.read ? "bg-orange-50/30 border-orange-200" : "bg-slate-50/30 border-slate-100"}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800">{notification.title}</h4>
                      {!notification.read && (
                        <Badge variant="outline" className="text-[10px] bg-orange-100 text-orange-700 border-none px-1.5 py-0.5">
                          {t("new")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-500 mt-1 leading-relaxed">{notification.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-slate-400">{notification.time}</span>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-orange-600 hover:text-orange-700 px-2"
                          onClick={() => markAsRead(notification.id)}
                        >
                          {t("mark_as_read")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secure Messages Dialog */}
      <Dialog open={isMessagesDialogOpen} onOpenChange={setIsMessagesDialogOpen}>
        <DialogContent className="sm:max-w-[650px] border-none shadow-2xl rounded-3xl overflow-hidden bg-white p-0">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white flex items-center justify-between">
            <div>
              <DialogHeader className="text-white">
                <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                  <ShieldAlert className="h-6 w-6 text-rose-300 animate-pulse" />
                  {t("Secure Teacher Messages")}
                </DialogTitle>
                <DialogDescription className="text-indigo-100/90 font-medium text-xs mt-1">
                  {t("Highly secure communications sent directly by teachers regarding scheduling, leaves, or operational concerns.")}
                </DialogDescription>
              </DialogHeader>
            </div>
            {secureMessages.filter((m: any) => !m.read).length > 0 && (
              <Badge className="bg-rose-500 text-white hover:bg-rose-600 font-bold px-3 py-1.5 rounded-full text-xs animate-pulse">
                {secureMessages.filter((m: any) => !m.read).length} {t("New")}
              </Badge>
            )}
          </div>

          <div className="p-6 max-h-[450px] overflow-y-auto space-y-4">
            {secureMessages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-3">
                <div className="mx-auto w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
                  <MailOpen className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-gray-800">{t("Inbox is Empty")}</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {t("No teacher has submitted any secure support messages to your department yet.")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {secureMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg)
                      handleMarkAsRead(msg.id)
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                      !msg.read 
                        ? "bg-indigo-50/40 border-indigo-200 shadow-sm hover:bg-indigo-50/70" 
                        : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${!msg.read ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                      {!msg.read ? <Mail className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-sm">{msg.senderName}</span>
                          <Badge variant="outline" className="text-[10px] bg-white border-indigo-100 text-indigo-700 capitalize font-semibold px-2 py-0.5">
                            {msg.senderRole}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <h4 className={`text-sm ${!msg.read ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50/50 p-6 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMessagesDialogOpen(false)}
              className="h-11 rounded-xl px-5 border-gray-200 font-semibold"
            >
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Reader Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden bg-white p-0">
            <div className="bg-indigo-600 p-5 text-white">
              <DialogHeader className="text-white">
                <DialogTitle className="text-lg font-bold truncate">
                  {selectedMessage.subject}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-indigo-100 font-medium">From:</span>
                  <span className="text-xs font-bold bg-indigo-500 px-2 py-0.5 rounded-md">{selectedMessage.senderName} ({selectedMessage.senderRole})</span>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  {t("Message Content")}
                </Label>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Received: {format(new Date(selectedMessage.timestamp), "MMMM d, yyyy h:mm a")}</span>
                <span className="capitalize">To: {selectedMessage.recipient}</span>
              </div>
            </div>

            <DialogFooter className="bg-gray-50/50 p-6 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedMessage(null)}
                className="h-11 rounded-xl px-5 border-gray-200 font-semibold"
              >
                {t("Close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Unread Secure Messages Alert Popup */}
      <Dialog open={isUnreadAlertOpen} onOpenChange={setIsUnreadAlertOpen}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-3xl overflow-hidden bg-white p-0">
          <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 animate-pulse">
                <ShieldAlert className="h-9 w-9 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white mt-4">
                {t("Confidential Message Received")}
              </DialogTitle>
              <DialogDescription className="text-rose-100/90 text-sm font-medium mt-2 max-w-sm mx-auto leading-relaxed">
                {t("Teaching staff has submitted confidential messages regarding scheduling, diary entries, or calendar issues that require your immediate review.")}
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 text-center space-y-6">
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="text-left space-y-0.5">
                <span className="text-xs text-rose-600 font-black uppercase tracking-wider block">{t("Pending Action")}</span>
                <span className="text-sm font-bold text-slate-800">{t("New Unread Communications")}</span>
              </div>
              <Badge className="bg-rose-500 text-white font-black px-4 py-1.5 rounded-xl text-sm shadow-md shadow-rose-200">
                {secureMessages.filter((m: any) => !m.read).length} {t("New")}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setIsUnreadAlertOpen(false)
                  setIsMessagesDialogOpen(true)
                }}
                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 active:scale-[0.98] transition-all duration-200"
              >
                {t("Open Support Inbox")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsUnreadAlertOpen(false)}
                className="w-full h-11 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-semibold rounded-2xl"
              >
                {t("Review Later")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Receipt Maker Modal */}
      <FeeReceiptMakerDialog
        isOpen={isReceiptMakerOpen}
        onClose={() => setIsReceiptMakerOpen(false)}
      />
    </div>
  )
}

function ActivityItem({
  icon,
  title,
  description,
  timestamp,
}: {
  icon: React.ReactNode
  title: string
  description: string
  timestamp: string
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="bg-slate-100 rounded-full p-2">{icon}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{timestamp}</p>
      </div>
    </div>
  )
}
