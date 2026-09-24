import React, { useState, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Loader2, 
  Home, 
  Trash2, 
  User, 
  Building2, 
  Bed, 
  Layers, 
  DoorOpen, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Info
} from "lucide-react";
import { RootState } from "@/redux/store";
import {
  useGetHostelsQuery,
  useCreateHostelMutation,
  useCreateHostelRoomMutation,
  useDeleteHostelMutation,
} from "@/services/HostelService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoomItem {
  id: string;
  roomNumber: string;
  beds: number;
}

interface FloorItem {
  floorIndex: number;
  floorName: string;
  rooms: RoomItem[];
}

const getStandardFloorName = (index: number) => {
  if (index === 0) return "Ground Floor";
  const j = index % 10;
  const k = index % 100;
  if (j === 1 && k !== 11) return `${index}st Floor`;
  if (j === 2 && k !== 12) return `${index}nd Floor`;
  if (j === 3 && k !== 13) return `${index}rd Floor`;
  return `${index}th Floor`;
};

const createDefaultRooms = (floorIndex: number, roomCount: number, defaultBeds: number): RoomItem[] => {
  const rooms: RoomItem[] = [];
  for (let i = 1; i <= Math.max(1, roomCount); i++) {
    const roomNum = floorIndex === 0
      ? `G${String(i).padStart(2, "0")}`
      : `${floorIndex}${String(i).padStart(2, "0")}`;
    rooms.push({
      id: Math.random().toString(36).substring(2, 9),
      roomNumber: roomNum,
      beds: Math.max(1, defaultBeds || 3),
    });
  }
  return rooms;
};

