"use client"

import { useState } from "react"
import { Send, Loader2, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConversationalInputProps {
  onRouteModified: () => void
}

interface Message {
  id: string
  type: "user" | "system"
  content: string
  timestamp: Date
}

export default function ConversationalInput({ onRouteModified }: ConversationalInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate LLM response
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: "Found an alternative scenic route through the coast. Would you like to see it?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
      setIsLoading(false)
      onRouteModified()
    }, 2000)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 lg:static lg:flex-col lg:h-auto">
      {/* Chat Interface */}
      {isOpen && (
        <div className="floating-card bg-card rounded-t-3xl lg:rounded-t-2xl border-t border-border/30 max-h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Describe how you'd like to change your route</p>
                <p className="text-xs mt-2 text-muted-foreground/70">Try: "Make it more scenic" or "Avoid highways"</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl ${
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-none">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border/30 p-4 flex gap-2">
            <input
              type="text"
              placeholder="Ask to modify route..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-input rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="touch-target bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Action Button - Always visible */}
      <div className="p-4 flex gap-2">
        {!isOpen && (
          <>
            <Button
              onClick={() => setIsOpen(true)}
              className="flex-1 touch-target bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl"
            >
              Modify Route
            </Button>
            <Button
              size="icon"
              className="touch-target bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-2xl"
            >
              <Mic className="w-5 h-5" />
            </Button>
          </>
        )}
        {isOpen && (
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="flex-1 touch-target border-border/30 rounded-2xl font-semibold"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  )
}
