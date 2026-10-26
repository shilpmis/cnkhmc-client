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
import { format, startOfWeek, addDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import TeacherService from "@/services/TeacherService"
import LessonPlanService from "@/services/LessonPlanService"
import LogLectureDialog from "@/components/TimeTable/LogLectureDialog"
import LogNonLectureDialog from "@/components/TimeTable/LogNonLectureDialog"
import { useGetMyAssignedSessionsQuery, NonLectureAssignment } from "@/services/NonLectureService"
import { AlertTriangle, Layers } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  
  const [availability, setAvailability] = useState<any>(null)
  const [coverageReports, setCoverageReports] = useState<any[]>([])

  // Non-Lecture Sessions state
  const [selectedNonLectureAssignment, setSelectedNonLectureAssignment] = useState<NonLectureAssignment | null>(null)
  const [isNonLectureDialogOpen, setIsNonLectureDialogOpen] = useState(false)
  const [viewingAssignmentLogs, setViewingAssignmentLogs] = useState<NonLectureAssignment | null>(null)

  const { data: nonLectureRes, refetch: refetchNonLecture } = useGetMyAssignedSessionsQuery(
    { academic_session_id: currentAcademicSession?.id },
    { skip: !currentAcademicSession }
  )
  const assignedNonLectureSessions = nonLectureRes?.data || []

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

  const getActiveDateObj = () => {
    const dayIndex = days.findIndex(d => d.value === activeDay)
    const index = dayIndex !== -1 ? dayIndex : 0
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return addDays(monday, index)
  }

  const getActiveDate = () => {
    return format(getActiveDateObj(), 'EEEE, MMMM do')
  }

  const isFutureActiveDate = () => {
    const activeDateObj = getActiveDateObj()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    activeDateObj.setHours(0, 0, 0, 0)
    return activeDateObj.getTime() > today.getTime()
  }

  useEffect(() => {
    if (currentAcademicSession) {
      fetchTimetable()
    }
  }, [currentAcademicSession])

  const fetchTimetable = async () => {
    try {
      setIsLoading(true)
      const [timetableRes, availabilityRes, coverageRes] = await Promise.allSettled([
        TeacherService.getMyTimetable(currentAcademicSession!.id),
        TeacherService.getMyAvailability(currentAcademicSession!.id),
        LessonPlanService.getAllCoverageReports(currentAcademicSession!.id)
      ])

      if (timetableRes.status === 'fulfilled') {
        setTimetable(timetableRes.value.data)
      } else {
        console.error("Error fetching timetable:", timetableRes.reason)
      }

      if (availabilityRes.status === 'fulfilled') {
        setAvailability(availabilityRes.value.data)
      } else {
        console.error("Error fetching availability:", availabilityRes.reason)
      }

      if (coverageRes.status === 'fulfilled') {
        setCoverageReports(coverageRes.value.data || [])
      } else {
        console.error("Error fetching coverage reports:", coverageRes.reason)
      }

      if (timetableRes.status === 'rejected' && availabilityRes.status === 'rejected') {
        toast({
          variant: "destructive",
          title: t("error"),
          description: t("failed_to_load_timetable")
        })
      }
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

  const warnings: Array<{ subjectName: string; required: number; projected: number }> = []
  if (availability?.projectedAvailablePeriods && coverageReports.length > 0) {
    const uniqueSubjects = Array.from(new Set(timetable.map(p => p.period_config_subject?.subject_id).filter(Boolean)))
    
    uniqueSubjects.forEach(subjectId => {
      const coverage = coverageReports.find(c => c.subjectId === subjectId || c.subject_id === subjectId)
      const projected = availability.projectedAvailablePeriods[subjectId] || 0
      
      if (coverage && coverage.totalHours > projected) {
        warnings.push({
          subjectName: coverage.subjectName,
          required: coverage.totalHours,
          projected: projected
        })
      }
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {warnings.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="font-semibold text-red-800">Available Hours Warning</AlertTitle>
          <AlertDescription>
            Due to holidays and exams in the academic calendar, you may not have enough periods to cover the required syllabus for:
            <ul className="list-disc pl-5 mt-2">
              {warnings.map((w, idx) => (
                <li key={idx}>
                  <strong>{w.subjectName}</strong>: Required {w.required} hrs, but only {w.projected} periods are available.
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
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
            {getActiveDate()}
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
            {activeDay === format(new Date(), 'eee').toLowerCase().substring(0, 3) && availability?.todayIsHoliday ? (
              <div className="col-span-full py-12 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-blue-900">{t("Holiday / Exam - No Classes")}</h3>
                <p className="text-blue-600">{t("Enjoy your day off! The academic calendar marks today as a non-working day.")}</p>
              </div>
            ) : getDayPeriods(activeDay).length > 0 ? (
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
                      {period.period_config_class_day?.class?.class}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {period.lab?.name || t("regular_classroom")}
                    </div>
                    <Button 
                      className={`w-full text-white shadow-sm ${isFutureActiveDate() ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      onClick={() => handleOpenLogDialog(period)}
                      disabled={isFutureActiveDate()}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      {isFutureActiveDate() ? t("Future Date") : t("log_activity")}
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
        date={format(getActiveDateObj(), 'yyyy-MM-dd')}
      />

      {/* Non-Lecture / Clinical & Practical Sessions Section */}
      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-indigo-950 font-bold">
                <Layers className="h-5 w-5 text-indigo-600" />
                Non-Lecture, Clinical &amp; Practical Workload
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Assigned hospital postings, bedside clinics, practicals, and tutorial sessions. Log your conducted sessions here.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs shadow-xs"
                onClick={() => navigate('/d/teacher/logs')}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                View All Logs Report
              </Button>
              {assignedNonLectureSessions.length > 0 && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {assignedNonLectureSessions.length} Assigned Session{assignedNonLectureSessions.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {assignedNonLectureSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                <Layers className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-800">No Non-Lecture Sessions Assigned</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                You currently do not have any non-lecture or clinical posting templates assigned to your account for this session.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedNonLectureSessions.map((assign) => {
                const logged = Number(assign.logged_hours || 0)
                const target = Number(assign.target_hours || 0)
                const pct = assign.completion_percentage || 0

                return (
                  <Card
                    key={assign.id}
                    className="relative group hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-600 bg-white"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-1">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-semibold text-xs">
                          {assign.template?.activity_type || "Non-Lecture"}
                        </Badge>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Batch: {assign.batch_name || "All"}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-gray-900 mt-2 line-clamp-1">
                        {assign.template?.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 font-medium text-indigo-600 text-xs">
                        <BookOpen className="h-3 w-3" />
                        {assign.class?.class || assign.template?.class?.class || "General Batch"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      {/* Hours progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Logged: {logged} / {target} hrs</span>
                          <span className="font-bold text-indigo-700">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>Curriculum Units:</strong> {assign.template?.topics?.length || 0} Topics • {assign.logged_sessions_count || 0} Activity Logs
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => setViewingAssignmentLogs(assign)}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          History ({assign.logs?.length || 0})
                        </Button>

                        <Button
                          size="sm"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs h-9"
                          onClick={() => {
                            setSelectedNonLectureAssignment(assign)
                            setIsNonLectureDialogOpen(true)
                          }}
                        >
                          <ClipboardList className="h-3.5 w-3.5 mr-1" />
                          Log Work
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LogNonLectureDialog
        isOpen={isNonLectureDialogOpen}
        onOpenChange={setIsNonLectureDialogOpen}
        assignment={selectedNonLectureAssignment}
        onSuccess={() => refetchNonLecture()}
      />

      {/* View Session Historical Logs Dialog */}
      <Dialog open={!!viewingAssignmentLogs} onOpenChange={(open) => !open && setViewingAssignmentLogs(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              {viewingAssignmentLogs?.template?.title} - Log History
            </DialogTitle>
            <DialogDescription>
              {viewingAssignmentLogs?.template?.activity_type} • Batch: {viewingAssignmentLogs?.batch_name || "All"} • Total Logged: {viewingAssignmentLogs?.logged_hours || 0} / {viewingAssignmentLogs?.target_hours || 0} hrs
            </DialogDescription>
          </DialogHeader>

          {viewingAssignmentLogs && (
            <div className="space-y-4 py-2">
              {(!viewingAssignmentLogs.logs || viewingAssignmentLogs.logs.length === 0) ? (
                <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">
                  <p className="text-sm font-medium text-gray-700">No activity logs recorded yet for this session.</p>
                  <p className="text-xs text-gray-400 mt-1">Click &quot;Log Work&quot; to submit your first clinical or practical entry.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingAssignmentLogs.logs.map((log: any) => (
                    <Card key={log.id} className="border shadow-xs bg-gray-50/50">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white font-bold text-gray-800">
                              {log.date}
                            </Badge>
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {log.hours_spent || log.hoursSpent} hrs
                            </Badge>
                            {log.batch_name && (
                              <span className="text-gray-500 font-mono">({log.batch_name})</span>
                            )}
                          </div>
                          {log.students_count && (
                            <span className="text-gray-500 font-medium">{log.students_count} students</span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {log.topic?.title || "Curriculum Unit / Practical Session"}
                          </p>
                          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                            {log.activity_details || log.activityDetails}
                          </p>
                        </div>

                        {log.clinical_cases && (
                          <p className="text-xs text-emerald-700">
                            <strong>Cases Discussed:</strong> {log.clinical_cases}
                          </p>
                        )}
                        {log.learning_outcomes && (
                          <p className="text-xs text-gray-500">
                            <strong>Outcomes:</strong> {log.learning_outcomes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAssignmentLogs(null)}>
              Close
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                const target = viewingAssignmentLogs
                setViewingAssignmentLogs(null)
                setSelectedNonLectureAssignment(target)
                setIsNonLectureDialogOpen(true)
              }}
            >
              + Log New Work
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
