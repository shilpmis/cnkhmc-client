// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button";
// import { FileText, X } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Separator } from "@radix-ui/react-separator";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { ComponentType } from "react";
// import { StaffType } from "@/types/staff";

// interface StaffPdfDilogProps {
//     dialogOpen: boolean;
//     setDialogOpen: (open: boolean) => void;
//     selectedStaff: StaffType;
//     StafftDetailsPDF: ComponentType<any>;
//   }

//   const formatData = (value: any): string => {
//     return  value ? new Date(value).toISOString().split("T")[0] : " "
//   }
  
//   const StaffPdfDilog: React.FC<StaffPdfDilogProps> = ({ dialogOpen, setDialogOpen, selectedStaff, StafftDetailsPDF }) => {


//     return (
//      <>
//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//              <DialogContent className="max-w-4xl p-0 overflow-hidden">
//                <div className="flex justify-between items-center p-4 md:p-6 sticky top-0 bg-background z-10 border-b">
//                  <DialogTitle className="text-xl md:text-2xl font-bold">Staff Details</DialogTitle>
//                  <div className="flex items-center gap-2">
//                  {selectedStaff && (
//                      <TooltipProvider>
//                        <Tooltip>
//                          <TooltipTrigger asChild>
//                            <div>
//                              {typeof window !== "undefined" && (
//                                <PDFDownloadLink
//                                  document={<StafftDetailsPDF staff={selectedStaff} />}
//                                  fileName={`${selectedStaff.first_name}_${selectedStaff.last_name}_details.pdf`}
//                                >
//                                  {({ blob, url, loading, error }: { blob: Blob | null; url: string | null; loading: boolean; error: Error | null }) => (
//                                    <Button
//                                      variant="outline"
//                                      size="icon"
//                                      disabled={loading}
//                                      aria-label="Download PDF"
//                                    >
//                                      <FileText className="h-4 w-4" />
//                                    </Button>
//                                  )}
//                                </PDFDownloadLink>
//                              )}
//                            </div>
//                          </TooltipTrigger>
//                          <TooltipContent>
//                            <p>Download PDF</p>
//                          </TooltipContent>
//                        </Tooltip>
//                      </TooltipProvider>
//                    )}
//                    <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)} aria-label="Close">
//                      <X className="h-4 w-4" />
//                    </Button>
//                  </div>
//                </div>
     
//                <div className="max-h-[80vh] overflow-y-auto p-4 md:p-6">
//                  {selectedStaff && (
//                    <div className="space-y-6">
//                      {/* Staff Profile Section */}
//                      <div className="flex flex-col items-start justify-start">
//                        <div className="bg-primary/10 rounded-full p-6 mb-4 border-4 border-primary/20">
//                          {selectedStaff.gender.toLowerCase() === "male" ? (
//                           <img 
//                           src="https://img.freepik.com/premium-vector/man-professional-business-casual-young-avatar-icon-illustration_1277826-623.jpg?w=900"
//                           alt="Male Student"
//                           className="h-24 w-24 md:h-32 md:w-32 rounded-full"
//                         />
//                          ) : (
//                            <img 
//                            src="https://img.freepik.com/free-vector/woman-with-long-brown-hair-pink-shirt_90220-2940.jpg?t=st=1741346084~exp=1741349684~hmac=8fb79fbe2b8651184e68b2303365403937006e7dc31d5335f32abf58e7e2b083&w=900" // Replace with your male image path
//                            alt="Male Student"
//                            className="h-24 w-24 md:h-32 md:w-32 rounded-full"
//                          />
//                          )}
//                        </div>
//                        <h2 className="text-2xl md:text-3xl font-bold text-center">
//                          {selectedStaff.first_name} {selectedStaff.middle_name} {selectedStaff.last_name}
//                        </h2>
//                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
//                          <Badge variant="outline" className="text-sm">
//                            Id: {selectedStaff.id}
//                          </Badge>
//                          <Badge variant="outline" className="text-sm">
//                            Role: {selectedStaff.role}
//                          </Badge>
//                        </div>
//                      </div>
     
//                      <Separator />
     
