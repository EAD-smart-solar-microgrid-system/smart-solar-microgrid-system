/**
 * ReservationDetailsModal Component
 *
 * Bootstrap modal showing one reservation monitoring record (read-only).
 */

import {
  formatReservationDateTime,
  getReservationStatusBadgeClass,
} from '../utils/reservationMonitoringMapper.js';
import { LoadingIndicator } from '../../../components/common/LoadingIndicator.jsx';
import { ErrorAlert } from '../../../components/common/ErrorAlert.jsx';

export const ReservationDetailsModal = ({
  show,
  reservation,
  loading,
  error,
  onClose,
  onRetry,
}) => {
  if (!show) {
    return null;
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">
            <div className="modal-header">
              <h2 className="modal-title h5 fw-bold">Reservation details</h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={loading}
              />
            </div>
            <div className="modal-body">
              {loading && <LoadingIndicator message="Loading reservation details…" />}

              {!loading && error && (
                <div>
                  <ErrorAlert message={error} />
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={onRetry}>
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && reservation && (
                <dl className="row mb-0">
                  <dt className="col-sm-4">Reservation ID</dt>
                  <dd className="col-sm-8">
                    <code>{reservation.id}</code>
                  </dd>

                  <dt className="col-sm-4">Station ID</dt>
                  <dd className="col-sm-8">
                    <code>{reservation.stationId}</code>
                  </dd>

                  <dt className="col-sm-4">Slot ID</dt>
                  <dd className="col-sm-8">
                    <code>{reservation.slotId}</code>
                  </dd>

                  <dt className="col-sm-4">Prosumer ID</dt>
                  <dd className="col-sm-8">{reservation.prosumerId || '—'}</dd>

                  <dt className="col-sm-4">Reservation date / time</dt>
                  <dd className="col-sm-8">
                    {formatReservationDateTime(reservation.reservationDateTime)}
                  </dd>

                  <dt className="col-sm-4">Type</dt>
                  <dd className="col-sm-8">{reservation.reservationType || '—'}</dd>

                  <dt className="col-sm-4">Status</dt>
                  <dd className="col-sm-8">
                    <span className={`badge ${getReservationStatusBadgeClass(reservation.status)}`}>
                      {reservation.status || 'Unknown'}
                    </span>
                  </dd>

                  <dt className="col-sm-4">Created</dt>
                  <dd className="col-sm-8">{formatReservationDateTime(reservation.createdAt)}</dd>

                  <dt className="col-sm-4">Updated</dt>
                  <dd className="col-sm-8">{formatReservationDateTime(reservation.updatedAt)}</dd>
                </dl>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
};

export default ReservationDetailsModal;
