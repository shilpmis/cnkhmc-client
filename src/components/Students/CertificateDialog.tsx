import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Download } from "lucide-react"
import { useGenerateCertificateMutation } from "@/services/CertificateTemplateService"
import { useAppSelector } from "@/redux/hooks/useAppSelector"
import { useToast } from "@/hooks/use-toast"

interface CertificateDialogProps {
  studentId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CertificateDialog({ studentId, open, onOpenChange }: CertificateDialogProps) {
  const [purpose, setPurpose] = useState<string>("")
  const [examPassed, setExamPassed] = useState<string>("")
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  
  const [generateCertificate, { isLoading: isGenerating }] = useGenerateCertificateMutation()
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!studentId) return

    try {
      const response = await generateCertificate({ id: 0, student_id: studentId, purpose, exam_passed: examPassed }).unwrap()
      if (response.success) {
        let finalContent = response.data.content;
        const logoUrl = window.location.origin + '/college-logo.jpeg';
        finalContent = finalContent.replace(
          /<img[^>]*onerror="this\.style\.display='none'"[^>]*>/,
          `<img src="${logoUrl}" alt="Logo" style="width: 100px; height: 100px; object-fit: contain;" />`
        );
        setGeneratedContent(finalContent)
      } else {
        toast({ title: "Error", description: "Failed to generate certificate", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  const handlePrint = () => {
    if (!generatedContent) return
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              @media print {
                @page { margin: 0; }
                body { padding: 2cm; }
              }
            </style>
          </head>
          <body>
            ${generatedContent}
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) {
        setPurpose("")
        setExamPassed("")
        setGeneratedContent(null)
      }
    }}>
      <DialogContent className="sm:max-w-[1000px] max-w-[95vw] w-full max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Certificate</DialogTitle>
        </DialogHeader>
        <div className="py-2 flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          {/* Inputs Section */}
          <div className="w-full md:w-[300px] flex flex-col space-y-4 shrink-0">
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Passed</label>
              <Input 
                placeholder="E.g. 1st yr BHMS Aug.2024" 
                value={examPassed} 
                onChange={(e) => setExamPassed(e.target.value)} 
                disabled={isGenerating} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose / Remarks</label>
              <Input 
                placeholder="E.g. For Scholarship Purpose" 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)} 
                disabled={isGenerating} 
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Preview
              </Button>
            </div>
          </div>
          
          {/* Preview Section */}
          <div className="w-full flex-1 border rounded bg-white overflow-auto relative">
            {generatedContent ? (
              <div className="p-4 min-w-[700px]">
                <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center absolute inset-0">
                Enter details and click "Generate Preview" to see the certificate here.
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={handlePrint} disabled={!generatedContent}>
            <Download className="mr-2 h-4 w-4" />
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
