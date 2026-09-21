/**
 * Reservation Monitoring Page
 *
 * Member 4 read-only reservation monitoring UI.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '../services/reservationMonitoringService.js';

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
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [selectedReservationId, setSelectedReservationId] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize) || 1),
    [totalCount, pageSize]
  );

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
    loadReservations();
  }, [loadReservations]);

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
  };

  const handleRetryDetails = () => {
    if (selectedReservationId) {
      loadReservationDetails(selectedReservationId);
    }
  };

  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading && totalCount > 0;

  return (
    <div className="reservation-monitoring-page">
      <PageHeader
        title="Reservation Monitoring"
        subtitle="Read-only oversight of energy slot reservations across microgrid stations."
        badgeText="Member 4"
        badgeVariant="info"
      />

      <ReservationMonitoringFilters
        filters={draftFilters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        disabled={loading}
      />

      {error && (
        <div className="mb-3">
          <ErrorAlert message={error} />
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadReservations}>
            Retry
          </button>
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
      />
    </div>
  );
};

export default ReservationMonitoringPage;
