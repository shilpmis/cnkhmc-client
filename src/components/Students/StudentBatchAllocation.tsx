"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useBulkAssignPracticalBatchMutation, useFetchPracticalBatchSettingsQuery } from "@/services/StudentServices"
import { SaralPagination } from "../ui/common/SaralPagination"
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Info } from 'lucide-react'
import type { PageDetailsForStudents, Student } from "@/types/student"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StudentBatchAllocationProps {
  filteredStudents: Student[]
  PageDetailsForStudents: PageDetailsForStudents | null
  onPageChange: (page: number) => Promise<void>
  isCollege: boolean
}

export default function StudentBatchAllocation({
  filteredStudents,
  PageDetailsForStudents,
  onPageChange,
  isCollege
}: StudentBatchAllocationProps) {
  const { t } = useTranslation()
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [batchToAssign, setBatchToAssign] = useState<string>("")
  
  const [bulkAssignBatch, { isLoading: isAssigningBulk }] = useBulkAssignPracticalBatchMutation()
  const [individualAssignBatch, { isLoading: isAssigningIndividual }] = useBulkAssignPracticalBatchMutation()
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null)

  // Dynamic batch names from settings
  const { data: batchSettings } = useFetchPracticalBatchSettingsQuery()
  const configuredBatches: string[] = batchSettings?.batches ?? ['Batch A', 'Batch B', 'Batch C']

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Memoized sorted students
  const sortedStudents = useMemo(() => {
    if (!sortField) return filteredStudents

    return [...filteredStudents].sort((a, b) => {
      let aValue: any = a[sortField as keyof Student]
      let bValue: any = b[sortField as keyof Student]

      // Handle null/undefined values
      if (aValue == null) aValue = ''
      if (bValue == null) bValue = ''

      // Convert to string for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredStudents, sortField, sortDirection])

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1 text-primary" /> :
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
  }

  // Bulk assignment handler
  const handleBulkAssign = async () => {
    if (selectedStudentIds.length === 0) return
    if (!batchToAssign) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select a batch to allocate.",
      })
      return
    }

    try {
      await bulkAssignBatch({
        student_ids: selectedStudentIds,
        practical_batch: batchToAssign === "None" ? null : batchToAssign || null
      }).unwrap()

      toast({
        variant: "default",
        title: "Success",
        description: `Successfully allocated selected students to ${batchToAssign === "None" ? "no batch" : batchToAssign}.`,
      })
      setSelectedStudentIds([])
      setBatchToAssign("")
      if (PageDetailsForStudents) {
        await onPageChange(PageDetailsForStudents.current_page)
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.data?.message || "Failed to assign batch in bulk.",
      })
    }
  }

  // Individual inline assignment handler
  const handleIndividualAssign = async (studentId: number, batchValue: string, studentName: string) => {
    setUpdatingStudentId(studentId)
    try {
      await individualAssignBatch({
        student_ids: [studentId],
        practical_batch: batchValue === "None" ? null : batchValue || null
      }).unwrap()

      toast({
        variant: "default",
        title: "Success",
        description: `Successfully updated batch for ${studentName}.`,
      })
      if (PageDetailsForStudents) {
        await onPageChange(PageDetailsForStudents.current_page)
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.data?.message || "Failed to update batch.",
      })
    } finally {
      setUpdatingStudentId(null)
    }
  }

  // Badge styles helper — cycles through a colour palette for any number of batches
  const BADGE_COLORS = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
  ]
  const getBatchBadgeColor = (batch: string | null | undefined) => {
    if (!batch) return 'bg-gray-100 text-gray-800 border-gray-200'
    const idx = configuredBatches.indexOf(batch)
    if (idx >= 0) return BADGE_COLORS[idx % BADGE_COLORS.length]
    return 'bg-green-100 text-green-800 border-green-200'
  }

  if (!isCollege) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 p-6 text-amber-800">
          <Info className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Practical Batch Allocation Not Available</p>
            <p className="text-sm text-amber-700/95 mt-0.5">
              Practical batch allocations are only supported for College student enrollments.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!PageDetailsForStudents) {
    return <div className="text-center py-8 text-gray-500">Loading batch details...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Practical Batch Allocation</CardTitle>
          <CardDescription>
            Divide students into practical batches for laboratory assignments. Batch names are configured in
            <strong> Settings → Student Management → Practical Batches</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk allocation controls */}
          {selectedStudentIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-lg mb-6 animate-in slide-in-from-top-2 duration-200">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {selectedStudentIds.length} {selectedStudentIds.length === 1 ? "student" : "students"} selected
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Select
                  value={batchToAssign}
                  onValueChange={setBatchToAssign}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None (Remove Batch)</SelectItem>
                    {configuredBatches.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  onClick={handleBulkAssign}
                  disabled={isAssigningBulk || !batchToAssign}
                >
                  {isAssigningBulk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply Batch
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedStudentIds([])
                    setBatchToAssign("")
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {sortedStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("no_records_found")}</div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">
                      <Checkbox
                        checked={
                          sortedStudents.length > 0 &&
                          sortedStudents.every((student) =>
                            selectedStudentIds.includes(student.id)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudentIds(sortedStudents.map((s) => s.id))
                          } else {
                            setSelectedStudentIds([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 select-none"
                      onClick={() => handleSort('roll_number')}
                    >
                      <div className="flex items-center font-semibold">
                        {t("roll_no")}
                        <SortIcon field="roll_number" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 select-none"
                      onClick={() => handleSort('gr_no')}
                    >
                      <div className="flex items-center font-semibold">
                        {t("gr_no")}
                        <SortIcon field="gr_no" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 select-none"
                      onClick={() => handleSort('first_name')}
                    >
                      <div className="flex items-center font-semibold">
                        {t("name")}
                        <SortIcon field="first_name" />
                      </div>
                    </TableHead>
                    <TableHead>{t("gender")}</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 select-none"
                      onClick={() => handleSort('practical_batch')}
                    >
                      <div className="flex items-center font-semibold">
                        Current Batch
                        <SortIcon field="practical_batch" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px]">Allocate Batch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => {
                    const studentName = `${student.first_name} ${student.last_name}`
                    const rollNo = student.fourth_year_roll_number || student.third_year_roll_number || student.second_year_roll_number || student.first_year_roll_number
                    const isUpdatingThis = updatingStudentId === student.id
                    
                    return (
                      <TableRow key={student.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudentIds([...selectedStudentIds, student.id])
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rollNo || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{student.gr_no}</TableCell>
                        <TableCell className="font-medium">{studentName}</TableCell>
                        <TableCell className="capitalize text-slate-600">{student.gender}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getBatchBadgeColor(student.practical_batch)} font-medium`}>
                            {student.practical_batch || "None"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            disabled={isUpdatingThis}
                            value={student.practical_batch || "None"}
                            onValueChange={(val) => handleIndividualAssign(student.id, val, studentName)}
                          >
                            <SelectTrigger className="w-[160px] h-8 text-sm">
                              {isUpdatingThis ? (
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Saving...
                                </span>
                              ) : (
                                <SelectValue placeholder="Set Batch" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None (Remove)</SelectItem>
                              {configuredBatches.map((name) => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {sortedStudents.length > 0 && (
        <div className="w-full flex justify-end p-1">
          <SaralPagination
            currentPage={PageDetailsForStudents.current_page}
            onPageChange={onPageChange}
            totalPages={PageDetailsForStudents.last_page}
          />
        </div>
      )}
    </div>
  )
}
