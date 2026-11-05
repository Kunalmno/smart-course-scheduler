/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Building2, AlertTriangle, Users } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useScheduleStore } from '../store/useScheduleStore';

interface MetricsBannerProps {
  loading?: boolean;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ loading = false }) => {
  const {
    getScheduledHoursTodayWithTrend,
    getOccupancyRateForSelectedDate,
    getSystemConflictMetric,
    getDistinctScholarsToday,
  } = useScheduleStore();

  const hoursData = getScheduledHoursTodayWithTrend();
  const occupancyData = getOccupancyRateForSelectedDate();
  const conflictData = getSystemConflictMetric();
  const scholarsData = getDistinctScholarsToday();

  return (
    <section aria-label="Key scheduling metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Scheduled hours today */}
      <MetricCard
        label="Scheduled hours today"
        value={hoursData.hours}
        unit="hrs"
        trend={hoursData.trend}
        icon={<Clock strokeWidth={1.5} className="h-4 w-4" />}
        loading={loading}
      />

      {/* 2. Room occupancy */}
      <MetricCard
        label="Room occupancy"
        value={occupancyData.ratePercentage}
        unit="%"
        badge={
          occupancyData.isHighLoad
            ? { text: 'High load', variant: 'amber' }
            : undefined
        }
        status={occupancyData.isHighLoad ? 'warn' : 'ok'}
        trend={{
          direction: 'flat',
          text: `${occupancyData.scheduledHours}h of ${occupancyData.totalAvailableHours}h capacity`,
        }}
        icon={<Building2 strokeWidth={1.5} className="h-4 w-4" />}
        loading={loading}
      />

      {/* 3. Conflicts */}
      <MetricCard
        label="Conflicts"
        value={conflictData.count}
        status={conflictData.count === 0 ? 'ok' : 'alert'}
        trend={{
          direction: conflictData.count === 0 ? 'flat' : 'down',
          text: conflictData.text,
        }}
        icon={
          <AlertTriangle strokeWidth={1.5} className="h-4 w-4" />
        }
        loading={loading}
      />

      {/* 4. Scholars on campus */}
      <MetricCard
        label="Scholars on campus"
        value={scholarsData.distinctCount}
        trend={{
          direction: 'up',
          text: `${scholarsData.totalRegistered} enrolled scholars`,
        }}
        icon={<Users strokeWidth={1.5} className="h-4 w-4" />}
        loading={loading}
      />
    </section>
  );
};
