// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "@/hooks/use-toast"
// import { useTranslation } from "@/redux/hooks/useTranslation"
// import { Search, Plus, RefreshCw, Edit, Trash2, DollarSign, Percent, AlertCircle } from "lucide-react"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog"

// // Mock data types
// interface SalaryComponent {
//   id: number
//   name: string
//   code: string
//   type: "Earning" | "Deduction" | "Benefit"
//   description: string
//   isPercentageBased: boolean
//   defaultValue: number
//   defaultPercentage?: number
//   isActive: boolean
//   isSystemDefined: boolean
//   createdAt: string
// }

// // Mock data
// const mockSalaryComponents: SalaryComponent[] = [
//   {
//     id: 1,
//     name: "Basic Salary",
//     code: "BASIC",
//     type: "Earning",
//     description: "Base salary component that forms the core of the salary structure",
//     isPercentageBased: true,
//     defaultValue: 0,
//     defaultPercentage: 50,
//     isActive: true,
//     isSystemDefined: true,
//     createdAt: "2023-01-15",
//   },
//   {
//     id: 2,
//     name: "House Rent Allowance",
//     code: "HRA",
//     type: "Earning",
//     description: "Allowance provided to employees for rental accommodation",
//     isPercentageBased: true,
//     defaultValue: 0,
//     defaultPercentage: 20,
//     isActive: true,
//     isSystemDefined: true,
//     createdAt: "2023-01-15",
//   },
//   {
//     id: 3,
//     name: "Dearness Allowance",
//     code: "DA",
//     type: "Earning",
//     description: "Allowance to compensate for inflation and rising cost of living",
//     isPercentageBased: true,
//     defaultValue: 0,
//     defaultPercentage: 10,
//     isActive: true,
//     isSystemDefined: true,
//     createdAt: "2023-01-15",
//   },
//   {
//     id: 4,
//     name: "Transport Allowance",
//     code: "TA",
//     type: "Earning",
//     description: "Allowance for commuting to and from work",
//     isPercentageBased: false,
//     defaultValue: 3000,
//     isActive: true,
//     isSystemDefined: false,
//     createdAt: "2023-01-20",
//   },
//   {
//     id: 5,
//     name: "Special Allowance",
//     code: "SA",
//     type: "Earning",
//     description: "Additional allowance based on role and responsibilities",
//     isPercentageBased: false,
//     defaultValue: 5000,
//     isActive: true,
//     isSystemDefined: false,
//     createdAt: "2023-01-20",
//   },
//   {
//     id: 6,
//     name: "Provident Fund",
//     code: "PF",
//     type: "Deduction",
//     description: "Employee contribution to provident fund",
//     isPercentageBased: true,
//     defaultValue: 0,
//     defaultPercentage: 6,
//     isActive: true,
//     isSystemDefined: true,
//     createdAt: "2023-01-15",
//   },
//   {
//     id: 7,
//     name: "Professional Tax",
//     code: "PT",
//     type: "Deduction",
//     description: "Tax levied by state governments on professions, trades, and employments",
//     isPercentageBased: false,
//     defaultValue: 200,
//     isActive: true,
//     isSystemDefined: true,
//     createdAt: "2023-01-15",
//   },
//   {
//     id: 8,
//     name: "Income Tax",
//     code: "IT",
//     type: "Deduction",
//     description: "Tax deducted at source from employee's salary",
//     isPercentageBased: false,
//     defaultValue: 0,
//     isActive: true,
//     isSystemDefined: true,
//     createdAt: "2023-01-15",
//   },
//   {
//     id: 9,
//     name: "Health Insurance",
//     code: "HI",
//     type: "Benefit",
//     description: "Employee health insurance premium",
//     isPercentageBased: false,
//     defaultValue: 1000,
//     isActive: true,
//     isSystemDefined: false,
//     createdAt: "2023-02-10",
//   },
//   {
//     id: 10,
//     name: "Meal Vouchers",
//     code: "MV",
//     type: "Benefit",
//     description: "Food allowance provided as meal vouchers",
//     isPercentageBased: false,
//     defaultValue: 2000,
//     isActive: false,
//     isSystemDefined: false,
//     createdAt: "2023-02-10",
//   },
//   {
//     id: 11,
//     name: "Leadership Allowance",
//     code: "LA",
//     type: "Benefit",
//     description: "Additional allowance for employees in leadership positions",
//     isPercentageBased: false,
//     defaultValue: 5000,
//     isActive: true,
//     isSystemDefined: false,
//     createdAt: "2023-03-05",
//   },
// ]

// const SalaryComponents = () => {
//   const { t } = useTranslation()

