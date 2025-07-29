"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import * as systemLrnMgr from "@/lib/system/systemLearntManager"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function SystemPanel() {
  const { canView } = useAuth()
  const [systemState, setSystemState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadState = async () => {
    setLoading(true)
    const state = await systemLrnMgr.getAll()
    setSystemState(state)
    setLoading(false)
  }

  useEffect(() => {
    if (canView) {
      loadState()
    }
  }, [canView])

  const refreshData = async () => {
    setRefreshing(true)
    await loadState()
    setRefreshing(false)
  }

  if (!canView) {
    return <p className="text-center text-gray-500">You do not have permission to view system data.</p>
  }

  if (loading) {
    return <p className="text-center text-gray-500">Loading system data...</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <Button size="sm" onClick={refreshData} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Uptime:</strong> {systemState?.performance?.uptime ?? "N/A"} ms
          </p>
          <p>
            <strong>Average Response Time:</strong> {systemState?.performance?.averageResponseTime ?? "N/A"} ms
          </p>
          <p>
            <strong>Total Queries:</strong> {systemState?.performance?.totalQueries ?? "N/A"}
          </p>
          <p>
            <strong>Success Rate:</strong> {(systemState?.performance?.successRate ?? 0) * 100}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {systemState?.logs?.length ? (
              <ul className="text-sm font-mono space-y-1">
                {systemState.logs.slice(-10).reverse().map((entry: any, index: number) => (
                  <li key={index} className={`text-${entry.level === "error" ? "red" : entry.level === "warn" ? "yellow" : "gray"}-600`}>
                    [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No logs available</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          {systemState?.warnings?.length ? (
            systemState.warnings.map((warning: string, idx: number) => (
              <Badge key={idx} variant="destructive" className="mb-1 inline-block">
                {warning}
              </Badge>
            ))
          ) : (
            <p className="text-gray-500">No warnings</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 text-xs font-mono text-gray-700">
            {systemState?.maintenanceHistory?.length ? (
              systemState.maintenanceHistory.slice(-20).reverse().map((entry: string, idx: number) => (
                <div key={idx} className="mb-1">{entry}</div>
              ))
            ) : (
              <p className="text-gray-500">No maintenance records</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
