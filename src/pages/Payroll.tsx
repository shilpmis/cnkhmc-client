// import type React from "react"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { MoreHorizontal, Plus, FileDown, Pencil, Trash, ToggleLeft, ToggleRight } from "lucide-react"
// import type { PayrollEntry } from "../types/payroll"
// import { AddPayrollForm } from "@/components/Payroll/AddPayrollForm"
// import { EditPayrollForm } from "@/components/Payroll/EditPayrollForm"
// import { PayrollPolicy, Policy } from "@/components/Payroll/PayrollPolicy"
// import PayrollTable from "@/components/Payroll/PayrollTable"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
// import { Label } from "@/components/ui/label"
// import { SaralPagination } from "@/components/ui/common/SaralPagination"

// const initialPayrollData: PayrollEntry[] = [
//   {
//     id: 1,
//     name: "John Doe",
//     role: "Teacher",
//     category: "teaching",
//     active: true,
//     salary: {
//       basic: 2000,
//       gradePay: 10000,
//       inflation: 2000,
//       houseRentAllowance: 1000,
//       permanentTravel: 2000,
//       medicalAllowance: 2000,
//       localAllowance: 2000,
//       principalsAllowance: 1000,
//       supervisor: 2000,
//       highMedianAllowance: 1000,
//       cashAllowance: 1000,
//       disabilityAllowance: 1000,
//       chargeAllowance: 2000,
//       transportAllowance: 1000,
//       ncash: 2000,
//       ltc: 1000,
//       specialSalary: 1000,
//       bonus: 1000,
//       ariasAllowance: 2000,
//       additionalInflation: 2000,
//       interimRelief: 3000,
//       other: 1000,
//       otherSalaryReason: "",
//     },
//     deductions: {
//       gpf: 2000,
//       cpf: 0,
//       gpfLoan: 1000,
//       cpfLoan: 1000,
//       housingLoan: 1000,
//       incomeTax: 0,
//       professionalTax: 1000,
//       insuranceDeduction: 1000,
//       grainAdvance: 1000,
//       festivalPrelude: 1000,
//       cooperativeSociety1: 1000,
//       cooperativeSociety2: 1000,
//       recovery: 1000,
//       groupInsurance: 1000,
//       retailDiscount1: 1000,
//       additionalGPF: 1000,
//       ple: 1000,
//       otherDeductions: 1000,
//       otherDeductionReason: "",
//     },
//     lastPayDate: "2023-05-01",
//   },
//   {
//     id: 2,
//     name: "Jane Smith",
//     role: "Librarian",
//     category: "non-teaching",
//     active: true,
//     salary: {
//       basic: 1500,
//       gradePay: 8000,
//       inflation: 1500,
//       houseRentAllowance: 1200,
//       permanentTravel: 1500,
//       medicalAllowance: 1800,
//       localAllowance: 1700,
//       principalsAllowance: 0,
//       supervisor: 1800,
//       highMedianAllowance: 1500,
//       cashAllowance: 1500,
//       disabilityAllowance: 0,
//       chargeAllowance: 1200,
//       transportAllowance: 1100,
//       ncash: 1200,
//       ltc: 1400,
//       specialSalary: 0,
//       bonus: 1200,
//       ariasAllowance: 1000,
//       additionalInflation: 1500,
//       interimRelief: 2500,
//       other: 0,
//       otherSalaryReason: "",
//     },
//     deductions: {
//       gpf: 1000,
//       cpf: 0,
//       gpfLoan: 800,
//       cpfLoan: 0,
//       housingLoan: 900,
//       incomeTax: 500,
//       professionalTax: 700,
//       insuranceDeduction: 1200,
//       grainAdvance: 0,
//       festivalPrelude: 900,
//       cooperativeSociety1: 1100,
//       cooperativeSociety2: 0,
//       recovery: 800,
//       groupInsurance: 1000,
//       retailDiscount1: 900,
//       additionalGPF: 0,
//       ple: 1000,
//       otherDeductions: 1000,
//       otherDeductionReason: "",
//     },
//     lastPayDate: "2023-06-15",
//   },
//   {
//     id: 3,
//     name: "Alice Johnson",
//     role: "Science Teacher",
//     category: "teaching",
//     active: false,
//     salary: {
//       basic: 1800,
//       gradePay: 9500,
//       inflation: 1900,
//       houseRentAllowance: 1300,
//       permanentTravel: 1500,
//       medicalAllowance: 1400,
//       localAllowance: 1600,
//       principalsAllowance: 0,
//       supervisor: 1700,
//       highMedianAllowance: 1600,
//       cashAllowance: 1500,
//       disabilityAllowance: 0,
//       chargeAllowance: 0,
//       transportAllowance: 1200,
//       ncash: 1400,
//       ltc: 1300,
//       specialSalary: 0,
//       bonus: 0,
//       ariasAllowance: 1300,
//       additionalInflation: 1200,
//       interimRelief: 2200,
//       other: 0,
//       otherSalaryReason: "",
//     },
//     deductions: {
//       gpf: 900,
//       cpf: 0,
//       gpfLoan: 800,
//       cpfLoan: 0,
//       housingLoan: 700,
//       incomeTax: 600,
//       professionalTax: 700,
//       insuranceDeduction: 1000,
//       grainAdvance: 0,
//       festivalPrelude: 700,
//       cooperativeSociety1: 800,
//       cooperativeSociety2: 0,
//       recovery: 600,
//       groupInsurance: 900,
//       retailDiscount1: 0,
//       additionalGPF: 700,
//       ple: 800,
//       otherDeductions: 800,
//       otherDeductionReason: "",
//     },
//     lastPayDate: "2023-04-20",
//   },
//   // 9 More Mock Data Entries Below (Truncated for Brevity)
// ];

