import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/redux/hooks/useTranslation";
import { useGetHostelsQuery, useAllocateBedMutation } from "@/services/HostelService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface HostelAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  schoolId?: number;
  studentGender?: string;
  onSuccess?: () => void;
}

export default function HostelAllotmentModal({
  isOpen,
  onClose,
  studentId,
  schoolId,
  studentGender,
  onSuccess,
}: HostelAllotmentModalProps) {
  const { t } = useTranslation();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const effectiveSchoolId = schoolId || authUser?.school_id;
  
  const { data: hostels, isLoading: isLoadingHostels, refetch } = useGetHostelsQuery(
    { school_id: effectiveSchoolId as number },
    { skip: !isOpen || !effectiveSchoolId, refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (isOpen && effectiveSchoolId) {
      refetch();
    }
  }, [isOpen, effectiveSchoolId, refetch]);

  const [allocateBed, { isLoading: isAllocating }] = useAllocateBedMutation();

  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);

  // Normalize and filter hostels based on gender if available
  const availableHostels = useMemo(() => {
    if (!hostels || !Array.isArray(hostels)) return [];
    if (!studentGender) return hostels;
    
    const normalizedGender = String(studentGender).trim().toLowerCase();
    const isMale = normalizedGender === 'male' || normalizedGender === 'm' || normalizedGender === 'boy';
    const isFemale = normalizedGender === 'female' || normalizedGender === 'f' || normalizedGender === 'girl';

    const genderMatched = hostels.filter((h: any) => {
      const type = String(h.type || '').toLowerCase();
      if (isMale && (type === 'boys' || type === 'boy' || type === 'co-ed')) return true;
      if (isFemale && (type === 'girls' || type === 'girl' || type === 'co-ed')) return true;
      if (type === 'co-ed') return true;
      return false;
    });

    // If matching hostels found, return them. If none match the strict gender (e.g. only Boys hostel exists), fallback to all hostels so user is not blocked
    return genderMatched.length > 0 ? genderMatched : hostels;
  }, [hostels, studentGender]);

  const selectedHostel = useMemo(() => {
    return hostels?.find((h: any) => h.id === selectedHostelId);
  }, [hostels, selectedHostelId]);

  const selectedRoom = useMemo(() => {
    return selectedHostel?.rooms?.find((r: any) => r.id === selectedRoomId);
  }, [selectedHostel, selectedRoomId]);

  const availableBeds = useMemo(() => {
    return selectedRoom?.beds?.filter((b: any) => b.status === "Available") || [];
  }, [selectedRoom]);

  const handleAllotment = async () => {
    if (!selectedBedId || !studentId) {
      toast({ title: t("error"), description: t("please_select_a_bed"), variant: "destructive" });
      return;
    }

    try {
      await allocateBed({
        student_id: studentId,
        bed_id: selectedBedId,
        allocation_date: format(new Date(), "yyyy-MM-dd"),
      }).unwrap();

      toast({ title: t("success"), description: t("hostel_allotted_successfully") });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error: any) {
      toast({ 
        title: t("error"), 
        description: error.data?.message || t("failed_to_allot_hostel"), 
        variant: "destructive" 
      });
    }
  };

  const handleClose = () => {
    setSelectedHostelId(null);
    setSelectedRoomId(null);
    setSelectedBedId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("allot_hostel")}</DialogTitle>
          <DialogDescription>
            {t("select_hostel_room_and_bed_for_the_student")}
          </DialogDescription>
        </DialogHeader>

        {isLoadingHostels ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("hostel")}</label>
              <Select 
                value={selectedHostelId?.toString() || ""} 
                onValueChange={(val) => {
                  setSelectedHostelId(parseInt(val));
                  setSelectedRoomId(null);
                  setSelectedBedId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_hostel")} />
                </SelectTrigger>
                <SelectContent>
                  {availableHostels.map((h: any) => (
                    <SelectItem key={h.id} value={h.id.toString()}>
                      {h.name} ({h.type})
                    </SelectItem>
                  ))}
                  {availableHostels.length === 0 && (
                    <SelectItem value="none" disabled>
                      {t("no_hostels_available")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("room")}</label>
              <Select 
                disabled={!selectedHostelId}
                value={selectedRoomId?.toString() || ""} 
                onValueChange={(val) => {
                  setSelectedRoomId(parseInt(val));
                  setSelectedBedId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_room")} />
                </SelectTrigger>
                <SelectContent>
                  {selectedHostel?.rooms?.map((r: any) => {
                    const availableCount = r.beds?.filter((b:any) => b.status === "Available").length || 0;
                    return (
                      <SelectItem key={r.id} value={r.id.toString()} disabled={availableCount === 0}>
                        {t("room")} {r.roomNumber} - {availableCount} {t("beds_available")}
                      </SelectItem>
                    );
                  })}
                  {(!selectedHostel?.rooms || selectedHostel.rooms.length === 0) && (
                    <SelectItem value="none" disabled>
                      {t("no_rooms_available")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("bed")}</label>
              <Select 
                disabled={!selectedRoomId}
                value={selectedBedId?.toString() || ""} 
                onValueChange={(val) => setSelectedBedId(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_bed")} />
                </SelectTrigger>
                <SelectContent>
                  {availableBeds.map((b: any) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.bedNumber}
                    </SelectItem>
                  ))}
                  {availableBeds.length === 0 && (
                    <SelectItem value="none" disabled>
                      {t("no_beds_available")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAllocating}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAllotment} disabled={!selectedBedId || isAllocating}>
            {isAllocating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("allot_bed")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
