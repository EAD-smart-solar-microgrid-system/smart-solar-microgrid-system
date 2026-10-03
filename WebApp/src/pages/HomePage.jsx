import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/apiClient.js';
import { ROUTES } from '../constants/routes.js';
import { MetricCard } from '../components/common/MetricCard.jsx';
import { SolarHubMap } from '../components/common/SolarHubMap.jsx';
import { SelectedHubDetailsPanel } from '../components/common/SelectedHubDetailsPanel.jsx';
import microgridNetworkImg from '../assets/microgrid-network.jpg';
import qrHandshakeImg from '../assets/qr-dispatch-handshake.jpg';

export const HomePage = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly'); // 'monthly' | 'yearly'
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

  // Synthetic monthly/yearly generation bar data for the chart directly inspired by reference
  const chartBars = useMemo(() => {
    if (chartView === 'yearly') {
      return [
        { label: '2021', value: 95, height: '28%' },
        { label: '2022', value: 140, height: '42%' },
        { label: '2023', value: 210, height: '58%' },
        { label: '2024', value: 310, height: '72%' },
        { label: '2025', value: 420, height: '86%' },
        { label: '2026', value: 540, height: '98%' },
      ];
    }
    return [
      { label: 'May', value: 180, height: '45%' },
      { label: 'Jun', value: 240, height: '60%' },
      { label: 'Jul', value: 310, height: '75%' },
      { label: 'Aug', value: 380, height: '82%' },
      { label: 'Sep', value: 450, height: '90%' },
      { label: 'Oct', value: 540, height: '98%' },
    ];
  }, [chartView]);

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
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition"
          >
            <span className="text-[13px]">⟲</span>
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
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
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
          icon={
            <svg className="h-5 w-5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
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
          icon={
            <svg className="h-5 w-5 text-[#E3511B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
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
          icon={
            <svg className="h-5 w-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* 3. MAIN SECTION: FLEET HUBS (LEFT) + GENERATION FLOW BAR CHART (RIGHT) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN (~55%): FLEET HUBS (Inspired by "My Wallet" in reference) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
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
                  className="inline-flex items-center gap-1 rounded-xl bg-[#E3511B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#F05A20]"
                >
                  <span>+ Add Hub</span>
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

            {/* Grid of 4 Hub mini cards (Translates the 4 currency wallet cards in reference image) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4">
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

        {/* RIGHT COLUMN (~45%): GENERATION FLOW BAR CHART (Inspired by "Cash Flow" in reference) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Energy Yield Flow
                </h3>
                <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  540,323 <span className="text-xs font-bold text-[#E3511B]">kWh</span>
                </div>
              </div>

              {/* Monthly / Yearly Toggle Pill */}
              <div className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setChartView('monthly')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    chartView === 'monthly'
                      ? 'bg-[#E3511B] text-white font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('yearly')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    chartView === 'yearly'
                      ? 'bg-[#E3511B] text-white font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Custom Bar Chart (Vivid Orange Bars directly styled after reference) */}
            <div className="mt-4 pt-2">
              <div className="flex items-end justify-between gap-3 h-48 px-2 border-b border-[var(--border-subtle)]">
                {chartBars.map((bar) => (
                  <div key={bar.label} className="group flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    {/* Tooltip on hover */}
                    <span className="text-[10px] font-bold text-[#E3511B] opacity-0 group-hover:opacity-100 transition">
                      {bar.value}k
                    </span>
                    {/* The vivid orange bar */}
                    <div
                      className="w-full max-w-[38px] rounded-t-lg bg-[#E3511B] transition-all duration-300 hover:bg-[#F05A20] shadow-sm shadow-[#E3511B]/20"
                      style={{ height: bar.height }}
                    />
                  </div>
                ))}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between px-2 pt-2 text-[11px] font-medium text-[var(--text-muted)]">
                {chartBars.map((bar) => (
                  <span key={bar.label} className="flex-1 text-center">
                    {bar.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Chart Summary Footnote */}
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Peak Clean Output: <strong>1,240 kW</strong></span>
              <span className="text-[#22C55E] font-semibold">+18.4% vs Grid Baseline</span>
            </div>
          </div>

          {/* Selected Station Mini Telemetry */}
          {selectedStation && (
            <SelectedHubDetailsPanel station={selectedStation} />
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
              <svg
                className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <span>Filter</span>
              <span className="text-[10px]">⚙</span>
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
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E3511B]/15 text-[#E3511B]">
                          ⚡
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
