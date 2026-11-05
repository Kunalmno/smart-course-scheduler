/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  X,
  LucideIcon,
} from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { NavId } from '../types';

interface SidebarNavEntry {
  id: NavId;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'conflicts';
}

const navEntries: SidebarNavEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: CalendarDays,
  },
  {
    id: 'facilities',
    label: 'Room allocation',
    icon: Building2,
  },
  {
    id: 'roster',
    label: 'Faculty and scholars',
    icon: Users,
  },
  {
    id: 'conflicts',
    label: 'Conflict log',
    icon: ScrollText,
    badgeKey: 'conflicts',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    getConflictCount,
    theme,
    setTheme,
  } = useScheduleStore();

  const conflictCount = getConflictCount();

  const handleNavClick = (id: NavId) => {
    setActiveNav(id);
    setMobileSidebarOpen(false);
    // Updates the browser URL path natively without needing a Router component
    window.history.pushState({}, '', `/${id}`);
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between p-4 select-none">
      {/* Top: nav header and link items */}
      <div className="space-y-4">
        {/* Mobile header close */}
        <div className="flex md:hidden items-center justify-between pb-2 border-b border-line">
          <span className="font-medium text-sm text-fg">Menu</span>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
            className="h-8 w-8 flex items-center justify-center text-fg-3 hover:text-fg rounded-lg hover:bg-raised transition-colors"
          >
            <X strokeWidth={1.5} className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list: 36px rows, 2px apart, one icon column */}
        <nav aria-label="Primary" className="space-y-0.5">
          {navEntries.map((entry) => {
            const Icon = entry.icon;
            const isActive = activeNav === entry.id;
            const badgeValue = entry.badgeKey === 'conflicts' ? conflictCount : 0;

            return (
              <div key={entry.id} className="relative group">
                <button
                  type="button"
                  onClick={() => handleNavClick(entry.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full h-9 flex items-center rounded-lg transition-colors text-sm cursor-pointer ${
                    sidebarCollapsed ? 'justify-center' : 'px-3 gap-3'
                  } ${
                    isActive
                      ? 'bg-raised text-fg ring-1 ring-inset ring-line'
                      : 'text-fg-2 hover:text-fg hover:bg-raised'
                  }`}
                  title={sidebarCollapsed ? entry.label : undefined}
                >
                  <Icon
                    strokeWidth={1.5}
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-fg' : 'text-fg-3 group-hover:text-fg'
                    }`}
                  />

                  {!sidebarCollapsed && (
                    <span className="truncate flex-1 text-left">{entry.label}</span>
                  )}

                  {/* Conflict count: quiet mono text, a dot when collapsed */}
                  {badgeValue > 0 &&
                    (sidebarCollapsed ? (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-warn" />
                    ) : (
                      <span className="font-mono text-xs text-warn">{badgeValue}</span>
                    ))}
                </button>

                {/* Collapsed tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 px-3 py-2 rounded-lg bg-fg text-page text-xs shadow-float z-50 whitespace-nowrap pointer-events-none animate-enter">
                    {entry.label}
                    {badgeValue > 0 && <span className="font-mono">{badgeValue}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom: theme switcher and collapse toggle */}
      <div className="space-y-2 pt-4 border-t border-line">
        {sidebarCollapsed ? (
          <button
            type="button"
            onClick={() => {
              const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
              setTheme(nextTheme);
            }}
            aria-label={`Current theme: ${theme}. Click to switch theme.`}
            className="w-full h-9 flex items-center justify-center rounded-lg text-fg-3 hover:text-fg hover:bg-raised transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon strokeWidth={1.5} className="h-4 w-4" />
            ) : theme === 'light' ? (
              <Sun strokeWidth={1.5} className="h-4 w-4" />
            ) : (
              <Monitor strokeWidth={1.5} className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-fg-3 px-1">
              <span>Theme</span>
              <span className="capitalize text-fg-2">{theme}</span>
            </div>
            {/* Outer radius 8, padding 4, so the inner radius is 4 */}
            <div className="grid grid-cols-3 gap-1 bg-raised p-1 rounded-lg">
              {(
                [
                  { id: 'light', label: 'Light', Icon: Sun },
                  { id: 'dark', label: 'Dark', Icon: Moon },
                  { id: 'system', label: 'Auto', Icon: Monitor },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  aria-pressed={theme === id}
                  className={`flex items-center justify-center gap-1 h-8 rounded text-xs transition-colors cursor-pointer ${
                    theme === id
                      ? 'bg-surface text-fg ring-1 ring-inset ring-line'
                      : 'text-fg-3 hover:text-fg'
                  }`}
                >
                  <Icon strokeWidth={1.5} className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop and tablet) */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden md:flex w-full h-9 items-center rounded-lg text-sm text-fg-3 hover:text-fg hover:bg-raised transition-colors cursor-pointer ${
            sidebarCollapsed ? 'justify-center' : 'gap-3 px-3'
          }`}
        >
          {sidebarCollapsed ? (
            <ChevronRight strokeWidth={1.5} className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft strokeWidth={1.5} className="h-4 w-4" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop & Off-canvas Drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden animate-enter"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-72 h-full bg-surface border-r border-line animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop / Tablet Persistent Sidebar */}
      <aside
        aria-label="Primary"
        className={`hidden md:block border-r border-line bg-deep transition-[width] duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
};