/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    text: string;
  };
  status?: 'ok' | 'warn' | 'alert';
  badge?: {
    text: string;
    variant: 'amber' | 'emerald' | 'rose' | 'teal';
  };
  icon: React.ReactNode;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  status,
  badge,
  icon,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        data-testid="metric-card-skeleton"
        className="rounded-xl border border-line bg-surface p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-line-strong rounded" />
          <div className="h-4 w-4 bg-line-strong rounded" />
        </div>
        <div className="h-8 w-20 bg-line-strong rounded" />
        <div className="h-3 w-32 bg-raised rounded" />
      </div>
    );
  }

  const dot =
    status === 'ok' ? 'bg-ok' : status === 'warn' ? 'bg-warn' : status === 'alert' ? 'bg-bad' : null;

  const badgeTone =
    badge?.variant === 'amber'
      ? 'text-warn'
      : badge?.variant === 'emerald'
      ? 'text-ok'
      : badge?.variant === 'rose'
      ? 'text-bad'
      : 'text-fg-2';

  const trendTone =
    trend?.direction === 'up' ? 'text-ok' : trend?.direction === 'down' ? 'text-bad' : 'text-fg-3';

  return (
    <div className="rounded-xl border border-line bg-surface p-5 flex flex-col justify-between gap-4 min-h-32">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-fg-2">{label}</span>
        <span className="text-fg-3 shrink-0">{icon}</span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-medium leading-none tabular-nums text-fg">{value}</span>
        {unit && <span className="text-sm text-fg-3">{unit}</span>}
      </div>

      <div className="flex items-center gap-3 text-xs">
        {trend ? (
          <span className={`inline-flex items-center gap-1 ${trendTone}`}>
            {trend.direction === 'up' ? (
              <ArrowUpRight strokeWidth={1.5} className="h-4 w-4" />
            ) : trend.direction === 'down' ? (
              <ArrowDownRight strokeWidth={1.5} className="h-4 w-4" />
            ) : (
              <Minus strokeWidth={1.5} className="h-4 w-4" />
            )}
            <span>{trend.text}</span>
          </span>
        ) : dot ? (
          <span className="inline-flex items-center gap-2 text-fg-3">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span>{status === 'ok' ? 'All clear' : 'Needs attention'}</span>
          </span>
        ) : null}
        {badge && <span className={`font-mono ${badgeTone}`}>{badge.text}</span>}
      </div>
    </div>
  );
};
