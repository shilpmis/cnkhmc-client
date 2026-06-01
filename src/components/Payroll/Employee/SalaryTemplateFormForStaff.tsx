import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { toast } from "@/hooks/use-toast"
import {
  DollarSign,
  Plus,
  Trash,
  Save,
  AlertCircle,
  Loader2,
  ArrowLeft,
  GiftIcon,
  MinusIcon,
  HelpCircleIcon,
  InfoIcon,
  ClockIcon,
  CalendarIcon,
  PercentIcon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  useCreateStaffSalaryTemplateMutation,
  useFetchAllSalaryTemplateQuery,
  useLazyFetchSingleStaffSalaryTemplateQuery,
  useUpdaetStaffSalaryTemplateMutation,
  useLazyFetchAllSalaryComponentQuery,
} from "@/services/PayrollService"
import { useLazyGetStaffByIdQuery } from "@/services/StaffService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SalaryComponent, StaffSalaryTemplate, SalaryTemplateComponentForStaff } from "@/types/payroll"
import type { StaffType } from "@/types/staff"

interface SalaryTemplateFormProps {
  mode: "create" | "edit"
}

const SalaryTemplateForm = ({ mode }: SalaryTemplateFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Ref to prevent infinite loops
  const isUpdatingComponentsRef = useRef(false)
  const basicSalaryAmountRef = useRef(0)

  // API hooks
  const [fetchStaff, { data: staffData, isLoading: isLoadingStaff, error: staffError }] = useLazyGetStaffByIdQuery()
  const [fetchSalary, { data: salaryData, isLoading: isLoadingSalary, error: salaryError }] =
    useLazyFetchSingleStaffSalaryTemplateQuery()
  const { data: salaryTemplates, isLoading: isLoadingTemplates } = useFetchAllSalaryTemplateQuery({
    academic_session: CurrentAcademicSessionForSchool!.id,
  })
  const [fetchAllSalaryComponent, { data: availableComponents, isLoading: isLoadingComponents }] =
    useLazyFetchAllSalaryComponentQuery()
  const [createStaffSalaryTemplate, { isLoading: isCreating }] = useCreateStaffSalaryTemplateMutation()
  const [updateStaffSalaryTemplate, { isLoading: isUpdating }] = useUpdaetStaffSalaryTemplateMutation()

  // State for employee and salary data
  const [employee, setEmployee] = useState<StaffType | null>(null)
  const [existingSalary, setExistingSalary] = useState<StaffSalaryTemplate | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)

  // State for salary form data
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [annualCtc, setAnnualCtc] = useState<string>("0")
  const [templateName, setTemplateName] = useState<string>("")
  const [templateCode, setTemplateCode] = useState<string>("")
  const [templateDescription, setTemplateDescription] = useState<string>("Custom salary template")
  const [salaryComponents, setSalaryComponents] = useState<
    Omit<SalaryTemplateComponentForStaff, "id" | "staff_salary_templates_id">[]
  >([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<"earning" | "deduction" | "benefits">("earning")
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false)
  const [componentSearchTerm, setComponentSearchTerm] = useState("")
  const [hasFixedAmountComponent, setHasFixedAmountComponent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Track original components and template changes
  const [originalComponents, setOriginalComponents] = useState<
    Omit<SalaryTemplateComponentForStaff, "id" | "staff_salary_templates_id">[]
  >([])
  const [originalTemplateId, setOriginalTemplateId] = useState<number | null>(null)
  const [hasComponentChanges, setHasComponentChanges] = useState(false)

  // Helper function to get component details by ID
  const getComponentById = (componentId: number): SalaryComponent | undefined => {
    return availableComponents?.find((component) => component.id === componentId)
  }

  // Fetch employee data
  useEffect(() => {
    if (employeeId) {
      fetchStaff(Number(employeeId))
    }
  }, [employeeId, fetchStaff])

  // Fetch salary data if in edit mode
  useEffect(() => {
    if (mode === "edit" && employeeId) {
      fetchSalary({
        staff_id: Number(employeeId)
      })
    }
  }, [mode, employeeId, fetchSalary])

  // Fetch available salary components
  useEffect(() => {
    if (CurrentAcademicSessionForSchool) {
      fetchAllSalaryComponent({
        academic_session: CurrentAcademicSessionForSchool.id,
      })
    }
  }, [CurrentAcademicSessionForSchool, fetchAllSalaryComponent])

  // Update employee state when data is loaded
  useEffect(() => {
    if (staffData) {
      setEmployee(staffData)

      // Set default template name and code based on employee data
      if (!templateName || templateName === "") {
        setTemplateName(`${staffData.first_name}'s Salary Template`)
      }

      if (!templateCode || templateCode === "") {
        setTemplateCode(`${staffData.employee_code}-SALARY`)
      }
    }
  }, [staffData, templateName, templateCode])

  // Update salary state when data is loaded
  useEffect(() => {
    if (mode === "edit" && salaryData) {
      setExistingSalary(salaryData)
    }
  }, [mode, salaryData])

  // Check if data is still loading
  useEffect(() => {
    const stillLoading =
      isLoadingStaff || (mode === "edit" && isLoadingSalary) || isLoadingTemplates || isLoadingComponents

    setIsLoading(stillLoading)

    // Check for errors
    if (staffError) {
      setDataError("Failed to load employee data")
    } else if (mode === "edit" && salaryError) {
      setDataError("Failed to load salary template data")
    }
  }, [isLoadingStaff, isLoadingSalary, isLoadingTemplates, isLoadingComponents, mode, staffError, salaryError])

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (mode === "edit" && existingSalary && employee && availableComponents) {
      setSelectedTemplateId(existingSalary.base_template_id)
      setAnnualCtc(existingSalary.annual_ctc)
      setTemplateName(existingSalary.template_name)
      setTemplateCode(existingSalary.template_code || `${employee.employee_code}-SALARY`)
      setTemplateDescription(existingSalary.description || "Custom salary template")

      // Map existing components - ensure we're properly handling all components
      if (existingSalary.template_components) {
        // Make sure we have all component details
        const componentsWithDetails = existingSalary.template_components.map((comp) => {
          // Find component details
          const componentDetails = availableComponents.find((c) => c.id === comp.salary_components_id)

          // If it's a percentage-based component, ensure we're setting percentage correctly
          if (componentDetails && componentDetails.calculation_method === "percentage") {
            return {
              ...comp,
              percentage: comp.percentage !== null ? String(comp.percentage) : null,
              amount: comp.amount !== null ? String(comp.amount) : null,
            }
          }

          return {
            ...comp,
            amount: comp.amount !== null ? String(comp.amount) : null,
            percentage: comp.percentage !== null ? String(comp.percentage) : null,
          }
        })

        setSalaryComponents(componentsWithDetails)

        // Store original components and template ID for comparison
        setOriginalComponents(componentsWithDetails)
        setOriginalTemplateId(existingSalary.base_template_id)

        // Check if there's a fixed amount component
        const fixedAmountComp = componentsWithDetails.find((comp) => {
          const component = availableComponents.find((c) => c.id === comp.salary_components_id)
          return component?.component_name === "Fixed Amount"
        })
        setHasFixedAmountComponent(!!fixedAmountComp)
      }
    } else if (mode === "create" && employee) {
      // Set default values for new salary
      setSelectedTemplateId(null)
      setAnnualCtc("0")
      setTemplateName(`${employee.first_name}'s Salary Template`)
      setTemplateCode(`${employee.employee_code}-SALARY`)
      setTemplateDescription("Custom salary template")
      setSalaryComponents([])
      setHasFixedAmountComponent(false)
    }
  }, [mode, existingSalary, employee, availableComponents])

  // Calculate monthly salary
  const monthlySalary = useMemo(() => {
    return (Number(annualCtc) / 12).toFixed(2)
  }, [annualCtc])

  // Find basic salary component
  const basicSalaryComponent = useMemo(() => {
    if (!salaryComponents || !availableComponents) return null

    // Find the basic salary component (usually named "Basic Salary" or similar)
    const basicComponent = salaryComponents.find((comp) => {
      const component = getComponentById(comp.salary_components_id)
      return component?.component_name.toLowerCase().includes("basic")
    })

    return basicComponent
  }, [salaryComponents, availableComponents])

  // Get basic salary amount
  const basicSalaryAmount = useMemo(() => {
    if (!basicSalaryComponent) return 0
    return basicSalaryComponent.amount ? Number(basicSalaryComponent.amount) : 0
  }, [basicSalaryComponent])

  // Update basicSalaryAmountRef when basicSalaryAmount changes
  useEffect(() => {
    basicSalaryAmountRef.current = basicSalaryAmount
  }, [basicSalaryAmount])

  // Function to update percentage-based components
  const updatePercentageBasedComponents = () => {
    if (isUpdatingComponentsRef.current) return

    isUpdatingComponentsRef.current = true

    try {
      if (basicSalaryAmount > 0 && salaryComponents.length > 0) {
        const updatedComponents = [...salaryComponents]
        let hasChanges = false

        for (let i = 0; i < updatedComponents.length; i++) {
          const comp = updatedComponents[i]
          const componentDetails = getComponentById(comp.salary_components_id)

          // If it's a percentage-based component and has a percentage value
          if (componentDetails && componentDetails.calculation_method === "percentage" && comp.percentage !== null) {
            const percentValue = Number(comp.percentage)
            let newAmount: string | null = null

            // Calculate amount based on component type
            if (componentDetails.component_type === "earning") {
              newAmount = ((percentValue / 100) * (Number(annualCtc) / 12)).toFixed(2)
            } else if (
              componentDetails.component_type === "deduction" ||
              componentDetails.component_type === "benefits"
            ) {
              newAmount = ((percentValue / 100) * basicSalaryAmount).toFixed(2)
            }

            // Only update if the amount has changed
            if (newAmount !== null && newAmount !== comp.amount) {
              updatedComponents[i] = {
                ...comp,
                amount: newAmount,
              }
              hasChanges = true
            }
          }
        }

        // Only update state if there were actual changes
        if (hasChanges) {
          setSalaryComponents(updatedComponents)
        }
      }
    } finally {
      isUpdatingComponentsRef.current = false
    }
  }

  // Update percentage-based components when basic salary or annual CTC changes
  useEffect(() => {
    // Only run if not already updating and if basic salary or CTC has changed
    if (
      !isUpdatingComponentsRef.current &&
      (basicSalaryAmount !== basicSalaryAmountRef.current || Number(annualCtc) > 0)
    ) {
      updatePercentageBasedComponents()
    }
  }, [basicSalaryAmount, annualCtc])

  // Calculate total earnings, deductions, and benefits
  const totals = useMemo(() => {
    let totalEarnings = 0
    let totalDeductions = 0
    let totalBenefits = 0

    salaryComponents.forEach((comp) => {
      const component = getComponentById(comp.salary_components_id)
      if (!component) return

      const amount = comp.amount ? Number(comp.amount) : 0

      if (component.component_type === "earning") {
        totalEarnings += amount
      } else if (component.component_type === "deduction") {
        totalDeductions += amount
      } else if (component.component_type === "benefits") {
        totalBenefits += amount
      }
    })

    // Calculate net salary properly
    const netSalary = totalEarnings - totalDeductions

    // Calculate the difference between monthly salary and total earnings
    const earningsDifference = Number(monthlySalary) - totalEarnings

    return {
      totalEarnings,
      totalDeductions,
      totalBenefits,
      netSalary,
      earningsDifference,
    }
  }, [salaryComponents, monthlySalary])

  // Filter components by type
  const filteredComponents = useMemo(() => {
    return salaryComponents.filter((comp) => {
      const component = getComponentById(comp.salary_components_id)
      return component?.component_type === activeTab
    })
  }, [salaryComponents, activeTab])

  // Filter available components for dialog
  const filteredAvailableComponents = useMemo(() => {
    if (!availableComponents) return []

    return availableComponents.filter(
      (comp) =>
        comp.component_type === activeTab &&
        comp.component_name.toLowerCase().includes(componentSearchTerm.toLowerCase()) &&
        !salaryComponents.some((sc) => sc.salary_components_id === comp.id),
    )
  }, [availableComponents, activeTab, componentSearchTerm, salaryComponents])

  // Add fixed amount component automatically
  const addFixedAmountComponentAutomatically = () => {
    if (!availableComponents || hasFixedAmountComponent) return

    // Find fixed amount component
    const fixedAmountComponent = availableComponents.find((comp) => comp.component_name === "Fixed Amount")
    if (!fixedAmountComponent) return

    // Calculate fixed amount
    const fixedAmount = Math.max(0, totals.earningsDifference)

    // Add fixed amount component
    const newComponents = [...salaryComponents]
    newComponents.push({
      salary_components_id: fixedAmountComponent.id,
      amount: fixedAmount.toFixed(2),
      percentage: null,
      is_mandatory: false,
      recovering_end_month: null,
      total_recovering_amount: null,
      total_recovered_amount: null,
    })

    setSalaryComponents(newComponents)
    setHasFixedAmountComponent(true)
  }

  // Load template data when selected
  useEffect(() => {
    if (!selectedTemplateId || !salaryTemplates || !employee) return

    // Check if template has changed from original
    const templateChanged = mode === "edit" && originalTemplateId !== null && selectedTemplateId !== originalTemplateId

    const template = salaryTemplates.find((t) => t.id === selectedTemplateId)
    if (!template) return

    // Create new components based on template
    if (template.template_components && availableComponents) {
      // In edit mode, we need to preserve existing components
      if (mode === "edit" && existingSalary) {
        // If template changed, we need to handle differently
        if (templateChanged) {
          // When template changes, we'll replace all components
          const newComponents: Omit<SalaryTemplateComponentForStaff, "id" | "staff_salary_templates_id">[] =
            template.template_components.map((comp) => {
              // Calculate amount based on calculation method
              let amount: string | null = null
              let percentage: string | null = null

              if (comp.amount !== null) {
                amount = String(comp.amount)
              }

              if (comp.percentage !== null) {
                percentage = String(comp.percentage)

                // If percentage is set and based on annual CTC, calculate the amount
                if (comp.is_based_on_annual_ctc && Number(annualCtc) > 0) {
                  const percentValue = Number(comp.percentage)
                  amount = ((percentValue / 100) * (Number(annualCtc) / 12)).toFixed(2)
                }
              }

              return {
                salary_components_id: comp.salary_components_id,
                amount,
                percentage,
                is_mandatory: Boolean(comp.is_mandatory),
                recovering_end_month: null,
                total_recovering_amount: null,
                total_recovered_amount: null,
              }
            })

          setSalaryComponents(newComponents)
          setHasComponentChanges(true)
        } else {
          // Get components from the template that aren't already in the salary
          const existingComponentIds = salaryComponents.map((comp) => comp.salary_components_id)
          const newTemplateComponents = template.template_components.filter(
            (comp) => !existingComponentIds.includes(comp.salary_components_id),
          )

          // Map new components
          const newComponents = newTemplateComponents.map((comp) => {
            // Calculate amount based on calculation method
            let amount: string | null = null
            let percentage: string | null = null

            if (comp.amount !== null) {
              amount = String(comp.amount)
            }

            if (comp.percentage !== null) {
              percentage = String(comp.percentage)

              // If percentage is set and based on annual CTC, calculate the amount
              if (comp.is_based_on_annual_ctc && Number(annualCtc) > 0) {
                const percentValue = Number(comp.percentage)
                amount = ((percentValue / 100) * (Number(annualCtc) / 12)).toFixed(2)
              }
            }

            return {
              salary_components_id: comp.salary_components_id,
              amount,
              percentage,
              is_mandatory: Boolean(comp.is_mandatory),
              recovering_end_month: null,
              total_recovering_amount: null,
              total_recovered_amount: null,
            }
          })

          // Combine existing and new components
          const combinedComponents = [...salaryComponents, ...newComponents]
          setSalaryComponents(combinedComponents)
          setHasComponentChanges(true)
        }
      } else {
        // In create mode, just use the template components
        const newComponents: Omit<SalaryTemplateComponentForStaff, "id" | "staff_salary_templates_id">[] =
          template.template_components.map((comp) => {
            // Calculate amount based on calculation method
            let amount: string | null = null
            let percentage: string | null = null

            if (comp.amount !== null) {
              amount = String(comp.amount)
            }

            if (comp.percentage !== null) {
              percentage = String(comp.percentage)

              // If percentage is set and based on annual CTC, calculate the amount
              if (comp.is_based_on_annual_ctc && Number(annualCtc) > 0) {
                const percentValue = Number(comp.percentage)
                amount = ((percentValue / 100) * (Number(annualCtc) / 12)).toFixed(2)
              }
            }

            return {
              salary_components_id: comp.salary_components_id,
              amount,
              percentage,
              is_mandatory: Boolean(comp.is_mandatory),
              recovering_end_month: null,
              total_recovering_amount: null,
              total_recovered_amount: null,
            }
          })

        setSalaryComponents(newComponents)
      }

      // Check if there's a fixed amount component
      const fixedAmountComponent = availableComponents.find((comp) => comp.component_name === "Fixed Amount")
      const hasFixedAmount = salaryComponents.some((comp) => comp.salary_components_id === fixedAmountComponent?.id)
      setHasFixedAmountComponent(hasFixedAmount)
    }

    setTemplateName(`${employee.first_name}'s ${template.template_name}`)
    setTemplateDescription(template.description || "")
    setAnnualCtc(String(template.annual_ctc))

    // Add fixed amount component if needed
    setTimeout(() => {
      if (!hasFixedAmountComponent) {
        addFixedAmountComponentAutomatically()
      }
    }, 100)
  }, [selectedTemplateId, salaryTemplates, employee, availableComponents])

  // Handle amount change
  const handleAmountChange = (index: number, value: string) => {
    const newComponents = [...salaryComponents]
    const componentDetails = getComponentById(newComponents[index].salary_components_id)

    // Check if this is a fixed amount component
    const isFixedAmountComponent = componentDetails?.component_name === "Fixed Amount"
    if (isFixedAmountComponent) return // Don't allow manual editing of fixed amount component

    // Check if value is valid
    if (value !== "" && (isNaN(Number(value)) || Number(value) < 0)) {
      setErrors({ ...errors, [`amount-${index}`]: "Please enter a valid positive number" })
      return
    } else {
      const newErrors = { ...errors }
      delete newErrors[`amount-${index}`]
      setErrors(newErrors)
    }

    // For amount-based components, set amount and clear percentage
    newComponents[index].amount = value === "" ? null : value
    newComponents[index].percentage = null

    setSalaryComponents(newComponents)
    setHasComponentChanges(true)

    // Update fixed amount component if it exists
    updateFixedAmountComponent(newComponents)
  }

  // Handle percentage change
  const handlePercentageChange = (index: number, value: string) => {
    const newComponents = [...salaryComponents]
    const componentDetails = getComponentById(newComponents[index].salary_components_id)

    // Check if value is valid
    if (value !== "" && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      setErrors({ ...errors, [`percentage-${index}`]: "Please enter a valid percentage (0-100)" })
      return
    } else {
      const newErrors = { ...errors }
      delete newErrors[`percentage-${index}`]
      setErrors(newErrors)
    }

    // For percentage-based components, set percentage and calculate amount for display only
    newComponents[index].percentage = value === "" ? null : value

    // Calculate amount for display purposes
    if (value !== "") {
      const percentValue = Number(value)

      // For earnings, use annual CTC
      if (componentDetails?.component_type === "earning") {
        newComponents[index].amount = ((percentValue / 100) * (Number(annualCtc) / 12)).toFixed(2)
      }
      // For deductions and benefits, use basic salary
      else if (basicSalaryAmount > 0) {
        newComponents[index].amount = ((percentValue / 100) * basicSalaryAmount).toFixed(2)
      } else {
        // If basic salary is not yet set, set a temporary amount of 0
        newComponents[index].amount = "0"
      }
    } else {
      newComponents[index].amount = null
    }

    setSalaryComponents(newComponents)
    setHasComponentChanges(true)

    // Update fixed amount component if it exists
    updateFixedAmountComponent(newComponents)
  }

  // Handle recovering end month change
  const handleRecoveringEndMonthChange = (index: number, value: string) => {
    const newComponents = [...salaryComponents]
    newComponents[index].recovering_end_month = value
    setSalaryComponents(newComponents)
    setHasComponentChanges(true)
  }

  // Handle total recovering amount change
  const handleTotalRecoveringAmountChange = (index: number, value: string) => {
    const newComponents = [...salaryComponents]

    // Check if value is valid
    if (value !== "" && (isNaN(Number(value)) || Number(value) < 0)) {
      setErrors({ ...errors, [`recovering-${index}`]: "Please enter a valid positive number" })
      return
    } else {
      const newErrors = { ...errors }
      delete newErrors[`recovering-${index}`]
      setErrors(newErrors)
    }

    newComponents[index].total_recovering_amount = value === "" ? null : value
    setSalaryComponents(newComponents)
    setHasComponentChanges(true)
  }

  // Update fixed amount component
  const updateFixedAmountComponent = (
    components: Omit<SalaryTemplateComponentForStaff, "id" | "staff_salary_templates_id">[],
  ) => {
    if (!availableComponents) return

    // Find fixed amount component
    const fixedAmountComponent = availableComponents.find((comp) => comp.component_name === "Fixed Amount")
    if (!fixedAmountComponent) return

    // Calculate total earnings excluding fixed amount
    let totalEarnings = 0
    components.forEach((comp) => {
      const component = getComponentById(comp.salary_components_id)
      if (component?.component_type === "earning" && component.id !== fixedAmountComponent.id) {
        totalEarnings += comp.amount ? Number(comp.amount) : 0
      }
    })

    // Calculate fixed amount
    const fixedAmount = Math.max(0, Number(monthlySalary) - totalEarnings)

    // Update or add fixed amount component
    const fixedIndex = components.findIndex((comp) => comp.salary_components_id === fixedAmountComponent.id)
    if (fixedIndex >= 0) {
      components[fixedIndex].amount = fixedAmount.toFixed(2)
    } else if (fixedAmount > 0) {
      components.push({
        salary_components_id: fixedAmountComponent.id,
        amount: fixedAmount.toFixed(2),
        percentage: null,
        is_mandatory: false,
        recovering_end_month: null,
        total_recovering_amount: null,
        total_recovered_amount: null,
      })
      setHasFixedAmountComponent(true)
    }

    setSalaryComponents([...components])
    setHasComponentChanges(true)
  }

  // Handle annual CTC change
  const handleAnnualCtcChange = (value: string) => {
    // Check if value is valid
    if (value !== "" && (isNaN(Number(value)) || Number(value) <= 0)) {
      setErrors({ ...errors, annualCtc: "Please enter a valid positive number" })
      return
    } else {
      const newErrors = { ...errors }
      delete newErrors.annualCtc
      setErrors(newErrors)
    }

    // Update annual CTC
    setAnnualCtc(value)

    // Update percentage-based components
    if (value !== "") {
      const ctcValue = Number(value)
      const newComponents = salaryComponents.map((comp) => {
        const componentDetails = getComponentById(comp.salary_components_id)

        if (comp.percentage !== null) {
          const percentValue = Number(comp.percentage || "0")

          // For earnings, use annual CTC
          if (componentDetails?.component_type === "earning") {
            return {
              ...comp,
              amount: ((percentValue / 100) * (ctcValue / 12)).toFixed(2),
            }
          }
          // For others, keep the same amount (will be updated after basic salary is recalculated)
          return comp
        }
        return comp
      })

      setSalaryComponents(newComponents)

      // Update fixed amount component
      setTimeout(() => {
        updateFixedAmountComponent(newComponents)

        // After basic salary is updated, update deductions and benefits
        setTimeout(() => {
          const updatedComponents = [...newComponents].map((comp) => {
            const componentDetails = getComponentById(comp.salary_components_id)

            if (
              comp.percentage !== null &&
              (componentDetails?.component_type === "deduction" || componentDetails?.component_type === "benefits")
            ) {
              const percentValue = Number(comp.percentage || "0")
              return {
                ...comp,
                amount: ((percentValue / 100) * basicSalaryAmount).toFixed(2),
              }
            }
            return comp
          })

          setSalaryComponents(updatedComponents)
        }, 100)
      }, 100)
    }
  }

  // Add new component
  const handleAddComponent = (component: SalaryComponent) => {
    // Check if this is the fixed amount component
    const isFixedAmountComponent = component.component_name === "Fixed Amount"

    // If adding fixed amount component, set flag
    if (isFixedAmountComponent) {
      setHasFixedAmountComponent(true)
    }

    let amount: string | null = null
    let percentage: string | null = null

    // Set initial values based on calculation method
    if (component.calculation_method === "percentage") {
      percentage = component.percentage ? String(component.percentage) : "0"

      // Calculate amount based on percentage but don't store it in the component
      if (component.component_type === "earning" && Number(annualCtc) > 0) {
        amount = ((Number(percentage) / 100) * (Number(annualCtc) / 12)).toFixed(2)
      } else if (basicSalaryAmount > 0) {
        amount = ((Number(percentage) / 100) * basicSalaryAmount).toFixed(2)
      }
    } else if (component.calculation_method === "amount" && component.amount) {
      amount = String(component.amount)
      percentage = null // Ensure percentage is null for amount-based components
    }

    // For fixed amount component, calculate the difference
    if (isFixedAmountComponent) {
      amount = Math.max(0, totals.earningsDifference).toFixed(2)
      percentage = null // Ensure percentage is null for fixed amount component
    }

    const newComponent: Omit<SalaryTemplateComponentForStaff, "id" | "staff_salary_templates_id"> = {
      salary_components_id: component.id,
      amount,
      percentage,
      is_mandatory: component.is_mandatory,
      recovering_end_month: null,
      total_recovering_amount: null,
      total_recovered_amount: null,
    }

    const newComponents = [...salaryComponents, newComponent]
    setSalaryComponents(newComponents)
    setIsComponentDialogOpen(false)
    setHasComponentChanges(true)

    // Update fixed amount component if it exists and this isn't the fixed amount component
    if (!isFixedAmountComponent) {
      updateFixedAmountComponent(newComponents)
    }
  }

  // Remove component
  const handleRemoveComponent = (index: number) => {
    // Check if component is mandatory
    if (salaryComponents[index].is_mandatory) {
      toast({
        title: "Cannot remove mandatory component",
        description: "This component is mandatory and cannot be removed",
        variant: "destructive",
      })
      return
    }

    // Check if this is the fixed amount component
    const componentDetails = getComponentById(salaryComponents[index].salary_components_id)
    const isFixedAmountComponent = componentDetails?.component_name === "Fixed Amount"

    // If removing fixed amount component, clear flag
    if (isFixedAmountComponent) {
      setHasFixedAmountComponent(false)
    }

    const newComponents = [...salaryComponents]
    newComponents.splice(index, 1)
    setSalaryComponents(newComponents)
    setHasComponentChanges(true)

    // Update fixed amount component if it exists and this isn't the fixed amount component
    if (!isFixedAmountComponent) {
      updateFixedAmountComponent(newComponents)
    }
  }

  // Handle navigation back to employee detail
  const handleGoBack = () => {
    if (employeeId) {
      navigate(`/d/payroll/employee/${employeeId}`)
    } else {
      navigate(`/d/payroll/employee`)
    }
  }

  // Get component end type
  const getComponentEndType = (componentDetails: SalaryComponent | undefined) => {
    if (!componentDetails) return null

    if (componentDetails.component_type === "deduction") {
      return componentDetails.deduction_type
    } else if (componentDetails.component_type === "benefits") {
      return componentDetails.benefit_type
    }

    return null
  }

  // Check if components have changed from original
  const checkComponentChanges = () => {
    if (mode !== "edit" || !originalComponents.length) return true

    // Check if number of components changed
    if (originalComponents.length !== salaryComponents.length) {
      return true
    }

    // Check if any component values changed
    for (const origComp of originalComponents) {
      const currentComp = salaryComponents.find((comp) => comp.salary_components_id === origComp.salary_components_id)

      if (!currentComp) {
        return true // Component was removed
      }

      // Check if values changed
      if (
        currentComp.amount !== origComp.amount ||
        currentComp.percentage !== origComp.percentage ||
        currentComp.recovering_end_month !== origComp.recovering_end_month ||
        currentComp.total_recovering_amount !== origComp.total_recovering_amount
      ) {
        return true
      }
    }

    return false
  }

  // Save salary template
  const handleSaveSalary = async () => {
    if (!employee || !employeeId) {
      toast({
        title: "Error",
        description: "Employee data is missing",
        variant: "destructive",
      })
      return
    }

    // Validate form
    const formErrors: Record<string, string> = {}

    if (!templateName) {
      formErrors.templateName = "Template name is required"
    }

    if (!annualCtc || Number(annualCtc) <= 0) {
      formErrors.annualCtc = "Annual CTC must be greater than 0"
    }

    if (salaryComponents.length === 0) {
      formErrors.components = "At least one salary component is required"
    }

    if (!selectedTemplateId && mode === "create") {
      formErrors.template = "Please select a base template"
    }

    if (Object.keys(formErrors).length > 0 || Object.keys(errors).length > 0) {
      setErrors({ ...errors, ...formErrors })
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (mode === "edit" && existingSalary) {
        // Check if components have changed
        const componentsChanged = checkComponentChanges()
        const templateChanged = originalTemplateId !== selectedTemplateId

        // Prepare existing components that have changed
        const changedExistingComponents = componentsChanged
          ? salaryComponents
              .filter((comp) =>
                existingSalary.template_components.some((c) => c.salary_components_id === comp.salary_components_id),
              )
              .map((comp) => {
                const componentDetails = getComponentById(comp.salary_components_id)
                // Only include the appropriate value based on calculation method
                const isPercentageBased = componentDetails?.calculation_method === "percentage"

                return {
                  salary_components_id: comp.salary_components_id,
                  amount: !isPercentageBased && comp.amount ? Number(comp.amount) : null,
                  percentage: isPercentageBased && comp.percentage ? Number(comp.percentage) : null,
                  recovering_end_month: comp.recovering_end_month,
                  total_recovering_amount: comp.total_recovering_amount ? Number(comp.total_recovering_amount) : null,
                }
              })
          : null

        // Prepare new components
        const newComponents = salaryComponents.filter(
          (comp) =>
            !existingSalary.template_components.some((c) => c.salary_components_id === comp.salary_components_id),
        )

        const newSalaryComponents =
          newComponents.length > 0
            ? newComponents.map((comp) => {
                const componentDetails = getComponentById(comp.salary_components_id)
                // Only include the appropriate value based on calculation method
                const isPercentageBased = componentDetails?.calculation_method === "percentage"

                return {
                  salary_components_id: comp.salary_components_id,
                  amount: !isPercentageBased && comp.amount ? Number(comp.amount) : null,
                  percentage: isPercentageBased && comp.percentage ? Number(comp.percentage) : null,
                  is_mandatory: comp.is_mandatory,
                  is_based_on_annual_ctc: componentDetails?.is_based_on_annual_ctc || false,
                  end_month: null,
                  recovery_amount: null,
                  recovering_end_month: comp.recovering_end_month,
                  total_recovering_amount: comp.total_recovering_amount ? Number(comp.total_recovering_amount) : null,
                  total_recovered_amount: comp.total_recovered_amount ? Number(comp.total_recovered_amount) : null,
                }
              })
            : null

        // Prepare removed components
        let removedComponents = null

        if (templateChanged) {
          // If template changed, all original components are considered removed
          removedComponents = existingSalary.template_components.map((comp) => ({
            salary_components_id: comp.salary_components_id,
          }))
        } else {
          // Otherwise, only components that are no longer present are removed
          const removedComps = existingSalary.template_components.filter(
            (comp) => !salaryComponents.some((c) => c.salary_components_id === comp.salary_components_id),
          )

          if (removedComps.length > 0) {
            removedComponents = removedComps.map((comp) => ({
              salary_components_id: comp.salary_components_id,
            }))
          }
        }

        // Update existing template
        const response = await updateStaffSalaryTemplate({
          salary_template_id: existingSalary.id,
          staff_id : staffData!.id,
          payload: {
            template_name: templateName,
            template_code: templateCode,
            description: templateDescription,
            annual_ctc: Number(annualCtc),
            existing_salary_components: changedExistingComponents,
            new_salary_components: newSalaryComponents,
            remove_salary_components: removedComponents,
          },
        })

        if (response.data) {
          toast({
            title: "Success",
            description: "Salary template updated successfully",
          })
          navigate(`/d/payroll/employee/${employeeId}`)
        }
      } else {
        // Create new template
        const response = await createStaffSalaryTemplate({
          payload: {
            base_template_id: selectedTemplateId,
            staff_id: Number(employeeId),
            template_name: templateName,
            template_code: templateCode,
            description: templateDescription,
            annual_ctc: annualCtc,
            template_components: salaryComponents.map((comp) => {
              const componentDetails = getComponentById(comp.salary_components_id)
              // Only include the appropriate value based on calculation method
              const isPercentageBased = componentDetails?.calculation_method === "percentage"

              return {
                salary_components_id: comp.salary_components_id,
                amount: !isPercentageBased && comp.amount !== null ? String(comp.amount) : null,
                percentage: isPercentageBased && comp.percentage !== null ? String(comp.percentage) : null,
                is_mandatory: comp.is_mandatory,
                is_based_on_annual_ctc: componentDetails?.is_based_on_annual_ctc || false,
                recovering_end_month: comp.recovering_end_month,
                total_recovering_amount:
                  comp.total_recovering_amount !== null ? String(comp.total_recovering_amount) : null,
                total_recovered_amount:
                  comp.total_recovered_amount !== null ? String(comp.total_recovered_amount) : null,
              }
            }),
          },
        })

        if (response.data) {
          toast({
            title: "Success",
            description: "Salary template created successfully",
          })
          navigate(`/d/payroll/employee/${employeeId}`)
        }
      }
    } catch (error) {
      console.error("Error saving salary template:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === "" || isNaN(Number(amount))) return "₹0.00"
    const numAmount = typeof amount === "string" ? Number(amount) : amount
    return `₹${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get deduction type display text
  const getDeductionTypeText = (type: string | null) => {
    switch (type) {
      case "ends_on_selected_month":
        return "Ends on selected month"
      case "ends_never":
        return "Never ends"
      case "recovering_specific_amount":
        return "Recovering specific amount"
      default:
        return "N/A"
    }
  }

  // Get deduction type tooltip text
  const getDeductionTypeTooltip = (type: string | null) => {
    switch (type) {
      case "ends_on_selected_month":
        return "This deduction will continue until the specified month and then stop automatically."
      case "ends_never":
        return "This deduction will continue indefinitely until manually removed."
      case "recovering_specific_amount":
        return "This deduction will continue until the total specified amount has been recovered."
      default:
        return ""
    }
  }

  // Get component frequency explanation
  const getComponentFrequencyExplanation = (componentDetails: SalaryComponent | undefined) => {
    if (!componentDetails) return ""

    if (componentDetails.component_type === "deduction") {
      switch (componentDetails.deduction_type) {
        case "ends_on_selected_month":
          return "This deduction will be applied monthly until the specified end date."
        case "ends_never":
          return "This deduction will be applied monthly with no end date."
        case "recovering_specific_amount":
          return "This deduction will be applied monthly until the total specified amount is recovered."
        default:
          return ""
      }
    } else if (componentDetails.component_type === "benefits") {
      switch (componentDetails.benefit_type) {
        case "ends_on_selected_month":
          return "This benefit will be applied monthly until the specified end date."
        case "ends_never":
          return "This benefit will be applied monthly with no end date."
        case "recovering_specific_amount":
          return "This benefit will be applied monthly until the total specified amount is reached."
        default:
          return ""
      }
    }

    return ""
  }

  // Group components by type for summary
  const groupedComponents = useMemo(() => {
    const grouped = {
      earnings: [] as { name: string; amount: string | number | null }[],
      deductions: [] as { name: string; amount: string | number | null }[],
      benefits: [] as { name: string; amount: string | number | null }[],
    }

    salaryComponents.forEach((comp) => {
      const component = getComponentById(comp.salary_components_id)
      if (!component) return

      const item = {
        name: component.component_name,
        amount: comp.amount,
      }

      if (component.component_type === "earning") {
        grouped.earnings.push(item)
      } else if (component.component_type === "deduction") {
        grouped.deductions.push(item)
      } else if (component.component_type === "benefits") {
        grouped.benefits.push(item)
      }
    })

    // Sort components - Basic Salary first, then Fixed Amount last for earnings
    grouped.earnings.sort((a, b) => {
      if (a.name.toLowerCase().includes("basic")) return -1
      if (b.name.toLowerCase().includes("basic")) return 1
      if (a.name === "Fixed Amount") return 1
      if (b.name === "Fixed Amount") return -1
      return 0
    })

    return grouped
  }, [salaryComponents])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs defaultValue="earning">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="earning">
                    <Skeleton className="h-4 w-16" />
                  </TabsTrigger>
                  <TabsTrigger value="deduction">
                    <Skeleton className="h-4 w-16" />
                  </TabsTrigger>
                  <TabsTrigger value="benefits">
                    <Skeleton className="h-4 w-16" />
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="earning" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Skeleton className="h-64 w-full" />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (dataError || !employee) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{dataError || "Failed to load data. Please try again later."}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Salary Form Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              {mode === "create" ? t("create_salary_template") : t("edit_salary_template")}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? t("create_a_new_salary_template_for_the_employee")
                : t("modify_the_existing_salary_template_for_the_employee")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="template">{t("base_salary_template")}</Label>
                <Select
                  value={selectedTemplateId?.toString() || ""}
                  onValueChange={(value) => setSelectedTemplateId(value === "" ? null : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryTemplates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.template && <p className="text-sm text-destructive">{errors.template}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual-ctc">{t("annual_ctc")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                  <Input
                    id="annual-ctc"
                    type="number"
                    className="pl-8"
                    value={annualCtc}
                    onChange={(e) => handleAnnualCtcChange(e.target.value)}
                  />
                </div>
                {errors.annualCtc && <p className="text-sm text-destructive">{errors.annualCtc}</p>}
              </div>
            </div>

            {/* Monthly Salary Display */}
            <div className="bg-muted p-4 rounded-md flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{t("monthly_salary")}</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlySalary)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t("net_salary")}</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.netSalary)}</p>
              </div>
            </div>

            {/* Basic Salary Information */}
            {basicSalaryComponent && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Basic Salary Information</AlertTitle>
                <AlertDescription>
                  Basic Salary: {formatCurrency(basicSalaryAmount)}. Deductions and benefits with percentage
                  calculations are based on this amount.
                </AlertDescription>
              </Alert>
            )}

            {/* Template Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">{t("template_name")}</Label>
                <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                {errors.templateName && <p className="text-sm text-destructive">{errors.templateName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-code">{t("template_code")}</Label>
                <Input id="template-code" value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">{t("description")}</Label>
                <Input
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Salary Components */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="earning" className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" /> {t("earnings")}
                  </TabsTrigger>
                  <TabsTrigger value="deduction" className="flex items-center">
                    <MinusIcon className="mr-2 h-4 w-4" /> {t("deductions")}
                  </TabsTrigger>
                  <TabsTrigger value="benefits" className="flex items-center">
                    <GiftIcon className="mr-2 h-4 w-4" /> {t("benefits")}
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  {/* Component Type Information */}
                  {activeTab === "deduction" && (
                    <Alert className="mb-4">
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Deduction Information</AlertTitle>
                      <AlertDescription>
                        Percentage-based deductions are calculated based on the Basic Salary. Different deduction types
                        have different behaviors:
                        <ul className="list-disc pl-5 mt-2">
                          <li>
                            <strong>Never Ending:</strong> Deduction continues indefinitely until manually removed
                          </li>
                          <li>
                            <strong>Ends on Selected Month:</strong> Deduction stops automatically after the specified
                            month
                          </li>
                          <li>
                            <strong>Recovering Specific Amount:</strong> Deduction continues until the total specified
                            amount is recovered
                          </li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {activeTab === "benefits" && (
                    <Alert className="mb-4">
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Benefits Information</AlertTitle>
                      <AlertDescription>
                        Percentage-based benefits are calculated based on the Basic Salary. Different benefit types have
                        different behaviors:
                        <ul className="list-disc pl-5 mt-2">
                          <li>
                            <strong>Never Ending:</strong> Benefit continues indefinitely until manually removed
                          </li>
                          <li>
                            <strong>Ends on Selected Month:</strong> Benefit stops automatically after the specified
                            month
                          </li>
                          <li>
                            <strong>Recovering Specific Amount:</strong> Benefit continues until the total specified
                            amount is reached
                          </li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end mb-4">
                    <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> {t("add_component")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>{t("add_salary_component")}</DialogTitle>
                          <DialogDescription>{t("select_a_component_to_add_to_the_salary_template")}</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Input
                            placeholder={t("search_components")}
                            value={componentSearchTerm}
                            onChange={(e) => setComponentSearchTerm(e.target.value)}
                            className="mb-4"
                          />
                          <ScrollArea className="h-[300px]">
                            {isLoadingComponents ? (
                              <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Skeleton key={i} className="h-12 w-full" />
                                ))}
                              </div>
                            ) : filteredAvailableComponents.length > 0 ? (
                              <div className="space-y-2">
                                {filteredAvailableComponents.map((component) => (
                                  <div
                                    key={component.id}
                                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer"
                                    onClick={() => handleAddComponent(component)}
                                  >
                                    <div>
                                      <p className="font-medium">{component.component_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {component.calculation_method === "amount"
                                          ? t("fixed_amount")
                                          : component.component_type === "earning"
                                            ? t("percentage_of_ctc")
                                            : t("percentage_of_basic")}
                                      </p>
                                    </div>
                                    <div className="flex items-center">
                                      {component.is_mandatory && (
                                        <Badge variant="outline" className="mr-2">
                                          {t("mandatory")}
                                        </Badge>
                                      )}
                                      <Plus className="h-4 w-4" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                {componentSearchTerm
                                  ? t("no_matching_components_found")
                                  : t("no_available_components_for_this_type")}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsComponentDialogOpen(false)}>
                            {t("cancel")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("component_name")}</TableHead>
                        <TableHead>{t("calculation_method")}</TableHead>
                        {/* Show amount field for all component types */}
                        <TableHead className="text-right">{t("amount")}</TableHead>
                        {/* Show percentage field for all component types */}
                        <TableHead className="text-right">{t("percentage")}</TableHead>
                        {activeTab !== "earning" && <TableHead>{t("frequency_details")}</TableHead>}
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComponents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            <p className="text-muted-foreground">{t("no_components_added")}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => setIsComponentDialogOpen(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> {t("add_component")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredComponents.map((component, index) => {
                          const globalIndex = salaryComponents.findIndex(
                            (c) => c.salary_components_id === component.salary_components_id,
                          )
                          const componentDetails = getComponentById(component.salary_components_id)
                          const isFixedAmountComponent = componentDetails?.component_name === "Fixed Amount"
                          const isPercentageComponent = componentDetails?.calculation_method === "percentage"
                          const endType = getComponentEndType(componentDetails)

                          return (
                            <TableRow key={component.salary_components_id}>
                              <TableCell>
                                <div className="font-medium">{componentDetails?.component_name}</div>
                                {component.is_mandatory && (
                                  <Badge variant="outline" className="mt-1">
                                    {t("mandatory")}
                                  </Badge>
                                )}
                                {isFixedAmountComponent && (
                                  <Badge variant="secondary" className="mt-1 ml-1">
                                    Auto-calculated
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  {componentDetails?.calculation_method === "amount" ? (
                                    t("fixed_amount")
                                  ) : componentDetails?.component_type === "earning" ? (
                                    <>
                                      <PercentIcon className="h-3 w-3 mr-1" />
                                      {t("of_ctc")}
                                    </>
                                  ) : (
                                    <>
                                      <PercentIcon className="h-3 w-3 mr-1" />
                                      {t("of_basic")}
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              {/* Amount field for all component types */}
                              <TableCell className="text-right">
                                <div className="relative w-24 ml-auto">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                                  <Input
                                    type="number"
                                    className="pl-8 text-right"
                                    value={component.amount === null ? "" : component.amount}
                                    onChange={(e) => handleAmountChange(globalIndex, e.target.value)}
                                    disabled={isFixedAmountComponent || isPercentageComponent}
                                  />
                                </div>
                                {errors[`amount-${globalIndex}`] && (
                                  <p className="text-xs text-destructive mt-1">{errors[`amount-${globalIndex}`]}</p>
                                )}
                              </TableCell>
                              {/* Percentage field for all component types */}
                              <TableCell className="text-right">
                                {isPercentageComponent ? (
                                  <div className="relative w-24 ml-auto">
                                    <Input
                                      type="number"
                                      className="pr-8 text-right"
                                      value={component.percentage === null ? "" : component.percentage}
                                      onChange={(e) => handlePercentageChange(globalIndex, e.target.value)}
                                      disabled={isFixedAmountComponent}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2">%</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                                {errors[`percentage-${globalIndex}`] && (
                                  <p className="text-xs text-destructive mt-1">{errors[`percentage-${globalIndex}`]}</p>
                                )}
                              </TableCell>
                              {activeTab !== "earning" && (
                                <TableCell>
                                  <div className="space-y-2">
                                    {/* Show frequency details with helpful icons */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-2">
                                            {endType === "ends_never" ? (
                                              <Badge variant="outline" className="flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                Never Ending
                                              </Badge>
                                            ) : endType === "ends_on_selected_month" ? (
                                              <Badge variant="outline" className="flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" />
                                                Ends on Date
                                              </Badge>
                                            ) : endType === "recovering_specific_amount" ? (
                                              <Badge variant="outline" className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                Specific Amount
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">N/A</span>
                                            )}
                                            <HelpCircleIcon className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p>{getComponentFrequencyExplanation(componentDetails)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    {/* Add end month field for "ends_on_selected_month" */}
                                    {endType === "ends_on_selected_month" && (
                                      <div className="space-y-1">
                                        <Label htmlFor={`end-month-${globalIndex}`} className="text-xs">
                                          End Month
                                        </Label>
                                        <Input
                                          id={`end-month-${globalIndex}`}
                                          type="month"
                                          value={component.recovering_end_month || ""}
                                          onChange={(e) => handleRecoveringEndMonthChange(globalIndex, e.target.value)}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    )}

                                    {/* Add total amount field for "recovering_specific_amount" */}
                                    {endType === "recovering_specific_amount" && (
                                      <div className="space-y-1">
                                        <Label htmlFor={`total-amount-${globalIndex}`} className="text-xs">
                                          Total Amount
                                        </Label>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs">
                                            ₹
                                          </span>
                                          <Input
                                            id={`total-amount-${globalIndex}`}
                                            type="number"
                                            value={component.total_recovering_amount || ""}
                                            onChange={(e) =>
                                              handleTotalRecoveringAmountChange(globalIndex, e.target.value)
                                            }
                                            className="h-8 text-sm pl-6"
                                          />
                                        </div>
                                        {errors[`recovering-${globalIndex}`] && (
                                          <p className="text-xs text-destructive">
                                            {errors[`recovering-${globalIndex}`]}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveComponent(globalIndex)}
                                  disabled={component.is_mandatory}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Tabs>
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-4">{t("salary_summary")}</h3>
              <div className="space-y-4">
                {/* Earnings Section */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Earnings</h4>
                  <div className="space-y-2">
                    {groupedComponents.earnings.map((comp, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{comp.name}</span>
                        <span>{formatCurrency(comp.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total Earnings</span>
                      <span>{formatCurrency(totals.totalEarnings)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                {groupedComponents.deductions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Deductions</h4>
                    <div className="space-y-2">
                      {groupedComponents.deductions.map((comp, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{comp.name}</span>
                          <span className="text-destructive">{formatCurrency(comp.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium pt-1 border-t">
                        <span>Total Deductions</span>
                        <span className="text-destructive">{formatCurrency(totals.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Salary */}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between font-bold">
                    <span>Net Salary</span>
                    <span>{formatCurrency(totals.netSalary)}</span>
                  </div>
                </div>

                {/* Benefits Section */}
                {groupedComponents.benefits.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2">Employer Contributions</h4>
                    <div className="space-y-2">
                      {groupedComponents.benefits.map((comp, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                          <span>{comp.name}</span>
                          <span>{formatCurrency(comp.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium pt-1 border-t border-muted">
                        <span>Total Employer Contributions</span>
                        <span>{formatCurrency(totals.totalBenefits)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost to Company */}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between font-bold">
                    <span>Cost to Company (CTC)</span>
                    <span>{formatCurrency(Number(monthlySalary) + totals.totalBenefits)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
          <Button onClick={handleSaveSalary} disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {t("save")}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SalaryTemplateForm
