
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
import { GraduationCap, Users, BookOpen, DollarSign, FileText, UserCheck, UserX, Calendar } from "lucide-react"
import { AdmissionDashboard } from "@/components/Admission/AdmissionDashboard"
import { useTranslation } from "@/redux/hooks/useTranslation"

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("")
  
  const [isQuickInquiryOpen, setIsQuickInquiryOpen] = useState(false)

  const dashboardData = {
    totalInquiries: 150,
    pendingApplications: 45,
    acceptedAdmissions: 80,
    rejectedApplications: 25,
    upcomingInterviews: 10,
  }

  const admissionTrends = [
    { grade: "Grade 1", inquiries: 30 },
    { grade: "Grade 2", inquiries: 25 },
    { grade: "Grade 3", inquiries: 35 },
    { grade: "Grade 4", inquiries: 20 },
    { grade: "Grade 5", inquiries: 40 },
  ]

  useEffect(() => {
    const currentHour = new Date().getHours()
    if (currentHour < 12) {
      setGreeting("Good morning")
    } else if (currentHour < 18) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }, [])

  const {t} = useTranslation();

  return (
    <>
      <div className="md:hidden">
        <img
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="block dark:hidden"
        />
        <img
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="hidden dark:block"
        />
      </div>
      <div className="flex-col md:flex">
        {/* <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </div> */}
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h2>
            <div className="flex items-center space-x-2">
              <p className="text-xl font-bold tracking-tight">{greeting}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                {/* <p className="text-xs text-muted-foreground">+12% from last month</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98</div>
                {/* <p className="text-xs text-muted-foreground">+2 new this month</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"> Present/Absent Staff today</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"> <span className="text-green-500">10</span> / <span className="text-red-500">2</span> </div>
                {/* <p className="text-xs text-muted-foreground">+3 new courses added</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$53,624</div>
                <p className="text-xs text-muted-foreground">+7% from last month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Admission</CardTitle>
              </CardHeader>
              <CardContent>
                <AdmissionDashboard />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("quick_stats")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600">{t("total_inquiries")}</p>
                      <p className="text-2xl font-bold text-blue-800">{dashboardData.totalInquiries}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-yellow-100 rounded-lg">
                    <FileText className="h-6 w-6 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-600">{t("pending_applications")}</p>
                      <p className="text-2xl font-bold text-yellow-800">{dashboardData.pendingApplications}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600">{t("accepted_application")}</p>
                      <p className="text-2xl font-bold text-green-800">{dashboardData.acceptedAdmissions}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-red-100 rounded-lg">
                    <UserX className="h-6 w-6 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm text-red-600">{t("rejected_applications")}</p>
                      <p className="text-2xl font-bold text-red-800">{dashboardData.rejectedApplications}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-purple-100 rounded-lg col-span-2">
                    <Calendar className="h-6 w-6 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600">{t("upcoming_interviews")}</p>
                      <p className="text-2xl font-bold text-purple-800">{dashboardData.upcomingInterviews}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("total_students")}</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                {/* <p className="text-xs text-muted-foreground">+12% from last month</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("total_teachers")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98</div>
                {/* <p className="text-xs text-muted-foreground">+2 new this month</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"> {t("present/absent_staff_today")}</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"> <span className="text-green-500">10</span> / <span className="text-red-500">2</span> </div>
                {/* <p className="text-xs text-muted-foreground">+3 new courses added</p> */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("total_revenue")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$53,624</div>
                <p className="text-xs text-muted-foreground">+7% from last month</p>
              </CardContent>
            </Card>
          </div>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              {/* <CardContent className="pl-2">
                <Overview />
              </CardContent> */}
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>You have {greeting.toLowerCase()}, Admin</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

