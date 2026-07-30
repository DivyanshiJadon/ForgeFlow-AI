import React, { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
  Check,
  MessageCircle,
} from "lucide-react";
import API from "../services/api";

function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function ChatHistorySidebar({
  boardId,
  activeSessionId,
  onSelectSession,
  onNewSession,
  isOpen,
  onClose,
  refreshKey,
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const sessionsEndpoint = () => boardId
    ? `/boards/${boardId}/chat-sessions`
    : '/chat-sessions';

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await API.get(sessionsEndpoint());
      setSessions(res.data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh when panel opens, board changes, or parent bumps refreshKey
  useEffect(() => {
    if (!isOpen) return;
    fetchSessions();
  }, [isOpen, boardId, refreshKey]);

  // Also refresh when activeSessionId changes
  useEffect(() => {
    if (activeSessionId && isOpen) {
      fetchSessions();
    }
  }, [activeSessionId]);

  const handleNewSession = async () => {
    try {
      const res = await API.post(sessionsEndpoint(), {
        title: "New Chat",
      });
      setSessions((prev) => [res.data, ...prev]);
      onNewSession(res.data);
    } catch {}
  };

  const handleRename = async (sessionId) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await API.put(`/chat-sessions/${sessionId}`, { title: editTitle.trim() });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, title: editTitle.trim() } : s
        )
      );
      setEditingId(null);
    } catch {
      setEditingId(null);
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await API.delete(`/chat-sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setDeletingId(null);
      if (activeSessionId === sessionId) {
        onNewSession(null);
      }
    } catch {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          History
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={handleNewSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="text-center py-8 text-[11px] text-slate-400 italic">
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-3">
            <MessageCircle className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-[11px] text-slate-400">No conversations yet</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => !editingId && onSelectSession(session)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all mb-1 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                <div className="flex-1 min-w-0">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(session.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleRename(session.id); }} className="p-0.5 text-emerald-500 hover:text-emerald-600">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="truncate font-medium">{session.title || "New Chat"}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {session.messages?.length || 0} msgs · {timeAgo(session.updated_at)}
                      </p>
                    </>
                  )}
                </div>

                {editingId !== session.id && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(session.id); setEditTitle(session.title || "New Chat"); }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {deletingId === session.id ? (
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDelete(session.id)} className="p-1 text-rose-500 hover:text-rose-600 rounded" title="Confirm">
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setDeletingId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Cancel">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingId(session.id); }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
