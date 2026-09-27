/**
 * ReservationDetailsModal Component
 *
 * Modal showing one reservation monitoring record (read-only).
 */

import {
  formatBookingId,
  formatReservationDateTime,
  getSlotWindowParts,
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
  stationNameById = {},
  slotById = {},
}) => {
  if (!show) {
    return null;
  }

  const stationName = reservation
    ? stationNameById[reservation.stationId] || 'Unknown station'
    : '—';
  const slotParts = reservation ? getSlotWindowParts(slotById[reservation.slotId]) : null;

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
                  <dt className="col-sm-4 fw-bold font-semibold">Booking ID</dt>
                  <dd className="col-sm-8">{formatBookingId(reservation.id)}</dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Station</dt>
                  <dd className="col-sm-8">{stationName}</dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Slot window</dt>
                  <dd className="col-sm-8">
                    {slotParts ? (
                      <div className="leading-relaxed">
                        <div>
                          <span className="text-muted">Start:</span> {slotParts.start}
                        </div>
                        <div>
                          <span className="text-muted">End:</span> {slotParts.end}
                        </div>
                        {slotParts.capacity ? (
                          <div>
                            <span className="text-muted">Capacity:</span> {slotParts.capacity}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      'Unknown slot'
                    )}
                  </dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Prosumer NIC</dt>
                  <dd className="col-sm-8">{reservation.prosumerId || '—'}</dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Reservation date / time</dt>
                  <dd className="col-sm-8">
                    {formatReservationDateTime(reservation.reservationDateTime)}
                  </dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Type</dt>
                  <dd className="col-sm-8">{reservation.reservationType || '—'}</dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Status</dt>
                  <dd className="col-sm-8">
                    <span className={`badge ${getReservationStatusBadgeClass(reservation.status)}`}>
                      {reservation.status || 'Unknown'}
                    </span>
                  </dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Created</dt>
                  <dd className="col-sm-8">{formatReservationDateTime(reservation.createdAt)}</dd>

                  <dt className="col-sm-4 fw-bold font-semibold">Updated</dt>
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
