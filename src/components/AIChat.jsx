/**
 * AIChat sends prompts to the authenticated backend. No demo responses are
 * created when the backend or provider is unavailable.
 */
import { useState, useRef, useEffect } from 'react';
import '../styles/chat.css';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';

// Suggestion chips shown to the user before they start typing
const SUGGESTIONS = [
  'Help me plan my day 📅',
  'Summarize my tasks 📋',
  'Give me a productivity tip 💡',
  'Help me brainstorm ideas 💭',
];

// Format "2025-05-20T14:30:00.000Z" → "2:30 PM"
function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function AIChat() {
  const { chatHistory, addChatMessage, clearChat } = useAppContext();

  const [inputText, setInputText]   = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [quota, setQuota]           = useState(null);
  const [requestError, setRequestError] = useState('');
  const messagesEndRef               = useRef(null);
  const textareaRef                  = useRef(null);

  // Check backend health and quota on mount
  useEffect(() => {
    api.health()
      .then(() => {
        setBackendOnline(true);
        return api.chat.getQuota().then(setQuota).catch(() => {});
      })
      .catch(() => setBackendOnline(false));
  }, []);

  // Auto-scroll to the latest message whenever chatHistory changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // Auto-resize the textarea as the user types
  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  // ── Send Message ──────────────────────────────────────────────────────────
  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    // Add user message to history
    addChatMessage('user', text);
    setInputText('');
    setRequestError('');

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Show "AI is typing…" indicator
    setIsTyping(true);

    try {
      const res = await api.chat.sendMessage(text);
      if (res?.reply) {
        addChatMessage('assistant', res.reply);
        setBackendOnline(true);
        if (res.quota) {
          setQuota(res.quota);
        }
      }
    } catch (err) {
      setRequestError(err.message || 'Could not get an AI response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e) {
    // Send on Enter (without Shift), allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestionClick(text) {
    setInputText(text);
    textareaRef.current?.focus();
  }

  async function handleClearChat() {
    clearChat();
    setRequestError('');
    if (backendOnline) {
      try { await api.chat.clearHistory(); } catch (_) {}
    }
  }

  // Render a small safe subset of markdown without injecting HTML.
  function renderMessage(content) {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*|_.*?_)/g);
      return (
        <span key={i}>
          {parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('_') && part.endsWith('_')) return <em key={index}>{part.slice(1, -1)}</em>;
            return part;
          })}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  }

  return (
    <div className="chat-page">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>AI Chat</h1>
          <p>Your intelligent assistant — powered by Google Gemini AI.</p>
        </div>

        {/* Quota Badge */}
        {quota && (
          <div className={`chat-quota-badge ${quota.isUnlimited ? 'admin-badge' : 'user-badge'}`}>
            {quota.isUnlimited ? (
              <span>👑 <strong>Admin</strong>: Unlimited Access</span>
            ) : (
              <span>⚡ <strong>Tokens</strong>: {quota.remaining} / {quota.tokenLimit} left</span>
            )}
          </div>
        )}
      </div>

      <div className="page-body">
        {/* ── Connection Status Banner ── */}
        <div className="chat-status-banner" role="status">
          <div className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
          <p>
            {backendOnline
              ? (quota?.isUnlimited
                  ? '✅ Connected as Administrator — Unlimited AI Access granted.'
                  : `✅ Backend Connected — Token Limit: ${quota ? quota.tokenLimit : 30} messages/day.`)
              : '⚡ Local Mode — Backend offline or loading. Start the server (node server.js in backend/) for live Gemini AI.'}
          </p>
        </div>

        {/* ── Messages ── */}
        <div
          className="chat-messages"
          role="log"
          aria-label="Chat conversation"
          aria-live="polite"
        >
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div
                className={`message-avatar ${msg.role === 'user' ? 'user-av' : 'ai-av'}`}
                aria-hidden="true"
              >
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div>
                <div className={`message-bubble`}>
                  {renderMessage(msg.content)}
                </div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-message assistant">
              <div className="message-avatar ai-av" aria-hidden="true">🤖</div>
              <div className="message-bubble" aria-label="AI is typing">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {requestError && (
            <div className="chat-request-error" role="alert">
              {requestError}
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggestions (shown when no user messages yet) ── */}
        {chatHistory.filter((m) => m.role === 'user').length === 0 && (
          <div className="chat-suggestions" role="list" aria-label="Suggested messages">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(s)}
                aria-label={`Suggested: ${s}`}
                role="listitem"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input Area ── */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              id="chat-input"
              ref={textareaRef}
              className="chat-textarea"
              value={inputText}
              maxLength={4000}
              onChange={(e) => { setInputText(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              aria-label="Chat message input"
            />
            <button
              id="chat-send-btn"
              className="send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              aria-label="Send message"
              title="Send"
            >
              ➤
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
              Press Enter to send · Shift+Enter for a new line
            </p>
            {chatHistory.length > 1 && (
              <button
                className="btn-ghost"
                style={{ fontSize: 'var(--font-xs)', padding: '2px 8px' }}
                onClick={handleClearChat}
                aria-label="Clear chat history"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
