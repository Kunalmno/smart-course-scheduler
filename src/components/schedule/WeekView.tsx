import React from 'react';
import { CalendarRange } from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';

export const WeekView: React.FC = () => {
  const { setView } = useScheduleStore();
  return (
    <div className="rounded-xl border border-line bg-surface p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[360px]">
      <div className="text-fg-3">
        <CalendarRange strokeWidth={1.5} className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-medium text-fg">Week View: Multi-Room Grid</h3>
      <p className="text-xs text-fg-3 max-w-sm">Weekly schedules across Monday to Friday, room by room</p>
      <button type="button" onClick={() => setView('day')} className="h-8 px-4 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white cursor-pointer transition-colors">
        Switch to Day view
      </button>
    </div>
  );
};
