export default function Loader({ label = "Loading...", fullScreen = false }) {
  return (
    <div
      className={fullScreen ? "loader-screen" : "loader"}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
