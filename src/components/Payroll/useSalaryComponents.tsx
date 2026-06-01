"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import type { SalaryComponent } from "@/types/payroll"
// import { SalaryComponentService } from "./services/salary-component-service"
import { useCreateSalaryComponentMutation, useLazyDeleteSalaryComponentQuery, useLazyFetchSalaryComponentQuery, useUpdaetSalaryComponentMutation } from "@/services/PayrollService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
export const useSalaryComponents = () => {
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fetchSalaryComponent , {data : SalaryComponents}] = useLazyFetchSalaryComponentQuery()
  const [createSalaryComponent , {}] = useCreateSalaryComponentMutation()
  const [updateSalaryComponent , {}] = useUpdaetSalaryComponentMutation()
  const [deleteSalaryComponent , {}] = useLazyDeleteSalaryComponentQuery()
   
  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)


  // Fetch all components
  const fetchComponents = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const components = await fetchSalaryComponent({
        academic_session: CurrentAcademicSessionForSchool!.id,
      }).unwrap()
      setComponents(components.data)
    } catch (error: any) {
      setError(error.message || "Failed to fetch salary components")
      toast({
        title: "Error",
        description: error.message || "Failed to fetch salary components",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Create a new component
  const createComponent = useCallback(async (data: Omit<SalaryComponent, "id" | "school_id" | "created_at" | "updated_at">) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const newComponent = await createSalaryComponent({
        payload : data
      }).unwrap()
      setComponents((prev) => [...prev, newComponent])
      return newComponent
    } catch (error: any) {
      setError(error.message || "Failed to create component")
      throw new Error(error.message || "Failed to create component")
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  // Update an existing component
  const updateComponent = useCallback(async (id: number, data: Partial<SalaryComponent>) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const updatedComponent = await updateSalaryComponent({
        payload: data,
        salary_component_id: id,
      })
      setComponents((prev) =>
        prev.map((component) => (component.id === id ? { ...component, ...updatedComponent } : component)),
      )
      return updatedComponent
    } catch (error: any) {
      setError(error.message || "Failed to update component")
      throw new Error(error.message || "Failed to update component")
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  // Delete a component
  const deleteComponent = useCallback(async (id: number) => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteSalaryComponent({ salary_component_id : id}).unwrap()
      setComponents((prev) => prev.filter((component) => component.id !== id))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data.message || "Failed to delete component",
        variant: "destructive",
      }) 
      // setError(error.data.message || "Failed to delete component")
      throw new Error(error.data.message || "Failed to delete component")
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Load data on initial mount
  useEffect(() => {
    fetchComponents()
  }, [fetchComponents])

  return {
    components,
    isLoading,
    isRefreshing,
    isSubmitting,
    isDeleting,
    error,
    fetchComponents,
    createComponent,
    updateComponent,
    deleteComponent,
  }
}
