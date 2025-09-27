import { Match } from '@/types/badminton';
import MatchCard from './MatchCard';
import { useState } from 'react';

interface RoundGroupProps {
  name: string;
  matches: Match[];
}

const roundNames: { [key: string]: string } = {
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
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-blue-50 p-3 rounded-lg mb-3 hover:bg-blue-100 transition-colors"
      >
        <h2 className="text-lg font-semibold text-blue-900">
          {displayName} ({matches.length})
        </h2>
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
