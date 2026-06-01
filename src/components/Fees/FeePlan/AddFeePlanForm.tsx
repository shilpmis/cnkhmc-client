import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, addMonths, isBefore } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, AlertTriangle, Info, Lock, Edit } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  useCreateFeesPlanMutation,
  useLazyFetchDetailFeePlanQuery,
  useLazyGetAllFeesTypeQuery,
  useUpdateFeesPlanMutation,
} from "@/services/feesService"
import type { FeesPlanDetail, InstallmentBreakdowns, FeesPlan, ReqObjectForUpdateFeesPlan } from "@/types/fees"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool, selectAuthState, selectCurrentUser } from "@/redux/slices/authSlice"
import { useLazyGetAllClassesWithOutFeesPlanQuery } from "@/services/AcademicService"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { NumberInput } from "@/components/ui/NumberInput"


// Define the installment types
const installmentTypes = [
  { value: "Monthly", label: "Monthly", maxInstallments: 12 },
  { value: "Quarterly", label: "Quarterly", maxInstallments: 4 },
  { value: "Half Yearly", label: "Half-Yearly", maxInstallments: 2 },
  { value: "Yearly", label: "Yearly", maxInstallments: 1 },
  { value: "Admission", label: "One-time (Admission)", maxInstallments: 1 },
]

// Updated Zod schema for decimal validation
const feePlanSchema = z.object({
  fees_plan: z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    description: z.string().optional(),
    class_id: z.number({ required_error: "Please select a class" }).optional(),
  }),
  fees_types: z
    .array(
      z
        .object({
          fees_type_id: z
            .number({ required_error: "Please select a fee type" })
            .min(1, { message: "Please select a fee type" }),
          installment_type: z
            .string({ required_error: "Please select an installment type" })
            .min(1, { message: "Please select an installment type" }),
          total_installment: z.union([
            z.string().refine(
              (val) => {
                const num = Number.parseInt(val, 10)
                return !isNaN(num) && num >= 1 && num <= 12
              },
              { message: "Must be between 1 and 12 installments" },
            ),
            z
              .number()
              .min(1, { message: "Must have at least 1 installment" })
              .max(12, { message: "Cannot exceed 12 installments" }),
          ]),
          total_amount: z.union([
            z.string().refine(
              (val) => {
                const num = Number.parseFloat(val)
                return !isNaN(num) && num >= 1 && num <= 1000000
              },
              { message: "Amount must be between 1 and 10,00,000" },
            ),
            z.string(),
          ]),
          installment_breakDowns: z.array(
            z.object({
              installment_no: z.number(),
              due_date: z.string(),
              installment_amount: z.union([
                z.string().refine(
                  (val) => {
                    const num = Number.parseFloat(val)
                    return !isNaN(num) && num >= 0 && num <= 1000000
                  },
                  { message: "Amount must be between 0 and 10,00,000" },
                ),
                z.string(),
              ]),
            }),
          ),
        })
        .refine(
          (data) => {
            const totalAmount = Number.parseFloat(data.total_amount || "0")
            const totalBreakdownAmount = data.installment_breakDowns.reduce((sum, item) => {
              return sum + Number.parseFloat(item.installment_amount || "0")
            }, 0)
            return Math.abs(totalAmount - totalBreakdownAmount) < 0.01
          },
          {
            message: "Total amount must match the sum of installment amounts",
            path: ["installment_breakDowns"],
          },
        )
        .refine((data) => validateInstallmentDates(data.installment_breakDowns), {
          message: "Installment dates must be in chronological order",
          path: ["installment_breakDowns"],
        }),
    )
    .min(1, { message: "Plan should have at least one fee type added." })
    .refine(
      (items) => {
        const feeTypeIds = items.map((item) => item.fees_type_id)
        return new Set(feeTypeIds).size === feeTypeIds.length
      },
      {
        message: "Each fee type can only be used once",
        path: ["fees_type_id"],
      },
    ),
})

type FeePlanFormValues = z.infer<typeof feePlanSchema>

interface AddFeePlanFormProps {
  onCancel: () => void
  onSuccessfulSubmit: () => void
  type: "create" | "update"
  plan_id: number | null
}

// Validation functions
const validateInstallmentDates = (installments: any[]) => {
  if (!installments || installments.length < 2) return true
  for (let i = 1; i < installments.length; i++) {
    const prevDate = new Date(installments[i - 1].due_date)
    const currDate = new Date(installments[i].due_date)
    if (isBefore(currDate, prevDate)) {
      return false
    }
  }
  return true
}

