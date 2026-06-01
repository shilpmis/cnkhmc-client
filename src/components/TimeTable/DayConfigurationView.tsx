"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Settings, AlertTriangle, CheckCircle } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import type { ClassDayConfigForTimeTable, TimeTableConfigForSchool } from "@/types/subjects"

interface DayConfigurationViewProps {
  dayConfig: ClassDayConfigForTimeTable
  timetableConfig: TimeTableConfigForSchool
}

export default function DayConfigurationView({ dayConfig, timetableConfig }: DayConfigurationViewProps) {
  const { t } = useTranslation()

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* School Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>{t("school_hours")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">{t("start_time")}</p>
              <p className="text-lg font-semibold text-blue-700">{formatTime(dayConfig.day_start_time)}</p>
            </div>
            <div className="text-gray-400">→</div>
            <div>
              <p className="text-sm text-gray-600">{t("end_time")}</p>
              <p className="text-lg font-semibold text-blue-700">{formatTime(dayConfig.day_end_time)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <span>{t("period_settings")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t("allowed_period_durations")}</p>
              <div className="flex flex-wrap gap-2">
                {dayConfig.allowed_durations.map((duration: any) => (
                  <Badge key={duration} variant="secondary" className="bg-green-100 text-green-800">
                    {duration} {t("minutes")}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t("default_duration")}</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {timetableConfig.default_period_duration} {t("minutes")}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t("maximum_periods_per_day")}</p>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {timetableConfig.max_periods_per_day} {t("periods")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>{t("constraints")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{t("max_consecutive_periods")}</span>
              <Badge variant="outline">
                {dayConfig.max_consecutive_periods === null ? t("no_limit") : dayConfig.max_consecutive_periods}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{t("total_breaks")}</span>
              <Badge variant="outline">{dayConfig.total_breaks === null ? t("none") : dayConfig.total_breaks}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{t("break_durations")}</span>
              <Badge variant="outline">
                {Array.isArray(dayConfig.break_durations)
                  ? dayConfig.break_durations.join(", ") + " " + t("minutes")
                  : dayConfig.break_durations === null
                    ? t("not_specified")
                    : `${dayConfig.break_durations} ${t("minutes")}`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Configuration */}
      {timetableConfig.lab_enabled && timetableConfig.lab_config.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-indigo-600" />
              <span>{t("available_labs")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetableConfig.lab_config.map((lab) => (
                <div key={lab.id} className="p-4 border rounded-lg bg-indigo-50">
                  <h4 className="font-medium text-indigo-900">{lab.name}</h4>
                  <p className="text-sm text-indigo-700 mt-1">
                    {t("capacity")}: {lab.max_capacity} {t("classes")}
                  </p>
                  {lab.availability_per_day && (
                    <p className="text-sm text-indigo-700">
                      {t("daily_availability")}: {lab.availability_per_day}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <span>{t("teacher_constraints")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900">{t("max_periods_per_day")}</p>
              <p className="text-lg font-semibold text-orange-700">
                {timetableConfig.teacher_max_periods_per_day || t("no_limit")}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900">{t("max_periods_per_week")}</p>
              <p className="text-lg font-semibold text-orange-700">
                {timetableConfig.teacher_max_periods_per_week || t("no_limit")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
