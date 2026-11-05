/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';

export const OccupancyHeatmapWidget: React.FC = () => {
  const { getBuildingOccupancyHierarchy, selectedDate } = useScheduleStore();
  const buildings = getBuildingOccupancyHierarchy();

  // Expanded buildings state for room drill-down
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({
    'Science Block': true, // Open by default
  });

  const toggleBuilding = (building: string) => {
    setExpandedBuildings((prev) => ({
      ...prev,
      [building]: !prev[building],
    }));
  };

  const getBarColor = (color: 'emerald' | 'amber' | 'red') => {
    if (color === 'red') return 'bg-bad';
    return 'bg-fg-3';
  };

  const getBadgeColor = (color: 'emerald' | 'amber' | 'red') => {
    return color === 'red' ? 'text-bad' : 'text-fg-2';
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 strokeWidth={1.5} className="h-4 w-4 text-fg-2" />
          <h3 className="text-sm font-medium text-fg">
            Facility occupancy
          </h3>
        </div>
        <span className="text-xs text-fg-3 font-medium">
          {selectedDate}
        </span>
      </div>

      {/* Building list */}
      <div className="space-y-4">
        {buildings.map((b) => {
          const isExpanded = !!expandedBuildings[b.building];
          const barColorClass = getBarColor(b.color);
          const badgeClass = getBadgeColor(b.color);

          return (
            <div
              key={b.building}
              className="rounded-lg border border-line p-3 bg-page/50 space-y-3 transition-colors"
            >
              {/* Building Bar header (clickable) */}
              <button
                type="button"
                onClick={() => toggleBuilding(b.building)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between text-left cursor-pointer rounded"
              >
                <div>
                  <span className="text-xs font-medium text-fg">
                    {b.building}
                  </span>
                  <p className="text-xs text-fg-3">
                    {b.rooms.length} rooms, {Math.round(b.bookedMinutes / 60)}h booked
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`font-mono text-xs ${badgeClass}`}>
                    {b.percentage}%
                  </span>
                  {isExpanded ? (
                    <ChevronUp strokeWidth={1.5} className="h-4 w-4 text-fg-3" />
                  ) : (
                    <ChevronDown strokeWidth={1.5} className="h-4 w-4 text-fg-3" />
                  )}
                </div>
              </button>

              {/* Progress bar */}
              <div
                role="progressbar"
                aria-valuenow={b.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${b.building} occupancy: ${b.percentage}%`}
                className="h-2 w-full rounded-full bg-line-strong overflow-hidden"
              >
                <div
                  className={`h-full transition-colors duration-200 ${barColorClass}`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>

              {/* Room breakdown (Collapsible) */}
              {isExpanded && (
                <div className="pt-2 border-t border-line/60 space-y-2 animate-enter">
                  <span className="text-xs font-medium text-fg-3">
                    Room breakdown
                  </span>
                  <div className="space-y-2">
                    {b.rooms.map((room) => {
                      const roomBarClass = getBarColor(room.color);
                      return (
                        <div key={room.roomId} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-fg-2 font-medium truncate">
                              {room.roomName}
                            </span>
                            <span className="font-mono text-fg-3">
                              {room.percentage}%
                            </span>
                          </div>
                          <div
                            role="progressbar"
                            aria-valuenow={room.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${room.roomName} occupancy: ${room.percentage}%`}
                            className="h-2 w-full rounded-full bg-line-strong overflow-hidden"
                          >
                            <div
                              className={`h-full transition-colors duration-200 ${roomBarClass}`}
                              style={{ width: `${Math.min(100, room.percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
