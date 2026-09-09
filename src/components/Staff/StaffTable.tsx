
// import { useState, useMemo, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { SaralPagination } from "../ui/common/SaralPagination";
// import { StaffRole, StaffType } from "@/types/staff";
// import dynamic from "next/dynamic"
// import StaffPdfDilog from "./StaffPdfDilog";
// import { Trash2 } from "lucide-react";
// import { PageMeta } from "@/types/global";
// import { useTranslation } from "@/redux/hooks/useTranslation";

// const isValidEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// const isValidMobile = (mobile: number): boolean => {
//   const mobileRegex = /^[6-9]\d{9}$/;
//   return mobileRegex.test(mobile.toString());
// };


// export default function StaffTable({
//   type,
//   staffList,
//   onEdit,
//   onDelete,
//   onPageChange
// }: {
//   staffList: { staff: StaffType[], page_meta: PageMeta };
//   onEdit: (staff_id: number) => void;
//   onPageChange: (page: number) => void;
//   onDelete: (staff_id: number) => void;
//   setDefaultRoute?: number;
//   type: 'teaching' | 'non-teaching'
// }) {

//   const StafftDetailsPDF = dynamic(() => import("./StaffPdf"), {
//     ssr: false,
//     loading: () => <p>Loading PDF generator...</p>,
//   })

//   const [dialogOpen, setDialogOpen] = useState(false)
//   const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null)

//   const handleStaffClick = (staff: StaffType) => {
//     setSelectedStaff(staff)
//     setDialogOpen(true)
//   }
//   const perPageData = 6;
//   const totalPages = staffList.page_meta.last_page;

//   const { t } = useTranslation();

//   const handelPageChange = (upadatedPage: number) => {
//     onPageChange(upadatedPage);
//   };


//   return (
//     <div className="w-full overflow-auto">
//       {staffList.staff && staffList.staff.length > 0 ? (
//         <>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>{t("name")}</TableHead>
//                 <TableHead>{t("gender")}</TableHead>
//                 <TableHead>{t("email")}</TableHead>
//                 <TableHead>{t("mobile")}</TableHead>
//                 <TableHead>{t("aadhar_no")}</TableHead>
//                 <TableHead>{t("DOJ")}</TableHead>
//                 <TableHead>{t("designation")}</TableHead>
//                 <TableHead>{t("current_status")}</TableHead>
//                 <TableHead>{t("actions")}</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {staffList.staff && staffList.staff.map((staff) => (
//                 <TableRow key={staff.id}>
//                   <TableCell>
//                     <button
//                       className="text-blue-600 hover:underline focus:outline-none"
//                       onClick={() => handleStaffClick(staff)}
//                     >
//                       {staff.first_name} {staff.middle_name} {staff.last_name}
//                     </button>
//                   </TableCell>
//                   <TableCell>{staff.gender}</TableCell>
//                   <TableCell>
//                     {isValidEmail(staff.email) ? (
//                       staff.email
//                     ) : (
//                       <span className="text-red-500">{t("N/A")}</span>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     {isValidMobile(staff.mobile_number) ? (
//                       staff.mobile_number
//                     ) : (
//                       <span className="text-red-500">{"N/A"}</span>
//                     )}
//                   </TableCell>
//                   <TableCell>{staff.aadhar_no ?? "N/A"}</TableCell>
//                   <TableCell>
//                     {staff.joining_date
//                       ? new Date(staff.joining_date).toLocaleDateString("en-GB")
//                       : "-"}
//                     </TableCell>
//                   <TableCell>{staff.role}</TableCell>
//                   <TableCell>{staff.employment_status}</TableCell>
//                   <TableCell>
//                     {/* <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button
//                         variant="ghost"
//                         className="h-8 w-8 p-0"
//                       // disabled={
//                       //   !isValidEmail(staff.email) ||
//                       //   !isValidMobile(staff.mobile)
//                       // }
//                       >
//                         <span className="sr-only">Open menu</span>
//                         <MoreHorizontal className="h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                       <DropdownMenuItem
//                         onClick={() =>
//                           navigator.clipboard.writeText(staff.id.toString())
//                         }
//                       >
//                         Copy staff ID
//                       </DropdownMenuItem>
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem onClick={() => onEdit(staff.id)}>
//                         Edit staff
//                       </DropdownMenuItem>
//                       <DropdownMenuItem>Delete staff</DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu> */}
//                     <Button variant="outline" onClick={() => onEdit(staff.id)}>
//                       {t("edit")}
//                     </Button>
//                     {/* <Button className="ms-2" variant="outline" onClick={() => onDelete(staff.id)}>
//                       <Trash2 className="text-red-500" />
//                     </Button> */}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//           {selectedStaff && (
//             <StaffPdfDilog
//             dialogOpen={dialogOpen}
//             setDialogOpen={setDialogOpen}
//             selectedStaff={selectedStaff}
//             StaffDetailsPDF={StafftDetailsPDF}
//           />)}
//           <SaralPagination
//             currentPage={staffList.page_meta.current_page ?? staffList.page_meta.currentPage}
//             totalPages={staffList.page_meta.last_page ?? staffList.page_meta.lastPage}
//             onPageChange={handelPageChange}
//           />

