"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as securityMgr from "@/lib/security/tools/securityLearntManager"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useAuth } from "@/contexts/AuthContext"

export default function SecurityPanel() {
  const { canDelete, canEdit, canAdd } = useAuth()
  const [entries, setEntries] = useState<Record<string, any>>({})
  const [title, setTitle] = useState("")
  const [vuln, setVuln] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const data = await securityMgr.getAll()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async () => {
    if (!title.trim() || !canAdd) return
    setLoading(true)
    try {
      await securityMgr.saveSecurityConcept(title.trim(), {
        title: title.trim(),
        vulnerability: vuln.trim(),
        mitigationNotes: notes.trim(),
      })
      setTitle("")
      setVuln("")
      setNotes("")
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (key: string, entry: any) => {
    if (!canEdit) return
    setEditingKey(key)
    setEditingEntry(entry)
  }

  const saveEdit = async () => {
    if (!editingKey || !editingEntry?.title.trim()) return
    setLoading(true)
    try {
      await securityMgr.saveSecurityConcept(editingKey, editingEntry)
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
    setLoading(true)
    setConfirmOpen(false)
    try {
      await securityMgr.deleteSecurityConcept(deletingKey)
      setDeletingKey(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              disabled={loading}
            />
            <Input
              placeholder="Vulnerability"
              value={vuln}
              onChange={(e) => setVuln(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="Mitigation Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !title.trim()}>
              Add
            </Button>
          </div>

          <ScrollArea className="h-96">
            {Object.entries(entries).length === 0 ? (
              <p className="text-center text-gray-500">No security concepts yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(entries).map(([key, data]) => (
                  <div
                    key={key}
                    className="p-3 bg-gray-50 rounded-lg flex justify-between items-start cursor-pointer hover:bg-gray-100"
                    tabIndex={0}
                    role="button"
                    onClick={() => startEdit(key, data)}
                    onKeyDown={(e) => e.key === "Enter" && startEdit(key, data)}
                  >
                    <div>
                      <span className="font-semibold">{data.title}</span>
                      {data.vulnerability && (
                        <p className="text-xs text-gray-700">Vulnerability: {data.vulnerability}</p>
                      )}
                      {data.mitigationNotes && (
                        <p className="text-xs text-green-700">Notes: {data.mitigationNotes}</p>
                      )}
                      {data.updatedAt && (
                        <p className="text-xs text-gray-400">Updated: {new Date(data.updatedAt).toLocaleString()}</p>
                      )}
                    </div>
                    {canDelete && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          requestDelete(key)
                        }}
                        aria-label={`Delete security concept ${key}`}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Edit Modal */}
        {editingKey && editingEntry && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelEdit}
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Edit Security Concept</h3>
              <Input
                placeholder="Title"
                value={editingEntry.title}
                onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                maxLength={50}
                className="mb-3"
                disabled={loading}
              />
              <Input
                placeholder="Vulnerability"
                value={editingEntry.vulnerability || ""}
                onChange={(e) => setEditingEntry({ ...editingEntry, vulnerability: e.target.value })}
                className="mb-3"
                disabled={loading}
              />
              <Input
                placeholder="Mitigation Notes"
                value={editingEntry.mitigationNotes || ""}
                onChange={(e) => setEditingEntry({ ...editingEntry, mitigationNotes: e.target.value })}
                disabled={loading}
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={loading || !editingEntry.title.trim()}>
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
          description={`Are you sure you want to delete this security concept? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          loading={loading}
        />
      </Card>
    </div>
  )
}
