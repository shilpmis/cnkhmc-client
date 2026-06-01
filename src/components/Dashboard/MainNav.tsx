import { Link } from "react-router-dom"
import type React from "react" // Added import for React
import { cn } from "@/lib/utils"
import { useTranslation } from "@/redux/hooks/useTranslation"


export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const {t} = useTranslation()
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
        Overview
      </Link>
      <Link to="/students" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        {t("students")}
      </Link>
      <Link to="/teachers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        Teachers
      </Link>
      <Link to="/courses" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        Courses
      </Link>
      <Link to="/settings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        Settings
      </Link>
    </nav>
  )
}

