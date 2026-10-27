/**
 * Notes — A split-panel note-taking section.
 *
 * Features:
 *   - Left panel: scrollable list of notes with search.
 *   - Right panel: live editor for the selected note.
 *   - Auto-saves as you type (debounced via onChange).
 *   - Color accent picker per note.
 *   - Create new notes and delete existing ones.
 *   - All data persists via AppContext → localStorage.
 */
import { useState, useEffect, useCallback } from 'react';
import '../styles/notes.css';
import { useAppContext } from '../context/AppContext';

// Available note accent colors
const NOTE_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
];

// Format a date string for display: "Oct 26, 2025 · 7:30 PM"
function formatNoteDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Simple debounce utility — waits `delay` ms after the last call before firing
function useDebounce(callback, delay) {
  const [timer, setTimer] = useState(null);

  return useCallback(
    (...args) => {
      if (timer) clearTimeout(timer);
      const t = setTimeout(() => callback(...args), delay);
      setTimer(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay]
  );
}

function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useAppContext();

  // ID of the currently selected note
  const [selectedId, setSelectedId] = useState(notes[0]?.id || null);

  // Local state for the editor (fast typing without re-rendering the whole list)
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorColor, setEditorColor] = useState('#8b5cf6');

  // Search/filter query
  const [search, setSearch] = useState('');

  // "Saved" indicator
  const [showSaved, setShowSaved] = useState(false);

  // When selected note changes, load it into the editor
  useEffect(() => {
    if (!selectedId) return;
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      setEditorTitle(note.title);
      setEditorContent(note.content);
      setEditorColor(note.color || '#8b5cf6');
    }
  }, [selectedId]); // intentionally not including notes to avoid cursor jumps

  // Debounced auto-save: fires 600ms after the user stops typing
  const debouncedSave = useDebounce((id, updates) => {
    updateNote(id, updates);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, 600);

  function handleTitleChange(e) {
    setEditorTitle(e.target.value);
    if (selectedId) debouncedSave(selectedId, { title: e.target.value, content: editorContent, color: editorColor });
  }

  function handleContentChange(e) {
    setEditorContent(e.target.value);
    if (selectedId) debouncedSave(selectedId, { title: editorTitle, content: e.target.value, color: editorColor });
  }

  function handleColorChange(color) {
    setEditorColor(color);
    if (selectedId) updateNote(selectedId, { color });
  }

  // Create a new note and immediately select + focus it
  function handleNewNote() {
    const newId = addNote();
    setSelectedId(newId);
  }

  // Delete note and select first remaining note
  function handleDelete(id) {
    deleteNote(id);
    const remaining = notes.filter((n) => n.id !== id);
    setSelectedId(remaining[0]?.id || null);
  }

  // Filtered notes list
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const selectedNote = notes.find((n) => n.id === selectedId);

  return (
    <div className="notes-page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>Notes</h1>
        <p>Capture your ideas, thoughts, and everything in between.</p>
      </div>

      <div className="page-body">
        <div className="notes-layout">
          {/* ── Left Panel: Note List ── */}
          <div className="notes-list-panel">
            <div className="notes-list-header">
              <div className="notes-search">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  id="notes-search"
                  className="input"
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search notes"
                />
              </div>
            </div>

            {/* New Note Button */}
            <div className="new-note-btn">
              <button
                id="new-note-btn"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleNewNote}
                aria-label="Create a new note"
              >
                ✏️ New Note
              </button>
            </div>

            {/* List */}
            <ul className="notes-list" aria-label="Notes list">
              {filteredNotes.length === 0 ? (
                <li className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                  <div className="empty-icon">📭</div>
                  <p>{search ? 'No notes match your search.' : 'No notes yet.'}</p>
                </li>
              ) : (
                filteredNotes.map((note) => (
                  <li
                    key={note.id}
                    className={`note-list-item ${selectedId === note.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(note.id)}
                    style={{ borderLeft: `3px solid ${note.color || '#8b5cf6'}` }}
                    role="button"
                    tabIndex={0}
                    aria-selected={selectedId === note.id}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedId(note.id)}
                    aria-label={`Select note: ${note.title}`}
                  >
                    <div className="note-list-title">{note.title || 'Untitled Note'}</div>
                    <div className="note-list-preview">{note.content || 'No content yet…'}</div>
                    <div className="note-list-date">{formatNoteDate(note.updatedAt)}</div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* ── Right Panel: Editor ── */}
          {selectedNote ? (
            <div className="note-editor-panel">
              {/* Toolbar */}
              <div className="note-editor-toolbar">
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Color:
                </span>
                <div className="note-color-dots" role="group" aria-label="Note color picker">
                  {NOTE_COLORS.map((c) => (
                    <div
                      key={c}
                      className={`color-dot ${editorColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => handleColorChange(c)}
                      role="radio"
                      aria-checked={editorColor === c}
                      tabIndex={0}
                      aria-label={`Color ${c}`}
                      onKeyDown={(e) => e.key === 'Enter' && handleColorChange(c)}
                    />
                  ))}
                </div>

                {/* Saved indicator */}
                {showSaved && (
                  <div className="note-saved-indicator" aria-live="polite">
                    ✓ Saved
                  </div>
                )}

                {/* Delete button */}
                <button
                  className="btn btn-danger"
                  style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 'var(--font-xs)' }}
                  onClick={() => handleDelete(selectedNote.id)}
                  aria-label={`Delete note: ${selectedNote.title}`}
                >
                  🗑️ Delete
                </button>
              </div>

              {/* Title input */}
              <input
                id="note-title-editor"
                className="note-title-input"
                value={editorTitle}
                onChange={handleTitleChange}
                placeholder="Note title..."
                aria-label="Note title"
              />

              {/* Content textarea */}
              <textarea
                id="note-content-editor"
                className="note-textarea"
                value={editorContent}
                onChange={handleContentChange}
                placeholder="Start writing your note here..."
                aria-label="Note content"
              />
            </div>
          ) : (
            <div className="note-editor-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>Select a note from the list, or create a new one.</p>
                <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={handleNewNote}>
                  ✏️ Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notes;
