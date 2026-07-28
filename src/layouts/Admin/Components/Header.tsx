
import { useEffect, useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAppDispatch } from "@/redux/hooks/useAppDispatch"
import { logout } from "@/services/AuthService"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTranslation } from "@/redux/hooks/useTranslation"
import LanguageSwitcher from "@/components/traslater/languageSwitcher"
import { AlertTriangle, LogOut, User, Zap, School, Calendar, ChevronDown, Bell, SearchIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { selectActiveAccademicSessionsForSchool, selectAccademicSessionsForSchool, setCurrentActiveAcademicSession } from "@/redux/slices/authSlice"
import type { AcademicSession } from "@/types/user"
import { Search } from "@/components/Dashboard/Search"

const shortFormForRole: any = {
  1: "AD",
  2: "PR",
  3: "HT",
  4: "CL",
  5: "IT",
  6: "TE",
}

export default function Header() {
  const dispatch = useAppDispatch()
  const users = useAppSelector((state) => state.auth.user)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const allAcademicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const { t } = useTranslation()

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New student enrolled", read: false, time: "10 min ago" },
    { id: 2, title: "Fee payment reminder", read: false, time: "1 hour ago" },
    { id: 3, title: "Staff meeting scheduled", read: true, time: "Yesterday" },
  ])

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false)
    await dispatch(logout())
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", handleOnlineStatusChange)
    window.addEventListener("offline", handleOnlineStatusChange)

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange)
      window.removeEventListener("offline", handleOnlineStatusChange)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Format academic year for display
  const formatAcademicYear = (session: AcademicSession) => {
    if (!session) return "No Session Selected"
    if ((session as any).session_name) return (session as any).session_name
    if ((session as any).academic_year) return `${(session as any).academic_year}-${Number((session as any).academic_year) + 1}`
    const startYear = session.start_year ? new Date(session.start_year).getFullYear() : NaN
    const endYear = session.end_year ? new Date(session.end_year).getFullYear() : NaN
    if (!isNaN(startYear) && !isNaN(endYear)) {
      return `${startYear}-${endYear}`
    }
    const currentYear = new Date().getFullYear()
    return `${currentYear}-${currentYear + 1}`
  }

  return (
    <>
      {/* Offline Status Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full shadow-lg flex justify-center items-center p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 z-50 fixed top-0"
          >
            <Zap className="h-4 w-4 mr-2 animate-pulse" />
            <span className="text-sm font-medium">No Internet Connection (·•᷄‎ࡇ•᷅ )</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header
        className={`w-full shadow-sm border-b bg-white dark:bg-gray-900 transition-all duration-300 ${
          !isOnline ? "mt-10" : ""
        }`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo and School Name */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-primary hover:text-primary/80 transition-colors" />
              <div className="hidden md:flex items-center">
                {/* <School className="h-5 w-5 text-primary mr-2" /> */}
                <h1 className="text-lg font-medium">
                  {users?.school?.name || "Saral School Management"}
                </h1>
              </div>
            </div>

            {/* Center Section - Search (Desktop) */}
            <div className="hidden md:block flex-1 max-w-xl mx-4">
              <Search />
            </div>

            {/* Right Section - Controls and User Profile */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile Search Toggle */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  <SearchIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Academic Session Selector (Desktop) */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 flex items-center gap-2 px-3 py-2 h-9 rounded-full"
                    >
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary text-sm truncate max-w-[100px] lg:max-w-[150px]">
                        {currentAcademicSession ? formatAcademicYear(currentAcademicSession) : "Select Session"}
                      </span>
                      <ChevronDown className="h-3 w-3 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    <div className="p-2">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">{t("academic_sessions")}</h3>
                      <div className="space-y-1">
                        {allAcademicSessions && allAcademicSessions.length > 0 ? (
                          allAcademicSessions.map((session) => (
                            <div
                              key={session.id}
                              onClick={() => dispatch(setCurrentActiveAcademicSession(session))}
                              className={cn(
                                "p-2 rounded-md cursor-pointer transition-colors border",
                                currentAcademicSession?.id === session.id
                                  ? "bg-primary/10 border-primary/20"
                                  : "bg-transparent border-transparent hover:bg-muted"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{formatAcademicYear(session)}</span>
                                {currentAcademicSession?.id === session.id && (
                                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                    {t("current")}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.start_month} - {session.end_month}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground p-2">
                            {t("no_sessions_available")}
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Academic Session */}
              <div className="md:hidden">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 h-9 w-9"
                      >
                        <Calendar className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{currentAcademicSession ? formatAcademicYear(currentAcademicSession) : t("select_session")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Notifications */}
              <div className="hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between p-2 border-b">
                      <h3 className="font-semibold">{t("notifications")}</h3>
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                        {t("mark_all_as_read")}
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <DropdownMenuItem key={notification.id} className="p-0 focus:bg-transparent">
                            <div
                              className={cn(
                                "w-full p-3 hover:bg-muted cursor-pointer",
                                !notification.read && "bg-primary/5",
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <span className={cn("text-sm", !notification.read && "font-medium")}>
                                  {notification.title}
                                </span>
                                {!notification.read && <span className="h-2 w-2 rounded-full bg-primary mt-1"></span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <p>{t("no_notifications")}</p>
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer group ml-1">
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium line-clamp-1">{users?.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{users?.username || users?.email}</p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-primary/70 group-hover:border-primary transition-colors">
                      <AvatarImage
                        src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?t=st=1741157072~exp=1741160672~hmac=ed96e089fd628b2ab1f81ea8e2bb6ecdda05224e16db03ed8a1745e8b9787c4f&w=900"
                        alt={users?.name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {users?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <div className="p-4 flex flex-col items-center gap-2 border-b">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?t=st=1741157072~exp=1741160672~hmac=ed96e089fd628b2ab1f81ea8e2bb6ecdda05224e16db03ed8a1745e8b9787c4f&w=900"
                        alt={users?.name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-white text-xl">
                        {users?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-semibold">{users?.name}</p>
                      <p className="text-xs text-muted-foreground">{users?.username || users?.email}</p>
                    </div>
                    <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">
                      {users ? shortFormForRole[users.role] : "User"}
                    </Badge>
                  </div>

                  <div className="p-2">
                    {/* Language switcher for mobile */}
                    <div className="sm:hidden mb-2">
                      <p className="px-2 text-xs text-muted-foreground mb-1">{t("language")}</p>
                      <div className="px-2">
                        <LanguageSwitcher />
                      </div>
                    </div>

                    {/* Academic Session in dropdown for mobile */}
                    <div className="md:hidden mb-2 space-y-2">
                      <p className="px-2 text-xs text-muted-foreground mb-1">{t("academic_sessions")}</p>
                      {allAcademicSessions && allAcademicSessions.length > 0 ? (
                        allAcademicSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => dispatch(setCurrentActiveAcademicSession(session))}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors border",
                              currentAcademicSession?.id === session.id
                                ? "bg-primary/10 border-primary/20"
                                : "bg-transparent border-transparent hover:bg-muted"
                            )}
                          >
                            <Calendar className={cn("h-4 w-4", currentAcademicSession?.id === session.id ? "text-primary" : "text-muted-foreground")} />
                            <div className="flex-1">
                              <p className={cn("text-sm font-medium", currentAcademicSession?.id === session.id ? "text-primary" : "")}>
                                {formatAcademicYear(session)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {session.start_month} - {session.end_month}
                              </p>
                            </div>
                            {currentAcademicSession?.id === session.id && (
                              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-[10px] h-5">
                                {t("current")}
                              </Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 rounded-md bg-primary/5 border border-dashed border-primary/30">
                          <p className="text-xs text-muted-foreground">{t("no_sessions_available")}</p>
                        </div>
                      )}
                    </div>

                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2 p-2 rounded-md" asChild>
                      <Dialog>
                        <DialogTrigger className="w-full flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{t("my_profile")}</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>{t("your_profile")}</DialogTitle>
                            <DialogDescription>{t("view_and_manage_your_profile_information")}</DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-center my-4">
                            <Avatar className="h-24 w-24">
                              <AvatarImage
                                src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?t=st=1741157072~exp=1741160672~hmac=ed96e089fd628b2ab1f81ea8e2bb6ecdda05224e16db03ed8a1745e8b9787c4f&w=900"
                                alt={users?.name || "User"}
                              />
                              <AvatarFallback className="bg-primary text-white text-2xl">
                                {users?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                {t("name")}
                              </Label>
                              <Input id="name" defaultValue={users?.name} className="col-span-3" readOnly />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="schoolName" className="text-right">
                                {t("school_name")}
                              </Label>
                              <Input
                                id="schoolName"
                                defaultValue={users?.school?.name}
                                className="col-span-3"
                                readOnly
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="status" className="text-right">
                                {t("status")}
                              </Label>
                              <Input id="status" defaultValue={users?.school?.status} className="col-span-3" readOnly />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="contactNumber" className="text-right">
                                {t("contact_number")}
                              </Label>
                              <Input
                                id="contactNumber"
                                defaultValue={users?.school?.contact_number}
                                className="col-span-3"
                                readOnly
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="cursor-pointer flex items-center gap-2 p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setIsLogoutDialogOpen(true)}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t("logout")}</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Search - Expandable */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden mt-3 pb-2"
              >
                <Search />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mx-auto mb-4 w-14 h-14 flex items-center justify-center bg-red-100 rounded-full"
            >
              <AlertTriangle className="text-red-600 w-7 h-7" />
            </motion.div>
            <DialogTitle className="text-xl font-bold">{t("logout_confirmation")}</DialogTitle>
            <DialogDescription>
              {t("are_you_sure_you_want_to_logout?_you_will_be_redirected_to_the_login_page.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-center gap-3">
            <Button type="button" variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleLogout}>
              {t("logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

