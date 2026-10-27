/**
 * Dashboard — Home overview page.
 *
 * Shows:
 *   - A personalized welcome banner with time-of-day greeting.
 *   - 4 stat cards: total tasks, completed, pending, notes count.
 *   - Recent tasks list (last 5).
 *   - Quick action buttons to jump to other pages.
 */
import '../styles/dashboard.css';
import { useAppContext } from '../context/AppContext';

// Returns "Good morning", "Good afternoon", or "Good evening"
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Returns a friendly emoji based on time of day
function getGreetingEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅';
  if (hour < 17) return '☀️';
  return '🌙';
}

// Format a date string nicely
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Check if a task is overdue
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function Dashboard({ onNavigate }) {
  const { tasks, notes, stats } = useAppContext();

  // Take the 5 most recent tasks for the "Recent" list
  const recentTasks = [...tasks].slice(0, 5);

  return (
    <div className="dashboard">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your productivity overview at a glance.</p>
      </div>

      <div className="page-body">
        {/* ── Welcome Banner ── */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <p className="greeting-time">{getGreeting()} 👋</p>
            <h2>Welcome back!</h2>
            <p>
              You have <strong style={{ color: 'var(--accent-light)' }}>{stats.pendingTasks}</strong> pending{' '}
              task{stats.pendingTasks !== 1 ? 's' : ''} today.
              {stats.completionRate > 0 && ` You're ${stats.completionRate}% done — keep it up!`}
            </p>
          </div>
          <div className="welcome-emoji" aria-hidden="true">
            {getGreetingEmoji()}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-sub">{stats.pendingTasks} remaining</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.completedTasks}</div>
              <div className="stat-label">Completed</div>
              <div className="stat-sub">{stats.completionRate}% completion rate</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.pendingTasks}</div>
              <div className="stat-label">Pending</div>
              <div className="stat-sub">
                {tasks.filter((t) => !t.completed && isOverdue(t.dueDate)).length} overdue
              </div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalNotes}</div>
              <div className="stat-label">Notes</div>
              <div className="stat-sub">Ideas & thoughts</div>
            </div>
          </div>
        </div>

        {/* ── Bottom Grid: Recent Tasks + Quick Actions ── */}
        <div className="dashboard-grid">
          {/* Recent Tasks */}
          <div className="card">
            <div className="dashboard-section-title">
              Recent Tasks
              <button onClick={() => onNavigate('tasks')} aria-label="View all tasks">
                View All →
              </button>
            </div>

            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No tasks yet. Add one from the Task Manager!</p>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="recent-task-item">
                  <div
                    className={`task-dot ${
                      task.completed
                        ? 'done'
                        : isOverdue(task.dueDate)
                        ? 'urgent'
                        : 'pending'
                    }`}
                  />
                  <div className="recent-task-info">
                    <div
                      className="name"
                      style={task.completed ? { textDecoration: 'line-through', opacity: 0.5 } : {}}
                    >
                      {task.title}
                    </div>
                    <div className="meta">
                      {task.priority} priority
                      {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      task.completed
                        ? 'badge-success'
                        : isOverdue(task.dueDate)
                        ? 'badge-danger'
                        : 'badge-purple'
                    }`}
                  >
                    {task.completed ? 'Done' : isOverdue(task.dueDate) ? 'Overdue' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="dashboard-section-title">Quick Actions</div>
            <div className="quick-actions">
              <button
                id="quick-add-task"
                className="quick-action-btn"
                onClick={() => onNavigate('tasks')}
                aria-label="Go to Task Manager"
              >
                <span className="qa-icon">➕</span>
                Add Task
              </button>
              <button
                id="quick-open-planner"
                className="quick-action-btn"
                onClick={() => onNavigate('planner')}
                aria-label="Open Daily Planner"
              >
                <span className="qa-icon">📅</span>
                Plan Day
              </button>
              <button
                id="quick-new-note"
                className="quick-action-btn"
                onClick={() => onNavigate('notes')}
                aria-label="Create a new note"
              >
                <span className="qa-icon">📝</span>
                New Note
              </button>
              <button
                id="quick-open-chat"
                className="quick-action-btn"
                onClick={() => onNavigate('chat')}
                aria-label="Open AI Chat"
              >
                <span className="qa-icon">🤖</span>
                AI Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
