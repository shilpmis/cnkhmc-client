
// "use client"

import { cn } from "@/lib/utils"
import React from "react"

// import type React from "react"
// import { Input } from "@/components/ui/input"

// // Define InputProps locally if not exported from "@/components/ui/input"
// interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// interface NumberInputProps extends Omit<InputProps, "onChange" | "value"> {
//   value?: string | undefined
//   onChange?: (value: string | undefined) => void
//   decimal?: boolean // Add decimal prop
//   decimalPlaces?: number // Number of decimal places to maintain
// }

// const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, decimal = false, decimalPlaces = 2, ...props }) => {
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const inputValue = e.target.value

//     // Allow empty input
//     if (inputValue === "") {
//       onChange?.("")
//       return
//     }

//     // Handle decimal point input
//     if (decimal && inputValue === ".") {
//       onChange?.("0.")
//       return
//     }

//     // For non-decimal mode, only allow digits
//     if (!decimal) {
//       if (/^\d*$/.test(inputValue)) {
//         onChange?.(inputValue)
//       }
//       return
//     }

//     // For decimal mode, enforce decimal place limit
//     if (inputValue.includes(".")) {
//       const [whole, fraction] = inputValue.split(".")

//       // Check if the whole part is valid
//       if (!/^\d*$/.test(whole)) return

//       // Check if the fraction part is valid and doesn't exceed the decimal place limit
//       if (!/^\d*$/.test(fraction) || fraction.length > decimalPlaces) return

//       onChange?.(inputValue)
//     } else {
//       // No decimal point yet, just validate it's a number
//       if (/^\d*$/.test(inputValue)) {
//         onChange?.(inputValue)
//       }
//     }
//   }

//   return (
//     <Input
//       type="text"
//       inputMode={decimal ? "decimal" : "numeric"}
//       pattern={decimal ? `[0-9]*[.,]?[0-9]{0,${decimalPlaces}}` : "[0-9]*"}
//       value={value || ""}
//       onChange={handleChange}
//       {...props}
//     />
//   )
// }

// export default NumberInput

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

interface NumberInputProps extends Omit<InputProps, "onChange" | "value"> {
  value?: string | number | null | undefined
  onChange?: (value: string | undefined) => void
  decimal?: boolean
  decimalPlaces?: number
  allowEmpty?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, decimal = false, decimalPlaces = 2, allowEmpty = true, ...props }, ref) => {
    
    console.log("NumberInput rendered with value:", typeof value ,  )
    
    // Convert value to string for display
    const displayValue = React.useMemo(() => {
      if (value === null || value === undefined) return ""
      return String(value)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow completely empty input if allowEmpty is true
      if (inputValue === "") {
        onChange?.(allowEmpty ? undefined : "")
        return
      }

      // Handle decimal point input
      if (decimal && inputValue === ".") {
        onChange?.("0.")
        return
      }

      // For non-decimal mode, only allow digits
      if (!decimal) {
        if (/^\d*$/.test(inputValue)) {
          onChange?.(inputValue)
        }
        return
      }

      // For decimal mode, enforce decimal place limit
      if (inputValue.includes(".")) {
        const [whole, fraction] = inputValue.split(".")

        // Check if the whole part is valid (allow empty whole part for cases like ".5")
        if (whole !== "" && !/^\d*$/.test(whole)) return

        // Check if the fraction part is valid and doesn't exceed the decimal place limit
        if (!/^\d*$/.test(fraction) || fraction.length > decimalPlaces) return

        onChange?.(inputValue)
      } else {
        // No decimal point yet, just validate it's a number
        if (/^\d*$/.test(inputValue)) {
          onChange?.(inputValue)
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, home, end, left, right
      if (
        [8, 9, 27, 13, 35, 36, 37, 39, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        (e.keyCode === 90 && e.ctrlKey === true)
      ) {
        return
      }

      // For decimal inputs, allow decimal point
      if (decimal && (e.keyCode === 190 || e.keyCode === 110)) {
        // Only allow one decimal point
        if (displayValue.includes(".")) {
          e.preventDefault()
        }
        return
      }

      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault()
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        pattern={decimal ? `[0-9]*[.,]?[0-9]{0,${decimalPlaces}}` : "[0-9]*"}
        value={isNaN(Number(displayValue)) ? undefined :  displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    )
  },
)

NumberInput.displayName = "NumberInput"

export { NumberInput }