"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Mail, MailOpen, ShieldAlert } from "lucide-react"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"

type UserRole = "admin" | "clerk" | "teacher" | string

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
  const [userRole, setUserRole] = useState<UserRole>("admin")
  const [greeting, setGreeting] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])

  const { toast } = useToast()
  const [secureMessages, setSecureMessages] = useState<any[]>([])
  const [isMessagesDialogOpen, setIsMessagesDialogOpen] = useState(false)
  const [isUnreadAlertOpen, setIsUnreadAlertOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

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

  const isLeadership = [
    "admin", "super_admin", "principal", "hod", "it_admin", "org_admin", "developer",
    "school admin", "school_admin", "super admin", "it admin", "org admin"
  ].includes(auth.user?.role?.toLowerCase() || "") ||
  [
    "ADMIN", "SUPER_ADMIN", "PRINCIPAL", "HOD", "IT_ADMIN", "ORG_ADMIN", "DEVELOPER"
  ].includes(auth.user?.system_role || "") ||
  [1, 2, 5, 9, 11, 12].includes(auth.user?.role_id || 0)

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

  // Load secure messages on mount or userRole change
  useEffect(() => {
    if (isLeadership) {
      const filtered = loadSecureMessages()
      const unread = filtered.filter((m: any) => !m.read)
      if (unread.length > 0) {
        // Show a beautiful notification toast about secure messages
        setTimeout(() => {
          toast({
            title: t("New Secure Messages"),
            description: `You have ${unread.length} new secure message(s) from school staff.`,
          })
          setIsUnreadAlertOpen(true)
        }, 1200)
      }
    }
  }, [userRole, isLeadership, recipientRoleKey])

  // Determine user role from auth state
  useEffect(() => {
    if (auth.user?.role) {
      setUserRole(auth.user.role.toLowerCase())
    }
  }, [auth])

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting(t("Good Morning"))
    else if (hour < 18) setGreeting(t("Good Afternoon"))
    else setGreeting(t("Good Evening "))

    // Mock notifications - in a real app, fetch these from an API
    setNotifications([
      {
        id: "1",
        title: t("new_announcement"),
        message: t("there_is_a_staff_meeting_scheduled_for_tomorrow"),
        time: "10m ago",
        read: false,
      },
      {
        id: "2",
        title: t("leave_request_approved"),
        message: t("your_leave_request_has_been_approved"),
        time: "2h ago",
        read: true,
      },
      {
        id: "3",
        title: t("system_update"),
        message: t("the_system_will_be_updated_tonight_at_2am"),
        time: "5h ago",
        read: true,
      },
    ])
  }, [])

  // Role-specific quick actions
  const getQuickActions = (): QuickAction[] => {
    switch (userRole) {
      case "admin":
        return [
          {
            title: t("manage_users"),
            description: t("add_edit_or_deactivate_user_accounts"),
            icon: <Users className="h-5 w-5" />,
            href: "/users",
            color: "bg-blue-500/10 text-blue-500",
          },
          {
            title: t("school_settings"),
            description: t("configure_school_details_and_policies"),
            icon: <School className="h-5 w-5" />,
            href: "/settings",
            color: "bg-purple-500/10 text-purple-500",
          },
          {
            title: t("academic_calendar"),
            description: t("manage_terms_holidays_and_events"),
            icon: <Calendar className="h-5 w-5" />,
            href: "/calendar",
            color: "bg-green-500/10 text-green-500",
          },
          {
            title: t("reports_overview"),
            description: t("access_school_wide_reports_and_analytics"),
            icon: <FileSpreadsheet className="h-5 w-5" />,
            href: "/reports",
            color: "bg-amber-500/10 text-amber-500",
          },
        ]
      case "clerk":
        return [
          {
            title: t("fee_collection"),
            description: t("record_and_manage_student_fee_payments"),
            icon: <CreditCard className="h-5 w-5" />,
            href: "/fees",
            color: "bg-emerald-500/10 text-emerald-500",
          },
          {
            title: t("student_records"),
            description: t("access_and_update_student_information"),
            icon: <GraduationCap className="h-5 w-5" />,
            href: "/students",
            color: "bg-blue-500/10 text-blue-500",
          },
          {
            title: t("attendance"),
            description: t("view_and_manage_attendance_records"),
            icon: <CheckCircle className="h-5 w-5" />,
            href: "/attendance",
            color: "bg-indigo-500/10 text-indigo-500",
          },
          {
            title: t("admissions"),
            description: t("process_new_student_applications"),
            icon: <ClipboardList className="h-5 w-5" />,
            href: "/admissions",
            color: "bg-rose-500/10 text-rose-500",
          },
        ]
      case "teacher":
        return [
          {
            title: t("my_classes"),
            description: t("view_your_class_schedule_and_students"),
            icon: <BookOpen className="h-5 w-5" />,
            href: "/classes",
            color: "bg-sky-500/10 text-sky-500",
          },
          {
            title: t("take_attendance"),
            description: t("mark_attendance_for_your_classes"),
            icon: <Clock className="h-5 w-5" />,
            href: "/attendance",
            color: "bg-amber-500/10 text-amber-500",
          },
          {
            title: t("assignments"),
            description: t("create_and_grade_student_assignments"),
            icon: <FileText className="h-5 w-5" />,
            href: "/assignments",
            color: "bg-emerald-500/10 text-emerald-500",
          },
          {
            title: t("leave_requests"),
            description: t("submit_and_track_your_leave_applications"),
            icon: <Briefcase className="h-5 w-5" />,
            href: "/leave",
            color: "bg-purple-500/10 text-purple-500",
          },
        ]
      default:
        return []
    }
  }

  // Get role-specific welcome message
  const getWelcomeMessage = (): string => {
    switch (userRole) {
      case "admin":
        return t("Welcome to your work desk")
      case "clerk":
        return t("Welcome to your work desk")
      case "teacher":
        return t("Welcome to your work desk")
      default:
        return t("Welcome to your dashboard")
    }
  }

  // Get role-specific stats
  const getRoleStats = () => {
    switch (userRole) {
      case "admin":
        return [
          // { label: t("total_students"), value: "1,234" },
          // { label: t("total_staff"), value: "98" },
          // { label: t("pending_approvals"), value: "12" },
        ]
      case "clerk":
        return [
          // { label: t("pending_fees"), value: "45" },
          // { label: t("today_collections"), value: "₹24,500" },
          // { label: t("new_admissions"), value: "8" },
        ]
      case "teacher":
        return [
          // { label: t("classes_today"), value: "5" },
          // { label: t("assignments_due"), value: "12" },
          // { label: t("attendance_rate"), value: "96%" },
        ]
      default:
        return []
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-lg border bg-gradient-to-r from-primary/20 via-primary/10 to-background p-6 shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting}, {auth.user?.name || t("user")}
            </h1>
            <p className="mt-2 text-muted-foreground">{getWelcomeMessage()}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">
              {/* {getRoleStats().map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))} */}
            </div>

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

            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={''} />
              <AvatarFallback>{auth.user?.name?.charAt(0) || "U"}</AvatarFallback>
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

      {/* Stats for mobile */}
      <div className="grid-cols-3 gap-4 md:hidden hidden">
        {getRoleStats().map((stat, i) => (
          <Card key={i} className="text-center">
            <CardContent className="p-4">
              {/* <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p> */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="hidden">
        <h2 className="text-xl font-semibold mb-4">{t("quick_actions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getQuickActions().map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg mt-2">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <CardDescription>{action.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href={action.href}>
                      {t("go_to")} {action.title} →
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 hidden">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t("recent_activity")}</CardTitle>
            <CardDescription>{t("your_recent_actions_and_updates")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRole === "admin" && (
                <>
                  <ActivityItem
                    icon={<Users className="h-4 w-4" />}
                    title={t("new_teacher_added")}
                    description={t("you_added_a_new_teacher_to_the_system")}
                    timestamp="2 hours ago"
                  />
                  <ActivityItem
                    icon={<Settings className="h-4 w-4" />}
                    title={t("system_settings_updated")}
                    description={t("you_updated_the_academic_year_settings")}
                    timestamp="Yesterday"
                  />
                </>
              )}

              {userRole === "clerk" && (
                <>
                  <ActivityItem
                    icon={<CreditCard className="h-4 w-4" />}
                    title={t("fee_payment_recorded")}
                    description={t("you_recorded_a_fee_payment_for_student_john_doe")}
                    timestamp="1 hour ago"
                  />
                  <ActivityItem
                    icon={<GraduationCap className="h-4 w-4" />}
                    title={t("student_record_updated")}
                    description={t("you_updated_contact_information_for_3_students")}
                    timestamp="Yesterday"
                  />
                </>
              )}

              {userRole === "teacher" && (
                <>
                  <ActivityItem
                    icon={<CheckCircle className="h-4 w-4" />}
                    title={t("attendance_marked")}
                    description={t("you_marked_attendance_for_class_10a")}
                    timestamp="3 hours ago"
                  />
                  <ActivityItem
                    icon={<FileText className="h-4 w-4" />}
                    title={t("assignment_created")}
                    description={t("you_created_a_new_math_assignment_for_class_9b")}
                    timestamp="Yesterday"
                  />
                </>
              )}

              <ActivityItem
                icon={<MessageSquare className="h-4 w-4" />}
                title={t("message_sent")}
                description={t("you_sent_a_message_to_the_science_department")}
                timestamp="2 days ago"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              {t("view_all_activity")}
            </Button>
          </CardFooter>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{t("notifications")}</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} {t("new")}
                </Badge>
              )}
            </div>
            <CardDescription>{t("your_recent_notifications_and_alerts")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("no_notifications")}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${!notification.read ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && (
                        <Badge variant="outline" className="text-xs bg-primary/10">
                          {t("new")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
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
          <CardFooter>
            <Button variant="outline" className="w-full">
              {t("view_all_notifications")}
            </Button>
          </CardFooter>
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
            {/* Soft decorative background glow */}
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
    </div>
  )
}

// Activity Item Component
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
      <div className="bg-primary/10 rounded-full p-2">{icon}</div>
      <div className="flex-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
      </div>
    </div>
  )
}

