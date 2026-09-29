/**
 * ReservationMonitoringTable Component
 *
 * Read-only reservation table for Member 4 monitoring.
 */

import {
  formatBookingId,
  formatReservationDateTime,
  getSlotWindowParts,
  getReservationStatusBadgeClass,
} from '../utils/reservationMonitoringMapper.js';

const SlotWindowDisplay = ({ slot }) => {
  const parts = getSlotWindowParts(slot);

  if (!parts) {
    return <span className="text-muted">Unknown slot</span>;
  }

  return (
    <div className="small leading-snug">
      <div className="text-nowrap">
        <span className="text-muted">Start:</span> {parts.start}
      </div>
      <div className="text-nowrap">
        <span className="text-muted">End:</span> {parts.end}
      </div>
      {parts.capacity ? (
        <div>
          <span className="text-muted">Capacity:</span> {parts.capacity}
        </div>
      ) : null}
    </div>
  );
};

export const ReservationMonitoringTable = ({
  reservations,
  onViewDetails,
  detailsLoadingId,
  stationNameById = {},
  slotById = {},
}) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Booking ID</th>
            <th scope="col">Station</th>
            <th scope="col">Slot window</th>
            <th scope="col">Prosumer</th>
            <th scope="col">Date / time</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col" className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => {
            const isLoadingDetails = detailsLoadingId === reservation.id;
            const stationName =
              stationNameById[reservation.stationId] || 'Unknown station';

            return (
              <tr key={reservation.id}>
                <td>
                  <span className="fw-semibold">{formatBookingId(reservation.id)}</span>
                </td>
                <td>{stationName}</td>
                <td>
                  <SlotWindowDisplay slot={slotById[reservation.slotId]} />
                </td>
                <td>{reservation.prosumerId || '—'}</td>
                <td>{formatReservationDateTime(reservation.reservationDateTime)}</td>
                <td>{reservation.reservationType || '—'}</td>
                <td>
                  <span className={`badge ${getReservationStatusBadgeClass(reservation.status)}`}>
                    {reservation.status || 'Unknown'}
                  </span>
                </td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => onViewDetails(reservation)}
                    disabled={isLoadingDetails}
                    aria-busy={isLoadingDetails}
                  >
                    {isLoadingDetails ? 'Loading…' : 'View details'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReservationMonitoringTable;
