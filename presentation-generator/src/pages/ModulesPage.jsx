import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { moduleService, courseService } from '../services/api.js';
import { confirm } from '../stores/toastStore.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Breadcrumb } from '../components/layout/Breadcrumb.jsx';
import { EntityCard } from '../components/layout/EntityCard.jsx';
import { CreateForm } from '../components/layout/CreateForm.jsx';
import { EmptyState } from '../components/layout/EmptyState.jsx';

export function ModulesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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

  async function handleCreate({ name, description }) {
    const mod = await moduleService.create(courseId, {
      name,
      description,
      order_index: modules.length,
    });
    setModules((prev) => [...prev, mod]);
    setCreating(false);
  }

  async function handleDelete(moduleId) {
    if (!await confirm('¿Eliminar este módulo y todas sus presentaciones?')) return;
    await moduleService.delete(courseId, moduleId);
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={course?.name || '...'}
        subtitle={modules.length > 0 ? `${modules.length} módulo${modules.length !== 1 ? 's' : ''}` : 'Módulos'}
        breadcrumb={
          <Breadcrumb items={[
            { label: course?.name || '...', to: undefined },
          ]} />
        }
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={15} /> Nuevo módulo
          </button>
        }
      />

      {creating && (
        <CreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          placeholder="Nombre del módulo"
        />
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Cargando...</p>
      ) : modules.length === 0 ? (
        <EmptyState
          icon={Layers}
          message="No hay módulos aún"
          hint="Crea un módulo para organizar tus presentaciones"
        />
      ) : (
        <ul className="entity-list stagger-children">
          {modules.map((mod) => (
            <EntityCard
              key={mod.id}
              icon={Layers}
              title={mod.name}
              subtitle={mod.description}
              onClick={() => navigate(`/courses/${courseId}/modules/${mod.id}/presentations`)}
              onDelete={() => handleDelete(mod.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
