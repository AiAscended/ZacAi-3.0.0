"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Calculator } from "lucide-react"
import * as mathsMgr from "@/lib/mathematics/tools/mathematicsLearntManager"
import { mathematicsModule } from "@/modules/mathematics"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useAuth } from "@/contexts/AuthContext"

interface ConceptEntry {
  name: string
  description: string
  formula?: string
}

export default function MathPanel() {
  const { canDelete, canEdit, canAdd } = useAuth()
  const [seedConcepts, setSeedConcepts] = useState<Record<string, any>>({})
  const [learntConcepts, setLearntConcepts] = useState<Record<string, ConceptEntry>>({})
  const [newConcept, setNewConcept] = useState<ConceptEntry>({ name: "", description: "", formula: "" })
  const [editing, setEditing] = useState<ConceptEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setSeedConcepts(mathematicsModule.getSeedConcepts())
    setLearntConcepts(await mathsMgr.getAllLearnt())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async () => {
    if (!newConcept.name.trim() || !newConcept.description.trim() || !canAdd) return
    setLoading(true)
    try {
      await mathsMgr.saveLearntConcept(newConcept.name.trim(), {
        description: newConcept.description.trim(),
        formula: newConcept.formula?.trim(),
      })
      setNewConcept({ name: "", description: "", formula: "" })
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (id: string, entry: ConceptEntry) => {
    if (!canEdit) return
    setEditing({ name: id, description: entry.description, formula: entry.formula || "" })
  }

  const saveEdit = async () => {
    if (!editing || !editing.name.trim() || !editing.description.trim()) return
    setLoading(true)
    try {
      await mathsMgr.saveLearntConcept(editing.name.trim(), {
        description: editing.description.trim(),
        formula: editing.formula?.trim(),
      })
      setEditing(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    setConfirmOpen(false)
    setLoading(true)
    try {
      await mathsMgr.deleteLearntConcept(deletingId)
      setDeletingId(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Seed Concepts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-600" />
            Seed Math Concepts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            <div className="space-y-3">
              {Object.entries(seedConcepts).length === 0 && (
                <p className="text-gray-500 text-center">No seed concepts available.</p>
              )}
              {Object.entries(seedConcepts).map(([id, concept]) => (
                <div key={id} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">{concept.name || id}</h4>
                  <p className="text-sm text-gray-700">{concept.description}</p>
                  {concept.formula && (
                    <pre className="text-xs mt-2 bg-white p-2 rounded font-mono whitespace-pre-wrap">{concept.formula}</pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Learnt Concepts */}
      <Card>
        <CardHeader>
          <CardTitle>Learnt Math Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {Object.entries(learntConcepts).length === 0 && (
                <p className="text-gray-500 text-center">No learnt concepts yet.</p>
              )}
              {Object.entries(learntConcepts).map(([id, concept]) => (
                <div
                  key={id}
                  className="p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 flex justify-between items-start"
                  tabIndex={0}
                  role="button"
                  onClick={() => startEdit(id, concept)}
                  onKeyDown={(e) => e.key === "Enter" && startEdit(id, concept)}
                >
                  <div>
                    <h4 className="font-semibold">{concept.name || id}</h4>
                    <p>{concept.description}</p>
                    {concept.formula && (
                      <pre className="text-xs font-mono">{concept.formula}</pre>
                    )}
                  </div>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation()
                        setDeletingId(id)
                        setConfirmOpen(true)
                      }}
                      aria-label={`Delete concept ${id}`}
                      title={`Delete concept ${id}`}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add New Concept */}
      {canAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Concept</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Name"
              value={newConcept.name}
              onChange={(e) => setNewConcept(c => ({ ...c, name: e.target.value }))}
              disabled={loading}
            />
            <Input
              placeholder="Description"
              value={newConcept.description}
              onChange={(e) => setNewConcept(c => ({ ...c, description: e.target.value }))}
              disabled={loading}
            />
            <Input
              placeholder="Formula (optional)"
              value={newConcept.formula}
              onChange={(e) => setNewConcept(c => ({ ...c, formula: e.target.value }))}
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !newConcept.name.trim() || !newConcept.description.trim()}>
              Add Concept
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setEditing(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Edit Concept: {editing.name}</h3>
            <Input
              placeholder="Description"
              value={editing.description}
              onChange={(e) => setEditing(c => c ? { ...c, description: e.target.value } : null)}
              className="mb-3"
              disabled={loading}
            />
            <Input
              placeholder="Formula (optional)"
              value={editing.formula}
              onChange={(e) => setEditing(c => c ? { ...c, formula: e.target.value } : null)}
              disabled={loading}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={loading}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Confirmation"
        description={`Are you sure you want to delete the concept "${deletingId}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={loading}
      />
    </div>
  )
}
