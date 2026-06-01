import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Eye, Loader2 } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AdmissionInquiryForm from "./AdmissionInquiryForm"
import { format } from "date-fns"
import { Inquiry, useGetInquiriesQuery } from "@/services/InquiryServices"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { useGetQuotasQuery } from "@/services/QuotaService"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"

interface RecentInquiriesProps {
  academicSessionId: number | null
}

export const RecentInquiries: React.FC<RecentInquiriesProps> = ({ academicSessionId }) => {
  const { t } = useTranslation()
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const AcademicClassForSchool = useAppSelector(selectAcademicClasses)
  const CurrentacademicSessions = useAppSelector(selectActiveAccademicSessionsForSchool)

  const { data: quotas, isLoading: isLoadingQuotas } = useGetQuotasQuery({
      academic_session_id: CurrentacademicSessions!.id,
  })
  // Fetch recent inquiries
  const {
    data: inquiries,
    isLoading,
    refetch,
  } = useGetInquiriesQuery(
     { 
       academic_session_id: CurrentacademicSessions!.id,
       page: 1 } ,
  )

  // Refetch when academic session changes
  useEffect(() => {
    if (academicSessionId) {
      refetch()
    }
  }, [academicSessionId, refetch])

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500"
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "waitlisted":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  // Handle view inquiry
  const handleViewInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry)
    setIsViewDialogOpen(true)
  }

  // Handle edit inquiry
  const handleEditInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry)
    setIsEditDialogOpen(true)
  }

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    refetch()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("recent_inquiries")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : inquiries && inquiries.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("class")}</TableHead>
                    <TableHead>{t("contact")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.data.map((inquiry: any) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="font-medium">
                        {inquiry.first_name} {inquiry.middle_name} {inquiry.last_name}
                      </TableCell>
                      <TableCell>{inquiry.class_name || `Class ${inquiry.inquiry_for_class}`}</TableCell>
                      <TableCell>{inquiry.primary_mobile}</TableCell>
                      <TableCell>{formatDate(inquiry.created_at)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(inquiry.status || "pending")}>
                          {inquiry.status || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewInquiry(inquiry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditInquiry(inquiry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t("no_recent_inquiries_found")}</div>
          )}
        </CardContent>
      </Card>

      {/* View Inquiry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("inquiry_details")}</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{t("student_information")}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("full_name")}</p>
                    <p className="font-medium">
                      {selectedInquiry.first_name} {selectedInquiry.middle_name} {selectedInquiry.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("date_of_birth")}</p>
                    <p className="font-medium">{formatDate(selectedInquiry.birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("gender")}</p>
                    <p className="font-medium">{selectedInquiry.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("inquiry_for_class")}</p>
                    <p className="font-medium">
                      {`Class ${AcademicClassForSchool!.find((classItem) => classItem.id === selectedInquiry.inquiry_for_class)?.class}`}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">{t("contact_information")}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("parent_name")}</p>
                    <p className="font-medium">{selectedInquiry.father_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contact_number")}</p>
                    <p className="font-medium">{selectedInquiry.primary_mobile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("email")}</p>
                    <p className="font-medium">{selectedInquiry.parent_email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("address")}</p>
                    <p className="font-medium">{selectedInquiry.address}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">{t("previous_education")}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("previous_school")}</p>
                    <p className="font-medium">{selectedInquiry.previous_school || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("previous_class")}</p>
                    <p className="font-medium">{selectedInquiry.previous_class || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("percentage")}</p>
                    <p className="font-medium">{selectedInquiry.previous_percentage || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("special_achievements")}</p>
                    <p className="font-medium">{selectedInquiry.special_achievements || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">{t("quota_information")}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("applying_for_quota")}</p>
                    <p className="font-medium">{selectedInquiry.applying_for_quota ? t("yes") : t("no")}</p>
                  </div>
                  {selectedInquiry.applying_for_quota && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("quota_type")}</p>
                      <p className="font-medium">{
                        quotas?.find((quote) => quote.id === selectedInquiry.quota_type)?.name ||
                        `Can not able to load quota`
                      }</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{t("status")}</p>
                    <Badge className={getStatusBadgeColor(selectedInquiry.status || "pending")}>
                      {selectedInquiry.status || "Pending"}
                    </Badge>
                  </div>
                  {/* <div>
                    <p className="text-sm text-muted-foreground">{t("inquiry_date")}</p>
                    <p className="font-medium">{formatDate(selectedInquiry.created_at)}</p>
                  </div> */}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Inquiry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("edit_inquiry")}</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <AdmissionInquiryForm
              isEditing={true}
              inquiryId={selectedInquiry.id}
              initialData={{
                id: selectedInquiry.id,
                first_name: selectedInquiry.first_name,
                middle_name: selectedInquiry.middle_name || "",
                last_name: selectedInquiry.last_name,
                birth_date: selectedInquiry.birth_date,
                gender: selectedInquiry.gender,
                inquiry_for_class: selectedInquiry.inquiry_for_class,
                father_name: selectedInquiry.father_name,
                primary_mobile: selectedInquiry.primary_mobile,
                parent_email: selectedInquiry.parent_email || "",
                address: selectedInquiry.address,
                previous_school: selectedInquiry.previous_school || "",
                previous_class: selectedInquiry.previous_class || "",
                previous_percentage: selectedInquiry.previous_percentage || "",
                previous_year: selectedInquiry.previous_year || "",
                special_achievements: selectedInquiry.special_achievements || "",
                applying_for_quota: selectedInquiry.applying_for_quota,
                quota_type: selectedInquiry.quota_type,
                academic_session_id: selectedInquiry.academic_session_id,
              }}
              academicSessionId={selectedInquiry.academic_session_id}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

