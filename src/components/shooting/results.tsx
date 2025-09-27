'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface SeriesScores {
  series_1: string;
  series_2: string;
  series_3: string;
  series_4: string;
  series_5: string;
  series_6: string;
}

interface TeamMember {
  athlete_id: string;
  athlete_name: string;
  series_scores?: SeriesScores;
  total_score?: string;
}

interface AthleteResult {
  result_type: string;
  rank: number;
  bib_number?: number;
  athlete_name: string;
  athlete_id: string;
  noc_code: string;
  series_scores?: SeriesScores;
  total_score: string;
  qualification_status?: string;
  remarks?: string;
  team_name?: string;
  team_members?: TeamMember[];
  team_series_scores?: SeriesScores;
}

interface Competition {
  name: string;
  location: string;
  date: string | null;
  competition_id: string;
  event_code: string;
  source_url: string;
  extracted_timestamp: string;
}

interface ShootingResult {
  athlete_result: AthleteResult;
  event_format: string;
  event_stage: string;
  competition: Competition;
}

interface GroupedResults {
  [eventFormat: string]: {
    qualification: ShootingResult[];
    finals: ShootingResult[];
  };
}

const eventFormatColors: { [key: string]: string } = {
  '10m Air Rifle': 'bg-blue-100 text-blue-800',
  '10m Air Pistol': 'bg-green-100 text-green-800',
  '50m Rifle': 'bg-purple-100 text-purple-800',
  '25m Pistol': 'bg-orange-100 text-orange-800',
  '50m Pistol': 'bg-red-100 text-red-800',
  'Trap': 'bg-yellow-100 text-yellow-800',
  'Skeet': 'bg-indigo-100 text-indigo-800',
  'default': 'bg-gray-100 text-gray-800'
};

