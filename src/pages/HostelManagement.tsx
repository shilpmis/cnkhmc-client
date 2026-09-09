import React, { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "@/redux/store";
import {
  useGetHostelsQuery,
  useCreateHostelMutation,
  useCreateHostelRoomMutation,
  useDeleteHostelMutation,
} from "@/services/HostelService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Home, Trash2, User } from "lucide-react";

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

  const [isHostelDialogOpen, setIsHostelDialogOpen] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: "", type: "Boys", address: "", capacity: 0, number_of_rooms: 0, number_of_floors: 1, beds_per_room: 0 });

  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  const [newRoom, setNewRoom] = useState({ room_number: "", floor: "Ground Floor", capacity: 0 });
  const [selectedFloors, setSelectedFloors] = useState<Record<number, string>>({});

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false);

  const handleCreateHostel = async () => {
    if (!newHostel.name) return toast({ title: "Error", description: "Name is required", variant: "destructive" });
    if (!schoolId) return toast({ title: "Error", description: "School ID is missing. Please select a school.", variant: "destructive" });
    try {
      await createHostel({ ...newHostel, school_id: schoolId }).unwrap();
      toast({ title: "Success", description: "Hostel created successfully" });
      setIsHostelDialogOpen(false);
      setNewHostel({ name: "", type: "Boys", address: "", capacity: 0, number_of_rooms: 0, number_of_floors: 1, beds_per_room: 0 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create hostel", variant: "destructive" });
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

  const handleDeleteHostel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this hostel? All rooms and allocations will be deleted.")) return;
    try {
      await deleteHostel(id).unwrap();
      toast({ title: "Success", description: "Hostel deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete hostel", variant: "destructive" });
    }
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const FLOOR_OPTIONS = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "6th Floor"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("hostel_management")}</h1>
          <p className="text-muted-foreground">{t("manage_hostels_rooms_and_beds")}</p>
        </div>
        <Dialog open={isHostelDialogOpen} onOpenChange={setIsHostelDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> {t("add_hostel")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Hostel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("name")}</label>
                <Input value={newHostel.name} onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })} placeholder="e.g. Ganga Boys Hostel" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("hostel_type")}</label>
                <Select value={newHostel.type} onValueChange={(val) => setNewHostel({ ...newHostel, type: val })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boys">Boys</SelectItem>
                    <SelectItem value="Girls">Girls</SelectItem>
                    <SelectItem value="Co-ed">Co-ed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("total_capacity")} (Optional)</label>
                <Input type="number" value={newHostel.capacity} onChange={(e) => setNewHostel({ ...newHostel, capacity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">{t("number_of_rooms")} (Auto)</label>
                  <Input type="number" value={newHostel.number_of_rooms} onChange={(e) => setNewHostel({ ...newHostel, number_of_rooms: parseInt(e.target.value) || 0 })} placeholder="e.g. 10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Floors</label>
                  <Input type="number" min={1} value={newHostel.number_of_floors} onChange={(e) => setNewHostel({ ...newHostel, number_of_floors: parseInt(e.target.value) || 1 })} placeholder="e.g. 2" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">{t("beds_per_room")}</label>
                  <Input type="number" value={newHostel.beds_per_room} onChange={(e) => setNewHostel({ ...newHostel, beds_per_room: parseInt(e.target.value) || 0 })} placeholder="e.g. 4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("hostel_address")}</label>
                <Input value={newHostel.address} onChange={(e) => setNewHostel({ ...newHostel, address: e.target.value })} placeholder="Hostel address" />
              </div>
              <Button className="w-full" onClick={handleCreateHostel} disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
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
    </div>
  );
}
