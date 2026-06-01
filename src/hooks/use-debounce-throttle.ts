"use client"

import { useState, useEffect, useRef } from "react"

export function useDebounceThrottle<T>(value: T, debounceDelay = 500, throttleDelay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const now = Date.now()
    const timeSinceLastExecution = now - lastExecuted.current

    // If we're within throttle time, set a timeout for the remaining time
    if (timeSinceLastExecution < throttleDelay) {
      timeoutRef.current = setTimeout(
        () => {
          setDebouncedValue(value)
          lastExecuted.current = Date.now()
        },
        Math.max(throttleDelay - timeSinceLastExecution, debounceDelay),
      )
    } else {
      // Otherwise, set a normal debounce timeout
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value)
        lastExecuted.current = Date.now()
      }, debounceDelay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, debounceDelay, throttleDelay])

  return debouncedValue
}

