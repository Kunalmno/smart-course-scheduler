/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalendarClock, AlertCircle, Clock } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useScheduleStore } from '../store/useScheduleStore';
import { selectFilteredDeadlines } from '../store/selectors';

type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export const DeadlinesWidget: React.FC = () => {
  const { deadlines, selectedDate } = useScheduleStore();
  const [filter, setFilter] = useState<PriorityFilter>('all');

  const filtered = selectFilteredDeadlines(deadlines, filter);

  // Format relative due date based on reference selectedDate (e.g. 2026-11-09)
  const formatRelativeDue = (dueAtIso: string) => {
    const refDate = parseISO(`${selectedDate}T00:00:00`);
    const dueDate = parseISO(dueAtIso);
    const diffDays = differenceInCalendarDays(dueDate, refDate);

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return {
        text: `Today at ${dueAtIso.substring(11, 16)}`,
        isOverdue: false,
      };
    } else if (diffDays === 1) {
      return {
        text: 'Tomorrow',
        isOverdue: false,
      };
    }
    return {
      text: `in ${diffDays} days`,
      isOverdue: false,
    };
  };

  const getPriorityBadgeClass = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-bad';
      case 'medium':
        return 'text-warn';
      case 'low':
        return 'text-fg-3';
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarClock strokeWidth={1.5} className="h-4 w-4 text-fg-2" />
          <h3 className="text-sm font-medium text-fg">
            Upcoming deadlines
          </h3>
        </div>
        <span className="text-xs text-fg-3 font-medium">
          {filtered.length} items
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1" role="tablist" aria-label="Priority filter">
        {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={filter === p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === p
                ? 'bg-raised text-fg ring-1 ring-inset ring-line capitalize'
                : 'text-fg-3 hover:text-fg hover:bg-raised capitalize'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Deadlines List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {filtered.map((item) => {
          const { text: relativeText, isOverdue } = formatRelativeDue(item.dueAt);
          const badgeClass = getPriorityBadgeClass(item.priority);

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border text-xs space-y-2 transition-colors ${
                isOverdue
                  ? 'border-line bg-raised'
                  : 'border-line bg-page/50 hover:border-line-strong'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-fg line-clamp-1">
                  {item.title}
                </span>
                <span className={`font-mono text-xs shrink-0 ${badgeClass}`}>
                  {item.priority}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-fg-3">
                <div className="flex items-center space-x-1">
                  {isOverdue ? (
                    <AlertCircle strokeWidth={1.5} className="h-4 w-4 text-bad shrink-0" />
                  ) : (
                    <Clock strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0" />
                  )}
                  <span className={isOverdue ? 'text-bad' : ''}>
                    {relativeText}
                  </span>
                </div>

                {item.courseCode && (
                  <span className="font-mono text-xs text-fg-3">
                    {item.courseCode}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
