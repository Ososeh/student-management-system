// Shared confirmation prompt used before deletes. Keeping confirmation separate
// from page logic gives student and course actions consistent safeguards.
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy = false,
}) {
  // Clicking outside the dialog cancels; clicks inside are stopped below so
  // choosing a button does not also trigger the backdrop's cancel handler.
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Dialog attributes name the popup for screen-reader users. */}
        <h2 id="modal-title">{title}</h2>
        <p>{message}</p>
        {/* Disable both actions during a pending request to prevent duplicates. */}
        <div className="modal-actions">
          <button
            className="button button-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="button button-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
