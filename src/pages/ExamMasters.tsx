import { useState } from "react"
import { useGetExamMastersQuery, useCreateExamMasterMutation, useUpdateExamMasterMutation, useDeleteExamMasterMutation, ExamMaster } from "@/services/ExamService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { Trash2, Edit } from "lucide-react"

export default function ExamMasters() {
  const schoolId = useAppSelector((state) => state.auth.user?.school_id)
  const { data: response, isLoading } = useGetExamMastersQuery({ school_id: schoolId! }, { skip: !schoolId })
  const [createExamMaster] = useCreateExamMasterMutation()
  const [updateExamMaster] = useUpdateExamMasterMutation()
  const [deleteExamMaster] = useDeleteExamMasterMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })

  const exams = response?.data || []

  const handleOpen = (exam?: ExamMaster) => {
    if (exam) {
      setEditId(exam.id)
      setFormData({ name: exam.name, description: exam.description || "" })
    } else {
      setEditId(null)
      setFormData({ name: "", description: "" })
    }
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateExamMaster({ id: editId, ...formData })
    } else {
      await createExamMaster({ ...formData, school_id: schoolId! })
    }
    setIsOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this exam type?")) {
      await deleteExamMaster({ id })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Exam Types</h1>
        <Button onClick={() => handleOpen()}>Add Exam Type</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {exams.map(e => (
            <div key={e.id} className="border p-4 rounded bg-white flex justify-between">
              <div>
                <h3 className="font-semibold">{e.name}</h3>
                <p className="text-sm text-gray-500">{e.description}</p>
              </div>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpen(e)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" className="text-red-500" size="sm" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Exam Type" : "New Exam Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mid-Term Exams" />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
