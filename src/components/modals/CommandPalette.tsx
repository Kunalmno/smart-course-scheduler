/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Search,
  GitMerge,
  Plus,
  Moon,
  Sun,
  LayoutDashboard,
  Calendar,
  Building,
  GraduationCap,
  Users,
  Clock,
  History,
  X,
  ArrowRight,
} from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import {
  searchAcademicEntities,
  highlightMatch,
  SearchResultItem,
  SearchCategory,
} from '../../lib/search';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    courses,
    rooms,
    faculty,
    scholars,
    events,
    setSelectedDate,
    setBuildingFilter,
    setView,
    setActiveNav,
    theme,
    setTheme,
    openAddEventModal,
    runInteractiveAutoScheduler,
  } = useScheduleStore();

  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('smartscholar_recent_searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(next);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('smartscholar_recent_searches', JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  // Debounce input by 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setRawQuery('');
      setDebouncedQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Static quick commands
  const staticCommands: SearchResultItem[] = [
    {
      id: 'cmd-add-schedule',
      category: 'commands',
      title: 'Add session',
      subtitle: 'Create a new course timetable booking',
      badge: 'Action',
      score: 95,
      metadata: { action: 'add-schedule' },
    },
    {
      id: 'cmd-auto-scheduler',
      category: 'commands',
      title: 'Run auto-scheduler',
      subtitle: 'Automatically backtrack and resolve all conflicts',
      badge: 'Engine',
      score: 90,
      metadata: { action: 'run-scheduler' },
    },
    {
      id: 'cmd-toggle-theme',
      category: 'commands',
      title: `Toggle theme (currently ${theme})`,
      subtitle: 'Switch between light and dark visual modes',
      badge: 'Settings',
      score: 85,
      metadata: { action: 'toggle-theme' },
    },
    {
      id: 'cmd-go-dashboard',
      category: 'commands',
      title: 'Go to dashboard',
      subtitle: 'Return to primary schedule overview',
      badge: 'Nav',
      score: 80,
      metadata: { action: 'go-dashboard' },
    },
    {
      id: 'cmd-view-day',
      category: 'commands',
      title: 'Switch to day view',
      subtitle: 'View full 30-min schedule grid for all facilities',
      badge: 'View',
      score: 75,
      metadata: { action: 'view-day' },
    },
    {
      id: 'cmd-view-week',
      category: 'commands',
      title: 'Switch to week view',
      subtitle: 'Overview 5-day academic timetable blocks',
      badge: 'View',
      score: 70,
      metadata: { action: 'view-week' },
    },
  ];

  // Entity results
  const entityResults = debouncedQuery.trim()
    ? searchAcademicEntities({
        query: debouncedQuery,
        courses,
        rooms,
        faculty,
        scholars,
        events,
      })
    : [];

  // Filter commands by query
  const filteredCommands = debouncedQuery.trim()
    ? staticCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          c.subtitle?.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : staticCommands;

  const allResults: SearchResultItem[] = [
    ...filteredCommands,
    ...entityResults,
  ];

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const executeAction = (item: SearchResultItem) => {
    saveRecentSearch(debouncedQuery || item.title);
    setCommandPaletteOpen(false);

    if (item.category === 'commands') {
      const action = item.metadata?.action;
      if (action === 'add-schedule') {
        openAddEventModal();
      } else if (action === 'run-scheduler') {
        runInteractiveAutoScheduler();
      } else if (action === 'toggle-theme') {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      } else if (action === 'go-dashboard') {
        setActiveNav('dashboard');
        setView('day');
      } else if (action === 'view-day') {
        setView('day');
      } else if (action === 'view-week') {
        setView('week');
      }
    } else if (item.category === 'events') {
      const date = item.metadata?.date as string;
      if (date) {
        setSelectedDate(date);
        setView('day');
      }
    } else if (item.category === 'rooms') {
      const building = item.metadata?.building as string;
      if (building) {
        setBuildingFilter(building);
        setView('day');
      }
    } else if (item.category === 'courses' || item.category === 'faculty') {
      setView('day');
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (allResults.length > 0 ? (prev + 1) % allResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        allResults.length > 0 ? (prev - 1 + allResults.length) % allResults.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[activeIndex]) {
        executeAction(allResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  const renderCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case 'commands':
        return <GitMerge strokeWidth={1.5} className="h-4 w-4 text-fg-3" />;
      case 'courses':
        return <GraduationCap strokeWidth={1.5} className="h-4 w-4 text-fg-3" />;
      case 'rooms':
        return <Building strokeWidth={1.5} className="h-4 w-4 text-fg-3" />;
      case 'faculty':
        return <Users strokeWidth={1.5} className="h-4 w-4 text-fg-3" />;
      case 'scholars':
        return <Users strokeWidth={1.5} className="h-4 w-4" />;
      case 'events':
        return <Calendar strokeWidth={1.5} className="h-4 w-4 text-fg-3" />;
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      role="presentation"
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 animate-enter duration-150"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command search palette"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-xl bg-surface border border-line shadow-float text-fg overflow-hidden flex flex-col max-h-[75vh]"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-line">
          <Search strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="command-search-results"
            aria-activedescendant={
              allResults[activeIndex] ? `result-${allResults[activeIndex].id}` : undefined
            }
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search"
            className="w-full bg-transparent text-sm placeholder:text-fg-3 focus:outline-none"
          />
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <kbd className="px-2 py-1 text-xs font-mono font-medium rounded bg-raised text-fg-3 border border-line">
              ESC
            </kbd>
          </div>
        </div>

        {/* Recent Searches Pills (when input is empty) */}
        {!rawQuery && recentSearches.length > 0 && (
          <div className="px-4 py-2 bg-page border-b border-line flex items-center space-x-2 text-xs text-fg-3 overflow-x-auto">
            <span className="flex items-center space-x-1 shrink-0">
              <History strokeWidth={1.5} className="h-4 w-4" />
              <span>Recent:</span>
            </span>
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRawQuery(item)}
                className="px-2 py-1 rounded-md bg-surface border border-line hover:border-line-strong text-fg-2 shrink-0 cursor-pointer transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div
          ref={listRef}
          id="command-search-results"
          role="listbox"
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-fg-3 space-y-2">
              <Search strokeWidth={1.5} className="h-8 w-8 mx-auto text-fg-3" />
              <p className="text-xs font-medium">No results found for &ldquo;{rawQuery}&rdquo;</p>
              <p className="text-xs text-fg-3">
                Try searching for &quot;CS 101&quot;, &quot;Physics Lab&quot;, &quot;Alan Turing&quot;, or &quot;Auto-Scheduler&quot;.
              </p>
            </div>
          ) : (
            allResults.map((item, index) => {
              const isSelected = index === activeIndex;

              return (
                <div
                  key={item.id}
                  id={`result-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => executeAction(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer select-none text-xs ${
                    isSelected
                      ? 'bg-raised text-fg'
                      : 'hover:bg-raised'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-lg bg-raised shrink-0">
                      {renderCategoryIcon(item.category)}
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {highlightMatch(item.title, debouncedQuery).map((part, i) =>
                          part.match ? (
                            <mark
                              key={i}
                              className="bg-line-strong text-fg-2 font-medium rounded-xs px-1"
                            >
                              {part.text}
                            </mark>
                          ) : (
                            <span key={i}>{part.text}</span>
                          )
                        )}
                      </div>

                      {item.subtitle && (
                        <p className="text-xs text-fg-3 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    {item.badge && (
                      <span className="font-mono text-xs text-fg-3">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight strokeWidth={1.5} className="h-4 w-4 text-fg-2" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-line bg-page flex items-center justify-between text-xs text-fg-3">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 rounded bg-raised border border-line font-mono text-xs">↑</kbd>{' '}
              <kbd className="px-1 rounded bg-raised border border-line font-mono text-xs">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 rounded bg-raised border border-line font-mono text-xs">↵</kbd> to select
            </span>
          </div>
          <span className="hidden sm:inline">SmartScholar</span>
        </div>
      </div>
    </div>
  );
};
