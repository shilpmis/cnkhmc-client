"use client"

import type React from "react"
import { useRef } from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type StudentFormData, studentSchema } from "@/utils/student.validation"
import { selectAcademicClasses } from "@/redux/slices/academicSlice"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import type { AcademicClasses, Division } from "@/types/academic"
import { selectActiveAccademicSessionsForSchool, selectAuthState } from "@/redux/slices/authSlice"
import { toast } from "@/hooks/use-toast"
import { useLazyGetAcademicClassesQuery } from "@/services/AcademicService"
import {
  useAddSingleStudentMutation,
  useLazyFetchStudentForClassQuery,
  useUpdateStudentMutation,
} from "@/services/StudentServices"
import { useConvertQueryToStudentMutation } from "@/services/InquiryServices"
import type { Student, StudentEntry, UpdateStudent } from "@/types/student"
import { Loader2, Landmark, Award, ShieldCheck, Coins } from 'lucide-react'
import { useTranslation } from "@/redux/hooks/useTranslation"
import { NumberInput } from "../ui/NumberInput"
import { AvatarUpload } from "@/components/ui/AvatarUpload"
import { uploadImageToStorage } from "@/services/StorageService"
import ApiService from "@/services/ApiService"
import { Badge } from "@/components/ui/badge"

interface StudentFormProps {
  onClose: () => void
  form_type: "create" | "update" | "view"
  is_use_for_onBoarding?: boolean
  inquiry_id?: number
  initial_data?: Student | null
  setListedStudentForSelectedClass?: (data: any) => void
  setPaginationDataForSelectedClass?: (data: any) => void
  onSubmitSuccess?: (studentData: Student) => void
  onSubmitError?: (error: any) => void
}

