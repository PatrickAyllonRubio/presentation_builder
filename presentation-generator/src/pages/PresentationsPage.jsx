import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Monitor, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { presentationService, moduleService } from '../services/api.js';
import { confirm } from '../stores/toastStore.js';

export function PresentationsPage() {
  const { moduleId } = useParams();
  const [mod, setMod] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      presentationService.list(moduleId),
    ]).then(([ps]) => {
      setPresentations(ps);
    }).finally(() => setLoading(false));

    // Cargar datos del módulo para el breadcrumb
    // Necesitamos course_id — lo cargamos desde la primera presentación o guardamos en state
    presentationService.list(moduleId).then((ps) => {
      if (ps.length > 0) {
        const courseId = ps[0]?.module_id; // no disponible directamente, usamos moduleId
      }
    });
  }, [moduleId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = await presentationService.create(moduleId, {
      name: newName.trim(),
      description: newDesc.trim() || null,
      order_index: presentations.length,
    });
    setPresentations((prev) => [...prev, p]);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  }

  async function handleDelete(e, presentationId) {
    e.stopPropagation();
    if (!await confirm('¿Eliminar esta presentación y todos sus recursos?')) return;
    await presentationService.delete(moduleId, presentationId);
    setPresentations((prev) => prev.filter((p) => p.id !== presentationId));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm mb-6 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--c-text)' }}>
        <ArrowLeft size={14} /> Módulos
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Presentaciones</h1>
          <p className="text-sm opacity-40 mt-0.5" style={{ color: 'var(--c-text)' }}>Módulo #{moduleId}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary"
        >
          <Plus size={15} /> Nueva presentación
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
          <input
            autoFocus
            className="w-full mb-2 px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--c-bg)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
            placeholder="Nombre de la presentación"
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
      ) : presentations.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--c-text-muted)' }}>
          <Monitor size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay presentaciones. ¡Crea la primera!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {presentations.map((p) => (
            <li
              key={p.id}
              onClick={() => navigate(`/editor/${moduleId}/${p.id}`)}
              className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
            >
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>{p.name}</p>
                {p.description && (
                  <p className="text-xs mt-0.5 opacity-50" style={{ color: 'var(--c-text)' }}>{p.description}</p>
                )}
                <p className="text-xs mt-1 opacity-30" style={{ color: 'var(--c-text)' }}>
                  {p.guion ? 'Guion guardado' : 'Sin guion aún'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDelete(e, p.id)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity" style={{ color: 'var(--c-danger)' }}>
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
