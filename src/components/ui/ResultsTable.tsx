import { useMemo } from 'react';
import { AthleticsResult } from '@/types/athletics';

interface ColumnConfig {
  key: keyof AthleticsResult | string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

interface ResultsTableProps {
  results: AthleticsResult[];
  eventName: string;
  eventType?: string; // sprint, distance, hurdles, steeplechase, vertical jump, horizontal jump, throw
  columnOrder?: string[];
}

// Default column configurations
const DEFAULT_COLUMNS: Record<string, Partial<ColumnConfig>> = {
  position: { width: 'w-16', align: 'center' },
  rank: { width: 'w-10', align: 'center' },
  bibNumber: { width: 'w-20', align: 'center', label: 'Bib' },
  athleteName: { width: 'w-48', align: 'left' },
  state: { width: 'w-32', align: 'left' },
  timing: { width: 'w-24', align: 'right' },
  distance: { width: 'w-24', align: 'right' },
  points: { width: 'w-20', align: 'right' },
  height: { width: 'w-24', align: 'right' },
  wind: { width: 'w-20', align: 'right' },
  attempts: { width: 'w-24', align: 'right' },
};

export default function ResultsTable({ results, eventName, columnOrder }: ResultsTableProps) {
  // Build column configuration
  const excludedFields = ['id', 'tournamentId', 'eventName', 'remarks', 'athleteNameLower', 'eventType'];
  const sampleResult = results[0];
  const availableKeys = Object.keys(sampleResult).filter(key => !excludedFields.includes(key));
  
  // Determine which columns to exclude based on event type
  const getExcludedColumns = (type?: string): string[] => {
    console.log("Determining excluded columns for event type:", type);
    const normalizedType = type?.toLowerCase() || '';
    
    // Wind is only for sprints, hurdles, and horizontal jumps
    const excludeWind = !['100m', '200m', 'long', 'triple'].includes(normalizedType);

    // Attempts are only for jumps and throws
    const excludeAttempts = !['jump', 'throw'].includes(normalizedType);
    
    // Performance field mapping
    const excludeFields: string[] = [];
    
    if (excludeWind) excludeFields.push('wind');
    if (excludeAttempts) excludeFields.push('attempts');
    
    return excludeFields;
  };
  
  const excludedColumns = getExcludedColumns(eventName);
  const filteredKeys = availableKeys.filter(key => !excludedColumns.includes(key));
  console.log("Excluded Columns:", excludedColumns);
  console.log("Filtered Keys:", filteredKeys);
  
  // Use custom order or default order
  const orderedKeys = columnOrder || 
    ['position', 'rank', 'bibNumber', 'athleteName', 'state', 'performance', ...filteredKeys.filter(k => !['position', 'rank', 'bibNumber', 'athleteName', 'gender', 'ageCategory', 'state', 'performance'].includes(k))];
  
  const columns: ColumnConfig[] = orderedKeys
    .filter(key => filteredKeys.includes(key))
    .map(key => ({
      key,
      label: DEFAULT_COLUMNS[key]?.label || formatHeader(key),
      width: DEFAULT_COLUMNS[key]?.width || 'w-32',
      align: DEFAULT_COLUMNS[key]?.align || 'left',
    }));

  // Format column header
  function formatHeader(col: string) {
    return col
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Sort results by position (0 at bottom)
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const aPos = Number(a.position) || 0;
      const bPos = Number(b.position) || 0;
      
      // Position 0 goes to bottom
      if (aPos === 0 && bPos === 0) return 0;
      if (aPos === 0) return 1;
      if (bPos === 0) return -1;
      
      // Normal ascending order for non-zero positions
      return aPos - bPos;
    });
  }, [results]);

  const getMedalIcon = (position: number | string) => {
    const pos = Number(position);
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return null;
  };

  const getMedalColor = (position: number | string) => {
    const pos = Number(position);
    if (pos === 1) return 'bg-yellow-50 border-l-4 border-yellow-500';
    if (pos === 2) return 'bg-gray-50 border-l-4 border-gray-400';
    if (pos === 3) return 'bg-orange-50 border-l-4 border-orange-600';
    return 'border-slate-200';
  };

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--muted-2)' }}>No results available for {eventName}</p>
      </div>
    );
  }


  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
            <tr className='border-b border-slate-200'>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-3 py-3 text-sm font-semibold ${col.width} ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={{ color: 'var(--primary)' }}
                >
                  <div className={`flex items-center gap-1 ${
                    col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                  }`}>
                    <span className="truncate">{col.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, idx) => {
              const medalClass = result.position ? getMedalColor(result.position) : '';
              const medalIcon = result.position ? getMedalIcon(result.position) : null;
              
              return (
                <tr
                  key={`${result.bibNumber || ''}-${idx}`}
                  className={`border-b transition-colors ${medalClass}`}
                  style={{ 
                    background: idx % 2 === 0 ? 'transparent' : 'var(--glass)'
                  }}
                >
                  {columns.map((col) => {
                    const value = (result as Record<string, any>)[col.key];
                    // Add medal icon to position column
                    if (col.key === 'position' && medalIcon) {
                      const displayValue = value !== undefined && value !== null ? String(value) : '-';
                      return (
                        <td
                          key={String(col.key)}
                          className={`px-3 py-2.5 text-sm ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                          style={{ color: 'var(--foreground)' }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">{medalIcon}</span>
                            <span className="font-semibold">{displayValue}</span>
                          </div>
                        </td>
                      );
                    }
                    const displayValue = value !== undefined && value !== null ? String(value) : '-';
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-3 py-2.5 text-sm ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                        style={{ color: 'var(--foreground)' }}
                      >
                        <div className="truncate" title={displayValue}>
                          {displayValue}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-2 text-xs text-right" style={{ color: 'var(--muted-2)' }}>
        Showing {sortedResults.length} result{sortedResults.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}