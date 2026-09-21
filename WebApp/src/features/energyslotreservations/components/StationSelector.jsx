/**
 * StationSelector Component
 *
 * Presentation control for choosing a microgrid station.
 */

export const StationSelector = ({
  stations,
  selectedStationId,
  onChange,
  loading,
  disabled,
}) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <label htmlFor="energy-slot-station-select" className="form-label fw-semibold">
          Microgrid station
        </label>
        <select
          id="energy-slot-station-select"
          className="form-select"
          value={selectedStationId}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || loading}
          aria-busy={loading}
        >
          <option value="">
            {loading ? 'Loading stations…' : 'Select a station to manage energy slots'}
          </option>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.stationName}
              {station.status ? ` (${station.status})` : ''}
            </option>
          ))}
        </select>
        <p className="form-text mb-0 mt-2">
          Choose a station to view available battery storage slots and manage slot windows.
        </p>
      </div>
    </div>
  );
};

export default StationSelector;
