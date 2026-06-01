// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { FeeDashboard } from "./Dashboard/FeeDashboard"
// import { FeeTypeManagement } from "./FeeType/FeeTypeManagement"
// import { FeePlanManagement } from "./FeePlan/FeePlanManagement"
// import { ConcessionManagement } from "./Concession/ConcessionManagement"
// import { StudentFeeManagement } from "./StudentFee/StudentFeeManagement"
// import { ReportGeneration } from "./Reports/ReportGeneration"

// export const FeeManagementLayout: React.FC = () => {
//   const [activeTab, setActiveTab] = useState("dashboard")

//   return (
//     <div className="container mx-auto p-4">
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
//           <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
//           <TabsTrigger value="fee-types">Fee Types</TabsTrigger>
//           <TabsTrigger value="fee-plans">Fee Plans</TabsTrigger>
//           <TabsTrigger value="concessions">Concessions</TabsTrigger>
//           <TabsTrigger value="student-fees">Student Fees</TabsTrigger>
//           <TabsTrigger value="reports">Reports</TabsTrigger>
//         </TabsList>

//         <TabsContent value="dashboard">
//           <FeeDashboard />
//         </TabsContent>

//         <TabsContent value="fee-types">
//           <FeeTypeManagement />
//         </TabsContent>

//         <TabsContent value="fee-plans">
//           <FeePlanManagement />
//         </TabsContent>

//         <TabsContent value="concessions">
//           <ConcessionManagement />
//         </TabsContent>

//         <TabsContent value="student-fees">
//           <StudentFeeManagement />
//         </TabsContent>

//         <TabsContent value="reports">
//           <ReportGeneration />
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }

