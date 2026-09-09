import React, { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Loader2, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  useFetchPracticalBatchSettingsQuery,
  useUpdatePracticalBatchSettingsMutation,
} from '@/services/StudentServices'

export default function PracticalBatchSettings() {
  const { data: settings, isLoading } = useFetchPracticalBatchSettingsQuery()
  const [updateSettings, { isLoading: isSaving }] = useUpdatePracticalBatchSettingsMutation()

  const [batches, setBatches] = useState<string[]>([])
  const [newBatchName, setNewBatchName] = useState('')

  // Sync local state when server data arrives
  useEffect(() => {
    if (settings?.batches) {
      setBatches(settings.batches)
    }
  }, [settings])

  const handleAddBatch = () => {
    const trimmed = newBatchName.trim()
    if (!trimmed) return
    if (batches.map((b) => b.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast({ title: 'Duplicate name', description: 'A batch with this name already exists.', variant: 'destructive' })
      return
    }
    setBatches((prev) => [...prev, trimmed])
    setNewBatchName('')
  }

  const handleRename = (index: number, value: string) => {
    setBatches((prev) => prev.map((b, i) => (i === index ? value : b)))
  }

  const handleRemove = (index: number) => {
    setBatches((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const cleaned = batches.map((b) => b.trim()).filter(Boolean)
    try {
      await updateSettings({ batches: cleaned }).unwrap()
      setBatches(cleaned)
      toast({ title: 'Saved', description: 'Practical batch settings updated successfully.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save batch settings. Please try again.', variant: 'destructive' })
    }
  }

  const isDirty = JSON.stringify(batches) !== JSON.stringify(settings?.batches ?? [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-orange-600" />
          Practical Batch Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure the practical batch names available for student allocation. These names will appear
          in the <strong>Practical Batch Allocation</strong> tab on the Students page.
        </p>
      </div>

      {/* Current batches */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configured Batches</CardTitle>
          <CardDescription>
            {batches.length === 0
              ? 'No batches configured. Add at least one batch below.'
              : `${batches.length} batch${batches.length !== 1 ? 'es' : ''} configured`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {batches.length === 0 && (
            <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-400">No batches yet — add one below</p>
            </div>
          )}

          {batches.map((batch, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50 group hover:border-gray-200 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
              <Badge
                variant="outline"
                className="shrink-0 text-orange-700 border-orange-200 bg-orange-50 font-mono text-xs"
              >
                #{index + 1}
              </Badge>
              <Input
                value={batch}
                onChange={(e) => handleRename(index, e.target.value)}
                className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-orange-300"
                placeholder="Batch name"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add new batch */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add New Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBatch()}
              placeholder="e.g. Batch D, Lab Group 1…"
              className="h-9"
            />
            <Button
              onClick={handleAddBatch}
              disabled={!newBatchName.trim()}
              variant="outline"
              className="shrink-0 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        {isDirty && (
          <p className="text-xs text-amber-600 font-medium">
            You have unsaved changes.
          </p>
        )}
      </div>
    </div>
  )
}
