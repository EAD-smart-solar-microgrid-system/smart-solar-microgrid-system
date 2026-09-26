import { StationForm } from './StationForm.jsx';

export const StationModal = ({ station, onSubmit, onCancel, submitting, serverError }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="station-form-title">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Microgrid node</p>
          <h2 id="station-form-title" className="mt-1 text-2xl font-bold text-slate-950">{station ? 'Edit station' : 'Add station'}</h2>
          <p className="mt-1 text-sm text-slate-500">Configure location, capacity, storage slots, and operating periods.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close station form">×</button>
      </div>
      <StationForm station={station} onSubmit={onSubmit} onCancel={onCancel} submitting={submitting} serverError={serverError} />
    </div>
  </div>
);

export default StationModal;
