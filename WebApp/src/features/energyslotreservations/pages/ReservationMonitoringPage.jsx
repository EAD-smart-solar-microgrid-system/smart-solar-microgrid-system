/**
 * Reservation Monitoring Page
 *
 * Member 4 read-only reservation monitoring UI.
 */

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../authentication/context/AuthContextValue.js';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LoadingIndicator } from '../../../components/common/LoadingIndicator.jsx';
import { ErrorAlert } from '../../../components/common/ErrorAlert.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { ReservationMonitoringFilters } from '../components/ReservationMonitoringFilters.jsx';
import { ReservationMonitoringTable } from '../components/ReservationMonitoringTable.jsx';
import { ReservationDetailsModal } from '../components/ReservationDetailsModal.jsx';
import {
  getReservationMonitoringById,
  getReservationMonitoringList,
  approveReservation,
  rejectReservation,
} from '../services/reservationMonitoringService.js';
import { getStations, getSlotsByStationId } from '../services/energySlotService.js';

const DEFAULT_PAGE_SIZE = 10;

const EMPTY_FILTERS = {
  status: '',
  stationId: '',
  prosumerId: '',
  startDate: '',
  endDate: '',
  search: '',
};

export const ReservationMonitoringPage = () => {
  const { user } = useContext(AuthContext);
  const isGridOperator = user?.role === 'GridOperator';
  const canApprove = isGridOperator;

  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [slotById, setSlotById] = useState({});

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const handleApprove = async (reservation) => {
    const targetReservation = reservation?.id ? reservation : detailsReservation;
    if (!targetReservation?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Approve reservation ${targetReservation.id}? The prosumer can then request a QR token for this booking.`
    );
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionLoadingId(targetReservation.id);
    setActionError(null);
    setActionMessage(null);

    const res = await approveReservation(targetReservation.id);

    setActionLoading(false);
    setActionLoadingId(null);

    if (res.success) {
      const msg = `Reservation ${targetReservation.id} approved successfully.`;
      setSuccessMessage(msg);
      setActionMessage({ type: 'success', text: msg });
      await loadReservations();
      if (detailsOpen && detailsReservation?.id === targetReservation.id) {
        await loadReservationDetails(targetReservation.id);
      }
    } else {
      const err = res.error || 'The reservation could not be approved.';
      setActionError(err);
      setActionMessage({ type: 'error', text: err });
    }
  };

  const handleReject = async (reservation) => {
    const targetId = reservation?.id || detailsReservation?.id;
    if (!targetId) return;

    const reason = window.prompt(`Reject reservation ${targetId}. Enter reason:`, 'Rejected by Grid Operator');
    if (reason === null) return;

    setActionLoading(true);
    setActionLoadingId(targetId);
    setActionError(null);
    setActionMessage(null);

    const res = await rejectReservation(targetId, reason);

    setActionLoading(false);
    setActionLoadingId(null);

    if (res.success) {
      const msg = `Reservation ${targetId} rejected successfully.`;
      setSuccessMessage(msg);
      setActionMessage({ type: 'success', text: msg });
      await loadReservations();
      if (detailsOpen && detailsReservation?.id === targetId) {
        await loadReservationDetails(targetId);
      }
    } else {
      const err = res.error || 'Failed to reject reservation.';
      setActionError(err);
      setActionMessage({ type: 'error', text: err });
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize) || 1),
    [totalCount, pageSize]
  );

  const stationNameById = useMemo(() => {
    const map = {};
    stations.forEach((station) => {
      if (station?.id) {
        map[station.id] = station.stationName || 'Unnamed station';
      }
      if (station?.hubId) {
        map[station.hubId] = station.stationName || 'Unnamed station';
      }
    });
    return map;
  }, [stations]);

  const loadStations = useCallback(async () => {
    setStationsLoading(true);
    const response = await getStations();
    if (response.success) {
      setStations(response.data ?? []);
    } else {
      setStations([]);
    }
    setStationsLoading(false);
  }, []);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await getReservationMonitoringList({
      ...appliedFilters,
      page,
      pageSize,
    });

    if (!response.success) {
      setItems([]);
      setTotalCount(0);
      setError(response.error || 'Unable to load reservation monitoring data.');
      setLoading(false);
      return;
    }

    setItems(response.data?.items ?? []);
    setTotalCount(response.data?.totalCount ?? 0);
    setLoading(false);
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    Promise.resolve().then(loadReservations);
  }, [loadReservations]);

  useEffect(() => {
    let cancelled = false;

    const loadSlotsForVisibleReservations = async () => {
      const stationIds = [
        ...new Set(items.map((item) => item.stationId).filter(Boolean)),
      ];

      if (stationIds.length === 0) {
        return;
      }

      const responses = await Promise.all(
        stationIds.map((stationId) => getSlotsByStationId(stationId))
      );

      if (cancelled) {
        return;
      }

      setSlotById((current) => {
        const next = { ...current };
        responses.forEach((response) => {
          if (!response.success || !Array.isArray(response.data)) {
            return;
          }
          response.data.forEach((slot) => {
            if (slot?.id) {
              next[slot.id] = slot;
            }
          });
        });
        return next;
      });
    };

    loadSlotsForVisibleReservations();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleFilterChange = (name, value) => {
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const handleResetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const loadReservationDetails = useCallback(async (reservationId) => {
    if (!reservationId) {
      return;
    }

    setDetailsOpen(true);
    setSelectedReservationId(reservationId);
    setDetailsLoadingId(reservationId);
    setDetailsError(null);
    setDetailsReservation(null);

    const response = await getReservationMonitoringById(reservationId);

    if (!response.success) {
      setDetailsError(response.error || 'Unable to load reservation details.');
      setDetailsLoadingId(null);
      return;
    }

    setDetailsReservation(response.data);
    setDetailsLoadingId(null);
  }, []);

  const handleViewDetails = (reservation) => {
    loadReservationDetails(reservation.id);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setDetailsReservation(null);
    setDetailsError(null);
    setDetailsLoadingId(null);
    setSelectedReservationId(null);
    setActionError(null);
    setActionLoading(false);
  };

  const handleRetryDetails = () => {
    if (selectedReservationId) {
      loadReservationDetails(selectedReservationId);
    }
  };


  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading && totalCount > 0;

  return (
    <div className="legacy-page reservation-monitoring-page space-y-4">
      <PageHeader
        title="Reservation Monitoring"
        subtitle="Monitor energy slot reservations and approve pending bookings for QR dispatch."
        badgeVariant="info"
      />

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="status">
          {successMessage}
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => setSuccessMessage('')}
          />
        </div>
      )}

      <ReservationMonitoringFilters
        filters={draftFilters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        disabled={loading}
        stations={stations}
        stationsLoading={stationsLoading}
      />

      {error && (
        <div className="mb-3">
          <ErrorAlert message={error} />
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadReservations}>
            Retry
          </button>
        </div>
      )}

      {actionMessage && (
        <div className={`alert alert-${actionMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
          {actionMessage.text}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setActionMessage(null)} />
        </div>
      )}

      {loading && <LoadingIndicator message="Loading reservations…" />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No reservations found"
          message="No reservations match the current filters. Adjust the filters or reset to view all records."
        >
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleResetFilters}>
            Reset filters
          </button>
        </EmptyState>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h2 className="h6 mb-0 fw-semibold">Reservations</h2>
            <span className="small text-muted">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>
          </div>
          <div className="card-body p-0">
            <ReservationMonitoringTable
              reservations={items}
              onViewDetails={handleViewDetails}
              detailsLoadingId={detailsLoadingId}
              stationNameById={stationNameById}
              slotById={slotById}
              isGridOperator={isGridOperator}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoadingId={actionLoadingId}
            />
          </div>
          <div className="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span className="small text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!canGoPrevious}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={!canGoNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <ReservationDetailsModal
        show={detailsOpen}
        reservation={detailsReservation}
        loading={Boolean(detailsLoadingId)}
        error={detailsError}
        onClose={handleCloseDetails}
        onRetry={handleRetryDetails}
        onApprove={handleApprove}
        canApprove={canApprove}
        actionError={actionError}
        actionLoading={actionLoading}
        stationNameById={stationNameById}
        slotById={slotById}
      />
    </div>
  );
};

export default ReservationMonitoringPage;
