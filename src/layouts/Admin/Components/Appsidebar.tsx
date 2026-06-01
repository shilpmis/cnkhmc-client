import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Settings,
  UserCheck,
  Users,
  IndianRupee,
  Bed,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  DollarSign,
  BarChart3,
  Calendar,
  FileText,
  CreditCard,
  Briefcase,
  Building2,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Permission, UserRole } from "@/types/user"
import { useAuth } from "@/redux/hooks/useAuth"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAuthState, selectCurrentSchool } from "@/redux/slices/authSlice"

interface SidebarItem {
  title: string
  url: string
  icon: any
  requiredRole?: UserRole
  requiredPermission?: Permission
}

const SideBarItems: SidebarItem[] = [
  { title: "messaging", url: "/d/chat", icon: MessageSquare },
  { title: "teacher_dashboard", url: "/d/teacher/dashboard", icon: LayoutDashboard, requiredRole: UserRole.SCHOOL_TEACHER },
  { title: "daily_diary", url: "/d/teacher/logs", icon: ClipboardList },
  { title: "student", url: "/d/students", icon: Users, requiredPermission: Permission.MANAGE_STUDENTS },
  { title: "staff", url: "/d/staff", icon: UserCheck, requiredPermission: Permission.MANAGE_STAFF },
  { title: "subjects", url: "/d/subjects", icon: FileText, requiredPermission: Permission.MANAGE_SUBJECTS },
  { title: "academic_calendar", url: "/d/calendar", icon: Calendar },
  { title: "my_leaves", url: "/d/leave-applications", icon: Bed, requiredPermission: Permission.MARK_LEAVES },
  { title: "leave_management", url: "/d/leaves", icon: Bed, requiredPermission: Permission.MANAGE_LEAVES },
  {
    title: "attendance_management",
    url: "/d/attendance",
    icon: ClipboardList,
    requiredPermission: Permission.MANAGE_ATTENDANCE,
  },
  // {
  //   title: "staff_attendance_management",
  //   url: "/d/staff/attendance",
  //   icon: ClipboardList,
  //   requiredPermission: Permission.MANAGE_ATTENDANCE,
  // },
  {
    title: "attendance",
    url: "/d/mark-attendance",
    icon: ClipboardList,
    requiredPermission: Permission.MARK_ATTENDANCE,
  },
  // {
  //   title: "staff-attendance",
  //   url: "/d/staff/mark-attendance",
  //   icon: ClipboardList,
  //   requiredPermission: Permission.MARK_ATTENDANCE,
  // },
  { title: "payments", url: "/d/pay-fees", icon: IndianRupee, requiredPermission: Permission.PAY_FEES },
  { title: "manage_fees", url: "/d/fee", icon: IndianRupee, requiredPermission: Permission.MANAGE_FEES },
  { title: "admissions", url: "/d/admissions", icon: ClipboardList, requiredPermission: Permission.MANAGE_ADMISSION },
  { title: "timetable", url: "/d/timetable", icon: Calendar, requiredPermission: Permission.MANAGE_TIMETABLE },
  { title: "lesson_plans", url: "/d/curriculum", icon: FileText, requiredPermission: Permission.MANAGE_LESSON_PLAN },
]

// Payroll items with sub-items
const PayrollItems = {
  title: "payroll",
  icon: DollarSign,
  requiredPermission: Permission.MANAGE_PAYROLL,
  subItems: [
    { title: "payroll_dashboard", url: "/d/payroll/dashboard", icon: BarChart3 },
    { title: "employees", url: "/d/payroll/employee", icon: Briefcase },
    { title: "pay_run", url: "/d/payroll/payrun", icon: Calendar },
    // { title: "salary_components", url: "/d/payroll/salary-components", icon: FileText },
    // { title: "salary_templates", url: "/d/payroll/salary-templates", icon: CreditCard },
  ],
}

const SideBarFooter: SidebarItem[] = [
  { title: "user_management", url: "/d/users", icon: Users, requiredPermission: Permission.MANAGE_USERS },
  { title: "settings", url: "/d/settings", icon: Settings, requiredPermission: Permission.MANAGE_SETTINGS },
]

interface AppSidebarProps {
  isCollapsed: boolean
}

