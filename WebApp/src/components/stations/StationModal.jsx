import React, { useEffect } from 'react';
import { StationForm } from './StationForm.jsx';

export const StationModal = ({ station, onSubmit, onCancel, submitting, serverError }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !submitting && onCancel()}
    >
      <div
        className="relative my-8 w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-[var(--shadow-modal)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="station-form-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3511B]">
              Microgrid Hub Administration
            </span>
            <h2 id="station-form-title" className="mt-1 text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              {station ? 'Edit Solar Hub' : 'Add New Solar Hub'}
            </h2>
            {station?.hubId && (
              <p className="mt-1 font-mono text-xs font-semibold text-[var(--text-muted)]">
                Hub ID: {station.hubId}
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Configure GPS coordinates, generation capacity, battery slots, and operating availability.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-2 text-xl leading-none text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <StationForm
          station={station}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitting={submitting}
          serverError={serverError}
        />
      </div>
    </div>
  );
};

export default StationModal;
