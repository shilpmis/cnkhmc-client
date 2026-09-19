import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"
import { useGetExamSchedulesQuery, useCreateExamScheduleMutation, useUpdateExamScheduleMutation, useDeleteExamScheduleMutation, useGetExamMastersQuery, ExamSchedule } from "@/services/ExamService"
import { useGetAcademicClassesQuery } from "@/services/AcademicService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { selectActiveAccademicSessionsForSchool } from "@/redux/slices/authSlice"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function ExamSchedules() {
  const schoolId = useAppSelector((state) => state.auth.user?.school_id)
  const currentAcademicSession = useAppSelector(selectActiveAccademicSessionsForSchool)
  
  // Queries
  const { data: schedulesRes, isLoading } = useGetExamSchedulesQuery({ school_id: schoolId! }, { skip: !schoolId })
  const { data: mastersRes } = useGetExamMastersQuery({ school_id: schoolId! }, { skip: !schoolId })
  const { data: classesRes } = useGetAcademicClassesQuery(schoolId!, { skip: !schoolId })
  
  // Mutations
  const [createExamSchedule] = useCreateExamScheduleMutation()
  const [updateExamSchedule] = useUpdateExamScheduleMutation()
  const [deleteExamSchedule] = useDeleteExamScheduleMutation()

  // State
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ 
    exam_master_id: "", 
    class_id: "", 
    division_id: "0", // Defaulting to 0 for all divisions if not specifying
    start_date: "", 
    end_date: "",
    status: "PLANNED"
  })

  const schedules = schedulesRes?.data || []
  const examMasters = mastersRes?.data || []
  const classes = classesRes || []

  const handleOpen = (schedule?: ExamSchedule) => {
    if (schedule) {
      setEditId(schedule.id)
      setFormData({ 
        exam_master_id: (schedule as any).exam_master_id?.toString() || (schedule as any).examMasterId?.toString() || "",
        class_id: (schedule as any).class_id?.toString() || (schedule as any).classId?.toString() || "",
        division_id: (schedule as any).division_id?.toString() || (schedule as any).divisionId?.toString() || "0",
        start_date: ((schedule as any).start_date || (schedule as any).startDate || "").split('T')[0],
        end_date: ((schedule as any).end_date || (schedule as any).endDate || "").split('T')[0],
        status: schedule.status
      })
    } else {
      setEditId(null)
      setFormData({ 
        exam_master_id: "", 
        class_id: "", 
        division_id: "0", 
        start_date: "", 
        end_date: "",
        status: "PLANNED"
      })
    }
    setIsOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      ...formData,
      school_id: schoolId!,
      academic_session_id: currentAcademicSession?.id,
      exam_master_id: parseInt(formData.exam_master_id),
      class_id: parseInt(formData.class_id),
      division_id: parseInt(formData.division_id),
    }

    if (editId) {
      await updateExamSchedule({ id: editId, ...payload })
    } else {
      await createExamSchedule(payload)
    }
    setIsOpen(false)
  }

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id)
  }

  const confirmDeleteSchedule = async () => {
    if (!deleteConfirmId) return
    await deleteExamSchedule({ id: deleteConfirmId })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Exam Schedules</h1>
        <Button onClick={() => handleOpen()}>Schedule Exam</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Exam Type</th>
                <th className="p-3">Class</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s: any) => {
                const examMasterId = s.exam_master_id || s.examMasterId;
                const classId = s.class_id || s.classId;
                const startDate = s.start_date || s.startDate;
                const endDate = s.end_date || s.endDate;

                const examType = examMasters.find(m => m.id === examMasterId)?.name || examMasterId
                const className = classes.find(c => c.id === classId)?.class || classId
                
                return (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{examType}</td>
                    <td className="p-3">{className}</td>
                    <td className="p-3">{startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3">{endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' : s.status === 'ONGOING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpen(s)} title="Edit"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" className="text-red-500" size="sm" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Schedule" : "New Exam Schedule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Type</label>
              <Select value={formData.exam_master_id} onValueChange={(val) => setFormData({...formData, exam_master_id: val})}>
                <SelectTrigger><SelectValue placeholder="Select Exam Type" /></SelectTrigger>
                <SelectContent>
                  {examMasters.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={formData.class_id} onValueChange={(val) => setFormData({...formData, class_id: val})}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.class}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
        title="Delete Exam Schedule"
        description="Are you sure you want to delete this exam schedule?"
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteSchedule}
      />
    </div>
  )
}