//   // State for components and UI
//   const [components, setComponents] = useState<SalaryComponent[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [isRefreshing, setIsRefreshing] = useState(false)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedType, setSelectedType] = useState("All")
//   const [activeTab, setActiveTab] = useState("all")

//   // State for component dialog
//   const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false)
//   const [isEditMode, setIsEditMode] = useState(false)
//   const [selectedComponent, setSelectedComponent] = useState<SalaryComponent | null>(null)

//   // State for delete confirmation
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
//   const [componentToDelete, setComponentToDelete] = useState<SalaryComponent | null>(null)

//   // Form state
//   const [formData, setFormData] = useState({
//     name: "",
//     code: "",
//     type: "Earning" as "Earning" | "Deduction" | "Benefit",
//     description: "",
//     isPercentageBased: false,
//     defaultValue: 0,
//     defaultPercentage: 0,
//     isActive: true,
//   })

//   // Load data with simulated delay
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setComponents(mockSalaryComponents)
//       setIsLoading(false)
//     }, 1000)

//     return () => clearTimeout(timer)
//   }, [])

//   // Handle refresh
//   const handleRefresh = () => {
//     setIsRefreshing(true)
//     setTimeout(() => {
//       setComponents(mockSalaryComponents)
//       setIsRefreshing(false)
//       toast({
//         title: "Data refreshed",
//         description: "Salary components have been updated",
//       })
//     }, 800)
//   }

//   // Filter components based on search, type, and tab
//   const filteredComponents = components.filter((component) => {
//     const matchesSearch =
//       component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       component.code.toLowerCase().includes(searchTerm.toLowerCase())

//     const matchesType = selectedType === "All" || component.type === selectedType

//     const matchesTab =
//       activeTab === "all" ||
//       (activeTab === "active" && component.isActive) ||
//       (activeTab === "inactive" && !component.isActive)

//     return matchesSearch && matchesType && matchesTab
//   })

//   // Handle add new component
//   const handleAddComponent = () => {
//     setIsEditMode(false)
//     setSelectedComponent(null)
//     setFormData({
//       name: "",
//       code: "",
//       type: "Earning",
//       description: "",
//       isPercentageBased: false,
//       defaultValue: 0,
//       defaultPercentage: 0,
//       isActive: true,
//     })
//     setIsComponentDialogOpen(true)
//   }

//   // Handle edit component
//   const handleEditComponent = (component: SalaryComponent) => {
//     setIsEditMode(true)
//     setSelectedComponent(component)
//     setFormData({
//       name: component.name,
//       code: component.code,
//       type: component.type,
//       description: component.description,
//       isPercentageBased: component.isPercentageBased,
//       defaultValue: component.defaultValue,
//       defaultPercentage: component.defaultPercentage || 0,
//       isActive: component.isActive,
//     })
//     setIsComponentDialogOpen(true)
//   }

//   // Handle delete component
//   const handleDeleteComponent = (component: SalaryComponent) => {
//     setComponentToDelete(component)
//     setIsDeleteDialogOpen(true)
//   }

//   // Handle form input change
//   const handleInputChange = (field: string, value: any) => {
//     setFormData({
//       ...formData,
//       [field]: value,
//     })
//   }

//   // Handle form submission
//   const handleSubmitComponent = () => {
//     if (isEditMode && selectedComponent) {
//       // Update existing component
//       const updatedComponents = components.map((comp) =>
//         comp.id === selectedComponent.id
//           ? {
//               ...comp,
//               name: formData.name,
//               code: formData.code,
//               type: formData.type,
//               description: formData.description,
//               isPercentageBased: formData.isPercentageBased,
//               defaultValue: formData.defaultValue,
//               defaultPercentage: formData.isPercentageBased ? formData.defaultPercentage : undefined,
//               isActive: formData.isActive,
//             }
//           : comp,
//       )

//       setComponents(updatedComponents)
//       toast({
//         title: "Component updated",
//         description: `${formData.name} has been updated successfully`,
//       })
//     } else {
//       // Add new component
//       const newComponent: SalaryComponent = {
//         id: components.length + 1,
//         name: formData.name,
//         code: formData.code,
//         type: formData.type,
//         description: formData.description,
//         isPercentageBased: formData.isPercentageBased,
//         defaultValue: formData.defaultValue,
//         defaultPercentage: formData.isPercentageBased ? formData.defaultPercentage : undefined,
//         isActive: formData.isActive,
//         isSystemDefined: false,
//         createdAt: new Date().toISOString().split("T")[0],
//       }

