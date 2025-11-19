import { Match } from '@/types/badminton';
import MatchCard from './MatchCard';
import { useState } from 'react';

interface RoundGroupProps {
  name: string;
  matches: Match[];
}

export const roundNames: { [key: string]: string } = {
  'F': 'Finals',
  'Final' : 'Finals',
  'SF': 'Semi Finals',
  'QF': 'Quarter Finals',
  'R16': 'Round of 16',
  'R32': 'Round of 32',
  'R64': 'Round of 64'
};

export default function RoundGroup({ name, matches }: RoundGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const displayName = roundNames[name] || name;
  console.log(matches);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 mb-2 
        border-b hover:opacity-80 transition-opacity"
        style={{ background: "var(--glass)", borderColor: "var(--primary)" }}
      >
        <h3 className="text-sm md:text-base font-semibold flex items-center gap-2" 
          style={{ color: "var(--primary)" }}>
          <svg
            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {displayName}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full" 
          style={{ background: "var(--surface)", color: "var(--muted)" }}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}