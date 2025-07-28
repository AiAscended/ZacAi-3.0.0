// components/MessageList.tsx
"use client"

import React, { useRef, useEffect } from "react"
import MessageBubble from "./MessageBubble"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: number
  confidence?: number
  sources?: string[]
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  provideFeedback: (id: string, feedback: "positive" | "negative") => void
}

export default function MessageList({ messages, isLoading, provideFeedback }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} {...message} provideFeedback={provideFeedback} />
      ))}

      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-gray-100 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">ZacAI is thinking...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
