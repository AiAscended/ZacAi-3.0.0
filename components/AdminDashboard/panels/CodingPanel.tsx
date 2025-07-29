"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as codeMgr from "@/lib/coding/tools/codingLearntManager"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useAuth } from "@/contexts/AuthContext"

interface CodingEntry {
  code: string
  language?: string
  notes?: string
}

export default function CodingPanel() {
  const { canDelete, canEdit, canAdd } = useAuth()
  const [entries, setEntries] = useState<Record<string, CodingEntry>>({})
  const [loading, setLoading] = useState(false)

  const [newEntry, setNewEntry] = useState<CodingEntry>({ code: "", language: "", notes: "" })
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<CodingEntry | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await codeMgr.getAllLearnt()
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async () => {
    if (!newEntry.code.trim() || !canAdd) return
    setLoading(true)
    try {
      const key = `snippet_${Date.now()}`
      await codeMgr.saveLearntSnippet(key, newEntry)
      setNewEntry({ code: "", language: "", notes: "" })
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (key: string) => {
    if (!canEdit) return
    setEditingKey(key)
    setEditingEntry(entries[key])
  }

  const saveEdit = async () => {
    if (!editingKey || !editingEntry) return
    setLoading(true)
    try {
      await codeMgr.saveLearntSnippet(editingKey, editingEntry)
      setEditingKey(null)
      setEditingEntry(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditingEntry(null)
  }

  const requestDelete = (key: string) => {
    if (!canDelete) return
    setDeletingKey(key)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingKey) return
    setConfirmOpen(false)
    setLoading(true)
    try {
      await codeMgr.deleteLearntSnippet(deletingKey)
      setDeletingKey(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Learnt Coding Snippets */}
      <Card>
        <CardHeader>
          <CardTitle>Coding Snippets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading snippets...</p>
          ) : Object.keys(entries).length === 0 ? (
            <p className="text-center text-gray-500">No learnt snippets available.</p>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {Object.entries(entries).map(([key, snippet]) => (
                  <div
                    key={key}
                    tabIndex={0}
                    role="button"
                    className="bg-gray-50 rounded p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => startEdit(key)}
                    onKeyDown={e => {
                      if (e.key === "Enter") startEdit(key)
                    }}
                  >
                    <pre className="font-mono text-sm whitespace-pre-wrap">{snippet.code}</pre>
                    {snippet.language && <p className="text-xs text-gray-600">Language: {snippet.language}</p>}
                    {snippet.notes && <p className="text-xs text-gray-500 italic">{snippet.notes}</p>}
                    {canDelete && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          requestDelete(key)
                        }}
                        aria-label={`Delete coding snippet ${key}`}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add New Snippet */}
      {canAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Snippet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Code"
              value={newEntry.code}
              onChange={e => setNewEntry({ ...newEntry, code: e.target.value })}
              disabled={loading}
              multiline
            />
            <Input
              placeholder="Language (optional)"
              value={newEntry.language || ""}
              onChange={e => setNewEntry({ ...newEntry, language: e.target.value })}
              disabled={loading}
            />
            <Input
              placeholder="Notes (optional)"
              value={newEntry.notes || ""}
              onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !newEntry.code.trim()}>
              Add Snippet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
          onClick={cancelEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-snippet-title"
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 id="edit-snippet-title" className="text-lg font-semibold mb-4">Edit Snippet</h3>
            <label className="block mb-2 font-medium text-gray-700">
              Code
              <textarea
                className="w-full border p-2 rounded resize-y"
                rows={8}
                value={editingEntry.code}
                onChange={e => setEditingEntry({ ...editingEntry, code: e.target.value })}
                disabled={loading}
              />
            </label>
            <label className="block mb-2 font-medium text-gray-700">
              Language (optional)
              <input
                className="w-full border p-2 rounded"
                value={editingEntry.language || ""}
                onChange={e => setEditingEntry({ ...editingEntry, language: e.target.value })}
                disabled={loading}
              />
            </label>
            <label className="block mb-4 font-medium text-gray-700">
              Notes (optional)
              <textarea
                className="w-full border p-2 rounded resize-y"
                rows={3}
                value={editingEntry.notes || ""}
                onChange={e => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                disabled={loading}
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelEdit} disabled={loading}>Cancel</Button>
              <Button onClick={saveEdit} disabled={loading}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Confirmation"
        description={`Are you sure you want to delete this coding snippet? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={loading}
      />
    </div>
  )
}
