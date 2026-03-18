import { ChevronRight, Trash2 } from 'lucide-react';

/**
 * EntityCard — Card reutilizable para cursos, módulos y presentaciones.
 * @param {string} title
 * @param {string} [subtitle]
 * @param {string} [badge] — Texto pequeño extra (e.g. "Sin guion aún")
 * @param {ReactNode} icon — Icono a la izquierda
 * @param {function} onClick — Al hacer clic en la card
 * @param {function} onDelete — Al hacer clic en eliminar
 */
export function EntityCard({ title, subtitle, badge, icon: Icon, onClick, onDelete }) {
  return (
    <li className="entity-card" onClick={onClick}>
      <div className="entity-card-icon">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="entity-card-body">
        <p className="entity-card-title">{title}</p>
        {subtitle && <p className="entity-card-subtitle">{subtitle}</p>}
        {badge && <p className="entity-card-badge">{badge}</p>}
      </div>
      <div className="entity-card-actions">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="entity-card-delete"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        )}
        <ChevronRight size={16} className="entity-card-chevron" />
      </div>
    </li>
  );
}
