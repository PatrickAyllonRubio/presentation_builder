import { useState } from 'react';

/**
 * CreateForm — Formulario reutilizable para crear entidades.
 * @param {function} onSubmit — Recibe { name, description }
 * @param {function} onCancel
 * @param {string} placeholder — Placeholder del campo nombre
 * @param {string} [submitLabel="Crear"]
 */
export function CreateForm({ onSubmit, onCancel, placeholder = 'Nombre', submitLabel = 'Crear' }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null });
      setName('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-form animate-scale-in">
      <input
        autoFocus
        className="input-field"
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input-field"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="create-form-actions">
        <button type="submit" className="btn-primary" disabled={!name.trim() || submitting}>
          {submitting ? 'Creando...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