export default function HostelManagement() {
  const { t } = useTranslation();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const schoolId = currentUser?.school_id;

  const { data: hostels, isLoading, refetch } = useGetHostelsQuery(
    { school_id: schoolId as number },
    { skip: !schoolId }
  );

  const [createHostel, { isLoading: isCreating }] = useCreateHostelMutation();
  const [createRoom, { isLoading: isCreatingRoom }] = useCreateHostelRoomMutation();
  const [deleteHostel] = useDeleteHostelMutation();

  // Wizard Dialog States
  const [isHostelDialogOpen, setIsHostelDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [newHostel, setNewHostel] = useState({
    name: "",
    type: "Boys",
    address: "",
    number_of_floors: 2,
    default_rooms_per_floor: 4,
    default_beds_per_room: 3,
  });

  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [activeFloorTab, setActiveFloorTab] = useState<string>("0");

  // Single Room Dialog State
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  const [deleteHostelId, setDeleteHostelId] = useState<number | null>(null);
  const [newRoom, setNewRoom] = useState({ room_number: "", floor: "Ground Floor", capacity: 0 });
  const [selectedFloors, setSelectedFloors] = useState<Record<number, string>>({});

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);

  // Initialize/Reset floors structure
  const resetHostelWizard = () => {
    const numFloors = 2;
    const defaultRooms = 4;
    const defaultBeds = 3;
    setNewHostel({
      name: "",
      type: "Boys",
      address: "",
      number_of_floors: numFloors,
      default_rooms_per_floor: defaultRooms,
      default_beds_per_room: defaultBeds,
    });
    const initialFloors: FloorItem[] = [];
    for (let f = 0; f < numFloors; f++) {
      initialFloors.push({
        floorIndex: f,
        floorName: getStandardFloorName(f),
        rooms: createDefaultRooms(f, defaultRooms, defaultBeds),
      });
    }
    setFloors(initialFloors);
    setActiveFloorTab("0");
    setCurrentStep(1);
  };

  const handleOpenAddHostel = () => {
    resetHostelWizard();
    setIsHostelDialogOpen(true);
  };

  // Sync floors array when number_of_floors changes in step 1
  const handleFloorsCountChange = (count: number) => {
    const targetCount = Math.max(1, Math.min(20, count || 1));
    setNewHostel((prev) => ({ ...prev, number_of_floors: targetCount }));

    setFloors((prevFloors) => {
      const nextFloors: FloorItem[] = [];
      for (let f = 0; f < targetCount; f++) {
        if (f < prevFloors.length) {
          nextFloors.push(prevFloors[f]);
        } else {
          nextFloors.push({
            floorIndex: f,
            floorName: getStandardFloorName(f),
            rooms: createDefaultRooms(f, newHostel.default_rooms_per_floor || 4, newHostel.default_beds_per_room || 3),
          });
        }
      }
      return nextFloors;
    });
  };

  // Regenerate rooms for a specific floor
  const handleRegenerateFloorRooms = (floorIndex: number, roomCount: number, defaultBeds: number, prefix?: string) => {
    setFloors((prev) =>
      prev.map((fl) => {
        if (fl.floorIndex !== floorIndex) return fl;
        const newRoomsList: RoomItem[] = [];
        const count = Math.max(1, roomCount);
        for (let i = 1; i <= count; i++) {
          const roomNum = prefix
            ? `${prefix}${String(i).padStart(2, "0")}`
            : floorIndex === 0
            ? `G${String(i).padStart(2, "0")}`
            : `${floorIndex}${String(i).padStart(2, "0")}`;
          newRoomsList.push({
            id: Math.random().toString(36).substring(2, 9),
            roomNumber: roomNum,
            beds: Math.max(1, defaultBeds || 3),
          });
        }
        return { ...fl, rooms: newRoomsList };
      })
    );
  };

  // Update room on a floor
  const handleUpdateRoom = (floorIndex: number, roomId: string, field: "roomNumber" | "beds", value: string | number) => {
    setFloors((prev) =>
      prev.map((fl) => {
        if (fl.floorIndex !== floorIndex) return fl;
        return {
          ...fl,
          rooms: fl.rooms.map((rm) => (rm.id === roomId ? { ...rm, [field]: value } : rm)),
        };
      })
    );
  };

  // Add a room to a floor
  const handleAddRoomToFloor = (floorIndex: number) => {
    setFloors((prev) =>
      prev.map((fl) => {
        if (fl.floorIndex !== floorIndex) return fl;
        const nextNumber = fl.rooms.length + 1;
        const roomNum = floorIndex === 0
          ? `G${String(nextNumber).padStart(2, "0")}`
          : `${floorIndex}${String(nextNumber).padStart(2, "0")}`;
        return {
          ...fl,
          rooms: [
            ...fl.rooms,
            {
              id: Math.random().toString(36).substring(2, 9),
              roomNumber: roomNum,
              beds: newHostel.default_beds_per_room || 3,
            },
          ],
        };
      })
    );
  };

  // Delete a room from a floor
  const handleDeleteRoomFromFloor = (floorIndex: number, roomId: string) => {
    setFloors((prev) =>
      prev.map((fl) => {
        if (fl.floorIndex !== floorIndex) return fl;
        if (fl.rooms.length <= 1) {
          toast({
            title: "Cannot delete",
            description: "Each floor must have at least one room.",
            variant: "destructive",
          });
          return fl;
        }
        return {
          ...fl,
          rooms: fl.rooms.filter((rm) => rm.id !== roomId),
        };
      })
    );
  };

  const handleUpdateFloorName = (floorIndex: number, floorName: string) => {
    setFloors((prev) =>
      prev.map((fl) => (fl.floorIndex === floorIndex ? { ...fl, floorName } : fl))
    );
  };

  // Summary calculations
  const totalConfiguredRooms = useMemo(() => {
    return floors.reduce((acc, f) => acc + f.rooms.length, 0);
  }, [floors]);

  const totalConfiguredBeds = useMemo(() => {
    return floors.reduce((acc, f) => acc + f.rooms.reduce((rAcc, r) => rAcc + (Number(r.beds) || 0), 0), 0);
  }, [floors]);

  const handleProceedToStep2 = () => {
    if (!newHostel.name.trim()) {
      toast({ title: "Name is required", description: "Please enter a name for the hostel.", variant: "destructive" });
      return;
    }
    if (newHostel.number_of_floors < 1) {
      toast({ title: "Invalid Floors", description: "Please define at least 1 floor.", variant: "destructive" });
      return;
    }
    setCurrentStep(2);
  };

  const handleCreateHostelSubmit = async () => {
    if (!newHostel.name.trim()) {
      toast({ title: "Validation Error", description: "Hostel Name is required", variant: "destructive" });
      return;
    }
    if (!schoolId) {
      toast({ title: "Error", description: "School ID is missing. Please select an active school.", variant: "destructive" });
      return;
    }

    // Validate rooms
    const allRoomNumbers: string[] = [];
    for (const floor of floors) {
      if (!floor.rooms || floor.rooms.length === 0) {
        toast({ title: "Empty Floor", description: `${floor.floorName} has no rooms. Please add at least one room.`, variant: "destructive" });
        return;
      }
      for (const room of floor.rooms) {
        const num = room.roomNumber.trim();
        if (!num) {
          toast({ title: "Invalid Room Number", description: `A room in ${floor.floorName} is missing a room number.`, variant: "destructive" });
          return;
        }
        if (allRoomNumbers.includes(num)) {
          toast({ title: "Duplicate Room Number", description: `Room number "${num}" is duplicated. Room numbers must be unique.`, variant: "destructive" });
          return;
        }
        allRoomNumbers.push(num);
        if (!room.beds || room.beds < 1) {
          toast({ title: "Invalid Bed Count", description: `Room ${num} must have at least 1 bed.`, variant: "destructive" });
          return;
        }
      }
    }

    try {
      const payload = {
        school_id: schoolId,
        name: newHostel.name.trim(),
        type: newHostel.type,
        address: newHostel.address.trim(),
        number_of_floors: floors.length,
        capacity: totalConfiguredBeds,
        floors: floors.map((f) => ({
          floorIndex: f.floorIndex,
          floorName: f.floorName,
          rooms: f.rooms.map((r) => ({
            roomNumber: r.roomNumber.trim(),
            beds: Number(r.beds),
          })),
        })),
      };

      await createHostel(payload).unwrap();
      toast({ title: "Success", description: `Hostel "${newHostel.name}" created with ${totalConfiguredRooms} rooms and ${totalConfiguredBeds} beds!` });
      setIsHostelDialogOpen(false);
      resetHostelWizard();
    } catch (error: any) {
      toast({ title: "Failed to create hostel", description: error?.data?.message || "An unexpected error occurred", variant: "destructive" });
    }
  };

  const handleCreateRoom = async () => {
    if (!selectedHostelId || !newRoom.room_number || !newRoom.capacity) {
      return toast({ title: "Error", description: "Room number and capacity are required", variant: "destructive" });
    }
    try {
      await createRoom({ hostel_id: selectedHostelId, data: newRoom }).unwrap();
      toast({ title: "Success", description: "Room created successfully" });
      setIsRoomDialogOpen(false);
      setNewRoom({ room_number: "", floor: "Ground Floor", capacity: 0 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create room", variant: "destructive" });
    }
  };

  const handleDeleteHostel = (id: number) => {
    setDeleteHostelId(id);
  };

  const confirmDeleteHostel = async () => {
    if (!deleteHostelId) return;
    try {
      await deleteHostel(deleteHostelId).unwrap();
      toast({ title: "Success", description: "Hostel deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete hostel", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const FLOOR_OPTIONS = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "6th Floor"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("hostel_management")}</h1>
          <p className="text-muted-foreground">{t("manage_hostels_rooms_and_beds")}</p>
        </div>
        
        <Dialog open={isHostelDialogOpen} onOpenChange={setIsHostelDialogOpen}>
          <Button onClick={handleOpenAddHostel}>
            <Plus className="mr-2 h-4 w-4" /> {t("add_hostel")}
          </Button>
          <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Create New Hostel
                  </DialogTitle>
                  <DialogDescription>
                    {currentStep === 1
                      ? "Step 1: Basic hostel info and number of floors"
                      : "Step 2: Configure room numbers and beds for each floor"}
                  </DialogDescription>
                </div>
                {/* Step indicator badges */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={currentStep === 1 ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setCurrentStep(1)}
                  >
                    1. Floors & Defaults
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge
                    variant={currentStep === 2 ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={handleProceedToStep2}
                  >
                    2. Rooms & Beds
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {currentStep === 1 ? (
              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Hostel Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={newHostel.name}
                      onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                      placeholder="e.g. Ganga Boys Hostel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("hostel_type")}</label>
                    <Select value={newHostel.type} onValueChange={(val) => setNewHostel({ ...newHostel, type: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boys">Boys</SelectItem>
                        <SelectItem value="Girls">Girls</SelectItem>
                        <SelectItem value="Co-ed">Co-ed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("hostel_address")}</label>
                  <Input
                    value={newHostel.address}
                    onChange={(e) => setNewHostel({ ...newHostel, address: e.target.value })}
                    placeholder="Hostel address / campus location"
                  />
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Structure Setup (Floors & Defaults)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Define how many floors this hostel has. Next, you will customize room numbers and beds on each floor.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Number of Floors</label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={newHostel.number_of_floors}
                        onChange={(e) => handleFloorsCountChange(parseInt(e.target.value) || 1)}
                      />
                      <p className="text-[11px] text-muted-foreground">Ground Floor + Upper floors</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Initial Rooms / Floor</label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={newHostel.default_rooms_per_floor}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setNewHostel({ ...newHostel, default_rooms_per_floor: val });
                          setFloors((prev) =>
                            prev.map((f) => ({
                              ...f,
                              rooms: createDefaultRooms(f.floorIndex, val, newHostel.default_beds_per_room),
                            }))
                          );
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">Default rooms per floor</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground">Initial Beds / Room</label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={newHostel.default_beds_per_room}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setNewHostel({ ...newHostel, default_beds_per_room: val });
                          setFloors((prev) =>
                            prev.map((f) => ({
                              ...f,
                              rooms: f.rooms.map((r) => ({ ...r, beds: val })),
                            }))
                          );
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">Default bed count</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="font-medium">
                      Estimated: {floors.length} Floors · {totalConfiguredRooms} Rooms · {totalConfiguredBeds} Beds
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsHostelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleProceedToStep2}>
                    Define Rooms & Beds <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-130px)] flex flex-col">
                {/* Summary Metrics Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>{floors.length} Floors</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <DoorOpen className="h-4 w-4 text-blue-600" />
                      <span>{totalConfiguredRooms} Total Rooms</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Bed className="h-4 w-4 text-emerald-600" />
                      <span>{totalConfiguredBeds} Total Beds</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background">
                    Hostel: {newHostel.name || "Untitled"} ({newHostel.type})
                  </Badge>
                </div>

                {/* Floor Tabs */}
                <Tabs value={activeFloorTab} onValueChange={setActiveFloorTab} className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1.5 gap-1.5">
                    {floors.map((fl) => (
                      <TabsTrigger key={fl.floorIndex} value={fl.floorIndex.toString()} className="text-xs px-3 py-1.5 gap-2 shrink-0">
                        <Layers className="h-3.5 w-3.5" />
                        <span>{fl.floorName}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {fl.rooms.length}R · {fl.rooms.reduce((s, r) => s + (Number(r.beds) || 0), 0)}B
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {floors.map((fl) => (
                    <TabsContent
                      key={fl.floorIndex}
                      value={fl.floorIndex.toString()}
                      className="flex-1 flex flex-col mt-3 space-y-3"
                    >
                      {/* Floor Details & Quick Auto-Fill */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Floor Name:</span>
                          <Input
                            value={fl.floorName}
                            onChange={(e) => handleUpdateFloorName(fl.floorIndex, e.target.value)}
                            className="h-8 w-44 text-xs font-medium"
                            placeholder="e.g. Ground Floor"
                          />
                        </div>

                        {/* Quick Generator on Floor */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => {
                              const count = prompt(`How many rooms for ${fl.floorName}?`, String(fl.rooms.length || 4));
                              if (!count) return;
                              const parsedCount = parseInt(count);
                              if (isNaN(parsedCount) || parsedCount < 1) return;
                              const beds = prompt(`Default beds per room for ${fl.floorName}?`, "3");
                              const parsedBeds = parseInt(beds || "3") || 3;
                              handleRegenerateFloorRooms(fl.floorIndex, parsedCount, parsedBeds);
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Auto-Generate
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleAddRoomToFloor(fl.floorIndex)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Room
                          </Button>
                        </div>
                      </div>

                      {/* Room Table / List */}
                      <div className="border rounded-lg overflow-hidden flex flex-col bg-background shadow-sm">
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/70 border-b text-xs font-semibold text-muted-foreground sticky top-0 z-10">
                          <span className="col-span-1">#</span>
                          <span className="col-span-5">Room Number / Name</span>
                          <span className="col-span-4">Number of Beds</span>
                          <span className="col-span-2 text-right">Action</span>
                        </div>

                        <div className="overflow-y-auto max-h-[300px] p-2 space-y-1.5">
                          {fl.rooms.map((room, idx) => (
                            <div
                              key={room.id}
                              className="grid grid-cols-12 gap-2 items-center px-3 py-1.5 rounded-md hover:bg-muted/40 border border-transparent hover:border-muted transition-colors"
                            >
                              <span className="col-span-1 text-xs text-muted-foreground font-mono">
                                {idx + 1}
                              </span>
                              <div className="col-span-5">
                                <Input
                                  value={room.roomNumber}
                                  onChange={(e) => handleUpdateRoom(fl.floorIndex, room.id, "roomNumber", e.target.value)}
                                  placeholder="e.g. 101"
                                  className="h-8 text-xs font-mono font-medium"
                                />
                              </div>
                              <div className="col-span-4 flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={room.beds}
                                  onChange={(e) => handleUpdateRoom(fl.floorIndex, room.id, "beds", parseInt(e.target.value) || 1)}
                                  className="h-8 text-xs font-medium"
                                />
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap">beds</span>
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteRoomFromFloor(fl.floorIndex, room.id)}
                                  disabled={fl.rooms.length <= 1}
                                  title={fl.rooms.length <= 1 ? "At least one room required" : "Delete Room"}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Footer with Back & Create Hostel */}
                <div className="flex items-center justify-between pt-3 border-t mt-auto">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> Back to Floors
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsHostelDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateHostelSubmit} disabled={isCreating} className="gap-2">
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Create Hostel ({totalConfiguredRooms} Rooms, {totalConfiguredBeds} Beds)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start grid-flow-dense">
        {hostels?.length === 0 && (
          <div className="text-center py-10 border rounded-lg bg-muted/20 xl:col-span-2">
            <Home className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No Hostels Found</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't created any hostels yet.</p>
          </div>
        )}
        
        {hostels?.map((hostel: any) => {
          const totalRooms = hostel.rooms?.length || 0;
          const totalBeds = hostel.rooms?.reduce((acc: number, r: any) => acc + (r.beds?.length || 0), 0) || 0;
          const emptyBeds = hostel.rooms?.reduce((acc: number, r: any) => acc + (r.beds?.filter((b: any) => b.status === 'Available').length || 0), 0) || 0;
          const emptyRooms = hostel.rooms?.filter((r: any) => !r.beds?.some((b: any) => b.status === 'Occupied')).length || 0;

          // Unique floors for floor filter tabs
          const uniqueFloors = Array.from(new Set(hostel.rooms?.map((r: any) => r.floor || 'Ground Floor') as string[])).sort();
          const activeFloor = selectedFloors[hostel.id] || "all";

          const filteredRooms = hostel.rooms?.filter((r: any) => {
            if (activeFloor === "all") return true;
            return (r.floor || "Ground Floor") === activeFloor;
          }) || [];

          return (
          <Card key={hostel.id} className="flex flex-col h-full overflow-hidden shadow-sm border-muted/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-4 bg-muted/30 border-b">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  {hostel.name}
                  <Badge variant={hostel.type === 'Boys' ? 'default' : hostel.type === 'Girls' ? 'destructive' : 'secondary'}>
                    {hostel.type === 'Boys' ? t('boys') : hostel.type === 'Girls' ? t('girls') : hostel.type}
                  </Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Rooms: <span className="font-semibold text-foreground">{totalRooms}</span> <span className="text-xs opacity-70">({emptyRooms} empty)</span></p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Beds: <span className="font-semibold text-foreground">{totalBeds}</span> <span className="text-xs opacity-70">({emptyBeds} empty)</span></p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Cap: <span className="font-semibold text-foreground">{hostel.capacity}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isRoomDialogOpen && selectedHostelId === hostel.id} onOpenChange={(open) => {
                  setIsRoomDialogOpen(open);
                  if (open) setSelectedHostelId(hostel.id);
                  else setSelectedHostelId(null);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-background"><Plus className="mr-2 h-4 w-4" /> Add Room</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Room to {hostel.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Room Number</label>
                        <Input value={newRoom.room_number} onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })} placeholder="e.g. 101" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Floor</label>
                        <Select value={newRoom.floor} onValueChange={(val) => setNewRoom({ ...newRoom, floor: val })}>
                          <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
                          <SelectContent>
                            {FLOOR_OPTIONS.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Capacity (Beds to auto-generate)</label>
                        <Input type="number" min={1} value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })} />
                      </div>
                      <Button className="w-full" onClick={handleCreateRoom} disabled={isCreatingRoom}>
                        {isCreatingRoom ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteHostel(hostel.id)} className="hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-5 bg-background space-y-4">
              {/* Floor Filter Bar */}
              {uniqueFloors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Floor:</span>
                  <Button
                    variant={activeFloor === "all" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-full"
                    onClick={() => setSelectedFloors({ ...selectedFloors, [hostel.id]: "all" })}
                  >
                    All ({totalRooms})
                  </Button>
                  {uniqueFloors.map((floor) => {
                    const countOnFloor = hostel.rooms?.filter((r: any) => (r.floor || "Ground Floor") === floor).length || 0;
                    return (
                      <Button
                        key={floor}
                        variant={activeFloor === floor ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5 rounded-full"
                        onClick={() => setSelectedFloors({ ...selectedFloors, [hostel.id]: floor })}
                      >
                        {floor} ({countOnFloor})
                      </Button>
                    );
                  })}
                </div>
              )}

              {hostel.rooms?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">No rooms added to this hostel yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-flow-dense">
                  {filteredRooms.map((room: any) => (
                    <div 
                      key={room.id} 
                      className="border border-border/60 rounded-xl p-4 bg-card/50 shadow-sm flex flex-col hover:border-primary/30 transition-colors cursor-pointer hover:bg-muted/30"
                      onClick={() => {
                        setSelectedRoom({ ...room, hostelName: hostel.name });
                        setIsRoomDetailsOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-base leading-none mb-1">{room.roomNumber}</h4>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{room.floor || 'No floor'}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20">{t('capacity')}: {room.capacity}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 mt-auto pt-2">
                        {room.beds?.map((bed: any) => (
                          <div key={bed.id} className={`p-2 text-[11px] rounded-lg border flex flex-col items-center justify-center col-span-1 transition-all ${
                            bed.status === 'Available' ? 'bg-green-50/50 border-green-200/60 text-green-700 hover:bg-green-100/50' :
                            bed.status === 'Occupied' ? 'bg-red-50/50 border-red-200/60 text-red-700 hover:bg-red-100/50' :
                            'bg-gray-50/50 border-gray-200/60 text-gray-700'
                          }`}>
                            <span className="font-bold tracking-tight">{bed.bedNumber.split('-').pop()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Dialog open={isRoomDetailsOpen} onOpenChange={setIsRoomDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedRoom?.hostelName} - Room {selectedRoom?.roomNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRoom?.beds?.map((bed: any) => {
                const activeAllocation = bed.allocations?.find((a: any) => a.status === 'Active');
                return (
                  <div key={bed.id} className="border rounded-lg p-4 flex flex-col space-y-3 bg-card shadow-sm">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-sm">
                          Bed {bed.bedNumber.split('-').pop()}
                        </span>
                      </div>
                      <Badge variant={bed.status === 'Available' ? 'default' : bed.status === 'Occupied' ? 'destructive' : 'secondary'}>
                        {bed.status === 'Available' ? t('available') : bed.status === 'Occupied' ? t('occupied') : t('under_maintenance')}
                      </Badge>
                    </div>
                    {bed.status === 'Occupied' && activeAllocation?.student ? (
                      <div className="flex items-start gap-3 pt-1">
                        <div className="bg-muted p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{activeAllocation.student.first_name} {activeAllocation.student.last_name}</span>
                          <span className="text-xs text-muted-foreground">Adm: {activeAllocation.student.gr_no || activeAllocation.student.enrollment_code || activeAllocation.student.admission_number || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground mt-1 text-primary">
                            Staying since: {(activeAllocation.allocation_date || activeAllocation.allocationDate) ? format(new Date(activeAllocation.allocation_date || activeAllocation.allocationDate), 'dd MMM yyyy') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-16 text-sm text-muted-foreground italic">
                        {bed.status === 'Available' ? 'Bed is currently available' : 'Under maintenance'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteHostelId)}
        onOpenChange={(open) => {
          if (!open) setDeleteHostelId(null);
        }}
        title="Delete Hostel"
        description="Are you sure you want to delete this hostel? All rooms and allocations will be deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteHostel}
      />
    </div>
  );
}
