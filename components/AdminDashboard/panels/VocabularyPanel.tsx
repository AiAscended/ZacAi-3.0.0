"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as vocabLrnMgr from "@/lib/vocabulary/tools/vocabularyLearntManager"
import { vocabularyModule } from "@/modules/vocabulary"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useAuth } from "@/contexts/AuthContext"

interface EditEntry {
  word: string
  definition: string
}

export default function VocabularyPanel() {
  const { canDelete, canEdit, canAdd } = useAuth()
  const [seedEntries, setSeedEntries] = useState<Record<string, any>>({})
  const [learntEntries, setLearntEntries] = useState<Record<string, any>>({})
  const [newWord, setNewWord] = useState("")
  const [newDefinition, setNewDefinition] = useState("")
  const [editingEntry, setEditingEntry] = useState<EditEntry | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingWord, setDeletingWord] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const seed = vocabularyModule.getSeedWords()
      setSeedEntries(seed)
    } catch {
      setSeedEntries({})
    }

    const learnt = await vocabLrnMgr.getAllLearnt()
    setLearntEntries(learnt)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async () => {
    if (!newWord.trim() || !newDefinition.trim() || !canAdd) return
    setLoading(true)
    try {
      await vocabLrnMgr.saveLearntEntry(newWord.trim(), { definition: newDefinition.trim() })
      setNewWord("")
      setNewDefinition("")
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (word: string, definition: string) => {
    if (!canEdit) return
    setEditingEntry({ word, definition })
  }

  const closeEditModal = () => {
    setEditingEntry(null)
  }

  const saveEdit = async () => {
    if (!editingEntry || !editingEntry.word.trim() || !editingEntry.definition.trim()) return
    setLoading(true)
    try {
      await vocabLrnMgr.saveLearntEntry(editingEntry.word.trim(), { definition: editingEntry.definition.trim() })
      setEditingEntry(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  const requestDelete = (word: string) => {
    if (!canDelete) return
    setDeletingWord(word)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingWord) return
    setLoading(true)
    setConfirmOpen(false)
    try {
      await vocabLrnMgr.deleteLearntEntry(deletingWord)
      setDeletingWord(null)
      await loadData()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Seed Vocabulary */}
      <section>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Seed Vocabulary
        </h2>
        <ScrollArea className="h-96 border rounded-lg p-3">
          <div className="space-y-3">
            {Object.entries(seedEntries).length === 0 && (
              <p className="text-gray-500 text-center py-8">No seed words available.</p>
            )}
            {Object.entries(seedEntries).map(([w, data]) => (
              <div key={w} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-blue-700">{w.toUpperCase()}</h4>
                  {data.partOfSpeech && (
                    <Badge variant="outline" className="uppercase text-xs">
                      {data.partOfSpeech}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700">{data.definition}</p>
                {data.phonetics && <p className="text-xs text-gray-500">Pronunciation: {data.phonetics}</p>}
                {data.frequency !== undefined && (
                  <p className="text-xs text-gray-500">Frequency: {data.frequency}/5</p>
                )}
                {data.synonyms?.length > 0 && (
                  <p className="text-xs text-gray-500">Synonyms: {data.synonyms.slice(0, 3).join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Learnt Vocabulary */}
      <section>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-green-700">
          <BookOpen className="w-6 h-6" />
          Learnt Vocabulary
        </h2>
        <ScrollArea className="h-96 border rounded-lg p-3">
          <div className="space-y-3">
            {Object.entries(learntEntries).length === 0 && (
              <p className="text-gray-500 text-center py-8">No learnt words yet. Add some below!</p>
            )}
            {Object.entries(learntEntries).map(([w, data]) => (
              <div
                key={w}
                className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
                onClick={() => openEditModal(w, data.definition)}
                tabIndex={0}
                role="button"
                aria-label={`Edit learnt word ${w}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openEditModal(w, data.definition)
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-green-900">{w.toUpperCase()}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-xs">
                      learned
                    </Badge>
                    {canDelete && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          requestDelete(w)
                        }}
                        aria-label={`Delete learnt word ${w}`}
                        title={`Delete learnt word ${w}`}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-green-900">{data.definition}</p>
                {data.updatedAt && (
                  <p className="text-xs text-green-700">Updated: {new Date(data.updatedAt).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Add New Learnt Word Form */}
      {canAdd && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Add New Learnt Word</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Word"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                maxLength={50}
                disabled={loading}
              />
              <Input
                placeholder="Definition"
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleAdd} disabled={loading || !newWord.trim() || !newDefinition.trim()}>
                ➕ Add Word
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div
          aria-modal="true"
          role="dialog"
          aria-labelledby="edit-dialog-title"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-dialog-title" className="text-lg font-semibold mb-4">
              Edit Word: {editingEntry.word.toUpperCase()}
            </h3>

            <label htmlFor="definition-input" className="block mb-1 font-medium text-gray-700">
              Definition
            </label>
            <textarea
              id="definition-input"
              rows={4}
              className="w-full border rounded p-2 mb-4"
              value={editingEntry.definition}
              onChange={(e) => setEditingEntry({ ...editingEntry, definition: e.target.value })}
              disabled={loading}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeEditModal} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={loading || !editingEntry.definition.trim()}>
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
        description={`Are you sure you want to delete the learnt word "${deletingWord}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={loading}
      />
    </div>
  )
}
