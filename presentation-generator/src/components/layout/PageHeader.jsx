/**
 * PageHeader — Encabezado reutilizable para páginas de listado.
 * @param {string} title
 * @param {string} [subtitle]
 * @param {ReactNode} [actions] — Botones a la derecha
 * @param {ReactNode} [breadcrumb] — Componente Breadcrumb
 */
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="page-header">
      {breadcrumb && <div className="page-header-breadcrumb">{breadcrumb}</div>}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
