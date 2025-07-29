"use client"

import { Button } from "@/components/ui/button"
import {
  Home,
  BookOpen,
  Calculator,
  Code,
  User,
  MessageSquare,
  Activity,
  Database,
  ShieldCheck,
  Eye,
  Lightbulb,
  Cog,
  Layers,
  ClipboardList,
} from "lucide-react"

import { AdminPage } from "./AdminDashboard"

interface SidebarMenuProps {
  currentPage: AdminPage
  onChangePage: (page: AdminPage) => void
  sidebarOpen: boolean
  onToggleOpen: () => void
}

const sidebarItems: { id: AdminPage; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
  { id: "maths", label: "Mathematics", icon: Calculator },
  { id: "coding", label: "Coding", icon: Code },
  { id: "user-memory", label: "User Memory", icon: User },
  { id: "chat-log", label: "Chat Log", icon: MessageSquare },
  { id: "diagnostics", label: "Diagnostics", icon: Activity },
  { id: "performance", label: "Performance", icon: Database },
  { id: "observability", label: "Observability", icon: Eye },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "knowledge", label: "Knowledge", icon: Lightbulb },
  { id: "audit-log", label: "Audit Logs", icon: ClipboardList },
  { id: "training", label: "Training", icon: Layers },
  { id: "settings", label: "Settings", icon: Cog },
]

export default function SidebarMenu({
  currentPage,
  onChangePage,
  sidebarOpen,
  onToggleOpen,
}: SidebarMenuProps) {
  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Header: logo and toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {sidebarOpen && <span className="font-bold text-lg text-gray-900">ZacAI Admin</span>}

        <Button variant="ghost" size="sm" onClick={onToggleOpen} aria-label="Toggle Sidebar">
          {sidebarOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </Button>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col flex-grow p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id
          return (
            <Button
              key={id}
              variant={isActive ? "default" : "ghost"}
              onClick={() => onChangePage(id)}
              className={`w-full justify-start ${!sidebarOpen && "px-2"}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">{label}</span>}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