const StudentForm: React.FC<StudentFormProps> = ({
  onClose,
  initial_data,
  form_type,
  setListedStudentForSelectedClass,
  setPaginationDataForSelectedClass,
  onSubmitSuccess,
  is_use_for_onBoarding,
  inquiry_id,
  onSubmitError
}) => {
  const formatData = (value: any): string => {
    return value ? new Date(value).toISOString().split("T")[0] : " "
  }

  const normalizeGender = (val: any): "Male" | "Female" | undefined => {
    if (!val) return undefined as any
    const str = String(val).trim().toLowerCase()
    if (["male", "m"].includes(str)) return "Male"
    if (["female", "f"].includes(str)) return "Female"
    if (val === "Male" || val === "Female") return val
    return undefined as any
  }

  const normalizeCategory = (val: any): "ST" | "SC" | "OBC" | "OPEN" | null => {
    if (!val) return null
    const str = String(val).trim().toUpperCase()
    if (["OPEN", "GENERAL", "GEN"].includes(str) || str.includes("EWS")) return "OPEN"
    if (["ST", "S.T.", "SCHEDULED TRIBE"].includes(str)) return "ST"
    if (["SC", "S.C.", "SCHEDULED CASTE"].includes(str)) return "SC"
    if (["OBC", "O.B.C.", "SEBC", "S.E.B.C."].includes(str)) return "OBC"
    return null
  }

  const AcademicClasses = useAppSelector(selectAcademicClasses)
  const authState = useAppSelector(selectAuthState)
  // The final student sheet applies to every institution, so the full set of heads is always shown
  const isCollege = true
  const isLoading = useAppSelector((state) => state.academic.loading)
  const { t } = useTranslation()

  const CurrentAcademicSessionForSchool = useAppSelector(selectActiveAccademicSessionsForSchool)

  // ── Admission Quota & Fee Templates State ─────────────────────────────────
  const [quotas, setQuotas] = useState<any[]>([])
  const [feePlans, setFeePlans] = useState<any[]>([])
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(false)
  const [isLoadingFeePlans, setIsLoadingFeePlans] = useState(false)

  useEffect(() => {
    const fetchQuotasAndPlans = async () => {
      try {
        setIsLoadingQuotas(true)
        const qRes = await ApiService.get("quota/all")
        if (Array.isArray(qRes?.data)) {
          setQuotas(qRes.data)
        } else if (qRes?.data?.data && Array.isArray(qRes.data.data)) {
          setQuotas(qRes.data.data)
        }
      } catch (err) {
        console.warn("Could not load quotas:", err)
      } finally {
        setIsLoadingQuotas(false)
      }

      if (CurrentAcademicSessionForSchool?.id) {
        try {
          setIsLoadingFeePlans(true)
          const fpRes = await ApiService.get(
            `feesplan?academic_session=${CurrentAcademicSessionForSchool.id}&status=Active&limit=100`
          )
          if (Array.isArray(fpRes?.data?.data)) {
            setFeePlans(fpRes.data.data)
          } else if (Array.isArray(fpRes?.data)) {
            setFeePlans(fpRes.data)
          }
        } catch (err) {
          console.warn("Could not load fee plans:", err)
        } finally {
          setIsLoadingFeePlans(false)
        }
      }
    }

    fetchQuotasAndPlans()
  }, [CurrentAcademicSessionForSchool?.id])

  const customStudentSchema = studentSchema
    .refine(
      (data) => {
        if (data.admission_date && data.birth_date) {
          const admissionDate = new Date(data.admission_date)
          const birthDate = new Date(data.birth_date)
          return admissionDate > birthDate
        }
        return true
      },
      {
        message: "Admission date must be greater than birth date",
        path: ["admission_date"],
      },
    )

  // Add this function after the customStudentSchema definition
  const validateDates = (birthDate: string, admissionDate: string) => {
    if (birthDate && admissionDate) {
      const birth = new Date(birthDate)
      const admission = new Date(admissionDate)
      return admission > birth
    }
    return true
  }

  const form = useForm<StudentFormData>({
    resolver: zodResolver(customStudentSchema),
    defaultValues: {
      profile_photo: null,
      first_name: "",
      middle_name: null,
      last_name: "",
      first_name_in_guj: null,
      middle_name_in_guj: null,
      last_name_in_guj: null,
      gender: undefined,
      birth_date: "",
      birth_place: null,
      birth_place_in_guj: null,
      aadhar_no: null,
      aadhar_dise_no: null,

      father_name: null,
      father_name_in_guj: null,
      mother_name: null,
      mother_name_in_guj: null,
      primary_mobile: undefined,
      secondary_mobile: null,

      enrollment_code: "",
      gr_no: undefined,
      roll_number: null,
      admission_date: "",
      admission_class: null,
      admission_division: null,
      class: undefined,
      division: undefined,
      quota_id: null,
      fees_plan_id: null,
      privious_school: null,
      privious_school_in_guj: null,

      religion: null,
      religion_in_guj: null,
      caste: null,
      caste_in_guj: null,
      category: null, // Default to "OPEN"

      address: null,
      district: null,
      city: null,
      state: null,
      postal_code: null,

      bank_name: null,
      account_no: null,
      IFSC_code: null,

      current_area: "",
      current_country: "",
      permanent_address: "",
      permanent_area: "",
      permanent_city: "",
      permanent_state: "",
      permanent_pincode: "",
      permanent_country: "",
      country_code: "",
      student_code: "",
      admission_standard: "",
      subject_group: "",
      birth_taluka: "",
      birth_district: "",
      student_leaving_reason: "",
      student_lc_date: "",
      student_lc_no: "",
      pen: "",
      abha_card_no: "",
      school_udise_no: "",
      email_id: "",
      website: "",
      mother_tongue: "",
      father_qualification: "",
      father_occupation: "",
      father_email: "",
      father_organisation: "",
      father_office_address: "",
      father_office_phone: "",
      father_mobile: "",
      mother_qualification: "",
      mother_occupation: "",
      mother_email: "",
      mother_organisation: "",
      mother_office_address: "",
      mother_office_phone: "",
      mother_mobile: "",
      guardian_name: "",
      guardian_qualification: "",
      guardian_occupation: "",
      guardian_email: "",
      guardian_organisation: "",
      guardian_office_address: "",
      guardian_office_phone: "",
      guardian_mobile: "",
      guardian_relation: "",
      ssc_passing_year: "",
      hsc_passing_year: "",
      hsc_attempts: null,
      hsc_obtained_marks: null,
      hsc_pcb_marks_with_practical: null,
      entrance_exam_name: "",
      neet_score: null,
      neet_roll_no: "",
      neet_application_number: "",
      neet_all_india_rank: null,
      neet_percentile: "",
      general_merit: null,
      category_merit: null,
      internship_provisional_number: "",
      internship_provisional_date: "",
      internship_starting_date: "",
      internship_completion_date: "",
      first_year_attempt: null,
      second_year_attempt: null,
      third_year_attempt: null,
      fourth_year_attempt: null,
      final_bhms_passing_date: "",
      ayush_id: "",
      abc_id: "",
      admission_cancel: false,
      admission_cancel_year: "",
      admission_cancel_date: "",
      admission_transfer: false,
      admission_transfer_date: "",
      admission_transfer_to_college: "",
      admission_transfer_from_college: "",
      admission_year: "",
      sub_caste: "",
      quota_fees: "",
      admission_quota: null,
      activity_house: "",
      bank_branch_name: "",
      admission_number: null,
      name_as_per_aadhar: null,
      nationality: null,
      blood_group: null,
      university_spid_no: null,
      admission_category: null,
      tuition_fees: null,
      roll_no_internship: null,
      bank_branch_pincode: null,
      first_year_roll_number: null,
      second_year_roll_number: null,
      third_year_roll_number: null,
      fourth_year_roll_number: null,
      practical_batch: "",
    },
  })

  const tabMapping: { [key: string]: string } = {
    enrollment_code: "personal",
    admission_number: "personal",
    name_as_per_aadhar: "personal",
    nationality: "personal",
    blood_group: "personal",
    university_spid_no: "academic",
    admission_category: "academic",
    tuition_fees: "academic",
    first_year_roll_number: "academic",
    second_year_roll_number: "academic",
    third_year_roll_number: "academic",
    fourth_year_roll_number: "academic",
    roll_no_internship: "academic",
    bank_branch_pincode: "college",
    first_name: "personal",
    middle_name: "personal",
    last_name: "personal",
    first_name_in_guj: "personal",
    middle_name_in_guj: "personal",
    last_name_in_guj: "personal",
    gender: "personal",
    birth_date: "personal",
    birth_place: "personal",
    birth_place_in_guj: "personal",
    aadhar_no: "personal",
    aadhar_dise_no: "personal",
    father_name: "family",
    father_name_in_guj: "family",
    mother_name: "family",
    mother_name_in_guj: "family",
    primary_mobile: "family",
    secondary_mobile: "family",
    gr_no: "academic",
    roll_number: "academic",
    admission_date: "academic",
    admission_class: "academic",
    admission_division: "academic",
    class: "academic",
    division: "academic",
    quota_id: "academic",
    admission_quota: "academic",
    fees_plan_id: "academic",
    privious_school: "academic",
    privious_school_in_guj: "academic",
    religion: "other",
    religion_in_guj: "other",
    caste: "other",
    caste_in_guj: "other",
    category: "other",
    address: "address",
    district: "address",
    city: "address",
    state: "address",
    postal_code: "address",
    bank_name: "bank",
    account_no: "bank",
    IFSC_code: "bank",
    current_area: "college",
    current_country: "college",
    permanent_address: "address",
    permanent_area: "college",
    permanent_city: "college",
    permanent_state: "college",
    permanent_pincode: "address",
    permanent_country: "college",
    country_code: "college",
    student_code: "college",
    admission_standard: "college",
    subject_group: "college",
    birth_taluka: "college",
    birth_district: "college",
    student_leaving_reason: "college",
    student_lc_date: "college",
    student_lc_no: "college",
    pen: "college",
    abha_card_no: "college",
    school_udise_no: "college",
    email_id: "college",
    website: "college",
    mother_tongue: "college",
    father_qualification: "college",
    father_occupation: "family",
    father_email: "college",
    father_organisation: "college",
    father_office_address: "college",
    father_office_phone: "college",
    father_mobile: "family",
    mother_qualification: "college",
    mother_occupation: "family",
    mother_email: "college",
    mother_organisation: "college",
    mother_office_address: "college",
    mother_office_phone: "college",
    mother_mobile: "family",
    guardian_name: "family",
    guardian_qualification: "college",
    guardian_occupation: "family",
    guardian_email: "college",
    guardian_organisation: "college",
    guardian_office_address: "college",
    guardian_office_phone: "college",
    guardian_mobile: "family",
    guardian_relation: "family",
    ssc_passing_year: "college",
    hsc_passing_year: "college",
    hsc_attempts: "college",
    hsc_obtained_marks: "college",
    hsc_pcb_marks_with_practical: "college",
    entrance_exam_name: "college",
    neet_score: "college",
    neet_roll_no: "college",
    neet_application_number: "college",
    neet_all_india_rank: "college",
    neet_percentile: "college",
    general_merit: "college",
    category_merit: "college",
    internship_provisional_number: "college",
    internship_provisional_date: "college",
    internship_starting_date: "college",
    internship_completion_date: "college",
    first_year_attempt: "college",
    second_year_attempt: "college",
    third_year_attempt: "college",
    fourth_year_attempt: "college",
    final_bhms_passing_date: "college",
    ayush_id: "college",
    abc_id: "college",
    admission_cancel: "college",
    admission_cancel_year: "college",
    admission_cancel_date: "college",
    admission_transfer: "college",
    admission_transfer_date: "college",
    admission_transfer_to_college: "college",
    admission_transfer_from_college: "college",
    admission_year: "academic",
    sub_caste: "college",
    quota_fees: "college",
    activity_house: "college",
    bank_branch_name: "college",
  }

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [
    getAcademicClasses,
    { isLoading: isLoadingForAcademicClasses, isError: isErrorWhileFetchingClass, error: errorWhiwlFetchingClass },
  ] = useLazyGetAcademicClassesQuery()

  const [updateStudent, { isLoading: isStundetGetingUpdate, isError: errorWhileUpdateStudent }] =
    useUpdateStudentMutation()

  const [createStudent, { isLoading: isStundetGetingCreate, isError: errorWhileCreateStudent }] =
    useAddSingleStudentMutation()

  const [convertInquiryToStudent, { isLoading: isOnBoardingStudent, isError: errorWhileOnBoardingStudent }] =
    useConvertQueryToStudentMutation()

  const [selectedClass, setSelectedClass] = useState<string>("")
  // const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  // const [selectedAdmissionDivision, setselectedAdmissionDivision] = useState<Division | null>(null)
  const [selectedAdmissionClass, setselectedAdmissionClass] = useState<string>("")
  const [activeTab, setActiveTab] = useState("personal")

  const [getStudentForClass, { data: studentDataForSelectedClass }] = useLazyFetchStudentForClassQuery()

  const availableDivisions = useMemo<AcademicClasses | null>(() => {
    if (AcademicClasses && selectedClass) {
      return AcademicClasses!.filter((cls) => {
        if (cls.id.toString() === selectedClass) {
          return cls
        }
      })[0]
    } else {
      return null
    }
  }, [AcademicClasses, selectedClass])

  const available_division = useMemo<Division[] | null>(() => {
    if (AcademicClasses) {
      const cls: Division[] = []
      for (let i = 0; i < AcademicClasses!.length; i++) {
        AcademicClasses[i].divisions.map((div) => {
          cls.push(div)
        })
      }
      return cls
    } else {
      return null
    }
  }, [AcademicClasses])

  const availableDivisionsForAdmissionClass = useMemo<AcademicClasses | null>(() => {
    if (AcademicClasses && selectedAdmissionClass) {
      return AcademicClasses!.filter((cls) => {
        if (cls.id.toString() === selectedAdmissionClass) {
          return cls
        }
      })[0]
    } else {
      return null
    }
  }, [AcademicClasses, selectedAdmissionClass])

  const handleClassChange = useCallback(
    (class_id: string, type: "admission_Class" | "class") => {
      const clsObj = AcademicClasses?.find((c) => c.id.toString() === class_id)
      const defaultDivId = clsObj?.divisions?.[0]?.id?.toString() || ""

      if (type === "admission_Class") {
        setselectedAdmissionClass(class_id)
        form.setValue("admission_division", defaultDivId)
      } else {
        setSelectedClass(class_id)
        form.setValue("division", defaultDivId)
      }
    },
    [AcademicClasses, setSelectedClass, setselectedAdmissionClass, form.setValue],
  )

  const handleDivisionChange = useCallback(
    (division_id: string, type: "admission_Class" | "class") => {
      if (type === "admission_Class") {
        const selectedDiv = availableDivisions?.divisions.find((div) => div.id.toString() === division_id)
        // setSelectedDivision(selectedDiv || null)
      } else {
        const selectedDiv = availableDivisionsForAdmissionClass?.divisions.find(
          (div) => div.id.toString() === division_id,
        )
        // setselectedAdmissionDivision(selectedDiv || null)
      }
    },
    [availableDivisions, availableDivisionsForAdmissionClass],
  )

  const handleSubmit: SubmitHandler<StudentFormData> = async (values: StudentFormData) => {
    const errors = form.formState.errors
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0]
      const tabToActivate = tabMapping[firstErrorField]
      setActiveTab(tabToActivate)
      return
    }

    const firstErrorField = Object.keys(errors)[0]
    setTimeout(() => {
      inputRefs.current[firstErrorField]?.focus()
    }, 0)

    if (form_type === "create") {

      const CurrentClass = values.division 
        ? available_division?.find((division) => division.class_id == Number(values?.class) && division.id == Number(values.division))
        : available_division?.find((division) => division.class_id == Number(values?.class))
      // const AdmissionClass = available_division?.filter(
      //   (division) => division.class_id == Number(values?.admission_class) && division.id == Number(values.admission_division),
      // )[0]


      const payload: StudentEntry = {
        students_data: {
          class_id: CurrentClass!.id,
          first_name: values.first_name,
          middle_name: values.middle_name ?? null,
          last_name: values.last_name,
          first_name_in_guj: values.first_name_in_guj ?? null,
          middle_name_in_guj: values.middle_name_in_guj ?? null,
          last_name_in_guj: values.last_name_in_guj ?? null,
          gender: values.gender,
          birth_date: values.birth_date,
          enrollment_code: values.enrollment_code ?? "",
          gr_no: undefined as unknown as number, // GR number is not one of the final student heads
          primary_mobile: values.primary_mobile,
          father_name: values.father_name ?? null,
          father_name_in_guj: values.father_name_in_guj ?? null,
          mother_name: values.mother_name ?? null,
          mother_name_in_guj: values.mother_name_in_guj ?? null,
          admission_number: values.admission_number ?? null,
          first_year_roll_number: values.first_year_roll_number ?? null,
          second_year_roll_number: values.second_year_roll_number ?? null,
          third_year_roll_number: values.third_year_roll_number ?? null,
          fourth_year_roll_number: values.fourth_year_roll_number ?? null,
          aadhar_no: values.aadhar_no,
          is_active: true,
          profile_photo: values.profile_photo ?? null,
          practical_batch: values.practical_batch ?? null,
          quota_id: values.quota_id ? Number(values.quota_id) : null,
          fees_plan_id: values.fees_plan_id ? Number(values.fees_plan_id) : null,
        },
        quota_id: values.quota_id ? Number(values.quota_id) : null,
        fees_plan_id: values.fees_plan_id ? Number(values.fees_plan_id) : null,
        student_meta_data: {
          aadhar_dise_no: values.aadhar_dise_no ?? null,
          birth_place: values.birth_place ?? null,
          birth_place_in_guj: values.birth_place_in_guj ?? null,
          religion: values.religion ?? null,
          religion_in_guj: values.religion_in_guj ?? null,
          caste: values.caste ?? null,
          caste_in_guj: values.caste_in_guj ?? null,
          category: (values.category as "ST" | "SC" | "OBC" | "OPEN" | null) ?? null,
          admission_date: values.admission_date ?? null,
          admission_class_id: null,
          secondary_mobile: values.secondary_mobile ?? null,
          privious_school: values.privious_school ?? null,
          privious_school_in_guj: values.privious_school_in_guj ?? null,
          address: values.address ?? null,
          district: values.district ?? null,
          city: values.city ?? null,
          state: values.state ?? null,
          postal_code: values.postal_code ?? null,
          bank_name: values.bank_name ?? null,
          account_no: values.account_no ?? null,
          IFSC_code: values.IFSC_code ?? null,
        },
      }

      if (isCollege) {
        const collegeFields = [
          "name_as_per_aadhar", "address", "postal_code", "permanent_address", "permanent_pincode", "country_code", "nationality", "university_spid_no", "admission_year", "admission_date", "admission_quota", "admission_category", "tuition_fees", "roll_no_internship", "secondary_mobile", "religion", "caste", "category", "blood_group", "birth_place", "student_leaving_reason", "student_lc_date", "student_lc_no", "privious_school", "aadhar_dise_no", "bank_name", "bank_branch_name", "account_no", "IFSC_code", "bank_branch_pincode", "email_id", "father_occupation", "father_mobile", "mother_occupation", "mother_mobile", "guardian_name", "guardian_occupation", "guardian_mobile", "guardian_relation", "ssc_passing_year", "hsc_passing_year", "hsc_attempts", "hsc_obtained_marks", "hsc_pcb_marks_with_practical", "neet_score", "neet_roll_no", "neet_application_number", "neet_all_india_rank", "neet_percentile", "general_merit", "category_merit", "internship_provisional_number", "internship_provisional_date", "internship_starting_date", "internship_completion_date", "first_year_attempt", "second_year_attempt", "third_year_attempt", "fourth_year_attempt", "final_bhms_passing_date", "ayush_id", "abc_id", "admission_cancel", "admission_cancel_year", "admission_cancel_date", "admission_transfer", "admission_transfer_date", "admission_transfer_to_college", "admission_transfer_from_college", "school_udise_no"
        ];
        collegeFields.forEach((field) => {
          const val = values[field as keyof typeof values];
          (payload.student_meta_data as any)[field] = val !== undefined ? val : null;
        });
      }

      if (is_use_for_onBoarding) {
        if (!inquiry_id) {
          toast({
            variant: "destructive",
            title: "Internal Error ! Inquiry Id not found",
          })
          return
        }
        try {
          // const res = await convertInquiryToStudent({
          //   inquiry_id: inquiry_id,
          //   payload: payload,
          // }).unwrap()

          // if (onSubmitSuccess) {
          //   onSubmitSuccess({...res , class_id :payload.students_data.class_id})
          // } else {
          //   onClose()
          // }

        } catch (error) {
          console.log("Error while converting inquiry to student:", error)
          onSubmitError && onSubmitError(error);
        }
      }
      else {
        try {
          const response = await createStudent({
            payload: payload,
            academic_session: CurrentAcademicSessionForSchool!.id,
          }).unwrap()

          toast({
            variant: "default",
            title: "Success",
            description: "Student Created Successfully",
          })
          if (onSubmitSuccess) {
            onSubmitSuccess({ ...response.data, class_id: payload.students_data.class_id })
          } else {
            onClose()
          }
        } catch (error: any) {
          console.log("Error while Update Student :", error)
          if (error?.data?.errors?.code === "E_VALIDATION_ERROR") {
            error.data.errors.messages.map((msg: any) => {
              toast({
                variant: "destructive",
                title: "Validation Error",
                description: msg.message,
              })
            })
          } else {
            console.log("Error while Update Student :", error)
            toast({
              variant: "destructive",
              title: "Internal Error ! Please Check Developer Mode",
            })
          }
        }
      }

    } else if (form_type === "update") {
      const payload: UpdateStudent = {
        student_meta_data: {},
        students_data: {},
        quota_id: values.quota_id ? Number(values.quota_id) : null,
        fees_plan_id: values.fees_plan_id ? Number(values.fees_plan_id) : null,
      };

      // Compare form values with initial data for student_meta_data fields
      if (values.aadhar_dise_no !== initial_data!.student_meta!.aadhar_dise_no) {
        payload.student_meta_data.aadhar_dise_no = values.aadhar_dise_no
      }
      if (values.birth_place !== initial_data?.student_meta?.birth_place) {
        payload.student_meta_data.birth_place = values.birth_place
      }
      if (values.birth_place_in_guj !== initial_data?.student_meta?.birth_place_in_guj) {
        payload.student_meta_data.birth_place_in_guj = values.birth_place_in_guj
      }
      if (values.religion !== initial_data?.student_meta?.religion) {
        payload.student_meta_data.religion = values.religion
      }
      if (values.religion_in_guj !== initial_data?.student_meta?.religion_in_guj) {
        payload.student_meta_data.religion_in_guj = values.religion_in_guj
      }
      if (values.caste !== initial_data?.student_meta?.caste) {
        payload.student_meta_data.caste = values.caste
      }
      if (values.caste_in_guj !== initial_data?.student_meta?.caste_in_guj) {
        payload.student_meta_data.caste_in_guj = values.caste_in_guj
      }
      if (values.category !== initial_data?.student_meta?.category) {
        payload.student_meta_data.category = values.category as "ST" | "SC" | "OBC" | "OPEN" | null | undefined
      }
      if (formatData(values.admission_date) !== formatData(initial_data!.student_meta!.admission_date)) {
        payload.student_meta_data.admission_date = values.admission_date ? formatData(values.admission_date) : null
      }
      if (values.admission_division !== initial_data?.student_meta?.admission_class_id?.toString()) {
        payload.student_meta_data.admission_class_id = values.admission_division
          ? Number(values.admission_division)
          : null
      }
      if (values.secondary_mobile !== initial_data?.student_meta?.secondary_mobile) {
        payload.student_meta_data.secondary_mobile = values.secondary_mobile
      }
      if (values.privious_school !== initial_data?.student_meta?.privious_school) {
        payload.student_meta_data.privious_school = values.privious_school
      }
      if (values.privious_school_in_guj !== initial_data?.student_meta?.privious_school_in_guj) {
        payload.student_meta_data.privious_school_in_guj = values.privious_school_in_guj
      }
      // if (values.address !== initial_data?.student_meta?.address) {
      //   payload.student_meta_data.address = values.address
      // }
      if (values.district !== initial_data?.student_meta?.district) {
        payload.student_meta_data.district = values.district
      }
      if (values.city !== initial_data?.student_meta?.city) {
        payload.student_meta_data.city = values.city
      }
      if (values.state !== initial_data?.student_meta?.state) {
        payload.student_meta_data.state = values.state
      }
      if (values.postal_code !== initial_data?.student_meta?.postal_code) {
        payload.student_meta_data.postal_code = values.postal_code
      }
      if (values.bank_name !== initial_data?.student_meta?.bank_name) {
        payload.student_meta_data.bank_name = values.bank_name
      }
      if (values.account_no !== initial_data?.student_meta?.account_no) {
        payload.student_meta_data.account_no = values.account_no
      }
      if (values.IFSC_code !== initial_data?.student_meta?.IFSC_code) {
        payload.student_meta_data.IFSC_code = values.IFSC_code
      }

      // Compare form values with initial data for students_data fields
      if (values.first_name !== initial_data?.first_name) {
        payload.students_data.first_name = values.first_name
      }
      if (values.middle_name !== initial_data?.middle_name) {
        payload.students_data.middle_name = values.middle_name
      }
      if (values.last_name !== initial_data?.last_name) {
        payload.students_data.last_name = values.last_name
      }
      if (values.first_name_in_guj !== initial_data?.first_name_in_guj) {
        payload.students_data.first_name_in_guj = values.first_name_in_guj
      }
      if (values.middle_name_in_guj !== initial_data?.middle_name_in_guj) {
        payload.students_data.middle_name_in_guj = values.middle_name_in_guj
      }
      if (values.last_name_in_guj !== initial_data?.last_name_in_guj) {
        payload.students_data.last_name_in_guj = values.last_name_in_guj
      }
      if (values.gender !== initial_data?.gender) {
        payload.students_data.gender = values.gender
      }
      if (values.birth_date !== initial_data?.birth_date) {
        payload.students_data.birth_date = values.birth_date ?? null
      }
      if (values.enrollment_code !== initial_data?.enrollment_code) {
        payload.students_data.enrollment_code = values.enrollment_code ?? undefined
      }
      if (values.primary_mobile !== initial_data?.primary_mobile) {
        payload.students_data.primary_mobile = values.primary_mobile
      }

      if (values.father_name !== initial_data?.father_name) {
        payload.students_data.father_name = values.father_name
      }
      if (values.father_name_in_guj !== initial_data?.father_name_in_guj) {
        payload.students_data.father_name_in_guj = values.father_name_in_guj
      }
      if (values.mother_name !== initial_data?.mother_name) {
        payload.students_data.mother_name = values.mother_name
      }
      if (values.mother_name_in_guj !== initial_data?.mother_name_in_guj) {
        payload.students_data.mother_name_in_guj = values.mother_name_in_guj
      }
      ;(["admission_number", "first_year_roll_number", "second_year_roll_number", "third_year_roll_number", "fourth_year_roll_number"] as const).forEach((key) => {
        const nextValue = values[key] ?? null
        const previousValue = (initial_data as any)?.[key] ?? null
        if (String(nextValue ?? "") !== String(previousValue ?? "")) {
          ;(payload.students_data as any)[key] = nextValue
        }
      })
      if (values.aadhar_no !== initial_data?.aadhar_no) {
        payload.students_data.aadhar_no = values.aadhar_no
      }
      if (values.practical_batch !== initial_data?.practical_batch) {
        payload.students_data.practical_batch = values.practical_batch || null
      }
      if (values.profile_photo !== initial_data?.profile_photo) {
        payload.students_data.profile_photo = values.profile_photo ?? null
      }

      if (isCollege) {
        const collegeFields = [
          "name_as_per_aadhar", "address", "postal_code", "permanent_address", "permanent_pincode", "country_code", "nationality", "university_spid_no", "admission_year", "admission_date", "admission_quota", "admission_category", "tuition_fees", "roll_no_internship", "secondary_mobile", "religion", "caste", "category", "blood_group", "birth_place", "student_leaving_reason", "student_lc_date", "student_lc_no", "privious_school", "aadhar_dise_no", "bank_name", "bank_branch_name", "account_no", "IFSC_code", "bank_branch_pincode", "email_id", "father_occupation", "father_mobile", "mother_occupation", "mother_mobile", "guardian_name", "guardian_occupation", "guardian_mobile", "guardian_relation", "ssc_passing_year", "hsc_passing_year", "hsc_attempts", "hsc_obtained_marks", "hsc_pcb_marks_with_practical", "neet_score", "neet_roll_no", "neet_application_number", "neet_all_india_rank", "neet_percentile", "general_merit", "category_merit", "internship_provisional_number", "internship_provisional_date", "internship_starting_date", "internship_completion_date", "first_year_attempt", "second_year_attempt", "third_year_attempt", "fourth_year_attempt", "final_bhms_passing_date", "ayush_id", "abc_id", "admission_cancel", "admission_cancel_year", "admission_cancel_date", "admission_transfer", "admission_transfer_date", "admission_transfer_to_college", "admission_transfer_from_college", "school_udise_no"
        ];
        collegeFields.forEach((field) => {
          const val = values[field as keyof typeof values];
          const initialVal = initial_data?.student_meta?.[field as keyof typeof initial_data.student_meta];
          if (val !== initialVal) {
            (payload.student_meta_data as any)[field] = val !== undefined ? val : null;
          }
        });
      }

      try {
        const updated_student: any = await updateStudent({ student_id: initial_data!.id, payload: payload }).unwrap()
        toast({
          variant: "default",
          title: "Student has been updated !",
        })
        // Fetch the updated student list for the current class
        const response = await getStudentForClass({
          class_id: initial_data!.class_id,
          page: 1,
          student_meta: true,
          academic_session: CurrentAcademicSessionForSchool!.id,
        })

        // Update the parent component's state with the new data
        if (response.data) {
          if (setListedStudentForSelectedClass) setListedStudentForSelectedClass(response.data.data)
          if (setPaginationDataForSelectedClass) setPaginationDataForSelectedClass(response.data.meta)
          if (onSubmitSuccess) {
            onSubmitSuccess({ ...response.data, class_id: payload.students_data.class_id })
          } else {
            onClose()
          }
        }
      } catch (error: any) {
        console.log("Erro while adding student :", error)
        if (error?.data?.errors?.code === "E_VALIDATION_ERROR") {
          error.data.errors.messages.map((msg: any) => {
            toast({
              variant: "destructive",
              title: "Validation Error",
              description: msg.message,
            })
          })
        } else {
          console.log("Erro while Update Student :", error)
          toast({
            variant: "destructive",
            title: "Internal Error ! Please Check Developer Mode",
          })
        }
      }
    } else {
      toast({
        variant: "destructive",
        title: "Internal Error !",
      })
    }
  }

  const handleNextTab = useCallback(async () => {
    if (activeTab === "personal") setActiveTab("family")
    else if (activeTab === "family") setActiveTab("academic")
    else if (activeTab === "academic") setActiveTab("other")
    else if (activeTab === "other") setActiveTab("address")
    else if (activeTab === "address") setActiveTab("bank")
    else if (activeTab === "bank") setActiveTab(isCollege ? "college" : "bank")
  }, [activeTab, setActiveTab, isCollege])

  const handlePreviousTab = useCallback(() => {
    if (activeTab === "family") setActiveTab("personal")
    else if (activeTab === "academic") setActiveTab("family")
    else if (activeTab === "other") setActiveTab("academic")
    else if (activeTab === "address") setActiveTab("other")
    else if (activeTab === "bank") setActiveTab("address")
    else if (activeTab === "college") setActiveTab("bank")
  }, [activeTab, isCollege])

  useEffect(() => {
    if (form_type === "update" && initial_data) {
      const CurrentClass = available_division?.filter((cls) => cls.id === initial_data?.class_id)[0]
      if (CurrentClass) handleClassChange(CurrentClass.id.toString(), "class")
      if (CurrentClass) handleDivisionChange(CurrentClass.id.toString(), "class")

      const CurrentDivision = available_division?.filter((cls) => cls.id === initial_data?.class_id)[0]

      const AdmissionClass = available_division?.filter(
        (cls) => cls.id === initial_data?.student_meta?.admission_class_id,
      )[0]

      if (AdmissionClass) handleClassChange(AdmissionClass.id.toString(), "admission_Class")

      form.reset({
        profile_photo: initial_data?.profile_photo || null,
        first_name: initial_data?.first_name || "",
        last_name: initial_data?.last_name || "",
        middle_name: initial_data?.middle_name ? initial_data?.middle_name : null,
        first_name_in_guj: initial_data?.first_name_in_guj || null,
        middle_name_in_guj: initial_data?.middle_name_in_guj || null,
        gender: normalizeGender(initial_data?.gender),
        birth_date: initial_data?.birth_date ? formatData(initial_data.birth_date) : "",
        enrollment_code: initial_data?.enrollment_code || "",
        gr_no: initial_data?.gr_no,
        primary_mobile: initial_data?.primary_mobile,
        father_name: initial_data?.father_name || null,
        father_name_in_guj: initial_data?.father_name_in_guj || null,
        mother_name: initial_data?.mother_name || null,
        mother_name_in_guj: initial_data?.mother_name_in_guj || null,
        roll_number: initial_data?.first_year_roll_number || initial_data?.second_year_roll_number || initial_data?.third_year_roll_number || initial_data?.fourth_year_roll_number || null,
        admission_number: (initial_data as any)?.admission_number || null,
        first_year_roll_number: (initial_data as any)?.first_year_roll_number ?? null,
        second_year_roll_number: (initial_data as any)?.second_year_roll_number ?? null,
        third_year_roll_number: (initial_data as any)?.third_year_roll_number ?? null,
        fourth_year_roll_number: (initial_data as any)?.fourth_year_roll_number ?? null,
        name_as_per_aadhar: (initial_data as any)?.student_meta?.name_as_per_aadhar || null,
        nationality: (initial_data as any)?.student_meta?.nationality || null,
        blood_group: (initial_data as any)?.student_meta?.blood_group || null,
        university_spid_no: (initial_data as any)?.student_meta?.university_spid_no || null,
        admission_category: (initial_data as any)?.student_meta?.admission_category || null,
        tuition_fees: (initial_data as any)?.student_meta?.tuition_fees || null,
        roll_no_internship: (initial_data as any)?.student_meta?.roll_no_internship || null,
        bank_branch_pincode: (initial_data as any)?.student_meta?.bank_branch_pincode || null,
        aadhar_no: (initial_data?.aadhar_no !== undefined && initial_data?.aadhar_no !== null && String(initial_data?.aadhar_no).trim() !== "") ? Number(initial_data?.aadhar_no) : null,
        aadhar_dise_no: (initial_data?.student_meta?.aadhar_dise_no !== undefined && initial_data?.student_meta?.aadhar_dise_no !== null && String(initial_data?.student_meta?.aadhar_dise_no).trim() !== "")
          ? Number(initial_data?.student_meta?.aadhar_dise_no)
          : null,
        birth_place: initial_data?.student_meta?.birth_place || null,
        birth_place_in_guj: initial_data?.student_meta?.birth_place_in_guj || null,
        religion: initial_data?.student_meta?.religion || null,
        religion_in_guj: initial_data?.student_meta?.religion_in_guj || null,
        caste: initial_data?.student_meta?.caste || null,
        caste_in_guj: initial_data?.student_meta?.caste_in_guj || null,
        category: normalizeCategory(initial_data?.student_meta?.category),
        privious_school: initial_data?.student_meta?.privious_school || null,
        privious_school_in_guj: initial_data?.student_meta?.privious_school_in_guj || null,
        address: initial_data?.student_meta?.address || null,
        district: initial_data?.student_meta?.district || null,
        city: initial_data?.student_meta?.city || null,
        state: initial_data?.student_meta?.state || null,
        postal_code: initial_data?.student_meta?.postal_code ? initial_data.student_meta.postal_code.toString() : null,
        bank_name: initial_data?.student_meta?.bank_name || null,
        account_no: initial_data?.student_meta?.account_no ? Number(initial_data?.student_meta?.account_no) : null,
        admission_date: initial_data?.student_meta?.admission_date
          ? formatData(initial_data.student_meta.admission_date)
          : null,
        IFSC_code: initial_data?.student_meta?.IFSC_code || null,
        last_name_in_guj: initial_data?.last_name_in_guj || null,
        secondary_mobile: initial_data?.student_meta?.secondary_mobile || null,
        admission_class: null,
        admission_division: null,
        class: CurrentDivision?.class_id ? CurrentDivision.class_id.toString() : (initial_data?.class_id ? initial_data.class_id.toString() : undefined),
        division: CurrentDivision?.id ? CurrentDivision.id.toString() : (initial_data?.class_id ? initial_data.class_id.toString() : undefined),
        current_area: initial_data?.student_meta?.current_area || "",
        current_country: initial_data?.student_meta?.current_country || "",
        permanent_address: initial_data?.student_meta?.permanent_address || "",
        permanent_area: initial_data?.student_meta?.permanent_area || "",
        permanent_city: initial_data?.student_meta?.permanent_city || "",
        permanent_state: initial_data?.student_meta?.permanent_state || "",
        permanent_pincode: initial_data?.student_meta?.permanent_pincode || "",
        permanent_country: initial_data?.student_meta?.permanent_country || "",
        country_code: initial_data?.student_meta?.country_code || "",
        student_code: initial_data?.student_meta?.student_code || "",
        admission_standard: initial_data?.student_meta?.admission_standard || "",
        subject_group: initial_data?.student_meta?.subject_group || "",
        birth_taluka: initial_data?.student_meta?.birth_taluka || "",
        birth_district: initial_data?.student_meta?.birth_district || "",
        student_leaving_reason: initial_data?.student_meta?.student_leaving_reason || "",
        student_lc_date: initial_data?.student_meta?.student_lc_date ? formatData(initial_data.student_meta.student_lc_date) : "",
        student_lc_no: initial_data?.student_meta?.student_lc_no || "",
        pen: initial_data?.student_meta?.pen || "",
        abha_card_no: initial_data?.student_meta?.abha_card_no || "",
        school_udise_no: initial_data?.student_meta?.school_udise_no || "",
        email_id: initial_data?.student_meta?.email_id || "",
        website: initial_data?.student_meta?.website || "",
        mother_tongue: initial_data?.student_meta?.mother_tongue || "",
        father_qualification: initial_data?.student_meta?.father_qualification || "",
        father_occupation: initial_data?.student_meta?.father_occupation || "",
        father_email: initial_data?.student_meta?.father_email || "",
        father_organisation: initial_data?.student_meta?.father_organisation || "",
        father_office_address: initial_data?.student_meta?.father_office_address || "",
        father_office_phone: initial_data?.student_meta?.father_office_phone || "",
        father_mobile: initial_data?.student_meta?.father_mobile || "",
        mother_qualification: initial_data?.student_meta?.mother_qualification || "",
        mother_occupation: initial_data?.student_meta?.mother_occupation || "",
        mother_email: initial_data?.student_meta?.mother_email || "",
        mother_organisation: initial_data?.student_meta?.mother_organisation || "",
        mother_office_address: initial_data?.student_meta?.mother_office_address || "",
        mother_office_phone: initial_data?.student_meta?.mother_office_phone || "",
        mother_mobile: initial_data?.student_meta?.mother_mobile || "",
        guardian_name: initial_data?.student_meta?.guardian_name || "",
        guardian_qualification: initial_data?.student_meta?.guardian_qualification || "",
        guardian_occupation: initial_data?.student_meta?.guardian_occupation || "",
        guardian_email: initial_data?.student_meta?.guardian_email || "",
        guardian_organisation: initial_data?.student_meta?.guardian_organisation || "",
        guardian_office_address: initial_data?.student_meta?.guardian_office_address || "",
        guardian_office_phone: initial_data?.student_meta?.guardian_office_phone || "",
        guardian_mobile: initial_data?.student_meta?.guardian_mobile || "",
        guardian_relation: initial_data?.student_meta?.guardian_relation || "",
        ssc_passing_year: initial_data?.student_meta?.ssc_passing_year || "",
        hsc_passing_year: initial_data?.student_meta?.hsc_passing_year || "",
        hsc_attempts: initial_data?.student_meta?.hsc_attempts ?? null,
        hsc_obtained_marks: initial_data?.student_meta?.hsc_obtained_marks ?? null,
        hsc_pcb_marks_with_practical: initial_data?.student_meta?.hsc_pcb_marks_with_practical ?? null,
        entrance_exam_name: initial_data?.student_meta?.entrance_exam_name || "",
        neet_score: initial_data?.student_meta?.neet_score ?? null,
        neet_roll_no: initial_data?.student_meta?.neet_roll_no || "",
        neet_application_number: initial_data?.student_meta?.neet_application_number || "",
        neet_all_india_rank: initial_data?.student_meta?.neet_all_india_rank ?? null,
        neet_percentile: initial_data?.student_meta?.neet_percentile || "",
        general_merit: initial_data?.student_meta?.general_merit ?? null,
        category_merit: initial_data?.student_meta?.category_merit ?? null,
        internship_provisional_number: initial_data?.student_meta?.internship_provisional_number || "",
        internship_provisional_date: initial_data?.student_meta?.internship_provisional_date ? formatData(initial_data.student_meta.internship_provisional_date) : "",
        internship_starting_date: initial_data?.student_meta?.internship_starting_date ? formatData(initial_data.student_meta.internship_starting_date) : "",
        internship_completion_date: initial_data?.student_meta?.internship_completion_date ? formatData(initial_data.student_meta.internship_completion_date) : "",
        first_year_attempt: initial_data?.student_meta?.first_year_attempt ?? null,
        second_year_attempt: initial_data?.student_meta?.second_year_attempt ?? null,
        third_year_attempt: initial_data?.student_meta?.third_year_attempt ?? null,
        fourth_year_attempt: initial_data?.student_meta?.fourth_year_attempt ?? null,
        final_bhms_passing_date: initial_data?.student_meta?.final_bhms_passing_date ? formatData(initial_data.student_meta.final_bhms_passing_date) : "",
        ayush_id: initial_data?.student_meta?.ayush_id || "",
        abc_id: initial_data?.student_meta?.abc_id || "",
        admission_cancel: initial_data?.student_meta?.admission_cancel === true || initial_data?.student_meta?.admission_cancel === 1 || String(initial_data?.student_meta?.admission_cancel) === 'true' || String(initial_data?.student_meta?.admission_cancel) === '1',
        admission_cancel_year: initial_data?.student_meta?.admission_cancel_year || "",
        admission_cancel_date: initial_data?.student_meta?.admission_cancel_date ? formatData(initial_data.student_meta.admission_cancel_date) : "",
        admission_transfer: initial_data?.student_meta?.admission_transfer === true || initial_data?.student_meta?.admission_transfer === 1 || String(initial_data?.student_meta?.admission_transfer) === 'true' || String(initial_data?.student_meta?.admission_transfer) === '1',
        admission_transfer_date: initial_data?.student_meta?.admission_transfer_date ? formatData(initial_data.student_meta.admission_transfer_date) : "",
        admission_transfer_to_college: initial_data?.student_meta?.admission_transfer_to_college || "",
        admission_transfer_from_college: initial_data?.student_meta?.admission_transfer_from_college || "",
        admission_year: initial_data?.student_meta?.admission_year || "",
        sub_caste: initial_data?.student_meta?.sub_caste || "",
        quota_fees: initial_data?.student_meta?.quota_fees || "",
        admission_quota: (initial_data as any)?.student_meta?.admission_quota || (initial_data as any)?.academic_class?.[0]?.quota?.name || null,
        activity_house: initial_data?.student_meta?.activity_house || "",
        bank_branch_name: initial_data?.student_meta?.bank_branch_name || "",
        practical_batch: initial_data?.practical_batch || "",
        quota_id: initial_data?.academic_class?.[0]?.quota_id || initial_data?.academic_class?.[0]?.quota?.id || (initial_data as any)?.quota_id || null,
        fees_plan_id: initial_data?.academic_class?.[0]?.fees_status?.fees_plan_id || (initial_data as any)?.fees_plan_id || null,
      })

    } else if (form_type === "create" && initial_data && is_use_for_onBoarding) {

      /**
       * While Onbarding, we need to set the class and division based on the initial data
       * where intial_data has class_id as a id of a class not division . so need to find the class according to this and 
       * set class and admission class , also call method to fetch division for this class   
       */

      if (initial_data?.class_id && AcademicClasses) {

        const CurrentClass = AcademicClasses?.filter((cls) => cls.id === initial_data.class_id)[0];
        if (CurrentClass) handleClassChange(CurrentClass.id.toString(), "class")
        if (CurrentClass) handleDivisionChange(CurrentClass.id.toString(), "class")

        const AdmissionClass = AcademicClasses?.filter(
          (cls) => cls.id === initial_data?.class_id,
        )[0]

        if (AdmissionClass) handleClassChange(AdmissionClass.id.toString(), "admission_Class")
        if (AdmissionClass) handleClassChange(AdmissionClass.id.toString(), "admission_Class")

      }

      // Set initial form values from the inquiry data
      form.reset({
        first_name: initial_data.first_name || "",
        middle_name: initial_data.middle_name || null,
        last_name: initial_data.last_name || "",
        first_name_in_guj: initial_data.first_name_in_guj || null,
        middle_name_in_guj: initial_data.middle_name_in_guj || null,
        last_name_in_guj: initial_data.last_name_in_guj || null,
        gender: normalizeGender(initial_data.gender),
        birth_date: initial_data.birth_date ? formatData(initial_data.birth_date) : "",
        gr_no: initial_data.gr_no,
        primary_mobile: initial_data.primary_mobile,
        father_name: initial_data.father_name || null,
        father_name_in_guj: initial_data.father_name_in_guj || null,
        mother_name: initial_data.mother_name || null,
        mother_name_in_guj: initial_data.mother_name_in_guj || null,
        class: initial_data?.class_id ? initial_data?.class_id.toString() : undefined,
        roll_number: initial_data?.first_year_roll_number || initial_data?.second_year_roll_number || initial_data?.third_year_roll_number || initial_data?.fourth_year_roll_number || null,
        admission_number: (initial_data as any)?.admission_number || null,
        first_year_roll_number: (initial_data as any)?.first_year_roll_number ?? null,
        second_year_roll_number: (initial_data as any)?.second_year_roll_number ?? null,
        third_year_roll_number: (initial_data as any)?.third_year_roll_number ?? null,
        fourth_year_roll_number: (initial_data as any)?.fourth_year_roll_number ?? null,
        name_as_per_aadhar: (initial_data as any)?.student_meta?.name_as_per_aadhar || null,
        nationality: (initial_data as any)?.student_meta?.nationality || null,
        blood_group: (initial_data as any)?.student_meta?.blood_group || null,
        university_spid_no: (initial_data as any)?.student_meta?.university_spid_no || null,
        admission_category: (initial_data as any)?.student_meta?.admission_category || null,
        tuition_fees: (initial_data as any)?.student_meta?.tuition_fees || null,
        roll_no_internship: (initial_data as any)?.student_meta?.roll_no_internship || null,
        bank_branch_pincode: (initial_data as any)?.student_meta?.bank_branch_pincode || null,
        aadhar_no: initial_data?.aadhar_no ? Number(initial_data?.aadhar_no) : null,
        aadhar_dise_no: initial_data?.student_meta?.aadhar_dise_no
          ? Number(initial_data?.student_meta?.aadhar_dise_no)
          : null,
        birth_place: initial_data?.student_meta?.birth_place || null,
        birth_place_in_guj: initial_data?.student_meta?.birth_place_in_guj || null,
        religion: initial_data?.student_meta?.religion || null,
        religion_in_guj: initial_data?.student_meta?.religion_in_guj || null,
        caste: initial_data?.student_meta?.caste || null,
        caste_in_guj: initial_data?.student_meta?.caste_in_guj || null,
        category: initial_data?.student_meta?.category || null,
        privious_school: initial_data?.student_meta?.privious_school || null,
        privious_school_in_guj: initial_data?.student_meta?.privious_school_in_guj || null,
        address: initial_data?.student_meta?.address || null,
        district: initial_data?.student_meta?.district || null,
        city: initial_data?.student_meta?.city || null,
        state: initial_data?.student_meta?.state || null,
        postal_code: initial_data?.student_meta?.postal_code ? initial_data.student_meta.postal_code.toString() : null,
        bank_name: initial_data?.student_meta?.bank_name || null,
        account_no: initial_data?.student_meta?.account_no ? Number(initial_data?.student_meta?.account_no) : null,
        // admission_date: initial_data!.student_meta!.admission_date
        //   ? formatData(initial_data!.student_meta!.admission_date)
        //   : null,
        IFSC_code: initial_data?.student_meta?.IFSC_code || null,
        secondary_mobile: initial_data?.student_meta?.secondary_mobile || null,
        admission_class: null,
        admission_division: null,
        current_area: initial_data?.student_meta?.current_area || "",
        current_country: initial_data?.student_meta?.current_country || "",
        permanent_address: initial_data?.student_meta?.permanent_address || "",
        permanent_area: initial_data?.student_meta?.permanent_area || "",
        permanent_city: initial_data?.student_meta?.permanent_city || "",
        permanent_state: initial_data?.student_meta?.permanent_state || "",
        permanent_pincode: initial_data?.student_meta?.permanent_pincode || "",
        permanent_country: initial_data?.student_meta?.permanent_country || "",
        country_code: initial_data?.student_meta?.country_code || "",
        student_code: initial_data?.student_meta?.student_code || "",
        admission_standard: initial_data?.student_meta?.admission_standard || "",
        subject_group: initial_data?.student_meta?.subject_group || "",
        birth_taluka: initial_data?.student_meta?.birth_taluka || "",
        birth_district: initial_data?.student_meta?.birth_district || "",
        student_leaving_reason: initial_data?.student_meta?.student_leaving_reason || "",
        student_lc_date: initial_data?.student_meta?.student_lc_date ? formatData(initial_data.student_meta.student_lc_date) : "",
        student_lc_no: initial_data?.student_meta?.student_lc_no || "",
        pen: initial_data?.student_meta?.pen || "",
        abha_card_no: initial_data?.student_meta?.abha_card_no || "",
        school_udise_no: initial_data?.student_meta?.school_udise_no || "",
        email_id: initial_data?.student_meta?.email_id || "",
        website: initial_data?.student_meta?.website || "",
        mother_tongue: initial_data?.student_meta?.mother_tongue || "",
        father_qualification: initial_data?.student_meta?.father_qualification || "",
        father_occupation: initial_data?.student_meta?.father_occupation || "",
        father_email: initial_data?.student_meta?.father_email || "",
        father_organisation: initial_data?.student_meta?.father_organisation || "",
        father_office_address: initial_data?.student_meta?.father_office_address || "",
        father_office_phone: initial_data?.student_meta?.father_office_phone || "",
        father_mobile: initial_data?.student_meta?.father_mobile || "",
        mother_qualification: initial_data?.student_meta?.mother_qualification || "",
        mother_occupation: initial_data?.student_meta?.mother_occupation || "",
        mother_email: initial_data?.student_meta?.mother_email || "",
        mother_organisation: initial_data?.student_meta?.mother_organisation || "",
        mother_office_address: initial_data?.student_meta?.mother_office_address || "",
        mother_office_phone: initial_data?.student_meta?.mother_office_phone || "",
        mother_mobile: initial_data?.student_meta?.mother_mobile || "",
        guardian_name: initial_data?.student_meta?.guardian_name || "",
        guardian_qualification: initial_data?.student_meta?.guardian_qualification || "",
        guardian_occupation: initial_data?.student_meta?.guardian_occupation || "",
        guardian_email: initial_data?.student_meta?.guardian_email || "",
        guardian_organisation: initial_data?.student_meta?.guardian_organisation || "",
        guardian_office_address: initial_data?.student_meta?.guardian_office_address || "",
        guardian_office_phone: initial_data?.student_meta?.guardian_office_phone || "",
        guardian_mobile: initial_data?.student_meta?.guardian_mobile || "",
        guardian_relation: initial_data?.student_meta?.guardian_relation || "",
        ssc_passing_year: initial_data?.student_meta?.ssc_passing_year || "",
        hsc_passing_year: initial_data?.student_meta?.hsc_passing_year || "",
        hsc_attempts: initial_data?.student_meta?.hsc_attempts ?? null,
        hsc_obtained_marks: initial_data?.student_meta?.hsc_obtained_marks ?? null,
        hsc_pcb_marks_with_practical: initial_data?.student_meta?.hsc_pcb_marks_with_practical ?? null,
        entrance_exam_name: initial_data?.student_meta?.entrance_exam_name || "",
        neet_score: initial_data?.student_meta?.neet_score ?? null,
        neet_roll_no: initial_data?.student_meta?.neet_roll_no || "",
        neet_application_number: initial_data?.student_meta?.neet_application_number || "",
        neet_all_india_rank: initial_data?.student_meta?.neet_all_india_rank ?? null,
        neet_percentile: initial_data?.student_meta?.neet_percentile || "",
        general_merit: initial_data?.student_meta?.general_merit ?? null,
        category_merit: initial_data?.student_meta?.category_merit ?? null,
        internship_provisional_number: initial_data?.student_meta?.internship_provisional_number || "",
        internship_provisional_date: initial_data?.student_meta?.internship_provisional_date ? formatData(initial_data.student_meta.internship_provisional_date) : "",
        internship_starting_date: initial_data?.student_meta?.internship_starting_date ? formatData(initial_data.student_meta.internship_starting_date) : "",
        internship_completion_date: initial_data?.student_meta?.internship_completion_date ? formatData(initial_data.student_meta.internship_completion_date) : "",
        first_year_attempt: initial_data?.student_meta?.first_year_attempt ?? null,
        second_year_attempt: initial_data?.student_meta?.second_year_attempt ?? null,
        third_year_attempt: initial_data?.student_meta?.third_year_attempt ?? null,
        fourth_year_attempt: initial_data?.student_meta?.fourth_year_attempt ?? null,
        final_bhms_passing_date: initial_data?.student_meta?.final_bhms_passing_date ? formatData(initial_data.student_meta.final_bhms_passing_date) : "",
        ayush_id: initial_data?.student_meta?.ayush_id || "",
        abc_id: initial_data?.student_meta?.abc_id || "",
        admission_cancel: initial_data?.student_meta?.admission_cancel ?? false,
        admission_cancel_year: initial_data?.student_meta?.admission_cancel_year || "",
        admission_cancel_date: initial_data?.student_meta?.admission_cancel_date ? formatData(initial_data.student_meta.admission_cancel_date) : "",
        admission_transfer: initial_data?.student_meta?.admission_transfer ?? false,
        admission_transfer_date: initial_data?.student_meta?.admission_transfer_date ? formatData(initial_data.student_meta.admission_transfer_date) : "",
        admission_transfer_to_college: initial_data?.student_meta?.admission_transfer_to_college || "",
        admission_transfer_from_college: initial_data?.student_meta?.admission_transfer_from_college || "",
        admission_year: initial_data?.student_meta?.admission_year || "",
        sub_caste: initial_data?.student_meta?.sub_caste || "",
        quota_fees: initial_data?.student_meta?.quota_fees || "",
        admission_quota: (initial_data as any)?.student_meta?.admission_quota || (initial_data as any)?.academic_class?.[0]?.quota?.name || null,
        activity_house: initial_data?.student_meta?.activity_house || "",
        bank_branch_name: initial_data?.student_meta?.bank_branch_name || "",
        quota_id: (initial_data as any)?.quota_type || (initial_data as any)?.quota_id || null,
        fees_plan_id: (initial_data as any)?.fees_plan_id || null,
      })
    }
    else {
    }
  }, [AcademicClasses, initial_data, form_type, form.reset])

  useEffect(() => {
    if (!AcademicClasses && authState.user) {
      getAcademicClasses(authState.user!.school_id)
    }
  }, [setSelectedClass])

  useEffect(() => {
    const errors = form.formState.errors;
    console.log("errors", errors)
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0]
      const tabToActivate = tabMapping[firstErrorField]
      setActiveTab(tabToActivate)

      // Focus on the input field with the error
      setTimeout(() => {
        inputRefs.current[firstErrorField]?.focus()
      }, 0)
    }
  }, [form.formState.errors])


  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!AcademicClasses || AcademicClasses.length === 0) {
    return <div>No classes available. Please add classes first.</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-1 p-1.5 [&>button]:py-1.5">
            <TabsTrigger value="personal">{t("personal")}</TabsTrigger>
            <TabsTrigger value="family">{t("family")}</TabsTrigger>
            <TabsTrigger value="academic">{t("academic")}</TabsTrigger>
            <TabsTrigger value="other">{t("other")}</TabsTrigger>
            <TabsTrigger value="address">{t("address")}</TabsTrigger>
            <TabsTrigger value="bank">{t("bank")}</TabsTrigger>
            {isCollege && <TabsTrigger value="college">College Details</TabsTrigger>}
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>{t("personal_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 pb-4 border-b">
                  <AvatarUpload
                    currentPhotoUrl={form.watch("profile_photo")}
                    fallbackText={`${form.watch("first_name")?.[0] || ""}${form.watch("last_name")?.[0] || ""}`}
                    size="md"
                    onUpload={async (file) => {
                      const url = await uploadImageToStorage(file, "photos/students")
                      form.setValue("profile_photo", url, { shouldDirty: true })
                      return url
                    }}
                    onDelete={async () => {
                      form.setValue("profile_photo", null, { shouldDirty: true })
                    }}
                  />
                  <div>
                    <h4 className="font-medium text-sm">Student Profile Photo</h4>
                    <p className="text-xs text-muted-foreground">Upload photo to DigitalOcean cloud storage (max 5MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="enrollment_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admission_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("first_name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middle_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("middle_name")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("last_name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name_as_per_aadhar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name as Per Aadhar</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("gender")}</FormLabel>
                        <Select
                          // Radix Select reports "" when the form is reset or its items re-render; ignore it so a loaded gender is not wiped
                          onValueChange={(val) => {
                            if (val) field.onChange(val)
                          }}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">{t("male")}</SelectItem>
                            <SelectItem value="Female">
                              {t("female")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("date_of_birth")}</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value || null)
                              // Trigger validation when birth date changes
                              const admissionDate = form.getValues('admission_date')
                              if (admissionDate && e.target.value) {
                                if (!validateDates(e.target.value, admissionDate)) {
                                  form.setError('admission_date', {
                                    type: 'manual',
                                    message: 'Admission date must be greater than birth date'
                                  })
                                } else {
                                  form.clearErrors('admission_date')
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birth_place"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("birth_place")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blood_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value || null)}
                          value={field.value ?? undefined}
                          disabled={form_type === "view"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Blood Group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="aadhar_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("aadhar_no")}</FormLabel>
                        <FormControl>
                          <NumberInput
                            {...field}
                            value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
                            onChange={(value) =>
                              field.onChange(value ? Number(value) : null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aadhar_dise_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("aadhar_DISE_number")}</FormLabel>
                        <FormControl>
                          <NumberInput
                            {...field}
                            value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
                            onChange={(value) =>
                              field.onChange(value ? Number(value) : null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="button" onClick={handleNextTab}>
                  {t("next")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle>{t("family_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="father_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("father's_name")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mother_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mother's_name")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primary_mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("mobile_no")}</FormLabel>
                        <FormControl>
                          <NumberInput
                            {...field}
                            value={(field.value === undefined || field.value === null) ? "" : String(field.value)}
                            onChange={(value) => {
                              field.onChange(value === "" ? undefined : Number(value))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secondary_mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("other_mobile_no")}</FormLabel>
                        <FormControl>
                          <NumberInput
                            {...field}
                            value={field.value == null ? "" : String(field.value)}
                            onChange={(value) => {
                              field.onChange((value === "" || isNaN(Number(value))) ? null : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <hr className="border-border" />
                {/* Extended Parent & Guardian Details */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Extended Parent & Guardian Details
                  </h3>
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-4 space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Father's Additional Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="father_occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="father_mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile No.</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4 space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Mother's Additional Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="mother_occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mother_mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile No.</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4 space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Local Guardian's Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="guardian_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guardian_relation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relation with Student</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guardian_occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occupation</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guardian_mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile No.</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                >
                  {t("previous")}
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  {t("next")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader>
                <CardTitle>{t("academic_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admission_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("admission_date")}</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value || null)
                              // Trigger validation when admission date changes
                              const birthDate = form.getValues('birth_date')
                              if (birthDate && e.target.value) {
                                if (!validateDates(birthDate, e.target.value)) {
                                  form.setError('admission_date', {
                                    type: 'manual',
                                    message: 'Admission date must be greater than birth date'
                                  })
                                } else {
                                  form.clearErrors('admission_date')
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admission_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Year</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="university_spid_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University SPID Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admission_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Category</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tuition_fees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tuition Fees</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="first_year_roll_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll No. 1st BHMS</FormLabel>
                        <FormControl>
                          <Input
                            {...field} type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="second_year_roll_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll No. 2nd BHMS</FormLabel>
                        <FormControl>
                          <Input
                            {...field} type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="third_year_roll_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll No. 3rd BHMS</FormLabel>
                        <FormControl>
                          <Input
                            {...field} type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fourth_year_roll_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll No. 4th BHMS</FormLabel>
                        <FormControl>
                          <Input
                            {...field} type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roll_no_internship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll No. Internship</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            disabled={form_type === "view"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isCollege && (
                    <FormField
                      control={form.control}
                      name="practical_batch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("practical_batch") || "Practical Batch"}</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={(value) => field.onChange(value === "None" ? "" : value)}
                            disabled={form_type === "view"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="Batch A">Batch A</SelectItem>
                              <SelectItem value="Batch B">Batch B</SelectItem>
                              <SelectItem value="Batch C">Batch C</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("current_class")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleClassChange(value, "class");
                          }}
                          disabled={
                            form_type === "view" || is_use_for_onBoarding
                          } // Disable selection in view mode
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_class")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value=" " disabled>
                              {t("classes")}
                            </SelectItem>
                            {AcademicClasses.map(
                              (cls, index) => (
                                  <SelectItem
                                    key={index}
                                    value={cls.id.toString()}
                                  >
                                    {cls.class}
                                  </SelectItem>
                                )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* ── Admission Quota & Fee Structure Template ────────────── */}
                <div className="p-4 rounded-lg border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-600 text-white">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Admission Quota & Fee Structure Template
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Assign student's admission quota and lock their grandfathered cohort fee plan.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                      <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                      Cohort Grandfathered
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Admission Quota */}
                    <FormField
                      control={form.control}
                      name="admission_quota"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-blue-600" />
                            Admission Quota
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              placeholder="e.g. Government Quota"
                              className="h-9 text-xs bg-white"
                              disabled={form_type === "view"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 2. Fee Structure Template */}
                    <FormField
                      control={form.control}
                      name="fees_plan_id"
                      render={({ field }) => {
                        const currentQuotaId = form.watch("quota_id")
                        const relevantPlans = currentQuotaId
                          ? feePlans.filter((p) => Number(p.quota_id) === Number(currentQuotaId))
                          : feePlans
                        const displayPlans = relevantPlans.length > 0 ? relevantPlans : feePlans

                        return (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Coins className="h-3.5 w-3.5 text-amber-600" />
                              Assigned Fee Template (Cohort Plan)
                            </FormLabel>
                            <Select
                              value={field.value ? String(field.value) : "none"}
                              onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                              disabled={form_type === "view"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 text-xs bg-white">
                                  <SelectValue placeholder="Select fee template to lock..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none" className="text-xs">
                                  Do not assign fee template yet
                                </SelectItem>
                                {displayPlans.map((plan) => (
                                  <SelectItem key={plan.id} value={String(plan.id)} className="text-xs">
                                    {plan.name} — ₹{Number(plan.total_amount || 0).toLocaleString("en-IN")} {plan.quota ? `(${plan.quota.name})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />
                  </div>

                  {/* Summary Card if Fee Plan is selected */}
                  {(() => {
                    const currentPlanId = form.watch("fees_plan_id")
                    const planObj = feePlans.find((p) => Number(p.id) === Number(currentPlanId))
                    if (!planObj) return null

                    return (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-md text-xs space-y-1">
                        <div className="flex justify-between items-center font-medium text-emerald-900">
                          <span>Selected Plan: <strong className="font-semibold">{planObj.name}</strong></span>
                          <span className="text-emerald-700 font-bold text-sm">₹{Number(planObj.total_amount || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          This fee structure will be grandfathered and locked for this student across all terms in their academic cohort.
                        </p>
                      </div>
                    )
                  })()}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="privious_school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("previous_school")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                >
                  {t("previous")}
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  {t("next")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="other">
            <Card>
              <CardHeader>
                <CardTitle>{t("other_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="religion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("religion")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caste"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("caste")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("category")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          placeholder={t("select_category")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                >
                  {t("previous")}
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  {t("next")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>{t("address_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("postal_code")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <hr className="border-border" />
                {/* Extended Addresses */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Extended Address Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="permanent_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permanent Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              disabled={form_type === "view"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="permanent_pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permanent Pin Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              disabled={form_type === "view"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                >
                  {t("previous")}
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  {t("next")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>{t("bank_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bank_name")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("account_number")}</FormLabel>
                      <FormControl>
                        <NumberInput
                          {...field}
                          value={field.value ? String(field.value) : ""}
                          onChange={(value) =>
                            field.onChange(value ? Number(value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="IFSC_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("ifsc_code")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                >
                  {t("previous")}
                </Button>
                {isCollege ? (
                  <Button type="button" onClick={handleNextTab}>
                    {t("next")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      isStundetGetingUpdate ||
                      isStundetGetingCreate ||
                      isOnBoardingStudent
                    }
                  >
                    {(!isStundetGetingUpdate || !isStundetGetingCreate) &&
                      (form_type === "create"
                        ? is_use_for_onBoarding
                          ? t("onboard_student")
                          : t("submit")
                        : "Update")}
                    {(isStundetGetingUpdate ||
                      isStundetGetingCreate ||
                      isOnBoardingStudent) && (
                        <Loader2 className="animate-spin" />
                      )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {isCollege && (
            <TabsContent value="college">
              <Card>
                <CardHeader>
                  <CardTitle>College Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-6">
                    {/* NEET & Entrance Exam Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        NEET & Entrance Exam Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="neet_score"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NEET Score</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  decimal
                                  decimalPlaces={2}
                                  value={field.value !== null && field.value !== undefined ? String(field.value) : ""}
                                  // keep the typed text (e.g. "540.") so the decimal point is not lost; zod converts it to a number on submit
                                  onChange={(value) => field.onChange(value ? value : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neet_roll_no"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NEET Roll No.</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neet_application_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NEET Application Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neet_all_india_rank"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NEET All India Rank</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neet_percentile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NEET Percentile (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="general_merit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>General Merit</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="category_merit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Merit</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <hr className="border-border" />

                    {/* Academic History */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Academic History
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="ssc_passing_year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>S.S.C. Passing Year</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hsc_passing_year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>H.S.C. Passing Year</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hsc_attempts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>H.S.C. Attempts</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hsc_obtained_marks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>H.S.C. Obtained Marks</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hsc_pcb_marks_with_practical"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>H.S.C. PCB Marks with Practical</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="first_year_attempt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>1st Year Attempt</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="second_year_attempt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>2nd Year Attempt</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="third_year_attempt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>3rd Year Attempt</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fourth_year_attempt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>4th Year Attempt</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  value={field.value ? String(field.value) : ""}
                                  onChange={(value) => field.onChange(value ? Number(value) : null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="final_bhms_passing_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Final BHMS Date of Passing</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <hr className="border-border" />

                    {/* Internship Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Internship Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="internship_provisional_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provisional Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="internship_provisional_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provisional Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="internship_starting_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Starting Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="internship_completion_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Completion Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <hr className="border-border" />



                    {/* Administrative & Miscellaneous */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Administrative & Miscellaneous
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="country_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country Code</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="student_leaving_reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student Leaving Reason</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="student_lc_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student LC Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="student_lc_no"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student LC No.</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="school_udise_no"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School UDISE No.</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email ID</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ayush_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ayush ID</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="abc_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ABC ID</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_branch_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Branch Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_branch_pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch Pin Code</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <hr className="border-border" />

                    {/* Admission Status changes */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Admission Cancellations & Transfers
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="admission_cancel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admission Cancelled</FormLabel>
                              <Select
                                value={field.value ? "true" : "false"}
                                onValueChange={(value) => field.onChange(value === "true")}
                                disabled={form_type === "view"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="false">No</SelectItem>
                                  <SelectItem value="true">Yes</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admission_cancel_year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cancel Year</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admission_cancel_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cancel Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admission_transfer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admission Transferred</FormLabel>
                              <Select
                                value={field.value ? "true" : "false"}
                                onValueChange={(value) => field.onChange(value === "true")}
                                disabled={form_type === "view"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="false">No</SelectItem>
                                  <SelectItem value="true">Yes</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admission_transfer_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transfer Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admission_transfer_to_college"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transfer To College</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="admission_transfer_from_college"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transfer From College</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                  disabled={form_type === "view"}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousTab}
                  >
                    {t("previous")}
                  </Button>
                  {(
                    <Button
                    type="submit"
                    disabled={
                      isStundetGetingUpdate ||
                      isStundetGetingCreate ||
                      isOnBoardingStudent
                    }
                  >
                    {(!isStundetGetingUpdate || !isStundetGetingCreate) &&
                      (form_type === "create"
                        ? is_use_for_onBoarding
                          ? t("onboard_student")
                          : t("submit")
                        : "Update")}
                    {(isStundetGetingUpdate ||
                      isStundetGetingCreate ||
                      isOnBoardingStudent) && (
                        <Loader2 className="animate-spin" />
                      )}
                  </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </form>
    </Form>
  );
}

export default StudentForm