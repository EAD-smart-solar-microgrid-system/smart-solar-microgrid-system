import { ProsumerStatusBadge } from './ProsumerStatusBadge.jsx';

/**
 * ProsumerTable Component
 *
 * Renders a responsive, accessible table of registered solar prosumers.
 * Supports row-level View, Edit, and contextual lifecycle actions (Activate, Deactivate, Reactivate).
 *
 * @param {{
 *   prosumers: Array<object>,
 *   onView?: (prosumer: object) => void,
 *   onEdit?: (prosumer: object) => void,
 *   onStatusAction?: (prosumer: object, targetStatus: string) => void
 * }} props
 */
export const ProsumerTable = ({
  prosumers = [],
  onView,
  onEdit,
  onStatusAction,
}) => {
  const renderStatusAction = (prosumer) => {
    if (prosumer.status === 'Pending') {
      return (
        <button
          type="button"
          onClick={() => onStatusAction && onStatusAction(prosumer, 'Active')}
          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Activate
        </button>
      );
    }

    if (prosumer.status === 'Active') {
      return (
        <button
          type="button"
          onClick={() => onStatusAction && onStatusAction(prosumer, 'Deactivated')}
          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Deactivate
        </button>
      );
    }

    if (prosumer.status === 'Deactivated') {
      return (
        <button
          type="button"
          onClick={() => onStatusAction && onStatusAction(prosumer, 'Active')}
          className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
        >
          Reactivate
        </button>
      );
    }

    return null;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full w-full text-left text-sm" aria-label="Solar Prosumers">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-4 font-bold">NIC</th>
              <th scope="col" className="px-5 py-4 font-bold">Full Name</th>
              <th scope="col" className="px-5 py-4 font-bold">Email</th>
              <th scope="col" className="px-5 py-4 font-bold">Phone</th>
              <th scope="col" className="px-5 py-4 font-bold">Address</th>
              <th scope="col" className="px-5 py-4 font-bold">Status</th>
              <th scope="col" className="px-5 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prosumers.map((prosumer) => (
              <tr key={prosumer.nic} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-4 font-mono font-medium text-slate-900">
                  {prosumer.nic}
                </td>
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {prosumer.fullName || '—'}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {prosumer.email || '—'}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {prosumer.phone || '—'}
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-slate-600" title={prosumer.address || ''}>
                  {prosumer.address || '—'}
                </td>
                <td className="px-5 py-4">
                  <ProsumerStatusBadge status={prosumer.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView && onView(prosumer)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit && onEdit(prosumer)}
                      className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                    >
                      Edit
                    </button>
                    {renderStatusAction(prosumer)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProsumerTable;
