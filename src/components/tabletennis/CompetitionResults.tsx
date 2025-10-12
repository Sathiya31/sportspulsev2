import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Competitor {
  code: string;
  organization: string;
  seed: number;
  result: string;
  win_loss: 'W' | 'L';
  team_name: string;
  athlete_names: string[];
}

interface Match {
  id?: string;
  competition_id: number;
  match_id: string;
  date: string;
  time: string;
  result: string;
  event_name: string;
  competitors: Competitor[];
  round_code: string;
  round_name: string;
}

const firebaseService = {
  getCompetitionResults: async (competitionId: string): Promise<Match[]> => {
    try {
      const q = query(
        collection(db, 'tabletennis'),
        where('competition_id', '==', competitionId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
    } catch (error) {
      console.error('Error fetching competition results:', error);
      throw error;
    }
  }
};

const CompetitionResults = ({ EventId, EventName }: { EventId: string, EventName: string }) => {
  console.log("selected", EventId, EventName);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const results: Match[] = await firebaseService.getCompetitionResults(EventId);
        setMatches(results);
        console.log('Fetched matches:', results);
        
        // Auto-expand all rounds initially
        if (results.length > 0) {
          const rounds = new Set(results.map(m => m.round_name));
          setExpandedRounds(rounds);
        }
      } catch (err) {
        setError('Failed to fetch competition results');
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [EventId]);

  const toggleRound = (roundName: string) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundName)) {
        newSet.delete(roundName);
      } else {
        newSet.add(roundName);
      }
      return newSet;
    });
  };

  // Group matches by round_name
  const groupedMatches = matches.reduce((groups: Record<string, Match[]>, match: Match) => {
    const roundName = match.round_name;
    if (!groups[roundName]) {
      groups[roundName] = [];
    }
    groups[roundName].push(match);
    return groups;
  }, {});

  const formatResult = (result: string) => {
    if (!result) return '';
    return result;
  };

  const CompactMatchCard = ({ match }: { match: Match }) => (
    <div className="rounded-lg p-2.5 shadow transition-shadow" 
      style={{ background: "var(--surface)" }}>
      
      {/* Header - Event & Date */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b" 
        style={{ borderColor: "var(--primary-lighter)" }}>
        <span className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
          {match.event_name}
        </span>
        <span className="text-xs whitespace-nowrap ml-2" style={{ color: "var(--muted)" }}>
          {match.date} {match.time}
        </span>
      </div>

      {/* Competitors - Compact layout */}
      <div className="space-y-1.5">
        {match.competitors.map((competitor) => (
          <div key={competitor.code} 
            className="flex items-center justify-between gap-1 p-2 transition-colors"
            style={{ 
              background: competitor.win_loss === 'W' ? "rgba(34, 197, 94, 0.1)" : "var(--glass)",
              border: `0px solid ${competitor.win_loss === 'W' ? "rgba(34, 197, 94, 0.3)" : "var(--muted-2)"}`
            }}>
            
            {/* Team info */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs px-1.5 py-0.5 font-medium whitespace-nowrap" 
                style={{ background: "var(--muted)", color: "var(--surface)" }}>
                {competitor.organization}
              </span>
              <span className="text-xs md:text-sm font-medium truncate" 
                style={{ color: competitor.win_loss === 'W' ? "rgb(34, 197, 94)" : "var(--foreground)" }}>
                {competitor.team_name.replaceAll('/', ' / ')}
              </span>
              {competitor.win_loss === 'W' && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap"
                  style={{ background: "rgb(34, 197, 94)", color: "white" }}>
                  W
                </span>
              )}
            </div>
            
            {/* Score */}
            <span className="text-base md:text-lg font-bold tabular-nums" 
              style={{ color: competitor.win_loss === 'W' ? "rgb(34, 197, 94)" : "var(--muted)" }}>
              {formatResult(competitor.result)}
            </span>
          </div>
        ))}
      </div>

      {/* Final Score */}
      <div className="mt-2 pt-2 border-t text-center" style={{ borderColor: "var(--primary-lighter)" }}>
        <span className="text-xs" style={{ color: "var(--muted)" }}>Score: </span>
        <span className="text-xs font-mono px-2 py-0.5 rounded font-medium" 
          style={{ background: "var(--glass)", color: "var(--foreground)" }}>
          {match.result}
        </span>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-lighter)" }}></div>
      <span className="ml-3 text-sm" style={{ color: "var(--muted)" }}>Loading matches...</span>
    </div>
  );

  // Show placeholder when no competition is selected
  if (!EventId) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏓</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--muted)" }}>No Competition Selected</h2>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>Select an event from the calendar to view results</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-base md:text-lg font-bold" style={{ color: "var(--primary)" }}>
            {EventName}
          </h2>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3" style={{ color: "var(--danger)" }}>⚠️</div>
        <h2 className="text-base font-bold mb-2" style={{ color: "var(--danger)" }}>Error Loading Results</h2>
        <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: "var(--primary)", color: "var(--surface)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: "var(--glass)" }}>
        <h2 className="text-base md:text-lg font-bold" style={{ color: "var(--primary)" }}>
          {EventName}
        </h2>
        <span className="text-xs px-3 py-1 rounded-full" 
          style={{ background: "var(--glass)", color: "var(--glass)" }}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {/* Results grouped by rounds - Collapsible */}
      <div className="space-y-3">
        {Object.entries(groupedMatches)
          .sort(([a], [b]) => {
            // Sort rounds in tournament order
            const order = ['Round of 64', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
            return order.indexOf(b) - order.indexOf(a);
          })
          .map(([roundName, roundMatches]: [string, Match[]]) => {
            const isExpanded = expandedRounds.has(roundName);
            
            return (
              <div key={roundName} className="shadow overflow-hidden">
                
                {/* Collapsible Round Header */}
                <button 
                  onClick={() => toggleRound(roundName)}
                  className="w-full flex items-center justify-between p-3 hover:opacity-80
                  border-b transition-opacity"
                  style={{ background: "var(--glass)", borderColor: "var(--primary-lighter)" }}
                >
                  <div className="flex items-center gap-2">
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      style={{ color: "var(--primary)" }}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h3 className="text-sm md:text-base font-bold" style={{ color: "var(--primary)" }}>
                      {roundName}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" 
                    style={{ background: "var(--surface)", color: "var(--muted)" }}>
                    {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                </button>
                
                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-3 pt-0">
                    <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2 mt-3">
                      {roundMatches.map((match: Match) => (
                        <CompactMatchCard key={match.match_id} match={match} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏓</div>
          <h3 className="text-base font-semibold mb-2" style={{ color: "var(--muted)" }}>No matches found</h3>
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>No match results available for this competition</p>
        </div>
      )}
    </div>
  );
};

export default CompetitionResults;