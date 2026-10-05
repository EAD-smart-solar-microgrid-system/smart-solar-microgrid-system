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
  stations = [],
  stationsLoading = false,
  errors = {},
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
          <div>
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

          <div>
            <label htmlFor="monitoring-station-id" className="form-label">
              Station
            </label>
            <select
              id="monitoring-station-id"
              name="stationId"
              className="form-select"
              value={filters.stationId}
              onChange={handleChange}
              disabled={disabled || stationsLoading}
              aria-busy={stationsLoading}
            >
              <option value="">
                {stationsLoading ? 'Loading stations…' : 'All stations'}
              </option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.stationName}
                  {station.status ? ` (${station.status})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="monitoring-prosumer-id" className="form-label">
              Prosumer NIC
            </label>
            <input
              id="monitoring-prosumer-id"
              name="prosumerId"
              type="text"
              className={`form-control ${errors.prosumerId ? 'is-invalid' : ''}`}
              placeholder="e.g. 991234567V or 199912345678"
              value={filters.prosumerId}
              onChange={handleChange}
              disabled={disabled}
              autoComplete="off"
              inputMode="text"
              maxLength={12}
              aria-invalid={Boolean(errors.prosumerId)}
              aria-describedby={errors.prosumerId ? 'monitoring-prosumer-id-error' : undefined}
            />
            {errors.prosumerId ? (
              <div id="monitoring-prosumer-id-error" className="invalid-feedback d-block">
                {errors.prosumerId}
              </div>
            ) : (
              <div className="form-text">
               
              </div>
            )}
          </div>

          <div>
            <label htmlFor="monitoring-search" className="form-label">
              Search
            </label>
            <input
              id="monitoring-search"
              name="search"
              type="search"
              className="form-control"
              placeholder="Reservation ID, slot ID, or NIC"
              value={filters.search}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div>
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

          <div>
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

          <div className="col-span-full flex flex-wrap gap-2 justify-end">
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
