import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Layers, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { moduleService, courseService } from '../services/api.js';
import { confirm } from '../stores/toastStore.js';

export function ModulesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      courseService.get(courseId),
      moduleService.list(courseId),
    ]).then(([c, m]) => {
      setCourse(c);
      setModules(m);
    }).finally(() => setLoading(false));
  }, [courseId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const mod = await moduleService.create(courseId, {
      name: newName.trim(),
      description: newDesc.trim() || null,
      order_index: modules.length,
    });
    setModules((prev) => [...prev, mod]);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  }

  async function handleDelete(e, moduleId) {
    e.stopPropagation();
    if (!await confirm('¿Eliminar este módulo y todas sus presentaciones?')) return;
    await moduleService.delete(courseId, moduleId);
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm mb-6 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--c-text)' }}>
        <ArrowLeft size={14} /> Cursos
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>
            {course?.name || '...'}
          </h1>
          <p className="text-sm opacity-40 mt-0.5" style={{ color: 'var(--c-text)' }}>Módulos</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--c-accent)', color: '#fff' }}
        >
          <Plus size={15} /> Nuevo módulo
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
          <input
            autoFocus
            className="w-full mb-2 px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
            placeholder="Nombre del módulo"
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
            <button type="submit" className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--c-accent)', color: '#fff' }}>Crear</button>
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-1.5 rounded-lg text-sm" style={{ color: 'var(--c-text-muted)' }}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--c-text-muted)' }} className="text-sm">Cargando...</p>
      ) : modules.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--c-text-muted)' }}>
          <Layers size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay módulos aún.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {modules.map((mod) => (
            <li
              key={mod.id}
              onClick={() => navigate(`/modules/${mod.id}/presentations`)}
              className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
            >
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>{mod.name}</p>
                {mod.description && (
                  <p className="text-xs mt-0.5 opacity-50" style={{ color: 'var(--c-text)' }}>{mod.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDelete(e, mod.id)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity" style={{ color: 'var(--c-danger)' }}>
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
