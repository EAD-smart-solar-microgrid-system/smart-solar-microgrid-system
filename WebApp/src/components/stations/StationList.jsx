import { StatusBadge } from './StatusBadge.jsx';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const formatSchedule = (schedule = []) => schedule.map((row) => `${row.dayOfWeek}: ${row.openTime}–${row.closeTime}`);

export const StationList = ({ stations, onEdit, onStatusChange, statusChangingId }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4 font-bold">Station</th>
            <th className="px-5 py-4 font-bold">Location</th>
            <th className="px-5 py-4 font-bold">Capacity</th>
            <th className="px-5 py-4 font-bold">Operating schedule</th>
            <th className="px-5 py-4 font-bold">Status</th>
            <th className="px-5 py-4 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {stations.map((station) => {
            const nextStatus = station.status === 'Active' ? 'Inactive' : 'Active';
            const isChanging = statusChangingId === station.id;
            return (
              <tr key={station.id} className="align-top transition hover:bg-slate-50/70">
                <td className="px-5 py-5">
                  <p className="font-bold text-slate-900">{station.stationName}</p>
                  <p className="mt-1 text-xs text-slate-500">Updated {formatDate(station.updatedAt)}</p>
                </td>
                <td className="px-5 py-5 text-slate-600">
                  <p>{station.latitude}, {station.longitude}</p>
                </td>
                <td className="px-5 py-5 text-slate-600">
                  <p className="font-semibold text-slate-800">{station.capacityKwPerHour} kW/h</p>
                  <p className="mt-1 text-xs">{station.batteryStorageSlotCapacity} battery slots</p>
                </td>
                <td className="max-w-xs px-5 py-5 text-slate-600">
                  <ul className="space-y-1 text-xs">
                    {formatSchedule(station.operatingSchedule).map((period) => <li key={period}>{period}</li>)}
                  </ul>
                </td>
                <td className="px-5 py-5"><StatusBadge status={station.status} /></td>
                <td className="px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onEdit(station)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Edit</button>
                    <button type="button" onClick={() => onStatusChange(station, nextStatus)} disabled={isChanging} className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60">
                      {isChanging ? 'Updating…' : nextStatus === 'Active' ? 'Activate' : 'Deactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default StationList;
