/**
 * DailyPlanner — Schedule your day with hourly time blocks.
 *
 * Features:
 *   - Navigate forward/backward by day.
 *   - Hourly time slots from 6 AM to 10 PM.
 *   - Click "+ Add" on any slot to add an event inline.
 *   - Delete individual events.
 *   - Daily goals checklist in the sidebar.
 *   - Circular progress ring showing daily completion %.
 *   - All data persists via AppContext → localStorage.
 */
import { useState } from 'react';
import '../styles/planner.css';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';

// ── Time slots to display ────────────────────────────────────────────────────
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function formatHour(h) {
  if (h === 12) return '12 PM';
  if (h === 0)  return '12 AM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// Format a Date object as "YYYY-MM-DD"
function dateToKey(d) {
  return d.toISOString().split('T')[0];
}

// Format a Date object as readable string: "Monday, October 26"
function formatLong(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatDayName(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// ── Progress Ring (SVG-based) ────────────────────────────────────────────────
function ProgressRing({ pct }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="progress-widget">
      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '0' }}>
        Daily Progress
      </p>
      <div className="progress-ring-container">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle className="progress-ring-bg" cx="65" cy="65" r={radius} />
          <circle
            className="progress-ring-fill"
            cx="65"
            cy="65"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="progress-center-text">
          <span className="pct">{pct}%</span>
          <span className="lbl">done</span>
        </div>
      </div>
    </div>
  );
}

