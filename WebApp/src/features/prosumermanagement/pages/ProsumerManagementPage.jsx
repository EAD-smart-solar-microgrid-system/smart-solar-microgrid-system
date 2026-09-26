/**
 * Prosumer Management Page
 *
 * Member 2 Backoffice Solar Prosumer administration view.
 * Supports status filtering (All, Pending, Active, Deactivated),
 * client-side multi-field searching, and clean state handling.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LoadingIndicator } from '../../../components/common/LoadingIndicator.jsx';
import { ErrorAlert } from '../../../components/common/ErrorAlert.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { ProsumerTable } from '../components/ProsumerTable.jsx';
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
 *
 * @param {Error|ApiError|any} err
 * @returns {string} Formatted error message
 */
const getErrorMessage = (err) => {
  if (err instanceof ApiError && err.status) {
    return `API error (${err.status}): ${err.message}`;
  }
  return err?.message || 'The prosumer request could not be completed. Please try again.';
};

export const ProsumerManagementPage = () => {
  const [prosumers, setProsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Fetches prosumer profiles from the backend service.
   * Status 'All' fetches all prosumers; specific statuses pass the status query parameter.
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

  /**
   * Client-side search across currently loaded prosumers.
   * Matches case-insensitively against NIC, Full Name, Email, and Phone.
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

  /**
   * Accurate result count text based on currently loaded and searched records.
   */
  const countText = useMemo(() => {
    const totalLoaded = prosumers.length;
    const displayed = filteredProsumers.length;

    if (searchTerm.trim()) {
      return `Showing ${displayed} of ${totalLoaded} prosumer${totalLoaded === 1 ? '' : 's'}`;
    }
    return `${totalLoaded} prosumer${totalLoaded === 1 ? '' : 's'} loaded`;
  }, [prosumers.length, filteredProsumers.length, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prosumer Management"
        subtitle="Manage registered solar prosumers, monitor their account status, and oversee microgrid participation."
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div
          className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-100 p-1"
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
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
            <span className="text-sm text-slate-400" aria-hidden="true">
              🔍
            </span>
          </div>
          <input
            id="prosumer-search"
            type="search"
            aria-label="Search prosumers by NIC, full name, email, or phone"
            placeholder="Search NIC, name, email, phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search input"
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <span className="text-sm font-bold leading-none">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Counts Summary */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{countText}</span>
          {statusFilter !== 'All' && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              Filtered: {statusFilter}
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
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
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
            className="inline-flex items-center rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-700"
          >
            Clear search
          </button>
        </EmptyState>
      )}

      {/* Populated Table */}
      {!loading && !error && filteredProsumers.length > 0 && (
        <ProsumerTable prosumers={filteredProsumers} />
      )}
    </div>
  );
};

export default ProsumerManagementPage;
