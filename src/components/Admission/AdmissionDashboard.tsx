import type React from "react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Search, Filter, RefreshCw } from "lucide-react"
import {
  useGetAdmissionDashboardQuery,
  useGetAdmissionDetailedStatsQuery,
  useGetAdmissionTrendsQuery,
} from "@/services/dashboardServices"
import { useEffect, useState } from "react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Button } from "@/components/ui/button"
import { QuickInquiryForm } from "./QuickInquiryForm" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAccademicSessionsForSchool, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { RecentInquiries } from "./RecentInquiries"
import { current } from "@reduxjs/toolkit"
import { toast } from "@/hooks/use-toast"

interface ClassWiseTrend {
  time_period: string
  total: number
  [className: string]: number | string
}

interface TrendResponse {
  trends: ClassWiseTrend[]
  classes: string[]
}

export const AdmissionDashboard: React.FC = () => {
  // State for trend period and academic year
  const [trendPeriod, setTrendPeriod] = useState<"day" | "week" | "month">("week")
  const [isQuickInquiryOpen, setIsQuickInquiryOpen] = useState(false)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null)
  const { t } = useTranslation()

  // Get all academic sessions
  const academicSessions = useAppSelector(selectAccademicSessionsForSchool)
  const CurrentacademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Set default academic year on component mount
  useEffect(() => {
    if (selectedAcademicYear) {
      // Find the current/active academic session
      // const activeSession = academicSessions.find((session) => Boolean(session.is_active))
      setSelectedAcademicYear(selectedAcademicYear)
    }else{
      setSelectedAcademicYear(CurrentacademicSessions!.id)
    }
    console.log("Current academic session:", CurrentacademicSessions!.id ,selectedAcademicYear)
  }, [academicSessions, selectedAcademicYear])

  // Fetch basic dashboard metrics with academic year filter
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useGetAdmissionDashboardQuery(
    {academic_session_id: selectedAcademicYear || CurrentacademicSessions!.id} // Default to first session if none selected
  )

  // Fetch detailed status statistics with academic year filter
  const {
    data: statusStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useGetAdmissionDetailedStatsQuery(
    {academic_session_id: selectedAcademicYear || CurrentacademicSessions!.id}
  )

  // Fetch trend data with period state and academic year filter
  const {
    data: trendResponse,
    isLoading: isLoadingTrends,
    refetch: refetchTrends,
  } = useGetAdmissionTrendsQuery(
      { period: trendPeriod,
        limit: 6, 
        academic_session_id: selectedAcademicYear || CurrentacademicSessions!.id
      }
  ) as { data: TrendResponse | undefined; isLoading: boolean; refetch: () => void }

  // Refetch data when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      refetchDashboard()
      refetchStats()
      refetchTrends()
    }
  }, [selectedAcademicYear, refetchDashboard, refetchStats, refetchTrends])

  // Array of colors for different classes
  const classColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#a4de6c",
    "#d0ed57",
  ]

  // Create data for status-based chart
  const statusChartData = statusStats
    ? Object.entries(statusStats).map(([status, count]) => ({
        status,
        count,
      }))
    : []

  // Loading state indicator
  const isLoading = isLoadingDashboard || isLoadingStats || isLoadingTrends

  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = async () => {
      setIsRefreshing(true)
      try {
        await Promise.all([refetchDashboard(), refetchStats(), refetchTrends()])
        toast({
          title: t("data_refreshed"),
          description: t("the_latest_data_has_been_loaded"),
        })
      } catch (error) {
        toast({
          title: t("refresh_failed"),
          description: t("could_not_refresh_data"),
          variant: "destructive",
        })
      } finally {
        setIsRefreshing(false)
      }
    }

  return (
    <div className="space-y-6">
      {/* Academic Year Filter and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("academic_year")}:</span>
          <Select
            value={selectedAcademicYear?.toString() || ""}
            onValueChange={(value) => setSelectedAcademicYear(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("select_academic_year")} />
            </SelectTrigger>
            <SelectContent>
              {academicSessions?.map((session) => (
                <SelectItem key={session.id} value={session.id.toString()}>
                  {session.session_name} {Boolean(session.is_active) && `(${t("current")})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={refreshData} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>

        {/* <div className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = "/d/admission/inquiries")}>
            <Search className="h-4 w-4 mr-2" />
            {t("view_all_inquiries")}
          </Button>
          <Button onClick={() => setIsQuickInquiryOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("quick_inquiry")}
          </Button>
        </div> */}
      </div>

      {isLoading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_inquiries")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingDashboard ? "..." : dashboardData?.totalInquiries}</div>
            <p className="text-xs text-muted-foreground">{t("total_applications_received")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pending_applications")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingDashboard ? "..." : dashboardData?.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">{t("awaiting_review")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("accepted_admissions")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingDashboard ? "..." : dashboardData?.acceptedAdmissions}</div>
            <p className="text-xs text-muted-foreground">{t("approved_admissions")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("upcoming_interviews")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingDashboard ? "..." : dashboardData?.upcomingInterviews}</div>
            <p className="text-xs text-muted-foreground">{t("scheduled_interviews")}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">{t("admission_trends")}</TabsTrigger>
          <TabsTrigger value="status">{t("status_breakdown")}</TabsTrigger>
          <TabsTrigger value="class">{t("class_wise_trends")}</TabsTrigger>
          {/* <TabsTrigger value="recent">{t("recent_inquiries")}</TabsTrigger> */}
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>{t("admission_trends_over_time")}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4">
                  <span>{t("number_of_inquiries_received_per_time_period")}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTrendPeriod("day")}
                      className={`px-2 py-1 text-xs rounded ${trendPeriod === "day" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {t("daily")}
                    </button>
                    <button
                      onClick={() => setTrendPeriod("week")}
                      className={`px-2 py-1 text-xs rounded ${trendPeriod === "week" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {t("weekly")}
                    </button>
                    <button
                      onClick={() => setTrendPeriod("month")}
                      className={`px-2 py-1 text-xs rounded ${trendPeriod === "month" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {t("monthly")}
                    </button>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendResponse?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total Inquiries" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>{t("applications_by_status")}</CardTitle>
              <CardDescription>{t("breakdown_of_applications_by_current_status")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Applications" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class">
          <Card>
            <CardHeader>
              <CardTitle>{t("class_wise_admission_trends")}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4">
                  <span>{t("admission_inquiries_by_class_over_time")}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTrendPeriod("day")}
                      className={`px-2 py-1 text-xs rounded ${trendPeriod === "day" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {t("daily")}
                    </button>
                    <button
                      onClick={() => setTrendPeriod("week")}
                      className={`px-2 py-1 text-xs rounded ${trendPeriod === "week" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {t("weekly")}
                    </button>
                    <button
                      onClick={() => setTrendPeriod("month")}
                      className={`px-2 py-1 text-xs rounded ${trendPeriod === "month" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {t("monthly")}
                    </button>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendResponse?.trends || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time_period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {trendResponse?.classes?.map((className, index) => (
                      <Bar
                        key={className}
                        dataKey={className}
                        stackId="a"
                        fill={classColors[index % classColors.length]}
                        name={className}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          {selectedAcademicYear && <RecentInquiries academicSessionId={selectedAcademicYear} />}
        </TabsContent>
      </Tabs>

      {/* Quick Inquiry Form Dialog */}
      {selectedAcademicYear && (<QuickInquiryForm
        isOpen={isQuickInquiryOpen}
        onClose={() => setIsQuickInquiryOpen(false)}
        academicSessionId={selectedAcademicYear}
      />)}
    </div>
  )
}

export default AdmissionDashboard

