/**
 * EmptyState — Estado vacío reutilizable.
 * @param {ReactNode} icon
 * @param {string} message
 * @param {string} [hint]
 */
export function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div className="empty-state animate-fade-in">
      {Icon && <Icon size={40} strokeWidth={1} className="empty-state-icon" />}
      <p className="empty-state-msg">{message}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}
