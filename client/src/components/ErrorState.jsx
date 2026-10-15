// Error display separates a failed request from a genuinely empty data list.
// Pages can provide onRetry to repeat the operation without reloading the app.
export default function ErrorState({ message, onRetry }) {
  // `role=alert` announces this failure, and retry is shown only when the
  // parent has a recovery operation to provide.
  return (
    <div className="state-card error-state" role="alert">
      <h2>We could not load this page</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="button button-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
