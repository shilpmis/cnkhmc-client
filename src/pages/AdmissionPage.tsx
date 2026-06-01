// "use client"

// import { useEffect, useState } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import type { AdmissionTrend, DashboardData } from "@/mock/admissionMockData"
// import { AdmissionDashboard } from "@/components/Admission/AdmissionDashboard"
// import { QuickInquiryForm } from "@/components/Admission/QuickInquiryForm"
// import { Link } from "react-router-dom"
// import AdmissionInquiryForm from "@/components/Admission/AdmissionInquiryForm"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import InquiryList from "@/components/Admission/InquiryList"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { useAppSelector } from "@/redux/hooks/useAppSelector"
// import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

// export default function AdminAdmissonView() {
//   const [isQuickInquiryOpen, setIsQuickInquiryOpen] = useState(false)
//   const [isInquiryOpen, setIsInquiryOpen] = useState(false)
//   const CurrentacademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)
//   const { t } = useTranslation()
  
//   return (
//     <div className="container mx-auto py-10">
//       <div className="flex flex-col space-y-6">
//         <div className="flex justify-between items-center gap-4">
//           <h1 className="text-xl font-bold tracking-tight">{t("admission_dashboard")}</h1>
//           <div className="flex gap-4">
//             {/* <Link to="/d/admissions/inquiry">
//               <Button size="lg">{t("view_all_admission_inquiries")}</Button>
//             </Link> */}
//             {/* <Button onClick={() => setIsQuickInquiryOpen(true)}>{t("add_quick_inquiry")}</Button> */}
//             <Button onClick={() => setIsInquiryOpen(true)}>{t("add_admission_inquiry")}</Button>
//           </div>
//         </div>

//         {/* Inquiry Modal - Using Dialog component instead of custom modal */}
//         <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
//           <DialogContent className="max-w-3xl h-[80vh] w-auto overflow-auto">
//             <DialogHeader>
//               <DialogTitle>{t("add_admission_inquiry")}</DialogTitle>
//               <DialogDescription>{t("please_fill_out_this_form_to_submit_an_admission_inquiry")}</DialogDescription>
//             </DialogHeader>
//               <AdmissionInquiryForm
//                 onSuccess={() => setIsInquiryOpen(false)}
//                 onCancel={() => setIsInquiryOpen(false)}
//                 academicSessionId={CurrentacademicSessions!.id}
//               />
//           </DialogContent>
//         </Dialog>

//         {/* Tabs Section */}
//         <Tabs defaultValue="overview" className="space-y-4">
//           <TabsList>
//             <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
//             <TabsTrigger value="inquiries">{t("recent_inquiries")}</TabsTrigger>
//             {/* <TabsTrigger value="quotas">{t("quota_distribution")}</TabsTrigger> */}
//           </TabsList>

//           <TabsContent value="overview" className="space-y-4">
//             {/* Remove the data and trends props */}
//             <AdmissionDashboard/>
//           </TabsContent>

//           <TabsContent value="inquiries" className="space-y-4">
//             <Card>
//               <CardHeader>
//                 <CardTitle>{t("recent_admission_inquiries")}</CardTitle>
//                 <CardDescription>{t("manage_and_process_admission_inquiries")}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <InquiryList />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* <TabsContent value="quotas" className="space-y-4">
//             <Card>
//               <CardHeader>
//                 <CardTitle>{t("quota_distribution")}</CardTitle>
//                 <CardDescription>{t("current_allocation_of_seats_across_different_quotas")}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-[400px] flex items-center justify-center">
//                   <p className="text-muted-foreground">
//                     {t("quota_distribution_visualization_will_be_displayed_here")}
//                   </p>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent> */}
//         </Tabs>
//       </div>

//       <QuickInquiryForm
//       academicSessionId={CurrentacademicSessions!.id} 
//       isOpen={isQuickInquiryOpen} 
//       onClose={() => setIsQuickInquiryOpen(false)} />
//     </div>
//   )
// }



"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AdmissionDashboard } from "@/components/Admission/AdmissionDashboard"
import { QuickInquiryForm } from "@/components/Admission/QuickInquiryForm"
import AdmissionInquiryForm from "@/components/Admission/AdmissionInquiryForm"
import { useTranslation } from "@/redux/hooks/useTranslation"
import InquiryList from "@/components/Admission/InquiryList"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

export default function AdminAdmissonView() {
  const [isQuickInquiryOpen, setIsQuickInquiryOpen] = useState(false)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const CurrentacademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)
  const { t } = useTranslation()

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">{t("admission_dashboard")}</h1>
          <div className="flex gap-4">
            <Button onClick={() => setIsInquiryOpen(true)}>{t("add_admission_inquiry")}</Button>
          </div>
        </div>

        {/* Inquiry Modal - Using Dialog component instead of custom modal */}
        <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
          <DialogContent className="max-w-3xl h-[80vh] w-auto overflow-auto">
            <DialogHeader>
              <DialogTitle>{t("add_admission_inquiry")}</DialogTitle>
              <DialogDescription>{t("please_fill_out_this_form_to_submit_an_admission_inquiry")}</DialogDescription>
            </DialogHeader>
            <AdmissionInquiryForm
              onSuccess={() => setIsInquiryOpen(false)}
              onCancel={() => setIsInquiryOpen(false)}
              academicSessionId={CurrentacademicSessions!.id}
            />
          </DialogContent>
        </Dialog>

        {/* Tabs Section - Default to inquiries */}
        <Tabs defaultValue="inquiries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inquiries">{t("admission_inquiries")}</TabsTrigger>
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("admission_inquiries")}</CardTitle>
                <CardDescription>{t("manage_and_process_admission_inquiries")}</CardDescription>
              </CardHeader>
              <CardContent>
                <InquiryList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <AdmissionDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <QuickInquiryForm
        academicSessionId={CurrentacademicSessions!.id}
        isOpen={isQuickInquiryOpen}
        onClose={() => setIsQuickInquiryOpen(false)}
      />
    </div>
  )
}
