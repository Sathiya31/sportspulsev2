import { Match } from '@/types/badminton';
import Image from 'next/image';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  // Safely get values with fallbacks
  const isMatchFinished = match?.matchStatus === 'F';
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
  const fallbackFlag = '/default-flag.png'; // Add a default flag image to your public folder

  // Safe image component that won't throw errors
  const SafeImage = ({ src, alt, ...props }: { src?: string; alt: string; [key: string]: any }) => {
    return (
      <div className="relative w-6 h-6">
        <Image
          src={src || fallbackFlag}
          alt={alt}
          width={24}
          height={24}
          className="rounded-full"
          onError={(e: any) => {
            e.target.src = fallbackFlag;
          }}
          {...props}
        />
      </div>
    );
  };

  // Safe player rendering
  const renderPlayers = (team: any, seed?: string) => {
    if (!team?.players?.length) {
      return <span className="text-sm text-gray-500">Player information unavailable</span>;
    }

    return team.players.map((player: any) => (
      <span key={player?.id || Math.random()} className="text-sm">
        {player?.nameDisplay || 'Unknown Player'}
        {seed && <span className="text-xs text-blue-500 ml-2">[{seed}]</span>}
      </span>
    ));
  };

  // Safe score rendering
  const renderScore = (score: any[], isHome: boolean) => {
    if (!Array.isArray(score)) return null;

    return score.map((set, index) => {
      const value = isHome ? set?.home : set?.away;
      const otherValue = isHome ? set?.away : set?.home;
      
      if (typeof value === 'undefined' || typeof otherValue === 'undefined') return null;

      return (
        <span 
          key={index}
          className={`px-2 py-1 rounded ${
            value > otherValue ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {value}
        </span>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Match Header */}
      <div className="bg-blue-50 px-4 py-2 border-b flex justify-between items-center">
        <div className="text-sm text-blue-800 font-medium">
          {matchType}
        </div>
        <div className="text-sm text-gray-600">
          {formattedDate}
        </div>
      </div>

      {/* Match Content */}
      <div className="p-4">
        {/* Team 1 */}
        <div className={`flex items-center justify-between mb-4 ${winner === 1 ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
          <div className="flex items-center space-x-3">
            <SafeImage
              src={match?.team1?.countryFlagUrl}
              alt={match?.team1?.countryCode || 'Country'}
            />
            <div className="flex flex-col">
              {renderPlayers(match?.team1, match?.team1seed)}
            </div>
          </div>
          <div className="flex space-x-2">
            {renderScore(match?.score || [], true)}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between ${winner === 2 ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
          <div className="flex items-center space-x-3">
            <SafeImage
              src={match?.team2?.countryFlagUrl}
              alt={match?.team2?.countryCode || 'Country'}
            />
            <div className="flex flex-col">
              {renderPlayers(match?.team2, match?.team2seed)}
            </div>
          </div>
          <div className="flex space-x-2">
            {renderScore(match?.score || [], false)}
          </div>
        </div>

        {/* Match Footer */}
        {isMatchFinished && typeof match?.duration === 'number' && (
          <div className="mt-3 pt-2 border-t text-xs text-gray-500">
            Duration: {match.duration} minutes
          </div>
        )}
      </div>
    </div>
  );
}
