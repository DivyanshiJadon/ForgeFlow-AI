import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Calendar,
  Tag as TagIcon,
  User,
  MessageSquare,
  Send,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";

export default function TaskDetailsModal() {
  const {
    selectedCard,
    setSelectedCard,
    updateCard,
    deleteCard,
    addComment,
    activeBoard,
  } = useBoard();

  if (!selectedCard) return null;

  const [title, setTitle] = useState(selectedCard.title || "");
  const [description, setDescription] = useState(selectedCard.description || "");
  const [priority, setPriority] = useState(selectedCard.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(selectedCard.due_date ? selectedCard.due_date.substring(0, 10) : "");
  const [memberId, setMemberId] = useState(selectedCard.member_id || "");
  
  // Comment Form
  const [commentAuthor, setCommentAuthor] = useState("Alex Developer");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(selectedCard.title || "");
    setDescription(selectedCard.description || "");
    setPriority(selectedCard.priority || "MEDIUM");
    setDueDate(selectedCard.due_date ? selectedCard.due_date.substring(0, 10) : "");
    setMemberId(selectedCard.member_id || "");
  }, [selectedCard]);

  const handleSaveCard = async () => {
    setIsSaving(true);
    try {
      await updateCard(selectedCard.id, {
        title,
        description,
        priority,
        due_date: dueDate || null,
        member_id: memberId ? Number(memberId) : null,
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(selectedCard.id, {
        author_name: commentAuthor.trim(),
        content: commentText.trim(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex-1 pr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveCard}
              className="w-full text-lg font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-1"
              placeholder="Task Title"
            />
            <p className="text-xs text-slate-400 mt-1">
              In list: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedCard.list_name || "Kanban Column"}</span>
            </p>
          </div>
          
          <button
            onClick={() => setSelectedCard(null)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  updateCard(selectedCard.id, { priority: e.target.value });
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  updateCard(selectedCard.id, { due_date: e.target.value });
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Assigned Member */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Assignee
              </label>
              <select
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  updateCard(selectedCard.id, { member_id: e.target.value ? Number(e.target.value) : null });
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {activeBoard?.members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveCard}
              placeholder="Add detailed instructions, specs, or context..."
              className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          {/* Comments Feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Activity & Discussion
              </h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-1/3 bg-slate-100 dark:bg-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-800 dark:text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* List of comments */}
            <div className="space-y-3">
              {selectedCard.comments && selectedCard.comments.length > 0 ? (
                selectedCard.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {comment.author_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-slate-400 italic">
                  No comments yet. Start the conversation above!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Delete this card permanently?")) {
                deleteCard(selectedCard.id);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-2 rounded-lg font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Task
          </button>

          <button
            onClick={() => setSelectedCard(null)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
