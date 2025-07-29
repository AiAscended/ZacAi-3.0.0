"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as systemLrnMgr from "@/lib/system/tools/systemLearntManager"

export default function DiagnosticsPanel() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      const diagnosticsLogs = await systemLrnMgr.getDiagnosticsLogs()
      setLogs(diagnosticsLogs)
      setLoading(false)
    }
    loadLogs()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostics Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading diagnostics logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500">No diagnostics logs available.</p>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2 font-mono text-xs text-gray-700">
                {logs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-200 py-1">
                    {log}
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
