/**
 * Settings — User preferences and configuration panel.
 *
 * Sections:
 *   - Profile    : User name & avatar.
 *   - Appearance : Accent color pickers, compact mode toggle.
 *   - AI Provider: Server-side provider configuration guidance.
 *   - Notifications: Toggle options.
 *   - Data        : Clear all data (danger zone).
 *
 * Provider credentials belong in backend environment variables, never here.
 */
import { useState, useEffect } from 'react';
import '../styles/settings.css';
import { useAppContext } from '../context/AppContext';

// Settings navigation sections
const SECTIONS = [
  { id: 'profile',       label: 'Profile',        icon: '👤' },
  { id: 'appearance',   label: 'Appearance',      icon: '🎨' },
  { id: 'ai',           label: 'AI Provider',     icon: '🤖' },
  { id: 'notifications',label: 'Notifications',   icon: '🔔' },
  { id: 'data',         label: 'Data & Privacy',  icon: '🛡️' },
];

// Accent color options
const ACCENT_COLORS = [
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue'   },
  { value: '#10b981', label: 'Green'  },
  { value: '#f59e0b', label: 'Amber'  },
  { value: '#ec4899', label: 'Pink'   },
  { value: '#ef4444', label: 'Red'    },
];

function Settings() {
  const { settings, updateSettings } = useAppContext();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Remove keys saved by the old browser-based setup from localStorage.
  useEffect(() => {
    if (settings.apiKey) updateSettings({ apiKey: '' });
  }, [settings.apiKey]);

  // Show a brief "Saved!" flash after any change
  function save(updates) {
    updateSettings(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleClearData() {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to clear ALL data?\n\nThis will permanently delete all tasks, notes, planner events, and chat history. This cannot be undone.'
    );
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  }

  return (
    <div className="settings-page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>Settings</h1>
        <p>Customize your AI Personal Assistant experience.</p>
      </div>

      <div className="page-body">
        <div className="settings-layout">
          {/* ── Settings Nav ── */}
          <nav className="settings-nav" aria-label="Settings sections">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                id={`settings-nav-${s.id}`}
                className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
                aria-current={activeSection === s.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          {/* ── Settings Panel ── */}
          <div className="settings-panel">

            {/* ─────────── PROFILE ─────────── */}
            {activeSection === 'profile' && (
              <>
                <div className="settings-panel-header">
                  <h2>👤 Profile</h2>
                  <p>Personalize how the assistant greets you.</p>
                </div>
                <div className="settings-panel-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Your Name</h4>
                      <p>Used for personalized greetings on the Dashboard.</p>
                    </div>
                    <input
                      id="settings-username"
                      className="input"
                      style={{ width: '200px' }}
                      value={settings.userName}
                      onChange={(e) => save({ userName: e.target.value })}
                      placeholder="Enter your name"
                      aria-label="Your name"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ─────────── APPEARANCE ─────────── */}
            {activeSection === 'appearance' && (
              <>
                <div className="settings-panel-header">
                  <h2>🎨 Appearance</h2>
                  <p>Customize the look and feel of the interface.</p>
                </div>
                <div className="settings-panel-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Accent Color</h4>
                      <p>Choose the highlight color used throughout the app.</p>
                    </div>
                    <div className="color-swatches" role="radiogroup" aria-label="Accent color">
                      {ACCENT_COLORS.map((c) => (
                        <div
                          key={c.value}
                          className={`color-swatch ${settings.accentColor === c.value ? 'active' : ''}`}
                          style={{ background: c.value }}
                          onClick={() => save({ accentColor: c.value })}
                          role="radio"
                          aria-checked={settings.accentColor === c.value}
                          aria-label={c.label}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && save({ accentColor: c.value })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Compact Mode</h4>
                      <p>Reduce spacing and padding for a denser layout.</p>
                    </div>
                    <label className="toggle" aria-label="Compact mode">
                      <input
                        id="settings-compact"
                        type="checkbox"
                        checked={settings.compactMode}
                        onChange={(e) => save({ compactMode: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* ─────────── AI PROVIDER ─────────── */}
            {activeSection === 'ai' && (
              <>
                <div className="settings-panel-header">
                  <h2>🤖 AI Provider</h2>
                  <p>AI requests use the provider configured by the backend.</p>
                </div>
                <div className="settings-panel-body">
                  {/* Info box */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--info)', margin: 0, lineHeight: 1.7 }}>
                      🔒 Provider keys are stored on the backend and never in browser settings. For local setup, configure <code>GEMINI_API_KEY</code> in <code>backend/.env</code>.
                    </p>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>AI Provider</h4>
                      <p>Provider and model selection are configured on the server.</p>
                    </div>
                    <div className="setting-info"><strong>Google Gemini</strong><br /><small>Model: GEMINI_MODEL in backend/.env</small></div>
                  </div>
                </div>
              </>
            )}

            {/* ─────────── NOTIFICATIONS ─────────── */}
            {activeSection === 'notifications' && (
              <>
                <div className="settings-panel-header">
                  <h2>🔔 Notifications</h2>
                  <p>Control how and when the app alerts you.</p>
                </div>
                <div className="settings-panel-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Enable Notifications</h4>
                      <p>Show in-app alerts for overdue tasks and reminders.</p>
                    </div>
                    <label className="toggle" aria-label="Enable notifications">
                      <input
                        id="settings-notifications"
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => save({ notifications: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Sound Effects</h4>
                      <p>Play a soft sound when tasks are completed.</p>
                    </div>
                    <label className="toggle" aria-label="Sound effects">
                      <input
                        id="settings-sound"
                        type="checkbox"
                        checked={settings.soundEffects}
                        onChange={(e) => save({ soundEffects: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* ─────────── DATA & PRIVACY ─────────── */}
            {activeSection === 'data' && (
              <>
                <div className="settings-panel-header">
                  <h2>🛡️ Data &amp; Privacy</h2>
                  <p>Manage your locally stored data.</p>
                </div>
                <div className="settings-panel-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Data Storage</h4>
                      <p>All data (tasks, notes, planner, chat) is stored locally in your browser. No data is sent to any server.</p>
                    </div>
                    <span className="badge badge-success">Local Only</span>
                  </div>

                  <div className="danger-zone">
                    <h4>⚠️ Danger Zone</h4>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                      This will permanently delete all your tasks, notes, planner events, and chat history from this browser. This action cannot be undone.
                    </p>
                    <button
                      id="clear-all-data-btn"
                      className="btn btn-danger"
                      onClick={handleClearData}
                      aria-label="Clear all data"
                    >
                      🗑️ Clear All Data
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Saved indicator ── */}
            {saved && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'var(--space-4)',
                  right: 'var(--space-6)',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
                aria-live="polite"
              >
                ✓ Settings saved
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
