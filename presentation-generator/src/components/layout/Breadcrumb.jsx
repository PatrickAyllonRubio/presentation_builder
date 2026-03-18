import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb — Navegación jerárquica consistente.
 * @param {Array<{label:string, to?:string}>} items
 */
export function Breadcrumb({ items = [] }) {
  const navigate = useNavigate();

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <button onClick={() => navigate('/')} className="breadcrumb-item breadcrumb-home">
        <Home size={13} />
      </button>
      {items.map((item, i) => (
        <span key={i} className="breadcrumb-segment">
          <ChevronRight size={12} className="breadcrumb-sep" />
          {item.to ? (
            <button onClick={() => navigate(item.to)} className="breadcrumb-item">
              {item.label}
            </button>
          ) : (
            <span className="breadcrumb-item breadcrumb-current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
