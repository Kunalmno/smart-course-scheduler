/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, KeyboardEvent } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building,
  CalendarCheck,
  Loader2,
} from 'lucide-react';
import { TimetableViewMode, EventType } from '../../types';
import { eventTypeStyles } from '../../lib/eventStyles';
import { useScheduleStore } from '../../store/useScheduleStore';

interface ControlBarProps {
  onRunAutoScheduler?: () => void;
}

const views: { id: TimetableViewMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'matrix', label: 'Room matrix' },
];

const eventTypes: EventType[] = [
  'lecture',
  'lab',
  'seminar',
  'exam',
  'maintenance',
];

export const ControlBar: React.FC<ControlBarProps> = ({
  onRunAutoScheduler,
}) => {
  const {
    view,
    setView,
    selectedDate,
    setSelectedDate,
    stepSelectedDate,
    goToToday,
    buildingFilter,
    setBuildingFilter,
    typeFilter,
    toggleTypeFilter,
    rooms,
    runInteractiveAutoScheduler,
    isAutoSchedulerRunning,
  } = useScheduleStore();

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format date display: "Wed, 4 Nov 2026"
  const formattedDate = format(parseISO(`${selectedDate}T00:00:00`), 'EEE, d MMM yyyy');

  // List of unique buildings from rooms
  const buildings = Array.from(new Set(rooms.map((r) => r.building)));

  // Arrow key navigation between views
  const handleTablistKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = views.findIndex((v) => v.id === view);
      const nextIndex =
        e.key === 'ArrowRight'
          ? (currentIndex + 1) % views.length
          : (currentIndex - 1 + views.length) % views.length;
      setView(views[nextIndex].id);
    }
  };

  const handleDateLabelClick = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Primary Bar: ViewSwitcher, DateNavigator, Filters, and AI Auto-Scheduler */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-surface border border-line rounded-xl p-3">
        {/* Left Section: ViewSwitcher & DateNavigator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* ViewSwitcher Segmented Control */}
          <div
            role="tablist"
            aria-label="Schedule views"
            onKeyDown={handleTablistKeyDown}
            className="flex items-center p-1 bg-raised rounded-lg"
          >
            {views.map((v) => {
              const isSelected = view === v.id;
              return (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setView(v.id)}
                  tabIndex={isSelected ? 0 : -1}
                  className={`h-8 px-3 text-xs font-medium rounded transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-surface text-fg ring-1 ring-inset ring-line'
                      : 'text-fg-3 hover:text-fg'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-line-strong hidden sm:block" />

          {/* DateNavigator: Prev, Today, Next, Date Picker */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => stepSelectedDate(-1)}
              aria-label="Previous day"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-fg-3 hover:text-fg hover:bg-raised transition-colors cursor-pointer"
            >
              <ChevronLeft strokeWidth={1.5} className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="h-8 px-3 text-xs font-medium rounded-lg bg-raised hover:bg-line-strong text-fg-2 transition-colors cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => stepSelectedDate(1)}
              aria-label="Next day"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-fg-3 hover:text-fg hover:bg-raised transition-colors cursor-pointer"
            >
              <ChevronRight strokeWidth={1.5} className="h-4 w-4" />
            </button>

            {/* Native Date Picker Popover Trigger */}
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleDateLabelClick}
                aria-label={`Change schedule date, currently ${formattedDate}`}
                className="flex items-center gap-2 h-8 px-3 text-xs font-medium text-fg bg-page hover:bg-raised border border-line rounded-lg transition-colors cursor-pointer"
              >
                <Calendar strokeWidth={1.5} className="h-4 w-4 text-fg-2" />
                <span>{formattedDate}</span>
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Right Section: Building Select & Run AI Auto-Scheduler */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Building Filter Select */}
          <div className="flex items-center space-x-2">
            <label htmlFor="building-select" className="sr-only">
              Filter by building
            </label>
            <div className="relative">
              <select
                id="building-select"
                value={buildingFilter || 'ALL'}
                onChange={(e) =>
                  setBuildingFilter(e.target.value === 'ALL' ? null : e.target.value)
                }
                className="h-8 pl-8 pr-7 text-xs rounded-lg bg-page border border-line text-fg cursor-pointer"
              >
                <option value="ALL">All facilities (8 rooms)</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <Building strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Primary action */}
          <div>
            <button
              type="button"
              disabled={isAutoSchedulerRunning}
              onClick={() => {
                if (onRunAutoScheduler) {
                  onRunAutoScheduler();
                } else {
                  runInteractiveAutoScheduler();
                }
              }}
              className="h-8 px-4 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white flex items-center gap-2 cursor-pointer transition-colors"
            >
              {isAutoSchedulerRunning ? (
                <Loader2 strokeWidth={1.5} className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck strokeWidth={1.5} className="h-4 w-4" />
              )}
              <span>Run auto-scheduler</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary row: event-type filter (the dots double as the legend) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Multi-toggle chips */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by session type">
          <span className="text-xs font-medium text-fg-3 mr-1">Types</span>
          {eventTypes.map((type) => {
            const isSelected = typeFilter.includes(type);
            const style = eventTypeStyles[type];

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleTypeFilter(type)}
                aria-pressed={isSelected}
                className={`h-8 px-3 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-surface text-fg ring-1 ring-inset ring-line-strong'
                    : 'text-fg-3 hover:text-fg hover:bg-raised'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isSelected ? style.dot : 'bg-fg-3'}`} />
                <span className="capitalize">{type}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
