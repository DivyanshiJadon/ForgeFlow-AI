import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Calendar,
  Layers,
  BarChart3,
  CheckSquare,
  ListTodo,
  Lightbulb,
  WifiOff,
  MessageCircle,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import API from "../services/api";
import { generateOfflineResponse } from "../services/offlineAIService";
import ChatHistorySidebar from "./ChatHistorySidebar";

export default function AISidePanel() {
  const {
    isAISidebarOpen,
    setIsAISidebarOpen,
    activeBoard,
    showToast,
    fetchActiveBoardDetails,
    activeBoardId,
  } = useBoard();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [aiConfig, setAiConfig] = useState(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    API.get("/ai/config")
      .then((res) => setAiConfig(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAISidebarOpen) return;
    loadMostRecentSession();
  }, [isAISidebarOpen, activeBoardId]);

  const sessionsEndpoint = () => activeBoardId
    ? `/boards/${activeBoardId}/chat-sessions`
    : '/chat-sessions';

  const loadMostRecentSession = async () => {
    try {
      const res = await API.get(sessionsEndpoint());
      const sessions = res.data;
      if (sessions.length > 0) {
        const mostRecent = sessions[0];
        setActiveSessionId(mostRecent.id);
        setMessages(
          mostRecent.messages.map((m) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "ai",
            text: m.content,
          }))
        );
      } else {
        startNewSession();
      }
    } catch {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const startNewSession = async () => {
    try {
      const res = await API.post(sessionsEndpoint(), {
        title: "New Chat",
      });
      setActiveSessionId(res.data.id);
      setMessages([]);
      setBackendError(null);
      setHistoryVersion((v) => v + 1);
    } catch {
      setActiveSessionId(null);
    }
  };

  const bumpHistory = () => setHistoryVersion((v) => v + 1);

  const handleSelectSession = async (session) => {
    setActiveSessionId(session.id);
    try {
      const res = await API.get(`/chat-sessions/${session.id}`);
      setMessages(
        res.data.messages.map((m) => ({
          id: m.id,
          sender: m.role === "user" ? "user" : "ai",
          text: m.content,
        }))
      );
    } catch {
      setMessages([]);
    }
  };

  const handleNewSessionFromHistory = (session) => {
    if (session) {
      setActiveSessionId(session.id);
      setMessages([]);
    } else {
      startNewSession();
    }
  };

  if (!isAISidebarOpen) return null;

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: "user", text: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage("");
    setIsLoading(true);

    try {
      const res = await API.post("/ai/chat", {
        message: textToSend.trim(),
        board_id: activeBoard?.id || null,
        session_id: activeSessionId,
      });

      const replyText = res.data.reply || res.data.message || "Request processed successfully.";
      const aiMsg = { id: Date.now() + 1, sender: "ai", text: replyText };
      setMessages((prev) => [...prev, aiMsg]);
      setIsOfflineMode(false);

      if (res.data.session_id && res.data.session_id !== activeSessionId) {
        setActiveSessionId(res.data.session_id);
      }

      bumpHistory();
      if (activeBoardId) fetchActiveBoardDetails(activeBoardId);
    } catch (err) {
      const isNetworkError = !err.response && (err.code === "ERR_NETWORK" || err.message === "Network Error");
      const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");

      if (isNetworkError) {
        setIsOfflineMode(true);
        setBackendError("Backend server is not running.");
        const offlineReply = generateOfflineResponse(textToSend.trim(), activeBoard);
        setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", text: offlineReply }]);
      } else if (isTimeout) {
        setIsOfflineMode(true);
        setBackendError("AI response timed out.");
        setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", text: "⚠️ Request timed out.", isError: true }]);
      } else {
        const errMsg = err.response?.data?.reply || err.response?.data?.message || err.message || "Connection failed";
        setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "ai", text: errMsg, isError: true }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setBackendError(null);
    startNewSession();
  };

  const reconnectToBackend = async () => {
    setBackendError(null);
    try {
      await API.get("/boards", { timeout: 5000 });
      setIsOfflineMode(false);
      showToast("Backend reconnected!");
    } catch {
      setBackendError("Backend still unreachable.");
      showToast("Backend is still offline");
    }
  };

  const providerLabel = (() => {
    if (isOfflineMode) return "Offline";
    const p = aiConfig?.provider;
    if (p === "groq") return "Groq";
    if (p === "gemini") return "Gemini";
    if (p === "hermes") return "Hermes";
    if (p === "openai") return "OpenAI";
    return "AI";
  })();

  const promptSuggestions = [
    { icon: BarChart3, title: "Board Summary", prompt: "Summarize workspace status and audit column bottlenecks." },
    { icon: Calendar, title: "Sprint Planning", prompt: "Plan a 2-week Sprint timeline based on current workspace tasks." },
    { icon: ListTodo, title: "Generate User Stories", prompt: "Generate detailed agile user stories with acceptance criteria." },
    { icon: Lightbulb, title: "Task Breakdown", prompt: "Break down an Authentication & Security feature into actionable tasks." },
    { icon: Layers, title: "Prioritize Backlog", prompt: "Prioritize the current workspace backlog by business impact." },
    { icon: CheckSquare, title: "Suggest Next Task", prompt: "Suggest the next highest priority task to pull into progress." },
  ];

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full sm:w-[680px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300">
      <ChatHistorySidebar
        boardId={activeBoardId}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSessionFromHistory}
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        refreshKey={historyVersion}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  ForgeFlow AI Copilot
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {providerLabel}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {activeBoard ? activeBoard.name : "Global Assistant"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className={`p-1.5 rounded-lg transition-colors ${
                showChatHistory
                  ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
              title="Chat History"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              onClick={clearChat}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="New Chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsAISidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isOfflineMode && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300">
              <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{backendError || "Running in offline mode."}</span>
            </div>
            <button
              onClick={reconnectToBackend}
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors flex-shrink-0 cursor-pointer"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center px-2 py-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-purple-500/20 ring-4 ring-purple-100 dark:ring-purple-950">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                ForgeFlow AI Copilot
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed max-w-xs">
                Ask Copilot to plan sprints, break down features, or audit workloads.
              </p>
              <div className="w-full grid grid-cols-2 gap-2 text-left">
                {promptSuggestions.map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <IconComp className="h-3.5 w-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 block">
                        {item.prompt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 text-xs ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className="relative group max-w-[88%]">
                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                        : msg.isError
                        ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-bl-none"
                        : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/60 font-mono text-[11px]"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 right-2 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1 shadow-xs">
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      title="Copy"
                    >
                      {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                    {msg.sender === "user" && (
                      <button
                        onClick={() => handleSendMessage(msg.text)}
                        className="text-slate-400 hover:text-indigo-500 p-0.5"
                        title="Retry"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {msg.sender === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-bl-none text-slate-400 italic">
                <span className="animate-pulse">Reasoning...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
