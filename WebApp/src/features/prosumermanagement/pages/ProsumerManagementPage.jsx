/**
 * Prosumer Management Page
 *
 * Member 2 Backoffice Solar Prosumer administration view.
 * Supports status filtering (All, Pending, Active, Deactivated),
 * client-side multi-field searching, and clean state handling.
 * Integrates create, details, and edit modal workflows.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LoadingIndicator } from '../../../components/common/LoadingIndicator.jsx';
import { ErrorAlert } from '../../../components/common/ErrorAlert.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { MetricCard } from '../../../components/common/MetricCard.jsx';
import { MaterialIcon } from '../../../components/common/MaterialIcon.jsx';
import { ProsumerTable } from '../components/ProsumerTable.jsx';
import { CreateProsumerModal } from '../components/CreateProsumerModal.jsx';
import { ProsumerDetailsModal } from '../components/ProsumerDetailsModal.jsx';
import { EditProsumerModal } from '../components/EditProsumerModal.jsx';
import { ProsumerStatusModal } from '../components/ProsumerStatusModal.jsx';
import { getProsumers } from '../services/prosumerService.js';
import { ApiError } from '../../../services/apiClient.js';

const STATUS_FILTERS = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Active', value: 'Active' },
  { label: 'Deactivated', value: 'Deactivated' },
];

/**
 * Normalizes error objects into human-readable messages.
 */
const getErrorMessage = (err) => {
  if (err instanceof ApiError && err.status) {
    return err.message;
  }
  return err?.message || 'The prosumer request could not be completed. Please try again.';
};

