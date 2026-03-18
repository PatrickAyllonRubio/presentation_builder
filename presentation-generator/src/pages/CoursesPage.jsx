import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, ChevronRight } from 'lucide-react';
import { courseService } from '../services/api.js';
import { confirm } from '../stores/toastStore.js';

export function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    courseService.list().then(setCourses).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const course = await courseService.create({ name: newName.trim(), description: newDesc.trim() || null });
    setCourses((prev) => [course, ...prev]);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!await confirm('¿Eliminar este curso y todos sus módulos y presentaciones?')) return;
    await courseService.delete(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Mis Cursos</h1>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary"
        >
          <Plus size={15} /> Nuevo curso
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
          <input
            autoFocus
            className="w-full mb-2 px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
            placeholder="Nombre del curso"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="w-full mb-3 px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Crear</button>
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-1.5 rounded-lg text-sm" style={{ color: 'var(--c-text-muted)' }}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--c-text-muted)' }} className="text-sm">Cargando...</p>
      ) : courses.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--c-text-muted)' }}>
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay cursos aún. ¡Crea el primero!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}/modules`)}
              className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
            >
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>{course.name}</p>
                {course.description && (
                  <p className="text-xs mt-0.5 opacity-50" style={{ color: 'var(--c-text)' }}>{course.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(e, course.id)}
                  className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--c-danger)' }}
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} style={{ color: 'var(--c-text-muted)' }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
