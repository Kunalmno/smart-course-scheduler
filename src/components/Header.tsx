/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Bell,
  Search,
  Plus,
  GitMerge,
  User,
  Settings,
  LogOut,
  Check,
  CheckCheck,
  Menu,
  ChevronDown,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';

interface HeaderProps {
  onOpenSearch?: () => void;
  onAddSchedule?: () => void;
  onAutoResolve?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onAddSchedule,
  onAutoResolve,
}) => {
  const {
    getConflictCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    setMobileSidebarOpen,
    autoResolveAllConflicts,
  } = useScheduleStore();

  const conflictCount = getConflictCount();
  const unreadCount = getUnreadNotificationCount();

  // Dropdown states
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Refs for outside click & keyboard management
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Platform detection for ⌘K vs Ctrl K
  const [shortcutKey, setShortcutKey] = useState('⌘K');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || '');
      setShortcutKey(isMac ? '⌘K' : 'Ctrl K');
    }
  }, []);

  // Global outside-click and Esc handler
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (quickActionsRef.current && !quickActionsRef.current.contains(target)) {
        setQuickActionsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuickActionsOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenSearch]);

  const handleAutoResolveClick = () => {
    if (onAutoResolve) {
      onAutoResolve();
    } else {
      autoResolveAllConflicts();
    }
    setQuickActionsOpen(false);
  };

  const handleAddScheduleClick = () => {
    onAddSchedule?.();
    setQuickActionsOpen(false);
  };

  // Keyboard navigation inside menu list
  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const menu = e.currentTarget;
      const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
      const activeElement = document.activeElement as HTMLButtonElement;
      const currentIndex = buttons.indexOf(activeElement);

      if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex]?.focus();
      } else {
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[prevIndex]?.focus();
      }
    }
  };

  return (
    <header className="h-16 border-b border-line bg-surface/95  sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Hamburger (mobile) + Wordmark + SystemStatusBadge */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden p-2 text-fg-3 hover:text-fg rounded-lg hover:bg-raised"
          aria-label="Open navigation sidebar"
        >
          <Menu strokeWidth={1.5} className="h-4 w-4" />
        </button>

        {/* Wordmark & Logo Mark */}
        <div className="flex items-center space-x-3">
          <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-accent"
              aria-hidden="true"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          <div className="hidden sm:block">
            <span className="text-base font-medium text-fg">
              SmartScholar
            </span>
          </div>
        </div>

        {/* System status: a dot and a line of text */}
        <div className="hidden lg:flex items-center">
          <div
            className="inline-flex items-center gap-2 text-xs text-fg-2"
            role="status"
            aria-label={
              conflictCount === 0
                ? 'System status: All Systems Operational'
                : `System status: ${conflictCount} Conflicts Need Attention`
            }
          >
            <span className={`h-2 w-2 rounded-full ${conflictCount === 0 ? 'bg-ok' : 'bg-warn'}`} />
            <span>
              {conflictCount === 0
                ? 'All systems operational'
                : `${conflictCount} conflict${conflictCount > 1 ? 's' : ''} need attention`}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search input trigger button */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-fg-3 bg-raised hover:bg-line-strong/70 border border-line rounded-lg transition-colors cursor-pointer"
          aria-label="Search timetable, courses, rooms, or faculty (Cmd+K)"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0" />
            <span className="truncate">Search</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-fg-3 bg-surface border border-line rounded">
            {shortcutKey}
          </kbd>
        </button>
      </div>

      {/* Right Actions: Quick Actions + Notification Bell + User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* QuickActions Dropdown */}
        <div className="relative" ref={quickActionsRef}>
          <button
            type="button"
            onClick={() => {
              setQuickActionsOpen(!quickActionsOpen);
              setNotificationsOpen(false);
              setUserMenuOpen(false);
            }}
            aria-expanded={quickActionsOpen}
            aria-haspopup="menu"
            className="flex items-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer"
          >
            <span>Actions</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${quickActionsOpen ? 'rotate-180' : ''}`} />
          </button>

          {quickActionsOpen && (
            <div
              role="menu"
              aria-label="Quick Actions"
              onKeyDown={handleMenuKeyDown}
              className="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-line shadow-float py-2 z-50 animate-enter"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleAddScheduleClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-medium text-fg-2 hover:bg-raised transition-colors focus-visible:bg-raised cursor-pointer text-left"
              >
                <Plus strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0" />
                <span>Add schedule</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleAutoResolveClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-medium text-fg-2 hover:bg-raised transition-colors focus-visible:bg-raised cursor-pointer text-left"
              >
                <GitMerge strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0" />
                <span>Auto-resolve conflicts</span>
              </button>
            </div>
          )}
        </div>

        {/* NotificationBell with Unread Badge & Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setQuickActionsOpen(false);
              setUserMenuOpen(false);
            }}
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
            aria-label={`Notifications, ${unreadCount} unread`}
            className="p-2 text-fg-2 hover:text-fg rounded-lg hover:bg-raised transition-colors relative cursor-pointer"
          >
            <Bell strokeWidth={1.5} className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-bad" />
            )}
          </button>

          {notificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-surface border border-line shadow-float z-50 overflow-hidden animate-enter"
            >
              <div className="p-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-medium text-fg">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="font-mono text-xs text-fg-3">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-xs font-medium text-fg-2 hover:underline flex items-center space-x-1 cursor-pointer rounded"
                  >
                    <CheckCheck strokeWidth={1.5} className="h-4 w-4" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-line max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 text-xs transition-colors flex items-start space-x-3 ${
                      notif.read
                        ? 'bg-transparent text-fg-3'
                        : 'bg-raised text-fg font-medium'
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {notif.type === 'conflict' ? (
                        <AlertCircle strokeWidth={1.5} className="h-4 w-4 text-warn" />
                      ) : notif.type === 'warning' ? (
                        <AlertCircle strokeWidth={1.5} className="h-4 w-4 text-bad" />
                      ) : (
                        <Info strokeWidth={1.5} className="h-4 w-4 text-fg-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-fg truncate">
                          {notif.title}
                        </p>
                        <span className="text-xs text-fg-3 shrink-0 ml-2">
                          {notif.createdAt.substring(11, 16)}
                        </span>
                      </div>
                      <p className="text-xs text-fg-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notif.id)}
                        title="Mark as read"
                        aria-label="Mark as read"
                        className="text-fg-3 hover:text-fg p-1 rounded cursor-pointer"
                      >
                        <Check strokeWidth={1.5} className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* UserMenu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setQuickActionsOpen(false);
              setNotificationsOpen(false);
            }}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="User profile menu: Dean Richardson"
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-raised transition-colors cursor-pointer"
          >
            <div className="h-8 w-8 rounded bg-raised text-fg-2 ring-1 ring-inset ring-line font-medium text-xs flex items-center justify-center">
              DR
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-xs font-medium text-fg">
                Dean Richardson
              </p>
              <p className="text-xs text-fg-3">Academic Registrar</p>
            </div>
            <ChevronDown className={`h-3 w-3 text-fg-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              aria-label="User settings"
              onKeyDown={handleMenuKeyDown}
              className="absolute right-0 mt-2 w-52 rounded-xl bg-surface border border-line shadow-float py-2 z-50 animate-enter"
            >
              <div className="px-4 py-2 border-b border-line text-xs">
                <p className="font-medium text-fg">
                  Dean Richardson
                </p>
                <p className="text-xs text-fg-3 truncate">
                  registrar@scholars.edu
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-medium text-fg-2 hover:bg-raised transition-colors focus-visible:bg-raised cursor-pointer text-left"
              >
                <User strokeWidth={1.5} className="h-4 w-4 text-fg-3" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-medium text-fg-2 hover:bg-raised transition-colors focus-visible:bg-raised cursor-pointer text-left"
              >
                <Settings strokeWidth={1.5} className="h-4 w-4 text-fg-3" />
                <span>Preferences</span>
              </button>

              <div className="border-t border-line my-1" />

              <button
                type="button"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-medium text-bad hover:bg-raised transition-colors focus-visible:bg-raised dark:focus-visible:bg-rose-950/30 cursor-pointer text-left"
              >
                <LogOut strokeWidth={1.5} className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
