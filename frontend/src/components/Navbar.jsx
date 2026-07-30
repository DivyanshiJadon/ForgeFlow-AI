import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Sun,
  Moon,
  Search,
  Filter,
  LayoutGrid,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const {
    activeBoard,
    boards,
    activeBoardId,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    isDark,
    toggleTheme,
    isAISidebarOpen,
    toggleAISidebar,
    setIsAddTaskModalOpen,
  } = useBoard();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnWorkspace = location.pathname.startsWith("/workspace/");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-navbar transition-colors">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <span className="font-black text-xl tracking-tighter text-white font-mono select-none">FF</span>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">ForgeFlow AI</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">AI</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">AI-Powered Project & Sprint Management</p>
            </div>
          </div>

          {isOnWorkspace && boards.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Workspace:</span>
              <select
                value={activeBoardId || ""}
                onChange={(e) => navigate(`/workspace/${e.target.value}`)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
          {isOnWorkspace && (
            <>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none pr-1 cursor-pointer"
                >
                  <option value="ALL" className="dark:bg-slate-900">All</option>
                  <option value="HIGH" className="dark:bg-slate-900">High</option>
                  <option value="MEDIUM" className="dark:bg-slate-900">Medium</option>
                  <option value="LOW" className="dark:bg-slate-900">Low</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isOnWorkspace && activeBoard && (
            <button
              onClick={() => setIsAddTaskModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={toggleAISidebar}
            className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer ${
              isAISidebarOpen
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100"
            }`}
          >
            <Sparkles className="h-4 w-4 animate-pulse text-purple-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <User className="h-3.5 w-3.5" /> Profile
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