//                      {/* Details Section */}
//                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                        {/* Basic Information */}
//                        <Card>
//                          <CardContent className="p-4 md:p-6">
//                            <h3 className="text-lg font-semibold mb-4 text-primary">Personal Information</h3>
//                            <div className="space-y-2">
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">First Name:</p>
//                                <p className="font-medium">{selectedStaff.first_name}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Middle Name:</p>
//                                <p className="font-medium">{selectedStaff.middle_name}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Last Name:</p>
//                                <p className="font-medium">{selectedStaff.last_name}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">First Name (Guj):</p>
//                                <p className="font-medium">{selectedStaff.first_name_in_guj}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">middle Name(Guj)</p>
//                                <p className="font-medium">{selectedStaff.middle_name_in_guj}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Last Name(Guj)</p>
//                                <p className="font-medium">{selectedStaff.last_name_in_guj}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Gender:</p>
//                                <p className="font-medium">{selectedStaff.gender}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Dob:</p>
//                                <p className="font-medium">{selectedStaff.birth_date ? formatData(selectedStaff.birth_date) : '-' }</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Place</p>
//                                <p className="font-medium">{selectedStaff.city}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">District</p>
//                                <p className="font-medium">{selectedStaff.district}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Adhar No:</p>
//                                <p className="font-medium">{selectedStaff.aadhar_no}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Adhar Dise No:</p>
//                                <p className="font-medium">{null}</p>
//                              </div>
//                            </div>
//                          </CardContent>
//                        </Card>
     
//                        {/* Contact Details */}
//                        <Card>
//                          <CardContent className="p-4 md:p-6">
//                            <h3 className="text-lg font-semibold mb-4 text-primary">Contact Details</h3>
//                            <div className="space-y-2">
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Mobile No:</p>
//                                <p className="font-medium">{selectedStaff.mobile_number}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Email:</p>
//                                <p className="font-medium">{selectedStaff.email}</p>
//                              </div>
//                            </div>
//                          </CardContent>
//                        </Card>
     
//                        {/* Other Information */}
//                        <Card>
//                          <CardContent className="p-4 md:p-6">
//                            <h3 className="text-lg font-semibold mb-4 text-primary">Other Information</h3>
//                            <div className="space-y-2">
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Religion:</p>
//                                <p className="font-medium">{selectedStaff.religion}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Religion(Guj):</p>
//                                <p className="font-medium">{selectedStaff.religion_in_guj}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Caste:</p>
//                                <p className="font-medium">{selectedStaff.caste}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Caste(Guj):</p>
//                                <p className="font-medium">{selectedStaff.caste_in_guj}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Category:</p>
//                                <p className="font-medium">{selectedStaff.category}</p>
//                              </div>
//                            </div>
//                          </CardContent>
//                        </Card>
     
//                         {/* Address Information */}
//                         <Card>
//                          <CardContent className="p-4 md:p-6">
//                            <h3 className="text-lg font-semibold mb-4 text-primary">Address Information</h3>
//                            <div className="space-y-2">
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Address:</p>
//                                <p className="font-medium">{selectedStaff.address}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">District:</p>
//                                <p className="font-medium">{selectedStaff.district}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">City:</p>
//                                <p className="font-medium">{selectedStaff.city}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">Postal Code:</p>
//                                <p className="font-medium">{selectedStaff.postal_code}</p>
//                              </div>
//                              <div className="grid grid-cols-2 gap-2">
//                                <p className="text-muted-foreground">State:</p>
//                                <p className="font-medium">{selectedStaff.state}</p>
//                              </div>
//                            </div>
//                          </CardContent>
//                        </Card>
     
//                        {/* bank Details */}
//                        <Card className="md:col-span-2">
//                          <CardContent className="p-4 md:p-6">
//                            <h3 className="text-lg font-semibold mb-4 text-primary">Bank Details</h3>
//                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                              <div className="space-y-2">
//                                <p className="text-muted-foreground">Bank Name:</p>
//                                <p className="font-medium">{selectedStaff.bank_name}</p>
//                              </div>
//                              <div className="space-y-2">
//                                <p className="text-muted-foreground">Account Name:</p>
//                                <p className="font-medium">{selectedStaff.account_no}</p>
//                              </div>
//                              <div className="space-y-2">
//                                <p className="text-muted-foreground">IFSC Code:</p>
//                                <p className="font-medium">{selectedStaff.IFSC_code}</p>
//                              </div>
//                            </div>
//                          </CardContent>
//                        </Card>
     
//                          {/* Employment Details */}
//                          <Card className="md:col-span-2">
//                          <CardContent className="p-4 md:p-6">
//                            <h3 className="text-lg font-semibold mb-4 text-primary">Employment Details</h3>
//                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                              <div className="space-y-2">
//                                <p className="text-muted-foreground">Joining Date:</p>
//                                <p className="font-medium">{selectedStaff.joining_date ? formatData(selectedStaff.joining_date) : '-' }</p>
//                              </div>
//                              <div className="space-y-2">
//                                <p className="text-muted-foreground">Employment Status:</p>
//                                <p className="font-medium">{selectedStaff.employment_status}</p>
//                              </div>
//                            </div>
//                          </CardContent>
//                        </Card>
//                      </div>
//                    </div>
//                  )}
//                </div>
//              </DialogContent>
//            </Dialog>
//      </>
//     );
//   }
  
