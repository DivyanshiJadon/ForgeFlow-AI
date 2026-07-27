import React, { useEffect } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BoardProvider, useBoard } from "./context/BoardContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AISidePanel from "./components/AISidePanel";
import TaskDetailsModal from "./components/TaskDetailsModal";
import AddTaskModal from "./components/AddTaskModal";

function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectBoard, activeBoard, loading, boardLoading } = useBoard();

  useEffect(() => {
    if (id) {
      selectBoard(parseInt(id, 10));
    }
  }, [id, selectBoard]);

  if (loading || boardLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">Workspace not found.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Board />;
}

function AppLayout() {
  const {
    toast,
    toggleAISidebar,
    setIsAddTaskModalOpen,
    setSelectedCard,
    setIsAISidebarOpen,
    activeBoard,
  } = useBoard();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "j")) {
        e.preventDefault();
        toggleAISidebar();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (activeBoard) {
          setIsAddTaskModalOpen(true);
        }
      }
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
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace/:id" element={<WorkspacePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <AISidePanel />
      </div>
      <TaskDetailsModal />
      <AddTaskModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <BoardProvider>
                <AppLayout />
              </BoardProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
