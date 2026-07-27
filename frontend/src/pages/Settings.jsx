import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBoard } from "../context/BoardContext";
import { ArrowLeft, Moon, Sun, LogOut, Trash2 } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useBoard();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>

        <h1 className="text-xl font-black text-slate-900 dark:text-white mb-6">Settings</h1>

        <div className="space-y-4">
          {/* Appearance */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Appearance</h3>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Moon className="h-4 w-4 text-purple-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {isDark ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-[10px] text-slate-400">Currently using {isDark ? "dark" : "light"} theme</p>
              </div>
            </button>
          </div>

          {/* Account */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Account</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 mb-0.5">Signed in as</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
