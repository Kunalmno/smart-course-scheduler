/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
  Trash2,
  Lock,
  Clock,
  MapPin,
  UserCheck,
  BookOpen,
  Users,
} from 'lucide-react';
import { EventStatus, EventType, ScheduleEvent } from '../../types';
import { useScheduleStore } from '../../store/useScheduleStore';
import { detectConflicts, resolveConflict } from '../../lib/conflicts';
import { describeConflict } from '../../lib/describeConflict';

export const EventModal: React.FC = () => {
  const {
    isEventModalOpen,
    editingEventId,
    prefillEventData,
    closeEventModal,
    events,
    rooms,
    faculty,
    courses,
    addEvent,
    updateEvent,
    deleteEvent,
    selectedDate,
  } = useScheduleStore();

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const isEditMode = Boolean(editingEventId);
  const existingEvent = isEditMode
    ? events.find((e) => e.id === editingEventId)
    : null;

  // Form Fields
  const [courseId, setCourseId] = useState<string>('');
  const [type, setType] = useState<EventType>('lecture');
  const [roomId, setRoomId] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [scholarCount, setScholarCount] = useState<number>(30);
  const [status, setStatus] = useState<EventStatus>('confirmed');
  const [locked, setLocked] = useState<boolean>(false);

  // Interaction & Confirmation States
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isEventModalOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setConfirmDelete(false);
      setShowDiscardConfirm(false);
      setErrors({});
      setIsDirty(false);

      if (existingEvent) {
        setCourseId(existingEvent.courseId);
        setType(existingEvent.type);
        setRoomId(existingEvent.roomId);
        setFacultyId(existingEvent.facultyId);
        setDate(existingEvent.start.substring(0, 10));
        setStartTime(existingEvent.start.substring(11, 16));
        setEndTime(existingEvent.end.substring(11, 16));
        setScholarCount(existingEvent.scholarCount);
        setStatus(existingEvent.status);
        setLocked(Boolean(existingEvent.locked));
      } else {
        // Create mode with optional prefill
        const defaultCourse = courses[0];
        setCourseId(prefillEventData?.courseId || defaultCourse?.id || '');
        setType(prefillEventData?.type || 'lecture');
        setRoomId(prefillEventData?.roomId || rooms[0]?.id || '');
        setFacultyId(
          prefillEventData?.facultyId ||
            defaultCourse?.facultyId ||
            faculty[0]?.id ||
            ''
        );

        if (prefillEventData?.start) {
          setDate(prefillEventData.start.substring(0, 10));
          setStartTime(prefillEventData.start.substring(11, 16));
        } else {
          setDate(selectedDate || '2026-11-09');
          setStartTime('09:00');
        }

        if (prefillEventData?.end) {
          setEndTime(prefillEventData.end.substring(11, 16));
        } else {
          setEndTime('10:30');
        }

        setScholarCount(defaultCourse?.enrolledCount || 30);
        setStatus('confirmed');
        setLocked(false);
      }
    }
  }, [isEventModalOpen, existingEvent, prefillEventData, courses, rooms, faculty, selectedDate]);

  // Trap focus inside modal
  useEffect(() => {
    if (!isEventModalOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTabKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => {
      window.removeEventListener('keydown', handleTabKey);
      previousActiveElementRef.current?.focus();
    };
  }, [isEventModalOpen]);

  // Close request handler with dirty check
  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      closeEventModal();
    }
  };

  // Keyboard shortcut Esc
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleRequestClose();
    }
  };

  // Auto-fill faculty from course selection
  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    setIsDirty(true);
    const selectedCourse = courses.find((c) => c.id === newCourseId);
    if (selectedCourse) {
      setFacultyId(selectedCourse.facultyId);
      setScholarCount(selectedCourse.enrolledCount);
    }
  };

  // Live Conflict Preview on Hypothetical State
  const hypotheticalEvent: ScheduleEvent = {
    id: editingEventId || 'NEW_EVENT_TEMP',
    courseId,
    roomId,
    facultyId,
    type,
    start: `${date}T${startTime}:00`,
    end: `${date}T${endTime}:00`,
    scholarCount: Number(scholarCount) || 1,
    status,
    locked,
  };

  const hypotheticalEventsList: ScheduleEvent[] = isEditMode
    ? events.map((e) => (e.id === editingEventId ? hypotheticalEvent : e))
    : [...events, hypotheticalEvent];

  const detectedConflicts = detectConflicts(
    hypotheticalEventsList,
    rooms,
    faculty,
    courses
  );

  const previewConflicts = detectedConflicts.filter(
    (c) =>
      c.eventId === hypotheticalEvent.id ||
      c.relatedEventId === hypotheticalEvent.id
  );

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!courseId) newErrors.courseId = 'Please select a course.';
    if (!roomId) newErrors.roomId = 'Please assign a room.';
    if (!facultyId) newErrors.facultyId = 'Please assign an instructor.';
    if (!date) newErrors.date = 'Date is required.';
    if (!startTime) newErrors.startTime = 'Start time is required.';
    if (!endTime) newErrors.endTime = 'End time is required.';

    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'End time must be strictly after start time.';
    }

    if (!scholarCount || scholarCount < 1) {
      newErrors.scholarCount = 'Scholar count must be at least 1.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalStatus: EventStatus = previewConflicts.length > 0 ? 'conflict' : status;

    const eventPayload: ScheduleEvent = {
      id: editingEventId || `EVT-${Date.now().toString().slice(-4)}`,
      courseId,
      roomId,
      facultyId,
      type,
      start: `${date}T${startTime}:00`,
      end: `${date}T${endTime}:00`,
      scholarCount: Number(scholarCount),
      status: finalStatus,
      locked,
    };

    if (isEditMode) {
      updateEvent(eventPayload);
    } else {
      addEvent(eventPayload);
    }

    closeEventModal();
  };

  const handleDelete = () => {
    if (!editingEventId) return;
    deleteEvent(editingEventId);
    closeEventModal();
  };

  if (!isEventModalOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-enter duration-150"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl bg-surface border border-line shadow-float text-fg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 id="modal-title" className="text-base sm:text-lg font-medium">
              {isEditMode ? 'Edit session' : 'Schedule session'}
            </h2>
            <p className="text-xs text-fg-3">
              {isEditMode
                ? `Update details for event ${editingEventId}`
                : 'Set the room, faculty and time for a course'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-fg-3 hover:text-fg-2 hover:bg-raised transition-colors cursor-pointer"
          >
            <X strokeWidth={1.5} className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Course & Event Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-course" className="block text-xs font-medium text-fg-2 mb-1">
                Course <span className="text-bad">*</span>
              </label>
              <div className="relative">
                <select
                  id="modal-course"
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-page border ${
                    errors.courseId
                      ? 'border-bad focus:ring-bad'
                      : 'border-line focus:ring-teal-500'
                  } cursor-pointer font-medium`}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.title}
                    </option>
                  ))}
                </select>
                <BookOpen strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.courseId && <p className="text-xs text-bad mt-1">{errors.courseId}</p>}
            </div>

            <div>
              <label htmlFor="modal-type" className="block text-xs font-medium text-fg-2 mb-1">
                Session Type
              </label>
              <select
                id="modal-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as EventType);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-page border border-line cursor-pointer capitalize font-medium"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Laboratory</option>
                <option value="seminar">Seminar</option>
                <option value="exam">Examination</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Room & Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-room" className="block text-xs font-medium text-fg-2 mb-1">
                Room <span className="text-bad">*</span>
              </label>
              <div className="relative">
                <select
                  id="modal-room"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-page border ${
                    errors.roomId
                      ? 'border-bad focus:ring-bad'
                      : 'border-line focus:ring-teal-500'
                  } cursor-pointer font-medium`}
                >
                  <option value="">Select room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.building}, Cap: {r.capacity})
                    </option>
                  ))}
                </select>
                <MapPin strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.roomId && <p className="text-xs text-bad mt-1">{errors.roomId}</p>}
            </div>

            <div>
              <label htmlFor="modal-faculty" className="block text-xs font-medium text-fg-2 mb-1">
                Faculty <span className="text-bad">*</span>
              </label>
              <div className="relative">
                <select
                  id="modal-faculty"
                  value={facultyId}
                  onChange={(e) => {
                    setFacultyId(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-page border ${
                    errors.facultyId
                      ? 'border-bad focus:ring-bad'
                      : 'border-line focus:ring-teal-500'
                  } cursor-pointer font-medium`}
                >
                  <option value="">Select faculty</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
                <UserCheck strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.facultyId && <p className="text-xs text-bad mt-1">{errors.facultyId}</p>}
            </div>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="modal-date" className="block text-xs font-medium text-fg-2 mb-1">
                Date <span className="text-bad">*</span>
              </label>
              <input
                id="modal-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setIsDirty(true);
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl bg-page border ${
                  errors.date
                    ? 'border-bad'
                    : 'border-line'
                } font-medium`}
              />
              {errors.date && <p className="text-xs text-bad mt-1">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="modal-start" className="block text-xs font-medium text-fg-2 mb-1">
                Start time <span className="text-bad">*</span>
              </label>
              <div className="relative">
                <input
                  id="modal-start"
                  type="time"
                  step="900"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-page border ${
                    errors.startTime
                      ? 'border-bad'
                      : 'border-line'
                  } font-mono font-medium`}
                />
                <Clock strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.startTime && <p className="text-xs text-bad mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label htmlFor="modal-end" className="block text-xs font-medium text-fg-2 mb-1">
                End time <span className="text-bad">*</span>
              </label>
              <div className="relative">
                <input
                  id="modal-end"
                  type="time"
                  step="900"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-page border ${
                    errors.endTime
                      ? 'border-bad'
                      : 'border-line'
                  } font-mono font-medium`}
                />
                <Clock strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.endTime && <p className="text-xs text-bad mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Scholar Count, Status & Locked Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label htmlFor="modal-scholars" className="block text-xs font-medium text-fg-2 mb-1">
                Scholars enrolled <span className="text-bad">*</span>
              </label>
              <div className="relative">
                <input
                  id="modal-scholars"
                  type="number"
                  min="1"
                  max="500"
                  value={scholarCount}
                  onChange={(e) => {
                    setScholarCount(Number(e.target.value));
                    setIsDirty(true);
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-page border ${
                    errors.scholarCount
                      ? 'border-bad'
                      : 'border-line'
                  } font-medium`}
                />
                <Users strokeWidth={1.5} className="h-4 w-4 text-fg-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.scholarCount && <p className="text-xs text-bad mt-1">{errors.scholarCount}</p>}
            </div>

            <div>
              <label htmlFor="modal-status" className="block text-xs font-medium text-fg-2 mb-1">
                Session Status
              </label>
              <select
                id="modal-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as EventStatus);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-page border border-line cursor-pointer capitalize font-medium"
              >
                <option value="confirmed">Confirmed</option>
                <option value="tentative">Tentative</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 text-xs font-medium text-fg-2 p-3 rounded-xl bg-page border border-line cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(e) => {
                    setLocked(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded text-teal-700 focus:ring-teal-500"
                />
                <Lock strokeWidth={1.5} className="h-4 w-4 text-fg-3" />
                <span>Lock session</span>
              </label>
            </div>
          </div>

          {/* Live Conflict Preview Panel */}
          {previewConflicts.length > 0 && (
            <div className="p-4 rounded-xl border border-line bg-raised space-y-3">
              <div className="flex items-center space-x-2 text-bad text-xs font-medium">
                <AlertTriangle strokeWidth={1.5} className="h-4 w-4 shrink-0" />
                <span>
                  {previewConflicts.length} Conflict{previewConflicts.length > 1 ? 's' : ''} Detected with Current Configuration
                </span>
              </div>

              <div className="space-y-3">
                {previewConflicts.map((c) => {
                  const desc = describeConflict(c, {
                    rooms,
                    faculty,
                    courses,
                    events: hypotheticalEventsList,
                  });
                  const suggestion = resolveConflict(c, {
                    events: hypotheticalEventsList,
                    rooms,
                    faculty,
                    courses,
                  });

                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg bg-surface border border-line text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-fg">{desc}</span>
                        <span className="px-2 py-1 rounded text-xs font-medium font-mono text-bad shrink-0">
                          {c.severity}
                        </span>
                      </div>

                      {suggestion ? (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
                          <span className="text-xs text-fg-2 ">
                            Suggestion: {suggestion.detail}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (suggestion.newRoomId) setRoomId(suggestion.newRoomId);
                              if (suggestion.newStart) setStartTime(suggestion.newStart.substring(11, 16));
                              if (suggestion.newEnd) setEndTime(suggestion.newEnd.substring(11, 16));
                              setIsDirty(true);
                            }}
                            className="px-2 py-1 text-xs font-medium rounded-lg bg-raised hover:bg-line-strong text-fg-2 border border-line flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <Sparkles strokeWidth={1.5} className="h-4 w-4" />
                            <span>Apply suggestion</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-fg-3 pt-1">
                          No automatic suggestion. Try selecting a different facility or time window.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delete Confirmation Step */}
          {confirmDelete && (
            <div className="p-4 rounded-xl border border-line bg-raised text-xs flex items-center justify-between gap-3 animate-enter">
              <span className="font-medium text-fg">
                Are you sure you want to delete this session? You can undo via Ctrl+Z.
              </span>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-raised hover:bg-line-strong text-fg-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-rose-700 hover:bg-rose-800 text-white"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Dirty Discard Warning Dialog */}
          {showDiscardConfirm && (
            <div className="p-4 rounded-xl border border-line bg-raised text-xs flex items-center justify-between gap-3 animate-enter">
              <span className="font-medium text-fg">
                Discard unsaved changes?
              </span>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-raised hover:bg-line-strong text-fg-2"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    closeEventModal();
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-700 hover:bg-amber-800 text-white"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-line">
            <div>
              {isEditMode && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-bad hover:bg-raised rounded-lg transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Trash2 strokeWidth={1.5} className="h-4 w-4" />
                  <span>Delete session</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleRequestClose}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-raised hover:bg-line-strong text-fg-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer"
              >
                {isEditMode ? 'Save changes' : 'Create session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
