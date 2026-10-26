import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ReceiptText,
  GraduationCap,
  Building2,
  UtensilsCrossed,
  Award,
  Plus,
  LayoutTemplate,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from "lucide-react"
import FeeReceiptMakerDialog from "@/components/Fees/Reports/FeeReceiptMakerDialog"

export const FeeReceiptsPage: React.FC = () => {
  const [isReceiptMakerOpen, setIsReceiptMakerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("Tuition Fee")

  const openMakerWithCategory = (category: string) => {
    setSelectedCategory(category)
    setIsReceiptMakerOpen(true)
  }

  const receiptCategories = [
    {
      id: "tuition",
      title: "Tuition / Course Fee",
      feeType: "Tuition Fee",
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      btnColor: "bg-blue-600 hover:bg-blue-700",
      description: "Standard academic year tuition, course installments, and quota fees.",
      tags: ["Tuition", "Semester Fee", "Installment", "Govt Quota", "Management Quota"],
    },
    {
      id: "hostel",
      title: "Hostel Accommodation Fee",
      feeType: "Hostel Fee",
      icon: Building2,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      btnColor: "bg-amber-600 hover:bg-amber-700",
      description: "Hostel room rent, security deposit, maintenance, and electricity charges.",
      tags: ["Hostel Rent", "Room Deposit", "Maintenance Fee", "AC / Non-AC"],
    },
    {
      id: "mess",
      title: "Mess & Dining Charges",
      feeType: "Mess & Dining Fee",
      icon: UtensilsCrossed,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      btnColor: "bg-emerald-600 hover:bg-emerald-700",
      description: "Monthly mess dues, meal subscriptions, and canteen charges.",
      tags: ["Monthly Mess", "Food Subscription", "Canteen", "Annual Mess"],
    },
    {
      id: "certificate",
      title: "Certificate Issuance Fee",
      feeType: "Bonafide Certificate Fee",
      icon: Award,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      btnColor: "bg-purple-600 hover:bg-purple-700",
      description: "Fees for issuing Bonafide, Transfer (TC), Migration, or Attempt certificates.",
      tags: ["Bonafide", "Transfer Certificate", "Migration", "Transcript", "Attempt"],
    },
  ]

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <ReceiptText className="h-7 w-7 text-emerald-600" />
              Fee Receipts & Issuance
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Official Receipt Desk
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dedicated workspace to generate, issue, preview, and print official fee payment receipts for tuition, hostel, mess, and certificate services.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => openMakerWithCategory("Tuition Fee")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm text-xs sm:text-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Issue New Receipt
          </Button>
        </div>
      </div>

      {/* Main Issuance Desk Section */}
      <div className="space-y-6">
        {/* Quick Category Action Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Select Receipt Category to Issue</h2>
              <p className="text-xs text-slate-500">
                Pick a receipt type below to pre-populate relevant fields and standard formats.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {receiptCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <Card
                  key={cat.id}
                  className="border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg border ${cat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        Official
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-slate-800 mt-3">
                      {cat.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                      {cat.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {cat.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => openMakerWithCategory(cat.feeType)}
                      className={`w-full text-white text-xs font-semibold h-8 ${cat.btnColor}`}
                    >
                      Issue Receipt <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Overview & Fast Issuance Card */}
        <Card className="border border-slate-200/90 shadow-xs bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Accountant Quick Receipt Generator
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Search any enrolled student and launch a print-ready fee receipt in seconds with merge tags.
                </CardDescription>
              </div>
              <Button
                onClick={() => openMakerWithCategory("Tuition Fee")}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Search className="h-3.5 w-3.5" /> Launch Receipt Maker
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  Automatic Merge Tags
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Student name, GR number, enrollment number, class, amount in words, and college headers are filled in automatically.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <ReceiptText className="h-4 w-4 text-emerald-600" />
                  A4 Portrait Print Format
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Designed for official institute letterheads and thermal/laser printers with cashier and principal signatures.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <LayoutTemplate className="h-4 w-4 text-purple-600" />
                  Multi-Template Flexibility
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Select configured receipt formats (configured under Settings) on the fly before printing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accountant Fee Receipt Maker Dialog */}
      <FeeReceiptMakerDialog
        isOpen={isReceiptMakerOpen}
        onClose={() => setIsReceiptMakerOpen(false)}
        initialFeeType={selectedCategory}
      />
    </div>
  )
}

export default FeeReceiptsPage
