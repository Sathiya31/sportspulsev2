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

const CompetitionResults = ({ selectedCompetition }: { selectedCompetition: string }) => {
  console.log("selected", selectedCompetition)
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const results: Match[] = await firebaseService.getCompetitionResults(selectedCompetition);
        setMatches(results);
      } catch (err) {
        setError('Failed to fetch competition results');
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedCompetition]);

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
    if (!result || result === '0') return '';
    return result;
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4 text-gray-600">
          <span className="text-sm font-medium">{match.date}</span>
          <span className="text-sm">{match.time}</span>
        </div>
        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
          {match.match_id.slice(-6)}
        </div>
      </div>

      <div className="space-y-3">
        {match.competitors.map((competitor: Competitor) => (
          <div
            key={competitor.code}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              competitor.win_loss === 'W'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-xs text-gray-500 font-medium">Seed</span>
                <span className="text-lg font-bold text-gray-700">{competitor.seed}</span>
                <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {competitor.organization}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-3">
                  <span className={`text-md font-semibold ${
                    competitor.win_loss === 'W' ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {competitor.team_name}
                  </span>
                  {competitor.win_loss === 'W' && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold">
                      WINNER
                    </span>
                  )}
                </div>
                {/* <span className="text-sm text-gray-600 mt-1">
                  {competitor.athlete_names.join(', ')}
                </span> */}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`text-3xl font-bold ${
                competitor.win_loss === 'W' ? 'text-green-600' : 'text-gray-400'
              }`}>
                {formatResult(competitor.result)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-3">
          <span className="text-sm text-gray-600 font-medium">Score:</span>
          <span className="font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg font-medium">
            {match.result}
          </span>
        </div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading matches...</span>
    </div>
  );

  // Show placeholder when no competition is selected
  if (!selectedCompetition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Select a Competition</h2>
            <p className="text-gray-500">Click on an event in the calendar to view match results</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Competition Results</h1>
            <p className="text-gray-600">Competition ID: {selectedCompetition}</p>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Results</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-800">Competition Results</h1>
          </div>
          <div className="flex items-center justify-center space-x-4 text-gray-600">
            <span className="bg-white px-4 py-2 rounded-full shadow-sm">
              Competition ID: <span className="font-semibold">{selectedCompetition}</span>
            </span>
            <span className="bg-white px-4 py-2 rounded-full shadow-sm">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </span>
          </div>
        </div>

        {/* Results grouped by rounds */}
        <div className="space-y-12">
          {Object.entries(groupedMatches)
            .sort(([a], [b]) => {
              // Sort rounds in tournament order
              const order = ['Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Final'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([roundName, roundMatches]: [string, Match[]]) => (
            <div key={roundName} className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-800">{roundName}</h2>
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                  {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
                </span>
              </div>
              
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {roundMatches.map((match: Match) => (
                  <MatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No matches found</h3>
            <p className="text-gray-500">No match results available for this competition</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionResults;
