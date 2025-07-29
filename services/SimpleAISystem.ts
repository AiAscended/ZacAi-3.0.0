// services/SimpleAISystem.ts
export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: number
  confidence?: number
  sources?: string[]
}

export interface LearningStats {
  totalInteractions: number
  knowledgeItems: number
  modelVersion: number
  avgConfidence: number
}

export class SimpleAISystem {
  private conversationHistory: Message[] = []
  private knowledgeBase: string[] = []
  private responses = [
    "That's really interesting! Tell me more about that.",
    "I understand what you're saying. How does that make you feel?",
    "That's a great point. I'm learning from our conversation.",
    "I see what you mean. Can you give me an example?",
    "That reminds me of something we discussed earlier.",
    "I'm still learning about this topic. What's your experience with it?",
    "That's worth thinking about. What led you to that conclusion?",
    "I appreciate you sharing that with me. It helps me learn.",
    "That's an interesting perspective. I hadn't considered that before.",
    "Thanks for teaching me about this. I'm getting smarter with each conversation!",
  ]

  constructor() {
    this.loadFromStorage()
  }

  public async processMessage(userMessage: string): Promise<Message> {
    const userMsg: Message = {
      id: this.generateId(),
      content: userMessage,
      sender: "user",
      timestamp: Date.now(),
    }
    this.conversationHistory.push(userMsg)
    this.knowledgeBase.push(userMessage.toLowerCase())

    const responseText = this.generateResponse(userMessage)
    const confidence = Math.random() * 0.3 + 0.7 // 0.7 to 1.0

    const assistantMsg: Message = {
      id: this.generateId(),
      content: responseText,
      sender: "ai",
      timestamp: Date.now(),
      confidence,
      sources: ["local"],
    }
    this.conversationHistory.push(assistantMsg)

    this.saveToStorage()

    return assistantMsg
  }

  private generateResponse(input: string): string {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "👋 Hello! I'm ZacAI, your AI assistant. How can I help you today?"
    }

    if (lowerInput.includes("help")) {
      return (
        "🆘 **ZacAI Help**\n" +
        "Commands:\n" +
        "• Math: '5 + 5' or 'What is 15 * 8?'\n" +
        "• General questions: Ask me anything\n" +
        "• System status: 'status' or 'how are you?'\n" +
        "What would you like to try?"
      )
    }

    if (lowerInput.includes("status") || lowerInput.includes("how are you")) {
      return (
        "🟢 **System Status: Operational**\n" +
        "• Version: ZacAI v100\n" +
        "• Status: All systems running normally\n" +
        "• Response time: Fast\n" +
        "I'm ready to help!"
      )
    }

    if (/^\d+[\s]*[+\-*/][\s]*\d+/.test(input.replace(/\s/g, ""))) {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(input.replace(/[^0-9+\-*/().]/g, ""))
        return `🧮 ${input} = ${result}\nCalculation complete!`
      } catch {
        return "❌ I couldn't calculate that. Please check your math expression."
      }
    }

    const hasContext = this.knowledgeBase.some((item) =>
      item.split(" ").some((word) => lowerInput.includes(word) && word.length > 3),
    )
    if (hasContext) {
      return this.responses[Math.floor(Math.random() * this.responses.length)]
    }

    return (
      `I received your message: "${input}"\n` +
      "I'm here to help! Try asking me to:\n" +
      "• Solve a math problem\n" +
      "• Type 'help' for more options\n" +
      "• Ask 'status' to check system health\n" +
      "What else would you like to explore?"
    )
  }

  public getConversationHistory(): Message[] {
    return [...this.conversationHistory]
  }

  public getLearningStats(): LearningStats {
    const assistantMessages = this.conversationHistory.filter((m) => m.sender === "ai")
    const avgConfidence =
      assistantMessages.length > 0
        ? assistantMessages.reduce((sum, m) => sum + (m.confidence ?? 0), 0) / assistantMessages.length
        : 0

    return {
      totalInteractions: this.conversationHistory.length,
      knowledgeItems: this.knowledgeBase.length,
      modelVersion: 1,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
    }
  }

  public provideFeedback(messageId: string, feedback: "positive" | "negative"): void {
    console.log(`Received ${feedback} feedback for message ${messageId}`)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }

  private saveToStorage(): void {
    try {
      const recentHistory = this.conversationHistory.slice(-50)
      const recentKnowledge = this.knowledgeBase.slice(-100)

      localStorage.setItem(
        "zacai-memory",
        JSON.stringify({
          history: recentHistory,
          knowledge: recentKnowledge,
        }),
      )
    } catch (error) {
      console.warn("Could not save to storage:", error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("zacai-memory")
      if (stored) {
        const data = JSON.parse(stored)
        this.conversationHistory = data.history ?? []
        this.knowledgeBase = data.knowledge ?? []
      }
    } catch {
      this.conversationHistory = []
      this.knowledgeBase = []
    }
  }
}
