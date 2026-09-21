/**
 * ReservationMonitoringTable Component
 *
 * Read-only reservation table for Member 4 monitoring.
 */

import {
  formatReservationDateTime,
  getReservationStatusBadgeClass,
} from '../utils/reservationMonitoringMapper.js';

export const ReservationMonitoringTable = ({
  reservations,
  onViewDetails,
  detailsLoadingId,
}) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Reservation</th>
            <th scope="col">Station</th>
            <th scope="col">Slot</th>
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

            return (
              <tr key={reservation.id}>
                <td>
                  <code className="small">{reservation.id}</code>
                </td>
                <td>
                  <code className="small">{reservation.stationId}</code>
                </td>
                <td>
                  <code className="small">{reservation.slotId}</code>
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
