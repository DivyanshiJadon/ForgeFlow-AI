import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../api";

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);

  // Filters & UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || false;
  });
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  
  // Modals
  const [selectedCard, setSelectedCard] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [targetListIdForNewTask, setTargetListIdForNewTask] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Notifications / Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync Dark mode with DOM
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

  // Select board and navigate away from onboarding
  const selectBoard = (boardId) => {
    setActiveBoardId(boardId);
    setIsOnboardingOpen(false);
  };

  // Fetch all boards
  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/boards");
      const data = res.data;
      setBoards(data);
      
      // Auto-select first board if none active and boards exist
      if (data.length > 0 && !activeBoardId) {
        setActiveBoardId(data[0].id);
      } else if (data.length === 0) {
        setActiveBoardId(null);
        setActiveBoard(null);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
      showToast("Failed to load workspaces", "error");
    } finally {
      setLoading(false);
    }
  }, [activeBoardId]);

  // Fetch active board details (including lists & cards)
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
  }, []);

  useEffect(() => {
    if (activeBoardId) {
      fetchActiveBoardDetails(activeBoardId);
    }
  }, [activeBoardId, fetchActiveBoardDetails]);

  // Create Workspace / Board
  const createBoard = async ({ name, color = "#6366f1", icon = "kanban", template = "blank" }) => {
    try {
      const res = await API.post("/boards", { name, color, icon, template });
      const newBoard = res.data;
      setBoards((prev) => [...prev, newBoard]);
      setActiveBoardId(newBoard.id);
      setActiveBoard(newBoard); // Update active board directly for immediate navigation!
      setIsOnboardingOpen(false); // Close onboarding view
      showToast(`Workspace "${newBoard.name}" created successfully!`);
      return newBoard;
    } catch (err) {
      console.error("Error creating board:", err);
      showToast("Failed to create workspace: " + (err.response?.data?.message || err.message), "error");
      throw err;
    }
  };

  // Delete Board
  const deleteBoard = async (boardId) => {
    try {
      await API.delete(`/boards/${boardId}`);
      const updated = boards.filter((b) => b.id !== boardId);
      setBoards(updated);
      if (activeBoardId === boardId) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActiveBoardId(nextId);
        if (!nextId) {
          setActiveBoard(null);
          setIsOnboardingOpen(true);
        }
      }
      showToast("Workspace deleted");
    } catch (err) {
      console.error("Error deleting board:", err);
      showToast("Failed to delete workspace", "error");
    }
  };

  // Create List / Column
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

  // Update List
  const updateList = async (listId, data) => {
    try {
      await API.put(`/lists/${listId}`, data);
      fetchActiveBoardDetails(activeBoardId);
    } catch (err) {
      console.error("Error updating list:", err);
      showToast("Failed to update column", "error");
    }
  };

  // Delete List
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

  // Create Task / Card
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

  // Update Task / Card
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

  // Delete Task / Card
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

  // Move Card between lists or within same list (reorder)
  const moveCard = async (cardId, targetListId, newPosition) => {
    // Optimistic UI update
    setActiveBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      
      let movedCard = null;
      const updatedLists = prevBoard.lists.map((list) => {
        const found = list.cards?.find((c) => c.id === cardId);
        if (found) movedCard = { ...found, board_list_id: targetListId };
        return {
          ...list,
          cards: list.cards?.filter((c) => c.id !== cardId) || [],
        };
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

  // Add Comment to Card
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
        boards,
        activeBoardId,
        setActiveBoardId,
        selectBoard,
        activeBoard,
        loading,
        boardLoading,
        searchQuery,
        setSearchQuery,
        priorityFilter,
        setPriorityFilter,
        isDark,
        toggleTheme,
        isAISidebarOpen,
        setIsAISidebarOpen,
        toggleAISidebar,
        selectedCard,
        setSelectedCard,
        isAddTaskModalOpen,
        setIsAddTaskModalOpen,
        targetListIdForNewTask,
        setTargetListIdForNewTask,
        isOnboardingOpen,
        setIsOnboardingOpen,
        toast,
        showToast,
        fetchBoards,
        fetchActiveBoardDetails,
        createBoard,
        deleteBoard,
        createList,
        updateList,
        deleteList,
        createCard,
        updateCard,
        deleteCard,
        moveCard,
        addComment,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => useContext(BoardContext);
