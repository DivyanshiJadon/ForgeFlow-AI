import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Sparkles,
  Rocket,
  Layers,
  Bug,
  Megaphone,
  LayoutGrid,
  Kanban,
  Check,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { boards, createBoard, fetchBoards } = useBoard();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("sprint");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = [
    { id: "blank", name: "Blank", desc: "Clean slate with To Do, In Progress, Done.", icon: LayoutGrid, columns: ["To Do", "In Progress", "Done"] },
    { id: "sprint", name: "Sprint", desc: "Agile sprint workflow.", icon: Rocket, columns: ["Sprint Backlog", "In Progress", "In Review", "Released"], recommended: true },
    { id: "roadmap", name: "Roadmap", desc: "Feature planning pipeline.", icon: Layers, columns: ["Q1 Goals", "In Research", "In Build", "Live"] },
    { id: "bugs", name: "Bug Tracker", desc: "Triage and fix defects.", icon: Bug, columns: ["Triage", "Investigating", "In Fix", "QA Passed"] },
    { id: "marketing", name: "Marketing", desc: "Content launch pipeline.", icon: Megaphone, columns: ["Ideas", "Drafting", "Review", "Published"] },
  ];

  const colorOptions = [
    "#6366f1", "#8b5cf6", "#10b981", "#f43f5e", "#f59e0b", "#06b6d4",
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    const finalName = workspaceName.trim() || templates.find((t) => t.id === selectedTemplate)?.name || "New Workspace";
    setIsSubmitting(true);
    try {
      await createBoard({ name: finalName, template: selectedTemplate, color: selectedColor });
      setShowCreateModal(false);
      setWorkspaceName("");
      setSelectedTemplate("sprint");
      setSelectedColor("#6366f1");
      fetchBoards();
    } catch {
      // error handled by createBoard
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWorkspace = (id) => {
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Your Workspaces
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user?.name && `Welcome back, ${user.name}. `}You have{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {boards.length} workspace{boards.length !== 1 ? "s" : ""}
              </span>.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </button>
        </div>

        {/* Workspace Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 mb-4">
              <Kanban className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              No workspaces yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Create your first workspace to get started with SprintForge AI.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => openWorkspace(board.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: board.color || "#6366f1" }}
                  >
                    <Kanban className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {board.name}
                </h3>
                {board.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {board.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  {board.created_at && (
                    <span>
                      Created {new Date(board.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-purple-500/30 transition-all pointer-events-none" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Create Workspace
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-5">
              {/* Workspace Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Core Sprint"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Theme Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        selectedColor === c ? "ring-2 ring-offset-2 ring-purple-500 scale-110" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {selectedColor === c && <Check className="h-3 w-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((tpl) => {
                    const IconComp = tpl.icon;
                    const isActive = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 ring-1 ring-purple-500/20"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <IconComp className={`h-3.5 w-3.5 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
                          <span className={`text-[11px] font-bold ${isActive ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-slate-300"}`}>
                            {tpl.name}
                            {tpl.recommended && (
                              <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-purple-600 text-white">REC</span>
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{tpl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
