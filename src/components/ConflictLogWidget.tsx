/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { describeConflict } from '../lib/describeConflict';
import { Conflict } from '../types';

interface ConflictLogWidgetProps {
  onResolve?: (conflictId: string) => void;
  onViewAll?: () => void;
}

export const ConflictLogWidget: React.FC<ConflictLogWidgetProps> = ({
  onResolve,
  onViewAll,
}) => {
  const {
    conflicts,
    rooms,
    faculty,
    courses,
    events,
    resolveConflictById,
    setActiveNav,
  } = useScheduleStore();

  const handleResolveClick = (conflict: Conflict) => {
    if (onResolve) {
      onResolve(conflict.id);
    } else {
      resolveConflictById(conflict.id);
    }
  };

  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      setActiveNav('conflicts');
    }
  };

  // Up to 6 newest conflicts (or active conflicts)
  const displayConflicts = [...conflicts].slice(0, 6);
  const unresolvedCount = conflicts.filter((c) => !c.resolution).length;

  return (
    <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className={`h-4 w-4 ${unresolvedCount > 0 ? 'text-warn' : 'text-ok'}`} />
          <h3 className="text-sm font-medium text-fg">
            Conflict feed
          </h3>
          {unresolvedCount > 0 && (
            <span className="font-mono text-xs text-warn">
              {unresolvedCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleViewAllClick}
          className="text-xs font-medium text-fg-2 hover:underline flex items-center space-x-1 cursor-pointer rounded"
        >
          <span>View all</span>
          <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
        </button>
      </div>

      {/* List / Empty State */}
      {displayConflicts.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="text-ok flex items-center justify-center">
            <ShieldCheck strokeWidth={1.5} className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-fg-2">
            No conflicts, the schedule is clean
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayConflicts.map((conflict) => {
            const isResolved = !!conflict.resolution;
            const description = describeConflict(conflict, {
              rooms,
              faculty,
              courses,
              events,
            });

            const severityDot =
              conflict.severity === 'high'
                ? 'bg-bad'
                : conflict.severity === 'medium'
                ? 'bg-warn'
                : 'bg-fg-3';

            return (
              <div
                key={conflict.id}
                className={`p-3 rounded-lg border text-xs space-y-2 transition-colors ${
                  isResolved
                    ? 'border-line bg-raised'
                    : 'border-line bg-page/50 hover:border-line-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                        isResolved ? 'bg-ok' : severityDot
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-fg leading-snug">
                        {description}
                      </p>
                      <span className="text-xs text-fg-3 font-mono">
                        {conflict.kind} • {conflict.detectedAt ? conflict.detectedAt.substring(11, 16) : ''}
                      </span>
                    </div>
                  </div>

                  {/* Action / Status */}
                  <div className="shrink-0">
                    {isResolved ? (
                      <span
                        className="inline-flex items-center text-ok text-xs"
                        title="Conflict resolved"
                      >
                        <CheckCircle strokeWidth={1.5} className="h-4 w-4" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolveClick(conflict)}
                        className="h-8 px-3 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer"
                        aria-label={`Resolve conflict ${conflict.id}`}
                      >
                                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Resolution line if resolved */}
                {isResolved && conflict.resolution && (
                  <div className="pt-2 border-t border-line text-xs text-fg-2">
                    {conflict.resolution.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
