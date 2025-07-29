"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as systemLrnMgr from "@/lib/system/tools/systemLearntManager"

export default function PerformancePanel() {
  const [perfData, setPerfData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPerformance() {
      setLoading(true)
      const perf = await systemLrnMgr.getAll()
      setPerfData(perf)
      setLoading(false)
    }
    loadPerformance()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading performance data...</p>
          ) : (
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                <strong>Uptime:</strong>{" "}
                {perfData.uptime ? `${Math.round(perfData.uptime / 1000)} seconds` : "N/A"}
              </p>
              <p>
                <strong>Average Response Time:</strong>{" "}
                {perfData.averageResponseTime ? `${perfData.averageResponseTime} ms` : "N/A"}
              </p>
              <p>
                <strong>Total Queries:</strong> {perfData.totalQueries || 0}
              </p>
              <p>
                <strong>Success Rate:</strong>{" "}
                {perfData.successRate ? `${(perfData.successRate * 100).toFixed(2)}%` : "N/A"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
