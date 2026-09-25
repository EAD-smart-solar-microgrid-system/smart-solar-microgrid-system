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
import { StationSelector } from '../components/StationSelector.jsx';
import { SlotList } from '../components/SlotList.jsx';
import { SlotFormModal } from '../components/SlotFormModal.jsx';
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

    setStations(response.data ?? []);
    setStationsLoading(false);
  }, []);

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
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    loadSlots(selectedStationId);
  }, [selectedStationId, loadSlots]);

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

  const handleToggleAvailability = async (slot) => {
    setToggleError(null);
    setSuccessMessage('');
    setTogglingSlotId(slot.id);

    const response = await updateSlotAvailability(slot.id, !slot.isAvailable);

    setTogglingSlotId(null);

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

  const handleDeleteSlot = async (slot) => {
    const confirmed = window.confirm(
      'Delete this energy booking slot? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    setToggleError(null);
    setSuccessMessage('');
    setDeletingSlotId(slot.id);

    const response = await deleteSlot(slot.id);

    setDeletingSlotId(null);

    if (!response.success) {
      setToggleError(response.error || 'The slot could not be deleted.');
      return;
    }

    setSuccessMessage('Energy slot deleted successfully.');
    await loadSlots(selectedStationId);
  };

  const slotsSectionReady = Boolean(selectedStationId) && !slotsLoading && !slotsError;

  return (
    <div className="energy-slot-reservations-page">
      <PageHeader
        title="Energy Slot Reservation Management"
        subtitle="Manage battery storage slot windows for microgrid stations"
        badgeText="Member 4"
        badgeVariant="primary"
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={!selectedStationId || stationsLoading || slotsLoading || formSubmitting}
        >
          Create slot
        </button>
      </PageHeader>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="status">
          {successMessage}
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage('')}
          />
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
        <div className="col-12 col-lg-4">
          <StationSelector
            stations={stations}
            selectedStationId={selectedStationId}
            onChange={handleStationChange}
            loading={stationsLoading}
            disabled={formSubmitting}
          />
          {selectedStation && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body small">
                <h3 className="h6 fw-semibold mb-2">Selected station</h3>
                <p className="mb-1">
                  <span className="text-muted">Status:</span> {selectedStation.status || '—'}
                </p>
                <p className="mb-1">
                  <span className="text-muted">Capacity:</span>{' '}
                  {selectedStation.capacityKwPerHour} kW/h
                </p>
                <p className="mb-0">
                  <span className="text-muted">Configured battery slots:</span>{' '}
                  {selectedStation.batteryStorageSlotCapacity}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h2 className="h6 mb-0 fw-semibold">Available energy slots</h2>
              {selectedStationId && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => loadSlots(selectedStationId)}
                  disabled={slotsLoading || formSubmitting}
                >
                  Refresh
                </button>
              )}
            </div>
            <div className="card-body">
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
                  message="This station has no booking slots. Create the first slot to make capacity available for reservations."
                >
                  <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                    Create slot
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
    </div>
  );
};

export default EnergySlotReservationsPage;
