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

const DetailRow = ({ label, children }) => (
  <div className="grid grid-cols-[minmax(9.5rem,11.5rem)_minmax(0,1fr)] gap-x-4 gap-y-1 items-start">
    <dt className="fw-bold font-semibold text-slate-800">{label}</dt>
    <dd className="mb-0 min-w-0 text-slate-700">{children}</dd>
  </div>
);

export const ReservationDetailsModal = ({
  show,
  reservation,
  loading,
  error,
  onClose,
  onRetry,
  onApprove,
  canApprove = false,
  actionError,
  actionLoading = false,
  stationNameById = {},
  slotById = {},
}) => {
  if (!show) {
    return null;
  }

  const isPending =
    reservation && String(reservation.status || '').toLowerCase() === 'pending';

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
                <dl className="mb-0 flex flex-col gap-3">
                  <DetailRow label="Booking ID">{formatBookingId(reservation.id)}</DetailRow>
                  <DetailRow label="Station">{stationName}</DetailRow>
                  <DetailRow label="Slot window">
                    {slotParts ? (
                      <div className="leading-relaxed">
                        <div className="text-nowrap">
                          <span className="text-muted">Start:</span> {slotParts.start}
                        </div>
                        <div className="text-nowrap">
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
                  </DetailRow>
                  <DetailRow label="Prosumer NIC">{reservation.prosumerId || '—'}</DetailRow>
                  <DetailRow label="Reservation date / time">
                    {formatReservationDateTime(reservation.reservationDateTime)}
                  </DetailRow>
                  <DetailRow label="Type">{reservation.reservationType || '—'}</DetailRow>
                  <DetailRow label="Status">
                    <span className={`badge ${getReservationStatusBadgeClass(reservation.status)}`}>
                      {reservation.status || 'Unknown'}
                    </span>
                  </DetailRow>
                  <DetailRow label="Created">
                    {formatReservationDateTime(reservation.createdAt)}
                  </DetailRow>
                  <DetailRow label="Updated">
                    {formatReservationDateTime(reservation.updatedAt)}
                  </DetailRow>
                </dl>
              )}

              {!loading && !error && actionError && (
                <div className="alert alert-danger mt-3 mb-0 py-2" role="alert">
                  {actionError}
                </div>
              )}
            </div>
            <div className="modal-footer flex-wrap gap-2">
              {canApprove && isPending && !loading && !error && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={onApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Approving…' : 'Approve'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading || actionLoading}
              >
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
