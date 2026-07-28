import { useState } from "react"
import type React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Users,
  Building2,
  GraduationCap,
  Aperture,
  UsersIcon,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Banknote,
  CalendarDays,
  FileText,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Clock } from "lucide-react"

interface NavItem {
  title: string
  icon: React.ElementType
  href: string
}

interface NavItemWithChildren extends NavItem {
  children?: NavItem[]
}

interface NavSection {
  title: string
  items: NavItemWithChildren[]
}

const navigationSections: NavSection[] = [
  {
    title: "user_settings",
    items: [
      {
        title: "general_settings",
        icon: Settings,
        href: "/d/settings/general",
      },
      // {
      //   title: "notifications",
      //   icon: Bell,
      //   href: "notifications",
      // },
    ],
  },
  {
    title: "school_settings",
    items: [
      {
        title: "academic_management",
        icon: GraduationCap,
        href: "academic",
      },
      {
        title: "department_management",
        icon: Building2,
        href: "departments",
      },
      {
        title: "subject_management",
        icon: GraduationCap,
        href: "subjects",
      },
      {
        title: "staff_management",
        icon: Users,
        href: "staff",
      },
      {
        title: "leave_management",
        icon: Aperture,
        href: "leave",
      },
      {
        title: "payroll_management",
        icon: DollarSign,
        href: "payroll",
        children: [
          {
            title: "salary_components",
            icon: Banknote,
            href: "payroll/salary-components",
          },
          {
            title: "pay_schedule",
            icon: CalendarDays,
            href: "payroll/payroll-schedual",
          },
          {
            title: "salary_templates",
            icon: FileText,
            href: "payroll/salary-template",
          },
        ],
      },
      // {
      //   title: "fees_management",
      //   icon: CreditCard,
      //   href: "fees",
      // },
      {
        title: "exam_management",
        icon: FileText,
        href: "exams",
        children: [
          {
            title: "exam_types",
            icon: Settings,
            href: "exams/masters",
          },
          {
            title: "exam_schedules",
            icon: CalendarDays,
            href: "exams/schedules",
          },
        ],
      },
      {
        title: "time_table_management",
        icon: Clock,
        href: "timetable",
      },
      {
        title: "admission_management",
        icon: Building2,
        href: "admission",
      },
      {
        title: "student_management",
        icon: UsersIcon,
        href: "student",
        children: [
          {
            title: "manage_students",
            icon: Users,
            href: "manage/students",
          },
          {
            title: "student_promotion",
            icon: GraduationCap,
            href: "manage/promotion",
          },
        ],
      },
    ],
  },
]

interface SettingsSidebarProps {
  currentPath: string
}

export function SettingsSidebar({ currentPath }: SettingsSidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    payroll: false, // Default state for payroll accordion
  })

  // Function to check if a menu item is active
  const isActive = (href: string) => {
    // Check if the href is a full path or just a segment
    if (href.startsWith("/")) {
      return location.pathname === href || location.pathname.startsWith(`${href}/`)
    }
    // For relative paths, check if the currentPath matches or if it's in the URL
    return currentPath === href || location.pathname.includes(`/${href}`)
  }

  // Function to check if any child of an item is active
  const isAnyChildActive = (children?: NavItem[]) => {
    if (!children) return false
    return children.some((child) => isActive(child.href))
  }

  // Function to toggle accordion state
  const toggleAccordion = (key: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Auto-expand accordion if a child route is active
  useState(() => {
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && isAnyChildActive(item.children)) {
          setExpandedItems((prev) => ({
            ...prev,
            [item.href]: true,
          }))
        }
      })
    })
  })

  return (
    <div className="w-64 min-h-screen border-r bg-gray-50/40">
      <ScrollArea className="h-full py-6">
        <div className="px-4 pb-4">
          <h2 className="px-2 text-lg font-semibold tracking-tight">{t("settings")}</h2>
        </div>
        <div className="space-y-6">
          {navigationSections.map((section, i) => (
            <div key={section.title} className="px-3">
              <div className="space-y-1">
                <h3 className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{t(section.title)}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    const hasChildren = item.children && item.children.length > 0
                    const isExpanded = expandedItems[item.href] || isAnyChildActive(item.children)

                    return (
                      <div key={item.href}>
                        {hasChildren ? (
                          <button
                            onClick={() => toggleAccordion(item.href)}
                            className={cn(
                              "flex items-center justify-between w-full text-left text-sm px-3 py-2 rounded-md transition-colors",
                              active || isAnyChildActive(item.children)
                                ? "bg-gray-100 text-black font-medium hover:bg-gray-200"
                                : "text-gray-600 font-normal hover:bg-gray-100 hover:text-gray-900",
                            )}
                          >
                            <div className="flex items-center gap-x-3">
                              <item.icon
                                className={cn(
                                  "h-4 w-4",
                                  (active || isAnyChildActive(item.children)) && "text-orange-700",
                                )}
                              />
                              {t(item.title)}
                            </div>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        ) : (
                          <Link
                            to={item.href}
                            className={cn(
                              "flex items-center gap-x-3 text-sm px-3 py-2 rounded-md transition-colors",
                              active
                                ? "bg-gray-100 text-black font-medium hover:bg-gray-200"
                                : "text-gray-600 font-normal hover:bg-gray-100 hover:text-gray-900",
                            )}
                          >
                            <item.icon className={cn("h-4 w-4", active && "text-orange-700")} />
                            {t(item.title)}
                          </Link>
                        )}

                        {/* Render children if expanded */}
                        {hasChildren && isExpanded && (
                          <div className="ml-6 mt-1 space-y-1 border-l pl-2 border-gray-200">
                            {item.children?.map((child) => {
                              const childActive = isActive(child.href)
                              return (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  className={cn(
                                    "flex items-center gap-x-3 text-sm px-3 py-2 rounded-md transition-colors",
                                    childActive
                                      ? "bg-gray-100 text-black font-medium hover:bg-gray-200"
                                      : "text-gray-600 font-normal hover:bg-gray-100 hover:text-gray-900",
                                  )}
                                >
                                  <child.icon className={cn("h-4 w-4", childActive && "text-orange-700")} />
                                  {t(child.title)}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              {i < navigationSections.length - 1 && <Separator className="my-4 opacity-50" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
