// components/ChatInput.tsx
"use client"

import React from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Send } from "lucide-react"

interface ChatInputProps {
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  inputRef: React.RefObject<HTMLInputElement>
}

export default function ChatInput({ input, setInput, isLoading, onSubmit, inputRef }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="p-4">
      <div className="flex gap-3">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-1 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
