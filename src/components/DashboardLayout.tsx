/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useScheduleStore } from '../store/useScheduleStore';

// Import views/pages
import { Dashboard } from '../components/Dashboard';
import { TimetableBoard } from './schedule/TimetableBoard';
import { ConflictLogWidget } from './ConflictLogWidget';
// Add any other view imports you have for roster/facilities/settings here

export const DashboardLayout: React.FC = () => {
  const { activeNav } = useScheduleStore();

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <Dashboard />;
      case 'timetable':
        return <TimetableBoard />;
      case 'facilities':
        return (
          <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Room Allocation</h1>
            {/* Drop your room allocation view/component here */}
            <p className="text-fg-2">Manage rooms, buildings, and facility capacities.</p>
          </div>
        );
      case 'roster':
        return (
          <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Faculty and Scholars</h1>
            {/* Drop your roster component here */}
            <p className="text-fg-2">Manage faculty members, schedules, and scholars.</p>
          </div>
        );
      case 'conflicts':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold mb-4">Conflict Log</h1>
            <ConflictLogWidget />
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Settings</h1>
            <p className="text-fg-2">System configurations and preferences.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-page text-fg overflow-hidden">
      {/* Sidebar handles layout, nav clicks, URL path updates, and collapse states */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        {/* Dynamic content area that switches depending on activeNav */}
        <main className="flex-1 overflow-auto p-6 bg-surface">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;