import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Zap,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Code2,
  ListTodo,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Calendar,
  Layers,
  BarChart3,
  CheckSquare,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import API from "../api";

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
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      });

      const replyText = res.data.reply || res.data.message || "Request processed successfully.";
      const aiMsg = { id: Date.now() + 1, sender: "ai", text: replyText };
      setMessages((prev) => [...prev, aiMsg]);

      if (activeBoardId) {
        fetchActiveBoardDetails(activeBoardId);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const errMsg = err.response?.data?.message || err.message || "Connection failed";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: `⚠️ **Connection Error:** Unable to reach local Hermes API at \`http://localhost:11434/v1\`.\n\nPlease verify that Ollama/Hermes is active locally: \`ollama run qwen2.5-coder:latest\`.\n\n*Error details: ${errMsg}*`,
          isError: true,
        },
      ]);
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
  };

  const promptSuggestions = [
    {
      icon: BarChart3,
      title: "Board Summary",
      prompt: "Summarize workspace status and audit column bottlenecks.",
    },
    {
      icon: Calendar,
      title: "Sprint Planning",
      prompt: "Plan a 2-week Sprint timeline based on current workspace tasks.",
    },
    {
      icon: ListTodo,
      title: "Generate User Stories",
      prompt: "Generate detailed agile user stories with acceptance criteria.",
    },
    {
      icon: Lightbulb,
      title: "Task Breakdown",
      prompt: "Break down an Authentication & Security feature into actionable tasks.",
    },
    {
      icon: Layers,
      title: "Prioritize Backlog",
      prompt: "Prioritize the current workspace backlog by business impact.",
    },
    {
      icon: CheckSquare,
      title: "Suggest Next Task",
      prompt: "Suggest the next highest priority task to pull into progress.",
    },
  ];

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                SprintForge Copilot
              </h3>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Hermes LLM
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {activeBoard ? `Context: ${activeBoard.name}` : "Global Assistant"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsAISidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          /* First-Run / Zero State */
          <div className="h-full flex flex-col justify-center items-center text-center px-2 py-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-purple-500/20 ring-4 ring-purple-100 dark:ring-purple-950">
              <Bot className="h-6 w-6" />
            </div>

            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
              SprintForge Cursor Copilot
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed max-w-xs">
              Connected to local Hermes LLM stack. Ask Copilot to plan sprints, break down features, or audit workloads.
            </p>

            {/* Prompt Chips */}
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
          /* Active Chat Messages */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 text-xs ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs">
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

                {/* Quick Copy / Action Controls */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 right-2 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1 shadow-xs">
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                  {msg.sender === "user" && (
                    <button
                      onClick={() => handleSendMessage(msg.text)}
                      className="text-slate-400 hover:text-indigo-500 p-0.5"
                      title="Retry prompt"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="h-7 w-7 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
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
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-bl-none text-slate-400 italic flex items-center gap-2">
              <span className="animate-pulse">Hermes is reasoning...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Copilot to plan, break down tasks..."
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
    </aside>
  );
}
