"use client"

import React, { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Printer, Download, Settings2 } from "lucide-react"
import type { StaffType, StaffExperience } from "@/types/staff"

interface ExperienceCertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffType | null
}

export default function ExperienceCertificateModal({ open, onOpenChange, staff }: ExperienceCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const [refNumber, setRefNumber] = useState<string>("8206")
  const [certDate, setCertDate] = useState<string>("")
  const [prefix, setPrefix] = useState<string>("Dr.")
  const [pronounStyle, setPronounStyle] = useState<"generic" | "gender">("generic")
  const [includeLetterhead, setIncludeLetterhead] = useState<boolean>(false)
  const [showConfig, setShowConfig] = useState<boolean>(false)

  useEffect(() => {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, "0")
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const yyyy = today.getFullYear()
    setCertDate(`${dd}/${mm}/${yyyy}`)
    if (staff) {
      setRefNumber(String(staff.id || "8206"))
      // Determine prefix based on role / degree
      const isDr =
        staff.staff_type === "teaching" ||
        staff.staff_category === "Teaching" ||
        (staff.ug_degree && staff.ug_degree.toLowerCase().includes("b")) ||
        (staff.qualification && staff.qualification.toLowerCase().includes("h.m.s"))
      setPrefix(isDr ? "Dr." : staff.gender === "Female" ? "Mrs." : "Mr.")
    }
  }, [staff, open])

  if (!staff) return null

  const experiences: StaffExperience[] = (staff as any).experiences || staff.staff_experiences || []

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "Till date"
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const fullName = `${staff.first_name || ""} ${staff.middle_name ? staff.middle_name + " " : ""}${staff.last_name || ""}`.trim()
  const currentYear = new Date().getFullYear()

  // Pronouns
  const himHer = pronounStyle === "generic" ? "him/her" : staff.gender === "Female" ? "her" : "him"
  const heShe = pronounStyle === "generic" ? "He / She" : staff.gender === "Female" ? "She" : "He"

  // Rows for table
  const tableRows =
    experiences.length > 0
      ? experiences.map((exp) => ({
          post: exp.post_name || staff.role || staff.designation || "Assistant Professor",
          from: formatDate(exp.from_date),
          to: exp.to_date ? formatDate(exp.to_date) : "Till date",
          department: exp.department || staff.department || staff.subject_specialization || "-",
        }))
      : [
          {
            post: staff.role || staff.designation || "Assistant Professor",
            from: staff.joining_date ? formatDate(staff.joining_date) : "01/01/" + currentYear,
            to: staff.resignation_date ? formatDate(staff.resignation_date) : "Till date",
            department: staff.department || staff.subject_specialization || "Homoeopathy",
          },
        ]

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Experience Certificate - ${fullName}</title>
          <style>
            @media print {
              @page { 
                size: A4 portrait; 
                margin: ${includeLetterhead ? "20mm 20mm 20mm 20mm" : "40mm 20mm 20mm 20mm"}; 
              }
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
            }
            body {
              font-family: "Times New Roman", Times, serif;
              color: #000;
              line-height: 1.5;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              font-size: 15px;
            }
            .letterhead-header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 30px;
            }
            .letterhead-header h1 {
              font-size: 19px;
              font-weight: bold;
              color: #1e3a8a;
              margin: 0 0 4px 0;
              text-transform: uppercase;
            }
            .letterhead-header h2 {
              font-size: 13px;
              font-weight: normal;
              margin: 0 0 4px 0;
              color: #333;
            }
            .letterhead-header p {
              font-size: 11px;
              margin: 0;
              color: #555;
            }
            .ref-date-row {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: normal;
              margin-bottom: 40px;
            }
            .cert-title {
              text-align: center;
              margin: 30px 0 35px 0;
            }
            .cert-title h2 {
              font-size: 16px;
              font-weight: bold;
              text-decoration: underline;
              letter-spacing: 0.5px;
              color: #000;
              text-transform: uppercase;
              margin: 0;
              display: inline-block;
            }
            .body-para {
              font-size: 15px;
              text-align: justify;
              margin-bottom: 24px;
              line-height: 1.8;
              text-indent: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 28px 0;
              font-size: 14px;
            }
            table th, table td {
              border: 1px solid #000;
              padding: 6px 10px;
              text-align: center;
            }
            table th {
              font-weight: bold;
            }
            .footer-signature {
              margin-top: 100px;
              display: flex;
              justify-content: flex-end;
              text-align: center;
            }
            .signature-block {
              display: inline-block;
              text-align: center;
              min-width: 220px;
            }
            .signature-block .role {
              font-weight: bold;
              font-size: 15px;
              margin: 0;
            }
            .signature-block .inst {
              font-size: 13px;
              margin: 2px 0 0 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadWord = () => {
    const tableRowsHtml = tableRows
      .map(
        (r) => `
        <tr>
          <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.post}</td>
          <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.from}</td>
          <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.to}</td>
          <td style="border: 1px solid #000; padding: 6px 10px; text-align: center;">${r.department}</td>
        </tr>`
      )
      .join("")

    const headerHtml = includeLetterhead
      ? `
        <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 25px;">
          <h1 style="font-size: 18pt; font-weight: bold; color: #1e3a8a; margin: 0 0 4px 0;">C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE & RESEARCH CENTRE</h1>
          <h2 style="font-size: 11pt; font-weight: normal; margin: 0 0 4px 0; color: #333;">(Managed by: Vyara Pradesh Seva Samiti)</h2>
          <p style="font-size: 9.5pt; margin: 0; color: #555;">Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117</p>
        </div>`
      : `<div style="height: 40pt;"></div>`

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Experience Certificate - ${fullName}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 595.3pt 841.9pt;
              margin: 72pt 72pt 72pt 72pt;
              mso-header-margin: 36pt;
              mso-footer-margin: 36pt;
              mso-paper-source: 0;
            }
            div.Section1 { page: Section1; }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #000000;
            }
            p { margin: 0; margin-bottom: 12pt; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18pt;
              margin-bottom: 18pt;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            ${headerHtml}
            
            <table style="width: 100%; border: none; margin-bottom: 24pt;">
              <tr>
                <td style="border: none; text-align: left; font-size: 12pt;">Ref. No. ${refNumber}/C.N.K.H.M.C.&amp;R.C./Vyara/${currentYear}</td>
                <td style="border: none; text-align: right; font-size: 12pt;">Date: ${certDate}</td>
              </tr>
            </table>

            <p style="text-align: center; margin-top: 24pt; margin-bottom: 24pt;">
              <span style="font-size: 13pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">EXPERIENCE CERTIFICATE</span>
            </p>

            <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-bottom: 18pt;">
              This is to certify that ${prefix ? prefix + " " : ""}${fullName} is an employee of this Organization and duties performed by ${himHer} during the period(s) are as under:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 14pt; margin-bottom: 18pt;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Name of post held</th>
                  <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">From dd/mm/yy</th>
                  <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">To dd/mm/yy</th>
                  <th style="border: 1px solid #000; padding: 6px 10px; text-align: center; font-weight: bold;">Department</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>

            <p style="text-align: justify; font-size: 12pt; line-height: 1.8; margin-top: 18pt; margin-bottom: 60pt;">
              ${heShe} is found to be sincere and honest. ${heShe} bears a good moral character and has good public behavior.
            </p>

            <table style="width: 100%; border: none; margin-top: 50pt;">
              <tr>
                <td style="border: none; width: 60%;"></td>
                <td style="border: none; width: 40%; text-align: center;">
                  <p style="font-size: 12pt; font-weight: bold; margin: 0;">Principal</p>
                  <p style="font-size: 11pt; margin: 2pt 0 0 0;">C. N. K. H. M. C. &amp; R. C., Vyara</p>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `

    const blob = new Blob([docContent], { type: "application/msword;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Experience_Certificate_${fullName.replace(/\s+/g, "_")}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <DialogTitle className="text-xl font-bold">Experience Certificate</DialogTitle>
          <div className="flex items-center gap-2 mr-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="gap-1 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {showConfig ? "Hide Options" : "Customize"}
            </Button>
            <Button onClick={handleDownloadWord} size="sm" variant="outline" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Download Word (.doc)
            </Button>
            <Button onClick={handlePrint} size="sm" className="gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Customization Drawer / Controls */}
        {showConfig && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <Label className="text-xs mb-1 block">Ref Number</Label>
              <Input
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. 8206"
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Certificate Date</Label>
              <Input
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Name Prefix</Label>
              <Select value={prefix} onValueChange={setPrefix}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr.">Dr.</SelectItem>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Pronouns</Label>
              <Select value={pronounStyle} onValueChange={(v: "generic" | "gender") => setPronounStyle(v)}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generic (He / She, him/her)</SelectItem>
                  <SelectItem value="gender">Gender-specific ({staff.gender === "Female" ? "She, her" : "He, him"})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Switch
                  id="letterhead-toggle"
                  checked={includeLetterhead}
                  onCheckedChange={setIncludeLetterhead}
                />
                <Label htmlFor="letterhead-toggle" className="text-xs cursor-pointer font-normal">
                  Include College Letterhead Header (Turn OFF if printing directly onto pre-printed stationary)
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Preview matching 5 Experience.docx */}
        <div className="p-6 bg-gray-100 rounded-lg overflow-x-auto flex justify-center">
          <div
            ref={printRef}
            className="bg-white p-12 shadow-md rounded border border-gray-300 w-full max-w-[780px]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Optional College Letterhead */}
            {includeLetterhead && (
              <div className="letterhead-header text-center border-b-2 border-blue-900 pb-3 mb-8">
                <h1 className="text-lg font-bold text-blue-900 tracking-wide uppercase">
                  C. N. KOTHARI HOMOEOPATHIC MEDICAL COLLEGE & RESEARCH CENTRE
                </h1>
                <h2 className="text-xs font-medium text-gray-700">
                  (Managed by: Vyara Pradesh Seva Samiti)
                </h2>
                <p className="text-[11px] text-gray-500">
                  Kakrapar Road, Vyara, Dist: Tapi, Gujarat - 394650 | Phone: 02626-220117
                </p>
              </div>
            )}

            {!includeLetterhead && <div className="h-10"></div>}

            {/* Reference & Date Line */}
            <div className="ref-date-row flex justify-between text-sm text-black mb-8">
              <span>
                Ref. No. {refNumber}/C.N.K.H.M.C.&amp;R.C./Vyara/{currentYear}
              </span>
              <span>Date: {certDate}</span>
            </div>

            {/* Title */}
            <div className="cert-title text-center my-8">
              <h2 className="text-base font-bold underline tracking-wide text-black uppercase inline-block">
                EXPERIENCE CERTIFICATE
              </h2>
            </div>

            {/* Paragraph 1 */}
            <div className="body-para text-sm text-black leading-relaxed text-justify mb-6">
              This is to certify that <strong>{prefix ? prefix + " " : ""}{fullName}</strong> is an employee of this Organization and duties performed by {himHer} during the period(s) are as under:
            </div>

            {/* Experience Table */}
            <table className="w-full text-sm border-collapse border border-black my-6 text-black">
              <thead>
                <tr className="bg-gray-50 font-bold">
                  <th className="border border-black px-3 py-2 text-center">Name of post held</th>
                  <th className="border border-black px-3 py-2 text-center">From dd/mm/yy</th>
                  <th className="border border-black px-3 py-2 text-center">To dd/mm/yy</th>
                  <th className="border border-black px-3 py-2 text-center">Department</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-black px-3 py-2 text-center">{row.post}</td>
                    <td className="border border-black px-3 py-2 text-center">{row.from}</td>
                    <td className="border border-black px-3 py-2 text-center">{row.to}</td>
                    <td className="border border-black px-3 py-2 text-center">{row.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paragraph 2 */}
            <div className="body-para text-sm text-black leading-relaxed text-justify mt-6 mb-16">
              {heShe} is found to be sincere and honest. {heShe} bears a good moral character and has good public behavior.
            </div>

            {/* Footer Signatures */}
            <div className="footer-signature flex justify-end text-center mt-20 pt-8">
              <div className="signature-block inline-block text-center min-w-[200px]">
                <p className="role font-bold text-sm text-black">Principal</p>
                <p className="inst text-xs text-black">C. N. K. H. M. C. &amp; R. C., Vyara</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

