// hooks/useAIChat.ts
import { useState, useEffect, useRef } from "react"
import { SimpleAISystem, Message, LearningStats } from "@/services/SimpleAISystem"

export function useAIChat() {
  const [aiSystem] = useState(() => new SimpleAISystem())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<LearningStats>({
    totalInteractions: 0,
    knowledgeItems: 0,
    modelVersion: 1,
    avgConfidence: 0,
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages(aiSystem.getConversationHistory())
    setStats(aiSystem.getLearningStats())
    inputRef.current?.focus()
  }, [aiSystem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      sender: "user",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      await new Promise((r) => setTimeout(r, 500)) // simulate delay
      const aiMessage = await aiSystem.processMessage(userMessage.content)
      setMessages((prev) => [...prev, aiMessage])
      setStats(aiSystem.getLearningStats())
    } catch (error) {
      console.error("Error processing query:", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "❌ I encountered an error processing your request. Please try again.",
        sender: "ai",
        timestamp: Date.now(),
        confidence: 0,
        sources: ["error"],
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const provideFeedback = (messageId: string, feedback: "positive" | "negative") => {
    aiSystem.provideFeedback(messageId, feedback)
  }

  return {
    messages,
    input,
    setInput,
    isLoading,
    stats,
    inputRef,
    handleSubmit,
    provideFeedback,
  }
}
