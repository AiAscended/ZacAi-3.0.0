import EnhancedAIChat from "@/components/enhanced-ai-chat"
import ErrorBoundary from "@/components/error-boundary"

export default function Home() {
  return (
    <ErrorBoundary>
      <main className="h-screen">
        <EnhancedAIChat />
      </main>
    </ErrorBoundary>
  )
}
