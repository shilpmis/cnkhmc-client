import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2, Calendar, Clock, FileText, ClipboardList } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"
import DailyDiaryService, { ManualDiaryEntryInput } from "@/services/DailyDiaryService"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface LogManualWorkDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  staffId?: number
}

const getTodayDateStr = () => {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function LogManualWorkDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  staffId,
}: LogManualWorkDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [entries, setEntries] = useState<ManualDiaryEntryInput[]>([
    { date: getTodayDateStr(), time: "", description: "" },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddRow = () => {
    setEntries((prev) => [
      ...prev,
      { date: getTodayDateStr(), time: "", description: "" },
    ])
  }

  const handleRemoveRow = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleChange = (
    index: number,
    field: keyof ManualDiaryEntryInput,
    value: string
  ) => {
    setEntries((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate entries
    const invalidIndex = entries.findIndex(
      (entry) => !entry.date || !entry.time.trim() || !entry.description.trim()
    )

    if (invalidIndex !== -1) {
      toast({
        variant: "destructive",
        title: t("validation_error") || "Validation Error",
        description: `Please fill in Date, Time, and Description for entry #${invalidIndex + 1}.`,
      })
      return
    }

    try {
      setIsSubmitting(true)
      await DailyDiaryService.logManualEntries(entries, staffId)

      toast({
        title: t("success") || "Success",
        description: `${entries.length} non-calendar work log(s) saved successfully.`,
      })

      // Reset form and close dialog
      setEntries([{ date: getTodayDateStr(), time: "", description: "" }])
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error submitting manual work logs:", error)
      toast({
        variant: "destructive",
        title: t("error") || "Error",
        description:
          error?.response?.data?.message ||
          "Failed to save manual work entries.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shadow-sm">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-gray-900">
                Log Non-Calendar Work (Manual Entry)
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium mt-0.5">
                Record details of duties, meetings, or work done that was not scheduled on the official timetable.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-4 space-y-4">
          <div className="overflow-y-auto pr-1 space-y-4 max-h-[55vh]">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-colors relative space-y-3 group shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    Manual Entry #{index + 1}
                  </span>

                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg"
                      onClick={() => handleRemoveRow(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={entry.date}
                      onChange={(e) =>
                        handleChange(index, "date", e.target.value)
                      }
                      className="h-10 border-gray-200 focus:ring-amber-500 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      Time / Duration <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. 10:00 AM - 11:30 AM (or 1.5 Hours)"
                      value={entry.time}
                      onChange={(e) =>
                        handleChange(index, "time", e.target.value)
                      }
                      className="h-10 border-gray-200 focus:ring-amber-500 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    Description of Work Done <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Describe the non-calendar work completed (e.g., Department HOD meeting, lab maintenance, student counseling...)"
                    value={entry.description}
                    onChange={(e) =>
                      handleChange(index, "description", e.target.value)
                    }
                    className="border-gray-200 focus:ring-amber-500 rounded-lg text-xs resize-none"
                    required
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="w-full border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 text-amber-800 font-bold gap-2 py-3 rounded-xl transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Another Entry
            </Button>
          </div>

          <DialogFooter className="border-t pt-4 flex flex-row items-center justify-between sm:justify-between gap-3">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
              Total Entries: {entries.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 rounded-xl shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4" />
                )}
                Save Work Logs ({entries.length})
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
