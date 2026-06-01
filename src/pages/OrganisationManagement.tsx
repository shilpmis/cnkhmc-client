"use client";

import { useState } from "react";
import { useGetOrganizationsQuery, useCreateOrganizationMutation, useCreateEntityMutation, useDeleteOrganizationMutation } from "@/services/OrganisationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, School as SchoolIcon, GraduationCap, Loader2, Search, Info, CheckCircle2, ChevronRight, Trash2 } from "lucide-react";
import { useTranslation } from "@/redux/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "@/redux/hooks/useAppDispatch";
import { switchSchool } from "@/redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/redux/hooks/useAuth";

export default function OrganisationManagement() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: organisations, isLoading } = useGetOrganizationsQuery();
  const [createOrg] = useCreateOrganizationMutation();
  const [createEntity] = useCreateEntityMutation();
  const [deleteOrg, { isLoading: isDeletingOrg }] = useDeleteOrganizationMutation();
  const { user } = useAuth();
  const isDeveloper = user?.role_id === 11;

  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const selectedOrg = organisations?.find(o => o.id === selectedOrgId);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const handleDeleteOrg = async () => {
    if (!orgToDelete) return;
    try {
      await deleteOrg({ id: orgToDelete, payload: { password: deletePassword } }).unwrap();
      toast({ title: "Organization deleted successfully" });
      setIsDeleteOpen(false);
      setDeletePassword("");
      setOrgToDelete(null);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete organization",
        description: e?.data?.message || e?.message || "Incorrect password or network error."
      });
    }
  };

  // Form states for Org
  const [orgForm, setOrgForm] = useState<{
    name: string;
    email: string;
    contact_number: string;
    subscription_type: "FREE" | "PREMIUM";
    subscription_start_date: string;
    subscription_end_date: string;
    established_year: string;
    head_name: string;
    head_contact_number: string;
    city: string;
    state: string;
    pincode: string;
    address: string;
    admin_username?: string;
    admin_password?: string;
  }>({
    name: "",
    email: "",
    contact_number: "",
    subscription_type: "FREE",
    subscription_start_date: new Date().toISOString().split("T")[0],
    subscription_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    established_year: new Date().getFullYear().toString(),
    head_name: "",
    head_contact_number: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    admin_username: "",
    admin_password: "",
  });

  // Form states for Entity
  const [entityType, setEntityType] = useState<"SCHOOL" | "COLLEGE" | null>(null);
  const [entityName, setEntityName] = useState("");
  const [entityAdminUsername, setEntityAdminUsername] = useState("");
  const [entityAdminPassword, setEntityAdminPassword] = useState("");
  const [departments, setDepartments] = useState<Array<{
    name: string,
    num_years: number,
    phases: Array<{ year_index: number, duration: number }>
  }>>([]);
  const [currentDept, setCurrentDept] = useState({
    name: "",
    num_years: 0,
    phases: [] as Array<{ year_index: number, duration: number }>
  });
  const [classNames, setClassNames] = useState<string[]>([]);
  const [entityQueue, setEntityQueue] = useState<Array<{
    name: string,
    type: "SCHOOL" | "COLLEGE",
    config: any,
    admin_username?: string,
    admin_password?: string,
  }>>([]);

  const handleCreateOrg = async () => {
    try {
      const payload: any = {
        ...orgForm,
        contact_number: Number(orgForm.contact_number),
        head_contact_number: Number(orgForm.head_contact_number),
        pincode: orgForm.pincode,
        subscription_type: orgForm.subscription_type as "FREE" | "PREMIUM",
        subscription_start_date: orgForm.subscription_start_date,
        subscription_end_date: orgForm.subscription_end_date,
        status: 'ACTIVE' as const
      };

      // Only include credentials if they have been filled out (prevents issues with old backend)
      if (!orgForm.admin_username) delete payload.admin_username;
      if (!orgForm.admin_password) delete payload.admin_password;

      console.log("Creating Organization with payload:", payload);
      
      await createOrg(payload).unwrap();
      setIsOrgDialogOpen(false);
      setOrgForm({
        name: "",
        email: "",
        contact_number: "",
        subscription_type: "FREE",
        subscription_start_date: new Date().toISOString().split("T")[0],
        subscription_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
        established_year: new Date().getFullYear().toString(),
        head_name: "",
        head_contact_number: "",
        city: "",
        state: "",
        pincode: "",
        address: "",
        admin_username: "",
        admin_password: "",
      });
      toast({ title: "Organization created successfully" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to create organization" });
    }
  };

  const handleCreateEntity = async () => {
    if (!selectedOrgId || entityQueue.length === 0) return;

    try {
      for (const entity of entityQueue) {
        const payload: any = { ...entity };
        if (!payload.admin_username) delete payload.admin_username;
        if (!payload.admin_password) delete payload.admin_password;
        
        console.log(`Deploying entity ${payload.name}:`, payload);
        await createEntity({ organization_id: selectedOrgId, payload }).unwrap();
      }
      setIsEntityDialogOpen(false);
      resetQueue();
      toast({ title: "Institutions deployed successfully" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to deploy institutions", description: e?.data?.error || e?.message });
    }
  };

  const addToQueue = () => {
    if (!entityName || !entityType) return;

    setEntityQueue([...entityQueue, {
      name: entityName,
      type: entityType,
      config: entityType === 'COLLEGE' ? { departments: departments } : { classes: classNames },
      admin_username: entityAdminUsername,
      admin_password: entityAdminPassword,
    }]);

    setEntityType(null);
    setEntityName("");
    setEntityAdminUsername("");
    setEntityAdminPassword("");
    setDepartments([]);
    setCurrentDept({ name: "", num_years: 0, phases: [] });
    setClassNames([]);
  };
  
  const handleOpenEntity = (entity: any) => {
    // Ensure the entity is mapped correctly to a school object
    const schoolToLoad = {
      ...entity,
      school_logo: entity.logo, // map logo to school_logo
      // ensure we don't carry over stale academic sessions from the entity list if incomplete
      academicSessions: entity.academicSessions || [], 
    };
    dispatch(switchSchool(schoolToLoad));
    toast({ title: `Switched to ${entity.name}` });
    navigate("/d");
  };

  const removeQueueItem = (idx: number) => {
    setEntityQueue(entityQueue.filter((_, i) => i !== idx));
  };

  const resetQueue = () => {
    setEntityQueue([]);
    setEntityType(null);
    setEntityName("");
    setDepartments([]);
    setCurrentDept({ name: "", num_years: 0, phases: [] });
    setClassNames([]);
  };

  const addDepartment = () => {
    if (currentDept.name && currentDept.num_years > 0) {
      setDepartments([...departments, currentDept]);
      setCurrentDept({ name: "", num_years: 0, phases: [] });
    }
  };

  const handleNumYearsChange = (val: number) => {
    const newPhases = Array.from({ length: val }, (_, i) => ({
      year_index: i + 1,
      duration: 1
    }));
    setCurrentDept({ ...currentDept, num_years: val, phases: newPhases });
  };

  const updatePhaseDuration = (index: number, duration: number) => {
    const updated = [...currentDept.phases];
    updated[index].duration = duration;
    setCurrentDept({ ...currentDept, phases: updated });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 p-6 mx-auto max-w-7xl">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="h-10 w-10 text-primary" />
            Global Organizations
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage Multi-Tenant organizations and their entities</p>
        </div>
        <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-lg transition-all hover:scale-[1.02]">
              <Plus className="mr-2 h-6 w-6" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Register Organization</DialogTitle>
              <DialogDescription>Create a parent organization to manage multiple schools and colleges.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label className="font-bold">Organization Name</Label>
                  <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="e.g. Royal Education Society" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Business Email</Label>
                  <Input value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} placeholder="contact@org.com" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Contact Number</Label>
                  <Input value={orgForm.contact_number} onChange={(e) => setOrgForm({ ...orgForm, contact_number: e.target.value })} placeholder="+91 00000 00000" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Established Year</Label>
                  <Input value={orgForm.established_year} onChange={(e) => setOrgForm({ ...orgForm, established_year: e.target.value })} placeholder="2025" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Subscription Type</Label>
                  <Select value={orgForm.subscription_type} onValueChange={(val: "FREE" | "PREMIUM") => setOrgForm({ ...orgForm, subscription_type: val })}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Subscription Start Date</Label>
                  <Input type="date" value={orgForm.subscription_start_date} onChange={(e) => setOrgForm({ ...orgForm, subscription_start_date: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Subscription End Date</Label>
                  <Input type="date" value={orgForm.subscription_end_date} onChange={(e) => setOrgForm({ ...orgForm, subscription_end_date: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Head Name</Label>
                  <Input value={orgForm.head_name} onChange={(e) => setOrgForm({ ...orgForm, head_name: e.target.value })} placeholder="Director Name" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Head Contact</Label>
                  <Input value={orgForm.head_contact_number} onChange={(e) => setOrgForm({ ...orgForm, head_contact_number: e.target.value })} placeholder="Direct number" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">City</Label>
                  <Input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">State</Label>
                  <Input value={orgForm.state} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Pincode</Label>
                  <Input value={orgForm.pincode} onChange={(e) => setOrgForm({ ...orgForm, pincode: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label className="font-bold text-primary text-xs uppercase tracking-widest mt-4">Org Admin Credentials</Label>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Admin Username</Label>
                  <Input value={orgForm.admin_username} onChange={(e) => setOrgForm({ ...orgForm, admin_username: e.target.value })} placeholder="org_admin" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold">Admin Password</Label>
                  <Input type="password" value={orgForm.admin_password} onChange={(e) => setOrgForm({ ...orgForm, admin_password: e.target.value })} placeholder="••••••••" className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label className="font-bold">Office Address</Label>
                  <Input value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} className="h-12 rounded-xl" />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 mt-auto border-t">
              <Button onClick={handleCreateOrg} className="w-full h-12 rounded-xl bg-slate-900 font-bold hover:bg-slate-800 transition-colors">Launch Organization</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {organisations?.map((org) => (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={org.id}>
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:border-primary/20 border border-transparent">
              <CardHeader className="bg-slate-50/50 p-6">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-white text-primary font-bold">{org.subscription_type}</Badge>
                  <div className="flex items-center gap-2">
                    {isDeveloper && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrgToDelete(org.id);
                          setIsDeleteOpen(true);
                        }}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                        title="Delete organization"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Building2 className="h-5 w-5 text-slate-300" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-black mt-4">{org.name}</CardTitle>
                <CardDescription className="font-medium">{org.email}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Entities</span>
                    <span className="font-black text-slate-700">{org.entities?.length || 0} Registered</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {org.entities?.map((entity) => (
                      <Badge key={entity.id} variant="secondary" className="rounded-lg bg-slate-100/50 text-slate-600 font-bold">
                        {entity.type === 'SCHOOL' ? <SchoolIcon className="h-3 w-3 mr-1 inline" /> : <GraduationCap className="h-3 w-3 mr-1 inline" />}
                        {entity.name}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => { setSelectedOrgId(org.id); setIsEntityDialogOpen(true); }} className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary font-bold transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    Manage Entities
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Entity Setup Wizard Dialog */}
      <Dialog open={isEntityDialogOpen} onOpenChange={(open) => { setIsEntityDialogOpen(open); if (!open) resetQueue(); }}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-10 border-none shadow-2xl h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tight">Onboarding Suite</DialogTitle>
            <DialogDescription className="text-lg font-medium">Add one or more institutions to this organization.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 h-full">
              {/* Left Side: Staging Queue */}
              <div className="md:col-span-2 space-y-6 h-full flex flex-col overflow-hidden">
                <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-200 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-xl">
                      {(selectedOrg?.entities?.length || 0) + entityQueue.length}
                    </div>
                    <div>
                      <h4 className="font-bold">Total Entities</h4>
                      <p className="text-xs text-slate-400">Existing + Staging Queue</p>
                    </div>
                  </div>
                  <Info className="h-4 w-4 text-slate-500" />
                </div>

                <div className="space-y-4 min-h-[300px] flex-1 overflow-y-auto px-1">
                  {/* Existing Entities Section */}
                  {selectedOrg?.entities && selectedOrg.entities.length > 0 && (
                    <div className="space-y-2">
                       <Label className="font-bold text-slate-400 text-[10px] uppercase tracking-widest pl-2">Existing Institutions</Label>
                       <div className="space-y-2">
                          {selectedOrg.entities.map((ent) => (
                            <div key={ent.id} className="bg-slate-50 p-4 rounded-[1.5rem] flex items-center justify-between border border-transparent hover:border-slate-100 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={ent.type === 'SCHOOL' ? 'bg-blue-100 p-2 rounded-xl' : 'bg-purple-100 p-2 rounded-xl'}>
                                  {ent.type === 'SCHOOL' ? <SchoolIcon className="h-4 w-4 text-blue-600" /> : <GraduationCap className="h-4 w-4 text-purple-600" />}
                                </div>
                                <div>
                                  <h5 className="font-bold text-sm text-slate-700">{ent.name}</h5>
                                  <Badge className="text-[8px] h-4 rounded-md">{ent.type}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 font-bold text-[9px]">ACTIVE</Badge>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleOpenEntity(ent)}
                                  className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                  title="Open institution dashboard"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <Label className="font-bold text-slate-400 text-[10px] uppercase tracking-widest pl-2">New Staging Queue</Label>
                  <AnimatePresence>
                    {entityQueue.map((item, i) => (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        key={i}
                        className="bg-white border-2 border-slate-50 p-5 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={item.type === 'SCHOOL' ? 'bg-blue-50 p-4 rounded-2xl' : 'bg-purple-50 p-4 rounded-2xl'}>
                            {item.type === 'SCHOOL' ? <SchoolIcon className="h-6 w-6 text-blue-600" /> : <GraduationCap className="h-6 w-6 text-purple-600" />}
                          </div>
                          <div>
                            <h5 className="font-black text-slate-900 leading-tight">{item.name}</h5>
                            <Badge variant="outline" className="mt-1 rounded-lg text-[10px] font-bold text-slate-400">{item.type}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeQueueItem(i)} className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl">
                          <Plus className="h-5 w-5 rotate-45" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {entityQueue.length === 0 && (
                    <div className="h-64 border-4 border-dashed border-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                      <Search className="h-12 w-12 mb-4 opacity-10" />
                      <p className="font-bold">No institutions added yet</p>
                    </div>
                  )}
                </div>

                </div>
              </div>

              {/* Right Side: Setup Form */}
              <div className="md:col-span-2 space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 h-full overflow-y-auto">
                {!entityType ? (
                  <div className="space-y-6">
                    <Label className="font-black text-slate-400 uppercase text-xs tracking-widest text-center block">Institutional Category</Label>
                    <div className="grid gap-4">
                      <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] cursor-pointer hover:border-blue-500 transition-all group" onClick={() => setEntityType('SCHOOL')}>
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-5 rounded-[1.5rem] group-hover:bg-blue-500 transition-colors">
                            <SchoolIcon className="h-8 w-8 text-blue-600 group-hover:text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black">Primary School</h4>
                            <p className="text-sm text-slate-500 font-medium">Standard classes & sections</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] cursor-pointer hover:border-purple-500 transition-all group" onClick={() => setEntityType('COLLEGE')}>
                        <div className="flex items-center gap-4">
                          <div className="bg-purple-50 p-5 rounded-[1.5rem] group-hover:bg-purple-500 transition-colors">
                            <GraduationCap className="h-8 w-8 text-purple-600 group-hover:text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black">University College</h4>
                            <p className="text-sm text-slate-500 font-medium">Phase-based tracking</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between">
                      <Badge className={entityType === 'SCHOOL' ? 'bg-blue-600' : 'bg-purple-600'}>{entityType} SETUP</Badge>
                      <Button variant="ghost" className="rounded-xl h-8 px-3 font-bold text-xs" onClick={() => setEntityType(null)}>Change Type</Button>
                    </div>

                    <div className="grid gap-3">
                      <Label className="font-bold text-lg">Institution Name</Label>
                      <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Official Name" className="h-14 rounded-2xl text-lg font-bold border-2 border-white shadow-sm focus:border-primary transition-all" />
                    </div>

                    {entityType === 'COLLEGE' ? (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-white shadow-sm space-y-4">
                          <Label className="font-bold text-primary text-xs uppercase tracking-widest">Course Structure</Label>
                          <div className="grid gap-4">
                            <Input placeholder="Department (e.g. BHMS)" value={currentDept.name} onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })} className="h-12 rounded-xl" />
                            <Input type="number" placeholder="Total Years" value={currentDept.num_years || ""} onChange={(e) => handleNumYearsChange(parseInt(e.target.value) || 0)} className="h-12 rounded-xl" />

                            {currentDept.num_years > 0 && (
                              <div className="grid grid-cols-2 gap-3 mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Label className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Configure Year Durations</Label>
                                {currentDept.phases.map((phase, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <Badge variant="outline" className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0">{i + 1}</Badge>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      placeholder="Years (e.g. 1.5)"
                                      value={phase.duration}
                                      onChange={(e) => updatePhaseDuration(i, parseFloat(e.target.value) || 0)}
                                      className="h-9 rounded-lg text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <Button onClick={addDepartment} disabled={!currentDept.name || !currentDept.num_years} className="h-12 rounded-xl bg-slate-900 font-bold w-full">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Department Configuration
                            </Button>
                          </div>

                          <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                            {departments.map((d, i) => (
                              <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                <span className="font-bold text-xs">{d.name} ({d.num_years}Y)</span>
                                <Badge variant="secondary" className="text-[9px]">READY</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-white shadow-sm">
                          <Label className="font-bold text-blue-600 text-xs uppercase tracking-widest">Class List</Label>
                          <Input
                            placeholder="Add Class (e.g. 10-A) & Enter"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.currentTarget as HTMLInputElement).value;
                                if (val) { setClassNames([...classNames, val]); e.currentTarget.value = ""; }
                              }
                            }}
                            className="h-12 rounded-xl mt-2"
                          />
                          <div className="flex flex-wrap gap-2 mt-4">
                            {classNames.map((c, i) => (
                              <Badge key={i} className="bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => setClassNames(classNames.filter((_, idx) => idx !== i))}>{c} ×</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                      <Label className="font-bold text-slate-400 text-xs uppercase tracking-widest">Entity Admin credentials</Label>
                      <div className="grid gap-4">
                        <Input value={entityAdminUsername} onChange={(e) => setEntityAdminUsername(e.target.value)} placeholder="Admin Username" className="h-12 rounded-xl" />
                        <Input type="password" value={entityAdminPassword} onChange={(e) => setEntityAdminPassword(e.target.value)} placeholder="Admin Password" className="h-12 rounded-xl" />
                      </div>
                    </div>

                    <Button
                      onClick={addToQueue}
                      disabled={!entityName || (entityType === 'COLLEGE' && departments.length === 0) || (entityType === 'SCHOOL' && classNames.length === 0) || !entityAdminUsername || !entityAdminPassword}
                      className="w-full h-16 rounded-[2rem] bg-slate-900 border-4 border-white shadow-2xl text-lg font-black tracking-tight hover:bg-slate-800"
                    >
                      Add to Institutional Queue
                    </Button>
                  </div>
                )}
              </div>
            </div>

          {entityQueue.length > 0 && (
            <div className="mt-8 pt-6 border-t flex items-center justify-between bg-slate-50 -mx-10 -mb-10 p-10 rounded-b-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{entityQueue.length} Institution{entityQueue.length > 1 ? 's' : ''} Ready</p>
                  <p className="text-xs text-slate-500">Click deploy to finalize installation</p>
                </div>
              </div>
              <Button 
                onClick={handleCreateEntity} 
                className="px-10 h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 font-black text-xl tracking-tight transition-all active:scale-[0.95] flex items-center gap-3"
              >
                <span>Deploy All</span>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) { setDeletePassword(""); setOrgToDelete(null); } }}>
        <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl max-w-md flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-rose-600" />
              Delete Organization
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-500 mt-2">
              This action is highly destructive and permanent. All schools, sessions, enrollments, users, and logs associated with this organization will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">Enter Account Password to Confirm</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your ERP account password"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteOrg}
              disabled={!deletePassword || isDeletingOrg}
              className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white transition-colors"
            >
              {isDeletingOrg ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Permanently Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
