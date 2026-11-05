/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  GitMerge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { describeConflict } from '../../lib/describeConflict';

export const AutoSchedulerModal: React.FC = () => {
  const {
    isAutoSchedulerModalOpen,
    setAutoSchedulerModalOpen,
    autoSchedulerLogs,
    autoSchedulerSummary,
    isAutoSchedulerRunning,
    undo,
    openEditEventModal,
    rooms,
    faculty,
    courses,
    events,
  } = useScheduleStore();

  if (!isAutoSchedulerModalOpen) return null;

  const unresolvedSteps = autoSchedulerLogs.filter((s) => s.status === 'unresolved');
  const resolvedSteps = autoSchedulerLogs.filter((s) => s.status === 'resolved');

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-enter duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduler-modal-title"
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl bg-surface border border-line shadow-float text-fg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-page">
          <div className="flex items-center space-x-3">
            <GitMerge strokeWidth={1.5} className="h-5 w-5 text-accent" />
            <div>
              <h2 id="scheduler-modal-title" className="text-base font-medium">
                Conflict resolver
              </h2>
              <p className="text-xs text-fg-3">
                Deterministic backtracking heuristic room allocation and time-shifting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoSchedulerModalOpen(false)}
            aria-label="Close modal"
            className="p-2 rounded-xl text-fg-3 hover:text-fg-2 hover:bg-raised transition-colors cursor-pointer"
          >
            <X strokeWidth={1.5} className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Banner */}
          {isAutoSchedulerRunning ? (
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-raised border border-line text-fg-2">
              <Loader2 strokeWidth={1.5} className="h-4 w-4 animate-spin shrink-0" />
              <div>
                <p className="font-medium text-xs">Resolving conflicts</p>
                <p className="text-xs opacity-80">
                  Processing high-severity collisions first and verifying non-interference
                </p>
              </div>
            </div>
          ) : autoSchedulerSummary ? (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                autoSchedulerSummary.unresolvedCount === 0
                  ? 'bg-raised border-line text-ok'
                  : 'bg-raised border-line text-warn'
              }`}
            >
              <div className="flex items-center space-x-3">
                {autoSchedulerSummary.unresolvedCount === 0 ? (
                  <CheckCircle2 strokeWidth={1.5} className="h-4 w-4 text-ok shrink-0" />
                ) : (
                  <AlertTriangle strokeWidth={1.5} className="h-4 w-4 text-warn shrink-0" />
                )}
                <div>
                  <h3 className="font-medium text-xs">
                    {autoSchedulerSummary.resolvedCount} conflict
                    {autoSchedulerSummary.resolvedCount !== 1 ? 's' : ''} resolved,{' '}
                    {autoSchedulerSummary.unresolvedCount} need manual review
                  </h3>
                  <p className="text-xs opacity-80">
                    {autoSchedulerSummary.unresolvedCount === 0
                      ? 'All academic timetable constraints satisfied without conflicts.'
                      : 'Remaining conflicts require curriculum adjustments or manual override.'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Step-by-Step Resolution Stream */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-fg-3">
              Execution Log ({autoSchedulerLogs.length} step{autoSchedulerLogs.length !== 1 ? 's' : ''})
            </h4>

            {autoSchedulerLogs.length === 0 && !isAutoSchedulerRunning ? (
              <p className="text-xs text-fg-3 ">No operations recorded</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {autoSchedulerLogs.map((step, idx) => {
                  const conflictDesc = describeConflict(step.conflict, {
                    rooms,
                    faculty,
                    courses,
                    events,
                  });

                  return (
                    <div
                      key={step.conflict.id || idx}
                      className="p-3 rounded-xl border border-line bg-page text-xs space-y-2 animate-enter"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-fg-3">
                          Step {idx + 1} • {step.conflict.kind}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            step.status === 'resolved'
                              ? 'bg-raised text-ok'
                              : 'bg-raised text-bad'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      <p className="text-fg-2 font-medium">
                        {conflictDesc}
                      </p>

                      {step.resolution && (
                        <div className="text-xs text-fg-2 flex items-center space-x-1 font-medium pt-1">
                          <span>Action:</span>
                          <span>{step.resolution.detail}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unresolved Conflicts Section with "Open event" link */}
          {unresolvedSteps.length > 0 && !isAutoSchedulerRunning && (
            <div className="space-y-2 pt-2 border-t border-line">
              <h4 className="text-xs font-medium text-bad">
                Needs manual intervention ({unresolvedSteps.length})
              </h4>
              <div className="space-y-2">
                {unresolvedSteps.map((step) => {
                  const evt = events.find((e) => e.id === step.conflict.eventId);
                  const course = courses.find((c) => c.id === evt?.courseId);

                  return (
                    <div
                      key={step.conflict.id}
                      className="p-3 rounded-xl border border-line bg-raised text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-medium text-fg">
                          {course?.code} ({step.conflict.kind})
                        </span>
                        <p className="text-xs text-fg-3">
                          {describeConflict(step.conflict, {
                            rooms,
                            faculty,
                            courses,
                            events,
                          })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAutoSchedulerModalOpen(false);
                          openEditEventModal(step.conflict.eventId);
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-surface border border-line text-fg-2 hover:bg-raised flex items-center space-x-1 shrink-0 cursor-pointer"
                      >
                        <span>Open event</span>
                        <ExternalLink strokeWidth={1.5} className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-page">
          <div>
            {resolvedSteps.length > 0 && !isAutoSchedulerRunning && (
              <button
                type="button"
                onClick={() => {
                  undo();
                  setAutoSchedulerModalOpen(false);
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg text-fg-2 hover:text-fg hover:bg-line-strong transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <RotateCcw strokeWidth={1.5} className="h-4 w-4" />
                <span>Undo auto-resolve</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isAutoSchedulerRunning}
              onClick={() => setAutoSchedulerModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
