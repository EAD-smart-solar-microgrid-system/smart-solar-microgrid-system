import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/apiClient.js';
import { ROUTES } from '../constants/routes.js';
import { MetricCard } from '../components/common/MetricCard.jsx';
import { MaterialIcon } from '../components/common/MaterialIcon.jsx';
import { SolarHubMap } from '../components/common/SolarHubMap.jsx';
import { SelectedHubDetailsPanel } from '../components/common/SelectedHubDetailsPanel.jsx';
import microgridNetworkImg from '../assets/microgrid-network.jpg';
import qrHandshakeImg from '../assets/qr-dispatch-handshake.jpg';

export const HomePage = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [stats, setStats] = useState({
    activeHubs: 0,
    totalCapacityMw: '0.00',
    totalSlots: 0,
    activeReservations: 0,
  });

  const fetchDashboardData = async (isMounted = true) => {
    try {
      setLoading(true);
      const [stationsData, monitoringData] = await Promise.all([
        apiRequest('/api/stations').catch(() => []),
        apiRequest('/api/member4/reservation-monitoring').catch(() => ({ totalCount: 0 })),
      ]);

      if (!isMounted) return;

      const stationsList = Array.isArray(stationsData) ? stationsData : [];
      setStations(stationsList);

      if (stationsList.length > 0) {
        const firstActive = stationsList.find((s) => (s.status || '').toLowerCase() === 'active') || stationsList[0];
        setSelectedStation(firstActive);
      }

      const activeCount = stationsList.filter(
        (s) => (s.status || '').toLowerCase() === 'active'
      ).length;

      const totalKw = stationsList.reduce(
        (sum, s) => sum + (Number(s.capacityKwPerHour) || 0),
        0
      );

      const totalSlotsCount = stationsList.reduce(
        (sum, s) => sum + (Number(s.batteryStorageSlotCapacity) || 0),
        0
      );

      const bookedReservations =
        monitoringData?.totalCount ??
        (Array.isArray(monitoringData?.items) ? monitoringData.items.length : 0);

      setStats({
        activeHubs: activeCount,
        totalCapacityMw: totalKw >= 1000 ? `${(totalKw / 1000).toFixed(2)} MW` : `${totalKw} kW`,
        totalSlots: totalSlotsCount,
        activeReservations: bookedReservations,
      });
    } catch {
      // Resilient fallback
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchDashboardData(isMounted);
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered operational list for recent activities table
  const filteredActivities = useMemo(() => {
    if (!activitySearch.trim()) return stations;
    const q = activitySearch.toLowerCase().trim();
    return stations.filter(
      (s) =>
        (s.stationName || '').toLowerCase().includes(q) ||
        (s.hubId || '').toLowerCase().includes(q)
    );
  }, [stations, activitySearch]);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER (Inspired directly by reference header) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Overview
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Here is the summary of microgrid generation and dispatch data
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe pill */}
          <div className="flex items-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
            <span>This Month</span>
            <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">▾</span>
          </div>

          {/* Reset / Refresh button */}
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition disabled:opacity-50"
          >
            <MaterialIcon name="refresh" size={14} className={`text-white ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. TOP KPI CARDS (One orange highlight + 3 dark/light neutral cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Capacity (THE HIGHLIGHTED ORANGE CARD) */}
        <MetricCard
          title="Total Installed Capacity"
          value={loading ? '—' : stats.totalCapacityMw}
          subtitle="Distributed solar generation flow"
          highlight={true}
          trend="+14.2% ↑"
          trendPositive={true}
          actionLabel="Explore fleet"
          onAction={() => setShowMap(true)}
          icon={<MaterialIcon name="solar_power" size={22} className="text-white" />}
        />

        {/* KPI 2: Active Solar Hubs */}
        <MetricCard
          title="Active Solar Hubs"
          value={loading ? '—' : `${stats.activeHubs} Hubs`}
          subtitle={`${stations.length} registered microgrid nodes`}
          trend="+1 synchronized"
          trendPositive={true}
          actionLabel="View all nodes"
          onAction={() => {}}
          icon={<MaterialIcon name="bolt" size={22} className="text-white" />}
        />

        {/* KPI 3: Available Battery Storage */}
        <MetricCard
          title="Storage Capacity"
          value={loading ? '—' : `${stats.totalSlots} Slots`}
          subtitle="Physical battery locker units"
          trend="98.5% readiness"
          trendPositive={true}
          actionLabel="Check lockers"
          onAction={() => {}}
          icon={<MaterialIcon name="battery" size={22} className="text-white" />}
        />

        {/* KPI 4: Active Reservations */}
        <MetricCard
          title="Active Reservations"
          value={loading ? '—' : `${stats.activeReservations} Active`}
          subtitle="Live prosumer energy bookings"
          trend="+8 today"
          trendPositive={true}
          actionLabel="Review bookings"
          onAction={() => {}}
          icon={<MaterialIcon name="event" size={22} className="text-white" />}
        />
      </div>

      {/* 3. MAIN SECTION: FLEET HUBS + SELECTED HUB DETAILS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7 flex">
          <div className="flex h-full w-full flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Microgrid Fleet
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  7 interconnected stations across Sri Lanka
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[#E3511B] hover:border-[#E3511B]/40 transition"
                >
                  {showMap ? 'Hide Map' : 'View Map'}
                </button>

                <Link
                  to={ROUTES.STATIONS}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E3511B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#F05A20]"
                >
                  <MaterialIcon name="add" size={14} className="text-white" />
                  <span>Add Hub</span>
                </Link>
              </div>
            </div>

            {/* If Map is toggled, display interactive SVG map */}
            {showMap && (
              <div className="pt-4 pb-2">
                <SolarHubMap
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={setSelectedStation}
                />
              </div>
            )}

            {/* Grid of 4 Hub mini cards */}
            <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2 pt-4">
              {stations.slice(0, 4).map((st) => {
                const isActive = (st.status || '').toLowerCase() === 'active';
                const isSelected = selectedStation?.hubId === st.hubId;
                return (
                  <div
                    key={st.hubId}
                    onClick={() => setSelectedStation(st)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-[#E3511B] bg-[var(--bg-elevated)] ring-1 ring-[#E3511B]/30'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          {st.stationName.split(' ')[0]} Hub
                        </span>
                        <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                          {st.hubId}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">⋮</span>
                    </div>

                    <div className="mt-3">
                      <span className="text-xl font-extrabold text-[var(--text-primary)]">
                        {st.capacityKwPerHour} <span className="text-xs font-normal text-[var(--text-muted)]">kW/h</span>
                      </span>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {st.batteryStorageSlotCapacity} storage lockers
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isActive ? 'text-[#22C55E]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        ● {st.status || 'Active'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        Select →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex">
          {selectedStation && (
            <SelectedHubDetailsPanel station={selectedStation} className="h-full w-full" />
          )}
        </div>
      </div>

      {/* 4. BOTTOM SECTION: RECENT ACTIVITIES TABLE (Inspired by reference bottom section) */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Recent Operations &amp; Dispatch Activities
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Real-time telemetry and prosumer battery reservation audit trail
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search hub or ID..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-44 sm:w-56 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 pl-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#E3511B]"
              />
              <MaterialIcon name="search" size={14} className="absolute left-2.5 top-2.5 text-white/50" />
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white"
            >
              <MaterialIcon name="filter_list" size={14} className="text-white" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-bold">Activity / Node</th>
                <th className="px-4 py-3 font-bold">Hub ID</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Capacity Flow</th>
                <th className="px-4 py-3 font-bold">Tariff Rate</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredActivities.slice(0, 5).map((st, idx) => {
                const isActive = (st.status || '').toLowerCase() === 'active';
                return (
                  <tr key={st.hubId} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E3511B]/15 text-white">
                          <MaterialIcon name="bolt" size={14} className="text-white" />
                        </span>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{st.stationName}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Grid Dispatch Node</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-muted)]">
                      {st.hubId}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      {`1${7 - idx} Oct, 2026`}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[var(--text-primary)]">
                      {st.capacityKwPerHour} kW/h
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--text-secondary)]">
                      LKR 42.50 / kWh
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)]'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {isActive ? 'Completed' : 'Standby'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ARCHITECTURE & QR PROTOCOL EXPLANATION */}
      <div className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3511B]">
              Decentralized Architecture
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              How Microgrid Trading Operates
            </h2>
          </div>
          <span className="hidden sm:inline-block rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            QR Token Handshake Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-[var(--shadow-card)]">
          {/* QR Handshake Visual */}
          <div className="lg:col-span-5 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]">
            <img
              src={qrHandshakeImg}
              alt="Cryptographic QR Energy Dispatch Handshake token verification at smart solar battery station"
              className="w-full h-auto object-cover max-h-[320px]"
              loading="lazy"
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3511B]">
                Secure Energy Transfer
              </span>
              <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                Instant QR Energy Dispatch &amp; Arrival Validation
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                When a prosumer reserves a battery storage slot, the system generates a single-use cryptographic QR token. Station grid operators scan this token on-site to verify arrival windows and authorize energy transfer immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                <span className="text-sm font-black text-[#E3511B]">① Register &amp; NIC</span>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Solar owners create an account verified by Backoffice administration.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                <span className="text-sm font-black text-[#E3511B]">② Reserve Slot</span>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Select available battery lockers at local microgrid charging nodes.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                <span className="text-sm font-black text-[#E3511B]">③ Issue QR Token</span>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Encrypted token issued to prosumer for single-use physical handoff.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                <span className="text-sm font-black text-[#E3511B]">④ Operator Scan</span>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Camera QR scan unlocks battery compartment and transfers energy units.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Community Network Overview Image Banner */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-card)]">
          <img
            src={microgridNetworkImg}
            alt="Sustainable Solar Microgrid Community Network connecting rooftop solar prosumers with smart battery charging hubs"
            className="w-full h-auto rounded-xl object-cover max-h-[340px]"
            loading="lazy"
          />
          <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              Community Solar Microgrid Architecture
            </span>
            <span>
              Decentralized peer-to-battery network with dynamic load distribution
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
