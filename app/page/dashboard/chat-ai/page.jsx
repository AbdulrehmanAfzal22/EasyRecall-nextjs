"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, Loader2, RotateCcw, Plus, X, FileText, ImageIcon } from "lucide-react";
import "./ai-chat.css";

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI study assistant. I can help you understand concepts, answer questions, create study plans, or quiz you on any topic. What would you like to learn today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]); // { id, file, preview, type }
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // ── Attach helpers ──────────────────────────────────────────────────
  const addFiles = (files) => {
    const newAttachments = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        type: isImage ? "image" : "file",
        preview: isImage ? URL.createObjectURL(file) : null,
        size: file.size,
      };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  // ── Paste (Ctrl+V) ──────────────────────────────────────────────────
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    const files = imageItems.map((item) => item.getAsFile()).filter(Boolean);
    addFiles(files);
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  // ── Drag & drop ─────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  // ── Send ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      attachments: attachments.map(({ id, name, type, preview }) => ({ id, name, type, preview })),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append(
        "messages",
        JSON.stringify(
          [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
            hasAttachments: m.attachments ? m.attachments.length > 0 : false
          }))
        )
      );
      attachments.forEach((att) => formData.append("files", att.file));

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || data.content || "I apologize, but I couldn't generate a response.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
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
        },
      ]);
      setAttachments([]);
    }
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const SUGGESTIONS = [
    { icon: "📚", text: "Explain quantum mechanics simply" },
    { icon: "✏️", text: "Quiz me on World War II" },
    { icon: "🎯", text: "Create a study plan for finals" },
    { icon: "💡", text: "Help me understand calculus" },
  ];

  const canSend = (input.trim() || attachments.length > 0) && !isLoading;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt,.md,.csv"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />

      <div className="chat-page">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <h1>
              {/* <Sparkles size={18} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} /> */}
            EasyRecall</h1>
            <p>Your personal learning companion</p>
          </div>
          <div className="topbar-right">
            <button className="chat-reset-btn" onClick={handleReset}>
              <RotateCcw size={14} /> Reset Chat
            </button>
          </div>
        </div>

        {/* Chat container */}
        <div
          className={`chat-container${isDragging ? " chat-container--dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="chat-drop-overlay">
              <div className="chat-drop-overlay-inner">
                <ImageIcon size={40} />
                <span>Drop files here</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
                <div className="chat-message-avatar">
                  {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className="chat-message-content">
                  {/* Attachments in message */}
                  {msg.attachments?.length > 0 && (
                    <div className="chat-message-attachments">
                      {msg.attachments.map((att) =>
                        att.type === "image" ? (
                          <img key={att.id} src={att.preview} alt={att.name} className="chat-msg-img" />
                        ) : (
                          <div key={att.id} className="chat-msg-file">
                            <FileText size={14} />
                            <span>{att.name}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {msg.content && (
                    <div className="chat-message-text">{msg.content}</div>
                  )}
                  <div className="chat-message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message-avatar"><Bot size={18} /></div>
                <div className="chat-typing">
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="chat-suggestions">
              <div className="chat-suggestions-title">
                <Sparkles size={13} /> Try asking...
              </div>
              <div className="chat-suggestions-grid">
                {SUGGESTIONS.map((s, idx) => (
                  <button key={idx} className="chat-suggestion-card" onClick={() => setInput(s.text)}>
                    <span className="chat-suggestion-icon">{s.icon}</span>
                    <span className="chat-suggestion-text">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="chat-input-container">
            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="chat-attachments-preview">
                {attachments.map((att) => (
                  <div key={att.id} className="chat-attachment-chip">
                    {att.type === "image" ? (
                      <img src={att.preview} alt={att.name} className="chat-attachment-thumb" />
                    ) : (
                      <div className="chat-attachment-file-icon">
                        <FileText size={16} />
                      </div>
                    )}
                    <div className="chat-attachment-info">
                      <span className="chat-attachment-name">{att.name}</span>
                      <span className="chat-attachment-size">{formatSize(att.size)}</span>
                    </div>
                    <button className="chat-attachment-remove" onClick={() => removeAttachment(att.id)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="chat-input-wrapper">
              {/* Plus / attach button */}
              <button
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file or image"
                type="button"
              >
                <Plus size={20} />
              </button>

              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />

              <button className="chat-send-btn" onClick={handleSend} disabled={!canSend}>
                {isLoading ? <Loader2 size={20} className="chat-loading-icon" /> : <Send size={20} />}
              </button>
            </div>

            {/* <div className="chat-input-hint">
              <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> new line · <kbd>Ctrl+V</kbd> paste image · drag & drop images/files
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}