import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createStation, getStations, updateStation, updateStationStatus } from '../services/stationService.js';
import { StationList } from '../components/stations/StationList.jsx';
import { StationCardGrid } from '../components/stations/StationCardGrid.jsx';
import { StationModal } from '../components/stations/StationModal.jsx';
import { DeactivateStationModal } from '../components/stations/DeactivateStationModal.jsx';
import { ToastContainer } from '../components/common/Toast.jsx';
import { MetricCard } from '../components/common/MetricCard.jsx';
import { MaterialIcon } from '../components/common/MaterialIcon.jsx';

const errorMessage = (error) => {
  return error?.message || 'The station request could not be completed.';
};

export const StationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [toasts, setToasts] = useState([]);
  const [editingStation, setEditingStation] = useState(undefined);
  const [confirmDeactivationStation, setConfirmDeactivationStation] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusChangingHubId, setStatusChangingHubId] = useState('');

  const showToast = useCallback((type, message, options = {}) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((current) => [
      ...current,
      {
        id,
        type,
        title: options.title,
        message,
        action: options.action,
        duration: options.duration,
      },
    ]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const loadStationsRef = useRef(null);

  const loadStations = useCallback(async ({ showLoading = true, signal } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getStations({ signal });
      if (signal?.aborted) return false;
      const list = Array.isArray(data) ? data : [];
      setStations(list);
      return true;
    } catch (error) {
      if (!signal?.aborted && error.name !== 'AbortError') {
        showToast('error', errorMessage(error), {
          title: 'Failed to load nodes',
          action: {
            label: 'Retry',
            onClick: () => {
              void loadStationsRef.current?.();
            },
          },
        });
      }
      return false;
    } finally {
      if (showLoading && !signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadStationsRef.current = loadStations;
  }, [loadStations]);

  useEffect(() => {
    const controller = new AbortController();

    const loadInitialStations = async () => {
      try {
        const data = await getStations({ signal: controller.signal });
        if (controller.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setStations(list);
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          showToast('error', errorMessage(error), {
            title: 'Failed to load nodes',
            action: {
              label: 'Retry',
              onClick: () => {
                void loadStations();
              },
            },
          });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadInitialStations();
    return () => controller.abort();
  }, [loadStations, showToast]);

  const openCreate = () => {
    setFormError('');
    setEditingStation(null);
  };

  const openEdit = (station) => {
    setFormError('');
    setEditingStation(station);
  };

  const closeModal = () => {
    if (!submitting) {
      setEditingStation(undefined);
      setFormError('');
    }
  };

  const handleSave = async (payload) => {
    setSubmitting(true);
    setFormError('');
    try {
      if (editingStation) {
        await updateStation(editingStation.hubId, payload);
        const refreshed = await loadStations({ showLoading: false });
        setEditingStation(undefined);
        if (refreshed) {
          showToast('success', 'Station details updated successfully.', {
            title: 'Station Updated',
          });
        } else {
          showToast('error', 'Station details were saved, but the station list could not be refreshed. Check that the API is running and reload the page.', {
            title: 'Refresh Failed',
          });
        }
      } else {
        await createStation(payload);
        const refreshed = await loadStations({ showLoading: false });
        setEditingStation(undefined);
        if (refreshed) {
          showToast('success', 'Station added successfully.', {
            title: 'Station Created',
          });
        } else {
          showToast('error', 'Station was added, but the station list could not be refreshed. Check that the API is running and reload the page.', {
            title: 'Refresh Failed',
          });
        }
      }
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (station, nextStatus) => {
    if (nextStatus === 'Inactive') {
      setConfirmDeactivationStation(station);
      return;
    }
    executeStatusChange(station, nextStatus);
  };

  const executeStatusChange = async (station, nextStatus) => {
    setStatusChangingHubId(station.hubId);
    try {
      const updatedStation = await updateStationStatus(station.hubId, nextStatus);
      setStations((current) => current.map((item) => (item.hubId === station.hubId ? updatedStation : item)));
      showToast('success', `${station.stationName} is now ${nextStatus}.`, {
        title: 'Status Updated',
      });
      setConfirmDeactivationStation(null);
    } catch (error) {
      showToast('error', errorMessage(error), {
        title: 'Deactivation Blocked',
      });
    } finally {
      setStatusChangingHubId('');
    }
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalCount = stations.length;
    const activeCount = stations.filter((s) => (s.status || '').toLowerCase() === 'active').length;
    const inactiveCount = stations.filter((s) => (s.status || '').toLowerCase() === 'inactive').length;
    const totalKw = stations.reduce((sum, s) => sum + (Number(s.capacityKwPerHour) || 0), 0);
    const totalSlots = stations.reduce((sum, s) => sum + (Number(s.batteryStorageSlotCapacity) || 0), 0);

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      capacityStr: totalKw >= 1000 ? `${(totalKw / 1000).toFixed(2)} MW` : `${totalKw} kW`,
      batterySlots: totalSlots,
    };
  }, [stations]);

  return (
    <div className="space-y-6">
      {/* NODE PAGE HEADER */}
      <header className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#E3511B]">
            Operations / Nodes
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Microgrid Node Management
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-[var(--text-secondary)]">
            Manage solar hubs, generation capacity, battery storage lockers, and operating availability for the trading system.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#E3511B] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#F05A20]"
          >
            <MaterialIcon name="add" size={16} className="text-white" />
            <span>Add Hub</span>
          </button>
        </div>
      </header>

      {/* 5 COMPACT KPI METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title="Registered Nodes"
          value={loading ? '—' : metrics.total}
          subtitle="Total microgrid hubs"
          icon={<MaterialIcon name="hub" size={20} className="text-white" />}
        />
        <MetricCard
          title="Active Nodes"
          value={loading ? '—' : metrics.active}
          subtitle="Accepting power flow"
          trend={`${metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% Active`}
          trendPositive={true}
          icon={<MaterialIcon name="bolt" size={20} className="text-white" />}
        />
        <MetricCard
          title="Inactive Nodes"
          value={loading ? '—' : metrics.inactive}
          subtitle="Offline or standby"
          icon={<MaterialIcon name="pause" size={20} className="text-white" />}
        />
        <MetricCard
          title="Total Capacity"
          value={loading ? '—' : metrics.capacityStr}
          subtitle="Clean solar generation"
          trend="Grid Dispatch"
          trendPositive={true}
          icon={<MaterialIcon name="solar_power" size={20} className="text-white" />}
        />
        <MetricCard
          title="Storage Slots"
          value={loading ? '—' : `${metrics.batterySlots} Slots`}
          subtitle="Available swap lockers"
          icon={<MaterialIcon name="battery" size={20} className="text-white" />}
        />
      </div>

      {/* NODE LIST TOOLBAR: TITLE + TABLE/GRID TOGGLE */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-subtle)] pt-5">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Configured Microgrid Nodes ({stations.length})
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Detailed telemetry, GPS locations, and operational controls
          </p>
        </div>

        {/* View Toggle: Table / Grid */}
        <div className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-1">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'table'
                ? 'bg-[#E3511B] text-white font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MaterialIcon name="table_chart" size={15} className={viewMode === 'table' ? 'text-white' : 'text-[var(--text-muted)]'} />
            <span>Table</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-[#E3511B] text-white font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MaterialIcon name="grid" size={15} className={viewMode === 'grid' ? 'text-white' : 'text-[var(--text-muted)]'} />
            <span>Grid Cards</span>
          </button>
        </div>
      </div>

      {/* NODE CONTENT: LOADING / EMPTY / TABLE / GRID */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-16 text-center shadow-[var(--shadow-card)]" role="status">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[#E3511B]" />
          <p className="mt-4 text-xs font-semibold text-[var(--text-muted)]">Loading microgrid nodes…</p>
        </div>
      ) : stations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-16 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3511B]/10 text-white border border-[#E3511B]/20">
            <MaterialIcon name="bolt" size={26} className="text-white" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
            No microgrid hubs have been registered yet.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-[var(--text-muted)]">
            Add the first station to make its solar generation capacity and operating availability open to prosumers.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 rounded-xl bg-[#E3511B] px-4 py-2 text-xs font-bold text-white hover:bg-[#F05A20] transition"
          >
            Add First Solar Hub
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <StationCardGrid
          stations={stations}
          onEdit={openEdit}
          onStatusChange={handleStatusChange}
          statusChangingId={statusChangingHubId}
        />
      ) : (
        <StationList
          stations={stations}
          onEdit={openEdit}
          onStatusChange={handleStatusChange}
          statusChangingId={statusChangingHubId}
        />
      )}

      {/* CREATE / EDIT MODAL */}
      {editingStation !== undefined && (
        <StationModal
          station={editingStation}
          onSubmit={handleSave}
          onCancel={closeModal}
          submitting={submitting}
          serverError={formError}
        />
      )}

      {/* DEACTIVATE CONFIRMATION MODAL */}
      {confirmDeactivationStation && (
        <DeactivateStationModal
          station={confirmDeactivationStation}
          isOpen={Boolean(confirmDeactivationStation)}
          onConfirm={() => executeStatusChange(confirmDeactivationStation, 'Inactive')}
          onCancel={() => {
            if (!statusChangingHubId) {
              setConfirmDeactivationStation(null);
            }
          }}
          loading={statusChangingHubId === confirmDeactivationStation.hubId}
        />
      )}

      {/* FLOATING TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default StationsPage;
