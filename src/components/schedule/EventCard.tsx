/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, KeyboardEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { addMinutes, formatISO, parseISO } from 'date-fns';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Cpu,
  Lock,
} from 'lucide-react';
import { ScheduleEvent, Conflict } from '../../types';
import { eventTypeStyles } from '../../lib/eventStyles';
import { describeConflict } from '../../lib/describeConflict';
import { AccessibleTooltip } from './AccessibleTooltip';
import { useScheduleStore } from '../../store/useScheduleStore';
import { selectFilteredRooms } from '../../store/selectors';

interface EventCardProps {
  event: ScheduleEvent;
  conflict?: Conflict;
  isCompact?: boolean;
  style?: React.CSSProperties;
  isGhost?: boolean;
  onSelect?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  conflict,
  isCompact = false,
  style,
  isGhost = false,
  onSelect,
}) => {
  const {
    rooms,
    faculty,
    courses,
    events,
    moveEvent,
    buildingFilter,
  } = useScheduleStore();

  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  const course = courses.find((c) => c.id === event.courseId);
  const room = rooms.find((r) => r.id === event.roomId);
  const professor = faculty.find((f) => f.id === event.facultyId);

  const colorStyle = eventTypeStyles[event.type] || eventTypeStyles.lecture;
  const isConflict = event.status === 'conflict' || !!conflict;
  const isResolved = event.status === 'resolved';
  const isTentative = event.status === 'tentative';
  const isLocked = Boolean(event.locked);

  // DnD hook
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    disabled: isLocked || isGhost,
    data: {
      event,
    },
  });

  const tooltipId = `event-tooltip-${event.id}`;
  const timeRangeStr = `${event.start.substring(11, 16)} – ${event.end.substring(11, 16)}`;

  // Capacity fill calculation
  const roomCapacity = room?.capacity || 1;
  const fillPercentage = Math.min(150, Math.round((event.scholarCount / roomCapacity) * 100));

  // Conflict description
  const conflictDescription = conflict
    ? describeConflict(conflict, { rooms, faculty, courses, events })
    : null;

  const handleMouseEnter = () => {
    if (isDragging || isGhost) return;
    if (cardRef.current) {
      setTriggerRect(cardRef.current.getBoundingClientRect());
      setIsTooltipOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsTooltipOpen(false);
  };

  const handleFocus = () => {
    if (isDragging || isGhost) return;
    if (cardRef.current) {
      setTriggerRect(cardRef.current.getBoundingClientRect());
      setIsTooltipOpen(true);
    }
  };

  const handleBlur = () => {
    setIsTooltipOpen(false);
  };

  const visibleRooms = selectFilteredRooms(rooms, buildingFilter);

  // Keyboard navigation & Alt+Arrow rescheduling
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(event.id);
      return;
    }

    // Alt+Arrow keyboard rescheduling (15 min vertical, 1 room horizontal)
    if (e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();

      if (isLocked) {
        setAriaAnnouncement(`${course?.code || 'Event'} is locked and cannot be rescheduled.`);
        return;
      }

      const currentStart = parseISO(event.start);
      const currentEnd = parseISO(event.end);

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const deltaMinutes = e.key === 'ArrowUp' ? -15 : 15;
        const newStart = addMinutes(currentStart, deltaMinutes);
        const newEnd = addMinutes(currentEnd, deltaMinutes);

        // Visible boundary limit 08:00 - 18:00
        const startH = newStart.getHours();
        if (startH < 8 || startH >= 18) {
          setAriaAnnouncement('Cannot move outside standard operating hours (08:00 to 18:00).');
          return;
        }

        const newStartIso = formatISO(newStart).substring(0, 19);
        const newEndIso = formatISO(newEnd).substring(0, 19);

        moveEvent(event.id, event.roomId, newStartIso, newEndIso);
        setAriaAnnouncement(
          `Moved ${course?.code || 'Event'} to ${newStartIso.substring(11, 16)} in ${room?.name || 'room'}.`
        );
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIdx = visibleRooms.findIndex((r) => r.id === event.roomId);
        if (currentIdx === -1) return;

        const nextIdx =
          e.key === 'ArrowLeft'
            ? Math.max(0, currentIdx - 1)
            : Math.min(visibleRooms.length - 1, currentIdx + 1);

        if (nextIdx === currentIdx) {
          setAriaAnnouncement(`Already in the ${e.key === 'ArrowLeft' ? 'first' : 'last'} room column.`);
          return;
        }

        const targetRoom = visibleRooms[nextIdx];
        moveEvent(event.id, targetRoom.id, event.start, event.end);
        setAriaAnnouncement(`Moved ${course?.code || 'Event'} to ${targetRoom.name}.`);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If not dragging, trigger modal
    if (!isDragging) {
      onSelect?.(event.id);
    }
  };

  // Combine ref for DnD and local DOM ref
  const setCombinedRef = (node: HTMLDivElement | null) => {
    cardRef.current = node;
    setNodeRef(node);
  };

  return (
    <>
      {/* Screen reader live region for keyboard rescheduling announcements */}
      <div aria-live="polite" className="sr-only">
        {ariaAnnouncement}
      </div>

      <div
        ref={setCombinedRef}
        data-event-id={event.id}
        {...attributes}
        {...listeners}
        aria-label={`${course?.code || 'Event'} ${timeRangeStr}${isLocked ? ' (Locked)' : ''}`}
        aria-describedby={isTooltipOpen && !isGhost ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        style={style}
        className={`group relative rounded-lg p-2 transition-colors select-none overflow-hidden flex flex-col justify-between text-left ${
          colorStyle.bg
        } ${colorStyle.text} border ${
          isConflict
            ? 'border-bad ring-1 ring-bad/30'
            : isTentative
            ? 'border-dashed border-amber-500'
            : `${colorStyle.border} border-l-2 ${colorStyle.bar}`
        } ${
          isDragging
            ? 'opacity-30'
            : isGhost
            ? 'shadow-float ring-2 ring-accent cursor-grabbing z-50'
            : isLocked
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing hover:bg-line-strong'
        }`}
      >
        {/* Top line: course code and state icons */}
        <div className="flex items-start justify-between gap-1 w-full">
          <div className="flex items-center space-x-2 min-w-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${colorStyle.dot}`}
              aria-hidden="true"
            />
            <span className="font-medium text-xs truncate">
              {course?.code || event.courseId}
            </span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {isLocked && (
              <span title="Locked event (cannot reschedule)" className="text-fg-3">
                <Lock strokeWidth={1.5} className="h-4 w-4" />
              </span>
            )}
            {isConflict && (
              <span
                data-testid={`conflict-indicator-${event.id}`}
                className="text-bad"
                title="Conflict detected"
              >
                <AlertTriangle strokeWidth={1.5} className="h-4 w-4" />
              </span>
            )}
            {isResolved && (
              <span className="text-ok" title="Resolved">
                <CheckCircle strokeWidth={1.5} className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>

        {/* Middle Line: Title (Tall card only) */}
        {!isCompact && course && (
          <p className="text-xs font-medium leading-tight line-clamp-1 text-fg-2 my-1">
            {course.title}
          </p>
        )}

        {/* Bottom Line: Time, Professor & Scholars Count */}
        <div className="flex items-center justify-between text-xs text-fg-2 pt-1">
          <span className="font-mono font-medium">{timeRangeStr}</span>

          {!isCompact && (
            <div className="flex items-center space-x-2">
              {professor && (
                <span className="truncate max-w-[80px] hidden sm:inline">
                  {professor.name.split(' ').slice(-1)[0]}
                </span>
              )}
              <div className="flex items-center space-x-1 font-medium">
                <Users strokeWidth={1.5} className="h-4 w-4" />
                <span>{event.scholarCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accessible Detail Tooltip */}
      {!isGhost && !isDragging && (
        <AccessibleTooltip
          id={tooltipId}
          triggerRect={triggerRect}
          isOpen={isTooltipOpen}
        >
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-line pb-2">
              <div>
                <span className="font-mono text-fg-3 font-medium text-xs">
                  {course?.code} • {event.type}
                </span>
                <h4 className="font-medium text-sm text-fg leading-snug">
                  {course?.title || 'Scheduled session'}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                {isLocked && (
                  <span className="text-xs text-fg-2 flex items-center gap-1">
                    <Lock strokeWidth={1.5} className="h-4 w-4" />
                    <span>Locked</span>
                  </span>
                )}
                <span
                  className={`text-xs ${
                    isConflict ? 'text-bad' : isResolved ? 'text-ok' : 'text-fg-3'
                  }`}
                >
                  {isConflict ? 'Conflict' : isResolved ? 'Resolved' : event.status}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs text-fg-2">
              <div>
                <span className="text-fg-3 text-xs block">Time and date</span>
                <p className="font-medium text-fg">{timeRangeStr}</p>
              </div>
              <div>
                <span className="text-fg-3 text-xs block">Location</span>
                <p className="font-medium text-fg truncate">
                  {room?.name} ({room?.building})
                </p>
              </div>
              <div>
                <span className="text-fg-3 text-xs block">Faculty</span>
                <p className="font-medium text-fg truncate">
                  {professor?.name || 'TBA'}
                </p>
              </div>
              <div>
                <span className="text-fg-3 text-xs block">Scholars and capacity</span>
                <p
                  className={`font-medium ${
                    event.scholarCount > roomCapacity
                      ? 'text-bad'
                      : 'text-fg'
                  }`}
                >
                  {event.scholarCount} / {roomCapacity} ({fillPercentage}% fill)
                </p>
              </div>
            </div>

            {/* Required Equipment */}
            {course && course.requiredEquipment.length > 0 && (
              <div className="pt-2 border-t border-line flex items-center space-x-2 text-xs text-fg-3">
                <Cpu strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0" />
                <span>Required: {course.requiredEquipment.join(', ')}</span>
              </div>
            )}

            {/* Keyboard shortcut hint */}
            <div className="pt-2 border-t border-line text-xs text-fg-3">
              Press <kbd className="px-1 rounded bg-raised border border-line font-mono text-fg-2">Alt</kbd> and <kbd className="px-1 rounded bg-raised border border-line font-mono text-fg-2">Arrows</kbd> to reschedule
            </div>

            {/* Attached Conflict Alert */}
            {conflictDescription && (
              <div className="text-xs text-fg-2 flex items-start gap-2 bg-raised p-2 rounded-lg">
                <ShieldAlert strokeWidth={1.5} className="h-4 w-4 text-bad shrink-0" />
                <div>
                  <span className="font-medium block text-bad">Rule violation</span>
                  <span>{conflictDescription}</span>
                </div>
              </div>
            )}
          </div>
        </AccessibleTooltip>
      )}
    </>
  );
};