//       setComponents([...components, newComponent])
//       toast({
//         title: "Component added",
//         description: `${formData.name} has been added successfully`,
//       })
//     }

//     setIsComponentDialogOpen(false)
//   }

//   // Handle confirm delete
//   const handleConfirmDelete = () => {
//     if (componentToDelete) {
//       const updatedComponents = components.filter((comp) => comp.id !== componentToDelete.id)
//       setComponents(updatedComponents)

//       toast({
//         title: "Component deleted",
//         description: `${componentToDelete.name} has been deleted successfully`,
//         variant: "destructive",
//       })

//       setIsDeleteDialogOpen(false)
//       setComponentToDelete(null)
//     }
//   }

//   // Format date
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
//   }

//   if (isLoading) {
//     return (
//       <div className="container mx-auto py-6 space-y-6">
//         <div className="flex justify-between items-center">
//           <Skeleton className="h-8 w-64" />
//           <Skeleton className="h-10 w-32" />
//         </div>

//         <Card>
//           <CardHeader>
//             <Skeleton className="h-6 w-48 mb-2" />
//             <Skeleton className="h-4 w-72" />
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="flex justify-between">
//                 <Skeleton className="h-10 w-[300px]" />
//                 <Skeleton className="h-10 w-[200px]" />
//               </div>

//               <Skeleton className="h-64 w-full" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto py-6 space-y-6">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">{t("salary_components")}</h1>
//           <p className="text-muted-foreground mt-1">{t("manage_salary_components_for_payroll_calculation")}</p>
//         </div>

//         <div className="flex gap-2">
//           <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
//             <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
//           </Button>

//           <Button onClick={handleAddComponent}>
//             <Plus className="mr-2 h-4 w-4" />
//             {t("add_component")}
//           </Button>
//         </div>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>{t("salary_components")}</CardTitle>
//           <CardDescription>{t("create_and_manage_salary_components_for_employee_payroll")}</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Tabs */}
//           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//             <TabsList className="grid grid-cols-3 w-full">
//               <TabsTrigger value="all">{t("all_components")}</TabsTrigger>
//               <TabsTrigger value="active">{t("active")}</TabsTrigger>
//               <TabsTrigger value="inactive">{t("inactive")}</TabsTrigger>
//             </TabsList>
//           </Tabs>

//           {/* Filters */}
//           <div className="flex flex-col sm:flex-row justify-between gap-4">
//             <div className="flex flex-col sm:flex-row gap-4">
//               <Select value={selectedType} onValueChange={setSelectedType}>
//                 <SelectTrigger className="w-[180px]">
//                   <SelectValue placeholder={t("component_type")} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="All">{t("all_types")}</SelectItem>
//                   <SelectItem value="Earning">{t("earnings")}</SelectItem>
//                   <SelectItem value="Deduction">{t("deductions")}</SelectItem>
//                   <SelectItem value="Benefit">{t("benefits")}</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 placeholder={t("search_by_name_or_code")}
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10 w-full sm:w-[300px]"
//               />
//             </div>
//           </div>