export default function AppSidebar({ isCollapsed }: AppSidebarProps) {
  const { hasPermission, hasRole } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const schoolState = useAppSelector(selectCurrentSchool)
  const [isPayrollExpanded, setIsPayrollExpanded] = useState(false)

  // Listen for unread chat message count
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  useEffect(() => {
    const handler = (e: Event) => setChatUnreadCount((e as CustomEvent).detail)
    window.addEventListener('chat:unread-count-change', handler)
    return () => window.removeEventListener('chat:unread-count-change', handler)
  }, [])

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(`${url}/`)
  }

  // Function to check if any payroll sub-item is active
  const isAnyPayrollItemActive = () => {
    return PayrollItems.subItems.some((item) => isActive(item.url))
  }

  // Toggle payroll accordion
  const togglePayrollAccordion = () => {
    setIsPayrollExpanded(!isPayrollExpanded)
  }

  const canViewManageSection = SideBarFooter.some((item: SidebarItem) => {
    if (hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.DEVELOPER)) return true
    if (item.requiredPermission && hasPermission(item.requiredPermission)) return true
    if (item.requiredRole && hasRole(item.requiredRole)) return true
    return !item.requiredPermission && !item.requiredRole
  })

  // Auto-expand payroll accordion if any of its items is active
  useState(() => {
    if (isAnyPayrollItemActive()) {
      setIsPayrollExpanded(true)
    }
  })

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-2 bg-white rounded-lg">
        <div className="flex items-center justify-center p-2 bg-white rounded-lg">
          {isCollapsed ? (
            <img
              src="/melzo_logo.png"
              alt="Product logo"
              width={70}
              height={70}
              className="rounded-full border-2 border-black p-1 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:ring-2 hover:ring-orange-500"
            />
          ) : (
            <>
              <img
                src="/melzo_logo.png"
                alt="Product logo"
                width={70}
                height={60}
                className="rounded-full border-2 border-black p-1 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:ring-2 hover:ring-orange-500"
              />
              <div className="h-16 w-[2px] bg-black mx-2"></div>
              <img
                src={schoolState?.school_logo || "/default_school_logo.png"}
                alt="School Logo"
                width={70}
                height={60}
                className="rounded-full border-2 border-black p-1 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:ring-2 hover:ring-orange-500"
              />
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 bg-white rounded-lg">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SideBarItems.map((item) => {
                if (hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.DEVELOPER)) {
                  // Admin can see everything except maybe things that strictly require ORG_ADMIN if they aren't one.
                  // But usually SUPER_ADMIN should see everything.
                } else {
                  if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
                    return null
                  }
                  if (item.requiredRole && !hasRole(item.requiredRole)) {
                    return null
                  }
                }
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        active && "bg-orange-100 text-orange-700 font-medium",
                        active && "hover:bg-orange-200 hover:text-orange-800",
                      )}
                    >
                    <Link to={item.url}>
                        <item.icon className={cn("mr-2", active && "text-orange-700")} />
                        <span>{t(item.title)}</span>
                        {item.url === "/d/chat" && chatUnreadCount > 0 && (
                          <span className="ml-auto flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Payroll Accordion */}
              {(hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.DEVELOPER) || !PayrollItems.requiredPermission || hasPermission(PayrollItems.requiredPermission)) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={togglePayrollAccordion}
                    className={cn(
                      isAnyPayrollItemActive() && "bg-orange-100 text-orange-700 font-medium",
                      isAnyPayrollItemActive() && "hover:bg-orange-200 hover:text-orange-800",
                    )}
                    isActive={isAnyPayrollItemActive()}
                  >
                    <PayrollItems.icon className={cn("mr-2", isAnyPayrollItemActive() && "text-orange-700")} />
                    <span>{t(PayrollItems.title)}</span>
                    {isPayrollExpanded ? (
                      <ChevronDown className={cn("ml-auto h-4 w-4", isAnyPayrollItemActive() && "text-orange-700")} />
                    ) : (
                      <ChevronRight className={cn("ml-auto h-4 w-4", isAnyPayrollItemActive() && "text-orange-700")} />
                    )}
                  </SidebarMenuButton>

                  {/* Payroll Sub-items */}
                  {isPayrollExpanded && (
                    <SidebarMenuSub>
                      {PayrollItems.subItems.map((subItem) => {
                        const subActive = isActive(subItem.url)
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subActive}
                              className={cn(
                                subActive && "bg-orange-100 text-orange-700 font-medium",
                                subActive && "hover:bg-orange-200 hover:text-orange-800",
                              )}
                            >
                              <Link to={subItem.url}>
                                <subItem.icon className={cn("mr-2", subActive && "text-orange-700")} />
                                <span>{t(subItem.title)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {canViewManageSection && (
        <SidebarFooter className="p-2 bg-white rounded-lg">
          <SidebarGroup>
            <SidebarGroupLabel>{t("manage")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {SideBarFooter.map((item: SidebarItem) => {
                  if (hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.DEVELOPER)) {
                    // Show all footer items to super admin
                  } else {
                    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
                      return null
                    }
                    if (item.requiredRole && !hasRole(item.requiredRole)) {
                      return null
                    }
                  }
                  const active = isActive(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          active && "bg-orange-100 text-orange-700 font-medium",
                          active && "hover:bg-orange-200 hover:text-orange-800",
                        )}
                      >
                        <Link to={item.url}>
                          <item.icon className={cn("mr-2", active && "text-orange-700")} />
                          <span>{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
