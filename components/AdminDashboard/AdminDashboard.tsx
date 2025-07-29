"use client"

import { useState } from "react"
import SidebarMenu from "./SidebarMenu"
import { AuthProvider } from "@/contexts/AuthContext"

import OverviewPanel from "./panels/OverviewPanel"
import VocabularyPanel from "./panels/VocabularyPanel"
import MathPanel from "./panels/MathPanel"
import CodingPanel from "./panels/CodingPanel"
import UserMemoryPanel from "./panels/UserMemoryPanel"
import ChatLogPanel from "./panels/ChatLogPanel"
import DiagnosticsPanel from "./panels/DiagnosticsPanel"
import PerformancePanel from "./panels/PerformancePanel"
import ObservabilityPanel from "./panels/ObservabilityPanel"
import SecurityPanel from "./panels/SecurityPanel"
import KnowledgePanel from "./panels/KnowledgePanel"
import SettingsPanel from "./panels/SettingsPanel"
import AuditLogPanel from "./panels/AuditLogPanel"
import TrainingPanel from "./panels/TrainingPanel"

export type AdminPage =
  | "overview"
  | "vocabulary"
  | "maths"
  | "coding"
  | "user-memory"
  | "chat-log"
  | "diagnostics"
  | "performance"
  | "observability"
  | "security"
  | "knowledge"
  | "settings"
  | "audit-log"
  | "training"

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState<AdminPage>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <AuthProvider>
      <div className="h-full flex bg-gray-50">
        {/* Sidebar navigation */}
        <SidebarMenu
          currentPage={currentPage}
          onChangePage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-auto p-6">
          {currentPage === "overview" && <OverviewPanel />}
          {currentPage === "vocabulary" && <VocabularyPanel />}
          {currentPage === "maths" && <MathPanel />}
          {currentPage === "coding" && <CodingPanel />}
          {currentPage === "user-memory" && <UserMemoryPanel />}
          {currentPage === "chat-log" && <ChatLogPanel />}
          {currentPage === "diagnostics" && <DiagnosticsPanel />}
          {currentPage === "performance" && <PerformancePanel />}
          {currentPage === "observability" && <ObservabilityPanel />}
          {currentPage === "security" && <SecurityPanel />}
          {currentPage === "knowledge" && <KnowledgePanel />}
          {currentPage === "settings" && <SettingsPanel />}
          {currentPage === "audit-log" && <AuditLogPanel />}
          {currentPage === "training" && <TrainingPanel />}
        </main>
      </div>
    </AuthProvider>
  )
}
