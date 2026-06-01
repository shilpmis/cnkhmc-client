"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/redux/hooks/useTranslation";
import { Plus, Trash2, GraduationCap, BookOpen, Users, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateSubjectMutation } from "@/services/subjects";
import { useAppSelector } from "@/redux/hooks/useAppSelector";
import { selectSchool } from "@/redux/slices/schoolSlice";
import { selectActiveAccademicSessionsForSchool, selectCurrentUser } from "@/redux/slices/authSlice";

import { 
  useGetDepartmentsQuery, 
  useCreateDepartmentMutation, 
  useUpdateDepartmentMutation, 
  useDeleteDepartmentMutation,
  Department
} from "@/services/DepartmentService";

export default function DepartmentManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const schoolData = useAppSelector(selectSchool);
  const schoolState = useAppSelector(selectCurrentUser);
  const activeSession = useAppSelector(selectActiveAccademicSessionsForSchool);
  const [createSubject] = useCreateSubjectMutation();

  const finalSchoolId = schoolData?.id || schoolState?.school_id || schoolState?.school?.id;

  // REAL Backend Hooks
  const { data: departments = [], isLoading, refetch } = useGetDepartmentsQuery(
    { school_id: Number(finalSchoolId) || 0 },
    { skip: !finalSchoolId }
  );
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", code: "", head_name: "", subjects: "", year: "1st Year" });

  const openAdd = () => {
    console.log("🏫 Context for Fetch/Save:", finalSchoolId);
    setEditingDept(null);
    setForm({ name: "", code: "", head_name: "", subjects: "", year: "1st Year" });
    setIsDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      name: dept.name,
      code: dept.code || "",
      head_name: dept.head_name || "",
      subjects: (dept.subjects || []).join(", "),
      year: "1st Year", // Default for new additions
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const finalSchoolId = schoolData?.id || schoolState?.school_id || schoolState?.school?.id;
    console.log("🛠️ Attempting Save. School ID Found:", finalSchoolId, "Name:", form.name);

    if (!form.name || !finalSchoolId) {
      toast({ 
        variant: "destructive", 
        title: "Validation Error", 
        description: !form.name ? "Department Name is required" : "School context missing. Please refresh." 
      });
      return;
    }
    const subjectList = form.subjects.split(",").map((s) => s.trim()).filter(Boolean);

    // Auto-create subjects in the global catalog!
    const activeSessionId = activeSession?.id;
    
    if (activeSessionId) {
      console.log(`🚀 Starting Subject Sync for Session: ${activeSessionId}`);
      for (const subjName of subjectList) {
        try {
          // Append year to name if it's not already there
          let finalSubjName = subjName;
          if (form.year && !subjName.toLowerCase().includes(form.year.toLowerCase())) {
            finalSubjName = `${subjName} (${form.year})`;
          }

          await createSubject({
            name: finalSubjName,
            description: `${form.name} Department Subject`,
            academic_session_id: Number(activeSessionId),
            year: form.year
          }).unwrap();
        } catch (e: any) {
          console.warn(`⚠️ Subject sync note for "${subjName}":`, e?.data?.message || "Already exists or error");
        }
      }
    } else {
      console.warn("❌ Subject Sync Skipped: No Active Academic Session found.");
      toast({ 
        variant: "default", 
        title: "Subject Catalog Note", 
        description: "Department saved, but subjects couldn't be added into global settings because no Academic Session is active." 
      });
    }

    try {
      if (editingDept) {
        await updateDepartment({
          id: editingDept.id,
          name: form.name,
          code: form.code.toUpperCase(),
          head_name: form.head_name,
          subjects: subjectList
        }).unwrap();
        toast({ title: "Department updated safely in Database" });
      } else {
        await createDepartment({
          school_id: Number(schoolData.id),
          name: form.name,
          code: form.code.toUpperCase(),
          head_name: form.head_name,
          subjects: subjectList
        }).unwrap();
        toast({ title: "Department saved permanently in Database" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to save", description: error?.data?.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment({ id }).unwrap();
      toast({ title: "Department removed from Database" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-primary" />
            Department Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Manage academic departments, subjects, and department heads
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-lg transition-all hover:scale-[1.02]"
        >
          <Plus className="mr-2 h-6 w-6" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Departments", value: departments.length, icon: <GraduationCap className="h-6 w-6" />, color: "bg-blue-50 text-blue-600" },
          { label: "Total Subjects", value: departments.reduce((acc, d) => acc + (d.subjects?.length || 0), 0), icon: <BookOpen className="h-6 w-6" />, color: "bg-purple-50 text-purple-600" },
          { label: "Total Students", value: departments.reduce((acc, d) => acc + (d.total_students || 0), 0), icon: <Users className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-md rounded-[1.5rem]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {departments.map((dept) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-primary/10 text-primary font-bold rounded-lg mb-2">{dept.code}</Badge>
                      <CardTitle className="text-2xl font-black">{dept.name}</CardTitle>
                      {dept.head_name && (
                        <p className="text-slate-500 text-sm mt-1 font-medium">Head: {dept.head_name}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(dept)} className="rounded-xl hover:bg-white hover:shadow-sm">
                        <Pencil className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="rounded-xl hover:bg-rose-50">
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {(dept.subjects || []).map((subj) => (
                      <Badge key={subj} variant="secondary" className="rounded-lg bg-slate-100 text-slate-600 font-medium">
                        {subj}
                      </Badge>
                    ))}
                    {(!dept.subjects || dept.subjects.length === 0) && (
                      <span className="text-slate-300 text-sm font-medium">No subjects assigned</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingDept ? "Edit Department" : "Add New Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold">Department Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Science"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Department Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. SCI"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Department Head</Label>
              <Input
                value={form.head_name}
                onChange={(e) => setForm({ ...form, head_name: e.target.value })}
                placeholder="Name of head teacher"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Target Year for Subjects</Label>
              <select 
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="1st Year">{t("1st_year")}</option>
                <option value="2nd Year">{t("2nd_year")}</option>
                <option value="3rd Year">{t("3rd_year")}</option>
                <option value="4th Year">{t("4th_year")}</option>
                <option value="5th Year">{t("5th_year")}</option>
              </select>
              <p className="text-xs text-slate-500">All subjects in the list below will be assigned to this year.</p>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Subjects (comma-separated)</Label>
              <Input
                value={form.subjects}
                onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                placeholder="Physics, Chemistry, Biology"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl h-12 flex-1 bg-slate-900 font-bold">
              {editingDept ? "Save Changes" : "Add Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
