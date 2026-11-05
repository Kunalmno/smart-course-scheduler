import React from 'react';
import { Calendar } from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';

export const MonthView: React.FC = () => {
  const { setView } = useScheduleStore();
  return (
    <div className="rounded-xl border border-line bg-surface p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[360px]">
      <div className="text-fg-3">
        <Calendar strokeWidth={1.5} className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-medium text-fg">Month View: Semester Calendar</h3>
      <p className="text-xs text-fg-3 max-w-sm">Monthly density, exam blocks and term-wide room use</p>
      <button type="button" onClick={() => setView('day')} className="h-8 px-4 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white cursor-pointer transition-colors">
        Switch to Day view
      </button>
    </div>
  );
};
