"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Building, Plus, Trash2, Pencil, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { 
  useGetInventoryDepartmentsQuery, 
  useCreateInventoryDepartmentMutation,
  useDeleteInventoryDepartmentMutation,
  InventoryDepartment
} from "@/services/DeadStockService";

export default function InventoryDepartments() {
  const { toast } = useToast();

  const { data: response, isLoading } = useGetInventoryDepartmentsQuery();
  const departments = response?.data || [];
  
  const [createDepartment] = useCreateInventoryDepartmentMutation();
  const [deleteDepartment] = useDeleteInventoryDepartmentMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<InventoryDepartment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const openAdd = () => {
    setForm({ name: "" });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ 
        variant: "destructive", 
        title: "Validation Error", 
        description: "Department Name is required" 
      });
      return;
    }

    try {
      await createDepartment({ name: form.name }).unwrap();
      toast({ title: "Inventory Department added successfully" });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to save", description: error?.data?.message || "An error occurred" });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // prevent opening the view dialog
    setDeleteConfirmId(id);
  };

  const confirmDeleteDepartment = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDepartment(deleteConfirmId).unwrap();
      toast({ title: "Department deleted successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to delete", description: error?.data?.message || "An error occurred" });
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading inventory departments...</div>;
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building className="h-10 w-10 text-primary" />
            Inventory Departments
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Manage locations/departments that hold dead stock
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

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="border-none shadow-md rounded-[1.5rem] flex-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{filteredDepartments.length}</p>
              <p className="text-slate-500 font-medium text-sm">Total Inventory Departments</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex-[2] flex items-center bg-white shadow-md rounded-[1.5rem] px-6 border-none">
          <Search className="text-slate-400 h-6 w-6 mr-3" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search departments..."
            className="border-none shadow-none focus-visible:ring-0 text-lg px-0"
          />
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence>
          {filteredDepartments.map((dept) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card 
                className="border-none shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group h-full cursor-pointer"
                onClick={() => {
                  setSelectedDepartment(dept);
                  setIsViewDialogOpen(true);
                }}
              >
                <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-primary/10 text-primary font-bold rounded mb-1 text-[10px] px-2 py-0">ID: {dept.id}</Badge>
                      <CardTitle className="text-lg font-bold leading-tight">{dept.name}</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 -mt-1 -mr-1 h-8 w-8 z-10"
                      onClick={(e) => handleDelete(e, dept.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 text-slate-500 text-xs">
                  <div className="mb-2 text-slate-400">
                    Added {new Date(dept.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  
                  {dept.issuedItems && dept.issuedItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center">
                      <Badge variant="secondary" className="bg-slate-100/80 text-slate-600 text-[10px]">
                        {dept.issuedItems.length} Issued Item{dept.issuedItems.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add Inventory Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold">Department Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. IT Lab 1"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl h-12 flex-1 bg-slate-900 font-bold">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Building className="h-6 w-6 text-primary" />
              {selectedDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center text-sm text-slate-500 border-b border-slate-100 pb-4">
              <span>ID: <Badge className="bg-primary/10 text-primary font-bold ml-1">{selectedDepartment?.id}</Badge></span>
              <span>Created: {selectedDepartment && new Date(selectedDepartment.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-800 mb-3 text-lg">Issued Items</h3>
              {selectedDepartment?.issuedItems && selectedDepartment.issuedItems.length > 0 ? (
                <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedDepartment.issuedItems.map((item) => (
                    <li key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">{item.itemName}</span>
                      <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-sm px-3 py-1">
                        Qty: {item.quantity}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  No items currently issued to this department.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} className="rounded-xl h-12 w-full bg-slate-900 font-bold hover:bg-slate-800 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
        title="Delete Department"
        description="Are you sure you want to delete this department?"
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteDepartment}
      />
    </div>
  );
}
