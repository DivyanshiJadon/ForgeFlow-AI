import React, { useState } from "react";
import { Plus, Check, X, Filter, FolderKanban, Sparkles } from "lucide-react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Column from "../components/Column";
import { useBoard } from "../context/BoardContext";

export default function Board() {
  const {
    activeBoard,
    createList,
    searchQuery,
    priorityFilter,
    boardLoading,
    setIsAISidebarOpen,
    moveCard,
  } = useBoard();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  if (boardLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!activeBoard) return null;

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    await createList(newColumnName.trim());
    setNewColumnName("");
    setIsAddingColumn(false);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const cardId = Number(draggableId);
    const targetListId = Number(destination.droppableId);
    const newPosition = destination.index + 1;
    moveCard(cardId, targetListId, newPosition);
  };

  // Filter columns and cards based on search and priority
  const processedLists = activeBoard.lists
    ? activeBoard.lists.map((list) => {
        let filteredCards = list.cards || [];

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filteredCards = filteredCards.filter(
            (c) =>
              c.title?.toLowerCase().includes(q) ||
              c.description?.toLowerCase().includes(q)
          );
        }

        if (priorityFilter !== "ALL") {
          filteredCards = filteredCards.filter(
            (c) => c.priority?.toUpperCase() === priorityFilter
          );
        }

        return {
          ...list,
          cards: filteredCards,
        };
      })
    : [];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Board Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs"
            style={{ backgroundColor: activeBoard.color || "#6366f1" }}
          />
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {activeBoard.name}
          </h2>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {processedLists.length} Columns
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(searchQuery || priorityFilter !== "ALL") && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg">
              <Filter className="h-3.5 w-3.5" />
              <span>
                Filtered view ({priorityFilter !== "ALL" ? priorityFilter : ""}{" "}
                {searchQuery ? `"${searchQuery}"` : ""})
              </span>
            </div>
          )}

          <button
            onClick={() => setIsAISidebarOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Copilot Suggestions</span>
          </button>
        </div>
      </div>

      {/* Main Board Columns Area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-6 flex items-start gap-4">
          {processedLists.map((list) => (
            <Column key={list.id} list={list} />
          ))}

          {/* Add Column Button / Form */}
          <div className="w-80 flex-shrink-0">
            {isAddingColumn ? (
              <form
                onSubmit={handleAddColumn}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-500 shadow-md space-y-3"
              >
                <input
                  type="text"
                  placeholder="Column name (e.g. Code Review)..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newColumnName.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    Add Column
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Column</span>
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
