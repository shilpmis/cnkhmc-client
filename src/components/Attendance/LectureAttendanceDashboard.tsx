import type React from "react"
import { useState, useEffect } from "react"
import { useLazyGetMySubjectsQuery } from "@/services/LectureAttendanceService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, BookOpen, BarChart3, History } from "lucide-react"
import type { AssignedSubject } from "@/types/lectureAttendance"
import LectureAttendanceHistory from "./LectureAttendanceHistory"
import LectureAttendanceReports from "./LectureAttendanceReports"

interface LectureAttendanceDashboardProps {
  academicYear: number
}

const LectureAttendanceDashboard: React.FC<LectureAttendanceDashboardProps> = ({ academicYear }) => {
  const [fetchSubjects, { data: subjectsResponse, isLoading }] = useLazyGetMySubjectsQuery()

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("")
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")

  useEffect(() => {
    if (academicYear) {
      fetchSubjects({ academic_session: academicYear })
    }
  }, [academicYear, fetchSubjects])

  const allAssignments: AssignedSubject[] = subjectsResponse?.data ?? []

  // Extract unique divisions
  const divisionMap = new Map<number, string>()
  allAssignments.forEach((a) => {
    if (!divisionMap.has(a.division_id)) {
      divisionMap.set(a.division_id, a.division_name)
    }
  })
  const divisionList = Array.from(divisionMap.entries()).map(([id, name]) => ({ id, name }))

  // Auto-select first division if available
  useEffect(() => {
    if (divisionList.length > 0 && !selectedDivisionId) {
      setSelectedDivisionId(String(divisionList[0].id))
    }
  }, [divisionList, selectedDivisionId])

  // Filter subjects available in selected division
  const currentDivId = Number(selectedDivisionId)
  const availableSubjects = allAssignments.filter((a) => a.division_id === currentDivId)

  // Auto-select first subject if available
  useEffect(() => {
    if (availableSubjects.length > 0) {
      setSelectedSubjectId(String(availableSubjects[0].subject_id))
    } else {
      setSelectedSubjectId("")
    }
  }, [selectedDivisionId, subjectsResponse])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading attendance dashboard...</span>
      </div>
    )
  }

  const selectedSubId = Number(selectedSubjectId)

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lecture Attendance Overview & Analytics</h1>
        <p className="text-muted-foreground mt-1">View class-wide history, student metrics, and export reports</p>
      </div>

      {/* Selector Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Select Class & Subject
          </CardTitle>
          <CardDescription>Filter analytics by specific division and subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Division / Class</label>
              <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisionList.map((div) => (
                    <SelectItem key={div.id} value={String(div.id)}>
                      {div.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                disabled={!selectedDivisionId || availableSubjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((sub) => (
                    <SelectItem key={sub.subject_id} value={String(sub.subject_id)}>
                      {sub.subject_name} ({sub.session_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      {currentDivId ? (
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Reports & Metrics
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2" disabled={!selectedSubId}>
              <History className="h-4 w-4" /> Session History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="pt-4">
            <LectureAttendanceReports
              divisionId={currentDivId}
              academicYear={academicYear}
              defaultSubjectId={selectedSubId || undefined}
              subjects={availableSubjects.map((s) => ({
                subject_id: s.subject_id,
                subject_name: s.subject_name,
              }))}
            />
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            {selectedSubId ? (
              <LectureAttendanceHistory
                divisionId={currentDivId}
                subjectId={selectedSubId}
                academicYear={academicYear}
              />
            ) : (
              <div className="text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground">
                Please select a subject to view session history.
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
          Select a division above to view attendance records and reports.
        </div>
      )}
    </div>
  )
}

export default LectureAttendanceDashboard
