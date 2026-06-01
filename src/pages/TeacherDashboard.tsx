import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, Clock, BookOpen, MapPin, CheckCircle, Edit3, ClipboardList, MessageSquare, Send } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import TeacherService from "@/services/TeacherService"
import LogLectureDialog from "@/components/TimeTable/LogLectureDialog"

export default function TeacherDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  const authState = useAppSelector(selectAuthState)
  
  const [timetable, setTimetable] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<string>(format(new Date(), 'eee').toLowerCase().substring(0, 3))
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null)
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Support / Contact Leadership state
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false)
  const [contactForm, setContactForm] = useState({
    recipient: "principal",
    subject: "",
    message: ""
  })
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const handleContactSubmit = async () => {
    if (!contactForm.subject || !contactForm.message) {
      toast({
        variant: "destructive",
        title: t("Validation Error"),
        description: t("Please fill in all fields.")
      })
      return
    }

    try {
      setIsSendingMessage(true)
      // Simulate API call to send message/notification to leadership
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Save secure message to localStorage so other roles can access it
      const existingMessages = JSON.parse(localStorage.getItem("saral_secure_messages") || "[]")
      const newMessage = {
        id: Date.now().toString(),
        senderName: authState.user?.name || "Teacher",
        senderRole: authState.user?.role || "Teacher",
        recipient: contactForm.recipient, // "hod", "principal", "admin", "it_admin"
        subject: contactForm.subject,
        message: contactForm.message,
        timestamp: new Date().toISOString(),
        read: false
      }
      existingMessages.push(newMessage)
      localStorage.setItem("saral_secure_messages", JSON.stringify(existingMessages))

      toast({
        title: t("Message Sent Successfully"),
        description: `Your message has been delivered to the ${contactForm.recipient.toUpperCase()}. They will get in touch with you shortly regarding this matter.`,
      })
      
      setContactForm({
        recipient: "principal",
        subject: "",
        message: ""
      })
      setIsContactSupportOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("Failed to send message")
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const days = [
    { value: "mon", label: t("monday") },
    { value: "tue", label: t("tuesday") },
    { value: "wed", label: t("wednesday") },
    { value: "thu", label: t("thursday") },
    { value: "fri", label: t("friday") },
    { value: "sat", label: t("saturday") },
  ]

  useEffect(() => {
    if (currentAcademicSession) {
      fetchTimetable()
    }
  }, [currentAcademicSession])

  const fetchTimetable = async () => {
    try {
      setIsLoading(true)
      const response = await TeacherService.getMyTimetable(currentAcademicSession!.id)
      setTimetable(response.data)
    } catch (error) {
      console.error("Error fetching teacher timetable:", error)
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("failed_to_load_timetable")
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenLogDialog = (period: any) => {
    setSelectedPeriod(period)
    setIsLogDialogOpen(true)
  }

  const getDayPeriods = (dayValue: string) => {
    return timetable.filter(p => p.period_config_class_day.day === dayValue)
      .sort((a, b) => a.period_order - b.period_order)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("teacher_dashboard")}</h1>
          <p className="text-gray-600 mt-1">{t("manage_your_daily_lectures_and_curriculum_logs")}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm"
            onClick={() => navigate('/d/teacher/logs')}
          >
            <ClipboardList className="h-4 w-4" />
            {t("view_log_history")}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 shadow-sm"
            onClick={() => setIsContactSupportOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            {t("Contact Leadership")}
          </Button>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1.5 px-3">
            {currentAcademicSession?.session_name}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase py-1.5 px-3">
            {format(new Date(), 'EEEE, MMMM do')}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {t("my_timetable")}
            </CardTitle>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {days.map((day) => (
                <Button
                  key={day.value}
                  variant={activeDay === day.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveDay(day.value)}
                  className={`px-4 ${activeDay === day.value ? "shadow-sm" : ""}`}
                >
                  {day.label.substring(0, 3)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getDayPeriods(activeDay).length > 0 ? (
              getDayPeriods(activeDay).map((period) => (
                <Card key={period.id} className="relative group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold">
                        {t("period")} {period.period_order}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <Clock className="h-3 w-3 mr-1" />
                        {period.start_time} - {period.end_time}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2 font-bold text-gray-800">
                      {period.period_config_subject?.subject?.name || t("unknown_subject")}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 font-medium text-blue-600">
                      <BookOpen className="h-3.5 w-3.5" />
                      Class {period.period_config_class_day?.class?.class}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {period.lab?.name || t("regular_classroom")}
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      onClick={() => handleOpenLogDialog(period)}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      {t("log_activity")}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">{t("no_lectures_today")}</h3>
                <p className="text-gray-500">{t("enjoy_your_free_time_or_plan_your_next_lessons")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <LogLectureDialog 
        isOpen={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
        period={selectedPeriod}
        subjectId={selectedPeriod?.period_config_subject?.subject_id}
        subjectName={selectedPeriod?.period_config_subject?.subject?.name}
      />

      <Dialog open={isContactSupportOpen} onOpenChange={setIsContactSupportOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden bg-white p-0">
          <div className="bg-gradient-to-r from-rose-500 to-indigo-600 p-6 text-white">
            <DialogHeader className="text-white">
              <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                <MessageSquare className="h-6 w-6 animate-pulse" />
                {t("Contact Support")}
              </DialogTitle>
              <DialogDescription className="text-rose-100/90 font-medium text-xs mt-1">
                {t("Send a secure message directly to HOD, Principal, Admin, or IT Admin regarding your timetable, leaves, or diary issues.")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {t("Select Recipient")}
              </Label>
              <Select 
                value={contactForm.recipient} 
                onValueChange={(val) => setContactForm({ ...contactForm, recipient: val })}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:ring-indigo-500 rounded-xl">
                  <SelectValue placeholder={t("Choose who to contact")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hod" className="cursor-pointer font-medium">HOD (Department Head)</SelectItem>
                  <SelectItem value="principal" className="cursor-pointer font-medium">Principal</SelectItem>
                  <SelectItem value="admin" className="cursor-pointer font-medium">Administrator</SelectItem>
                  <SelectItem value="it_admin" className="cursor-pointer font-medium">IT Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {t("Subject")}
              </Label>
              <Input
                id="subject"
                placeholder={t("e.g., Request to change diary date restriction, Leave inquiry")}
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="h-11 border-gray-200 focus:ring-indigo-500 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {t("Message Details")}
              </Label>
              <Textarea
                id="message"
                placeholder={t("Describe the situation, date/period details or other circumstances in detail...")}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="min-h-[120px] border-gray-200 focus:ring-indigo-500 rounded-xl text-sm leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="bg-gray-50/50 p-6 border-t flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsContactSupportOpen(false)}
              className="h-11 rounded-xl px-5 border-gray-200 font-semibold"
            >
              {t("cancel")}
            </Button>
            <Button 
              onClick={handleContactSubmit} 
              disabled={isSendingMessage || !contactForm.subject || !contactForm.message}
              className="bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg h-11 rounded-xl px-6 font-bold gap-2 transition-all"
            >
              {isSendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("Send Message")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
