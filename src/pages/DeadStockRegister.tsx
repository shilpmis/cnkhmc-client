"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Send, Undo2, Trash2, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { 
  useGetDeadStocksQuery, 
  useCreateDeadStockMutation,
  useIssueDeadStockMutation,
  useReturnDeadStockMutation,
  useDiscardDeadStockMutation,
  useTransferDeadStockMutation,
  useGetInventoryDepartmentsQuery,
  DeadStock
} from "@/services/DeadStockService";

export default function DeadStockRegister() {
  const { toast } = useToast();

  const { data: response, isLoading, refetch } = useGetDeadStocksQuery();
  const deadStocks = response?.data || [];

  const { data: deptResponse } = useGetInventoryDepartmentsQuery();
  const departments = deptResponse?.data || [];
  
  const [createDeadStock] = useCreateDeadStockMutation();
  const [issueStock] = useIssueDeadStockMutation();
  const [returnStock] = useReturnDeadStockMutation();
  const [discardStock] = useDiscardDeadStockMutation();
  const [transferStock] = useTransferDeadStockMutation();

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'ISSUE' | 'RETURN' | 'DISCARD' | 'TRANSFER' | null>(null);
  const [selectedStock, setSelectedStock] = useState<DeadStock | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({
    itemName: "", invoiceNumber: "", supplierName: "", purchaseDate: "", unitPrice: 0, totalQuantity: 1, expiryDate: ""
  });
  
  const [actionForm, setActionForm] = useState({
    departmentId: "", toDepartmentId: "", quantity: 1, transactionDate: new Date().toISOString().split('T')[0], remark: ""
  });

  const openAdd = () => {
    setAddForm({ itemName: "", invoiceNumber: "", supplierName: "", purchaseDate: "", unitPrice: 0, totalQuantity: 1, expiryDate: "" });
    setIsAddOpen(true);
  };

  const openAction = (stock: DeadStock, type: 'ISSUE' | 'RETURN' | 'DISCARD' | 'TRANSFER') => {
    setSelectedStock(stock);
    setActionType(type);
    setActionForm({ departmentId: "", toDepartmentId: "", quantity: 1, transactionDate: new Date().toISOString().split('T')[0], remark: "" });
    setIsActionOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.itemName || addForm.totalQuantity < 1) {
      toast({ variant: "destructive", title: "Validation Error", description: "Item Name and Quantity are required" });
      return;
    }
    try {
      await createDeadStock({
        ...addForm,
        invoiceNumber: addForm.invoiceNumber || null,
        supplierName: addForm.supplierName || null,
        purchaseDate: addForm.purchaseDate || null,
        expiryDate: addForm.expiryDate || null,
        totalAmount: addForm.unitPrice * addForm.totalQuantity
      }).unwrap();
      toast({ title: "Stock added successfully" });
      setIsAddOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add", description: error?.data?.message || "Error" });
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedStock || !actionType) return;
    
    try {
      const payload = {
        deadStockId: selectedStock.id,
        quantity: Number(actionForm.quantity),
        transactionDate: actionForm.transactionDate,
        remark: actionForm.remark || null,
        departmentId: actionForm.departmentId ? Number(actionForm.departmentId) : undefined
      };

      if (actionType === 'ISSUE') {
        if (!payload.departmentId) {
          toast({ variant: "destructive", title: "Validation Error", description: "Department is required for issuing" });
          return;
        }
        await issueStock(payload).unwrap();
        toast({ title: "Stock issued successfully" });
      } else if (actionType === 'RETURN') {
        if (!payload.departmentId) {
          toast({ variant: "destructive", title: "Validation Error", description: "Department is required for returning" });
          return;
        }
        await returnStock(payload).unwrap();
        toast({ title: "Stock returned successfully" });
      } else if (actionType === 'DISCARD') {
        await discardStock(payload).unwrap();
        toast({ title: "Stock discarded successfully" });
      } else if (actionType === 'TRANSFER') {
        if (!payload.departmentId || !actionForm.toDepartmentId) {
          toast({ variant: "destructive", title: "Validation Error", description: "Both source and destination departments are required for transfer" });
          return;
        }
        await transferStock({
          deadStockId: payload.deadStockId,
          fromDepartmentId: payload.departmentId,
          toDepartmentId: Number(actionForm.toDepartmentId),
          quantity: payload.quantity,
          transactionDate: payload.transactionDate,
          remark: payload.remark
        }).unwrap();
        toast({ title: "Stock transferred successfully" });
      }
      setIsActionOpen(false);
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error?.data?.message || "Error" });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading dead stock register...</div>;
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="h-10 w-10 text-primary" />
            Dead Stock Register
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Master register for tracking all dead stock acquisitions and availability
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-lg transition-all hover:scale-[1.02]"
        >
          <Plus className="mr-2 h-6 w-6" />
          Add Purchase
        </Button>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {deadStocks.map((stock) => (
            <motion.div
              key={stock.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-primary/10 text-primary font-bold rounded-lg mb-2">Item #{stock.id}</Badge>
                      <CardTitle className="text-2xl font-black">{stock.itemName}</CardTitle>
                      <p className="text-slate-500 text-sm mt-1 font-medium">{stock.supplierName || "No Supplier"} {stock.invoiceNumber ? `| Inv: ${stock.invoiceNumber}` : ""}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-slate-400 font-bold mb-1">Total Qty</p>
                      <p className="text-lg font-black text-slate-900">{stock.totalQuantity}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl">
                      <p className="text-blue-400 font-bold mb-1">Available</p>
                      <p className="text-lg font-black text-blue-700">{stock.availableQuantity}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-slate-400 font-bold mb-1">Unit Price</p>
                      <p className="text-lg font-black text-slate-900">₹{stock.unitPrice}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl">
                      <p className="text-emerald-500 font-bold mb-1">Total Amt</p>
                      <p className="text-lg font-black text-emerald-700">₹{stock.totalAmount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700"
                      onClick={() => openAction(stock, 'ISSUE')}
                    >
                      <Send className="mr-2 h-4 w-4" /> Issue
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700"
                      onClick={() => openAction(stock, 'RETURN')}
                    >
                      <Undo2 className="mr-2 h-4 w-4" /> Return
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700"
                      onClick={() => openAction(stock, 'TRANSFER')}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700"
                      onClick={() => openAction(stock, 'DISCARD')}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Discard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Purchase Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add New Purchase</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2 col-span-2">
              <Label className="font-bold">Item Name *</Label>
              <Input value={addForm.itemName} onChange={(e) => setAddForm({...addForm, itemName: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Total Quantity *</Label>
              <Input type="number" min="1" value={addForm.totalQuantity} onChange={(e) => setAddForm({...addForm, totalQuantity: Number(e.target.value)})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Unit Price *</Label>
              <Input type="number" step="0.01" value={addForm.unitPrice} onChange={(e) => setAddForm({...addForm, unitPrice: Number(e.target.value)})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Supplier Name</Label>
              <Input value={addForm.supplierName} onChange={(e) => setAddForm({...addForm, supplierName: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Invoice Number</Label>
              <Input value={addForm.invoiceNumber} onChange={(e) => setAddForm({...addForm, invoiceNumber: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Purchase Date</Label>
              <Input type="date" value={addForm.purchaseDate} onChange={(e) => setAddForm({...addForm, purchaseDate: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Expiry Date</Label>
              <Input type="date" value={addForm.expiryDate} onChange={(e) => setAddForm({...addForm, expiryDate: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label className="font-bold">Total Amount</Label>
              <Input readOnly value={addForm.unitPrice * addForm.totalQuantity} className="h-12 rounded-xl bg-slate-50 font-bold" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button onClick={handleAddSubmit} className="rounded-xl h-12 flex-1 bg-slate-900 font-bold">Save Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Issue/Return/Discard) */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {actionType === 'ISSUE' && 'Issue Stock to Department'}
              {actionType === 'RETURN' && 'Return Stock to Central'}
              {actionType === 'DISCARD' && 'Discard/Write-off Stock'}
              {actionType === 'TRANSFER' && 'Transfer Stock Between Departments'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
              Selected Item: <strong className="text-slate-900">{selectedStock?.itemName}</strong> <br/>
              Available in Central: <strong className="text-blue-600">{selectedStock?.availableQuantity}</strong>
            </p>

            {actionType === 'TRANSFER' ? (
              <div className="flex flex-col gap-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-6 rounded-3xl border border-indigo-100/50 shadow-inner">
                <div className="grid gap-2">
                  <Label className="text-sm font-bold tracking-wide text-indigo-900 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Source Department *
                  </Label>
                  <select 
                    value={actionForm.departmentId} 
                    onChange={(e) => setActionForm({...actionForm, departmentId: e.target.value})}
                    className="h-14 rounded-2xl border-2 border-indigo-100 bg-white px-4 py-2 text-base font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-500/10 hover:border-indigo-200"
                  >
                    <option value="" className="text-slate-400">Select Source...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex items-center justify-center -my-2 z-10">
                  <div className="absolute w-full h-[2px] border-t-2 border-dashed border-indigo-200" />
                  <div className="bg-white p-3 rounded-full shadow-md border border-indigo-100 relative z-10 animate-bounce hover:animate-none hover:scale-110 transition-transform">
                    <ArrowRightLeft className="h-5 w-5 text-indigo-600 rotate-90 sm:rotate-0" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-bold tracking-wide text-indigo-900 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Destination Department *
                  </Label>
                  <select 
                    value={actionForm.toDepartmentId} 
                    onChange={(e) => setActionForm({...actionForm, toDepartmentId: e.target.value})}
                    className="h-14 rounded-2xl border-2 border-indigo-100 bg-white px-4 py-2 text-base font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-500/10 hover:border-indigo-200"
                  >
                    <option value="" className="text-slate-400">Select Destination...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              (actionType === 'ISSUE' || actionType === 'RETURN') && (
                <div className="grid gap-2">
                  <Label className="font-bold">
                    Department *
                  </Label>
                  <select 
                    value={actionForm.departmentId} 
                    onChange={(e) => setActionForm({...actionForm, departmentId: e.target.value})}
                    className="h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold">Quantity *</Label>
                <Input type="number" min="1" max={actionType === 'ISSUE' || actionType === 'DISCARD' ? selectedStock?.availableQuantity : undefined} value={actionForm.quantity} onChange={(e) => setActionForm({...actionForm, quantity: Number(e.target.value)})} className="h-12 rounded-xl" />
              </div>

              <div className="grid gap-2">
                <Label className="font-bold">Date *</Label>
                <Input type="date" value={actionForm.transactionDate} onChange={(e) => setActionForm({...actionForm, transactionDate: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold">Remarks / Reason</Label>
              <Input value={actionForm.remark} onChange={(e) => setActionForm({...actionForm, remark: e.target.value})} className="h-12 rounded-xl" placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionOpen(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button onClick={handleActionSubmit} className={`rounded-xl h-12 flex-1 font-bold text-white ${actionType === 'ISSUE' ? 'bg-orange-500 hover:bg-orange-600' : actionType === 'RETURN' ? 'bg-emerald-500 hover:bg-emerald-600' : actionType === 'TRANSFER' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
              Confirm {actionType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
