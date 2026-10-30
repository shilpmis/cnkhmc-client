"use client";

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import Header from "./Components/Header";
import { Outlet, useNavigate } from "react-router-dom";
import { selectVerificationStatus, selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice";
import { Toaster } from "@/components/ui/toaster";
import AppSidebar from "./Components/Appsidebar";
import { useLazyGetAcademicCalendarSettingsQuery } from "@/services/AcademicCalendarService";
import { hydrateAcademicCalendar } from "@/redux/slices/academicCalendarSlice";
import { useAppDispatch } from "@/redux/hooks/useAppDispatch";
import { useGetSchoolQuery } from "@/services/SchoolServices";
import { useCreateAcademicSessionMutation, useGetAcademicSessionsQuery } from "@/services/AcademicService";
import { updateUserSchool, selectCurrentUser, selectCurrentSchool } from "@/redux/slices/authSlice";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { useAppSelector } from "@/redux/hooks/useAppSelector";
import { AcademicSessionForm } from "@/components/Settings/AcademicSettings/AcademicSessionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminLayout() {
  const verificationStatus = useAppSelector(selectVerificationStatus);
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool);
  const navigate = useNavigate();
  const [showAcademicSessionForm, setShowAcademicSessionForm] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const currentSchool = useAppSelector(selectCurrentSchool);

  // Auto-fetch/refresh school context if we have an ID but data is missing or mismatched (important for Super Admin switching)
  const { data: schoolDetail, isLoading: isLoadingSchool } = useGetSchoolQuery(user?.school_id as number, { 
    skip: !user?.school_id || (
      !!user?.school && 
      Number(user.school.id) === Number(user.school_id) && 
      (user.school.academicSessions?.length || 0) > 0 && 
      !verificationStatus.isVerificationInProgress
    ) 
  });

  const [getAcademicCalendarSettings] = useLazyGetAcademicCalendarSettingsQuery();

  // Load the shared academic sessions from the server (the query stores them for the header and selectors).
  const { refetch: refetchAcademicSessions } = useGetAcademicSessionsQuery(user?.school_id as number, {
    skip: !user?.school_id || !verificationStatus.isAuthenticated,
  });
  const [createAcademicSession] = useCreateAcademicSessionMutation();

  // One-time upload of sessions that older versions kept only in this browser's localStorage.
  useEffect(() => {
    if (!user?.school_id || !verificationStatus.isAuthenticated) return;
    let legacy: any[] = [];
    try {
      const raw = localStorage.getItem("custom_academic_years");
      legacy = raw ? JSON.parse(raw) : [];
    } catch {
      return;
    }
    if (!Array.isArray(legacy) || legacy.length === 0) {
      try { localStorage.removeItem("custom_academic_years"); } catch { /* ignore */ }
      return;
    }
    (async () => {
      for (const s of legacy) {
        try {
          await createAcademicSession({
            school_id: user.school_id,
            start_year: String(s.start_year),
            end_year: String(s.end_year),
            start_month: s.start_month,
            end_month: s.end_month,
          }).unwrap();
        } catch (error: any) {
          // 409 means the session already exists on the server, which is fine.
          if (error?.status !== 409) return; // keep the local copy and retry on the next load
        }
      }
      try { localStorage.removeItem("custom_academic_years"); } catch { /* ignore */ }
      refetchAcademicSessions();
    })();
  }, [user?.school_id, verificationStatus.isAuthenticated, createAcademicSession, refetchAcademicSessions]);

  useEffect(() => {
    // Only update if we got data and it matches our intended school_id
    if (schoolDetail && Number(schoolDetail.id) === Number(user?.school_id)) {
      dispatch(updateUserSchool(schoolDetail));
    }
  }, [schoolDetail, dispatch, user?.school_id]);

  useEffect(() => {
    if (!verificationStatus.isAuthenticated && !verificationStatus.isVerificationInProgress) {
      navigate("/");
    }
  }, [verificationStatus, navigate]);

  useEffect(() => {
    if (!verificationStatus.isAuthenticated) return;
    if (!currentAcademicSession?.id) return;

    getAcademicCalendarSettings({ academic_session_id: currentAcademicSession.id })
      .unwrap()
      .then((data) => {
        dispatch(
          hydrateAcademicCalendar({
            nonWorkingDates: data.non_working_dates || [],
            isSaturdayWorking: data.is_saturday_working ?? true,
          }),
        )
      })
      .catch(() => {
        // Silently fail or use defaults if backend settings aren't authorized/available yet
        dispatch(
          hydrateAcademicCalendar({
            nonWorkingDates: [],
            isSaturdayWorking: true,
          }),
        )
      })
  }, [currentAcademicSession?.id, dispatch, getAcademicCalendarSettings, verificationStatus.isAuthenticated]);

  const handleCloseWarningDialog = () => {
    // Close the dialog
    setShowAcademicSessionForm(false);
  };

  return (
    <>
      {/* Deprecated academic session modal */}
      <Dialog open={showAcademicSessionForm} onOpenChange={setShowAcademicSessionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Session</DialogTitle>
          </DialogHeader>
          <AcademicSessionForm onSuccess={() => setShowAcademicSessionForm(false)} />
        </DialogContent>
      </Dialog>
      {verificationStatus.isVerificationInProgress && <div>Loading for dashboard ....</div>}
      {verificationStatus.isAuthenticated && (
        <SidebarProvider defaultOpen={true}>
          <SidebarContent />
        </SidebarProvider>
      )}
    </>
  );
}

function SidebarContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <AppSidebar isCollapsed={isCollapsed} />
      <main className="w-full">
        <Header />
        <div className="p-3 w-full h-auto mt-6">
          <Outlet />
        </div>
        <Toaster />
      </main>
    </>
  );
}
