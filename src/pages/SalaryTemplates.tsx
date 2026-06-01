"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Search, Edit, Copy, Trash2, Plus, DollarSign, Percent, Check, AlertCircle } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"

interface SalaryTemplate {
  id: string
  name: string
  code: string
  description: string
  applicableRoles: string[]
  baseSalary: number
  components: SalaryComponent[]
  isActive: boolean
}

interface SalaryComponent {
  id: string
  name: string
  type: "Earning" | "Deduction" | "Benefit"
  isPercentageBased: boolean
  defaultValue: number
  defaultPercentage: number
  value: number
  percentage: number
  isActive: boolean
}

const SalaryTemplates = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("All")
  const [templates, setTemplates] = useState<SalaryTemplate[]>([
    {
      id: "1",
      name: "Teacher Grade II",
      code: "TG2",
      description: "Salary template for Teacher Grade II",
      applicableRoles: ["Teacher"],
      baseSalary: 50000,
      components: [
        {
          id: "101",
          name: "Basic Salary",
          type: "Earning",
          isPercentageBased: true,
          defaultValue: 0,
          defaultPercentage: 70,
          value: 35000,
          percentage: 70,
          isActive: true,
        },
        {
          id: "102",
          name: "House Rent Allowance",
          type: "Earning",
          isPercentageBased: true,
          defaultValue: 0,
          defaultPercentage: 10,
          value: 5000,
          percentage: 10,
          isActive: true,
        },
        {
          id: "103",
          name: "Professional Tax",
          type: "Deduction",
          isPercentageBased: false,
          defaultValue: 200,
          defaultPercentage: 0,
          value: 200,
          percentage: 0,
          isActive: true,
        },
      ],
      isActive: true,
    },
    {
      id: "2",
      name: "Accountant",
      code: "ACC1",
      description: "Salary template for Accountant",
      applicableRoles: ["Accountant", "Admin"],
      baseSalary: 40000,
      components: [
        {
          id: "201",
          name: "Basic Salary",
          type: "Earning",
          isPercentageBased: true,
          defaultValue: 0,
          defaultPercentage: 75,
          value: 30000,
          percentage: 75,
          isActive: true,
        },
        {
          id: "202",
          name: "Medical Allowance",
          type: "Benefit",
          isPercentageBased: false,
          defaultValue: 1000,
          defaultPercentage: 0,
          value: 1000,
          percentage: 0,
          isActive: true,
        },
        {
          id: "203",
          name: "Provident Fund",
          type: "Deduction",
          isPercentageBased: true,
          defaultValue: 0,
          defaultPercentage: 12,
          value: 4800,
          percentage: 12,
          isActive: true,
        },
      ],
      isActive: true,
    },
  ])
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState<boolean>(false)
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [templateToDelete, setTemplateToDelete] = useState<SalaryTemplate | null>(null)
  const [formData, setFormData] = useState<SalaryTemplate>({
    id: "",
    name: "",
    code: "",
    description: "",
    applicableRoles: [],
    baseSalary: 0,
    components: [],
    isActive: true,
  })
  const [selectedComponents, setSelectedComponents] = useState<SalaryComponent[]>([])
  const roles = ["Teacher", "Accountant", "Admin", "Principal"]
  const availableSalaryComponents: SalaryComponent[] = [
    {
      id: "301",
      name: "Basic Salary",
      type: "Earning",
      isPercentageBased: true,
      defaultValue: 0,
      defaultPercentage: 70,
      value: 0,
      percentage: 70,
      isActive: true,
    },
    {
      id: "302",
      name: "House Rent Allowance",
      type: "Earning",
      isPercentageBased: true,
      defaultValue: 0,
      defaultPercentage: 10,
      value: 0,
      percentage: 10,
      isActive: true,
    },
    {
      id: "303",
      name: "Medical Allowance",
      type: "Benefit",
      isPercentageBased: false,
      defaultValue: 1000,
      defaultPercentage: 0,
      value: 1000,
      percentage: 0,
      isActive: true,
    },
    {
      id: "304",
      name: "Provident Fund",
      type: "Deduction",
      isPercentageBased: true,
      defaultValue: 0,
      defaultPercentage: 12,
      value: 0,
      percentage: 12,
      isActive: true,
    },
    {
      id: "305",
      name: "Professional Tax",
      type: "Deduction",
      isPercentageBased: false,
      defaultValue: 200,
      defaultPercentage: 0,
      value: 200,
      percentage: 0,
      isActive: true,
    },
    {
      id: "306",
      name: "Transport Allowance",
      type: "Earning",
      isPercentageBased: false,
      defaultValue: 800,
      defaultPercentage: 0,
      value: 800,
      percentage: 0,
      isActive: true,
    },
  ]

  useEffect(() => {
    if (isTemplateDialogOpen) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }

    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isTemplateDialogOpen])

  const filteredTemplates = templates.filter((template) => {
    const searchRegex = new RegExp(searchTerm, "i")
    const roleMatch = selectedRole === "All" || template.applicableRoles.includes(selectedRole)
    return searchRegex.test(template.name) && roleMatch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const calculateNetSalary = (components: SalaryComponent[]) => {
    const totalEarnings = calculateTotalEarnings(components)
    const totalDeductions = calculateTotalDeductions(components)
    const totalBenefits = calculateTotalBenefits(components)
    return totalEarnings - totalDeductions + totalBenefits
  }

  const calculateTotalEarnings = (components: SalaryComponent[]) => {
    return components
      .filter((c) => c.type === "Earning" && c.isActive)
      .reduce((sum, component) => sum + component.value, 0)
  }

  const calculateTotalDeductions = (components: SalaryComponent[]) => {
    return components
      .filter((c) => c.type === "Deduction" && c.isActive)
      .reduce((sum, component) => sum + component.value, 0)
  }

  const calculateTotalBenefits = (components: SalaryComponent[]) => {
    return components
      .filter((c) => c.type === "Benefit" && c.isActive)
      .reduce((sum, component) => sum + component.value, 0)
  }

  const handleEditTemplate = (template: SalaryTemplate) => {
    setIsEditMode(true)
    setFormData({ ...template })
    setSelectedComponents([...template.components])
    setIsTemplateDialogOpen(true)
  }

  const handleDuplicateTemplate = (template: SalaryTemplate) => {
    const newTemplate = {
      ...template,
      id: Math.random().toString(36).substring(7),
      name: `${template.name} ${t("copy")}`,
      code: `${template.code}_COPY`,
    }
    setTemplates([...templates, newTemplate])
  }

  const handleDeleteTemplate = (template: SalaryTemplate) => {
    setTemplateToDelete(template)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      setTemplates(templates.filter((template) => template.id !== templateToDelete.id))
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  const handleInputChange = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value })
  }

  const handleRoleSelection = (role: string) => {
    const currentRoles = [...formData.applicableRoles]
    if (currentRoles.includes(role)) {
      setFormData({ ...formData, applicableRoles: currentRoles.filter((r) => r !== role) })
    } else {
      setFormData({ ...formData, applicableRoles: [...currentRoles, role] })
    }
  }

  const handleComponentSelection = () => {
    setIsComponentDialogOpen(true)
  }

  const handleAddComponent = (component: SalaryComponent) => {
    const newComponent = {
      ...component,
      id: Math.random().toString(36).substring(7),
      value: component.defaultValue || 0,
      percentage: component.defaultPercentage || 0,
    }
    setSelectedComponents([...selectedComponents, newComponent])
  }

  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents(selectedComponents.filter((c) => c.id !== componentId))
  }

  const handleComponentValueChange = (componentId: string, key: string, value: any) => {
    setSelectedComponents(
      selectedComponents.map((component) => {
        if (component.id === componentId) {
          return { ...component, [key]: value }
        }
        return component
      }),
    )
  }

  const handleSubmitTemplate = () => {
    if (isEditMode) {
      setTemplates(
        templates.map((template) => {
          if (template.id === formData.id) {
            return {
              ...formData,
              components: [...selectedComponents],
            }
          }
          return template
        }),
      )
    } else {
      const newTemplate = {
        ...formData,
        id: Math.random().toString(36).substring(7),
        components: [...selectedComponents],
      }
      setTemplates([...templates, newTemplate])
    }

    setIsTemplateDialogOpen(false)
    setFormData({
      id: "",
      name: "",
      code: "",
      description: "",
      applicableRoles: [],
      baseSalary: 0,
      components: [],
      isActive: true,
    })
    setSelectedComponents([])
    setIsEditMode(false)
  }

  return (
    <div className="container py-10">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t("salary_templates")}</h1>
            <Button
              onClick={() => {
                setIsEditMode(false)
                setFormData({
                  id: "",
                  name: "",
                  code: "",
                  description: "",
                  applicableRoles: [],
                  baseSalary: 0,
                  components: [],
                  isActive: true,
                })
                setSelectedComponents([])
                setIsTemplateDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("add_template")}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">{t("filter_by_role")}</Label>
              <select
                id="role"
                className="w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="All">{t("all_roles")}</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_by_name_or_code")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>

          {/* Templates Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("applicable_roles")}</TableHead>
                  <TableHead>{t("base_salary")}</TableHead>
                  <TableHead>{t("net_salary")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedRole !== "All"
                        ? t("no_templates_match_your_search_criteria")
                        : t("no_templates_found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.applicableRoles.map((role) => (
                            <Badge key={role} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(template.baseSalary)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(calculateNetSalary(template.components))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicateTemplate(template)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t("edit_salary_template") : t("add_salary_template")}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? t("update_the_details_of_the_salary_template")
                : t("create_a_new_salary_template_for_employee_payroll")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("template_name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("e.g._teacher_grade_ii")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">{t("template_code")}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder={t("e.g._tg2")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t("enter_template_description")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("applicable_roles")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-3">
                {roles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Switch
                      id={`role-${role}`}
                      checked={formData.applicableRoles.includes(role)}
                      onCheckedChange={() => handleRoleSelection(role)}
                    />
                    <Label htmlFor={`role-${role}`}>{role}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseSalary">{t("base_salary")}</Label>
              <div className="flex items-center">
                <span className="mr-2">₹</span>
                <Input
                  id="baseSalary"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => handleInputChange("baseSalary", Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("base_salary_is_used_to_calculate_percentage_based_components")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>{t("salary_components")}</Label>
                <Button variant="outline" size="sm" onClick={handleComponentSelection}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("add_component")}
                </Button>
              </div>

              {selectedComponents.length === 0 ? (
                <div className="border rounded-md p-6 text-center text-muted-foreground">
                  {t("no_components_added_yet._click_add_component_to_start_building_the_template")}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="earnings">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t("earnings")}
                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                            {selectedComponents.filter((c) => c.type === "Earning").length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("name")}</TableHead>
                              <TableHead>{t("calculation")}</TableHead>
                              <TableHead>{t("value")}</TableHead>
                              <TableHead>{t("active")}</TableHead>
                              <TableHead>{t("actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedComponents
                              .filter((comp) => comp.type === "Earning")
                              .map((component) => (
                                <TableRow key={component.id}>
                                  <TableCell className="font-medium">{component.name}</TableCell>
                                  <TableCell>
                                    {component.isPercentageBased ? (
                                      <div className="flex items-center">
                                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={component.percentage}
                                          onChange={(e) =>
                                            handleComponentValueChange(
                                              component.id,
                                              "percentage",
                                              Number(e.target.value),
                                            )
                                          }
                                          className="w-20"
                                        />
                                        <span className="ml-1">%</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={component.value}
                                          onChange={(e) =>
                                            handleComponentValueChange(component.id, "value", Number(e.target.value))
                                          }
                                          className="w-24"
                                        />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>{formatCurrency(component.value)}</TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={component.isActive}
                                      onCheckedChange={(checked) =>
                                        handleComponentValueChange(component.id, "isActive", checked)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveComponent(component.id)}
                                      className="h-8 w-8 p-0 text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="deductions">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center text-red-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t("deductions")}
                          <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                            {selectedComponents.filter((c) => c.type === "Deduction").length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("name")}</TableHead>
                              <TableHead>{t("calculation")}</TableHead>
                              <TableHead>{t("value")}</TableHead>
                              <TableHead>{t("active")}</TableHead>
                              <TableHead>{t("actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedComponents
                              .filter((comp) => comp.type === "Deduction")
                              .map((component) => (
                                <TableRow key={component.id}>
                                  <TableCell className="font-medium">{component.name}</TableCell>
                                  <TableCell>
                                    {component.isPercentageBased ? (
                                      <div className="flex items-center">
                                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={component.percentage}
                                          onChange={(e) =>
                                            handleComponentValueChange(
                                              component.id,
                                              "percentage",
                                              Number(e.target.value),
                                            )
                                          }
                                          className="w-20"
                                        />
                                        <span className="ml-1">%</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={component.value}
                                          onChange={(e) =>
                                            handleComponentValueChange(component.id, "value", Number(e.target.value))
                                          }
                                          className="w-24"
                                        />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>{formatCurrency(component.value)}</TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={component.isActive}
                                      onCheckedChange={(checked) =>
                                        handleComponentValueChange(component.id, "isActive", checked)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveComponent(component.id)}
                                      className="h-8 w-8 p-0 text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="benefits">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center text-blue-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t("benefits")}
                          <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {selectedComponents.filter((c) => c.type === "Benefit").length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("name")}</TableHead>
                              <TableHead>{t("calculation")}</TableHead>
                              <TableHead>{t("value")}</TableHead>
                              <TableHead>{t("active")}</TableHead>
                              <TableHead>{t("actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedComponents
                              .filter((comp) => comp.type === "Benefit")
                              .map((component) => (
                                <TableRow key={component.id}>
                                  <TableCell className="font-medium">{component.name}</TableCell>
                                  <TableCell>
                                    {component.isPercentageBased ? (
                                      <div className="flex items-center">
                                        <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={component.percentage}
                                          onChange={(e) =>
                                            handleComponentValueChange(
                                              component.id,
                                              "percentage",
                                              Number(e.target.value),
                                            )
                                          }
                                          className="w-20"
                                        />
                                        <span className="ml-1">%</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <Input
                                          type="number"
                                          value={component.value}
                                          onChange={(e) =>
                                            handleComponentValueChange(component.id, "value", Number(e.target.value))
                                          }
                                          className="w-24"
                                        />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>{formatCurrency(component.value)}</TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={component.isActive}
                                      onCheckedChange={(checked) =>
                                        handleComponentValueChange(component.id, "isActive", checked)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveComponent(component.id)}
                                      className="h-8 w-8 p-0 text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="p-4 bg-muted/50 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center text-sm">
                          <span className="text-muted-foreground mr-2">{t("total_earnings")}:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(calculateTotalEarnings(selectedComponents))}
                          </span>
                        </div>
                        <div className="flex items-center text-sm mt-1">
                          <span className="text-muted-foreground mr-2">{t("total_deductions")}:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(calculateTotalDeductions(selectedComponents))}
                          </span>
                        </div>
                        <div className="flex items-center text-sm mt-1">
                          <span className="text-muted-foreground mr-2">{t("total_benefits")}:</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(calculateTotalBenefits(selectedComponents))}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{t("net_salary")}</div>
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(calculateNetSalary(selectedComponents))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">{t("active_template")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitTemplate}
              disabled={
                !formData.name ||
                !formData.code ||
                formData.applicableRoles.length === 0 ||
                formData.baseSalary <= 0 ||
                selectedComponents.length === 0
              }
            >
              {isEditMode ? t("update_template") : t("add_template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Component Selection Dialog */}
      <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("add_salary_components")}</DialogTitle>
            <DialogDescription>{t("select_components_to_add_to_the_template")}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t("search_components")} className="pl-10" />
              </div>

              <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                {availableSalaryComponents.map((component) => {
                  const isAdded = selectedComponents.some((c) => c.id === component.id)

                  return (
                    <div
                      key={component.id}
                      className={`p-3 flex justify-between items-center hover:bg-muted/50 ${isAdded ? "bg-muted/30" : ""}`}
                    >
                      <div>
                        <div className="font-medium flex items-center">
                          {component.name}
                          <Badge
                            variant="outline"
                            className={
                              component.type === "Earning"
                                ? "ml-2 bg-green-50 text-green-700 border-green-200"
                                : component.type === "Deduction"
                                  ? "ml-2 bg-red-50 text-red-700 border-red-200"
                                  : "ml-2 bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {component.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {component.isPercentageBased
                            ? `${component.defaultPercentage}% ${t("of_base_salary")}`
                            : formatCurrency(component.defaultValue || 0)}
                        </div>
                      </div>

                      <Button
                        variant={isAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleAddComponent(component)}
                        disabled={isAdded}
                      >
                        {isAdded ? (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            {t("added")}
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-4 w-4" />
                            {t("add")}
                          </>
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsComponentDialogOpen(false)}>{t("done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_salary_template")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("are_you_sure_you_want_to_delete_this_template")}? {t("this_action_cannot_be_undone")}.
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700">{t("warning")}</p>
                    <p className="text-sm text-amber-600">
                      {t("deleting_this_template_may_affect_employees_who_are_currently_using_it")}
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SalaryTemplates
