import { TournamentResults as TournamentResultsType } from '@/types/badminton';
import RoundGroup from './RoundGroup';

interface TournamentResultsProps {
  results: TournamentResultsType;
  isLoading: boolean;
}

export default function TournamentResults({ results, isLoading }: TournamentResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (Object.keys(results).length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No results available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(results).map(([round, matches]) => (
        <RoundGroup key={round} name={round} matches={matches} />
      ))}
    </div>
  );
}
