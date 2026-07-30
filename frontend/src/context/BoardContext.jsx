import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || false;
  });
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  const [selectedCard, setSelectedCard] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [targetListIdForNewTask, setTargetListIdForNewTask] = useState(null);

  const [toast, setToast] = useState(null);
  const [allTags, setAllTags] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const toggleAISidebar = () => setIsAISidebarOpen((prev) => !prev);

  const selectBoard = (boardId) => {
    setActiveBoardId(boardId);
  };

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/boards");
      setBoards(res.data);
    } catch (err) {
      console.error("Error fetching boards:", err);
      showToast("Failed to load workspaces", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await API.get("/tags");
      setAllTags(res.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  }, []);

  const addMember = async (boardId, { name, email }) => {
    try {
      const res = await API.post(`/boards/${boardId}/members`, { name, email });
      fetchActiveBoardDetails(boardId);
      showToast(`Member "${name}" added`);
      return res.data;
    } catch (err) {
      console.error("Error adding member:", err);
      showToast("Failed to add member", "error");
      throw err;
    }
  };

  const fetchActiveBoardDetails = useCallback(async (boardId) => {
    if (!boardId) return;
    setBoardLoading(true);
    try {
      const res = await API.get(`/boards/${boardId}`);
      setActiveBoard(res.data);
    } catch (err) {
      console.error("Error fetching board details:", err);
      showToast("Failed to load workspace details", "error");
    } finally {
      setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
    fetchTags();
  }, [fetchBoards, fetchTags]);

  useEffect(() => {
    if (activeBoardId) {
      fetchActiveBoardDetails(activeBoardId);
    }
  }, [activeBoardId, fetchActiveBoardDetails]);

  const createBoard = async ({ name, color = "#6366f1", icon = "kanban", template = "blank" }) => {
    try {
      const res = await API.post("/boards", { name, color, icon, template });
      const newBoard = res.data;
      setBoards((prev) => [...prev, newBoard]);
      showToast(`Workspace "${newBoard.name}" created successfully.`);
      return newBoard;
    } catch (err) {
      console.error("Error creating board:", err);
      showToast("Failed to create workspace: " + (err.response?.data?.message || err.message), "error");
      throw err;
    }
  };

  const deleteBoard = async (boardId) => {
    try {
      await API.delete(`/boards/${boardId}`);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      if (activeBoardId === boardId) {
        setActiveBoardId(null);
        setActiveBoard(null);
      }
      showToast("Workspace deleted");
    } catch (err) {
      console.error("Error deleting board:", err);
      showToast("Failed to delete workspace", "error");
    }
  };

  const createList = async (name) => {
    if (!activeBoardId || !name.trim()) return;
    try {
      const res = await API.post("/lists", {
        board_id: activeBoardId,
        name: name.trim(),
        position: activeBoard?.lists ? activeBoard.lists.length + 1 : 1,
      });
      fetchActiveBoardDetails(activeBoardId);
      showToast(`Column "${res.data.name}" added`);
    } catch (err) {
      console.error("Error creating list:", err);
      showToast("Failed to add column", "error");
    }
  };

  const updateList = async (listId, data) => {
    try {
      await API.put(`/lists/${listId}`, data);
      fetchActiveBoardDetails(activeBoardId);
    } catch (err) {
      console.error("Error updating list:", err);
      showToast("Failed to update column", "error");
    }
  };

  const deleteList = async (listId) => {
    try {
      await API.delete(`/lists/${listId}`);
      fetchActiveBoardDetails(activeBoardId);
      showToast("Column deleted");
    } catch (err) {
      console.error("Error deleting list:", err);
      showToast("Failed to delete column", "error");
    }
  };

  const createCard = async (cardData) => {
    try {
      const res = await API.post("/cards", cardData);
      fetchActiveBoardDetails(activeBoardId);
      showToast("Task created successfully!");
      return res.data;
    } catch (err) {
      console.error("Error creating task:", err);
      showToast("Failed to create task", "error");
      throw err;
    }
  };

  const updateCard = async (cardId, cardData) => {
    try {
      const res = await API.put(`/cards/${cardId}`, cardData);
      fetchActiveBoardDetails(activeBoardId);
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard(res.data);
      }
      showToast("Task updated");
      return res.data;
    } catch (err) {
      console.error("Error updating task:", err);
      showToast("Failed to update task", "error");
      throw err;
    }
  };

  const deleteCard = async (cardId) => {
    try {
      await API.delete(`/cards/${cardId}`);
      fetchActiveBoardDetails(activeBoardId);
      if (selectedCard?.id === cardId) {
        setSelectedCard(null);
      }
      showToast("Task deleted");
    } catch (err) {
      console.error("Error deleting task:", err);
      showToast("Failed to delete task", "error");
    }
  };

  const moveCard = async (cardId, targetListId, newPosition) => {
    setActiveBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      let movedCard = null;
      const updatedLists = prevBoard.lists.map((list) => {
        const found = list.cards?.find((c) => c.id === cardId);
        if (found) movedCard = { ...found, board_list_id: targetListId };
        return { ...list, cards: list.cards?.filter((c) => c.id !== cardId) || [] };
      });
      if (!movedCard) return prevBoard;
      return {
        ...prevBoard,
        lists: updatedLists.map((list) => {
          if (list.id === targetListId) {
            const cards = [...(list.cards || [])];
            cards.splice(newPosition - 1, 0, movedCard);
            return { ...list, cards };
          }
          return list;
        }),
      };
    });
    try {
      await API.post(`/cards/${cardId}/reorder`, {
        board_list_id: targetListId,
        position: newPosition,
      });
    } catch (err) {
      console.error("Error reordering card:", err);
      fetchActiveBoardDetails(activeBoardId);
    }
  };

  const addComment = async (cardId, commentData) => {
    try {
      const res = await API.post(`/cards/${cardId}/comments`, commentData);
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard((prev) => ({
          ...prev,
          comments: [res.data, ...(prev.comments || [])],
        }));
      }
      fetchActiveBoardDetails(activeBoardId);
      showToast("Comment added");
      return res.data;
    } catch (err) {
      console.error("Error adding comment:", err);
      showToast("Failed to add comment", "error");
      throw err;
    }
  };

  return (
    <BoardContext.Provider
      value={{
        boards, activeBoardId, setActiveBoardId, selectBoard, activeBoard,
        loading, boardLoading, searchQuery, setSearchQuery,
        priorityFilter, setPriorityFilter, isDark, toggleTheme,
        isAISidebarOpen, setIsAISidebarOpen, toggleAISidebar,
        selectedCard, setSelectedCard, isAddTaskModalOpen, setIsAddTaskModalOpen,
        targetListIdForNewTask, setTargetListIdForNewTask,
        toast, showToast, fetchBoards, fetchActiveBoardDetails, fetchTags,
        createBoard, deleteBoard, createList, updateList, deleteList,
        createCard, updateCard, deleteCard, moveCard, addComment,
        allTags, addMember,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => useContext(BoardContext);