const ShootingResults = ({ selectedCompetition }: { selectedCompetition: string | null }) => {
  const [results, setResults] = useState<GroupedResults>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  console.log("Selected Competition in Results:", selectedCompetition);

  useEffect(() => {
    fetchResults();
  }, [selectedCompetition]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'shooting'),
       where('competition_info.competition_id', '==', selectedCompetition)
        );
      const querySnapshot = await getDocs(q);
      const fetchedResults: ShootingResult[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ShootingResult;
        fetchedResults.push(data);
      });

      // Group results by event format
      const grouped = fetchedResults.reduce<GroupedResults>((acc, result) => {
        const eventFormat = result.event_format || 'Unknown Event';
        const eventStage = result.event_stage || 'qualification';

        if (!acc[eventFormat]) {
          acc[eventFormat] = {
            qualification: [],
            finals: []
          };
        }

        if (eventStage.toLowerCase() == 'qualification') {
          acc[eventFormat].qualification.push(result);
        } else {
          acc[eventFormat].finals.push(result);
        }

        return acc;
      }, {});

      // Sort results by rank within each group
      Object.keys(grouped).forEach(eventFormat => {
        grouped[eventFormat].qualification.sort((a, b) => a.athlete_result.rank - b.athlete_result.rank);
        grouped[eventFormat].finals.sort((a, b) => a.athlete_result.rank - b.athlete_result.rank);
      });

      setResults(grouped);
      
      // Set the first event as selected by default
      const eventFormats = Object.keys(grouped);
      if (eventFormats.length > 0 && !selectedEvent) {
        setSelectedEvent(eventFormats[0]);
      }
    } catch (err) {
      setError('Failed to fetch results');
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventFormatColor = (eventFormat: string) => {
    return eventFormatColors[eventFormat] || eventFormatColors.default;
  };

  const handleEventClick = (eventFormat: string) => {
    setSelectedEvent(eventFormat);
  };

  const availableEvents = Object.keys(results);
  const selectedEventData = selectedEvent ? results[selectedEvent] : null;

  const renderTeamResult = (result: ShootingResult, index: number, isQualification: boolean = true) => (
    <div key={`${result.athlete_result.team_name}-${index}`} 
         className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
           isQualification 
             ? 'bg-white border-gray-200' 
             : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
         }`}>
      
      {/* Team Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
            !isQualification && result.athlete_result.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
            !isQualification && result.athlete_result.rank === 2 ? 'bg-gray-300 text-gray-800' :
            !isQualification && result.athlete_result.rank === 3 ? 'bg-orange-400 text-orange-900' :
            'bg-blue-100 text-blue-800'
          }`}>
            {result.athlete_result.rank}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{result.athlete_result.team_name}</h3>
            <p className="text-sm font-medium text-gray-600">{result.athlete_result.noc_code}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{result.athlete_result.total_score}</div>
          <div className={`text-xs font-medium ${isQualification ? 'text-blue-600' : 'text-orange-600'}`}>
            {isQualification ? 'TEAM SCORE' : 'FINAL SCORE'}
          </div>
        </div>
      </div>

      {/* Team Series Scores (only for qualification) */}
      {isQualification && result.athlete_result.team_series_scores && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-600 mb-2">TEAM SERIES SCORES</h4>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(result.athlete_result.team_series_scores).map(([series, score]) => (
              <div key={series} className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {series.replace('series_', 'Series ')}
                </div>
                <div className="bg-white rounded px-3 py-1 text-sm font-semibold border">
                  {score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
          TEAM MEMBERS
        </h4>
        <div className="space-y-3">
          {result.athlete_result.team_members?.map((member) => (
            <div key={member.athlete_id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium text-gray-900">{member.athlete_name}</h5>
                </div>
                {member.total_score && (
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{member.total_score}</div>
                  </div>
                )}
              </div>
              
              {/* Individual Series Scores (only for qualification) */}
              {isQualification && member.series_scores && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(member.series_scores).map(([series, score]) => (
                    <div key={series} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {series.replace('series_', 'S')}
                      </div>
                      <div className="bg-white rounded px-2 py-1 text-xs font-medium border">
                        {score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Qualification Status */}
      {result.athlete_result.remarks && (
        <div className="flex justify-end mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {result.athlete_result.remarks}
          </span>
        </div>
      )}
    </div>
  );

  const renderQualificationResult = (result: ShootingResult, index: number) => (
    <div key={`${result.athlete_result.athlete_id}-${index}`} 
         className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
            {result.athlete_result.rank}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{result.athlete_result.athlete_name}</h3>
            <p className="text-sm text-gray-600">{result.athlete_result.noc_code}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{result.athlete_result.total_score}</div>
          {result.athlete_result.bib_number && (
            <div className="text-xs text-gray-500">Bib #{result.athlete_result.bib_number}</div>
          )}
        </div>
      </div>

      {result.athlete_result.series_scores && (
        <div className="grid grid-cols-6 gap-2 mb-3">
          {Object.entries(result.athlete_result.series_scores).map(([series, score]) => (
            <div key={series} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {series.replace('series_', 'S')}
              </div>
              <div className="bg-gray-50 rounded px-2 py-1 text-sm font-medium">
                {score}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.athlete_result.remarks && (
        <div className="flex justify-end">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {result.athlete_result.remarks}
          </span>
        </div>
      )}
    </div>
  );

  const renderFinalsResult = (result: ShootingResult, index: number) => (
    <div key={`${result.athlete_result.athlete_id}-${index}`} 
         className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-sm border border-yellow-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
            result.athlete_result.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
            result.athlete_result.rank === 2 ? 'bg-gray-300 text-gray-800' :
            result.athlete_result.rank === 3 ? 'bg-orange-400 text-orange-900' :
            'bg-blue-100 text-blue-800'
          }`}>
            {result.athlete_result.rank}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{result.athlete_result.athlete_name}</h3>
            <p className="text-sm text-gray-600 font-medium">{result.athlete_result.noc_code}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{result.athlete_result.total_score}</div>
          <div className="text-xs text-orange-600 font-medium">FINAL SCORE</div>
        </div>
      </div>
    </div>
  );

  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 font-medium mb-2">Error loading results</div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={fetchResults}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (Object.keys(results).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">No shooting results found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-2 space-y-8">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-gray-900 my-4">Shooting Competition Results</h3>
        
        {/* Event Format Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {availableEvents.map((eventFormat) => (
            <button
              key={eventFormat}
              onClick={() => handleEventClick(eventFormat)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-small transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${
                selectedEvent === eventFormat
                  ? `${getEventFormatColor(eventFormat)} ring-2 ring-offset-2 ring-blue-500 shadow-lg`
                  : `${getEventFormatColor(eventFormat)} hover:shadow-md opacity-70 hover:opacity-100`
              }`}
            >
              {eventFormat}
            </button>
          ))}
        </div>
      </div>

      {selectedEventData && (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="mb-6 text-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getEventFormatColor(selectedEvent!)}`}>
              {selectedEvent}
            </span>
          </div>

          {selectedEventData.finals.length > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-semibold text-sky-900 mb-4 flex items-center justify-center">
                Finals Results
              </h3>
              <div className="grid gap-4">
                {selectedEventData.finals.map((result, index) => 
                  result.athlete_result.result_type == 'team'
                    ? renderTeamResult(result, index, false)
                    : renderFinalsResult(result, index)
                )}
              </div>
            </div>
          )}

          {selectedEventData.qualification.length > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-semibold text-sky-900 mb-4 flex items-center justify-center">
                Qualification Results
              </h3>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {selectedEventData.qualification.map((result, index) => 
                  result.athlete_result.result_type === 'team' 
                    ? renderTeamResult(result, index, true)
                    : renderQualificationResult(result, index)
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {!selectedEvent && availableEvents.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600">Select an event format above to view results</div>
        </div>
      )}
    </div>
  );
};

export default ShootingResults;