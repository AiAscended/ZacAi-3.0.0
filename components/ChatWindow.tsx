// components/ChatWindow.tsx
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Brain, Settings, MessageSquare } from "lucide-react"
import MessageList from "./MessageList"
import ChatInput from "./ChatInput"
import { useAIChat } from "../hooks/useAIChat"
import { AdminDashboard } from "./AdminDashboard/AdminDashboard"

export default function ChatWindow() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    stats,
    inputRef,
    handleSubmit,
    provideFeedback,
  } = useAIChat()

  const [showAdmin, setShowAdmin] = useState(false)

  if (showAdmin) {
    return <AdminDashboard onToggleChat={() => setShowAdmin(false)} messages={messages} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZacAI v100
              </h1>
              <p className="text-sm text-gray-600">Your Personal AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Online
            </Badge>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              {messages.filter((m) => m.sender === "user").length} queries
            </Badge>
            <button
              className="btn-unstyled flex items-center gap-2 text-sm text-gray-600"
              onClick={() => setShowAdmin(true)}
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5" />
              Chat with ZacAI
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <MessageList messages={messages} isLoading={isLoading} provideFeedback={provideFeedback} />

            <Separator />

            <ChatInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={handleSubmit} inputRef={inputRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
