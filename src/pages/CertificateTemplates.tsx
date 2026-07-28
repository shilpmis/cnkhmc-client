import { useState } from "react"
import { useGetCertificateTemplatesQuery, useCreateCertificateTemplateMutation, useUpdateCertificateTemplateMutation, useDeleteCertificateTemplateMutation, CertificateTemplate } from "@/services/CertificateTemplateService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { Trash2, Edit } from "lucide-react"

export default function CertificateTemplates() {
  const schoolId = useAppSelector((state) => state.auth.user?.school_id)
  const { data: response, isLoading } = useGetCertificateTemplatesQuery({ school_id: schoolId! }, { skip: !schoolId })
  const [createTemplate] = useCreateCertificateTemplateMutation()
  const [updateTemplate] = useUpdateCertificateTemplateMutation()
  const [deleteTemplate] = useDeleteCertificateTemplateMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: "", type: "BONAFIDE", content: "" })

  const templates = response?.data || []

  const handleOpen = (template?: CertificateTemplate) => {
    if (template) {
      setEditId(template.id)
      setFormData({ name: template.name, type: template.type, content: template.content })
    } else {
      setEditId(null)
      setFormData({ name: "", type: "BONAFIDE", content: "<h1>{{college_name}}</h1>\n<p>This is to certify that {{student_name}}...</p>" })
    }
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (editId) {
      await updateTemplate({ id: editId, ...formData })
    } else {
      await createTemplate({ ...formData, schoolId: schoolId! })
    }
    setIsOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate({ id })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Certificate Templates</h1>
        <Button onClick={() => handleOpen()}>Add Template</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map(t => (
            <div key={t.id} className="border p-4 rounded bg-white flex justify-between">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.type}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleOpen(t)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Bonafide Certificate" />
            </div>
            <div className="space-y-2">
              <label>Type</label>
              <Input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="e.g. BONAFIDE" />
            </div>
            <div className="space-y-2">
              <label>Content (HTML format)</label>
              <Textarea 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                className="font-mono text-sm h-64"
                placeholder="Use {{student_name}}, {{college_name}}, {{gr_no}}, {{certificate_number}}"
              />
              <p className="text-xs text-gray-500">Available placeholders: {'{{student_name}}, {{father_name}}, {{mother_name}}, {{gr_no}}, {{admission_number}}, {{college_name}}, {{certificate_number}}'}</p>
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
