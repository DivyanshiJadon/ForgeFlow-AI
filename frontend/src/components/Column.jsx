import React, { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Edit2, Check, X } from "lucide-react";
import TaskCard from "./TaskCard";
import { useBoard } from "../context/BoardContext";

export default function Column({ list }) {
  const {
    deleteList,
    updateList,
    createCard,
    setIsAddTaskModalOpen,
    setTargetListIdForNewTask,
  } = useBoard();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.name);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const handleUpdateTitle = async () => {
    if (title.trim() && title !== list.name) {
      await updateList(list.id, { name: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createCard({
        board_list_id: list.id,
        title: newTaskTitle.trim(),
        priority: "MEDIUM",
      });
      setNewTaskTitle("");
      setIsQuickAddOpen(false);
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleOpenFullModal = () => {
    setTargetListIdForNewTask(list.id);
    setIsAddTaskModalOpen(true);
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 max-h-[calc(100vh-10rem)] shadow-xs">
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 px-2 py-1 rounded border border-indigo-500 focus:outline-none w-full"
              />
              <button
                onClick={handleUpdateTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {list.name}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {list.cards ? list.cards.length : 0}
              </span>
            </>
          )}
        </div>

        {/* Column Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-7 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-20"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Rename Column
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete column "${list.name}"?`)) {
                    deleteList(list.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Column
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Scrollable Area */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[120px]">
        {list.cards && list.cards.length > 0 ? (
          list.cards.map((card) => <TaskCard key={card.id} card={card} listId={list.id} />)
        ) : (
          <div className="h-24 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-[11px] text-slate-400">
            No cards in this list
          </div>
        )}
      </div>

      {/* Column Footer: Add Card */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60">
        {isQuickAddOpen ? (
          <form onSubmit={handleQuickAdd} className="space-y-2">
            <input
              type="text"
              placeholder="Enter card title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
              className="w-full bg-white dark:bg-slate-800 text-xs p-2.5 rounded-xl border border-indigo-500 focus:outline-none text-slate-800 dark:text-slate-100"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs"
              >
                Add Card
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleOpenFullModal}
                  className="px-2 py-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  More Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-dashed border-slate-300/80 dark:border-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span>Add Card</span>
          </button>
        )}
      </div>
    </div>
  );
}
