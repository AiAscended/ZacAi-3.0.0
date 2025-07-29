"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import * as systemLrnMgr from "@/lib/system/tools/systemLearntManager"

export default function ChatLogPanel() {
  const [chatLog, setChatLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      const logs = await systemLrnMgr.getDiagnosticsLogs()
      setChatLog(logs)
      setLoading(false)
    }

    loadLogs()
  }, [])

  const formatTimestamp = (timestamp: number) => new Date(timestamp).toLocaleString()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading chat history...</p>
          ) : chatLog.length === 0 ? (
            <p className="text-center text-gray-500">No chat history available.</p>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {chatLog.map((entry, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <Badge variant="outline">{formatTimestamp(entry.timestamp)}</Badge>
                      <div className="flex gap-2">
                        <Badge variant="outline">{entry.processingTime}ms</Badge>
                        <Badge variant="outline">{Math.round(entry.confidence * 100)}% confidence</Badge>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="font-semibold text-gray-700">Input:</p>
                      <p className="bg-gray-50 p-2 rounded text-sm">{entry.input}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Response:</p>
                      <p className="bg-blue-50 p-2 rounded text-sm">{entry.response}</p>
                    </div>
                    {entry.sources && entry.sources.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold text-gray-700">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {entry.sources.map((src: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {src}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
