"use client"

import type { Student } from "@/types/student"
import { useState, useEffect, useRef, useCallback } from "react"
import { useLazySearchStudentsQuery } from "@/services/StudentServices"

interface UseStudentSearchProps {
  academicSessionId: number
  debounceTime?: number
  throttleTime?: number
}

export function useStudentSearch({ academicSessionId, debounceTime = 300, throttleTime = 500 }: UseStudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSearchTime = useRef<number>(0)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use RTK Query hook
  const [triggerSearch, { isFetching: isSearching }] = useLazySearchStudentsQuery()

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Debounced and throttled search function
  const searchStudents = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setResults([])
        return
      }

      const now = Date.now()
      const timeSinceLastSearch = now - lastSearchTime.current

      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      // If we're within throttle time, set a timeout for the remaining time
      if (timeSinceLastSearch < throttleTime) {
        searchTimeoutRef.current = setTimeout(() => {
          performSearch(term)
        }, throttleTime - timeSinceLastSearch)
      } else {
        // Otherwise, set a debounce timeout
        searchTimeoutRef.current = setTimeout(() => {
          performSearch(term)
        }, debounceTime)
      }
    },
    [academicSessionId, debounceTime, throttleTime],
  )

  // Actual search implementation using RTK Query
  const performSearch = async (term: string) => {
    setIsLoading(true)
    setError(null)
    lastSearchTime.current = Date.now()

    try {
      const response = await triggerSearch({
        academic_session_id: academicSessionId,
        name: term,
        detailed: false,
      }).unwrap()

      setResults(response)
    } catch (err) {
      console.error("Search error:", err)
      setError("Failed to search students. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to fetch detailed student info
  const getStudentDetails = async (studentId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch detailed student information
      const detailedResponse = await triggerSearch({
        academic_session_id: academicSessionId,
        name: searchTerm,
        detailed: true,
      }).unwrap()

      const student = detailedResponse.find((s) => s.id === studentId)

      if (student) {
        setSelectedStudent(student)
      } else {
        // If not found in search results, you might want to fetch by ID directly
        setError("Student details not found")
      }
    } catch (err) {
      console.error("Error fetching student details:", err)
      setError("Failed to load student details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading: isLoading || isSearching,
    error,
    searchStudents,
    selectedStudent,
    getStudentDetails,
    setSelectedStudent,
  }
}

