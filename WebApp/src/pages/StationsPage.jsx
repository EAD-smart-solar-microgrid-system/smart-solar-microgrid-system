import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../services/apiClient.js';
import { createStation, getStations, updateStation, updateStationStatus } from '../services/stationService.js';
import { StationList } from '../components/stations/StationList.jsx';
import { StationModal } from '../components/stations/StationModal.jsx';
import { ROUTES } from '../constants/routes.js';

const errorMessage = (error) => {
  if (error instanceof ApiError && error.status) return `API error (${error.status}): ${error.message}`;
  return error?.message || 'The station request could not be completed.';
};

export const StationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editingStation, setEditingStation] = useState(undefined);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusChangingId, setStatusChangingId] = useState('');

  const loadStations = useCallback(async ({ showLoading = true, signal } = {}) => {
    if (showLoading) setLoading(true);
    setPageError('');
    try {
      const data = await getStations({ signal });
      if (signal?.aborted) return false;
      setStations(Array.isArray(data) ? data : []);
      return true;
    } catch (error) {
      if (!signal?.aborted && error.name !== 'AbortError') setPageError(errorMessage(error));
      return false;
    } finally {
      if (showLoading && !signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadInitialStations = async () => {
      try {
        const data = await getStations({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setStations(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setPageError(errorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadInitialStations();
    return () => controller.abort();
  }, []);

  const openCreate = () => { setFeedback(''); setFormError(''); setEditingStation(null); };
  const openEdit = (station) => { setFeedback(''); setFormError(''); setEditingStation(station); };
  const closeModal = () => {
    if (!submitting) { setEditingStation(undefined); setFormError(''); }
  };

  const handleSave = async (payload) => {
    setSubmitting(true);
    setFormError('');
    setFeedback('');
    setPageError('');
    try {
      if (editingStation) {
        await updateStation(editingStation.id, payload);
        const refreshed = await loadStations({ showLoading: false });
        setEditingStation(undefined);
        if (refreshed) {
          setFeedback('Station details updated successfully.');
        } else {
          setPageError('Station details were saved, but the station list could not be refreshed. Check that the API is running and reload the page.');
        }
      } else {
        await createStation(payload);
        const refreshed = await loadStations({ showLoading: false });
        setEditingStation(undefined);
        if (refreshed) {
          setFeedback('Station added successfully.');
        } else {
          setPageError('Station was added, but the station list could not be refreshed. Check that the API is running and reload the page.');
        }
      }
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (station, nextStatus) => {
    if (nextStatus === 'Inactive' && !window.confirm(`Deactivate ${station.stationName}? The API will block this if active reservations exist.`)) return;

    setFeedback('');
    setPageError('');
    setStatusChangingId(station.id);
    try {
      const updatedStation = await updateStationStatus(station.id, nextStatus);
      setStations((current) => current.map((item) => item.id === station.id ? updatedStation : item));
      setFeedback(`${station.stationName} is now ${nextStatus}.`);
    } catch (error) {
      // Keep the current station state untouched when the authoritative PATCH fails.
      setPageError(errorMessage(error));
    } finally {
      setStatusChangingId('');
    }
  };

  const retryLoadingStations = () => {
    setFeedback('');
    loadStations();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to={ROUTES.HOME} className="text-sm font-semibold text-sky-700 hover:text-sky-800">← Back to overview</Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Operations / Nodes</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Microgrid node management</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Register stations, maintain their operating schedules, and control availability for the trading system.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700">+ Add station</button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Registered nodes</p><p className="mt-2 text-3xl font-bold text-slate-950">{stations.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active nodes</p><p className="mt-2 text-3xl font-bold text-emerald-600">{stations.filter((station) => station.status === 'Active').length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Inactive nodes</p><p className="mt-2 text-3xl font-bold text-slate-600">{stations.filter((station) => station.status === 'Inactive').length}</p></div>
      </div>

      {feedback && <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status"><span>{feedback}</span><button type="button" onClick={() => setFeedback('')} className="text-emerald-700 hover:text-emerald-950" aria-label="Dismiss success message">×</button></div>}
      {pageError && <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert"><span>{pageError}</span><div className="flex shrink-0 items-center gap-3"><button type="button" onClick={retryLoadingStations} className="font-bold underline hover:no-underline">Retry</button><button type="button" onClick={() => setPageError('')} className="text-xl leading-none text-rose-700" aria-label="Dismiss error message">×</button></div></div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm" role="status"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" /><p className="mt-4 text-sm text-slate-500">Loading microgrid nodes…</p></div>
      ) : stations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl text-sky-700">⌁</div><h2 className="mt-4 text-xl font-bold text-slate-950">No microgrid nodes have been registered yet.</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Add the first station to make its capacity and operating schedule available to the system.</p><button type="button" onClick={openCreate} className="mt-5 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700">Add first station</button></div>
      ) : (
        <StationList stations={stations} onEdit={openEdit} onStatusChange={handleStatusChange} statusChangingId={statusChangingId} />
      )}

      {editingStation !== undefined && <StationModal station={editingStation} onSubmit={handleSave} onCancel={closeModal} submitting={submitting} serverError={formError} />}
    </div>
  );
};

export default StationsPage;
