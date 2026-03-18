import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Monitor } from 'lucide-react';
import { presentationService, moduleService, courseService } from '../services/api.js';
import { confirm } from '../stores/toastStore.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Breadcrumb } from '../components/layout/Breadcrumb.jsx';
import { EntityCard } from '../components/layout/EntityCard.jsx';
import { CreateForm } from '../components/layout/CreateForm.jsx';
import { EmptyState } from '../components/layout/EmptyState.jsx';

export function PresentationsPage() {
  const { courseId, moduleId } = useParams();
  const [course, setCourse] = useState(null);
  const [mod, setMod] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      courseService.get(courseId),
      moduleService.get(courseId, moduleId),
      presentationService.list(moduleId),
    ]).then(([c, m, ps]) => {
      setCourse(c);
      setMod(m);
      setPresentations(ps);
    }).finally(() => setLoading(false));
  }, [courseId, moduleId]);

  async function handleCreate({ name, description }) {
    const p = await presentationService.create(moduleId, {
      name,
      description,
      order_index: presentations.length,
    });
    setPresentations((prev) => [...prev, p]);
    setCreating(false);
  }

  async function handleDelete(presentationId) {
    if (!await confirm('¿Eliminar esta presentación y todos sus recursos?')) return;
    await presentationService.delete(moduleId, presentationId);
    setPresentations((prev) => prev.filter((p) => p.id !== presentationId));
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={mod?.name || 'Presentaciones'}
        subtitle={presentations.length > 0 ? `${presentations.length} presentación${presentations.length !== 1 ? 'es' : ''}` : 'Presentaciones'}
        breadcrumb={
          <Breadcrumb items={[
            { label: course?.name || '...', to: `/courses/${courseId}/modules` },
            { label: mod?.name || '...' },
          ]} />
        }
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={15} /> Nueva presentación
          </button>
        }
      />

      {creating && (
        <CreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          placeholder="Nombre de la presentación"
        />
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Cargando...</p>
      ) : presentations.length === 0 ? (
        <EmptyState
          icon={Monitor}
          message="No hay presentaciones aún"
          hint="¡Crea la primera para empezar!"
        />
      ) : (
        <ul className="entity-list stagger-children">
          {presentations.map((p) => (
            <EntityCard
              key={p.id}
              icon={Monitor}
              title={p.name}
              subtitle={p.description}
              badge={p.guion ? 'Guion guardado' : 'Sin guion aún'}
              onClick={() => navigate(`/editor/${moduleId}/${p.id}`)}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
