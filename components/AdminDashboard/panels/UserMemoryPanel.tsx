"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import * as userLrnMgr from "@/lib/user/tools/userLearntManager"
import { useAuth } from "@/contexts/AuthContext"
import auditLogger from "@/lib/audit/auditLogger"

interface UserEntry {
  content: any
}

export default function UserMemoryPanel() {
  const { canDelete, canEdit, canAdd } = useAuth()

  const [entries, setEntries] = useState<Record<string, UserEntry>>({})
  const [loading, setLoading] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")

  const loadData = async () => {
    setLoading(true)
    const data = await userLrnMgr.getAll()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const startEdit = (key: string, entry: UserEntry) => {
    if (!canEdit) return
    setEditingKey(key)
    setEditingValue(JSON.stringify(entry, null, 2))
  }

  const saveEdit = async () => {
    if (!editingKey) return
    setLoading(true)
    try {
      const parsed = JSON.parse(editingValue)
      await userLrnMgr.saveUser(editingKey, parsed)
      await auditLogger.logChange("user-memory", "update", editingKey, parsed)
      setEditingKey(null)
      await loadData()
    } catch {
      alert("Invalid JSON format")
    }
    setLoading(false)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditingValue("")
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
    await userLrnMgr.deleteUser(deletingKey)
    await auditLogger.logChange("user-memory", "delete", deletingKey)
    setDeletingKey(null)
    await loadData()
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newKey.trim()) return
    let parsed
    try {
      parsed = JSON.parse(newValue)
    } catch {
      alert("New entry value must be valid JSON")
      return
    }
    setLoading(true)
    await userLrnMgr.saveUser(newKey.trim(), parsed)
    await auditLogger.logChange("user-memory", "add", newKey.trim(), parsed)
    setNewKey("")
    setNewValue("")
    await loadData()
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* User Memory Entries */}
      <Card>
        <CardHeader>
          <CardTitle>User Memory Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading user memory data...</p>
          ) : Object.keys(entries).length === 0 ? (
            <p className="text-center text-gray-500">No user memory entries found.</p>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {Object.entries(entries).map(([key, entry]) => (
                  <div
                    key={key}
                    className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    tabIndex={0}
                    role="button"
                    onClick={() => startEdit(key, entry)}
                    onKeyDown={(e) => e.key === "Enter" && startEdit(key, entry)}
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold">{key}</h4>
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            requestDelete(key)
                          }}
                          aria-label={`Delete user memory entry ${key}`}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-40 overflow-auto">{JSON.stringify(entry, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add New Memory Entry */}
      {canAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Memory Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              disabled={loading}
            />
            <textarea
              placeholder="Value (JSON format)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={5}
              className="w-full border rounded p-2"
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !newKey.trim() || !newValue.trim()}>
              Add Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingKey && (
        <div
          aria-modal="true"
          role="dialog"
          aria-labelledby="edit-dialog-title"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelEdit}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 id="edit-dialog-title" className="text-lg font-semibold mb-4">Edit Entry: {editingKey}</h3>
            <textarea
              className="w-full border rounded p-2 mb-4 font-mono h-64"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              disabled={loading}
              aria-label="Edit entry JSON content"
            />
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
        description={`Are you sure you want to delete the memory entry "${deletingKey}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={loading}
      />
    </div>
  )
}
