"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SerializedError } from "@reduxjs/toolkit"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { Student } from "@/types/student"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectAcademicClasses, selectAllAcademicClasses } from "@/redux/slices/academicSlice"
import { useEffect } from "react"
import { selectAuthState } from "@/redux/slices/authSlice"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"

interface StudentSearchResultsProps {
  results: Partial<Student>[]
  isLoading: boolean
  error?: FetchBaseQueryError | SerializedError
  onSelectStudent: (student_id: number) => void
}

export function StudentSearchResults({ results, isLoading, error, onSelectStudent }: StudentSearchResultsProps) {

  const { t } = useTranslation()
  const authState = useAppSelector(selectAuthState)  
  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const AcademicDivisions = useAppSelector(selectAllAcademicClasses)
  const [getAcademicClasses] = useLazyGetAcademicClassesQuery()
  

  useEffect(() => {
    if (!AcademicClasses && authState.user) {
      getAcademicClasses(authState.user.school_id)
    }
  }, [AcademicClasses])

  if (isLoading) {
    return (
      <Card className="absolute z-10 w-full mt-1 shadow-lg">
        <CardContent className="p-2">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-sm" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="absolute z-10 w-full mt-1 shadow-lg">
        <CardContent className="p-2 text-destructive">{t("failed_to_load_search_results._please_try_again.")}</CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-[300px] overflow-y-auto">
      <CardContent className="p-0">
        {results.map((student) => {
          const academicClass = student?.academic_class && student.academic_class[0];
          const className = academicClass
            ? AcademicClasses?.find((cls) => cls.id === academicClass.class?.class_id)?.class
            : undefined;
          const division = academicClass
            ? AcademicDivisions?.find((div) => div.id === academicClass.division_id)?.division
            : undefined;
          const divisionAlias = academicClass
            ? AcademicDivisions?.find((div) => div.id === academicClass.division_id)?.aliases
            : undefined;
          const status = academicClass?.status;
          const rollNumber = student.roll_number;

          return (
            <div
              key={student.id}
              className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => student.id && onSelectStudent(student.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <span>
                      {student.first_name} {student.middle_name || ""} {student.last_name || ""}
                    </span>
                    {status && (
                      <Badge
                        className={`text-xs px-2 py-0.5 ${status === 'pursuing' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                        variant="outline"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {className && division ? (
                      <>
                        Class {className} - {division}
                        {divisionAlias ? ` (${divisionAlias})` : ""}
                      </>
                    ) : (
                      "Class information not available"
                    )}
                  </div>
                  {rollNumber && (
                    <div className="text-xs text-muted-foreground font-mono">
                      Roll No: {rollNumber}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="font-mono">
                  GR: {student.gr_no}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  )
}

