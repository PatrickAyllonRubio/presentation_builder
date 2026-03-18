import { Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

export function AppShell({ theme, toggleTheme }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">CERV</span>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