// ── Main DailyPlanner Component ──────────────────────────────────────────────
function DailyPlanner() {
  const { plannerEvents, addPlannerEvent, deletePlannerEvent, tasks } = useAppContext();

  // The currently viewed date
  const [viewDate, setViewDate] = useState(new Date());
  const dateKey = dateToKey(viewDate);

  // Track which hour slot has the inline "add event" input open
  const [addingAtHour, setAddingAtHour] = useState(null);
  const [newEventText, setNewEventText] = useState('');
  const [planStartHour, setPlanStartHour] = useState(8);
  const [planEndHour, setPlanEndHour] = useState(18);
  const [suggestedSchedule, setSuggestedSchedule] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannerError, setPlannerError] = useState('');

  // Daily goals: simple local state (could be persisted too)
  const [goals, setGoals] = useState([
    { id: 1, text: 'Morning exercise 🏃', done: false },
    { id: 2, text: 'Deep work session 💻', done: false },
    { id: 3, text: 'Read for 30 minutes 📖', done: false },
    { id: 4, text: 'Evening walk 🌿', done: false },
  ]);

  // Navigate days
  function prevDay() {
    setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function nextDay() {
    setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }
  function goToday() {
    setViewDate(new Date());
  }

  // Submit inline event form
  function handleAddEvent(hour) {
    if (!newEventText.trim()) {
      setAddingAtHour(null);
      return;
    }
    addPlannerEvent(dateKey, hour, newEventText.trim());
    setNewEventText('');
    setAddingAtHour(null);
  }

  // Toggle a daily goal
  function toggleGoal(id) {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, done: !g.done } : g));
  }

  async function handleSuggestSchedule() {
    const pendingTasks = tasks.filter((task) => !task.completed);
    if (!pendingTasks.length) {
      setPlannerError('Add an incomplete task before asking for a schedule.');
      return;
    }
    if (pendingTasks.length > 50) {
      setPlannerError('The planner can schedule up to 50 tasks at a time. Mark completed tasks or reduce your pending list, then try again.');
      return;
    }
    setPlannerError('');
    setSuggestedSchedule(null);
    setIsPlanning(true);
    try {
      const busyHours = Object.entries(plannerEvents[dateKey] || {}).flatMap(([hour, events]) =>
        events.length ? [Number(hour)] : []
      );
      const result = await api.chat.planDay({
        date: dateKey,
        availableHours: { startHour: Number(planStartHour), endHour: Number(planEndHour) },
        busyHours,
        tasks: pendingTasks.map(({ id, title, priority, dueDate }) => ({ id, title, priority, dueDate: dueDate || '' })),
      });
      if (!Array.isArray(result.items)) throw new Error('The server returned an invalid schedule. Please try again.');
      setSuggestedSchedule(result);
    } catch (err) {
      setPlannerError(err.message || 'Could not create a schedule. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  }

  function handleSaveSuggestedSchedule() {
    if (!suggestedSchedule) return;
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    suggestedSchedule.items.forEach((item) => {
      const task = taskById.get(item.taskId);
      if (task) addPlannerEvent(dateKey, item.startHour, `${formatHour(item.startHour)}–${formatHour(item.endHour)} · ${task.title}`);
    });
    setSuggestedSchedule(null);
  }

  // Events for today's key
  const todayEvents = plannerEvents[dateKey] || {};

  // Progress = completed goals / total goals
  const goalDoneCount = goals.filter((g) => g.done).length;
  const goalPct = goals.length > 0 ? Math.round((goalDoneCount / goals.length) * 100) : 0;

  const isToday = dateToKey(new Date()) === dateKey;

  return (
    <div className="planner-page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>Daily Planner</h1>
        <p>Plan your day, hour by hour.</p>
      </div>

      <div className="page-body">
        {/* ── Date Navigation ── */}
        <div className="date-nav">
          <button className="date-nav-btn" onClick={prevDay} aria-label="Previous day">‹</button>
          <div className="date-display">
            <div className="day-name">{formatDayName(viewDate)}</div>
            <div className="full-date">{formatLong(viewDate)}{isToday && ' — Today'}</div>
          </div>
          <button className="date-nav-btn" onClick={nextDay} aria-label="Next day">›</button>
          {!isToday && (
            <button className="today-btn" onClick={goToday}>Today</button>
          )}
        </div>

        {/* ── Main Planner Layout ── */}
        <div className="planner-layout">
          {/* ── Time Blocks ── */}
          <div className="time-blocks">
            <div className="time-blocks-header">
              <h3>Schedule</h3>
              <span className="badge badge-purple">
                {Object.values(todayEvents).flat().length} event{Object.values(todayEvents).flat().length !== 1 ? 's' : ''}
              </span>
            </div>

            {HOURS.map((hour) => {
              const slotEvents = todayEvents[hour] || [];
              const isAddingHere = addingAtHour === hour;

              return (
                <div key={hour} className="time-slot">
                  <div className="time-label">{formatHour(hour)}</div>
                  <div className="time-slot-content">
                    {/* Existing events */}
                    {slotEvents.map((evt) => (
                      <div key={evt.id} className={`planner-event ${evt.color || 'purple'}`}>
                        <span>{evt.text}</span>
                        <button
                          className="event-delete"
                          onClick={() => deletePlannerEvent(dateKey, hour, evt.id)}
                          aria-label={`Delete event: ${evt.text}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Inline add form */}
                    {isAddingHere ? (
                      <div className="inline-add-form">
                        <input
                          className="input"
                          value={newEventText}
                          onChange={(e) => setNewEventText(e.target.value)}
                          placeholder="Event name..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddEvent(hour);
                            if (e.key === 'Escape') setAddingAtHour(null);
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: 'var(--font-xs)' }}
                          onClick={() => handleAddEvent(hour)}
                        >
                          Add
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => setAddingAtHour(null)}
                          aria-label="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="add-event-btn"
                        onClick={() => setAddingAtHour(hour)}
                        aria-label={`Add event at ${formatHour(hour)}`}
                      >
                        + Add event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Sidebar Panel ── */}
          <div className="planner-sidebar">
            {/* Progress Ring */}
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <ProgressRing pct={goalPct} />
              <p style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {goalDoneCount}/{goals.length} goals completed
              </p>
            </div>

            {/* Daily Goals */}
            <div className="card">
              <div className="dashboard-section-title" style={{ marginBottom: 'var(--space-3)' }}>
                Today's Goals
              </div>
              {goals.map((goal) => (
                <div key={goal.id} className="goal-item">
                  <div
                    className={`goal-checkbox ${goal.done ? 'done' : ''}`}
                    role="checkbox"
                    aria-checked={goal.done}
                    tabIndex={0}
                    onClick={() => toggleGoal(goal.id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleGoal(goal.id)}
                    aria-label={goal.text}
                  />
                  <span className={`goal-text ${goal.done ? 'done' : ''}`}>{goal.text}</span>
                </div>
              ))}
            </div>

            {/* AI Daily Schedule */}
            <div className="card ai-planner-card">
              <div className="dashboard-section-title">✨ Build a schedule with AI</div>
              <p className="ai-planner-help">Uses your incomplete tasks and priorities. Review the suggestion before adding it to this day.</p>
              <div className="ai-planner-hours">
                <label>From
                  <select className="input" value={planStartHour} onChange={(e) => {
                    const nextStart = Number(e.target.value);
                    setPlanStartHour(nextStart);
                    if (planEndHour <= nextStart) setPlanEndHour(nextStart + 1);
                  }}>
                    {HOURS.slice(0, -1).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                  </select>
                </label>
                <label>Until
                  <select className="input" value={planEndHour} onChange={(e) => setPlanEndHour(Number(e.target.value))}>
                    {HOURS.filter((hour) => hour > planStartHour).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                  </select>
                </label>
              </div>
              <button className="btn btn-primary" onClick={handleSuggestSchedule} disabled={isPlanning}>
                {isPlanning ? 'Creating schedule…' : 'Suggest my day'}
              </button>
              {plannerError && <p className="ai-planner-error" role="alert">{plannerError}</p>}
              {suggestedSchedule && (
                <div className="ai-schedule-review" aria-live="polite">
                  <strong>Review this suggestion</strong>
                  {suggestedSchedule.items.length ? suggestedSchedule.items.map((item) => {
                    const task = tasks.find((entry) => entry.id === item.taskId);
                    return <div key={item.taskId} className="ai-schedule-item">
                      <span>{formatHour(item.startHour)}–{formatHour(item.endHour)}</span>
                      <span>{task?.title || 'Task'}{item.reason ? ` — ${item.reason}` : ''}</span>
                    </div>;
                  }) : <p>No tasks fit in those hours. Try a wider work window.</p>}
                  <div className="ai-schedule-actions">
                    <button className="btn btn-primary" onClick={handleSaveSuggestedSchedule} disabled={!suggestedSchedule.items.length}>Add to planner</button>
                    <button className="btn btn-secondary" onClick={() => setSuggestedSchedule(null)}>Discard</button>
                  </div>
                </div>
              )}
            </div>

            {/* Tip Card */}
            <div className="card" style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-light)', margin: 0, lineHeight: 1.7 }}>
                💡 <strong>Tip:</strong> Use time blocking to allocate focused periods for deep work.
                Click any time slot to add an event instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyPlanner;