//           {/* Components Table */}
//           <div className="rounded-md border">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>{t("name")}</TableHead>
//                   <TableHead>{t("code")}</TableHead>
//                   <TableHead>{t("type")}</TableHead>
//                   <TableHead>{t("calculation_method")}</TableHead>
//                   <TableHead>{t("default_value")}</TableHead>
//                   <TableHead>{t("status")}</TableHead>
//                   <TableHead>{t("actions")}</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredComponents.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
//                       {searchTerm || selectedType !== "All"
//                         ? t("no_components_match_your_search_criteria")
//                         : t("no_components_found")}
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   filteredComponents.map((component) => (
//                     <TableRow key={component.id} className="hover:bg-muted/50">
//                       <TableCell className="font-medium">{component.name}</TableCell>
//                       <TableCell>{component.code}</TableCell>
//                       <TableCell>
//                         <Badge
//                           variant="outline"
//                           className={
//                             component.type === "Earning"
//                               ? "bg-green-50 text-green-700 border-green-200"
//                               : component.type === "Deduction"
//                                 ? "bg-red-50 text-red-700 border-red-200"
//                                 : "bg-blue-50 text-blue-700 border-blue-200"
//                           }
//                         >
//                           {component.type}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {component.isPercentageBased ? (
//                           <div className="flex items-center">
//                             <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
//                             {t("percentage_based")}
//                           </div>
//                         ) : (
//                           <div className="flex items-center">
//                             <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
//                             {t("fixed_amount")}
//                           </div>
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         {component.isPercentageBased
//                           ? `${component.defaultPercentage}%`
//                           : `₹${component.defaultValue.toLocaleString("en-IN")}`}
//                       </TableCell>
//                       <TableCell>
//                         <Badge variant={component.isActive ? "default" : "secondary"}>
//                           {component.isActive ? t("active") : t("inactive")}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex space-x-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleEditComponent(component)}
//                             disabled={component.isSystemDefined}
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteComponent(component)}
//                             disabled={component.isSystemDefined}
//                             className="text-red-500 hover:text-red-700"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Component Dialog */}
//       <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
//         <DialogContent className="sm:max-w-[600px]">
//           <DialogHeader>
//             <DialogTitle>{isEditMode ? t("edit_salary_component") : t("add_salary_component")}</DialogTitle>
//             <DialogDescription>
//               {isEditMode
//                 ? t("update_the_details_of_the_salary_component")
//                 : t("create_a_new_salary_component_for_payroll_calculation")}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="grid gap-4 py-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="name">{t("component_name")}</Label>
//                 <Input
//                   id="name"
//                   value={formData.name}
//                   onChange={(e) => handleInputChange("name", e.target.value)}
//                   placeholder={t("e.g._basic_salary")}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="code">{t("component_code")}</Label>
//                 <Input
//                   id="code"
//                   value={formData.code}
//                   onChange={(e) => handleInputChange("code", e.target.value)}
//                   placeholder={t("e.g._basic")}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="type">{t("component_type")}</Label>
//               <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
//                 <SelectTrigger>
//                   <SelectValue placeholder={t("select_component_type")} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Earning">{t("earning")}</SelectItem>
//                   <SelectItem value="Deduction">{t("deduction")}</SelectItem>
//                   <SelectItem value="Benefit">{t("benefit")}</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="description">{t("description")}</Label>
//               <Textarea
//                 id="description"
//                 value={formData.description}
//                 onChange={(e) => handleInputChange("description", e.target.value)}
//                 placeholder={t("enter_component_description")}
//                 rows={3}
//               />
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center space-x-2">
//                 <Switch
//                   id="isPercentageBased"
//                   checked={formData.isPercentageBased}
//                   onCheckedChange={(checked) => handleInputChange("isPercentageBased", checked)}
//                 />
//                 <Label htmlFor="isPercentageBased">{t("percentage_based_calculation")}</Label>
//               </div>
//               <p className="text-sm text-muted-foreground">
//                 {formData.isPercentageBased
//                   ? t("this_component_will_be_calculated_as_a_percentage_of_the_base_salary")
//                   : t("this_component_will_be_a_fixed_amount")}
//               </p>
//             </div>

//             {formData.isPercentageBased ? (
//               <div className="space-y-2">
//                 <Label htmlFor="defaultPercentage">{t("default_percentage")}</Label>
//                 <div className="flex items-center">
//                   <Input
//                     id="defaultPercentage"
//                     type="number"
//                     value={formData.defaultPercentage}
//                     onChange={(e) => handleInputChange("defaultPercentage", Number(e.target.value))}
//                     className="w-24"
//                   />
//                   <span className="ml-2">%</span>
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 <Label htmlFor="defaultValue">{t("default_amount")}</Label>
//                 <div className="flex items-center">
//                   <span className="mr-2">₹</span>
//                   <Input
//                     id="defaultValue"
//                     type="number"
//                     value={formData.defaultValue}
//                     onChange={(e) => handleInputChange("defaultValue", Number(e.target.value))}
//                   />
//                 </div>
//               </div>
//             )}

//             <div className="flex items-center space-x-2">
//               <Switch
//                 id="isActive"
//                 checked={formData.isActive}
//                 onCheckedChange={(checked) => handleInputChange("isActive", checked)}
//               />
//               <Label htmlFor="isActive">{t("active")}</Label>
//             </div>
//           </div>

//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsComponentDialogOpen(false)}>
//               {t("cancel")}
//             </Button>
//             <Button type="submit" onClick={handleSubmitComponent}>
//               {isEditMode ? t("update_component") : t("add_component")}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>{t("delete_salary_component")}</AlertDialogTitle>
//             <AlertDialogDescription>
//               {t("are_you_sure_you_want_to_delete_this_component")}? {t("this_action_cannot_be_undone")}.
//               <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
//                 <div className="flex items-start">
//                   <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
//                   <div>
//                     <p className="font-medium text-amber-700">{t("warning")}</p>
//                     <p className="text-sm text-amber-600">
//                       {t(
//                         "deleting_this_component_may_affect_existing_salary_templates_and_employee_payroll_calculations",
//                       )}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
//             <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
//               {t("delete")}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   )
// }

// export default SalaryComponents
