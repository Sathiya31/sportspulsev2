import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Tournament } from '@/types/badminton';
import { saveTournamentDayResults } from '@/services/firebaseService';

function getEventDates(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: string[] = [];
  let current = start;

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current = addDays(current, 1);
  }

  return dates;
}

interface TournamentActionsProps {
  tournament: Tournament;
  onFetchDaily: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
}

export default function TournamentActions({
  tournament,
  onFetchDaily,
  selectedDate,
  onDateChange,
  isLoading
}: TournamentActionsProps) {
  const [loadingAll, setLoadingAll] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleLoadAll = async () => {
    if (!tournament) return;
    
    setLoadingAll(true);
    const dates = getEventDates(tournament.start_date, tournament.end_date);
    setProgress({ current: 0, total: dates.length });

    try {
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const url = `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches?tournamentCode=${tournament.code}&date=${date}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`Failed to fetch matches for ${date}`);
        const data = await res.json();

        // Filter matches involving Indian players
        const indianMatches = data.filter((match: any) => {
          const team1Players = match?.team1?.players || [];
          const team2Players = match?.team2?.players || [];
          
          const hasIndianPlayer = [...team1Players, ...team2Players].some(
            player => player?.countryCode === 'IND'
          );
          
          return hasIndianPlayer;
        });

        // Only save if there are Indian matches
        if (indianMatches.length > 0) {
          console.log(`Saving ${indianMatches.length} matches for ${date}`);
          await saveTournamentDayResults(tournament.code, date, indianMatches);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProgress({ current: i + 1, total: dates.length });
      }
    } catch (error: any) {
      console.error('Error loading all results:', error);
      setError(error.message || 'Failed to load all results');
    } finally {
      setLoadingAll(false);
      setProgress({ current: 0, total: 0 });
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return date;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold">Select Date:</label>
        <select
          className="p-2 border border-blue-400 rounded text-black"
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
        >
          {getEventDates(tournament.start_date, tournament.end_date).map((date: string) => (
            <option key={date} value={date}>{formatDate(date)}</option>
          ))}
        </select>
      </div>
      
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        onClick={onFetchDaily}
        disabled={isLoading || loadingAll}
      >
        {isLoading ? 'Fetching...' : 'Fetch Results'}
      </button>

      <button
        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
        onClick={handleLoadAll}
        disabled={loadingAll || isLoading}
      >
        {loadingAll ? `Processing ${progress.current}/${progress.total}...` : 'Load All Results'}
      </button>

      {error && (
        <div className="text-red-500 text-sm animate-fade-out">
          {error}
        </div>
      )}
    </div>
  );
}