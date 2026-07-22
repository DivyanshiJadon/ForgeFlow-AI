import React, { useState } from "react";
import {
  Kanban,
  Layers,
  Rocket,
  Bug,
  Megaphone,
  Plus,
  Sparkles,
  ArrowRight,
  Check,
  LayoutGrid,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";

export default function Dashboard() {
  const { createBoard, setIsOnboardingOpen } = useBoard();

  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("sprint");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [selectedIcon, setSelectedIcon] = useState("kanban");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templates = [
    {
      id: "blank",
      name: "Blank Workspace",
      desc: "Clean slate with standard To Do, In Progress, Done columns.",
      icon: LayoutGrid,
      columns: ["To Do", "In Progress", "Done"],
    },
    {
      id: "sprint",
      name: "Software Sprint",
      desc: "Agile sprint workflow for engineering teams.",
      icon: Rocket,
      columns: ["Sprint Backlog", "In Progress", "In Review", "Released"],
      recommended: true,
    },
    {
      id: "roadmap",
      name: "Product Roadmap",
      desc: "Strategic feature planning and release milestones.",
      icon: Layers,
      columns: ["Q1 Goals", "In Research", "In Build", "Live"],
    },
    {
      id: "bugs",
      name: "Bug Tracker",
      desc: "Triage and fix high priority software defects.",
      icon: Bug,
      columns: ["Triage", "Investigating", "In Fix", "QA Passed"],
    },
    {
      id: "marketing",
      name: "Marketing Campaign",
      desc: "Content strategy and launch execution pipeline.",
      icon: Megaphone,
      columns: ["Ideas", "Drafting", "Review", "Published"],
    },
  ];

  const colorOptions = [
    { name: "Indigo", hex: "#6366f1" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Cyan", hex: "#06b6d4" },
  ];

  const iconOptions = [
    { id: "kanban", Icon: Kanban },
    { id: "layers", Icon: Layers },
    { id: "rocket", Icon: Rocket },
    { id: "bug", Icon: Bug },
    { id: "megaphone", Icon: Megaphone },
  ];

  const handleLaunch = async (e) => {
    e.preventDefault();
    const finalName = workspaceName.trim() || templates.find((t) => t.id === selectedTemplate)?.name || "New Workspace";

    setIsSubmitting(true);
    try {
      await createBoard({
        name: finalName,
        template: selectedTemplate,
        color: selectedColor,
        icon: selectedIcon,
      });
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header Hero Banner */}
        <div className="relative p-8 md:p-10 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-300 mb-4 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>SprintForge Workspace Launcher</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Create your first AI-powered workspace
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              No demo clutter. Customize your workspace template, colors, and columns to fit your sprint goals.
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleLaunch} className="p-6 md:p-10 space-y-8">
          {/* Workspace Name & Styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Core Product Sprint"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Accent Color Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Theme Color
              </label>
              <div className="flex items-center gap-2 pt-1">
                {colorOptions.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                      selectedColor === c.hex ? "ring-2 ring-indigo-500 ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor === c.hex && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
              Select Workspace Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {templates.map((tpl) => {
                const IconComponent = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    {tpl.recommended && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                        Recommended
                      </span>
                    )}

                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                      {tpl.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {tpl.desc}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      {tpl.columns.map((col, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              You can add, edit, or remove columns anytime later.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isSubmitting ? "Launching..." : "Launch Workspace"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
