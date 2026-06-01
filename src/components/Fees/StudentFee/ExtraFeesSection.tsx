"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, AlertCircle } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useGetAllFeesTypeQuery } from "@/services/feesService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import ApplyExtraFeesDialog from "./ApplyExtraFeesDialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ExtraFeesAppliedToStudent } from "@/types/fees"

interface ExtraFeesSectionProps {
  studentId: number
  feesPlanId: number
  extraFees: ExtraFeesAppliedToStudent[]
  onRefresh: () => void
}

const ExtraFeesSection: React.FC<ExtraFeesSectionProps> = ({ studentId, feesPlanId, extraFees, onRefresh }) => {
  const { t } = useTranslation()
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [selectedExtraFee, setSelectedExtraFee] = useState<ExtraFeesAppliedToStudent | null>(null)

  const { data: feeTypes } = useGetAllFeesTypeQuery(
    { academic_session_id: currentAcademicSession?.id || 0, applicable_to: "All" },
    { skip: !currentAcademicSession },
  )

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0.00"
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Get fee type name from ID
  const getFeeTypeName = (feeTypeId: number): string => {
    if (!feeTypeId) return t("unknown_fee_type")

    if (feeTypes && feeTypes.length > 0) {
      const feeType = feeTypes.find((type) => type.id === feeTypeId)
      if (feeType) {
        return feeType.name
      }
    }

    return `${t("fee_type")} ${feeTypeId}`
  }

  // Calculate payment progress percentage
  const calculatePaymentProgress = (extraFee: ExtraFeesAppliedToStudent) => {
    const totalAmount = Number(extraFee.total_amount || 0)
    if (totalAmount === 0) return 0

    const paidAmount = Number(extraFee.paid_amount || 0)
    return Math.round((paidAmount / totalAmount) * 100)
  }

  // View extra fee details
  const handleViewDetails = (extraFee: ExtraFeesAppliedToStudent) => {
    setSelectedExtraFee(extraFee)
    // TODO: Implement view details dialog
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("extra_fees")}</CardTitle>
          {/* <Button onClick={() => setIsApplyDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> {t("apply_extra_fees")}
          </Button> */}
        </CardHeader>
        <CardContent className="p-0">
          {extraFees.length === 0 ? (
            <div className="p-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("no_extra_fees")}</AlertTitle>
                <AlertDescription>{t("no_extra_fees_have_been_applied_to_this_student_yet")}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fee_type")}</TableHead>
                  <TableHead>{t("total_amount")}</TableHead>
                  <TableHead>{t("paid_amount")}</TableHead>
                  <TableHead>{t("remaining")}</TableHead>
                  <TableHead>{t("installments")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extraFees.map((extraFee) => {
                  const paymentProgress = calculatePaymentProgress(extraFee)
                  const remainingAmount = Number(extraFee.total_amount || 0) - Number(extraFee.paid_amount || 0)

                  return (
                    <TableRow key={extraFee.id}>
                      <TableCell className="font-medium">{getFeeTypeName(extraFee.fees_type_id)}</TableCell>
                      <TableCell>{formatCurrency(extraFee.total_amount)}</TableCell>
                      <TableCell>{formatCurrency(extraFee.paid_amount)}</TableCell>
                      <TableCell>{formatCurrency(remainingAmount)}</TableCell>
                      <TableCell>{extraFee.installment_breakdown?.length || 0}</TableCell>
                      <TableCell>
                        <Badge variant={extraFee.status === "Active" ? "default" : "secondary"}>
                          {extraFee.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {paymentProgress}% {t("paid")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(extraFee)}>
                          <Eye className="mr-1 h-3 w-3" /> {t("view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ApplyExtraFeesDialog
        enrolled_academic_session_id={currentAcademicSession?.id || 0}
        isOpen={isApplyDialogOpen}
        onClose={() => setIsApplyDialogOpen(false)}
        onSuccess={onRefresh}
        studentId={studentId}
        feesPlanId={feesPlanId}
      />
    </>
  )
}

export default ExtraFeesSection
