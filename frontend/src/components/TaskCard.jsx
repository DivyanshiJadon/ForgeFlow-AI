import React, { useState } from "react";
import {
  Calendar,
  MessageSquare,
  Clock,
  AlertCircle,
  Tag as TagIcon,
  CheckSquare,
  Trash2,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";

export default function TaskCard({ card, listId }) {
  const { setSelectedCard, deleteCard } = useBoard();
  const [isDeleting, setIsDeleting] = useState(false);

  const getPriorityStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "LOW":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    if (!confirm(`Delete "${card.title}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteCard(card.id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => setSelectedCard(card)}
      className="group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all duration-200 cursor-pointer select-none"
    >
      {/* Quick Delete Button - Top Right on Hover */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute -top-2 -right-2 z-10 p-1.5 rounded-lg bg-rose-500 text-white shadow-md opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all duration-150 disabled:opacity-50 cursor-pointer"
        title="Delete task"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Priority & Top Meta */}
      <div className="flex items-center justify-between mb-2">
        {card.priority && (
          <span
            className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md border ${getPriorityStyle(
              card.priority
            )}`}
          >
            {card.priority}
          </span>
        )}

        {/* Due Date Indicator */}
        {card.due_date && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
              isOverdue
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>{new Date(card.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1.5 pr-4">
        {card.title}
      </h4>

      {/* Description Snippet */}
      {card.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-white shadow-xs"
              style={{ backgroundColor: tag.color || "#64748b" }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer Details: Assigned Member & Comments */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-slate-400">
        <div className="flex items-center gap-2">
          {card.member ? (
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: card.member.avatar_color || "#6366f1" }}
              title={card.member.name}
            >
              {card.member.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] text-slate-400">
              ?
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          {card.comments && card.comments.length > 0 && (
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">{card.comments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