export const ProsumerManagementPage = ({ hideHeader = false, hideTabs = false }) => {
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingProsumer, setViewingProsumer] = useState(null);
  const [editingProsumer, setEditingProsumer] = useState(null);
  const [statusActionTarget, setStatusActionTarget] = useState(null);

  /**
   * Fetches prosumer profiles from the backend service.
   */
  const loadProsumers = useCallback(async (status, { signal } = {}) => {
    setLoading(true);
    setError('');

    try {
      const filterArg = status === 'All' ? undefined : status;
      const data = await getProsumers(filterArg, { signal });

      if (!signal?.aborted) {
        setProsumers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (!signal?.aborted && err.name !== 'AbortError') {
        setError(getErrorMessage(err));
        setProsumers([]);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      loadProsumers(statusFilter, { signal: controller.signal });
    });

    return () => controller.abort();
  }, [statusFilter, loadProsumers]);

  const handleStatusChange = (newStatus) => {
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus);
    }
  };

  const handleRetry = () => {
    loadProsumers(statusFilter);
  };

  const handleOpenCreate = () => {
    setFeedback('');
    setIsCreateOpen(true);
  };

  const handleCreateSuccess = (created) => {
    setFeedback(`Prosumer ${created.fullName || created.nic} registered successfully.`);
    loadProsumers(statusFilter);
  };

  const handleViewProsumer = (prosumer) => {
    setViewingProsumer(prosumer);
  };

  const handleEditProsumer = (prosumer) => {
    setFeedback('');
    setEditingProsumer(prosumer);
  };

  const handleEditSuccess = (updated) => {
    setFeedback(`Prosumer ${updated.fullName || updated.nic} updated successfully.`);
    loadProsumers(statusFilter);
  };

  const handleStatusAction = (prosumer, targetStatus) => {
    setFeedback('');
    setStatusActionTarget({ prosumer, targetStatus });
  };

  const handleStatusSuccess = (updated, actionName) => {
    setFeedback(`Prosumer ${updated.fullName || updated.nic} ${actionName.toLowerCase()}d successfully.`);
    setStatusActionTarget(null);
    loadProsumers(statusFilter);
  };

  /**
   * Client-side search across currently loaded prosumers.
   */
  const filteredProsumers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return prosumers;
    }

    return prosumers.filter((p) => {
      const nic = (p.nic || '').toLowerCase();
      const fullName = (p.fullName || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();

      return (
        nic.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [prosumers, searchTerm]);

  const countText = useMemo(() => {
    const totalLoaded = prosumers.length;
    const displayed = filteredProsumers.length;

    if (searchTerm.trim()) {
      return `Showing ${displayed} of ${totalLoaded} prosumer${totalLoaded === 1 ? '' : 's'}`;
    }
    return `${totalLoaded} prosumer${totalLoaded === 1 ? '' : 's'} registered`;
  }, [prosumers.length, filteredProsumers.length, searchTerm]);

  // Counts for top cards
  const pendingCount = prosumers.filter((p) => p.status === 'Pending').length;
  const activeCount = prosumers.filter((p) => p.status === 'Active').length;

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader
          title="Prosumer Management"
          subtitle="Manage registered solar prosumers, review NIC profiles, and oversee microgrid trading participation."
        >
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#E3511B] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#F05A20]"
          >
            <MaterialIcon name="add" size={16} className="text-white" />
            <span>Register Prosumer</span>
          </button>
        </PageHeader>
      )}

      {/* TOP KPI CARDS (Only show when not embedded) */}
      {!hideHeader && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            title="Total Prosumers"
            value={loading ? '…' : prosumers.length}
            subtitle="Registered rooftop solar citizens"
            accent="default"
            icon={<MaterialIcon name="group" size={20} className="text-white" />}
          />
          <MetricCard
            title="Active Traders"
            value={loading ? '…' : activeCount}
            subtitle="Verified for energy slots"
            accent="emerald"
            icon={<MaterialIcon name="bolt" size={20} className="text-white" />}
          />
          <MetricCard
            title="Pending NIC Review"
            value={loading ? '…' : pendingCount}
            subtitle="Awaiting backoffice activation"
            accent="amber"
            icon={<MaterialIcon name="hourglass" size={20} className="text-white" />}
          />
          <MetricCard
            title="Deactivated"
            value={loading ? '…' : prosumers.filter((p) => p.status === 'Deactivated').length}
            subtitle="Suspended accounts"
            accent="default"
            icon={<MaterialIcon name="pause" size={20} className="text-white" />}
          />
        </div>
      )}

      {!hideTabs && (
        /* DIRECTORY SWITCHER TABS */
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Link
            to={`${ROUTES.ADMIN_SETTINGS}?tab=accounts`}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <span>Admin Settings &amp; Accounts</span>
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-[#E3511B]/40 bg-[#E3511B]/10 px-4 py-2 text-xs font-bold text-[#E3511B] shadow-sm"
          >
            <span>Solar Prosumers</span>
            <span className="rounded-full bg-[#E3511B] px-2 py-0.5 text-[10px] font-black text-white">
              {prosumers.length}
            </span>
          </button>
          <Link
            to={`${ROUTES.ADMIN_SETTINGS}?tab=create`}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <MaterialIcon name="add" size={14} className="text-white" />
            <span>Create New Administrator</span>
          </Link>
        </div>
      )}

      {hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Solar Prosumer Directory</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Review and activate solar prosumers registered via the mobile application.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#E3511B] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#F05A20]"
          >
            <MaterialIcon name="add" size={16} className="text-white" />
            <span>Register Prosumer</span>
          </button>
        </div>
      )}

      {/* Success / Feedback Alert */}
      {feedback && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-xs font-semibold text-[#22C55E]"
          role="status"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-base leading-none text-[#22C55E] hover:opacity-70"
            aria-label="Dismiss success message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div
          className="inline-flex flex-wrap rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-1"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map(({ label, value }) => {
            const isActive = statusFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusChange(value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#E3511B] text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                aria-pressed={isActive}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <label htmlFor="prosumer-search" className="sr-only">
            Search prosumers
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MaterialIcon name="search" size={14} className="text-white/50" />
          </div>
          <input
            id="prosumer-search"
            type="search"
            aria-label="Search prosumers by NIC, full name, email, or phone"
            placeholder="Search NIC, name, email, phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] py-2 pl-8 pr-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search input"
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Counts Summary */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{countText}</span>
          {statusFilter !== 'All' && (
            <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2 py-0.5 font-medium text-[var(--text-secondary)]">
              Filter: {statusFilter}
            </span>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="space-y-2">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <LoadingIndicator message="Loading solar prosumers…" />
      )}

      {/* Empty State: No prosumers in the current status category */}
      {!loading && !error && prosumers.length === 0 && (
        <EmptyState
          title={statusFilter === 'All' ? 'No prosumers registered' : `No ${statusFilter.toLowerCase()} prosumers`}
          message={
            statusFilter === 'All'
              ? 'There are currently no solar prosumer records registered in the system.'
              : `No prosumers were found with status "${statusFilter}".`
          }
        />
      )}

      {/* Empty State: Prosumers loaded, but search query returned 0 matches */}
      {!loading && !error && prosumers.length > 0 && filteredProsumers.length === 0 && (
        <EmptyState
          title="No matching prosumers found"
          message={`No prosumers matched "${searchTerm.trim()}". Try searching with a different NIC, name, email, or phone number.`}
        >
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="inline-flex items-center rounded-xl bg-[#E3511B] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#F05A20]"
          >
            Clear search
          </button>
        </EmptyState>
      )}

      {/* Populated Table */}
      {!loading && !error && filteredProsumers.length > 0 && (
        <ProsumerTable
          prosumers={filteredProsumers}
          onView={handleViewProsumer}
          onEdit={handleEditProsumer}
          onStatusAction={handleStatusAction}
        />
      )}

      {/* Create Prosumer Modal */}
      <CreateProsumerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Prosumer Details Modal */}
      <ProsumerDetailsModal
        isOpen={Boolean(viewingProsumer)}
        prosumer={viewingProsumer}
        onClose={() => setViewingProsumer(null)}
      />

      {/* Edit Prosumer Modal */}
      {editingProsumer && (
        <EditProsumerModal
          key={editingProsumer.nic}
          isOpen={Boolean(editingProsumer)}
          prosumer={editingProsumer}
          onClose={() => setEditingProsumer(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Status Action Confirmation Modal */}
      {statusActionTarget && (
        <ProsumerStatusModal
          key={`${statusActionTarget.prosumer.nic}-${statusActionTarget.targetStatus}`}
          isOpen={Boolean(statusActionTarget)}
          prosumer={statusActionTarget.prosumer}
          targetStatus={statusActionTarget.targetStatus}
          onClose={() => setStatusActionTarget(null)}
          onSuccess={handleStatusSuccess}
        />
      )}
    </div>
  );
};

export default ProsumerManagementPage;
