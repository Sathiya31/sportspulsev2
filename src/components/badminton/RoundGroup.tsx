import { Match } from '@/types/badminton';
import MatchCard from './MatchCard';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

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
    <div className="p-3" 
    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between pb-2 mb-2
        border-b hover:opacity-80 transition-opacity"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h3 className="text-base font-medium flex items-center gap-2" 
          style={{ color: "var(--foreground)" }}>
          <ChevronRight className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          {displayName}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full" 
          style={{ color: "var(--muted)" }}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}