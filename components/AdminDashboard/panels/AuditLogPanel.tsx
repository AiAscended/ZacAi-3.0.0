"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import auditLogger, { AuditEntry } from "@/lib/audit/auditLogger"

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      const entries = await auditLogger.getAll()
      setLogs(entries.reverse()) // newest first
      setLoading(false)
    }

    loadLogs()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500">No audit logs found.</p>
          ) : (
            <ScrollArea className="h-96 font-mono text-xs text-gray-700">
              <table className="w-full border-collapse">
                <thead className="border-b border-gray-300">
                  <tr>
                    <th className="p-2 text-left">Timestamp</th>
                    <th className="p-2 text-left">Domain</th>
                    <th className="p-2 text-left">Action</th>
                    <th className="p-2 text-left">Key</th>
                    <th className="p-2 text-left">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200 even:bg-gray-50">
                      <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-2">{log.domain}</td>
                      <td className="p-2 capitalize">{log.action}</td>
                      <td className="p-2">{log.key}</td>
                      <td className="p-2">{log.user || "unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
