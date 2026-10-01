'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { DaymarkData } from '@/lib/types';
import {
  getISTToday,
  formatDateKey,
  getMonthKey,
  generateCalendarGrid,
  formatDisplayDate,
} from '@/lib/dateUtils';

const STORAGE_KEY = 'daymark_data';

export default function Daymark() {
  const [data, setData] = useState<DaymarkData>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const today = useMemo(() => getISTToday(), []);
  const todayDateKey = useMemo(() => formatDateKey(today), [today]);
  const todayMonthKey = useMemo(() => getMonthKey(today), [today]);
  const todayYearKey = useMemo(() => String(today.getFullYear()), [today]);

  // Load from LocalStorage and API on mount
  useEffect(() => {
    let localData: DaymarkData = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localData = JSON.parse(stored);
        setData(localData);
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }

    fetch('/api/data')
      .then((res) => res.json())
      .then((serverData: DaymarkData) => {
        if (serverData && typeof serverData === 'object') {
          // Merge server data with local data
          const merged: DaymarkData = { ...serverData };
          if (localData[todayYearKey]?.[todayMonthKey]) {
            if (!merged[todayYearKey]) merged[todayYearKey] = {};
            if (!merged[todayYearKey][todayMonthKey]) merged[todayYearKey][todayMonthKey] = {};
            merged[todayYearKey][todayMonthKey] = {
              ...merged[todayYearKey][todayMonthKey],
              ...localData[todayYearKey][todayMonthKey],
            };
          }
          setData(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch from /api/data', err);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [todayYearKey, todayMonthKey]);

  // Determine if today is marked as worked
  const todayWorked = Boolean(data?.[todayYearKey]?.[todayMonthKey]?.[todayDateKey]);

  // Toggle today's status
  const handleToggleToday = useCallback(async () => {
    const nextState = !todayWorked;

    const updatedData: DaymarkData = {
      ...data,
      [todayYearKey]: {
        ...(data[todayYearKey] || {}),
        [todayMonthKey]: {
          ...(data[todayYearKey]?.[todayMonthKey] || {}),
          [todayDateKey]: nextState,
        },
      },
    };

    // Update state & LocalStorage immediately
    setData(updatedData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // Persist to server JSON file
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateKey: todayDateKey,
          worked: nextState,
        }),
      });
    } catch (e) {
      console.error('Failed to persist to /api/data', e);
    }
  }, [data, todayWorked, todayDateKey, todayMonthKey, todayYearKey]);

  const columns = useMemo(() => generateCalendarGrid(data), [data]);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none">
      {/* Main Graph Card */}
      <div className="bg-[#090909] border border-neutral-900 rounded-lg px-8 py-5 flex items-center justify-center shadow-lg">
        <div className="flex gap-1.5 items-center">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-1.5 items-center">
              {col.days.map((cell) => {
                if (!cell.isInWindow && cell.status === 'PAST') {
                  // Cell outside 30-day window in first week column
                  return (
                    <div
                      key={cell.dateKey}
                      className="w-2.5 h-2.5 opacity-0 pointer-events-none"
                    />
                  );
                }

                const isTodayCell = cell.status === 'TODAY';
                const isFutureCell = cell.status === 'FUTURE';
                const cellWorked = isTodayCell ? todayWorked : cell.worked;

                let dotColor = 'bg-neutral-800'; // Past not worked
                if (isFutureCell) {
                  dotColor = 'bg-[#141414] border border-neutral-800/40';
                } else if (cellWorked) {
                  dotColor = 'bg-[#238636]'; // Dark green, no gradient
                }

                let statusLabel = cellWorked ? 'Worked' : "Didn't work";
                if (isTodayCell) {
                  statusLabel = cellWorked ? 'Today (Worked)' : 'Today';
                } else if (isFutureCell) {
                  statusLabel = 'Future';
                }

                return (
                  <div key={cell.dateKey} className="relative group">
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-colors cursor-default ${dotColor} ${
                        isTodayCell ? 'ring-1 ring-neutral-400/40 ring-offset-1 ring-offset-black' : ''
                      }`}
                    />

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#121212] border border-neutral-800 text-[11px] font-mono text-neutral-300 rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30 flex flex-col items-center">
                      <span className="text-neutral-200">{cell.dateKey}</span>
                      <span className="text-[10px] text-neutral-400">{statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Toggle for Today below the graph */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleToggleToday}
          disabled={!isLoaded}
          aria-label={`Toggle work for today (${todayDateKey})`}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-neutral-800/90 hover:border-neutral-700 bg-[#090909] hover:bg-neutral-900 transition-colors cursor-pointer select-none active:scale-95"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              todayWorked ? 'bg-[#238636]' : 'bg-neutral-700'
            }`}
          />
          <span className="text-xs font-mono text-neutral-400">
            {todayDateKey}
          </span>
        </button>
      </div>
    </main>
  );
}
