import { Match } from '@/types/badminton';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  // Safely get values with fallbacks
  // const isMatchFinished = match?.matchStatus === 'F';
  const winner = match?.winner;
  const matchType = match?.matchTypeValue || 'Match';
  
  // Safely format date
  const formattedDate = (() => {
    try {
      return format(new Date(match?.matchTime || ''), 'MMM d, h:mm a');
    } catch {
      return '';
    }
  })();

  // Fallback flag URL for missing country flags
  const fallbackFlag = '/default-flag.png';

  return (
    <div className="shadow-sm overflow-hidden hover:shadow-md transition-shadow rounded-lg"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
      
      {/* Compact Header */}
      <div className="px-3 py-2 border-b flex justify-between items-center text-xs md:text-sm"
        style={{ background: "var(--glass)", borderColor: "var(--border)", color: "var(--muted)" }}>
        <span className="font-medium">{matchType}</span>
        <span>{formattedDate}</span>
      </div>

      {/* Match Content - More Compact */}
      <div className="p-2.5">
        {/* Team 1 - Horizontal Layout */}
        <div className={`flex items-center justify-between mb-2 p-1 ${
          winner === 1 ? 'font-medium' : ''
        }`} style={{ color: winner === 1 ? "var(--foreground)" : "var(--muted-2)" }}>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Smaller Flag */}
            <img
              src={match?.team1?.countryFlagUrl || fallbackFlag}
              alt={match?.team1?.countryCode || 'Country'}
              className="w-4 h-4 rounded-full object-cover flex-shrink-0"
              onError={(e: any) => { e.target.src = fallbackFlag; }}
            />
            
            {/* Players - Inline on one line */}
            <div className="text-sm md:text-base truncate">
              {match?.team1?.players?.length > 0 ? (
                <>
                  {match.team1.players.map((p: any, i: number) => (
                    <span key={p?.id || i}>
                      {i > 0 && ' / '}
                      {p?.nameDisplay || 'Unknown'}
                    </span>
                  ))}
                  {match?.team1seed && (
                    <span className="text-sm md:text-base ml-1" style={{ color: "var(--muted-2)" }}>
                      [{match.team1seed}]
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "var(--muted-2)" }}>Player unavailable</span>
              )}
            </div>
          </div>
          
          {/* Compact Scores */}
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {Array.isArray(match?.score) && match.score.map((set: any, i: number) => {
              const homeScore = set?.home;
              const awayScore = set?.away;
              if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') return null;
              
              return (
                <span 
                  key={i}
                  className="px-1.5 py-0.5 text-sm font-semibold tabular-nums"
                  style={{ 
                    color: homeScore > awayScore ? "var(--primary)" : "var(--muted-2)"
                  }}
                >
                  {homeScore}
                </span>
              );
            })}
          </div>
        </div>

        {/* Team 2 - Same compact layout */}
        <div className={`flex items-center justify-between p-1 ${
          winner === 2 ? 'font-medium' : ''
        }`} style={{ color: winner === 2 ? "var(--foreground)" : "var(--muted)" }}>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img
              src={match?.team2?.countryFlagUrl || fallbackFlag}
              alt={match?.team2?.countryCode || 'Country'}
              className="w-4 h-4 rounded-full object-cover flex-shrink-0"
              onError={(e: any) => { e.target.src = fallbackFlag; }}
            />
            
            <div className="text-xs md:text-sm truncate">
              {match?.team2?.players?.length > 0 ? (
                <>
                  {match.team2.players.map((p: any, i: number) => (
                    <span key={p?.id || i}>
                      {i > 0 && ' / '}
                      {p?.nameDisplay || 'Unknown'}
                    </span>
                  ))}
                  {match?.team2seed && (
                    <span className="text-xs ml-1" style={{ color: "var(--muted-2)" }}>
                      [{match.team2seed}]
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "var(--muted-2)" }}>Player unavailable</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {Array.isArray(match?.score) && match.score.map((set: any, i: number) => {
              const homeScore = set?.home;
              const awayScore = set?.away;
              if (typeof homeScore === 'undefined' || typeof awayScore === 'undefined') return null;
              
              return (
                <span 
                  key={i}
                  className="px-1.5 py-0.5 text-sm font-semibold tabular-nums"
                  style={{ 
                    color: awayScore > homeScore ? "var(--primary)" : "var(--muted-2)"
                  }}
                >
                  {awayScore}
                </span>
              );
            })}
          </div>
        </div>

        {/* Compact Footer */}
        {/* {isMatchFinished && typeof match?.duration === 'number' && (
          <div className="mt-1.5 pt-1.5 border-t text-xs" 
            style={{ borderColor: "var(--primary-lighter)", color: "var(--muted)" }}>
            Duration: {match.duration} min
          </div>
        )} */}
      </div>
    </div>
  );
}