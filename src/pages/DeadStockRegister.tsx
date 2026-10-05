"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, Plus, Send, Undo2, Trash2, ArrowRightLeft, Upload, FileSpreadsheet,
  Table as TableIcon, LayoutGrid, Search, Filter, Building2, Coins, TrendingUp, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import baseUrl from "@/utils/base-urls";
import ApiService from "@/services/ApiService";

import { 
  useGetDeadStocksQuery, 
  useCreateDeadStockMutation,
  useImportDeadStockExcelMutation,
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
  const [importDeadStock, { isLoading: isImporting }] = useImportDeadStockExcelMutation();
  const [issueStock] = useIssueDeadStockMutation();
  const [returnStock] = useReturnDeadStockMutation();
  const [discardStock] = useDiscardDeadStockMutation();
  const [transferStock] = useTransferDeadStockMutation();

  // View & Filter States
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

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
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add", description: error?.data?.message || "Error" });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await ApiService.get('dead-stocks/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Dead_Stock_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Download Failed", description: "Could not download template" });
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast({ variant: "destructive", title: "No file selected", description: "Please select an Excel or CSV file" });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await importDeadStock(formData).unwrap();
      toast({ title: "Import Successful", description: res.message || `Imported ${res.count} stock items` });
      setIsImportOpen(false);
      setImportFile(null);
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import Failed", description: error?.data?.message || "Error importing file" });
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
        if (!actionForm.departmentId) {
          toast({ variant: "destructive", title: "Error", description: "Department is required to issue stock" });
          return;
        }
        await issueStock(payload).unwrap();
        toast({ title: "Stock issued successfully" });
      } else if (actionType === 'RETURN') {
        if (!actionForm.departmentId) {
          toast({ variant: "destructive", title: "Error", description: "Department is required to return stock" });
          return;
        }
        await returnStock(payload).unwrap();
        toast({ title: "Stock returned successfully" });
      } else if (actionType === 'DISCARD') {
        await discardStock(payload).unwrap();
        toast({ title: "Stock discarded successfully" });
      } else if (actionType === 'TRANSFER') {
        if (!actionForm.departmentId || !actionForm.toDepartmentId) {
          toast({ variant: "destructive", title: "Error", description: "Source and Destination departments are required for transfer" });
          return;
        }
        if (actionForm.departmentId === actionForm.toDepartmentId) {
          toast({ variant: "destructive", title: "Error", description: "Source and Destination departments cannot be the same" });
          return;
        }
        await transferStock({
          ...payload,
          toDepartmentId: Number(actionForm.toDepartmentId)
        }).unwrap();
        toast({ title: "Stock transferred successfully" });
      }
      setIsActionOpen(false);
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error?.data?.message || "Error" });
    }
  };

  // Filtered Dead Stocks
  const filteredStocks = useMemo(() => {
    return deadStocks.filter((stock) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        stock.itemName.toLowerCase().includes(q) ||
        (stock.invoiceNumber && stock.invoiceNumber.toLowerCase().includes(q)) ||
        (stock.supplierName && stock.supplierName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedDeptFilter === "ALL") return true;
      if (selectedDeptFilter === "STORE") return stock.availableQuantity > 0;

      // Check if stock has any issue transaction for this department
      const hasDept = stock.transactions?.some(
        (t) => t.departmentId === Number(selectedDeptFilter) && t.transactionType === 'ISSUE'
      );
      return hasDept;
    });
  }, [deadStocks, searchQuery, selectedDeptFilter]);

  // Overall KPI Statistics
  const stats = useMemo(() => {
    const totalItems = deadStocks.length;
    const totalQty = deadStocks.reduce((sum, s) => sum + (s.totalQuantity || 0), 0);
    const availableQty = deadStocks.reduce((sum, s) => sum + (s.availableQuantity || 0), 0);
    const totalCost = deadStocks.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    return { totalItems, totalQty, availableQty, totalCost };
  }, [deadStocks]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading dead stock register...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-[95rem] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="h-9 w-9 text-primary" />
            Dead Stock Register
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
            Master inventory register for tracking stock purchases, department allocations, and stock movements
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="rounded-2xl h-12 px-5 border-slate-200 hover:bg-slate-50 font-bold text-sm shadow-sm"
          >
            <Upload className="mr-2 h-4 w-4 text-emerald-600" />
            Bulk Import (Excel)
          </Button>
          <Button
            onClick={openAdd}
            className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Stock
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md shadow-slate-100 rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered Items</p>
              <p className="text-3xl font-black mt-1">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Package className="h-6 w-6 text-slate-200" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md shadow-slate-100 rounded-2xl p-4 bg-white border border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quantity</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalQty} <span className="text-xs font-medium text-slate-500">units</span></p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md shadow-slate-100 rounded-2xl p-4 bg-white border border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Central Store Available</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{stats.availableQty} <span className="text-xs font-medium text-slate-500">units</span></p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md shadow-slate-100 rounded-2xl p-4 bg-white border border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inventory Valuation</p>
              <p className="text-3xl font-black text-indigo-700 mt-1">₹{stats.totalCost.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Coins className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-100 gap-4 shadow-sm">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by item name, invoice #, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 text-sm font-medium"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm focus:outline-none"
            >
              <option value="ALL">All Departments & Store</option>
              <option value="STORE">In Central Store Only</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end md:self-auto">
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            onClick={() => setViewMode('table')}
            className={`rounded-lg h-9 px-3 text-xs font-bold ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-600'}`}
          >
            <TableIcon className="mr-1.5 h-3.5 w-3.5" /> Data Register Table
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className={`rounded-lg h-9 px-3 text-xs font-bold ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-600'}`}
          >
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Cards Grid
          </Button>
        </div>
      </div>

      {/* Main Register Table View */}
      {viewMode === 'table' ? (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 w-16 text-center">Sr #</th>
                  <th className="p-4">Item Name / Particulars</th>
                  <th className="p-4">Invoice & Supplier</th>
                  <th className="p-4 text-center">Total Qty</th>
                  <th className="p-4 text-center">Available</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-right">Total Cost</th>
                  <th className="p-4 text-center">Status / Allocation</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                      No stock records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock, idx) => {
                    const isFullyIssued = stock.availableQuantity === 0;
                    const isPartiallyIssued = stock.availableQuantity > 0 && stock.availableQuantity < stock.totalQuantity;

                    return (
                      <tr key={stock.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-center font-bold text-slate-400">
                          #{stock.id}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span className="text-base text-slate-900">{stock.itemName}</span>
                            {stock.purchaseDate && (
                              <span className="text-xs text-slate-400 font-normal mt-0.5">Purchased: {stock.purchaseDate}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{stock.supplierName || "N/A"}</span>
                            {stock.invoiceNumber && (
                              <span className="text-xs text-slate-400 font-medium">Inv: {stock.invoiceNumber}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-800">
                          {stock.totalQuantity}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={`font-bold ${isFullyIssued ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'}`}>
                            {stock.availableQuantity}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-600">
                          ₹{stock.unitPrice ? stock.unitPrice.toLocaleString('en-IN') : 0}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-700">
                          ₹{stock.totalAmount ? stock.totalAmount.toLocaleString('en-IN') : 0}
                        </td>
                        <td className="p-4 text-center">
                          {isFullyIssued ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-semibold">
                              Issued to Dept
                            </Badge>
                          ) : isPartiallyIssued ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                              Partially In Store
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                              In Central Store
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">
                            <Button 
                              size="sm"
                              onClick={() => openAction(stock, 'ISSUE')} 
                              disabled={stock.availableQuantity < 1} 
                              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white"
                              title="Issue Stock to Department"
                            >
                              <Send className="h-3 w-3 mr-1" /> Issue
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => openAction(stock, 'RETURN')} 
                              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                              title="Return Stock to Central Store"
                            >
                              <Undo2 className="h-3 w-3 mr-1" /> Return
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => openAction(stock, 'TRANSFER')} 
                              disabled={stock.availableQuantity < 1} 
                              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white"
                              title="Transfer between Departments"
                            >
                              <ArrowRightLeft className="h-3 w-3 mr-1" /> Transfer
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => openAction(stock, 'DISCARD')} 
                              disabled={stock.availableQuantity < 1} 
                              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white"
                              title="Discard Stock"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Discard
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredStocks.map((stock) => (
              <motion.div
                key={stock.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col bg-white">
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
                        <p className="text-emerald-500 font-bold mb-1">Total Cost</p>
                        <p className="text-lg font-black text-emerald-700">₹{stock.totalAmount}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <Button 
                        onClick={() => openAction(stock, 'ISSUE')} 
                        disabled={stock.availableQuantity < 1} 
                        className="rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                      >
                        <Send className="mr-2 h-4 w-4" /> Issue
                      </Button>
                      <Button 
                        onClick={() => openAction(stock, 'RETURN')} 
                        className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      >
                        <Undo2 className="mr-2 h-4 w-4" /> Return
                      </Button>
                      <Button 
                        onClick={() => openAction(stock, 'TRANSFER')} 
                        disabled={stock.availableQuantity < 1} 
                        className="rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                      </Button>
                      <Button 
                        onClick={() => openAction(stock, 'DISCARD')} 
                        disabled={stock.availableQuantity < 1} 
                        className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
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
      )}

      {/* Add Stock Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Dead Stock Purchase</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemName" className="font-bold">Item Name *</Label>
              <Input id="itemName" value={addForm.itemName} onChange={(e) => setAddForm({...addForm, itemName: e.target.value})} className="h-12 rounded-xl" placeholder="e.g. Projector Epson EB-X06" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber" className="font-bold">Invoice Number</Label>
                <Input id="invoiceNumber" value={addForm.invoiceNumber} onChange={(e) => setAddForm({...addForm, invoiceNumber: e.target.value})} className="h-12 rounded-xl" placeholder="INV-10293" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplierName" className="font-bold">Supplier Name</Label>
                <Input id="supplierName" value={addForm.supplierName} onChange={(e) => setAddForm({...addForm, supplierName: e.target.value})} className="h-12 rounded-xl" placeholder="ABC Electronics" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unitPrice" className="font-bold">Unit Price (₹)</Label>
                <Input id="unitPrice" type="number" min="0" value={addForm.unitPrice} onChange={(e) => setAddForm({...addForm, unitPrice: Number(e.target.value)})} className="h-12 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalQuantity" className="font-bold">Total Quantity *</Label>
                <Input id="totalQuantity" type="number" min="1" value={addForm.totalQuantity} onChange={(e) => setAddForm({...addForm, totalQuantity: Number(e.target.value)})} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate" className="font-bold">Purchase Date</Label>
                <Input id="purchaseDate" type="date" value={addForm.purchaseDate} onChange={(e) => setAddForm({...addForm, purchaseDate: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate" className="font-bold">Expiry Date</Label>
                <Input id="expiryDate" type="date" value={addForm.expiryDate} onChange={(e) => setAddForm({...addForm, expiryDate: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button onClick={handleAddSubmit} className="rounded-xl h-12 flex-1 font-bold">Save Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Upload className="h-6 w-6 text-emerald-600" />
              Bulk Import Dead Stock
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <p className="text-sm text-slate-500">
              Upload an Excel (.xlsx, .xls) or CSV file containing your dead stock inventory records.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Need the format template?</p>
                <p className="text-xs text-slate-500">Download sample Excel structure</p>
              </div>
              <Button
                type="button"
                onClick={handleDownloadTemplate}
                variant="outline"
                className="inline-flex items-center gap-1 text-xs font-bold bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors shadow-sm h-auto"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileInput" className="font-semibold text-slate-700">Select File (.xlsx, .xls, .csv)</Label>
              <Input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="rounded-xl border-slate-200 cursor-pointer"
              />
              {importFile && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl mt-2 border border-emerald-200">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>{importFile.name}</span>
                  <span className="text-slate-400">({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={!importFile || isImporting}
              className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? "Importing..." : "Upload & Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Issue, Return, Discard, Transfer) */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {actionType} Stock: {selectedStock?.itemName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            {actionType === 'TRANSFER' ? (
              <div className="grid gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="grid gap-2">
                  <Label className="text-sm font-bold tracking-wide text-indigo-900 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" /> Source Department *
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
                  <div className="bg-white p-3 rounded-full shadow-md border border-indigo-100 relative z-10">
                    <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
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
                    className="h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm"
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
