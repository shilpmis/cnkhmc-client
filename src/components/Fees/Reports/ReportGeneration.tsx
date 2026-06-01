
import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BarChart3 } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import InstallmentWiseReport from "./InstallmentWiseReport"

export const ReportGeneration: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("installment-wise")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("fees_reports")}</h1>
          <p className="text-muted-foreground mt-1">{t("generate_and_export_comprehensive_fees_reports")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("report_generation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="installment-wise" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("installment_wise_report")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="installment-wise" className="mt-6">
              <InstallmentWiseReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportGeneration
