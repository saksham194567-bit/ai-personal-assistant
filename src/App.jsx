/**
 * App.jsx — Root application component.
 *
 * Responsibilities:
 *   1. Manages which page is currently active (simple string-based "routing").
 *   2. Controls the mobile sidebar open/close state.
 *   3. Renders the Sidebar + whichever page component is active.
 *
 * Why no React Router?
 *   For a single-page dashboard like this, a simple activePage state is
 *   much easier for beginners than a full router setup. React Router can
 *   always be added later if you need URL-based navigation.
 */
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import DailyPlanner from './components/DailyPlanner';
import Notes from './components/Notes';
import AIChat from './components/AIChat';
import Settings from './components/Settings';
import AuthModal from './components/AuthModal';

// Map page IDs to their components
function PageContent({ activePage, onNavigate }) {
  switch (activePage) {
    case 'dashboard': return <Dashboard onNavigate={onNavigate} />;
    case 'tasks':     return <TaskManager />;
    case 'planner':   return <DailyPlanner />;
    case 'notes':     return <Notes />;
    case 'chat':      return <AIChat />;
    case 'settings':  return <Settings />;
    default:          return <Dashboard onNavigate={onNavigate} />;
  }
}

function App() {
  const [activePage, setActivePage]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <AuthProvider>
      <AppProvider>
        <div className="app-layout">
          {/* Mobile hamburger button */}
          <button
            id="mobile-menu-btn"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            ☰
          </button>

          {/* Sidebar */}
          <Sidebar
            activePage={activePage}
            onNavigate={setActivePage}
            mobileOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />

          {/* Main content */}
          <main className="main-content" id="main-content">
            <PageContent activePage={activePage} onNavigate={setActivePage} />
          </main>

          {/* Authentication Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
