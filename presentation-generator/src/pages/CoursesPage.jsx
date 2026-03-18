import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import { courseService } from '../services/api.js';
import { confirm } from '../stores/toastStore.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { EntityCard } from '../components/layout/EntityCard.jsx';
import { CreateForm } from '../components/layout/CreateForm.jsx';
import { EmptyState } from '../components/layout/EmptyState.jsx';

export function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    courseService.list().then(setCourses).finally(() => setLoading(false));
  }, []);

  async function handleCreate({ name, description }) {
    const course = await courseService.create({ name, description });
    setCourses((prev) => [course, ...prev]);
    setCreating(false);
  }

  async function handleDelete(id) {
    if (!await confirm('¿Eliminar este curso y todos sus módulos y presentaciones?')) return;
    await courseService.delete(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Mis Cursos"
        subtitle={courses.length > 0 ? `${courses.length} curso${courses.length !== 1 ? 's' : ''}` : undefined}
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={15} /> Nuevo curso
          </button>
        }
      />

      {creating && (
        <CreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          placeholder="Nombre del curso"
        />
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Cargando...</p>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          message="No hay cursos aún"
          hint="¡Crea el primero para empezar!"
        />
      ) : (
        <ul className="entity-list stagger-children">
          {courses.map((course) => (
            <EntityCard
              key={course.id}
              icon={BookOpen}
              title={course.name}
              subtitle={course.description}
              onClick={() => navigate(`/courses/${course.id}/modules`)}
              onDelete={() => handleDelete(course.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
