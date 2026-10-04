/**
 * ConfirmDialog Component
 *
 * Reusable Bootstrap confirmation modal for destructive or important actions.
 */

export const ConfirmDialog = ({
  show,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!show) {
    return null;
  }

  const confirmClass =
    confirmVariant === 'primary'
      ? 'btn btn-primary'
      : confirmVariant === 'success'
        ? 'btn btn-outline-success'
        : confirmVariant === 'warning'
          ? 'btn btn-outline-warning'
          : 'btn btn-outline-danger';

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header">
              <h2 className="modal-title h5 fw-bold">{title}</h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCancel}
                disabled={loading}
              />
            </div>
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={confirmClass}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Working…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
};

export default ConfirmDialog;
