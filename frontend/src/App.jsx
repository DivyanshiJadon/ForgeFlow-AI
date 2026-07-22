import React, { useEffect } from "react";
import { BoardProvider, useBoard } from "./context/BoardContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Board from "./pages/Board";
import Dashboard from "./pages/Dashboard";
import TaskDetailsModal from "./components/TaskDetailsModal";
import AddTaskModal from "./components/AddTaskModal";
import AISidePanel from "./components/AISidePanel";

function AppContent() {
  const {
    boards,
    activeBoard,
    isOnboardingOpen,
    loading,
    toast,
    toggleAISidebar,
    setIsAddTaskModalOpen,
    setSelectedCard,
    setIsAISidebarOpen,
  } = useBoard();

  // Keyboard Shortcuts (Linear / Cursor style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K or Cmd/Ctrl + J -> Toggle AI Copilot
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "j")) {
        e.preventDefault();
        toggleAISidebar();
      }
      // Cmd/Ctrl + N -> Open New Task Modal
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (activeBoard) {
          setIsAddTaskModalOpen(true);
        }
      }
      // Escape -> Close active modals
      if (e.key === "Escape") {
        setSelectedCard(null);
        setIsAddTaskModalOpen(false);
        setIsAISidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBoard, toggleAISidebar, setIsAddTaskModalOpen, setSelectedCard, setIsAISidebarOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce ${
            toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">
                  Loading ForgeFlow AI...
                </p>
              </div>
            </div>
          ) : isOnboardingOpen || boards.length === 0 || !activeBoard ? (
            <Dashboard />
          ) : (
            <Board />
          )}
        </main>

        {/* AI Copilot Side Panel */}
        <AISidePanel />
      </div>

      {/* Interactive Modals */}
      <TaskDetailsModal />
      <AddTaskModal />
    </div>
  );
}

export default function App() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  );
}