import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CoursesPage } from './pages/CoursesPage.jsx';
import { ModulesPage } from './pages/ModulesPage.jsx';
import { PresentationsPage } from './pages/PresentationsPage.jsx';
import { EditorPage } from './pages/EditorPage.jsx';
import { ToastContainer } from './components/Toast.jsx';
import './styles/globals.css';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/courses/:courseId/modules" element={<ModulesPage />} />
        <Route path="/modules/:moduleId/presentations" element={<PresentationsPage />} />
        <Route path="/editor/:moduleId/:presentationId" element={<EditorPage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;