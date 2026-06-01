"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useTranslation } from "@/redux/hooks/useTranslation"
import StaffProfileView from "@/components/Staff/StaffProfileView"
import type { StaffType } from "@/types/staff"
import { useLazyGetStaffByIdQuery } from '@/services/StaffService';

export default function StaffProfilePage() {
  const { t } = useTranslation()
  const params = useParams()
  const navigate = useNavigate()
  const [staff, setStaff] = useState<StaffType | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Use RTK Query hook for fetching staff details
  const [fetchStaffDetails, { isLoading, isError }] = useLazyGetStaffByIdQuery()
  const currentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  useEffect(() => {
    const fetchStaff = async () => {
      if (!params.id) return

      try {
        // Fetch detailed staff information by ID
        const response = await fetchStaffDetails(Number(params.id)).unwrap()

        if (response) {
          setStaff(response)
          console.log("Staff data fetched successfully:", response)
        } else {
          setError("Staff not found")
        }
      } catch (err) {
        console.error("Error fetching staff details:", err)
        setError("Failed to load staff details. Please try again.")
      }
    }

    fetchStaff()
  }, [params.id, fetchStaffDetails])

  const handleBack = () => {
    navigate(-1)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-screen">
        <div className="space-y-4 text-center">
          <div className="h-16 w-16 mx-auto bg-muted/50 animate-pulse rounded-full"></div>
          <p>{t("loading_staff_profile")}...</p>
        </div>
      </div>
    )
  }

  if (error || isError) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <div className="p-6 text-center">
          <p className="text-destructive">{error || "An error occurred while loading staff details."}</p>
          <Button onClick={handleBack} className="mt-4">
            {t("return_to_search")}
          </Button>
        </div>
      </div>
    )
  }

  return staff ? <StaffProfileView staff={staff} onBack={handleBack} showToolBar={true} /> : null
}
