"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SerializedError } from "@reduxjs/toolkit"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { StaffType } from "@/types/staff"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface StaffSearchResultsProps {
  results: StaffType[]
  isLoading: boolean
  error?: FetchBaseQueryError | SerializedError
  onSelectStaff: (staff: StaffType) => void
}

export function StaffSearchResults({ results, isLoading, error, onSelectStaff }: StaffSearchResultsProps) {
  const { t } = useTranslation()

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
        <CardContent className="p-2 text-destructive">
          {t("failed_to_load_search_results._please_try_again.")}
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-[300px] overflow-y-auto">
      <CardContent className="p-0">
        {results.map((staff) => (
          <div
            key={staff.id}
            className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onSelectStaff(staff)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {staff.first_name} {staff.middle_name || ""} {staff.last_name || ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  {/* {staff.role_type ? staff.role_type.role : "Role not available"} */}
                </div>
              </div>
              <Badge variant="outline" className="font-mono">
                ID: {staff.employee_code}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
