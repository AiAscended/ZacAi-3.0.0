// components/MessageBubble.tsx
"use client"

import React from "react"
import { Badge } from "./ui/badge"
import { Clock, Bot, User } from "lucide-react"

interface MessageBubbleProps {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: number
  confidence?: number
  provideFeedback?: (id: string, feedback: "positive" | "negative") => void
}

export default function MessageBubble({
  id,
  content,
  sender,
  timestamp,
  confidence,
  provideFeedback,
}: MessageBubbleProps) {
  const formatTimestamp = (ts: number) => new Date(ts).toLocaleTimeString()

  const getConfidenceColor = (conf?: number) => {
    if (conf === undefined) return "bg-gray-100 text-gray-700"
    if (conf >= 0.8) return "bg-green-100 text-green-700"
    if (conf >= 0.6) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  return (
    <div className={`flex gap-3 ${sender === "user" ? "justify-end" : "justify-start"}`}>
      {sender === "ai" && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>

        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(timestamp)}</span>

          {confidence !== undefined && (
            <Badge variant="secondary" className={`text-xs ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}%
            </Badge>
          )}
        </div>
      </div>

      {sender === "user" && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  )
}
