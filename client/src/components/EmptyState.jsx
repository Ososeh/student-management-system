// EmptyState describes a successful request that returned no records. Optional
// action content gives the user a context-specific next step.
export default function EmptyState({ title, message, action }) {
  // `action` is optional JSX supplied by the parent, such as a create link.
  return (
    <div className="state-card">
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}
