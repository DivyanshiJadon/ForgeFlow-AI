import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Plus,
  Trash2,
  Activity,
  CheckCircle2,
  Clock,
  Kanban,
  Layers,
  Sparkles,
  ChevronRight,
  FolderKanban,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
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

function formatAction(action) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function Sidebar() {
  const {
    boards,
    activeBoardId,
    activeBoard,
    deleteBoard,
    toggleAISidebar,
  } = useBoard();
  const navigate = useNavigate();
  const [activities, setActivities] = React.useState([]);
  const [loadingActivities, setLoadingActivities] = React.useState(false);

  React.useEffect(() => {
    if (!activeBoardId) {
      setActivities([]);
      return;
    }
    setLoadingActivities(true);
    API.get(`/boards/${activeBoardId}/activities`)
      .then((res) => setActivities(res.data))
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, [activeBoardId]);

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Workspaces Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-indigo-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Workspaces
            </h2>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors cursor-pointer"
            title="Create Workspace"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {boards.length === 0 ? (
            <div className="text-center py-6 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                No active workspaces
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                + Create first workspace
              </button>
            </div>
          ) : (
            boards.map((b) => {
              const isActive = activeBoardId === b.id;
              const boardColor = b.color || "#6366f1";

              return (
                <div
                  key={b.id}
                  onClick={() => navigate(`/workspace/${b.id}`)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: boardColor }}
                    />
                    <span className="truncate">{b.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete workspace "${b.name}"?`)) {
                          deleteBoard(b.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                      title="Delete workspace"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats Summary Panel */}
      {activeBoard && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Sprint Overview
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Columns
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {activeBoard.lists ? activeBoard.lists.length : 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Cards
              </span>
              <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                {activeBoard.lists
                  ? activeBoard.lists.reduce((acc, l) => acc + (l.cards ? l.cards.length : 0), 0)
                  : 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Feed - Real API Data */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Activity
          </h3>
        </div>

        {loadingActivities ? (
          <div className="text-center py-6 text-[11px] text-slate-400 italic">
            Loading activity...
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 8).map((log) => (
              <div key={log.id} className="flex gap-2 text-xs">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    <span className="font-semibold">{log.user_name}</span>{" "}
                    {formatAction(log.action)}
                  </p>
                  {log.details && (
                    <p className="text-[10px] text-slate-400 line-clamp-1">{log.details}</p>
                  )}
                  <span className="text-[9px] text-slate-400">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[11px] text-slate-400 italic">
            {activeBoard ? "No activity logged yet" : "Select a workspace to view activity"}
          </div>
        )}
      </div>

      {/* AI Copilot Teaser Footer */}
      <div
        onClick={toggleAISidebar}
        className="p-3 m-3 rounded-xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-pink-900/10 border border-indigo-200/50 dark:border-indigo-800/30 cursor-pointer hover:border-indigo-400 transition-colors"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Hermes AI Integration
          </span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          Connected to local LLM stack. Click to open Copilot.
        </p>
      </div>
    </aside>
  );
}
