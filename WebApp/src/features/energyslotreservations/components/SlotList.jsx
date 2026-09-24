/**
 * SlotList Component
 *
 * Displays energy booking slots for the selected station.
 */

import { formatSlotDateTime } from '../utils/slotMapper.js';

export const SlotList = ({
  slots,
  onEdit,
  onToggleAvailability,
  onDelete,
  togglingSlotId,
  deletingSlotId,
  actionDisabled,
}) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Start</th>
            <th scope="col">End</th>
            <th scope="col" className="text-end">
              Capacity (kW)
            </th>
            <th scope="col">Availability</th>
            <th scope="col" className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const isToggling = togglingSlotId === slot.id;
            const isDeleting = deletingSlotId === slot.id;
            const rowBusy = isToggling || isDeleting;
            return (
              <tr key={slot.id}>
                <td>{formatSlotDateTime(slot.slotStartUtc)}</td>
                <td>{formatSlotDateTime(slot.slotEndUtc)}</td>
                <td className="text-end">{slot.capacityKw}</td>
                <td>
                  <span
                    className={`badge ${slot.isAvailable ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border'}`}
                  >
                    {slot.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="text-end">
                  <div className="d-flex flex-wrap justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => onEdit(slot)}
                      disabled={actionDisabled || rowBusy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${slot.isAvailable ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => onToggleAvailability(slot)}
                      disabled={actionDisabled || rowBusy}
                      aria-busy={isToggling}
                    >
                      {isToggling
                        ? 'Updating…'
                        : slot.isAvailable
                          ? 'Mark unavailable'
                          : 'Mark available'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDelete(slot)}
                      disabled={actionDisabled || rowBusy}
                      aria-busy={isDeleting}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SlotList;
