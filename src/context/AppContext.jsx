/**
 * AppContext — Global state management for the AI Personal Assistant.
 *
 * What is stored here:
 *   - tasks      : array of task objects (persisted to localStorage)
 *   - notes      : array of note objects (persisted to localStorage)
 *   - settings   : user preferences      (persisted to localStorage)
 *   - chatHistory: conversation messages (persisted to localStorage)
 *   - plannerEvents: day-specific events (persisted to localStorage)
 *
 * All child components can consume this context via useAppContext().
 */
import { createContext, useContext, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { api } from '../services/api';

// ─── Create the context ───────────────────────────────────────────────────────
const AppContext = createContext(null);

// ─── Helper: generate unique IDs without external libraries ──────────────────
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Helper: format date as YYYY-MM-DD ───────────────────────────────────────
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Default data seeds (shown on first launch) ───────────────────────────────
const DEFAULT_TASKS = [
  {
    id: generateId(),
    title: 'Set up project environment',
    priority: 'high',
    completed: true,
    createdAt: new Date().toISOString(),
    dueDate: todayStr(),
  },
  {
    id: generateId(),
    title: 'Review weekly goals',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: todayStr(),
  },
  {
    id: generateId(),
    title: 'Read AI research paper',
    priority: 'low',
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: '',
  },
];

const DEFAULT_NOTES = [
  {
    id: generateId(),
    title: 'Welcome to AI Assistant! 👋',
    content:
      'This is your personal notes section. Click "New Note" to create a note, or edit this one to get started.\n\nYou can write anything here — ideas, meeting notes, plans, or anything else.',
    color: '#8b5cf6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS = {
  userName: 'User',
  accentColor: '#8b5cf6',
  notifications: true,
  soundEffects: false,
  compactMode: false,
  aiProvider: 'gemini',
};

const DEFAULT_CHAT = [];

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  // ── Tasks ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useLocalStorage('aipa_tasks', DEFAULT_TASKS);

  // Sync tasks from backend on mount
  useEffect(() => {
    api.tasks.getAll()
      .then((serverTasks) => {
        if (Array.isArray(serverTasks) && serverTasks.length > 0) {
          setTasks(serverTasks.map(t => ({ ...t, id: t._id || t.id })));
        }
      })
      .catch((err) => console.log('Offline/local tasks mode:', err.message));
  }, []);

  function addTask(taskData) {
    const newTask = {
      id: generateId(),
      title: taskData.title.trim(),
      priority: taskData.priority || 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: taskData.dueDate || '',
    };
    setTasks((prev) => [newTask, ...prev]);

    // Async backend sync
    api.tasks.create(newTask).catch(() => {});
  }

  function updateTask(id, updates) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    api.tasks.update(id, updates).catch(() => {});
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    api.tasks.delete(id).catch(() => {});
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, completed: !t.completed };
          api.tasks.update(id, { completed: updated.completed }).catch(() => {});
          return updated;
        }
        return t;
      })
    );
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  const [notes, setNotes] = useLocalStorage('aipa_notes', DEFAULT_NOTES);

  // Sync notes from backend on mount
  useEffect(() => {
    api.notes.getAll()
      .then((serverNotes) => {
        if (Array.isArray(serverNotes) && serverNotes.length > 0) {
          setNotes(serverNotes.map(n => ({ ...n, id: n._id || n.id })));
        }
      })
      .catch((err) => console.log('Offline/local notes mode:', err.message));
  }, []);

  function addNote() {
    const newNote = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    api.notes.create(newNote).catch(() => {});
    return newNote.id;
  }

  function updateNote(id, updates) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
    api.notes.update(id, updates).catch(() => {});
  }

  function deleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    api.notes.delete(id).catch(() => {});
  }

  // ── Planner Events ─────────────────────────────────────────────────────────
  const [plannerEvents, setPlannerEvents] = useLocalStorage('aipa_planner', {});

  function addPlannerEvent(dateKey, hour, eventText) {
    setPlannerEvents((prev) => {
      const dayEvents = prev[dateKey] || {};
      const slotEvents = dayEvents[hour] || [];
      return {
        ...prev,
        [dateKey]: {
          ...dayEvents,
          [hour]: [...slotEvents, { id: generateId(), text: eventText, color: 'purple' }],
        },
      };
    });
  }

  function deletePlannerEvent(dateKey, hour, eventId) {
    setPlannerEvents((prev) => {
      const dayEvents = prev[dateKey] || {};
      const slotEvents = (dayEvents[hour] || []).filter((e) => e.id !== eventId);
      return {
        ...prev,
        [dateKey]: { ...dayEvents, [hour]: slotEvents },
      };
    });
  }

  // ── Chat History ───────────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useLocalStorage('aipa_chat', DEFAULT_CHAT);

  function addChatMessage(role, content) {
    const msg = {
      id: generateId(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, msg]);
    return msg;
  }

  function clearChat() {
    setChatHistory(DEFAULT_CHAT);
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  const [settings, setSettings] = useLocalStorage('aipa_settings', DEFAULT_SETTINGS);

  // Migrate away any API key previously entered into browser settings.
  useEffect(() => {
    if (settings.apiKey) {
      const { apiKey, ...safeSettings } = settings;
      setSettings(safeSettings);
    }
  }, [settings, setSettings]);

  function updateSettings(updates) {
    setSettings((prev) => ({ ...prev, ...updates }));
  }

  // ── Derived stats (used by Dashboard) ──────────────────────────────────────
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.completed).length,
    pendingTasks: tasks.filter((t) => !t.completed).length,
    totalNotes: notes.length,
    completionRate:
      tasks.length > 0
        ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
        : 0,
  };

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    // Tasks
    tasks, addTask, updateTask, deleteTask, toggleTask,
    // Notes
    notes, addNote, updateNote, deleteNote,
    // Planner
    plannerEvents, addPlannerEvent, deletePlannerEvent,
    // Chat
    chatHistory, addChatMessage, clearChat,
    // Settings
    settings, updateSettings,
    // Computed
    stats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Custom hook for consuming context ────────────────────────────────────────
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside <AppProvider>');
  }
  return ctx;
}

export default AppContext;
