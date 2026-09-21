/**
 * ReservationMonitoringFilters Component
 *
 * Presentation filter bar for Member 4 reservation monitoring.
 */

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Completed', label: 'Completed' },
];

export const ReservationMonitoringFilters = ({
  filters,
  onChange,
  onApply,
  onReset,
  disabled,
}) => {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className="card border-0 shadow-sm mb-4" onSubmit={handleSubmit}>
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="monitoring-status" className="form-label">
              Status
            </label>
            <select
              id="monitoring-status"
              name="status"
              className="form-select"
              value={filters.status}
              onChange={handleChange}
              disabled={disabled}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="monitoring-station-id" className="form-label">
              Station ID
            </label>
            <input
              id="monitoring-station-id"
              name="stationId"
              type="text"
              className="form-control"
              placeholder="MongoDB ObjectId"
              value={filters.stationId}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="monitoring-prosumer-id" className="form-label">
              Prosumer ID (NIC)
            </label>
            <input
              id="monitoring-prosumer-id"
              name="prosumerId"
              type="text"
              className="form-control"
              placeholder="NIC"
              value={filters.prosumerId}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="monitoring-search" className="form-label">
              Search
            </label>
            <input
              id="monitoring-search"
              name="search"
              type="search"
              className="form-control"
              placeholder="ID, station, slot, NIC…"
              value={filters.search}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="monitoring-start-date" className="form-label">
              Start date
            </label>
            <input
              id="monitoring-start-date"
              name="startDate"
              type="date"
              className="form-control"
              value={filters.startDate}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="monitoring-end-date" className="form-label">
              End date
            </label>
            <input
              id="monitoring-end-date"
              name="endDate"
              type="date"
              className="form-control"
              value={filters.endDate}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div className="col-12 col-lg-6 d-flex flex-wrap gap-2 justify-content-lg-end">
            <button type="submit" className="btn btn-primary" disabled={disabled}>
              Apply filters
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onReset}
              disabled={disabled}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ReservationMonitoringFilters;