export const AddFeePlanForm: React.FC<AddFeePlanFormProps> = ({ onCancel, onSuccessfulSubmit, type, plan_id }) => {
  const authState = useAppSelector(selectAuthState)
  const user = useAppSelector(selectCurrentUser)
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  const { t } = useTranslation()
  const [getAllFeesType, { data: FetchedFeesType, isLoading: isFeeTypeLoading }] = useLazyGetAllFeesTypeQuery()
  const [getClassesWithoutFeesPlan, { data: ClassesWithOutFeesPlan, isLoading: isClassWithOutFeesPlanLoading }] =
    useLazyGetAllClassesWithOutFeesPlanQuery()

  const [
    getFeePlanInDetail,
    { data: fetchedDetialFeePlan, isLoading: isFetchingFeesPlan, isError: isErrorInFetchFessPlanInDetail },
  ] = useLazyFetchDetailFeePlanQuery()

  const [createFeesPlan, { isLoading: isCreatingFeePlan }] = useCreateFeesPlanMutation()
  const [updateFeesPlan, { isLoading: isUpdatinFeePlan }] = useUpdateFeesPlanMutation()

  const [activeTab, setActiveTab] = useState("basic")
  const [activeFeeTypeIndex, setActiveFeeTypeIndex] = useState(0)
  const [isFormFieldsForEditSet, setIsFormFieldsForEditSet] = useState<boolean>(false)
  const [isFullyEditable, setIsFullyEditable] = useState(false)
  const [originalFeeTypes, setOriginalFeeTypes] = useState<any[]>([])
  const [modifiedFeeTypes, setModifiedFeeTypes] = useState<Set<number>>(new Set())
  const [originalFormValues, setOriginalFormValues] = useState<any>(null)
  const [deletedFeeTypes, setDeletedFeeTypes] = useState<Map<number, any>>(new Map()) // Store deleted fee types with their original data
  const [deletedFeeTypeIds, setDeletedFeeTypeIds] = useState<Set<number>>(new Set()) // Track fees_plan_detail_ids to be deleted

  // Initialize the form
  const form = useForm<FeePlanFormValues>({
    resolver: zodResolver(feePlanSchema),
    defaultValues: {
      fees_plan: {
        name: "",
        description: "",
        class_id: 0,
      },
      fees_types: [],
    },
    mode: "onChange",
  })

  // Setup field arrays for plan details
  const {
    fields: planDetailsFields,
    append: appendPlanDetail,
    remove: removePlanDetail,
    update: updatePlanDetail,
  } = useFieldArray({
    control: form.control,
    name: "fees_types",
  })

  // Calculate global total amount
  const calculateGlobalTotal = useCallback(() => {
    const feeTypes = form.watch("fees_types") || []
    return feeTypes.reduce((total, feeType) => {
      return total + Number.parseFloat(feeType.total_amount || "0")
    }, 0)
  }, [form])

  // Function to shift Sunday dates to next working day (Monday)
  const shiftSundayToMonday = useCallback((date: Date) => {
    const newDate = new Date(date)
    if (newDate.getDay() === 0) { // Sunday is 0
      newDate.setDate(newDate.getDate() + 1) // Move to Monday
    }
    return newDate
  }, [])

  // Function to generate empty installment breakdowns based on count
  const generateEmptyInstallmentBreakdowns = useCallback(
    (totalInstallments: number, planDetailIndex: number) => {
      const breakdowns = []
      let startDate = new Date()
      const installmentType = form.getValues(`fees_types.${planDetailIndex}.installment_type`)

      // Set appropriate start date based on installment type
      if (installmentType === "Monthly") {
        startDate = addMonths(new Date(), 1)
      } else if (installmentType === "Quarterly") {
        const currentMonth = startDate.getMonth()
        const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3
        startDate = new Date(startDate.getFullYear(), nextQuarterMonth, 1)
      } else if (installmentType === "Half-Yearly") {
        const currentMonth = startDate.getMonth()
        const nextHalfYear = currentMonth < 6 ? 6 : 0
        startDate = new Date(startDate.getFullYear() + (nextHalfYear === 0 ? 1 : 0), nextHalfYear, 1)
      } else if (installmentType === "Yearly") {
        startDate = new Date(startDate.getFullYear() + 1, 0, 1)
      } else if (installmentType === "Admission") {
        startDate = new Date()
      }

      for (let i = 0; i < totalInstallments; i++) {
        let dueDate

        if (installmentType === "Monthly") {
          dueDate = addMonths(startDate, i)
        } else if (installmentType === "Quarterly") {
          dueDate = addMonths(startDate, i * 3)
        } else if (installmentType === "Half-Yearly") {
          dueDate = addMonths(startDate, i * 6)
        } else if (installmentType === "Yearly") {
          dueDate = addMonths(startDate, i * 12)
        } else {
          dueDate = startDate
        }

        // Shift Sunday dates to Monday
        dueDate = shiftSundayToMonday(dueDate)

        breakdowns.push({
          installment_no: i + 1,
          due_date: format(dueDate, "yyyy-MM-dd"),
          installment_amount: "0.00",
        })
      }

      const currentPlanDetail = form.getValues(`fees_types.${planDetailIndex}`)
      updatePlanDetail(planDetailIndex, {
        ...currentPlanDetail,
        installment_breakDowns: breakdowns,
      })
    },
    [form, updatePlanDetail, shiftSundayToMonday],
  )

  // Add function to track changes
  const trackFeeTypeChange = useCallback((feeTypeIndex: number) => {
    setModifiedFeeTypes(prev => new Set(prev).add(feeTypeIndex))
  }, [])

  // Function to distribute total amount across installments
  const distributeAmount = useCallback(
    (planDetailIndex: number) => {
      const totalAmount = Number.parseFloat(String(form.getValues(`fees_types.${planDetailIndex}.total_amount`)) || "0")
      const breakdowns = form.getValues(`fees_types.${planDetailIndex}.installment_breakDowns`)

      if (!breakdowns || breakdowns.length === 0 || !totalAmount) return

      // Calculate base amount per installment
      const baseAmount = Math.floor((totalAmount * 100) / breakdowns.length) / 100
      const totalBaseAmount = baseAmount * breakdowns.length
      const remainder = Number((totalAmount - totalBaseAmount).toFixed(2))

      const updatedBreakdowns = breakdowns.map((breakdown, idx) => {
        // Add remainder to the last installment
        if (idx === breakdowns.length - 1) {
          return {
            ...breakdown,
            installment_amount: (baseAmount + remainder).toFixed(2),
          }
        }
        return {
          ...breakdown,
          installment_amount: baseAmount.toFixed(2),
        }
      })

      const currentPlanDetail = form.getValues(`fees_types.${planDetailIndex}`)
      updatePlanDetail(planDetailIndex, {
        ...currentPlanDetail,
        installment_breakDowns: updatedBreakdowns,
      })

      // Track this fee type as modified
      trackFeeTypeChange(planDetailIndex)
    },
    [form, updatePlanDetail, trackFeeTypeChange],
  )

  // Handle changes to installment type or count
  const handleInstallmentTypeChange = useCallback(
    (planDetailIndex: number, installmentType: string) => {
      const typeConfig = installmentTypes.find((type) => type.value === installmentType)
      const maxInstallments = typeConfig?.maxInstallments || 12

      let defaultCount = maxInstallments
      if (installmentType === "Yearly" || installmentType === "Admission") {
        defaultCount = 1
      }

      form.setValue(`fees_types.${planDetailIndex}.total_installment`, defaultCount)
      generateEmptyInstallmentBreakdowns(defaultCount, planDetailIndex)

      // Track this fee type as modified when installment type changes
      trackFeeTypeChange(planDetailIndex)
    },
    [form, generateEmptyInstallmentBreakdowns, trackFeeTypeChange],
  )

  const handleInstallmentCountChange = useCallback(
    (planDetailIndex: number, count: number) => {
      generateEmptyInstallmentBreakdowns(count, planDetailIndex)
      // Track this fee type as modified when installment count changes
      trackFeeTypeChange(planDetailIndex)
    },
    [generateEmptyInstallmentBreakdowns, trackFeeTypeChange],
  )

  // Handle fee type deletion with ability to restore
  const handleDeleteFeeType = useCallback((planDetailIndex: number) => {
    const feeTypeData = form.getValues(`fees_types.${planDetailIndex}`)
    const originalFeeType = originalFeeTypes[planDetailIndex]

    // If this is an existing fee type (has original data), store it for potential restoration
    if (originalFeeType && type === "update") {
      const feeTypeId = feeTypeData.fees_type_id
      const deletedData = {
        ...feeTypeData,
        originalIndex: planDetailIndex,
        fees_plan_detail_id: originalFeeType.fees_type.id,
        originalData: originalFeeType
      }

      setDeletedFeeTypes(prev => new Map(prev).set(feeTypeId, deletedData))
      setDeletedFeeTypeIds(prev => new Set(prev).add(originalFeeType.fees_type.id))
    }

    // Remove from form
    removePlanDetail(planDetailIndex)

    // Remove from modified tracking
    setModifiedFeeTypes(prev => {
      const newSet = new Set(prev)
      newSet.delete(planDetailIndex)
      // Adjust indices for remaining items
      const adjustedSet = new Set<number>()
      newSet.forEach(index => {
        if (index > planDetailIndex) {
          adjustedSet.add(index - 1)
        } else {
          adjustedSet.add(index)
        }
      })
      return adjustedSet
    })

    // Adjust active tab
    if (planDetailIndex === activeFeeTypeIndex) {
      if (planDetailIndex > 0) {
        setActiveFeeTypeIndex(planDetailIndex - 1)
      } else if (planDetailsFields.length > 1) {
        setActiveFeeTypeIndex(0)
      } else {
        setActiveTab("basic")
      }
    } else if (planDetailIndex < activeFeeTypeIndex) {
      setActiveFeeTypeIndex(activeFeeTypeIndex - 1)
    }

    toast({
      variant: "default",
      title: "Fee Type Removed",
      description: type === "update" ? "Fee type removed. You can add it back if needed." : "Fee type removed from plan.",
    })
  }, [form, originalFeeTypes, type, removePlanDetail, activeFeeTypeIndex, planDetailsFields.length, setActiveTab])

  // Add a new fee type to the plan
  const handleAddFeeType = () => {
    if (!isFullyEditable && type === "update") {
      toast({
        variant: "destructive",
        title: "Cannot Add Fee Type",
        description: "This fee plan is not editable. You can only update general information.",
      })
      return
    }

    // Check if there are remaining fee types
    const usedFeeTypeIds = planDetailsFields.map((_, index) =>
      form.getValues(`fees_types.${index}.fees_type_id`)
    ).filter(id => id && id > 0)

    const availableFeeTypes = FetchedFeesType?.filter(feeType =>
      !usedFeeTypeIds.includes(feeType.id)
    ) || []

    if (availableFeeTypes.length === 0) {
      toast({
        variant: "destructive",
        title: "No Fee Types Available",
        description: "All available fee types have been added to this plan.",
      })
      return
    }

    // Check if we have any deleted fee types that can be restored
    const deletedFeeTypesList = Array.from(deletedFeeTypes.entries()).filter(([feeTypeId]) =>
      !usedFeeTypeIds.includes(feeTypeId)
    )

    if (deletedFeeTypesList.length > 0) {
      // Show option to restore deleted fee type
      const feeTypeId = deletedFeeTypesList[0][0]
      const deletedData = deletedFeeTypesList[0][1]

      // Restore the deleted fee type
      appendPlanDetail({
        fees_type_id: deletedData.fees_type_id,
        installment_type: deletedData.installment_type,
        total_installment: deletedData.total_installment,
        total_amount: deletedData.total_amount,
        installment_breakDowns: deletedData.installment_breakDowns,
      })

      // Remove from deleted tracking since it's restored
      setDeletedFeeTypes(prev => {
        const newMap = new Map(prev)
        newMap.delete(feeTypeId)
        return newMap
      })

      setDeletedFeeTypeIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(deletedData.fees_plan_detail_id)
        return newSet
      })

      setActiveFeeTypeIndex(planDetailsFields.length)
      setActiveTab("feeTypes")

      toast({
        variant: "default",
        title: "Fee Type Restored",
        description: "Previously deleted fee type has been restored with its original data.",
      })

      return
    }

    // Add new fee type as before
    appendPlanDetail({
      fees_type_id: 0,
      installment_type: "",
      total_installment: 0,
      total_amount: "0.00",
      installment_breakDowns: [],
    })
    generateEmptyInstallmentBreakdowns(1, planDetailsFields.length)
    setActiveFeeTypeIndex(planDetailsFields.length)
    setActiveTab("feeTypes")
  }

  // Enhanced categorize changes function
  const categorizeChangesForUpdate = (currentFeeTypes: any[], originalFeeTypes: any[]) => {
    const newFeeTypes: any[] = []
    const existingFeeTypes: any[] = []

    currentFeeTypes.forEach((feeType, index) => {
      // Check if this is a completely new fee type
      if (!originalFeeTypes[index]) {
        newFeeTypes.push(feeType)
        return
      }

      // Only include existing fee types that have been modified
      if (modifiedFeeTypes.has(index)) {
        const originalFeeType = originalFeeTypes[index]

        // Check what specifically changed
        const hasAmountChanged = feeType.total_amount !== originalFeeType.fees_type.total_amount
        const hasInstallmentCountChanged = Number(feeType.total_installment) !== originalFeeType.fees_type.total_installment
        const hasInstallmentTypeChanged = feeType.installment_type !== originalFeeType.fees_type.installment_type

        // Check if any installment amounts or dates changed
        const hasInstallmentDetailsChanged = feeType.installment_breakDowns.some((breakdown: any, breakdownIndex: number) => {
          const originalBreakdown = originalFeeType.installment_breakDowns?.[breakdownIndex]
          if (!originalBreakdown) return true // New installment

          return (
            breakdown.installment_amount !== originalBreakdown.installment_amount ||
            breakdown.due_date !== format(new Date(originalBreakdown.due_date), "yyyy-MM-dd")
          )
        })

        // Only include if there are actual changes
        if (hasAmountChanged || hasInstallmentCountChanged || hasInstallmentTypeChanged || hasInstallmentDetailsChanged) {
          // Map existing installments and handle new ones
          const mappedBreakdowns = feeType.installment_breakDowns.map((breakdown: any, breakdownIndex: number) => {
            const originalBreakdown = originalFeeType.installment_breakDowns?.[breakdownIndex]
            return {
              ...breakdown,
              id: originalBreakdown?.id || null, // null for new installments
            }
          })

          existingFeeTypes.push({
            ...feeType,
            fees_plan_detail_id: originalFeeType.fees_type.id,
            installment_breakDowns: mappedBreakdowns,
          })
        }
      }
    })

    return {
      newFeeTypes,
      existingFeeTypes,
      deletedFeeTypes: Array.from(deletedFeeTypeIds)
    }
  }

  // Handle form submission
  const handleSubmit = async (values: FeePlanFormValues) => {
    let response

    if (type === "create") {
      response = await createFeesPlan({
        data: {
          fees_plan: {
            name: values.fees_plan.name,
            description: values.fees_plan.description ?? "",
            class_id: values.fees_plan.class_id!,
          },
          plan_details: values.fees_types.map((detail) => ({
            fees_type_id: detail.fees_type_id,
            installment_type: detail.installment_type,
            total_installment: Number(detail.total_installment),
            total_amount: detail.total_amount,
            installment_breakDowns: detail.installment_breakDowns.map((breakdown) => ({
              installment_no: breakdown.installment_no,
              due_date: breakdown.due_date,
              installment_amount: breakdown.installment_amount,
            })),
          })),
        },
        academic_session: CurrentAcademicSessionForSchool!.id,
      })
    } else {
      // For updates, construct the request body based on editability
      const updatedPlan: ReqObjectForUpdateFeesPlan = {
        general_detail_for_plan: {
          name: values.fees_plan.name,
          description: values.fees_plan.description ?? "",
        },
      }

      // Only include fee type updates if plan is fully editable
      if (isFullyEditable) {
        const { newFeeTypes, existingFeeTypes, deletedFeeTypes } = categorizeChangesForUpdate(values.fees_types, originalFeeTypes)

        if (newFeeTypes.length > 0) {
          updatedPlan.new_fees_type = newFeeTypes.map((detail) => ({
            fees_type_id: detail.fees_type_id,
            installment_type: detail.installment_type,
            total_installment: Number(detail.total_installment),
            total_amount: detail.total_amount,
            installment_breakDowns: detail.installment_breakDowns.map((breakdown: any) => ({
              installment_no: breakdown.installment_no,
              due_date: breakdown.due_date,
              installment_amount: breakdown.installment_amount,
            })),
          }))
        }

        if (existingFeeTypes.length > 0) {
          updatedPlan.existing_fees_type = existingFeeTypes.map((detail) => ({
            fees_plan_detail_id: detail.fees_plan_detail_id,
            fees_type_id: detail.fees_type_id,
            installment_type: detail.installment_type,
            total_installment: Number(detail.total_installment),
            total_amount: detail.total_amount,
            installment_breakDowns: detail.installment_breakDowns.map((breakdown: any) => ({
              id: breakdown.id,
              installment_no: breakdown.installment_no,
              due_date: breakdown.due_date,
              installment_amount: breakdown.installment_amount,
            })),
          }))
        }

        if (deletedFeeTypes.length > 0) {
          updatedPlan.deleted_fees_type = deletedFeeTypes
        }
      }

      response = await updateFeesPlan({
        payload: updatedPlan,
        plan_id: plan_id!,
      })
    }

    if (response?.data) {
      toast({
        variant: "default",
        title: `Fee Plan ${type === "create" ? "Created" : "Updated"}`,
        description: `Fee Plan has been ${type === "create" ? "created" : "updated"} successfully.`,
      })
      onSuccessfulSubmit()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          (response?.error as any)?.data?.message ||
          "An error occurred while updating the fee plan. Please try again later.",
      })
    }
  }

  // Check if a fee type is already selected
  const isFeeTypeSelected = useCallback(
    (feeTypeId: number, currentIndex: number) => {
      return planDetailsFields.some(
        (field, index) => index !== currentIndex && form.getValues(`fees_types.${index}.fees_type_id`) === feeTypeId,
      )
    },
    [form, planDetailsFields],
  )

  // Calculate total of installment amounts for validation feedback
  const calculateInstallmentTotal = useCallback(
    (planDetailIndex: number) => {
      const breakdowns = form.getValues(`fees_types.${planDetailIndex}.installment_breakDowns`) || []
      return breakdowns.reduce((sum, item) => {
        const amount = Number.parseFloat(item.installment_amount || "0")
        return Number((sum + (isNaN(amount) ? 0 : amount)).toFixed(2))
      }, 0)
    },
    [form],
  )

  // Get max installments for the current installment type
  const getMaxInstallments = useCallback((installmentType: string) => {
    const typeConfig = installmentTypes.find((type) => type.value === installmentType)
    return typeConfig?.maxInstallments || 24
  }, [])

  // Check if installment type is fixed (one-time or yearly)
  const isFixedInstallmentType = useCallback((installmentType: string) => {
    return installmentType === "Yearly" || installmentType === "Admission"
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  }

  // Update form values when plan details are fetched
  useEffect(() => {
    if (
      fetchedDetialFeePlan &&
      !isFormFieldsForEditSet
    ) {
      const { fees_plan, fees_types, is_editable } = fetchedDetialFeePlan

      setIsFullyEditable(is_editable ?? false)

      const formData = {
        fees_plan: {
          name: fees_plan.name,
          description: fees_plan.description,
          class_id: fees_plan.class_id,
        },
        fees_types: fees_types.map(
          (feeType: { fees_type: FeesPlanDetail; installment_breakDowns: InstallmentBreakdowns[] }) => ({
            fees_type_id: feeType.fees_type.fees_type_id,
            installment_type: feeType.fees_type.installment_type,
            total_installment: feeType.fees_type.total_installment,
            total_amount: feeType.fees_type.total_amount.toString(),
            installment_breakDowns:
              feeType.installment_breakDowns?.map((breakdown: any) => ({
                installment_no: breakdown.installment_no,
                due_date: format(new Date(breakdown.due_date), "yyyy-MM-dd"),
                installment_amount: breakdown.installment_amount,
              })) || [],
          }),
        ),
      }

      // Store original values for comparison
      setOriginalFormValues(JSON.parse(JSON.stringify(formData)))

      form.reset(formData)

      // Clear existing fee types
      while (form.getValues("fees_types").length > 0) {
        removePlanDetail(0)
      }

      formData.fees_types.forEach((data: any) => {
        appendPlanDetail(data)
      })

      setOriginalFeeTypes(fees_types)
      setActiveFeeTypeIndex(0)
      setIsFormFieldsForEditSet(true)

      // Reset all tracking states
      setModifiedFeeTypes(new Set())
      setDeletedFeeTypes(new Map())
      setDeletedFeeTypeIds(new Set())

      if (fees_types.length > 0) {
        setActiveTab("feeTypes")
      }
    }
  }, [fetchedDetialFeePlan, isFormFieldsForEditSet])

  // Handle form errors
  useEffect(() => {
    if (form.formState.errors.fees_plan) {
      setActiveTab("basic")
    } else if (Array.isArray(form.formState.errors.fees_types)) {
      const nonNullErrors = form.formState.errors.fees_types.filter((error) => error !== null)
      const firstError = nonNullErrors[0]

      if (firstError?.fees_type_id) {
        toast({
          variant: "destructive",
          title: "Fee Type Error",
          description: `${firstError.fees_type_id.message}`,
        })
      } else if (firstError?.installment_type) {
        toast({
          variant: "destructive",
          title: "Installment Type Error",
          description: `${firstError.installment_type.message}`,
        })
      } else if (firstError?.total_amount) {
        toast({
          variant: "destructive",
          title: "Total Amount Error",
          description: `${firstError.total_amount.message}`,
        })
      } else if (firstError?.installment_breakDowns) {
        toast({
          variant: "destructive",
          title: "Installment Error",
          description: `${firstError.installment_breakDowns.root?.message || "Invalid installment data"}`,
        })
      }
    } else if (form.formState.errors.fees_types) {
      toast({
        title: form.formState.errors.fees_types.message,
        variant: "destructive",
      })
    }
  }, [form.formState.errors])

  // Initialize data
  useEffect(() => {
    if (plan_id && plan_id !== 0) {
      getFeePlanInDetail({ academic_session: CurrentAcademicSessionForSchool!.id, plan_id })
    } else {
      setIsFormFieldsForEditSet(true)
      setIsFullyEditable(true) // For create mode
    }
    getClassesWithoutFeesPlan({ school_id: authState.user!.school_id })
    getAllFeesType({
      academic_session_id: CurrentAcademicSessionForSchool!.id,
      applicable_to: "plan",
    })
  }, [
    plan_id,
    CurrentAcademicSessionForSchool,
    authState.user,
    getFeePlanInDetail,
    getClassesWithoutFeesPlan,
    getAllFeesType,
  ])

  if (isFetchingFeesPlan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading fee plan details...</span>
      </div>
    )
  }

  if (isErrorInFetchFessPlanInDetail) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Fee Plan</AlertTitle>
        <AlertDescription>There was an error fetching fee plan details. Please try again later.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Form {...form}>
      {((!isErrorInFetchFessPlanInDetail && fetchedDetialFeePlan) || type === "create") && isFormFieldsForEditSet && (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Global Total Amount Display */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-medium text-blue-900">Total Fee Plan Amount:</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">{formatCurrency(calculateGlobalTotal())}</div>
              </div>
              <p className="text-sm text-blue-600 mt-2">This is the total amount across all fee types in this plan.</p>
            </CardContent>
          </Card>

          {/* Editability Warning */}
          {type === "update" && !isFullyEditable && (
            <Alert className="border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Limited Editing Mode</AlertTitle>
              <AlertDescription className="text-amber-700">
                This fee plan is not fully editable. You can only update the plan name and description. Fee types,
                installments, and amounts cannot be modified.
              </AlertDescription>
            </Alert>
          )}

          {type === "update" && isFullyEditable && (
            <Alert className="border-green-200 bg-green-50">
              <Edit className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Full Editing Mode</AlertTitle>
              <AlertDescription className="text-green-700">
                This fee plan is fully editable. You can modify all aspects including fee types, installments, amounts,
                and dates.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t("basic_information")}</TabsTrigger>
              <TabsTrigger value="feeTypes" disabled={type === "update" && !isFullyEditable}>
                {t("fee_type_and_installments")}
                {type === "update" && !isFullyEditable && <Lock className="ml-2 h-3 w-3" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("fee_plan_details")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  <FormField
                    control={form.control}
                    name="fees_plan.class_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("class")}</FormLabel>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={(value) => field.onChange(Number.parseInt(value))}
                            value={field.value ? field.value.toString() : undefined}
                            disabled={type === "update"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("select_a_class")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ClassesWithOutFeesPlan &&
                                ClassesWithOutFeesPlan.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id.toString()} className="hover:bg-slate-50">
                                    Class {cls.class}
                                  </SelectItem>
                                ))}
                              {(isClassWithOutFeesPlanLoading || !ClassesWithOutFeesPlan) && (
                                <SelectItem value="loading" disabled>
                                  Loading...
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {type === "update" && !field.value && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Not attached
                            </Badge>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fees_plan.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("plan_name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("enter_fee_plan_name")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      {t("cancel")}
                    </Button>
                    {(type === "create" || isFullyEditable) && (
                      <Button type="button" onClick={() => setActiveTab("feeTypes")}>
                        {t("next:_add_fee_type")}
                      </Button>
                    )}
                    {type === "update" && !isFullyEditable && (
                      <Button type="submit" disabled={isUpdatinFeePlan}>
                        {isUpdatinFeePlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("update_plan")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feeTypes" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t("fee_types")}</h3>
                <Button
                  type="button"
                  onClick={handleAddFeeType}
                  variant="outline"
                  disabled={
                    (type === "update" && !isFullyEditable) ||
                    (() => {
                      const usedFeeTypeIds = planDetailsFields.map((_, index) =>
                        form.getValues(`fees_types.${index}.fees_type_id`)
                      ).filter(id => id && id > 0)

                      const availableFeeTypes = FetchedFeesType?.filter(feeType =>
                        !usedFeeTypeIds.includes(feeType.id)
                      ) || []

                      return availableFeeTypes.length === 0
                    })()
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> {t("add_fee_type")}
                </Button>
              </div>

              {planDetailsFields.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t("no_fee_types_added")}</AlertTitle>
                  <AlertDescription>
                    {t("click_the_add_fee_type_button_to_add_fee_types_to_this_plan")}
                  </AlertDescription>
                </Alert>
              ) : (
                <Tabs
                  value={activeFeeTypeIndex.toString()}
                  onValueChange={(value) => setActiveFeeTypeIndex(Number.parseInt(value))}
                >
                  <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {planDetailsFields.map((field, index) => {
                      const feeTypeId = form.watch(`fees_types.${index}.fees_type_id`)
                      const feeTypeName =
                        (FetchedFeesType && FetchedFeesType.find((ft) => ft.id === feeTypeId)?.name) ||
                        `Fee Type ${index + 1}`
                      return (
                        <TabsTrigger key={field.id} value={index.toString()} className="truncate">
                          {feeTypeName}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  <ScrollArea className="max-h-[70vh] overflow-auto">
                    {planDetailsFields.map((field, index) => {
                      const installmentBreakdowns = form.watch(`fees_types.${index}.installment_breakDowns`) || []
                      const installmentType = form.watch(`fees_types.${index}.installment_type`)
                      const totalAmount = form.watch(`fees_types.${index}.total_amount`)
                      const installmentTotal = calculateInstallmentTotal(index)
                      const isAmountExceeded = Math.abs(installmentTotal - Number.parseFloat(totalAmount || "0")) > 0.01

                      return (
                        <TabsContent key={field.id} value={index.toString()} className="space-y-4 pt-4">
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                              <CardTitle>{t("fee_type_details")}</CardTitle>
                              {(type === "create" || (type === "update" && isFullyEditable)) && (
                                <Button
                                  type="button"
                                  className="text-white"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteFeeType(index)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("remove")}
                                </Button>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <FormField
                                control={form.control}
                                name={`fees_types.${index}.fees_type_id`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel required>{t("fee_type")}</FormLabel>
                                    <Select
                                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                                      value={field.value ? field.value.toString() : undefined}
                                      disabled={type === 'update'}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={t("select_a_fee_type")} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {FetchedFeesType &&
                                          FetchedFeesType.map((feeType) => (
                                            <SelectItem
                                              key={feeType.id}
                                              value={feeType.id.toString()}
                                              disabled={isFeeTypeSelected(feeType.id, index)}
                                            >
                                              {feeType.name}
                                            </SelectItem>
                                          ))}
                                        {(isFeeTypeLoading || !FetchedFeesType) && (
                                          <SelectItem value="loading" disabled>
                                            Loading...
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`fees_types.${index}.installment_type`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel required>{t("installment_type")}</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value)
                                          handleInstallmentTypeChange(index, value)
                                        }}
                                        value={field.value}
                                        disabled={!isFullyEditable && !!fetchedDetialFeePlan?.fees_types[index]}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder={t("select_installment_type")} />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {installmentTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`fees_types.${index}.total_installment`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel required>{t("total_installments")}</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          {...field}
                                          value={field.value || ""}
                                          // disabled={
                                          //   isFixedInstallmentType(installmentType) ||
                                          //   (type === "update" && !!fetchedDetialFeePlan?.fees_types[index])
                                          // }
                                          disabled={!isFullyEditable && !!fetchedDetialFeePlan?.fees_types[index]}
                                          onChange={(e) => {
                                            const numericValue = e.target.value.replace(/[^0-9]/g, "")
                                            const maxInstallments = getMaxInstallments(installmentType)

                                            let value = numericValue ? Number.parseInt(numericValue, 10) : ""
                                            if (value && Number(value) > Number(maxInstallments))
                                              value = maxInstallments
                                            if (value && Number(value) < 1) value = 1

                                            field.onChange(value)
                                            if (value && typeof value === "number") {
                                              setTimeout(() => {
                                                handleInstallmentCountChange(index, value)
                                              }, 0)
                                            }
                                          }}
                                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      {installmentType && (
                                        <p className="text-xs text-muted-foreground">
                                          Max: {getMaxInstallments(installmentType)} installments
                                        </p>
                                      )}
                                    </FormItem>
                                  )}
                                />

                                {(isFullyEditable || type === 'create') && <FormField
                                  control={form.control}
                                  name={`fees_types.${index}.total_amount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel required>{t("total_amount")}</FormLabel>
                                      <FormControl>
                                        <NumberInput
                                          {...field}
                                          decimal={true}
                                          value={field.value.toString() ?? undefined}
                                          onChange={(value) => {
                                            field.onChange(value)

                                            // Track this fee type as modified when amount changes
                                            trackFeeTypeChange(index)

                                            if (installmentBreakdowns.length > 0) {
                                              const currentPlanDetail = form.getValues(`fees_types.${index}`)
                                              const resetBreakdowns = currentPlanDetail.installment_breakDowns.map(
                                                (breakdown) => ({
                                                  ...breakdown,
                                                  installment_amount: "0.00",
                                                }),
                                              )

                                              form.setValue(
                                                `fees_types.${index}.installment_breakDowns`,
                                                resetBreakdowns,
                                                {
                                                  shouldDirty: true,
                                                  shouldValidate: true,
                                                  shouldTouch: true,
                                                },
                                              )
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      <p className="text-xs text-muted-foreground">Max: ₹10,00,000</p>
                                    </FormItem>
                                  )}
                                />}
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => distributeAmount(index)}
                                  disabled={
                                    !totalAmount ||
                                    Number.parseFloat(totalAmount) <= 0 ||
                                    installmentBreakdowns.length === 0
                                  }
                                >
                                  {t("distribute_amount_evenly")}
                                </Button>
                              </div>

                              <div className="pt-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium">{t("installment_breakdown")}</h4>
                                  {Number(totalAmount) > 0 && (
                                    <div className="text-sm">
                                      <span
                                        className={
                                          isAmountExceeded ? "text-red-500 font-medium" : "text-green-600 font-medium"
                                        }
                                      >
                                        Total: {formatCurrency(installmentTotal)}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {" "}
                                        / {formatCurrency(Number.parseFloat(totalAmount))}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {isAmountExceeded && (
                                  <Alert variant="destructive" className="mb-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      Sum of installment amounts ({formatCurrency(installmentTotal)}) must equal total
                                      amount ({formatCurrency(Number.parseFloat(totalAmount))})
                                    </AlertDescription>
                                  </Alert>
                                )}

                                {installmentBreakdowns.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>{t("installment")} #</TableHead>
                                        <TableHead>{t("due_date")}</TableHead>
                                        <TableHead>{t("amount")}</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {installmentBreakdowns.map((installment, installmentIndex) => {
                                        const isInstallmentDisabled = !isFullyEditable || (fetchedDetialFeePlan?.fees_plan?.status === "Inactive")

                                        return (
                                          <TableRow key={`${index}-${installmentIndex}`} className={isInstallmentDisabled ? "opacity-50" : ""}>
                                            <TableCell>
                                              <Badge variant="outline">{installment.installment_no}</Badge>
                                            </TableCell>
                                            <TableCell>
                                              <Controller
                                                control={form.control}
                                                name={`fees_types.${index}.installment_breakDowns.${installmentIndex}.due_date`}
                                                render={({ field }) => (
                                                  <input
                                                    type="date"
                                                    value={field.value || ""}
                                                    disabled={isInstallmentDisabled}
                                                    onChange={(e) => {
                                                      const selectedDate = new Date(e.target.value)
                                                      const adjustedDate = shiftSundayToMonday(selectedDate)
                                                      const adjustedDateString = format(adjustedDate, "yyyy-MM-dd")

                                                      if (adjustedDateString !== e.target.value) {
                                                        toast({
                                                          variant: "default",
                                                          title: "Date Adjusted",
                                                          description: "Due date was moved from Sunday to Monday.",
                                                        })
                                                      }

                                                      field.onChange(adjustedDateString)

                                                      // Track this fee type as modified when due date changes
                                                      trackFeeTypeChange(index)
                                                    }}
                                                    onBlur={field.onBlur}
                                                    ref={field.ref}
                                                    className="border border-gray-300 p-2 rounded-md w-full"
                                                  />
                                                )}
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <FormField
                                                control={form.control}
                                                name={`fees_types.${index}.installment_breakDowns.${installmentIndex}.installment_amount`}
                                                render={({ field }) => (
                                                  <NumberInput
                                                    decimal={true}
                                                    {...field}
                                                    value={field.value.toString() || undefined}
                                                    disabled={isInstallmentDisabled}
                                                    onChange={(amount) => {
                                                      if (!amount) {
                                                        field.onChange("0")
                                                        return
                                                      }
                                                      field.onChange(amount)

                                                      // Track this fee type as modified when installment amount changes
                                                      trackFeeTypeChange(index)
                                                    }}
                                                    className="w-full"
                                                  />
                                                )}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>{t("no_installments_defined")}</AlertTitle>
                                    <AlertDescription>
                                      {t("set_the_installment_type,_count,_and_total_amount_to_generate_installments.")}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      )
                    })}
                  </ScrollArea>
                </Tabs>
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                  {t("back_to_basic_information")}
                </Button>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isCreatingFeePlan || isUpdatinFeePlan}>
                    {(isCreatingFeePlan || isUpdatinFeePlan) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {plan_id ? t("update_fee_plan") : t("create_fee_plan")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      )}
    </Form>
  )
}