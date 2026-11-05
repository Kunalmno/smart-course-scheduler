/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, GitMerge } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';

const WEEK_DAYS = [
  { date: '2026-11-09', label: 'Mon 9' },
  { date: '2026-11-10', label: 'Tue 10' },
  { date: '2026-11-11', label: 'Wed 11' },
  { date: '2026-11-12', label: 'Thu 12' },
  { date: '2026-11-13', label: 'Fri 13' },
];

interface StatProps {
  label: string;
  value: React.ReactNode;
  note: string;
  tone?: 'default' | 'warn' | 'ok';
}

/** A stat is a label, a figure and what it compares to. Nothing else. */
const Stat: React.FC<StatProps> = ({ label, value, note, tone = 'default' }) => (
  <div className="rounded-xl border border-line bg-surface p-5 flex flex-col gap-3 min-h-32">
    <span className="text-sm text-fg-2">{label}</span>
    <span
      className={`text-3xl font-medium leading-none tabular-nums ${
        tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-fg'
      }`}
    >
      {value}
    </span>
    <span className="text-xs text-fg-3">{note}</span>
  </div>
);

export const Dashboard: React.FC = () => {
  const {
    events,
    rooms,
    faculty,
    courses,
    scholars,
    resolutionLogs,
    selectedDate,
    setSelectedDate,
    resolveConflictById,
    autoResolveAllConflicts,
    resetToMockData,
    getActiveConflicts,
    getConflictCount,
    getScheduledHoursForSelectedDate,
    getOccupancyRateForSelectedDate,
    getScholarMetrics,
    getBuildingMetrics,
  } = useScheduleStore();

  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const activeConflicts = getActiveConflicts();
  const conflictCount = getConflictCount();
  const scheduledHours = getScheduledHoursForSelectedDate();
  const occupancy = getOccupancyRateForSelectedDate();
  const scholarMetrics = getScholarMetrics();
  const buildingMetrics = getBuildingMetrics();
  const eventsToday = events.filter((e) => e.start.startsWith(selectedDate)).length;

  const handleAutoResolve = () => {
    const result = autoResolveAllConflicts();
    setLastActionMessage(
      `Resolved ${result.resolvedCount} conflict${result.resolvedCount === 1 ? '' : 's'}, ${result.unresolvedCount} remaining`
    );
  };

  const handleResolveSingle = (conflictId: string) => {
    const res = resolveConflictById(conflictId);
    setLastActionMessage(
      res
        ? `Resolved ${conflictId}: ${res.detail}`
        : `Could not resolve ${conflictId} automatically`
    );
  };

  const handleReset = () => {
    resetToMockData();
    setLastActionMessage('Schedule reset to the sample data');
  };

  return (
    <div className="min-h-screen bg-page text-fg flex flex-col">
      {/* Page header */}
      <header className="border-b border-line bg-surface sticky top-0 z-30 px-8 h-16 flex items-center">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-fg">Dashboard</h1>
            <p className="text-xs text-fg-3">Conflict detection and resolution</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="h-8 px-3 text-xs font-medium text-fg-2 hover:text-fg bg-raised hover:bg-line-strong rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw strokeWidth={1.5} className="h-4 w-4" />
              <span>Reset data</span>
            </button>
            <button
              onClick={handleAutoResolve}
              disabled={activeConflicts.length === 0}
              className={`h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${
                activeConflicts.length > 0
                  ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                  : 'bg-raised text-fg-3 cursor-not-allowed'
              }`}
            >
              <GitMerge strokeWidth={1.5} className="h-4 w-4" />
              <span>Auto-resolve ({activeConflicts.length})</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8 space-y-6">
        {lastActionMessage && (
          <div
            role="status"
            className="px-4 h-10 bg-raised border border-line rounded-lg text-xs text-fg-2 flex items-center justify-between animate-enter"
          >
            <span>{lastActionMessage}</span>
            <button
              onClick={() => setLastActionMessage(null)}
              className="text-fg-3 hover:text-fg text-xs transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat
            label="Active conflicts"
            value={conflictCount}
            tone={conflictCount > 0 ? 'warn' : 'ok'}
            note={conflictCount === 0 ? 'All sessions verified' : 'Waiting for resolution'}
          />
          <Stat
            label="Scheduled hours"
            value={`${scheduledHours}h`}
            note={`${eventsToday} session${eventsToday === 1 ? '' : 's'} on ${selectedDate}`}
          />
          <Stat
            label="Room occupancy"
            value={`${occupancy.ratePercentage}%`}
            note={`${occupancy.scheduledHours}h of ${occupancy.totalAvailableHours}h available`}
          />
          <Stat
            label="Scholars enrolled"
            value={scholarMetrics.total}
            note={`${scholarMetrics.byType.undergraduate} undergrad, ${scholarMetrics.byType.graduate} grad, ${scholarMetrics.byType.phd} PhD`}
          />
        </div>

        {/* Week selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-fg-3">Week</span>
          <div className="flex items-center gap-1 bg-raised p-1 rounded-lg">
            {WEEK_DAYS.map((item) => (
              <button
                key={item.date}
                onClick={() => setSelectedDate(item.date)}
                className={`h-8 px-3 text-xs font-medium rounded transition-colors cursor-pointer ${
                  selectedDate === item.date
                    ? 'bg-surface text-fg ring-1 ring-inset ring-line'
                    : 'text-fg-3 hover:text-fg'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conflict queue and audit log: the wide column */}
          <div className="lg:col-span-2 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-fg">
                  Conflict queue <span className="font-mono text-sm text-fg-3">{activeConflicts.length}</span>
                </h2>
              </div>

              {activeConflicts.length === 0 ? (
                <div className="rounded-xl border border-line bg-surface p-8 text-center space-y-3">
                  <CheckCircle2 strokeWidth={1.5} className="h-5 w-5 text-ok mx-auto" />
                  <h3 className="text-sm font-medium text-fg">No conflicts</h3>
                  <p className="text-xs text-fg-3 max-w-md mx-auto">
                    All {events.length} sessions fit their room capacity, equipment, availability windows and faculty schedules.
                  </p>
                  <button
                    onClick={handleReset}
                    className="h-8 px-3 text-xs font-medium text-fg-2 hover:text-fg bg-raised hover:bg-line-strong rounded-lg cursor-pointer transition-colors"
                  >
                    Reload sample conflicts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeConflicts.map((conflict) => {
                    const event = events.find((e) => e.id === conflict.eventId);
                    const relatedEvent = conflict.relatedEventId
                      ? events.find((e) => e.id === conflict.relatedEventId)
                      : null;
                    const room = event ? rooms.find((r) => r.id === event.roomId) : null;
                    const course = event ? courses.find((c) => c.id === event.courseId) : null;
                    const facultyMember = event ? faculty.find((f) => f.id === event.facultyId) : null;

                    return (
                      <div
                        key={conflict.id}
                        className="rounded-xl border border-line bg-surface p-4 space-y-3 transition-colors hover:border-line-strong"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle strokeWidth={1.5} className="h-4 w-4 text-warn shrink-0" />
                            <span className="text-xs font-medium text-fg">{conflict.kind}</span>
                            <span className="font-mono text-xs text-fg-3">{conflict.eventId}</span>
                            {conflict.relatedEventId && (
                              <span className="flex items-center gap-1 text-fg-3">
                                <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
                                <span className="font-mono text-xs">{conflict.relatedEventId}</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleResolveSingle(conflict.id)}
                            className="h-8 px-3 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>

                        <div className="text-xs space-y-1">
                          <p className="text-sm font-medium text-fg">
                            {course?.code} {course?.title}
                          </p>
                          <p className="text-fg-3">
                            {room?.name} ({room?.building}), {facultyMember?.name}, {event?.start.substring(0, 10)}{' '}
                            {event?.start.substring(11, 16)} to {event?.end.substring(11, 16)}
                          </p>
                          {conflict.kind === 'room-overlap' && relatedEvent && (
                            <p className="text-fg-2">
                              Overlaps with {relatedEvent.id} in {room?.name}
                            </p>
                          )}
                          {conflict.kind === 'faculty-overlap' && (
                            <p className="text-fg-2">
                              {facultyMember?.name} is booked for two sessions at the same time
                            </p>
                          )}
                          {conflict.kind === 'over-capacity' && room && event && (
                            <p className="text-fg-2">
                              {event.scholarCount} scholars enrolled in a room for {room.capacity}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Resolution history */}
            <section className="rounded-xl border border-line bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-medium text-fg">
                  Resolution log <span className="font-mono text-fg-3">{resolutionLogs.length}</span>
                </h3>
              </div>

              {resolutionLogs.length === 0 ? (
                <p className="text-xs text-fg-3 py-2">
                  No resolutions yet. Select Auto-resolve to run the resolver.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {resolutionLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-page text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-fg-2">
                          {log.action} {log.eventId}
                        </span>
                        <span className="font-mono text-fg-3">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-fg-2">{log.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Narrow column: ranked lists, not another chart */}
          <div className="space-y-6">
            <section className="rounded-xl border border-line bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-fg">Buildings</h3>
                <span className="font-mono text-xs text-fg-3">{rooms.length} rooms</span>
              </div>

              <div className="divide-y divide-line">
                {buildingMetrics.map((b) => (
                  <div key={b.building} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-fg">{b.building}</p>
                      <p className="text-fg-3">
                        {b.roomCount} rooms, capacity {b.totalCapacity}
                      </p>
                    </div>
                    <span className="font-mono text-fg-2">{b.activeEventsCount} sessions</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-fg">Scholars by degree</h3>
                <span className="font-mono text-xs text-fg-3">{scholars.length} enrolled</span>
              </div>

              <div className="divide-y divide-line">
                {[
                  { label: 'Undergraduate', value: scholarMetrics.byType.undergraduate },
                  { label: 'Graduate', value: scholarMetrics.byType.graduate },
                  { label: 'PhD', value: scholarMetrics.byType.phd },
                  { label: 'Postdoc', value: scholarMetrics.byType.postdoc },
                ].map((row) => (
                  <div key={row.label} className="py-3 flex items-center justify-between text-xs">
                    <span className="text-fg-2">{row.label}</span>
                    <span className="font-mono text-fg tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
