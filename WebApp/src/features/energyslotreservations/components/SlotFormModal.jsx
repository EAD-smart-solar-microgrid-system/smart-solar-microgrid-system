/**
 * SlotFormModal Component
 *
 * Bootstrap modal for creating or editing an energy booking slot.
 */

export const SlotFormModal = ({
  show,
  mode,
  form,
  fieldErrors,
  serverError,
  submitting,
  stationCapacityKw,
  onChange,
  onSubmit,
  onClose,
}) => {
  const title = mode === 'edit' ? 'Edit energy slot' : 'Create energy slot';
  const submitLabel = mode === 'edit' ? 'Save changes' : 'Create slot';

  if (!show) {
    return null;
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">
            <form onSubmit={onSubmit} noValidate>
              <div className="modal-header">
                <h2 className="modal-title h5 fw-bold">{title}</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                  disabled={submitting}
                />
              </div>
              <div className="modal-body">
                {serverError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {serverError}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="slot-start-local" className="form-label">
                      Start (local time)
                    </label>
                    <input
                      id="slot-start-local"
                      name="slotStartLocal"
                      type="datetime-local"
                      className={`form-control ${fieldErrors.slotStartLocal ? 'is-invalid' : ''}`}
                      value={form.slotStartLocal}
                      onChange={onChange}
                      disabled={submitting}
                      required
                    />
                    {fieldErrors.slotStartLocal && (
                      <div className="invalid-feedback">{fieldErrors.slotStartLocal}</div>
                    )}
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="slot-end-local" className="form-label">
                      End (local time)
                    </label>
                    <input
                      id="slot-end-local"
                      name="slotEndLocal"
                      type="datetime-local"
                      className={`form-control ${fieldErrors.slotEndLocal ? 'is-invalid' : ''}`}
                      value={form.slotEndLocal}
                      onChange={onChange}
                      disabled={submitting}
                      required
                    />
                    {fieldErrors.slotEndLocal && (
                      <div className="invalid-feedback">{fieldErrors.slotEndLocal}</div>
                    )}
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="slot-capacity-kw" className="form-label">
                      Capacity (kW)
                    </label>
                    <input
                      id="slot-capacity-kw"
                      name="capacityKw"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-control ${fieldErrors.capacityKw ? 'is-invalid' : ''}`}
                      value={form.capacityKw}
                      onChange={onChange}
                      disabled={submitting}
                      required
                    />
                    {Number.isFinite(stationCapacityKw) && stationCapacityKw > 0 && (
                      <div className="form-text">
                        Station limit: {stationCapacityKw} kW per hour (authoritative checks apply
                        on the server).
                      </div>
                    )}
                    {fieldErrors.capacityKw && (
                      <div className="invalid-feedback">{fieldErrors.capacityKw}</div>
                    )}
                  </div>
                  <div className="col-12 col-md-6 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input
                        id="slot-is-available"
                        name="isAvailable"
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={form.isAvailable}
                        onChange={onChange}
                        disabled={submitting}
                      />
                      <label className="form-check-label" htmlFor="slot-is-available">
                        Slot is available for booking
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  );
};

export default SlotFormModal;
