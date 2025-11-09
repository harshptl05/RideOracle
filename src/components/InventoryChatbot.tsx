"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { loadAllVehicleData } from "@/utils/loadVehicleData";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

export function InventoryChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your Toyota assistant. I can help you find information about our vehicles, compare models, answer questions about features, pricing, and more. What would you like to know?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load vehicle data when component mounts
    loadAllVehicleData().then((data) => {
      setVehicleData(data);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateSystemPrompt = (vehicles: any[]) => {
    if (vehicles.length === 0) {
      return `You are a helpful Toyota vehicle assistant on the inventory page. You help users find information about Toyota vehicles, compare models, and answer questions about features, pricing, and specifications. Be friendly and concise (2-3 sentences max).`;
    }

    // Group vehicles by model for better organization
    const vehiclesByModel = vehicles.reduce((acc: any, v: any) => {
      const key = v.name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {});

    // Create a comprehensive summary
    const modelSummaries = Object.entries(vehiclesByModel).slice(0, 15).map(([model, models]: [string, any]) => {
      const firstModel = models[0];
      const priceRange = models.length > 1 
        ? `$${Math.min(...models.map((m: any) => m.price)).toLocaleString()} - $${Math.max(...models.map((m: any) => m.price)).toLocaleString()}`
        : `$${firstModel.price.toLocaleString()}`;
      
      const features = (firstModel.keyFeatures || firstModel.features || []).slice(0, 5).join(", ");
      const trims = models.map((m: any) => m.trim).join(", ");
      
      return `${model}:
  - Price Range: ${priceRange}
  - Body Type: ${firstModel.bodyType}
  - Fuel Type: ${firstModel.fuelType}
  - MPG: ${firstModel.mpg || firstModel.mpgCity + "/" + firstModel.mpgHighway || "N/A"}
  - Seats: ${firstModel.seats || 5}
  - Available Trims: ${trims}
  - Key Features: ${features || "Standard Toyota features"}`;
    }).join("\n\n");

    return `You are a helpful Toyota vehicle assistant on the inventory page. You have access to detailed information about Toyota vehicles from our inventory database.

AVAILABLE VEHICLE MODELS:
${modelSummaries}

${vehicles.length > 15 ? `\nNote: There are ${vehicles.length} total vehicles in our inventory across all models and trims.` : ""}

Your role:
- Help users find vehicles that match their needs (budget, body type, fuel type, features, passenger capacity, etc.)
- Answer questions about vehicle specifications, features, pricing, MPG, and comparisons
- Provide recommendations based on user preferences and requirements
- Explain differences between models and trims
- Help with financing questions, safety features, and technology features
- Be friendly, concise (2-3 sentences max), and helpful
- Reference specific vehicles from the data above when relevant

When users ask about:
- Pricing: Reference the exact prices from the vehicle data above
- Features: Mention specific features from the vehicle data (safety, technology, comfort features)
- Comparisons: Compare different models based on their needs, budget, and preferences
- Recommendations: Suggest specific vehicles based on criteria (budget, body type, fuel efficiency, features, passenger needs)
- MPG/Fuel Efficiency: Reference the MPG data from the vehicles above
- Body Types: Help users understand differences between Sedan, SUV, Truck, Minivan, etc.

Keep responses conversational and helpful. Always try to reference specific vehicles and models when relevant. If asked about something not in the data, be honest and suggest they check the vehicle details on the page.`;
  };

  const callOpenRouter = async (userMessage: string, conversationHistory: Message[]) => {
    try {
      const systemPrompt = generateSystemPrompt(vehicleData);

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
              content: systemPrompt,
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
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'd be happy to help you find information about our Toyota vehicles!";
    } catch (error) {
      console.error("OpenRouter API error:", error);
      return "I'm here to help! You can ask me about vehicle features, pricing, comparisons, or recommendations. What would you like to know?";
    }
  };

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const botResponse = await callOpenRouter(text.trim(), messages);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble right now. Please try again or check the vehicle details on the page.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:bg-white/90 transition-colors"
          aria-label="Open chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-black border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-white/10 border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Toyota Assistant</h3>
                  <p className="text-white/60 text-xs">Ask me anything</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white border border-white/20"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about vehicles, features, pricing..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

