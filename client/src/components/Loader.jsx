// Reusable progress indicator. The status role announces loading to assistive
// technology; fullScreen chooses a page-wide rather than inline presentation.
export default function Loader({ label = "Loading...", fullScreen = false }) {
  // The same indicator supports a small inline wait or a full-page wait.
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
