import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, BookOpen, FlaskConical } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AssignedSubject } from "@/types/lectureAttendance"

interface SubjectSelectionProps {
  subjects: AssignedSubject[]
  onSelect: (subject: AssignedSubject) => void
  isLoading?: boolean
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({ subjects, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Subject & Lecture Attendance</h1>
          <p className="text-muted-foreground mt-1">Loading assigned subjects...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-44 animate-pulse bg-muted/40" />
          ))}
        </div>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Subject & Lecture Attendance</h1>
          <p className="text-muted-foreground mt-1">Select a subject & division to mark or view attendance</p>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            No subjects or divisions have been assigned to you for lecture attendance. Please contact your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subject & Lecture Attendance</h1>
        <p className="text-muted-foreground mt-1">Select a subject and division to take attendance or view history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <Card
            key={`${sub.division_id}-${sub.subject_id}`}
            className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer flex flex-col justify-between"
            onClick={() => onSelect(sub)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold">
                    {sub.subject_name}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-foreground/70">
                    Code: {sub.subject_code || "N/A"}
                  </CardDescription>
                </div>
                <div className="bg-primary/10 p-2 rounded-full shrink-0">
                  {sub.session_type === "lab" ? (
                    <FlaskConical className="h-5 w-5 text-primary" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Division:</span>
                <Badge variant="outline" className="font-semibold px-2.5 py-0.5">
                  {sub.division_name}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Type:</span>
                <Badge
                  variant={sub.session_type === "lab" ? "secondary" : "default"}
                  className="capitalize font-semibold"
                >
                  {sub.session_type}
                </Badge>
              </div>
              <Button className="w-full gap-2 mt-2" onClick={() => onSelect(sub)}>
                <CalendarCheck className="h-4 w-4" />
                Take Attendance
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SubjectSelection
