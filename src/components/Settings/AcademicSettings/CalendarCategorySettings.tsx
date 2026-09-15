"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/redux/hooks/useTranslation"
import { Plus, Trash2, Pencil, Search, Tag, Check, Sparkles } from "lucide-react"

export interface CalendarCategory {
  id: string
  label: string
  colorClass: string
  dotColor: string
  isCustom?: boolean
}

export const COLOR_PALETTES = [
  { name: "Rose", colorClass: "bg-rose-500/10 text-rose-700 border-rose-500/20", dotColor: "bg-rose-500" },
  { name: "Amber", colorClass: "bg-amber-500/10 text-amber-700 border-amber-500/20", dotColor: "bg-amber-500" },
  { name: "Emerald", colorClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dotColor: "bg-emerald-500" },
  { name: "Indigo", colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20", dotColor: "bg-indigo-500" },
  { name: "Purple", colorClass: "bg-purple-500/10 text-purple-700 border-purple-500/20", dotColor: "bg-purple-500" },
  { name: "Teal", colorClass: "bg-teal-500/10 text-teal-700 border-teal-500/20", dotColor: "bg-teal-500" },
  { name: "Cyan", colorClass: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20", dotColor: "bg-cyan-500" },
  { name: "Pink", colorClass: "bg-pink-500/10 text-pink-700 border-pink-500/20", dotColor: "bg-pink-500" },
  { name: "Orange", colorClass: "bg-orange-500/10 text-orange-700 border-orange-500/20", dotColor: "bg-orange-500" },
  { name: "Blue", colorClass: "bg-blue-500/10 text-blue-700 border-blue-500/20", dotColor: "bg-blue-500" },
]

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { id: "holiday", label: "Holiday", colorClass: "bg-rose-500/10 text-rose-700 border-rose-500/20", dotColor: "bg-rose-500" },
  { id: "exam", label: "Exam", colorClass: "bg-amber-500/10 text-amber-700 border-amber-500/20", dotColor: "bg-amber-500" },
  { id: "meeting", label: "Meeting", colorClass: "bg-purple-500/10 text-purple-700 border-purple-500/20", dotColor: "bg-purple-500" },
  { id: "event", label: "General Event", colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20", dotColor: "bg-indigo-500" },
  { id: "activity", label: "Academic Activity", colorClass: "bg-teal-500/10 text-teal-700 border-teal-500/20", dotColor: "bg-teal-500" },
]

export const CATEGORIES_STORAGE_KEY = "saral.academicCalendar.customCategories"

export default function CalendarCategorySettings() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [categories, setCategories] = useState<CalendarCategory[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch (e) {
        console.error("Failed to load saved categories", e)
      }
    }
    return DEFAULT_CATEGORIES
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CalendarCategory | null>(null)
  const [formName, setFormName] = useState("")
  const [selectedColorIdx, setSelectedColorIdx] = useState(0)

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
    }
  }, [categories])

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories
    const q = searchQuery.toLowerCase()
    return categories.filter((c) => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
  }, [categories, searchQuery])

  const openAddDialog = () => {
    setEditingCategory(null)
    setFormName("")
    setSelectedColorIdx(categories.length % COLOR_PALETTES.length)
    setIsDialogOpen(true)
  }

  const openEditDialog = (cat: CalendarCategory) => {
    setEditingCategory(cat)
    setFormName(cat.label)
    const foundIdx = COLOR_PALETTES.findIndex((p) => p.colorClass === cat.colorClass)
    setSelectedColorIdx(foundIdx !== -1 ? foundIdx : 0)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim()) {
      toast({ title: "Validation Error", description: "Category name is required.", variant: "destructive" })
      return
    }

    const catId = formName.trim().toLowerCase().replace(/\s+/g, "_")
    const palette = COLOR_PALETTES[selectedColorIdx % COLOR_PALETTES.length]

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                label: formName.trim(),
                colorClass: palette.colorClass,
                dotColor: palette.dotColor,
              }
            : c
        )
      )
      toast({ title: "Category Updated", description: `"${formName.trim()}" has been updated.` })
    } else {
      if (categories.some((c) => c.id === catId)) {
        toast({ title: "Category Exists", description: "A category with this name already exists.", variant: "destructive" })
        return
      }

      const newCat: CalendarCategory = {
        id: catId,
        label: formName.trim(),
        colorClass: palette.colorClass,
        dotColor: palette.dotColor,
        isCustom: true,
      }

      setCategories((prev) => [...prev, newCat])
      toast({ title: "Category Created", description: `"${newCat.label}" has been added.` })
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId))
    toast({ title: "Category Deleted", description: "The custom category has been deleted." })
  }

  return (
    <div className="container mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              Calendar Categories Settings
            </CardTitle>
            <CardDescription>
              Manage dynamic event and holiday categories used across the institution Academic Calendar.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-white font-semibold">
            <Plus className="mr-2 h-4 w-4" /> Add New Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold uppercase text-slate-500">Total Categories</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{categories.length}</div>
            </div>
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
              <span className="text-xs font-bold uppercase text-blue-700">Custom Categories</span>
              <div className="text-2xl font-extrabold text-blue-900 mt-1">
                {categories.filter((c) => c.isCustom).length}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold uppercase text-slate-500">Default Built-in</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {categories.filter((c) => !c.isCustom).length}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Categories Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Identifier Key</TableHead>
                  <TableHead>Visual Tag Preview</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-bold text-slate-900 flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${cat.dotColor}`} />
                        {cat.label}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{cat.id}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-bold border ${cat.colorClass}`}>
                          {cat.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.isCustom ? "outline" : "secondary"} className="text-[11px] font-semibold">
                          {cat.isCustom ? "Custom" : "System Default"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(cat)}
                          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        {cat.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat.id)}
                            className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-xl p-6 max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              Define a calendar category and choose a vibrant color theme for badges.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">Category Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Clinical Posting, Seminar, Sports Day"
                className="h-10"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">Color Theme</Label>
              <div className="grid grid-cols-5 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {COLOR_PALETTES.map((palette, idx) => {
                  const isSelected = selectedColorIdx === idx
                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      className={`h-9 rounded-lg flex items-center justify-center transition-all ${
                        palette.dotColor
                      } ${isSelected ? "ring-2 ring-offset-2 ring-slate-900 scale-105 shadow-sm text-white" : "opacity-85 hover:opacity-100"}`}
                      title={palette.name}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white drop-shadow" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Live Preview:</span>
              <div className="pt-1">
                <span
                  className={`text-xs px-3 py-1 rounded-md font-bold border ${
                    COLOR_PALETTES[selectedColorIdx % COLOR_PALETTES.length].colorClass
                  }`}
                >
                  {formName.trim() || "Sample Category"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()} className="bg-primary text-white font-semibold">
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