//         </>
//       ) : (
//         <div className="text-center py-4 text-gray-500">{t("no_records_found")}</div>
//       )}
//     </div>
//   );
// }


"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SaralPagination } from "../ui/common/SaralPagination"
import type { StaffType } from "@/types/staff"
import dynamic from "next/dynamic"
import StaffPdfDilog from "./StaffPdfDilog"
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Trash2 } from "lucide-react"
import type { PageMeta } from "@/types/global"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { useLazyGetStaffByIdQuery } from "@/services/StaffService"
import * as XLSX from "xlsx"
import { toast } from "@/hooks/use-toast"

const isValidEmail = (email?: string | null): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidMobile = (mobile?: number | string | null): boolean => {
  if (!mobile) return false
  const str = String(mobile).trim()
  const mobileRegex = /^[6-9]\d{9}$/
  return mobileRegex.test(str)
}

interface StaffTableProps {
  staffList: { staff: StaffType[]; page_meta: PageMeta }
  onEdit: (staff_id: number) => void
  onPageChange: (page: number) => void
  onDelete: (staff_id: number) => void
  setDefaultRoute?: number
  type: "teaching" | "non-teaching"
  filteredStaff: StaffType[]
}

export default function StaffTable({
  type,
  staffList,
  onEdit,
  onDelete,
  onPageChange,
  filteredStaff,
}: StaffTableProps) {
  const StafftDetailsPDF = dynamic(() => import("./StaffPdf"), {
    ssr: false,
    loading: () => <p>Loading PDF generator...</p>,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [getStaffById] = useLazyGetStaffByIdQuery()

  const handleStaffClick = (staff: StaffType) => {
    setSelectedStaff(staff)
    setDialogOpen(true)
  }

  const { t } = useTranslation()

  const handelPageChange = (upadatedPage: number) => {
    onPageChange(upadatedPage)
  }

  // Add sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleDownloadExperience = async (staff: StaffType) => {
    try {
      const response = await getStaffById(staff.id).unwrap()
      const experiences = (response as any).experiences || response.staff_experiences

      if (!experiences || experiences.length === 0) {
        toast({
          title: "No Experience Data",
          description: "No experience records found for this staff member.",
          variant: "destructive"
        })
        return
      }

      const data = experiences.map((exp: any) => ({
        "Institute Name": exp.institute_name || "-",
        "Post Name": exp.post_name || "-",
        "Department": exp.department || "-",
        "Appointment Regulation": exp.appointment_regulation || "-",
        "From Date": exp.from_date ? new Date(exp.from_date).toLocaleDateString("en-GB") : "-",
        "To Date": exp.to_date ? new Date(exp.to_date).toLocaleDateString("en-GB") : "-",
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Experience")

      const fileName = `${staff.first_name}_${staff.last_name}_Experience.xlsx`
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error("Failed to fetch staff experiences:", error)
      toast({
        title: "Error",
        description: "Failed to download experience data.",
        variant: "destructive"
      })
    }
  }


  // Add sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    )
  }

  // Add sorted data memo
  const sortedStaff = useMemo(() => {
    if (!sortField) return filteredStaff

    return [...filteredStaff].sort((a, b) => {
      let aValue: any = a[sortField as keyof StaffType]
      let bValue: any = b[sortField as keyof StaffType]

      // Handle special cases for sorting
      if (sortField === "name") {
        aValue = `${a.first_name} ${a.middle_name || ""} ${a.last_name}`.toLowerCase()
        bValue = `${b.first_name} ${b.middle_name || ""} ${b.last_name}`.toLowerCase()
      }

      // Handle null/undefined values
      if (aValue == null) aValue = ""
      if (bValue == null) bValue = ""

      // Convert to string for comparison if needed
      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredStaff, sortField, sortDirection])



  return (
    <div className="w-full overflow-auto">
      {sortedStaff && sortedStaff.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    {t("name")}
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort("gender")}>
                  <div className="flex items-center">
                    {t("gender")}
                    <SortIcon field="gender" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort("email")}>
                  <div className="flex items-center">
                    {t("email")}
                    <SortIcon field="email" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("mobile_number")}
                >
                  <div className="flex items-center">
                    {t("mobile")}
                    <SortIcon field="mobile_number" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("aadhar_no")}
                >
                  <div className="flex items-center">
                    {t("aadhar_no")}
                    <SortIcon field="aadhar_no" />
                  </div>
                </TableHead>
                <TableHead>{t("DOJ")}</TableHead>
                <TableHead>{t("staff_type") || "Type"}</TableHead>
                <TableHead>{t("staff_category") || "Category"}</TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => handleSort("designation")}>
                  <div className="flex items-center">
                    {t("designation") || "Designation"}
                    <SortIcon field="designation" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("employment_status")}
                >
                  <div className="flex items-center">
                    {t("current_status")}
                    <SortIcon field="employment_status" />
                  </div>
                </TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <button
                      className="text-blue-600 hover:underline focus:outline-none"
                      onClick={() => handleStaffClick(staff)}
                    >
                      {staff.first_name} {staff.middle_name} {staff.last_name}
                    </button>
                  </TableCell>
                  <TableCell>{staff.gender}</TableCell>
                  <TableCell>
                    {isValidEmail(staff.email) ? staff.email : <span className="text-red-500">{t("N/A")}</span>}
                  </TableCell>
                  <TableCell>
                    {isValidMobile(staff.mobile_number) ? (
                      staff.mobile_number
                    ) : (
                      <span className="text-red-500">{"N/A"}</span>
                    )}
                  </TableCell>
                  <TableCell>{staff.aadhar_no ?? "N/A"}</TableCell>
                  <TableCell>
                    {staff.joining_date ? new Date(staff.joining_date).toLocaleDateString("en-GB") : "-"}
                  </TableCell>
                  <TableCell>{staff.staff_type || "N/A"}</TableCell>
                  <TableCell>{staff.staff_category || "N/A"}</TableCell>
                  <TableCell>{staff.designation || staff.role || "N/A"}</TableCell>
                  <TableCell>{staff.employment_status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(staff.id)}>
                        {t("edit")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadExperience(staff)} title="Download Experience">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(staff.id)}
                        title="Delete Staff"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {selectedStaff && (
            <StaffPdfDilog
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              selectedStaff={selectedStaff}
              StaffDetailsPDF={StafftDetailsPDF}
            />
          )}
          <SaralPagination
            currentPage={staffList.page_meta.current_page ?? staffList.page_meta.currentPage}
            totalPages={staffList.page_meta.last_page ?? staffList.page_meta.lastPage}
            onPageChange={handelPageChange}
          />
        </>
      ) : (
        <div className="text-center py-4 text-gray-500">{t("no_records_found")}</div>
      )}
    </div>
  )
}
