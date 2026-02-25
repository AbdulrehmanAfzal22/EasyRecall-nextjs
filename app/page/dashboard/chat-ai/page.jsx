"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Loader2, RotateCcw } from "lucide-react";
import "./ai-chat.css"; // Make sure this file exists in the same directory

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI study assistant. I can help you understand concepts, answer questions, create study plans, or quiz you on any topic. What would you like to learn today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call your AI API here
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.content || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (confirm("Clear all messages?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I'm your AI study assistant. I can help you understand concepts, answer questions, create study plans, or quiz you on any topic. What would you like to learn today?",
          timestamp: new Date(),
        }
      ]);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const SUGGESTIONS = [
    { icon: "📚", text: "Explain quantum mechanics simply" },
    { icon: "✏️", text: "Quiz me on World War II" },
    { icon: "🎯", text: "Create a study plan for finals" },
    { icon: "💡", text: "Help me understand calculus" },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>AI Study Assistant</h1>
          <p>Your personal learning companion</p>
        </div>
        <div className="topbar-right">
          <button className="chat-reset-btn" onClick={handleReset}>
            <RotateCcw size={16} />
            Reset Chat
          </button>
        </div>
      </div>

      <div className="page chat-page">
        <div className="chat-container">
          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.role === "user" ? "chat-message--user" : "chat-message--assistant"}`}
              >
                <div className="chat-message-avatar">
                  {msg.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                <div className="chat-message-content">
                  <div className="chat-message-text">{msg.content}</div>
                  <div className="chat-message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message-avatar">
                  <Bot size={18} />
                </div>
                <div className="chat-message-content">
                  <div className="chat-typing">
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only show when no messages sent yet) */}
          {messages.length === 1 && (
            <div className="chat-suggestions">
              <div className="chat-suggestions-title">
                <Sparkles size={16} />
                Try asking...
              </div>
              <div className="chat-suggestions-grid">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="chat-suggestion-card"
                    onClick={() => setInput(suggestion.text)}
                  >
                    <span className="chat-suggestion-icon">{suggestion.icon}</span>
                    <span className="chat-suggestion-text">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask me anything about your studies..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="chat-loading-icon" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <div className="chat-input-hint">
              Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </>
  );
}