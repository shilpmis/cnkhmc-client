import type React from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Division } from "@/types/academic"
import { CalendarCheck, Users, BookOpen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TeacherClassSelectionProps {
  classes: Division[]
}

const TeacherClassSelection: React.FC<TeacherClassSelectionProps> = ({ classes }) => {
  if (classes.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Class Attendance</h1>
          <p className="text-muted-foreground mt-1">Select a class to mark or view attendance</p>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            No classes have been assigned to you. Please contact your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Class Attendance</h1>
        <p className="text-muted-foreground mt-1">Select a class to mark or view attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Link
            to={`/d/mark-attendance/${cls.id}`}
            key={cls.id}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {cls.class.class}
                    </CardTitle>
                    <CardDescription>{cls.id}</CardDescription>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Students: {cls.students_count || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                  <CalendarCheck className="h-4 w-4" />
                  <span>Schedule: {cls.schedule || "Regular"}</span>
                </div> */}
                <Button className="w-full gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  Take Attendance
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TeacherClassSelection
