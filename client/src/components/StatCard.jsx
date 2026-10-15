// Presentational dashboard tile: its parent supplies the value and labels, so
// this component can be reused without knowing how data was loaded.
export default function StatCard({ label, value, detail, icon }) {
  // Keep this tile presentation-only; its parent computes and supplies values.
  return (
    <article className="stat-card">
      <div className="stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}
