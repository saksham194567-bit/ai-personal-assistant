/**
 * src/services/api.js
 *
 * Centralized API client for communicating with the Node.js/Express backend.
 * Automatically injects the Firebase Authorization Bearer token into headers.
 */

import { auth } from '../config/firebase';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

async function getAuthHeaders(authRequired = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (authRequired && !auth?.currentUser) {
    throw new Error('Sign in to use AI features.');
  }
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    throw new Error('Please sign in again to use the AI features.');
  }
  return headers;
}

async function request(endpoint, options = {}, authRequired = false) {
  const headers = await getAuthHeaders(authRequired);
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
    syncUser: (userData) => request('/auth/sync', { method: 'POST', body: JSON.stringify(userData) }, true),
    getProfile: () => request('/auth/me', {}, true),
    getSettings: () => request('/user/settings', {}, true),
    updateSettings: (settings) => request('/user/settings', { method: 'PUT', body: JSON.stringify(settings) }, true),
  },

  // Tasks
  tasks: {
    getAll: () => request('/tasks', {}, true),
    create: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }, true),
    update: (id, updates) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }, true),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }, true),
  },

  // Notes
  notes: {
    getAll: () => request('/notes', {}, true),
    create: (note) => request('/notes', { method: 'POST', body: JSON.stringify(note) }, true),
    update: (id, updates) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(updates) }, true),
    delete: (id) => request(`/notes/${id}`, { method: 'DELETE' }, true),
  },

  // Planner
  planner: {
    getEvents: (date) => request(`/planner${date ? `?date=${date}` : ''}`, {}, true),
    createEvent: (event) => request('/planner', { method: 'POST', body: JSON.stringify(event) }, true),
    deleteEvent: (id) => request(`/planner/${id}`, { method: 'DELETE' }, true),
  },

  // AI features (proxied through the authenticated backend)
  chat: {
    getHistory: () => request('/chat/history', {}, true),
    getQuota: () => request('/chat/quota', {}, true),
    sendMessage: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }, true),
    clearHistory: () => request('/chat/history', { method: 'DELETE' }, true),
    summarize: (text) => request('/chat/summarize', { method: 'POST', body: JSON.stringify({ text }) }, true),
    planDay: (payload) => request('/chat/plan', { method: 'POST', body: JSON.stringify(payload) }, true),
  },

  // Admin Quota Management
  admin: {
    getUsers: () => request('/admin/users', {}, true),
    updateUserLimit: (uid, data) =>
      request(`/admin/users/${uid}/limit`, { method: 'PUT', body: JSON.stringify(data) }, true),
  },

  // Health check
  health: () => request('/health'),
};

export default api;
