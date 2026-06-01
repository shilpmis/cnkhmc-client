import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react"

interface FilterOptionsProps {
  onFilterChange: (field: string, value: string) => void
}

export const FilterOptions: React.FC<FilterOptionsProps> = ({ onFilterChange }) => {
  const [field, setField] = React.useState<string>("name")
  const [value, setValue] = React.useState<string>("")

  const handleFieldChange = (newField: string) => {
    setField(newField)
    onFilterChange(newField, value)
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    onFilterChange(field, e.target.value)
  }

  return (
    <div className="flex items-center justify-end space-x-2 mb-4">
      <Filter className="h-5 w-5 text-gray-500" />
      <Select value={field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="mobile">Mobile</SelectItem>
          <SelectItem value="address">Address</SelectItem>
          <SelectItem value="designation">Designation</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
      <Input type="text" placeholder="Filter value" value={value} onChange={handleValueChange} className="w-[200px]" />
    </div>
  )
}

