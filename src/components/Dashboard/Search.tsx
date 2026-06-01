import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  User,
  GraduationCap,
  ShieldCheck,
  BadgeIcon as IdCard,
  PenIcon as UserPen,
  CircleHelp,
  Grip,
  PieChartIcon as ChartPie,
  Hand,
  Shapes,
  UserRoundCheck,
  UsersRound,
  Type,
  X,
  Phone,
  SearchX,
} from "lucide-react"
import { useContext, useEffect, useMemo, useState } from "react"
import type { SearchCategory } from "@/types/searchCategory"
import { SearchContext } from "./searchContext"
import { useLocation, useNavigate } from "react-router-dom"

import type { Student } from "@/types/student"
import type { StaffType } from "@/types/staff"
import { Button } from "@/components/ui/button"
import { useLazySearchStudentsQuery } from "@/services/StudentServices"
import { useDebounceThrottle } from "@/hooks/use-debounce-throttle"
import { StudentSearchResults } from "../Students/StudentSearchResult"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { useLazySearchStaffQuery } from "@/services/StaffService"
import { StaffSearchResults } from "../Staff/StaffSearchResults"

export function Search() {
  // Get the current active academic session from Redux
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)

  // Original categories
  const studentCategories: SearchCategory[] = [
    { id: "name", label: "Student Name", icon: <User className="h-4 w-4" /> },
    { id: "grno", label: "GR Number", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "mobile", label: "Mobile Number", icon: <Phone className="h-4 w-4" /> },
  ]
  const staffCategories: SearchCategory[] = [
    { id: "name", label: "Name", icon: <User className="h-4 w-4" /> },
    // { id: "employee_code", label: "Staff ID", icon: <IdCard className="h-4 w-4" /> },
    // { id: "mobile", label: "Mobile Number", icon: <Phone className="h-4 w-4" /> },
    // { id: "role", label: "Role", icon: <UserPen className="h-4 w-4" /> },
  ]
  const payrollCategories: SearchCategory[] = [
    { id: "name", label: "Name", icon: <User className="h-4 w-4" /> },
    { id: "role", label: "Role", icon: <CircleHelp className="h-4 w-4" /> },
    { id: "category", label: "Category", icon: <Grip className="h-4 w-4" /> },
    { id: "status", label: "Status", icon: <ChartPie className="h-4 w-4" /> },
  ]
  const attendanceCategories: SearchCategory[] = [
    { id: "name", label: "Name", icon: <User className="h-4 w-4" /> },
    { id: "roleNumber", label: "Roll Number", icon: <Hand className="h-4 w-4" /> },
    { id: "class", label: "Class", icon: <Shapes className="h-4 w-4" /> },
    { id: "attendance", label: "Attendance", icon: <UserRoundCheck className="h-4 w-4" /> },
  ]
  const leaveCategories: SearchCategory[] = [
    { id: "employee", label: "Employee", icon: <UsersRound className="h-4 w-4" /> },
    { id: "type", label: "Leave Type", icon: <Type className="h-4 w-4" /> },
    { id: "status", label: "Status", icon: <ShieldCheck className="h-4 w-4" /> },
  ]
  const feeCategories: SearchCategory[] = [
    { id: "name", label: "Student Name", icon: <User className="h-4 w-4" /> },
    { id: "grno", label: "GR Number", icon: <GraduationCap className="h-4 w-4" /> },
  ]
  const mark_Attendance_Categories: SearchCategory[] = [
    { id: "name", label: "Name", icon: <User className="h-4 w-4" /> },
    { id: "roleNumber", label: "Roll Number", icon: <Hand className="h-4 w-4" /> },
  ]

  // Original state
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory | null>(null)
  const { activePage, setActivePage }: any = useContext(SearchContext)

  // State for search
  const [showResults, setShowResults] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Use RTK Query hooks for search
  const [searchStudents, { data: studentSearchResults = [], isLoading: isStudentLoading, error: studentSearchError }] =
    useLazySearchStudentsQuery()
  const [searchStaff, { data: staffSearchResults = [], isLoading: isStaffLoading, error: staffSearchError }] =
    useLazySearchStaffQuery()

  // Use debounce-throttle hook for search query
  const debouncedSearchQuery = useDebounceThrottle(searchQuery, 500, 300)

  // Check if we're on a student profile page and extract the ID
  const isStudentProfilePage = useMemo(() => {
    return location.pathname.match(/^\/d\/student\/\d+/)
  }, [location.pathname])

  const studentId = useMemo(() => {
    if (isStudentProfilePage) {
      const match = location.pathname.match(/^\/d\/student\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }, [location.pathname, isStudentProfilePage])

  // Check if we're on a staff profile page and extract the ID
  const isStaffProfilePage = useMemo(() => {
    return location.pathname.match(/^\/d\/staff\/\d+/)
  }, [location.pathname])

  const staffId = useMemo(() => {
    if (isStaffProfilePage) {
      const match = location.pathname.match(/^\/d\/staff\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }, [location.pathname, isStaffProfilePage])

  const isFeesProfilePage = useMemo(() => {
    return location.pathname.match(/^\/d\/fee\/\d+/)
  }, [location.pathname])

  const isFeeStudentDetailPage = useMemo(() => {
    return location.pathname.match(/^\/d\/fee\/student\/\d+/)
  }, [location.pathname])

  // Add support for /d/pay-fees and /d/pay-fees/:id
  const isPayFeesProfilePage = useMemo(() => {
    return location.pathname.match(/^\/d\/pay-fees(\/\d+)?$/)
  }, [location.pathname])

  const isPayFeesStudentDetailPage = useMemo(() => {
    return location.pathname.match(/^\/d\/pay-fees\/student\/\d+/)
  }, [location.pathname])

  // Original handlers
  const handleSearch = (category: SearchCategory) => {
    setSelectedCategory(category)
    const storageKey = getFilterStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(category));
  }

  const searchTrigger = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault()
      performSearch()
    } else if (event === "Enter") {
      performSearch()
    }
  }

  // Perform search based on selected category
  const performSearch = async () => {
    if (!searchQuery || !selectedCategory) return

    setHasSearched(true)

    try {
      // For student search
      if (activePage === "Search for Students" || isStudentProfilePage) {
        if (!currentAcademicSession?.id) return

        if (selectedCategory.id === "name") {
          searchStudents({
            academic_session_id: currentAcademicSession.id,
            name: searchQuery,
            detailed: false,
          })
        } else if (selectedCategory.id === "grno") {
          const grNo = Number.parseInt(searchQuery)
          if (!isNaN(grNo)) {
            searchStudents({
              academic_session_id: currentAcademicSession.id,
              gr_no: grNo,
              detailed: false,
            })
          }
        } else if (selectedCategory.id === "mobile") {
          searchStudents({
            academic_session_id: currentAcademicSession.id,
            primary_mobile: Number(searchQuery),
            detailed: false,
          })
        }
      } else if (activePage === "Search for Fee" || isFeesProfilePage) {
        if (selectedCategory.id === "name") {
          searchStudents({
            academic_session_id: currentAcademicSession!.id,
            name: searchQuery,
            detailed: false,
          })
        } else if (selectedCategory.id === "grno") {
          const grNo = Number.parseInt(searchQuery)
          if (!isNaN(grNo)) {
            searchStudents({
              academic_session_id: currentAcademicSession!.id,
              gr_no: grNo,
              detailed: false,
            })
          }
        }
      }
      // For staff search - passing academic_session_id
      else if (activePage === "Search for Staff" || isStaffProfilePage) {
        if (selectedCategory.id === "name") {
          searchStaff({
            name: searchQuery,
            academic_session_id: currentAcademicSession?.id,
          })
        } else if (selectedCategory.id === "employee_code") {
          searchStaff({
            employee_code: searchQuery,
            academic_session_id: currentAcademicSession?.id,
          })
        } else if (selectedCategory.id === "mobile") {
          searchStaff({
            mobile_number: Number(searchQuery),
            academic_session_id: currentAcademicSession?.id,
          })
        } else if (selectedCategory.id === "role") {
          searchStaff({
            staff_role_id: Number(searchQuery),
            academic_session_id: currentAcademicSession?.id,
          })
        }
      }
      // For other searches
      // else if (window.location.pathname === "/d/leaves") {
      //   console.log("from leaves", searchQuery, selectedCategory?.id)
      // } else if (window.location.pathname === "/d/fee") {
      //   console.log("from fee", searchQuery, selectedCategory?.id)
      // }
    } catch (err) {
      console.error("Search error:", err)
    }
  }

  // Handle student selection - navigate to student profile page
  const handleSelectStudent = (student_id: number) => {
    // Navigate to the student profile page with the student ID
    navigate(`/d/student/${student_id}`)
    // Clear search results and query
    setShowResults(false)
    setSearchQuery("")
    setHasSearched(false)
  }

  // Update handleSelectStudentForFees to support /d/pay-fees/:id?session_id=2 context
  const handleSelectStudentForFees = (student_id: number) => {
    if (isPayFeesProfilePage || isPayFeesStudentDetailPage) {
      // Preserve session_id if present in the current URL
      const params = new URLSearchParams(location.search)
      const sessionId = params.get("session_id") || currentAcademicSession?.id
      let url = `/d/pay-fees/${student_id}`
      if (sessionId) {
        url += `?session_id=${sessionId}`
      }
      navigate(url)
    } else {
      navigate(`/d/fee/student/${student_id}`)
    }
    setShowResults(false)
    setSearchQuery("")
    setHasSearched(false)
  }

  // Handle staff selection - navigate to staff profile page
  const handleSelectStaff = (staff: StaffType) => {
    // Navigate to the staff profile page with the staff ID
    navigate(`/d/staff/${staff.id}`)
    // Clear search results and query
    setShowResults(false)
    setSearchQuery("")
    setHasSearched(false)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setShowResults(false)
    setHasSearched(false)
  }

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchQuery && selectedCategory) {
      if (activePage === "Search for Students" && currentAcademicSession?.id) {
        performSearch()
      } else if (activePage === "Search for Staff") {
        performSearch()
      } else if (activePage === "Search for Fee") {
        performSearch()
      }
    }
  }, [debouncedSearchQuery, selectedCategory, currentAcademicSession, activePage])

  // Original effects
  const pageTitles: any = useMemo(
    () => ({
      "/d/students": "Search for Students",
      "/d/staff": "Search for Staff",
      "/d/leaves": "Search for Leave",
      "/d/fee": "Search for Fee",
      "/d/fee/student": "Search for Fee",
    }),
    [],
  )

  useEffect(() => {
    setSearchQuery("")
    // Only reset the selected category if not navigating to a profile page
    // or if we're coming from a non-profile page
    // (No longer clear selectedCategory)
    if (
      isStudentProfilePage
    ) {
      setActivePage("Search for Students")
    } else if (isStaffProfilePage) {
      setActivePage("Search for Staff")
    } else if (isFeesProfilePage || isFeeStudentDetailPage || isPayFeesProfilePage || isPayFeesStudentDetailPage) {
      setActivePage("Search for Fee")
    } else {
      setActivePage(pageTitles[location.pathname])
    }
    setHasSearched(false)
  }, [location.pathname, pageTitles, setActivePage, isStudentProfilePage, isStaffProfilePage, isFeesProfilePage, isFeeStudentDetailPage, isPayFeesProfilePage, isPayFeesStudentDetailPage])

  // Helper to get filter key for localStorage per context
  const getFilterStorageKey = () => {
    // Use activePage or fallback to pathname
    let key = activePage || location.pathname;
    // Normalize for pay-fees/fee context
    if (key.includes("pay-fees")) return "search_filter_pay_fees";
    if (key.includes("fee")) return "search_filter_fee";
    if (key.includes("students")) return "search_filter_students";
    if (key.includes("staff")) return "search_filter_staff";
    // if (key.includes("leaves")) return "search_filter_leaves";
    return `search_filter_${key}`;
  };

  // Helper to get categories for current context
  const getCategories = () => {
    if (activePage === "Search for Students" || isStudentProfilePage) return studentCategories;
    if (activePage === "Search for Staff" || isStaffProfilePage) return staffCategories;
    if (activePage === "Search for Fee" || isFeesProfilePage || isFeeStudentDetailPage || isPayFeesProfilePage || isPayFeesStudentDetailPage) return feeCategories;
    // if (activePage === "Search for Leave") return leaveCategories;
    return studentCategories;
  };

  // On context change, set filter from localStorage or default to first
  useEffect(() => {
    const categories = getCategories();
    const storageKey = getFilterStorageKey();
    const stored = localStorage.getItem(storageKey);
    let found = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        found = categories.find((c) => c.id === parsed.id);
      } catch {}
    }
    setSelectedCategory(found || categories[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, isStudentProfilePage, isStaffProfilePage, isFeesProfilePage, isFeeStudentDetailPage, isPayFeesProfilePage, isPayFeesStudentDetailPage]);

  // Prevent filter from being cleared on input clear/backspace
  const onChangeSearch = (value: string) => {
    setSearchQuery(value)
    if (value === "") {
      setShowResults(false)
      setHasSearched(false)
      // Do NOT clear selectedCategory
    } else {
      setShowResults(true)
    }
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {(
        activePage === "Search for Students" ||
        activePage === "Search for Staff" ||
        activePage === "Search for Fee" ||
        isStudentProfilePage ||
        isStaffProfilePage ||
        isFeeStudentDetailPage ||
        isPayFeesProfilePage ||
        isPayFeesStudentDetailPage
      ) ? (
        <div className="search-container">
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder={
                isStudentProfilePage
                  ? selectedCategory
                    ? `Search for other students by ${selectedCategory.label}`
                    : "Search for Students"
                  : isStaffProfilePage
                    ? selectedCategory
                      ? `Search for other staff by ${selectedCategory.label}`
                      : "Search for Staff"
                    : activePage
              }
              className="pl-[120px] pr-10"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              onKeyDown={(event) => searchTrigger(event)}
              onFocus={() => {
                if (
                  searchQuery &&
                  ((studentSearchResults.length > 0 &&
                    (activePage === "Search for Students" || isStudentProfilePage)) ||
                    (staffSearchResults.length > 0 && (activePage === "Search for Staff" || isStaffProfilePage)))
                ) {
                  setShowResults(true)
                }
              }}
            />

            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}

            <button
              onClick={() => {
                if (searchQuery !== "" && selectedCategory !== null) {
                  searchTrigger("Enter")
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-gray-500"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Category dropdowns for different pages */}
            {activePage === "Search for Students" || isStudentProfilePage ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md border bg-background px-2 py-1 text-sm font-medium">
                    {selectedCategory ? selectedCategory.label : "Search by"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {studentCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleSearch(category)}
                      className="flex items-center gap-2"
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : activePage === "Search for Fee" || isFeesProfilePage ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md border bg-background px-2 py-1 text-sm font-medium">
                    {selectedCategory ? selectedCategory.label : "Search by"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {feeCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleSearch(category)}
                      className="flex items-center gap-2"
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : activePage === "Search for Staff" || isStaffProfilePage ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md border bg-background px-2 py-1 text-sm font-medium">
                    {selectedCategory ? selectedCategory.label : "Search by"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {staffCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleSearch(category)}
                      className="flex items-center gap-2"
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : activePage === "Search for Fee" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute left-1 top-1/2 -translate-y-1/2 rounded-md border bg-background px-2 py-1 text-sm font-medium">
                    {selectedCategory ? selectedCategory.label : "Search by"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {feeCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleSearch(category)}
                      className="flex items-center gap-2"
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Show student search results */}
          {showResults && (activePage === "Search for Students" || isStudentProfilePage) && (
            <>
              {isStudentLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              ) : (
                <>
                  {studentSearchResults.length > 0 ? (
                    <StudentSearchResults
                      results={studentSearchResults}
                      isLoading={isStudentLoading}
                      error={studentSearchError}
                      onSelectStudent={handleSelectStudent}
                    />
                  ) : (
                    hasSearched && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        <div className="flex items-center justify-center p-4 border-b">
                          <SearchX className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No results found for "{searchQuery}" in {selectedCategory?.label}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}

          {showResults && (activePage === "Search for Fee" || isFeesProfilePage) && (
            <>
              {isStudentLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              ) : (
                <>
                  {studentSearchResults.length > 0 ? (
                    <StudentSearchResults
                      results={studentSearchResults}
                      isLoading={isStudentLoading}
                      error={studentSearchError}
                      onSelectStudent={handleSelectStudentForFees}
                    />
                  ) : (
                    hasSearched && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        <div className="flex items-center justify-center p-4 border-b">
                          <SearchX className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No results found for "{searchQuery}" in {selectedCategory?.label}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}

          {/* Show staff search results */}
          {showResults && (activePage === "Search for Staff" || isStaffProfilePage) && (
            <>
              {isStaffLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              ) : (
                <>
                  {staffSearchResults && staffSearchResults.length > 0 ? (
                    <StaffSearchResults
                      results={staffSearchResults}
                      isLoading={isStaffLoading}
                      error={staffSearchError}
                      onSelectStaff={handleSelectStaff}
                    />
                  ) : (
                    hasSearched &&
                    !isStaffLoading && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        <div className="flex items-center justify-center p-4 border-b">
                          <SearchX className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No results found for "{searchQuery}" in {selectedCategory?.label}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}

          {/* Show error message if any */}
          {(studentSearchError || staffSearchError) && (
            <div className="text-sm text-red-500 mt-1">Failed to search. Please try again.</div>
          )}

          {/* Show message if no active academic session for student search */}
          {(activePage === "Search for Students" || activePage === "") && !currentAcademicSession?.id && (
            <div className="text-sm text-amber-500 mt-1">
              No active academic session found. Please set an active academic session first.
            </div>
          )}
        </div>
      ) : (
        ""
      )}
    </div>
  )
}
