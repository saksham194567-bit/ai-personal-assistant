/**
 * TaskManager — Full CRUD task management page.
 *
 * Features:
 *   - Add new tasks (title, priority, optional due date).
 *   - Filter tasks by status: All | Pending | Completed.
 *   - Toggle task completion with an animated checkbox.
 *   - Edit task title and priority via a modal.
 *   - Delete a task with one click.
 *   - Priority color indicator on left edge of each task card.
 *   - Data persists in localStorage via AppContext.
 */
import { useState } from 'react';
import '../styles/tasks.css';
import { useAppContext } from '../context/AppContext';

// Checks whether a due date string is in the past
function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

// Formats "2025-05-20" → "May 20"
function formatDueDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(task.id, { title: title.trim(), priority, dueDate });
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <div className="modal">
        <div className="modal-header">
          <h3 id="edit-modal-title">Edit Task</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="edit-title">Task Title</label>
              <input
                id="edit-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                className="priority-select input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-due">Due Date (optional)</label>
              <input
                id="edit-due"
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="save-task-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main TaskManager Component ──────────────────────────────────────────────
function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useAppContext();

  // Form state for adding a new task
  const [newTitle, setNewTitle]     = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');

  // Which task is being edited (null = modal closed)
  const [editingTask, setEditingTask] = useState(null);

  // Active filter: 'all' | 'pending' | 'completed'
  const [filter, setFilter] = useState('all');

  // ── Add new task ──────────────────────────────────────────────────────────
  function handleAddTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({ title: newTitle, priority: newPriority, dueDate: newDueDate });
    setNewTitle('');
    setNewDueDate('');
    setNewPriority('medium');
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = tasks.filter((t) => {
    if (filter === 'pending')   return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  // Counts for filter buttons
  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
  };

  return (
    <div className="tasks-page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>Task Manager</h1>
        <p>Stay organized — add, complete, and track all your tasks.</p>
      </div>

      <div className="page-body">
        {/* ── Add Task Form ── */}
        <form className="add-task-form" onSubmit={handleAddTask} aria-label="Add a new task">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="new-task-title">New Task</label>
              <input
                id="new-task-title"
                className="input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoComplete="off"
              />
            </div>

            <div className="form-group form-group-sm">
              <label htmlFor="new-task-priority">Priority</label>
              <select
                id="new-task-priority"
                className="priority-select"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div className="form-group form-group-sm">
              <label htmlFor="new-task-due">Due Date</label>
              <input
                id="new-task-due"
                type="date"
                className="input"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>

            <div style={{ paddingBottom: '0px' }}>
              <label style={{ visibility: 'hidden', fontSize: 'var(--font-xs)' }}>Add</label>
              <button
                type="submit"
                id="add-task-submit"
                className="btn btn-primary"
                disabled={!newTitle.trim()}
                aria-label="Add task"
              >
                ➕ Add Task
              </button>
            </div>
          </div>
        </form>

        {/* ── Filters ── */}
        <div className="task-filters" role="group" aria-label="Filter tasks">
          {(['all', 'pending', 'completed']).map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* ── Task List ── */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === 'completed' ? '🎉' : '📭'}
            </div>
            <p>
              {filter === 'completed'
                ? 'No completed tasks yet. Start checking things off!'
                : filter === 'pending'
                ? 'All caught up! No pending tasks.'
                : 'No tasks yet. Add your first task above.'}
            </p>
          </div>
        ) : (
          <ul className="task-list" aria-label="Task list">
            {filtered.map((task) => (
              <li
                key={task.id}
                className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`}
              >
                {/* Checkbox */}
                <div
                  className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  tabIndex={0}
                  onClick={() => toggleTask(task.id)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleTask(task.id)}
                />

                {/* Content */}
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span
                      className={`badge ${
                        task.priority === 'high'
                          ? 'badge-danger'
                          : task.priority === 'medium'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className={`task-due-date ${isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}`}>
                        📅 {formatDueDate(task.dueDate)}
                        {isOverdue(task.dueDate) && !task.completed && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions (visible on hover) */}
                <div className="task-actions">
                  <button
                    className="btn-icon"
                    onClick={() => setEditingTask(task)}
                    aria-label={`Edit task: ${task.title}`}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete task: ${task.title}`}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Edit Modal (rendered when editingTask is set) ── */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={updateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

export default TaskManager;
