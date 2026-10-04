import React, { useEffect } from 'react';

/**
 * DeactivateStationModal Component
 *
 * Professional confirmation modal for microgrid node deactivation.
 */
export const DeactivateStationModal = ({
  station,
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen || !station) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-modal)] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-dialog-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1.5 text-xl leading-none text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="mt-4">
          <h3
            id="deactivate-dialog-title"
            className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
          >
            Deactivate Microgrid Node?
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to deactivate{' '}
            <span className="font-semibold text-[var(--text-primary)]">{station.stationName}</span> (
            <span className="font-mono text-[var(--text-muted)]">{station.hubId}</span>)? Its status will be set to{' '}
            <span className="font-semibold text-[#EF4444]">Inactive</span> and will not accept new reservations.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#DC2626] disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deactivating…
              </>
            ) : (
              'Deactivate Node'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateStationModal;
