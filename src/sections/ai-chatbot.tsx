"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Sparkles, MessageCircle, ArrowRight } from "lucide-react"
import { QuizModal } from "@/components/QuizModal"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}

const OPENROUTER_API_KEY = "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"

const suggestions = [
  "Find me a fuel-efficient family car",
  "What's your most affordable model?",
  "Which Toyota is best for adventures?",
  "Tell me about hybrid options",
]

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const callOpenRouter = async (userMessage: string, conversationHistory: Message[]) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a friendly Toyota car finder assistant. Help customers find their perfect Toyota vehicle. Keep responses concise (2-3 sentences max). If they want to find a car, suggest they try the 'Find My Car' quiz for personalized recommendations.",
            },
            ...conversationHistory.map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            {
              role: "user",
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      })

      if (!response.ok) {
        throw new Error("API request failed")
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || "I'd be happy to help you find your perfect Toyota!"
    } catch (error) {
      console.error("OpenRouter API error:", error)
      return "I'd be happy to help you find your perfect Toyota! For personalized recommendations, try our 'Find My Car' quiz."
    }
  }

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      text: text,
      sender: "user",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Call OpenRouter API
    const botResponse = await callOpenRouter(text, messages)
    
    const botMessage: Message = {
      id: Date.now() + 1,
      text: botResponse,
      sender: "bot",
    }
    setMessages((prev) => [...prev, botMessage])
    setIsLoading(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-96 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(15, 22, 40, 0.95) 0%, rgba(10, 15, 31, 0.95) 100%)",
              border: "1px solid rgba(79, 227, 255, 0.2)",
            }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{
                borderColor: "rgba(79, 227, 255, 0.15)",
                background: "linear-gradient(135deg, rgba(79, 227, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #4fe3ff 0%, #00d4ff 100%)",
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-blue-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Toyota AI</h3>
                    <p className="text-xs text-cyan-300">Find your dream car</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cyan-500/10 transition-colors"
                >
                  <X className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
                  <div className="text-3xl mb-3">✨</div>
                  <h4 className="text-white font-semibold mb-2">Ask our AI anything</h4>
                  <p className="text-cyan-300/60 text-sm mb-4">Get personalized Toyota recommendations</p>
                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      setIsQuizOpen(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 rounded-full text-sm font-medium mb-4 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Start Quiz to Find My Car
                  </motion.button>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 rounded-full text-sm text-left transition-all group"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(79, 227, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)",
                          border: "1px solid rgba(79, 227, 255, 0.2)",
                        }}
                      >
                        <span className="text-cyan-200 group-hover:text-cyan-300">{suggestion}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-xs px-4 py-3 rounded-2xl"
                        style={{
                          background:
                            message.sender === "user"
                              ? "linear-gradient(135deg, #4fe3ff 0%, #00d4ff 100%)"
                              : "rgba(27, 46, 72, 0.4)",
                          border: message.sender === "user" ? "none" : "1px solid rgba(79, 227, 255, 0.2)",
                          color: message.sender === "user" ? "#0a0f1f" : "rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-3">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            delay: i * 0.1,
                            repeat: Number.POSITIVE_INFINITY,
                            duration: 0.6,
                          }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "#4fe3ff" }}
                        />
                      ))}
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div
              className="p-4 border-t"
              style={{
                borderColor: "rgba(79, 227, 255, 0.15)",
                background: "linear-gradient(135deg, rgba(10, 15, 31, 0.6) 0%, rgba(15, 22, 40, 0.4) 100%)",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Toyota models..."
                  className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none transition-all"
                  style={{
                    background: "rgba(27, 46, 72, 0.4)",
                    border: "1px solid rgba(79, 227, 255, 0.2)",
                    color: "white",
                  }}
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                  style={{
                    background:
                      input.trim() && !isLoading
                        ? "linear-gradient(135deg, #4fe3ff 0%, #00d4ff 100%)"
                        : "rgba(79, 227, 255, 0.1)",
                  }}
                >
                  <Send
                    className="w-4 h-4"
                    style={{
                      color: input.trim() && !isLoading ? "#0a0f1f" : "#4fe3ff",
                    }}
                  />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative group"
        style={{
          background: "linear-gradient(135deg, #4fe3ff 0%, #00d4ff 100%)",
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-blue-900" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6 text-blue-900" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing glow effect */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(79, 227, 255, 0.3) 0%, rgba(79, 227, 255, 0) 70%)",
            opacity: 0.5,
          }}
        />
      </motion.button>
      <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </div>
  )
}
