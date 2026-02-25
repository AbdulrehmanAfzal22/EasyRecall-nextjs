"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, Loader2, RotateCcw, Plus, X, FileText, ImageIcon, Menu, History, MessageSquare, Trash2 } from "lucide-react";
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
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // History & UI state
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", message: "", onConfirm: null });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(parsed);
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

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

  // ── Custom Modal ────────────────────────────────────────────────────
  const openModal = (title, message, onConfirm) => {
    setModalConfig({ title, message, onConfirm });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleModalConfirm = () => {
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
    closeModal();
  };

  // ── Chat History Functions ──────────────────────────────────────────
  const saveCurrentChat = () => {
    if (messages.length <= 1) return; // Don't save if only welcome message

    const chatTitle = messages[1]?.content?.slice(0, 50) || "New Chat";
    const newChat = {
      id: currentChatId || Date.now().toString(),
      title: chatTitle,
      messages: messages,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => {
      const filtered = prev.filter((c) => c.id !== newChat.id);
      return [newChat, ...filtered].slice(0, 20); // Keep max 20 chats
    });

    setCurrentChatId(newChat.id);
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
      setShowHistory(false);
    }
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    openModal(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      () => {
        setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
        if (currentChatId === chatId) {
          startNewChat();
        }
      }
    );
  };

  const startNewChat = () => {
    // Save current chat before starting new one
    saveCurrentChat();

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm your AI study assistant. I can help you understand concepts, answer questions, create study plans, or quiz you on any topic. What would you like to learn today?",
        timestamp: new Date(),
      },
    ]);
    setCurrentChatId(null);
    setAttachments([]);
    setShowHistory(false);
  };

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

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.content || "I apologize, but I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-save chat after receiving response
      setTimeout(() => saveCurrentChat(), 500);
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
    openModal(
      "Reset Chat",
      "Clear all messages in the current chat? This action cannot be undone.",
      () => {
        startNewChat();
      }
    );
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

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

      {/* Custom Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modalConfig.title}</h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">{modalConfig.message}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleModalConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-page">
        {/* History Sidebar */}
        <div className={`chat-history-sidebar ${showHistory ? "chat-history-sidebar--open" : ""}`}>
          <div className="chat-history-header">
            <div className="chat-history-title">
              <History size={18} />
              <span>Chat History</span>
            </div>
            <button className="chat-history-close" onClick={() => setShowHistory(false)}>
              <X size={18} />
            </button>
          </div>

          <button className="chat-new-btn" onClick={startNewChat}>
            <Plus size={16} />
            New Chat
          </button>

          <div className="chat-history-list">
            {chatHistory.length === 0 ? (
              <div className="chat-history-empty">
                <MessageSquare size={32} opacity={0.3} />
                <p>No chat history yet</p>
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-history-item ${currentChatId === chat.id ? "chat-history-item--active" : ""}`}
                  onClick={() => loadChat(chat.id)}
                >
                  <div className="chat-history-item-content">
                    <div className="chat-history-item-title">{chat.title}</div>
                    <div className="chat-history-item-time">{formatDate(chat.timestamp)}</div>
                  </div>
                  <button
                    className="chat-history-item-delete"
                    onClick={(e) => deleteChat(chat.id, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History Overlay (for mobile) */}
        {showHistory && (
          <div className="chat-history-overlay" onClick={() => setShowHistory(false)} />
        )}

        {/* Main Chat */}
        <div className="chat-main">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-left">
              <button className="chat-hamburger" onClick={() => setShowHistory(!showHistory)}>
                <Menu size={20} />
              </button>
              <h1>EasyRecall</h1>
              <p>Your personal learning companion</p>
            </div>
            <div className="topbar-right">
              <button className="chat-reset-btn" onClick={handleReset}>
                <RotateCcw size={14} /> Reset
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
                    {msg.content && <div className="chat-message-text">{msg.content}</div>}
                    <div className="chat-message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}