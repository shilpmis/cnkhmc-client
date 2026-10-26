"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, Plus, Trash2, Pencil, Search, ChevronDown, 
  Calendar, Truck, FileText, Coins, Package, Clock, ShieldCheck, Tag 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { 
  useGetInventoryDepartmentsQuery, 
  useCreateInventoryDepartmentMutation,
  useDeleteInventoryDepartmentMutation,
  InventoryDepartment,
  IssuedItemDetail
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
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
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
                  setExpandedItemId(null);
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

      {/* View Dialog with Expandable Item Details */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="rounded-[2rem] p-6 md:p-8 border-none shadow-2xl max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <Building className="h-7 w-7 text-primary" />
                {selectedDepartment?.name}
              </DialogTitle>
              <Badge className="bg-primary/10 text-primary font-bold px-3 py-1 text-xs">
                ID: {selectedDepartment?.id}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on {selectedDepartment && new Date(selectedDepartment.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Issued Stock Items
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on an item to inspect its purchase, supplier, and stock breakdown
                </p>
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold text-xs">
                {selectedDepartment?.issuedItems?.length || 0} Total
              </Badge>
            </div>

            {selectedDepartment?.issuedItems && selectedDepartment.issuedItems.length > 0 ? (
              <div className="space-y-2.5">
                {selectedDepartment.issuedItems.map((item) => {
                  const isExpanded = expandedItemId === item.id;
                  const itemDeptTotal = (item.unitPrice || 0) * (item.quantity || 0);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? "border-primary/50 shadow-md bg-white ring-2 ring-primary/10"
                          : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-300"
                      }`}
                    >
                      {/* Clickable Header Row */}
                      <button
                        type="button"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="w-full flex items-center justify-between p-3.5 text-left focus:outline-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <span className="text-xs font-bold text-slate-400">#{item.id}</span>
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {item.itemName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-primary font-bold border-primary/30 bg-primary/5 text-xs px-2.5 py-0.5"
                          >
                            Qty: {item.quantity}
                          </Badge>
                          <div
                            className={`p-1 rounded-full transition-transform duration-200 ${
                              isExpanded ? "rotate-180 bg-primary/10 text-primary" : "text-slate-400"
                            }`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </button>

                      {/* Expandable Details Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3"
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                              {/* Purchase Date */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                  Purchase Date
                                </span>
                                <span className="font-bold text-slate-800 text-sm">
                                  {item.purchaseDate || "Not Recorded"}
                                </span>
                              </div>

                              {/* Supplier */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                                  <Truck className="h-3.5 w-3.5 text-emerald-500" />
                                  Supplier Name
                                </span>
                                <span className="font-bold text-slate-800 text-sm truncate block" title={item.supplierName || ""}>
                                  {item.supplierName || "N/A"}
                                </span>
                              </div>

                              {/* Invoice Number */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                                  Invoice Number
                                </span>
                                <span className="font-bold text-slate-800 text-sm">
                                  {item.invoiceNumber || "N/A"}
                                </span>
                              </div>

                              {/* Unit Price */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                                  Unit Price
                                </span>
                                <span className="font-bold text-slate-800 text-sm">
                                  ₹{item.unitPrice ? item.unitPrice.toLocaleString("en-IN") : 0}
                                </span>
                              </div>

                              {/* Quantity in Department */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                                  <Package className="h-3.5 w-3.5 text-purple-500" />
                                  In Department
                                </span>
                                <span className="font-bold text-purple-700 text-sm">
                                  {item.quantity} unit{item.quantity !== 1 ? "s" : ""}
                                </span>
                              </div>

                              {/* Department Stock Cost */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                                  <Coins className="h-3.5 w-3.5 text-emerald-600" />
                                  Dept Item Cost
                                </span>
                                <span className="font-bold text-emerald-700 text-sm">
                                  ₹{itemDeptTotal.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            {/* Additional Stock Info footer */}
                            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 gap-2">
                              <div>
                                Central Store Balance:{" "}
                                <strong className="text-slate-700">
                                  {item.availableQuantity ?? 0} available
                                </strong>{" "}
                                (out of {item.totalQuantity || item.quantity} total)
                              </div>
                              {item.expiryDate && (
                                <div className="text-rose-600 font-semibold">
                                  Expires: {item.expiryDate}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                No items currently issued to this department.
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button
              onClick={() => setIsViewDialogOpen(false)}
              className="rounded-xl h-11 w-full bg-slate-900 font-bold hover:bg-slate-800 text-white"
            >
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
