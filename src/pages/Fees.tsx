import type React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeeDashboard } from "@/components/Fees/Dashboard/FeeDashboard"
import { FeeTypeManagement } from "@/components/Fees/FeeType/FeeTypeManagement"
import { FeePlanManagement } from "@/components/Fees/FeePlan/FeePlanManagement"
import { ConcessionManagement } from "@/components/Fees/Concession/ConcessionManagement"
import StudentFeesManagement from "@/components/Fees/StudentFee/StudentFeeManagement"
import { ReportGeneration } from "@/components/Fees/Reports/ReportGeneration"
import { useTranslation } from "@/redux/hooks/useTranslation"

export const Fees: React.FC = () => {
  const [activeTab, setActiveTab] = useState("fee-types")
  const {t} = useTranslation();

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const targetTab = (e as CustomEvent).detail
      if (targetTab) setActiveTab(targetTab)
    }
    window.addEventListener("switch-fees-tab", handleSwitchTab)
    return () => window.removeEventListener("switch-fees-tab", handleSwitchTab)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
          {/* <TabsTrigger value="dashboard">{t("dashboard")}</TabsTrigger> */}
          <TabsTrigger value="fee-types">{t("fee_types")}</TabsTrigger>
          <TabsTrigger value="fee-plans">{t("fee_plans")}</TabsTrigger>
          <TabsTrigger value="concessions">{t("concessions")}</TabsTrigger>
          <TabsTrigger value="student-fees">{t("student_fees")}</TabsTrigger>
          <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
        </TabsList>

        {/* <TabsContent value="dashboard">
          <FeeDashboard />
        </TabsContent> */}

        <TabsContent value="fee-types">
          <FeeTypeManagement />
        </TabsContent>

        <TabsContent value="fee-plans">
          <FeePlanManagement />
        </TabsContent>

        <TabsContent value="concessions">
          <ConcessionManagement />
        </TabsContent>

        <TabsContent value="student-fees">
          <StudentFeesManagement />
        </TabsContent>

        <TabsContent value="reports">
          <ReportGeneration />
        </TabsContent>    
      </Tabs>
    </div>
  )
}

