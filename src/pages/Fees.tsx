import type React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeePlanManagement } from "@/components/Fees/FeePlan/FeePlanManagement"
import StudentStatementReportTab from "@/components/Fees/Reports/StudentStatementReportTab"
import { Layers, FileText, ShieldCheck, Plus, ReceiptText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export const Fees: React.FC = () => {
  const [activeTab, setActiveTab] = useState("templates")
  const navigate = useNavigate()

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const targetTab = (e as CustomEvent).detail
      if (targetTab === "fee-plans" || targetTab === "templates") {
        setActiveTab("templates")
      } else if (
        targetTab === "student-fees" ||
        targetTab === "tracking" ||
        targetTab === "reports"
      ) {
        setActiveTab("tracking")
      }
    }
    window.addEventListener("switch-fees-tab", handleSwitchTab)
    return () => window.removeEventListener("switch-fees-tab", handleSwitchTab)
  }, [])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Fee Plans & Cohort Management
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Cohort Grandfathering Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Standardize quota-based fee structures by academic enrollment cohort with permanent lock-in protection and real-time financial tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate("/d/fee-receipts")}
            className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-300 text-xs sm:text-sm font-medium"
          >
            <ReceiptText className="mr-1.5 h-4 w-4 text-emerald-600" /> Fee Receipts Desk <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              setActiveTab("templates")
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("open-create-fee-template"))
              }, 50)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm text-xs sm:text-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Fee Plan
          </Button>
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 max-w-md h-11 bg-slate-100 p-1 border">
          <TabsTrigger value="templates" className="flex items-center gap-2 font-medium text-xs sm:text-sm">
            <Layers className="h-4 w-4 text-blue-600" />
            Fee Plans & Structures
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2 font-medium text-xs sm:text-sm">
            <FileText className="h-4 w-4 text-emerald-600" />
            Financial Tracking & Ledgers
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Template Management */}
        <TabsContent value="templates" className="mt-6 focus-visible:outline-none">
          <FeePlanManagement />
        </TabsContent>

        {/* Tab 2: Financial Tracking & Statements */}
        <TabsContent value="tracking" className="mt-6 focus-visible:outline-none">
          <StudentStatementReportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Fees
