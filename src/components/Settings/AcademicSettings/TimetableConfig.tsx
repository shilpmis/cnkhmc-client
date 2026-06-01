import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useGetTimeTableConfigForSchoolQuery } from "@/services/timetableService"
import GeneralSettingsForTimeTable from "./GeneralSettingsForTimeTable"
import LabSettingsForTimeTable from "./LabsSettingForTimeTable"
import ClassDaySettingsForTimeTable from "./ClassDaySettingsForTimeTable"

export default function TimetableSettings() {
    const { t } = useTranslation()
    const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
    const [activeTab, setActiveTab] = useState<string>("general")
    const [isConfigNotFound, setIsConfigNotFound] = useState<boolean>(false)

    // RTK Query hooks
    const {

        data: existingConfig,
        isLoading,
        error,
        refetch,
    } = useGetTimeTableConfigForSchoolQuery(
        { academic_session_id: currentAcademicSession?.id || 0 },
        {
            skip: !currentAcademicSession,
        },
    )

    // Check for 404 error (config not found)
    useEffect(() => {
        if (error) {
            if ((error as any)?.status === 404) {
                setIsConfigNotFound(true)
            } else {
                setIsConfigNotFound(false)
            }
        } else {
            setIsConfigNotFound(false)
        }
    }, [error])

    // Handle tab change
    const handleTabChange = (value: string) => {
        const isLabTabEnabled = existingConfig?.lab_enabled

        if (value === "labs" && !isLabTabEnabled) {
            return
        }
        setActiveTab(value)
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("timetable_configuration")}</CardTitle>
                        <CardDescription>{t("loading_timetable_settings")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center min-h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Check if academic session is available
    if (!currentAcademicSession) {
        return (
            <div className="container mx-auto py-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>{t("no_academic_session")}</AlertTitle>
                    <AlertDescription>{t("please_select_an_active_academic_session")}</AlertDescription>
                </Alert>
            </div>
        )
    }

    // Show error state - but only if it's not a "config not found" error
    if (error && !isConfigNotFound) {
        return (
            <div className="container mx-auto py-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>{t("error")}</AlertTitle>
                    <AlertDescription>{t("failed_to_load_timetable_configuration")}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            {/* <Card>
        <CardHeader>
          <CardTitle>{t("timetable_configuration")}</CardTitle>
          <CardDescription>
            {t("configure_timetable_settings_for")} {currentAcademicSession.session_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConfigNotFound ? (
            <GeneralSettingsForTimeTable
              isNew={true}
              existingConfig={null}
              academicSession={currentAcademicSession}
              onConfigSaved={refetch}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="general">{t("general_settings")}</TabsTrigger>
                <TabsTrigger value="labs" disabled={!existingConfig?.lab_enabled}>
                  {t("lab_settings")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <GeneralSettingsForTimeTable
                  isNew={false}
                  existingConfig={existingConfig ?? null}
                  academicSession={currentAcademicSession}
                  onConfigSaved={refetch}
                />
              </TabsContent>

              <TabsContent value="labs">
                <LabSettingsForTimeTable existingConfig={existingConfig ?? null} onLabConfigSaved={refetch} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card> */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("timetable_configuration")}</CardTitle>
                    <CardDescription>
                        {t("configure_timetable_settings_for")} {currentAcademicSession.session_name}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isConfigNotFound ? (
                        <GeneralSettingsForTimeTable
                            // isNew={true}
                            existingConfig={null}
                            academicSession={currentAcademicSession}
                            onConfigSaved={refetch}
                        />
                    ) : (
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className="grid grid-cols-3 mb-8">
                                <TabsTrigger value="general">{t("general_settings")}</TabsTrigger>
                                <TabsTrigger value="labs" disabled={!existingConfig?.lab_enabled}>
                                    {t("lab_settings")}
                                </TabsTrigger>
                                <TabsTrigger value="class-schedule" disabled={!existingConfig}>
                                    {t("class_schedule")}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="general">
                                <GeneralSettingsForTimeTable
                                    // isNew={false}
                                    existingConfig={existingConfig ?? null}
                                    academicSession={currentAcademicSession}
                                    onConfigSaved={refetch}
                                />
                            </TabsContent>

                            <TabsContent value="labs">
                                <LabSettingsForTimeTable existingConfig={existingConfig ?? null} onLabConfigSaved={refetch} />
                            </TabsContent>

                            <TabsContent value="class-schedule">
                                <ClassDaySettingsForTimeTable
                                    existingConfig={existingConfig ?? null}
                                    academicSession={currentAcademicSession}
                                    onConfigSaved={refetch}
                                />
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
