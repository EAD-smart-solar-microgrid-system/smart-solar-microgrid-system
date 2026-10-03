/**
 * Energy Slot Reservation Management Page
 *
 * Member 4 Web feature for managing energy booking slots at microgrid stations.
 * Uses the C# Web API only (stations and slot endpoints).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LoadingIndicator } from '../../../components/common/LoadingIndicator.jsx';
import { ErrorAlert } from '../../../components/common/ErrorAlert.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { MetricCard } from '../../../components/common/MetricCard.jsx';
import { StationSelector } from '../components/StationSelector.jsx';
import { SlotList } from '../components/SlotList.jsx';
import { SlotFormModal } from '../components/SlotFormModal.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import {
  createSlot,
  deleteSlot,
  getSlotsByStationId,
  getStations,
  updateSlot,
  updateSlotAvailability,
} from '../services/energySlotService.js';
import { utcIsoToLocalDateTimeInput } from '../utils/slotMapper.js';
import { validateSlotForm } from '../utils/slotFormValidation.js';

const EMPTY_FORM = {
  slotStartLocal: '',
  slotEndLocal: '',
  capacityKw: '',
  isAvailable: true,
};

export const EnergySlotReservationsPage = () => {
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(null);

  const [selectedStationId, setSelectedStationId] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [toggleError, setToggleError] = useState(null);
  const [togglingSlotId, setTogglingSlotId] = useState(null);
  const [deletingSlotId, setDeletingSlotId] = useState(null);
  const [slotPendingDelete, setSlotPendingDelete] = useState(null);
  const [slotPendingAvailability, setSlotPendingAvailability] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formServerError, setFormServerError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [stations, selectedStationId]
  );

  const loadStations = useCallback(async () => {
    setStationsLoading(true);
    setStationsError(null);

    const response = await getStations();

    if (!response.success) {
      setStations([]);
      setStationsError(response.error || 'Unable to load stations.');
      setStationsLoading(false);
      return;
    }

    const list = response.data ?? [];
    setStations(list);
    // If not selected yet, pick the first station
    if (list.length > 0 && !selectedStationId) {
      setSelectedStationId(list[0].id);
    }
    setStationsLoading(false);
  }, [selectedStationId]);

  const loadSlots = useCallback(async (stationId) => {
    if (!stationId) {
      setSlots([]);
      setSlotsError(null);
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);

    const response = await getSlotsByStationId(stationId);

    if (!response.success) {
      setSlots([]);
      setSlotsError(response.error || 'Unable to load energy slots for this station.');
      setSlotsLoading(false);
      return;
    }

    setSlots(response.data ?? []);
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadStations);
  }, [loadStations]);

  useEffect(() => {
    Promise.resolve().then(() => loadSlots(selectedStationId));
  }, [selectedStationId, loadSlots]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleStationChange = (stationId) => {
    setSelectedStationId(stationId);
    setSuccessMessage('');
    setToggleError(null);
    setSlotsError(null);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingSlotId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormServerError(null);
  };

  const openEditModal = (slot) => {
    setModalMode('edit');
    setEditingSlotId(slot.id);
    setForm({
      slotStartLocal: utcIsoToLocalDateTimeInput(slot.slotStartUtc),
      slotEndLocal: utcIsoToLocalDateTimeInput(slot.slotEndUtc),
      capacityKw: String(slot.capacityKw ?? ''),
      isAvailable: Boolean(slot.isAvailable),
    });
    setFieldErrors({});
    setFormServerError(null);
  };

  const closeModal = () => {
    if (formSubmitting) {
      return;
    }
    setModalMode(null);
    setEditingSlotId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormServerError(null);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFieldErrors((previous) => {
      if (!previous[name]) {
        return previous;
      }
      const next = { ...previous };
      delete next[name];
      return next;
    });
    setFormServerError(null);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormServerError(null);

    const validation = validateSlotForm(form, {
      maxCapacityKw: selectedStation?.capacityKwPerHour,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setFormSubmitting(true);

    const response =
      modalMode === 'edit'
        ? await updateSlot(editingSlotId, validation.normalized)
        : await createSlot(selectedStationId, validation.normalized);

    setFormSubmitting(false);

    if (!response.success) {
      setFormServerError(response.error || 'The slot could not be saved.');
      return;
    }

    setSuccessMessage(
      modalMode === 'edit'
        ? 'Energy slot updated successfully.'
        : 'Energy slot created successfully.'
    );
    closeModal();
    await loadSlots(selectedStationId);
  };

  const handleToggleAvailability = (slot) => {
    setSlotPendingAvailability({
      slot,
      makeAvailable: !slot.isAvailable,
    });
  };

  const closeAvailabilityConfirm = () => {
    if (togglingSlotId) {
      return;
    }
    setSlotPendingAvailability(null);
  };

  const confirmToggleAvailability = async () => {
    if (!slotPendingAvailability) {
      return;
    }

    setToggleError(null);
    setSuccessMessage('');
    setTogglingSlotId(slotPendingAvailability.slot.id);

    const response = await updateSlotAvailability(
      slotPendingAvailability.slot.id,
      slotPendingAvailability.makeAvailable
    );

    setTogglingSlotId(null);
    setSlotPendingAvailability(null);

    if (!response.success) {
      setToggleError(response.error || 'Availability could not be updated.');
      return;
    }

    setSuccessMessage(
      response.data?.isAvailable
        ? 'Slot marked as available.'
        : 'Slot marked as unavailable.'
    );
    await loadSlots(selectedStationId);
  };

  const handleDeleteSlot = (slot) => {
    setSlotPendingDelete(slot);
  };

  const closeDeleteConfirm = () => {
    if (deletingSlotId) {
      return;
    }
    setSlotPendingDelete(null);
  };

  const confirmDeleteSlot = async () => {
    if (!slotPendingDelete) {
      return;
    }

    setToggleError(null);
    setSuccessMessage('');
    setDeletingSlotId(slotPendingDelete.id);

    const response = await deleteSlot(slotPendingDelete.id);

    setDeletingSlotId(null);
    setSlotPendingDelete(null);

    if (!response.success) {
      setToggleError(response.error || 'The slot could not be deleted.');
      return;
    }

    setSuccessMessage('Energy slot deleted successfully.');
    await loadSlots(selectedStationId);
  };

  const slotsSectionReady = Boolean(selectedStationId) && !slotsLoading && !slotsError;
  const availableSlotsCount = slots.filter((s) => s.isAvailable).length;

  return (
    <div className="legacy-page energy-slot-reservations-page space-y-6">
      <PageHeader
        title="Energy Slot Reservation Management"
        subtitle="Manage battery storage slot windows and dispatch capacity for microgrid hubs."
        badgeVariant="primary"
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E3511B] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#F05A20] disabled:opacity-50"
          onClick={openCreateModal}
          disabled={!selectedStationId || stationsLoading || slotsLoading || formSubmitting}
        >
          <span>+</span>
          <span>Create Slot</span>
        </button>
      </PageHeader>

      {/* 4 TOP METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          title="Active Hub"
          value={selectedStation?.hubId || 'HUB-SELECT'}
          subtitle={selectedStation?.stationName || 'Choose station'}
          accent="default"
          icon={<span className="text-sm font-bold text-[#E3511B]">⚡</span>}
        />
        <MetricCard
          title="Hub Capacity"
          value={selectedStation ? `${selectedStation.capacityKwPerHour} kW` : '—'}
          subtitle="Max station throughput"
          accent="default"
          icon={<span>☀️</span>}
        />
        <MetricCard
          title="Total Slots"
          value={slotsLoading ? '…' : slots.length}
          subtitle="Configured time windows"
          accent="default"
          icon={<span>📅</span>}
        />
        <MetricCard
          title="Available Slots"
          value={slotsLoading ? '…' : availableSlotsCount}
          subtitle="Open for prosumer booking"
          accent="emerald"
          icon={<span className="text-[#22C55E]">✓</span>}
        />
      </div>

      {successMessage && (
        <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5 text-xs font-semibold text-[#22C55E] flex items-center justify-between" role="status">
          <span>{successMessage}</span>
          <button
            type="button"
            className="text-base leading-none text-[#22C55E] hover:opacity-70"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      {stationsError && (
        <ErrorAlert
          message="Unable to load microgrid stations."
          details={stationsError}
          className="mb-3"
        />
      )}

      <div className="row g-4">
        {/* LEFT COLUMN: STATION SELECTOR & SELECTED STATION CARD */}
        <div className="col-12 col-lg-4">
          <StationSelector
            stations={stations}
            selectedStationId={selectedStationId}
            onChange={handleStationChange}
            loading={stationsLoading}
            disabled={formSubmitting}
          />
          {selectedStation && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-lg mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3511B]">
                    Selected Solar Hub
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {selectedStation.stationName}
                  </h3>
                </div>
                <span className="font-mono text-xs font-bold text-[#E3511B] bg-[#E3511B]/10 px-2 py-0.5 rounded-lg border border-[#E3511B]/25">
                  {selectedStation.hubId || 'HUB-N/A'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span>Operational Status:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {selectedStation.status || 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span>Station Capacity:</span>
                  <span className="font-bold text-[#E3511B]">
                    {selectedStation.capacityKwPerHour} kW/h
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span>Battery Slots Configured:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {selectedStation.batteryStorageSlotCapacity} slots
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span>Open Available Slots:</span>
                  <span className="font-bold text-[#22C55E]">
                    {availableSlotsCount} of {slots.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SLOTS TABLE */}
        <div className="col-12 col-lg-8">
          <div className="rounded-2xl border border-white/7 bg-[#111715] shadow-lg h-100 flex flex-col overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/7 bg-[#151c19] px-5 py-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#738079]">
                Available Energy Slots ({slots.length})
              </h2>
              {selectedStationId && (
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-[#0d1210] px-3 py-1.5 text-xs font-semibold text-[#a0aaa5] transition hover:bg-white/5 hover:text-[#f4f7f6]"
                  onClick={() => loadSlots(selectedStationId)}
                  disabled={slotsLoading || formSubmitting}
                >
                  Refresh Slots
                </button>
              )}
            </div>
            <div className="p-5 flex-1">
              {!selectedStationId && (
                <EmptyState
                  title="Select a station"
                  message="Choose a microgrid station to view and manage its energy booking slots."
                />
              )}

              {selectedStationId && slotsLoading && (
                <LoadingIndicator message="Loading energy slots…" />
              )}

              {selectedStationId && !slotsLoading && slotsError && (
                <ErrorAlert message="Unable to load energy slots." details={slotsError} />
              )}

              {toggleError && (
                <ErrorAlert
                  message="Availability update failed."
                  details={toggleError}
                  onDismiss={() => setToggleError(null)}
                  className="mb-3"
                />
              )}

              {slotsSectionReady && slots.length === 0 && (
                <EmptyState
                  title="No energy slots yet"
                  message="This station has no booking slots configured. Create the first slot to make storage capacity available for reservations."
                >
                  <button
                    type="button"
                    className="rounded-xl bg-[#E3511B] px-4 py-2 text-xs font-bold text-white hover:bg-[#F05A20] transition"
                    onClick={openCreateModal}
                  >
                    Create Slot
                  </button>
                </EmptyState>
              )}

              {slotsSectionReady && slots.length > 0 && (
                <SlotList
                  slots={slots}
                  onEdit={openEditModal}
                  onToggleAvailability={handleToggleAvailability}
                  onDelete={handleDeleteSlot}
                  togglingSlotId={togglingSlotId}
                  deletingSlotId={deletingSlotId}
                  actionDisabled={formSubmitting}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <SlotFormModal
        show={modalMode !== null}
        mode={modalMode ?? 'create'}
        form={form}
        fieldErrors={fieldErrors}
        serverError={formServerError}
        submitting={formSubmitting}
        stationCapacityKw={selectedStation?.capacityKwPerHour}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        onClose={closeModal}
      />

      <ConfirmDialog
        show={Boolean(slotPendingDelete)}
        title="Delete energy slot?"
        message="Delete this energy booking slot? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        loading={Boolean(deletingSlotId)}
        onConfirm={confirmDeleteSlot}
        onCancel={closeDeleteConfirm}
      />

      <ConfirmDialog
        show={Boolean(slotPendingAvailability)}
        title={
          slotPendingAvailability?.makeAvailable
            ? 'Mark slot available?'
            : 'Mark slot unavailable?'
        }
        message={
          slotPendingAvailability?.makeAvailable
            ? 'This slot will become open for new reservations.'
            : 'This slot will no longer accept new reservations until it is marked available again.'
        }
        confirmLabel={
          slotPendingAvailability?.makeAvailable ? 'Mark available' : 'Mark unavailable'
        }
        cancelLabel="Cancel"
        confirmVariant={slotPendingAvailability?.makeAvailable ? 'success' : 'warning'}
        loading={Boolean(togglingSlotId)}
        onConfirm={confirmToggleAvailability}
        onCancel={closeAvailabilityConfirm}
      />
    </div>
  );
};

export default EnergySlotReservationsPage;
