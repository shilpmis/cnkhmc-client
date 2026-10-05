import React, { useState, useEffect, useMemo } from 'react'
import {
  Loader2,
  Table,
  CheckSquare,
  Square,
  RotateCcw,
  Save,
  CheckCircle2,
  SlidersHorizontal,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { useAppSelector } from '@/redux/hooks/useAppSelector'
import { selectCurrentSchool } from '@/redux/slices/authSlice'
import {
  useFetchStudentColumnSettingsQuery,
  useUpdateStudentColumnSettingsMutation,
} from '@/services/StudentServices'

interface FieldDefinition {
  id: string
  label: string
  table: 'students' | 'student_meta'
}

// Group definitions for School & College
const allFieldGroups: Record<string, { title: string; fields: FieldDefinition[] }> = {
  personal: {
    title: 'Personal & Identification',
    fields: [
      { id: 'first_name', label: 'First Name', table: 'students' },
      { id: 'middle_name', label: 'Middle Name', table: 'students' },
      { id: 'last_name', label: 'Last Name', table: 'students' },
      { id: 'first_name_in_guj', label: 'First Name (Gujarati)', table: 'students' },
      { id: 'middle_name_in_guj', label: 'Middle Name (Gujarati)', table: 'students' },
      { id: 'last_name_in_guj', label: 'Last Name (Gujarati)', table: 'students' },
      { id: 'gender', label: 'Gender', table: 'students' },
      { id: 'birth_date', label: 'Date of Birth', table: 'students' },
      { id: 'birth_place', label: 'Birth Place', table: 'student_meta' },
      { id: 'birth_place_in_guj', label: 'Birth Place (Gujarati)', table: 'student_meta' },
      { id: 'birth_taluka', label: 'Birth Taluka', table: 'student_meta' },
      { id: 'birth_district', label: 'Birth District', table: 'student_meta' },
      { id: 'nationality', label: 'Nationality', table: 'student_meta' },
      { id: 'country_code', label: 'Country Code', table: 'student_meta' },
      { id: 'aadhar_no', label: 'Aadhar Number', table: 'students' },
      { id: 'aadhar_dise_no', label: 'Aadhar DISE Number', table: 'student_meta' },
      { id: 'gr_no', label: 'GR Number', table: 'students' },
      { id: 'enrollment_code', label: 'Enrollment / Student Code', table: 'students' },
      { id: 'admission_number', label: 'Admission ID', table: 'students' },
    ],
  },
  academic: {
    title: 'Academic & Roll Info',
    fields: [
      { id: 'roll_number', label: 'Roll Number', table: 'students' },
      { id: 'admission_date', label: 'Admission Date', table: 'student_meta' },
      { id: 'admission_standard', label: 'Admission Standard', table: 'student_meta' },
      { id: 'admission_year', label: 'Admission Year', table: 'student_meta' },
      { id: 'subject_group', label: 'Subject Group', table: 'student_meta' },
      { id: 'privious_school', label: 'Previous School', table: 'student_meta' },
      { id: 'privious_school_in_guj', label: 'Previous School (Gujarati)', table: 'student_meta' },
      { id: 'ayush_id', label: 'Ayush ID', table: 'student_meta' },
      { id: 'abc_id', label: 'ABC ID', table: 'student_meta' },
    ],
  },
  contact: {
    title: 'Contact Information',
    fields: [
      { id: 'primary_mobile', label: 'Primary Mobile No', table: 'students' },
      { id: 'secondary_mobile', label: 'Secondary Mobile No', table: 'student_meta' },
      { id: 'email_id', label: 'Email Address', table: 'student_meta' },
      { id: 'website', label: 'Website', table: 'student_meta' },
      { id: 'mother_tongue', label: 'Mother Tongue', table: 'student_meta' },
    ],
  },
  address: {
    title: 'Current & Permanent Address',
    fields: [
      { id: 'address', label: 'Current Address', table: 'student_meta' },
      { id: 'current_area', label: 'Current Area', table: 'student_meta' },
      { id: 'city', label: 'Current City', table: 'student_meta' },
      { id: 'district', label: 'District', table: 'student_meta' },
      { id: 'state', label: 'Current State', table: 'student_meta' },
      { id: 'postal_code', label: 'Postal Code', table: 'student_meta' },
      { id: 'current_country', label: 'Current Country', table: 'student_meta' },
      { id: 'permanent_address', label: 'Permanent Address', table: 'student_meta' },
      { id: 'permanent_area', label: 'Permanent Area', table: 'student_meta' },
      { id: 'permanent_city', label: 'Permanent City', table: 'student_meta' },
      { id: 'permanent_state', label: 'Permanent State', table: 'student_meta' },
      { id: 'permanent_pincode', label: 'Permanent PIN Code', table: 'student_meta' },
      { id: 'permanent_country', label: 'Permanent Country', table: 'student_meta' },
    ],
  },
  family: {
    title: 'Family Details',
    fields: [
      { id: 'father_name', label: "Father's Name", table: 'students' },
      { id: 'father_name_in_guj', label: "Father's Name (Gujarati)", table: 'students' },
      { id: 'father_qualification', label: "Father's Qualification", table: 'student_meta' },
      { id: 'father_occupation', label: "Father's Occupation", table: 'student_meta' },
      { id: 'mother_name', label: "Mother's Name", table: 'students' },
      { id: 'mother_name_in_guj', label: "Mother's Name (Gujarati)", table: 'students' },
      { id: 'mother_qualification', label: "Mother's Qualification", table: 'student_meta' },
      { id: 'guardian_name', label: "Guardian's Name", table: 'student_meta' },
      { id: 'guardian_name_in_guj', label: "Guardian's Name (Gujarati)", table: 'student_meta' },
      { id: 'guardian_relation', label: 'Relation with Guardian', table: 'student_meta' },
    ],
  },
  category: {
    title: 'Category, Religion & Blood Group',
    fields: [
      { id: 'religion', label: 'Religion', table: 'student_meta' },
      { id: 'religion_in_guj', label: 'Religion (Gujarati)', table: 'student_meta' },
      { id: 'caste', label: 'Caste', table: 'student_meta' },
      { id: 'caste_in_guj', label: 'Caste (Gujarati)', table: 'student_meta' },
      { id: 'sub_caste', label: 'Sub Caste', table: 'student_meta' },
      { id: 'category', label: 'Category', table: 'student_meta' },
      { id: 'blood_group', label: 'Blood Group', table: 'student_meta' },
    ],
  },
  bank: {
    title: 'Bank Account Details',
    fields: [
      { id: 'bank_name', label: 'Bank Name', table: 'student_meta' },
      { id: 'bank_branch_name', label: 'Bank Branch Name', table: 'student_meta' },
      { id: 'account_no', label: 'Account Number', table: 'student_meta' },
      { id: 'IFSC_code', label: 'IFSC Code', table: 'student_meta' },
    ],
  },
  qualification: {
    title: 'Qualifications & NEET Entrance (College)',
    fields: [
      { id: 'ssc_passing_year', label: 'SSC Passing Year', table: 'student_meta' },
      { id: 'hsc_passing_year', label: 'HSC Passing Year', table: 'student_meta' },
      { id: 'hsc_attempts', label: 'HSC Attempts', table: 'student_meta' },
      { id: 'hsc_obtained_marks', label: 'HSC Obtained Marks', table: 'student_meta' },
      { id: 'hsc_pcb_marks_with_practical', label: 'HSC PCB Marks', table: 'student_meta' },
      { id: 'entrance_exam_name', label: 'Entrance Exam Name', table: 'student_meta' },
      { id: 'neet_score', label: 'NEET Score', table: 'student_meta' },
      { id: 'neet_roll_no', label: 'NEET Roll No', table: 'student_meta' },
      { id: 'neet_application_number', label: 'NEET Application No', table: 'student_meta' },
      { id: 'neet_all_india_rank', label: 'NEET All India Rank', table: 'student_meta' },
      { id: 'neet_percentile', label: 'NEET Percentile', table: 'student_meta' },
      { id: 'general_merit', label: 'General Merit', table: 'student_meta' },
      { id: 'category_merit', label: 'Category Merit', table: 'student_meta' },
    ],
  },
  internship: {
    title: 'Internship & Administrative',
    fields: [
      { id: 'internship_provisional_number', label: 'Internship Provisional No', table: 'student_meta' },
      { id: 'internship_provisional_date', label: 'Internship Provisional Date', table: 'student_meta' },
      { id: 'internship_starting_date', label: 'Internship Start Date', table: 'student_meta' },
      { id: 'internship_completion_date', label: 'Internship Completion Date', table: 'student_meta' },
      { id: 'student_lc_no', label: 'Student LC No', table: 'student_meta' },
      { id: 'student_lc_date', label: 'Student LC Date', table: 'student_meta' },
      { id: 'pen', label: 'PEN', table: 'student_meta' },
      { id: 'abha_card_no', label: 'Abha Card No', table: 'student_meta' },
      { id: 'school_udise_no', label: 'School UDISE No', table: 'student_meta' },
    ],
  },
}

export default function StudentColumnSettingsTab() {
  const currentSchool = useAppSelector(selectCurrentSchool)
  const { data: serverSettings, isLoading } = useFetchStudentColumnSettingsQuery()
  const [updateSettings, { isLoading: isSaving }] = useUpdateStudentColumnSettingsMutation()

  const allFieldList = useMemo(() => {
    return Object.values(allFieldGroups).flatMap((g) => g.fields)
  }, [])

  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({})

  // Populate selected fields from server settings or select all by default
  useEffect(() => {
    const initial: Record<string, boolean> = {}
    if (serverSettings?.enabled_columns && Array.isArray(serverSettings.enabled_columns)) {
      const enabledSet = new Set(serverSettings.enabled_columns)
      allFieldList.forEach((f) => {
        initial[f.id] = enabledSet.has(f.id)
      })
    } else {
      allFieldList.forEach((f) => {
        initial[f.id] = true
      })
    }
    setSelectedFields(initial)
  }, [serverSettings, allFieldList])

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {}
    allFieldList.forEach((f) => (next[f.id] = true))
    setSelectedFields(next)
  }

  const handleDeselectAll = () => {
    const next: Record<string, boolean> = {}
    allFieldList.forEach((f) => (next[f.id] = false))
    // Keep mandatory fields selected
    next['first_name'] = true
    next['last_name'] = true
    setSelectedFields(next)
  }

  const handleToggleGroup = (groupKey: string, check: boolean) => {
    const groupFields = allFieldGroups[groupKey].fields
    setSelectedFields((prev) => {
      const copy = { ...prev }
      groupFields.forEach((f) => {
        copy[f.id] = check
      })
      return copy
    })
  }

  const handleToggleField = (fieldId: string, checked: boolean) => {
    setSelectedFields((prev) => ({ ...prev, [fieldId]: checked }))
  }

  const handleSave = async () => {
    const enabled = Object.entries(selectedFields)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)

    if (enabled.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select at least one column head to include in student import/export.',
      })
      return
    }

    try {
      await updateSettings({ enabled_columns: enabled }).unwrap()
      toast({
        title: 'Settings Saved',
        description: `Successfully configured ${enabled.length} active columns for student import and export.`,
      })
    } catch (err: any) {
      console.error('Save column settings error:', err)
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err?.data?.message || 'Failed to save student column configuration.',
      })
    }
  }

  const activeCount = Object.values(selectedFields).filter(Boolean).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
            <SlidersHorizontal className="h-6 w-6 text-indigo-600" />
            Student Import & Export Column Configuration
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Choose which columns (headers) to include in student bulk import Excel files and exports.
            Only selected columns will be expected in imported spreadsheets and included in exported data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-indigo-50 border-indigo-200 text-indigo-800 font-bold text-xs">
            {activeCount} / {allFieldList.length} Active Columns
          </Badge>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-md rounded-xl"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll} className="gap-1.5 font-bold rounded-lg text-xs">
            <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeselectAll} className="gap-1.5 font-bold rounded-lg text-xs">
            <Square className="h-3.5 w-3.5 text-gray-400" />
            Deselect All
          </Button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
          <Info className="h-4 w-4 text-amber-500" />
          Import files matching your selected columns will be accepted without errors.
        </div>
      </div>

      {/* Grouped Field Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(allFieldGroups).map(([groupKey, group]) => {
          const allChecked = group.fields.every((f) => selectedFields[f.id])
          const someChecked = group.fields.some((f) => selectedFields[f.id])

          return (
            <Card key={groupKey} className="border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/60 py-3.5 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${groupKey}`}
                    checked={allChecked}
                    onCheckedChange={(c) => handleToggleGroup(groupKey, !!c)}
                  />
                  <Label htmlFor={`group-${groupKey}`} className="font-extrabold text-sm text-gray-900 cursor-pointer">
                    {group.title}
                  </Label>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 font-bold border-none">
                  {group.fields.filter((f) => selectedFields[f.id]).length} / {group.fields.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {group.fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={selectedFields[field.id] || false}
                        onCheckedChange={(c) => handleToggleField(field.id, !!c)}
                      />
                      <Label htmlFor={`field-${field.id}`} className="text-xs font-semibold text-gray-700 cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {field.id}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 px-8 py-3 rounded-xl shadow-lg"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Save Column Configuration ({activeCount} Active)
        </Button>
      </div>
    </div>
  )
}
