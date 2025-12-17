import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Competitor {
  code: string;
  organization: string;
  seed: number;
  result: string;
  win_loss: 'W' | 'L';
  team_name: string;
  athletes: {id: string; name: string}[];
}

export interface Match {
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

// Helper functions
const getRoundOrder = (round: string): number => {
  if (round.toLowerCase().includes('final') && !round.toLowerCase().includes('semi')
  && !round.toLowerCase().includes('quarter')) return 7;
  if (round.toLowerCase().includes('semi')) return 6;
  if (round.toLowerCase().includes('quarter')) return 5;
  if (round.includes('16')) return 4;
  if (round.includes('32')) return 3;
  if (round.includes('64')) return 2;
  if (round.includes('128')) return 1;
  return 0;
};

const parseSetScores = (result: string): { score: string; sets: string } => {
  const match = result.match(/^(\d+-\d+)\s*\((.+)\)$/);
  if (match) {
    const [, score, setsStr] = match;
    const validSets = setsStr
      .split(',')
      .filter(s => !s.includes('0:0'))
      .join(', ');
    return { score, sets: validSets };
  }
  return { score: result, sets: '' };
};

const CompetitionResults = ({ EventId, EventName }: { EventId: string, EventName: string }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const results: Match[] = await firebaseService.getCompetitionResults(EventId);
        setMatches(results);
        console.log('Fetched competition results:', results);
        
        // Auto-expand all rounds
        if (results.length > 0) {
          const rounds = new Set(results.map(m => m.round_name));
          setExpandedRounds(rounds);
          
          // Auto-expand all events within rounds
          const eventKeys = new Set(
            results.map(m => `${m.round_name}-${m.event_name}`)
          );
          setExpandedEvents(eventKeys);
        }
      } catch (err) {
        setError('Failed to fetch competition results');
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    if (EventId) {
      fetchResults();
    }
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

  const toggleEvent = (roundName: string, eventName: string) => {
    const key = `${roundName}-${eventName}`;
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Group by round first, then by event
  const groupedByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_name]) {
      acc[match.round_name] = {};
    }
    if (!acc[match.round_name][match.event_name]) {
      acc[match.round_name][match.event_name] = [];
    }
    acc[match.round_name][match.event_name].push(match);
    return acc;
  }, {} as Record<string, Record<string, Match[]>>);

  // Enhanced Match Card Component
  const CompactMatchCard = ({ match }: { match: Match }) => {
    const { sets } = parseSetScores(match.result);
    
    return (
      <div className="border hover:shadow-md transition-all duration-200"
        style={{ 
          background: "var(--surface)", 
          borderColor: "var(--border)",
          padding: "var(--space-md)",
          borderRadius: "var(--radius-sm)"
        }}>

        {/* Competitors */}
        <div className="space-y-2">
          {match.competitors.map((competitor) => (
            <div key={competitor.code}
              className="flex items-center justify-between gap-3 p-2.5 transition-colors"
              style={{
                background: competitor.win_loss === 'W' ? "var(--success-bg)" : "var(--glass)",
                borderLeft: `3px solid ${competitor.win_loss === 'W' ? "var(--success)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)"
              }}>
              
              {/* Player Info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs px-2 py-1 font-medium whitespace-nowrap"
                  style={{ 
                    background: "var(--muted)", 
                    color: "var(--surface)",
                    borderRadius: "var(--radius-sm)"
                  }}>
                  {competitor.organization}
                </span>
                <span className="text-sm font-medium truncate"
                  style={{ color: competitor.win_loss === 'W' ? "var(--success)" : "var(--foreground)" }}>
                  {competitor.team_name.replace(/\//g, ' / ')}
                </span>
                {competitor.seed > 0 && (
                  <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                    [{competitor.seed}]
                  </span>
                )}
              </div>
              
              {/* Score */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tabular-nums"
                  style={{ color: competitor.win_loss === 'W' ? "var(--success)" : "var(--muted)" }}>
                  {competitor.result}
                </span>
                {competitor.win_loss === 'W' && (
                  <span style={{ color: "var(--success)" }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Set Scores */}
        {sets && (
          <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs font-mono px-3 py-1.5 inline-block"
              style={{ 
                background: "var(--glass)", 
                color: "var(--muted)",
                borderRadius: "var(--radius-sm)"
              }}>
              <b>Sets: </b> {sets}
            </span>
            {/* Date/Time */}
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {match.date}
          </span>
          </div>
        )}
      </div>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary)" }}></div>
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
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--primary)" }}>
            {EventName}
          </h2>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3" style={{ color: "var(--danger)" }}>⚠️</div>
        <h2 className="text-base font-bold mb-2" style={{ color: "var(--danger)" }}>Error Loading Results</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 text-sm transition-opacity hover:opacity-90"
          style={{ 
            background: "var(--primary)", 
            color: "white",
            borderRadius: "var(--radius)"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--muted)" }}>No matches found</h3>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>No match results available for this competition</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-lg md:text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>
          {EventName}
        </h2>
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--muted)" }}>
          <span>{matches.length} {matches.length === 1 ? 'match' : 'matches'}</span>
          <span>•</span>
          <span>{Object.keys(groupedByRound).length} {Object.keys(groupedByRound).length === 1 ? 'round' : 'rounds'}</span>
        </div>
      </div>

      {/* Results grouped by Round → Events */}
      <div className="space-y-6">
        {Object.entries(groupedByRound)
          .sort(([a], [b]) => getRoundOrder(b) - getRoundOrder(a))
          .map(([roundName, events]) => {
            const isRoundExpanded = expandedRounds.has(roundName);
            const totalMatches = Object.values(events).reduce((sum, matches) => sum + matches.length, 0);

            return (
              <div key={roundName} className="shadow-lg overflow-hidden"
                style={{ 
                  background: "var(--surface)", 
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)"
                }}>
                
                {/* Round Header */}
                <button
                  onClick={() => toggleRound(roundName)}
                  className="w-full p-4 md:p-5 text-left hover:opacity-90 transition-opacity"
                  style={{ background: "var(--glass)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base md:text-lg font-bold" style={{ color: "var(--foreground)" }}>
                      {roundName}
                    </h3>
                    {isRoundExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  <div className="flex items-center gap-3 text-xs md:text-sm" style={{ color: "var(--muted)" }}>
                    <span>{totalMatches} {totalMatches === 1 ? 'match' : 'matches'}</span>
                    <span>•</span>
                    <span>{Object.keys(events).length} {Object.keys(events).length === 1 ? 'event' : 'events'}</span>
                  </div>
                </button>

                {/* Events within Round */}
                {isRoundExpanded && (
                  <div className="p-4 md:p-5 pt-0 space-y-4">
                    {Object.entries(events)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([eventName, eventMatches]) => {
                        const eventKey = `${roundName}-${eventName}`;
                        const isEventExpanded = expandedEvents.has(eventKey);

                        return (
                          <div key={eventName} className="overflow-hidden"
                            style={{ 
                              background: "var(--background)", 
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)"
                            }}>
                            
                            {/* Event Header */}
                            <button
                              onClick={() => toggleEvent(roundName, eventName)}
                              className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
                              style={{ background: "var(--glass)" }}
                            >
                              <div className="flex items-center gap-2">
                                {isEventExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                <h4 className="text-sm md:text-base font-semibold" style={{ color: "var(--foreground)" }}>
                                  {eventName}
                                </h4>
                              </div>
                              <span className="text-xs px-2.5 py-1 font-medium"
                                style={{ 
                                  background: "var(--surface)", 
                                  color: "var(--muted)",
                                  borderRadius: "var(--radius-full)"
                                }}>
                                {eventMatches.length} {eventMatches.length === 1 ? 'match' : 'matches'}
                              </span>
                            </button>

                            {/* Matches */}
                            {isEventExpanded && (
                              <div className="p-3 md:p-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                                {eventMatches.map((match) => (
                                  <CompactMatchCard key={match.match_id} match={match} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CompetitionResults;