//   export default StaffPdfDilog



"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, X, User, Phone, MapPin, Building, CreditCard } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import type { ComponentType } from "react"
import type { StaffType } from "@/types/staff"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface StaffDetailsDialogProps {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  selectedStaff: StaffType
  StaffDetailsPDF: ComponentType<any>
}

const StaffDetailsDialog: React.FC<StaffDetailsDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  selectedStaff,
  StaffDetailsPDF,
}) => {
  const { t } = useTranslation()
  const [pdfKey, setPdfKey] = useState(Date.now())

  const formatData = useCallback((value: any): string => {
    if (!value) return "N/A"
    if (value instanceof Date || typeof value === "string") {
      try {
        return new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      } catch {
        return value.toString()
      }
    }
    return value.toString()
  }, [])

  const getDisplayValue = useCallback((value: any): string => {
    return value || "N/A"
  }, [])

  const handlePDFDownload = useCallback(() => {
    // Force re-render of PDFDownloadLink by updating key
    setTimeout(() => setPdfKey(Date.now()), 100)
  }, [])

  if (!selectedStaff) return null

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <DialogTitle className="text-2xl font-bold text-gray-900">{t("staff_details")}</DialogTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    {typeof window !== "undefined" && (
                      <PDFDownloadLink
                        key={pdfKey}
                        document={<StaffDetailsPDF staff={selectedStaff} />}
                        fileName={`${selectedStaff.first_name}_${selectedStaff.last_name}_details.pdf`}
                      >
                        {({ loading }) => (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={handlePDFDownload}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {loading ? t("generating") : t("download_pdf")}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("download_staff_details_pdf")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Profile Header */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage
                      src={
                        selectedStaff.gender?.toLowerCase() === "male"
                          ? "https://img.freepik.com/premium-vector/man-professional-business-casual-young-avatar-icon-illustration_1277826-623.jpg"
                          : "https://img.freepik.com/free-vector/woman-with-long-brown-hair-pink-shirt_90220-2940.jpg"
                      }
                      alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                    />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {selectedStaff.first_name?.[0]}
                      {selectedStaff.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {getDisplayValue(selectedStaff.first_name)} {getDisplayValue(selectedStaff.middle_name)}{" "}
                        {getDisplayValue(selectedStaff.last_name)}
                      </h2>
                      <p className="text-lg text-gray-600 mt-1">
                        {getDisplayValue(selectedStaff.first_name_in_guj)}{" "}
                        {getDisplayValue(selectedStaff.middle_name_in_guj)}{" "}
                        {getDisplayValue(selectedStaff.last_name_in_guj)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="text-sm">
                        {t("id")}: {selectedStaff.id}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        {t("role")}: {getDisplayValue(selectedStaff.role)}
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {getDisplayValue(selectedStaff.gender)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    {t("personal_information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("date_of_birth")}</p>
                      <p className="text-sm text-gray-900">{formatData(selectedStaff.birth_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("place")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.city)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("aadhar_number")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.aadhar_no)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("district")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.district)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("religion")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.religion)}</p>
                      <p className="text-xs text-gray-500">{getDisplayValue(selectedStaff.religion_in_guj)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("caste")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.caste)}</p>
                      <p className="text-xs text-gray-500">{getDisplayValue(selectedStaff.caste_in_guj)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("category")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.category)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5 text-primary" />
                    {t("contact_information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("mobile_number")}</p>
                    <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.mobile_number)}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("email_address")}</p>
                    <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.email)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("address_information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("address")}</p>
                    <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.address)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("city")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.city)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("district")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.district)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("state")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.state)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("postal_code")}</p>
                      <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.postal_code)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5 text-primary" />
                    {t("employment_details")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("joining_date")}</p>
                      <p className="text-sm text-gray-900">{formatData(selectedStaff.joining_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("employment_status")}</p>
                      <Badge variant="outline" className="text-xs">
                        {getDisplayValue(selectedStaff.employment_status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bank Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {t("bank_details")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("bank_name")}</p>
                    <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.bank_name)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("account_number")}</p>
                    <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.account_no)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("ifsc_code")}</p>
                    <p className="text-sm text-gray-900">{getDisplayValue(selectedStaff.IFSC_code)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StaffDetailsDialog
