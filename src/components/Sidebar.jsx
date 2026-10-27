/**
 * Sidebar — Navigation panel for the AI Personal Assistant.
 *
 * Features:
 *   - Brand logo & app name at the top.
 *   - Main nav items with icons, labels, and active state.
 *   - Task count badge that updates live.
 *   - Settings link in the footer.
 *   - Mobile-responsive: slides in/out with an overlay.
 */
import '../styles/sidebar.css';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// Navigation items configuration — easy to add more later
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '🏠' },
  { id: 'tasks',      label: 'Task Manager',   icon: '✅' },
  { id: 'planner',    label: 'Daily Planner',  icon: '📅' },
  { id: 'notes',      label: 'Notes',          icon: '📝' },
  { id: 'chat',       label: 'AI Chat',        icon: '🤖' },
];

function Sidebar({ activePage, onNavigate, mobileOpen, onCloseMobile, onOpenAuth }) {
  const { stats } = useAppContext();
  const { currentUser, logout } = useAuth();

  function handleNavClick(pageId) {
    onNavigate(pageId);
    onCloseMobile(); // Close sidebar on mobile after selecting
  }

  return (
    <>
      {/* Overlay that dims the rest of the page on mobile */}
      <div
        className={`mobile-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Main navigation">

        {/* ── Brand ── */}
        <div className="sidebar-brand">
          <div className="brand-icon" aria-hidden="true">🤖</div>
          <div className="brand-text">
            <h2>AI Assistant</h2>
            <span>Personal Productivity</span>
          </div>
        </div>

        {/* ── Main Nav ── */}
        <nav className="sidebar-nav">
          <p className="nav-section-label">Main Menu</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={activePage === item.id ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {/* Show pending task count badge on Tasks nav item */}
              {item.id === 'tasks' && stats.pendingTasks > 0 && (
                <span className="nav-badge" aria-label={`${stats.pendingTasks} pending tasks`}>
                  {stats.pendingTasks}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Footer: Auth & Settings ── */}
        <div className="sidebar-footer">
          {currentUser ? (
            <>
              <div className="sidebar-user">
                <div className="user-avatar">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" />
                  ) : (
                    currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name">{currentUser.displayName || currentUser.email}</div>
                  <div className="user-status">Online (Cloud Synced)</div>
                </div>
              </div>
              <button
                className="btn-sidebar-auth"
                onClick={logout}
                title="Sign out of Firebase"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              className="btn-sidebar-auth"
              onClick={onOpenAuth}
              title="Sign in to sync your data"
            >
              🔐 Sign In / Sync
            </button>
          )}

          <button
            id="nav-settings"
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            aria-current={activePage === 'settings' ? 'page' : undefined}
            aria-label="Settings"
          >
            <span className="nav-icon" aria-hidden="true">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
