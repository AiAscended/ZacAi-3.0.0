"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as knowledgeMgr from "@/lib/knowledge/tools/knowledgeLearntManager"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useAuth } from "@/contexts/AuthContext"

export default function KnowledgePanel() {
  const { canDelete, canEdit, canAdd } = useAuth()
  const [entries, setEntries] = useState<Record<string, any>>({})
  const [statement, setStatement] = useState("")
  const [source, setSource] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingStatement, setEditingStatement] = useState("")
  const [editingSource, setEditingSource] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const data = await knowledgeMgr.getAll()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async () => {
    if (!statement.trim() || !canAdd) return
    setLoading(true)
    try {
      await knowledgeMgr.save(statement.trim(), {
        statement: statement.trim(),
        source: source.trim(),
      })
      setStatement("")
      setSource("")
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (key: string, entry: any) => {
    if (!canEdit) return
    setEditingKey(key)
    setEditingStatement(entry.statement)
    setEditingSource(entry.source || "")
  }

  const saveEdit = async () => {
    if (!editingKey || !editingStatement.trim()) return
    setLoading(true)
    try {
      await knowledgeMgr.save(editingKey, {
        statement: editingStatement.trim(),
        source: editingSource.trim(),
      })
      setEditingKey(null)
      setEditingStatement("")
      setEditingSource("")
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditingStatement("")
    setEditingSource("")
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
      await knowledgeMgr.remove(deletingKey)
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
          <CardTitle>Knowledge Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="New Fact or Statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              maxLength={150}
              disabled={loading}
            />
            <Input
              placeholder="Source (optional)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={100}
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !statement.trim()}>
              Add
            </Button>
          </div>

          <ScrollArea className="h-96">
            {Object.entries(entries).length === 0 ? (
              <p className="text-center text-gray-500">No knowledge entries yet.</p>
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
                      <span className="font-semibold">{data.statement}</span>
                      {data.source && (
                        <p className="text-xs text-gray-600">Source: {data.source}</p>
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
                        aria-label={`Delete knowledge entry ${key}`}
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
        {editingKey && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelEdit}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Edit Knowledge Entry</h3>
              <Input
                placeholder="Statement"
                value={editingStatement}
                onChange={(e) => setEditingStatement(e.target.value)}
                className="mb-3"
                disabled={loading}
              />
              <Input
                placeholder="Source (optional)"
                value={editingSource}
                onChange={(e) => setEditingSource(e.target.value)}
                disabled={loading}
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={loading || !editingStatement.trim()}>
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
          description={`Are you sure you want to delete this knowledge entry? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          loading={loading}
        />
      </Card>
    </div>
  )
}
