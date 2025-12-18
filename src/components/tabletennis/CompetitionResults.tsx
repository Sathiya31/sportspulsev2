import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
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
  const lowerRound = round.toLowerCase();
  if (lowerRound.includes('final') && !lowerRound.includes('semi') && !lowerRound.includes('quarter')) return 7;
  if (lowerRound.includes('semi')) return 6;
  if (lowerRound.includes('quarter')) return 5;
  if (lowerRound.includes('16')) return 4;
  if (lowerRound.includes('32')) return 3;
  if (lowerRound.includes('64')) return 2;
  if (lowerRound.includes('128')) return 1;
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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const results: Match[] = await firebaseService.getCompetitionResults(EventId);
        setMatches(results);
        console.log('Fetched competition results:', results);
        
        // Smart expand: Only expand the most recent/important round
        if (results.length > 0) {
          const groupedByRound = results.reduce((acc, match) => {
            if (!acc[match.round_name]) acc[match.round_name] = [];
            acc[match.round_name].push(match);
            return acc;
          }, {} as Record<string, Match[]>);

          // Get highest priority round (final, semi, etc.)
          const sortedRounds = Object.keys(groupedByRound).sort(
            (a, b) => getRoundOrder(b) - getRoundOrder(a)
          );
          
          if (sortedRounds.length > 0) {
            setExpandedRounds(new Set([sortedRounds[0]]));
          }
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

  // Group by round first, then by event - flatten structure
  const groupedByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_name]) {
      acc[match.round_name] = [];
    }
    acc[match.round_name].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Enhanced Match Card Component
  const CompactMatchCard = ({ match }: { match: Match }) => {
    const { sets } = parseSetScores(match.result);
    
    return (
      <div 
        className="border hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
        style={{ 
          background: "var(--surface)", 
          borderColor: "var(--border)",
          borderRadius: "var(--radius-sm)"
        }}
      >
        {/* Event Name Badge */}
        <div className="flex justify-between px-3 pt-2 pb-1">
          <span 
            className="text-xs font-semibold px-2 py-1 rounded inline-block"
            style={{ 
              background: "var(--glass)",
              color: "var(--muted)"
            }}
          >
            {match.event_name}
          </span>
          {match.date && (
              <span className="text-xs shrink-0 flex items-center gap-1">
                <Calendar size={10} />
                {match.date}
              </span>
          )}
        </div>

        {/* Competitors */}
        <div className="px-3 pb-3 space-y-2">
          {match.competitors.map((competitor, idx) => (
            <div 
              key={competitor.code}
              className="flex items-center justify-between gap-2 p-2 transition-all"
              style={{
                background: competitor.win_loss === 'W' 
                  ? "linear-gradient(90deg, var(--success-bg), transparent)"
                  : "var(--glass)",
                borderLeft: `3px solid ${competitor.win_loss === 'W' ? "var(--success)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)"
              }}
            >
              {/* Player Info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span 
                  className="text-xs px-1.5 py-0.5 rounded shrink-0"
                  style={{ 
                    background: "var(--glass-strong)",
                  }}
                >
                  {competitor.organization}
                </span>
                <span 
                  className="text-xs font-medium truncate"
                  style={{ 
                    color: competitor.win_loss === 'W' ? "var(--success)" : "var(--muted)"
                  }}
                >
                  {competitor.team_name?.replace(/\//g, ' / ') || 'Unknown'}
                </span>
                {competitor.seed > 0 && (
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ 
                      background: "var(--glass-strong)",
                      color: "var(--muted)"
                    }}
                  >
                    #{competitor.seed}
                  </span>
                )}
              </div>

              {/* Score */}
              <div className="flex items-center gap-1.5">
                <span 
                  className={`font-bold tabular-nums transition-all ${
                    competitor.win_loss === 'W' ? 'text-xl' : 'text-base'
                  }`}
                  style={{ 
                    color: competitor.win_loss === 'W' ? "var(--success)" : "var(--muted)"
                  }}
                >
                  {competitor.result}
                </span>
                {competitor.win_loss === 'W' && (
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--success)" }}
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Set Scores & Metadata */}
        {sets && (
          <div 
            className="px-3 pb-2 pt-0 flex justify-center items-center gap-2 text-[10px]"
            style={{ color: "var(--muted)" }}
          >
            {sets && (
              <span className="font-mono truncate">
                <span className="font-bold">Sets:</span> {sets}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="relative overflow-hidden rounded-xl h-32"
          style={{ background: "var(--surface)" }}
        >
          <div 
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent, var(--glass-strong), transparent)"
            }}
          />
        </div>
      ))}
    </div>
  );

  // Empty State Component
  const EmptyState = ({ 
    icon: Icon, 
    title, 
    description, 
    action 
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    action?: { label: string; onClick: () => void }
  }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--glass-strong)" }}
      >
        <Icon size={40} style={{ color: "var(--primary)" }} />
      </div>
      <h3 className="text-lg font-bold mb-2 text-center" style={{ color: "var(--foreground)" }}>
        {title}
      </h3>
      <p className="text-sm text-center mb-6 max-w-md" style={{ color: "var(--muted)" }}>
        {description}
      </p>
      {action && (
        <button 
          onClick={action.onClick}
          className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
          style={{
            background: "var(--primary)",
            color: "#0E1A12",
            boxShadow: "0 4px 14px rgba(76, 175, 80, 0.25)"
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );

  // Show placeholder when no competition is selected
  if (!EventId) {
    return (
      <EmptyState
        icon={Search}
        title="No Competition Selected"
        description="Select an event from the calendar to view match results and standings"
      />
    );
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-base md:text-lg font-bold" style={{ color: "var(--primary)" }}>
            {EventName}
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Loading results...</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Error Loading Results"
        description={error}
        action={{
          label: "Retry",
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Matches Found"
        description="No match results are available for this competition yet. Check back later for updates."
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-base md:text-lg font-bold mb-1" style={{ color: "var(--primary)" }}>
          {EventName}
        </h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} • {Object.keys(groupedByRound).length} {Object.keys(groupedByRound).length === 1 ? 'round' : 'rounds'}
        </p>
      </div>

      {/* Results grouped by Round (flat structure) */}
      <div className="space-y-4">
        {Object.entries(groupedByRound)
          .sort(([a], [b]) => getRoundOrder(b) - getRoundOrder(a))
          .map(([roundName, roundMatches]) => {
            const isRoundExpanded = expandedRounds.has(roundName);

            return (
              <div 
                key={roundName} 
                className="overflow-hidden shadow-lg"
                style={{ 
                  background: "var(--surface)", 
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)"
                }}
              >
                {/* Round Header */}
                <button
                  onClick={() => toggleRound(roundName)}
                  className="w-full p-3 text-left hover:opacity-90 transition-opacity"
                  style={{ background: "var(--glass)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
                        {roundName}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
                      </p>
                    </div>
                    {isRoundExpanded ? (
                      <ChevronUp size={18} style={{ color: "var(--foreground)" }} />
                    ) : (
                      <ChevronDown size={18} style={{ color: "var(--foreground)" }} />
                    )}
                  </div>
                </button>

                {/* Matches - Flat List */}
                {isRoundExpanded && (
                  <div className="p-3 grid gap-3 grid-cols-1 md:grid-cols-2">
                    {roundMatches.map((match) => (
                      <CompactMatchCard key={match.match_id} match={match} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default CompetitionResults;