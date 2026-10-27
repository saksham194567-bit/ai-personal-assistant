/**
 * src/services/api.js
 *
 * Centralized API client for communicating with the Node.js/Express backend.
 * Automatically injects the Firebase Authorization Bearer token into headers.
 */

import { auth } from '../config/firebase';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Dev mode fallback
      headers['Authorization'] = 'Bearer demo-token';
    }
  } catch (err) {
    console.warn('Could not get Firebase token, using demo-token:', err.message);
    headers['Authorization'] = 'Bearer demo-token';
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const headers = await getAuthHeaders();
  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth & User Profile
  auth: {
    syncUser: (userData) => request('/auth/sync', { method: 'POST', body: JSON.stringify(userData) }),
    getProfile: () => request('/auth/me'),
    getSettings: () => request('/user/settings'),
    updateSettings: (settings) => request('/user/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  },

  // Tasks
  tasks: {
    getAll: () => request('/tasks'),
    create: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
    update: (id, updates) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Notes
  notes: {
    getAll: () => request('/notes'),
    create: (note) => request('/notes', { method: 'POST', body: JSON.stringify(note) }),
    update: (id, updates) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
  },

  // Planner
  planner: {
    getEvents: (date) => request(`/planner${date ? `?date=${date}` : ''}`),
    createEvent: (event) => request('/planner', { method: 'POST', body: JSON.stringify(event) }),
    deleteEvent: (id) => request(`/planner/${id}`, { method: 'DELETE' }),
  },

  // AI Chat (Proxied via Backend to Google Gemini)
  chat: {
    getHistory: () => request('/chat/history'),
    getQuota: () => request('/chat/quota'),
    sendMessage: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    clearHistory: () => request('/chat/history', { method: 'DELETE' }),
  },

  // Admin Quota Management
  admin: {
    getUsers: () => request('/admin/users'),
    updateUserLimit: (uid, data) =>
      request(`/admin/users/${uid}/limit`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Health check
  health: () => request('/health'),
};

export default api;
