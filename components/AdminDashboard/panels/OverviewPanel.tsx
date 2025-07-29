"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as systemLrnMgr from "@/lib/system/tools/systemLearntManager"
import {
  Activity,
  MessageSquare,
  TrendingUp,
  Clock,
  Database,
  CheckCircle,
} from "lucide-react"

export default function OverviewPanel() {
  const [systemStats, setSystemStats] = useState<any>({})

  useEffect(() => {
    async function loadStats() {
      const stats = await systemLrnMgr.getAll()
      setSystemStats(stats)
    }
    loadStats()
  }, [])

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-bold text-gray-900">{formatUptime(systemStats.uptime || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Queries</p>
              <p className="text-lg font-bold text-gray-900">{systemStats.totalQueries || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round((systemStats.successRate || 0) * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className="text-lg font-bold text-gray-900">{Math.round(systemStats.averageResponseTime || 0)} ms</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Module Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemStats?.modules
              ? Object.entries(systemStats.modules).map(([name, stats]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {name === "vocabulary" && <BookOpen className="w-4 h-4 text-blue-600" />}
                      {name === "mathematics" && <Calculator className="w-4 h-4 text-green-600" />}
                      <span className="font-medium capitalize">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{stats?.totalQueries || 0} queries</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))
              : <p className="text-gray-500">No module stats available.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