// export const Payroll: React.FC = () => {

//   const [payrollData, setPayrollData] = useState<PayrollEntry[]>(initialPayrollData)
//   const [isAddPayrollOpen, setIsAddPayrollOpen] = useState(false)
//   const [isEditPayrollOpen, setIsEditPayrollOpen] = useState(false)
//   const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null)
//   const [policies, setPolicies] = useState<Policy[]>([])
//   const [currentPage, setCurrentPage] = useState(1);

//   const handleAddPayroll = (newEntry: PayrollEntry) => {
//     setPayrollData([...payrollData, { ...newEntry, id: payrollData.length + 1 }])
//     setIsAddPayrollOpen(false)
//   }

//   const handleEditPayroll = (updatedEntry: PayrollEntry) => {
//     setPayrollData(payrollData.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
//     setIsEditPayrollOpen(false)
//   }
  
  
//   const perPageData = 6;
//   const totalRequests = payrollData.length;
//     const totalPages = Math.ceil(totalRequests / perPageData);
  
//     const paginatedData = (page: number): PayrollEntry[] => {
//       const startIndex = (page - 1) * perPageData;
//       return payrollData.slice(startIndex, startIndex + perPageData);
//     };
  
//     const onPageChange = (updatedPage: number) => {
//       setCurrentPage(updatedPage);
//     };
  

//   return (
//     <div className="bg-white shadow-md rounded-lg p-6 max-w-full mx-auto">
//       <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
//         <h2 className="text:xl sm:text-2xl font-bold text-primary mb-4 sm:mb-0">Payroll Management</h2>
//         <div className="flex sm:flex:row space-x-2 sm:space-x-2 sm:justify-end">
//           {/* Add Payroll */}
//           <Dialog open={isAddPayrollOpen} onOpenChange={setIsAddPayrollOpen}>
//             <DialogTrigger asChild>
//               <Button>
//                 <Plus className="mr-2 h-4 w-4" /> Add Payroll
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-[800px]">
//               <DialogHeader>
//                 <DialogTitle>Add New Payroll Entry</DialogTitle>
//               </DialogHeader>
//               <AddPayrollForm
//                 onSubmit={handleAddPayroll}
//                 onCancel={() => setIsAddPayrollOpen(false)}
//                 policies={policies}
//               />
//             </DialogContent>
//           </Dialog>
//           <Button variant="outline">
//             <FileDown className="mr-2 h-4 w-4" /> Export
//           </Button>
//         </div>
//       </div>

//       <PayrollPolicy />
//       <div className="mb-4 mt-4 flex flex-row sm:flex-row justify-between items-center gap-4">
//       <Label htmlFor="search" className="sr-only">
//         Search
//       </Label>
//       <Input
//         id="search"
//         placeholder="Search by name, role, category "
//         value={""}
//         className="max-w-sm"
//       />
//       <Select
//         value={""}
//       >
//         <SelectTrigger className="w-[180px]">
//           <SelectValue
//             placeholder={"Filter By Status"}
//           />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="All">All</SelectItem>
//           <SelectItem value={"Active"}>Active</SelectItem>
//           <SelectItem value={"Inactive"}>Inactive</SelectItem>
//         </SelectContent>
//       </Select>
//     </div>
      
//         <div className="mt-8 w-full overflow-auto">
//           <PayrollTable payrollData={initialPayrollData}/>
//         </div>


//       {/* Edit Payroll */}
//       <Dialog open={isEditPayrollOpen} onOpenChange={setIsEditPayrollOpen}>
//         <DialogContent className="sm:max-w-[800px]">
//           <DialogHeader>
//             <DialogTitle>Edit Payroll Entry</DialogTitle>
//           </DialogHeader>
//           {selectedEntry && (
//             <EditPayrollForm
//             //   entry={selectedEntry}
//               onSubmit={handleEditPayroll}
//               onCancel={() => setIsEditPayrollOpen(false)}
//               policies={policies}
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//       <div className="mt-4 flex justify-between items-center">
//          <SaralPagination
//           currentPage={currentPage}
//           onPageChange={onPageChange}
//           totalPages={totalPages}
//         />
                  
//       </div>
//     </div>
//   )
// }

