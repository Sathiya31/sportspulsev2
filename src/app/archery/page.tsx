'use client';
import { useState, useEffect } from 'react';
import { collection,  query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Types
interface Event {
  id: number;
  name: string;
  level: string;
  sublevel: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface Athlete {
  Id: string;
  FName: string;
  GName: string;
  WNameOrd: boolean;
  NOC: string;
}

interface Competitor {
  MatchNo: number;
  QualRank: number;
  Arr: string;
  ArrTB: string;
  Score: number;
  SP: string;
  TB: string;
  Bye: boolean;
  Irm: string;
  WinLose: boolean;
  Athlete?: Athlete; // For individual matches
  NOC?: string; // For team matches
}

interface MatchData {
  Phase: number;
  Cat: string;
  MatchMode: number;
  TimeStamp: number;
  NumEnds: number;
  NumArrowsEnd: number;
  NumArrowsTB: number;
  IsLive: boolean;
  Competitor1: Competitor;
  Competitor2: Competitor;
  CategoryCode: string;
}

type FilterType = 'RM_IND' | 'RM_TEAM' | 'RW_IND' | 'RW_TEAM' | 'CM_IND' | 'CM_TEAM' | 'CW_IND' | 'CW_TEAM' | 'RX_TEAM' | 'CX_TEAM';

export default function ArcheryDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events from JSON file
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/data/calendars/archery_2025.json');
        const eventsData = await response.json();
        setEvents(eventsData);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events');
      }
    };

    loadEvents();
  }, []);

  // Filter chips configuration
  const filterChips = [
    { key: 'RM', label: 'Recurve Men', category: 'RM', type: 'matchind' },
    { key: 'RMT', label: 'Recurve Men Team', category: 'RM', type: 'matchteam' },
    { key: 'RW', label: 'Recurve Women', category: 'RW', type: 'matchind' },
    { key: 'RWT', label: 'Recurve Women Team', category: 'RW', type: 'matchteam' },
    { key: 'CM', label: 'Compound Men', category: 'CM', type: 'matchind' },
    { key: 'CMT', label: 'Compound Men Team', category: 'CM', type: 'matchteam' },
    { key: 'CW', label: 'Compound Women', category: 'CW', type: 'matchind' },
    { key: 'CWT', label: 'Compound Women Team', category: 'CW', type: 'matchteam' },
    { key: 'RXT', label: 'Recurve Mixed', category: 'RX', type: 'matchteam' },
    { key: 'CXT', label: 'Compound Mixed', category: 'CX', type: 'matchteam' },
  ];

  // Fetch matches from Firebase
  const fetchMatches = async (compId: string, categoryCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const matchesRef = collection(db, 'archery');
      const q = query(matchesRef, 
        where('competition_id', '==', compId), 
        where('CategoryCode', '==', categoryCode));
      const querySnapshot = await getDocs(q);

      console.log('Fetched matches:', querySnapshot.size);
      const matchList: MatchData[] = [];
      querySnapshot.forEach((doc) => {
        matchList.push(doc.data() as MatchData);
      });
      setMatches(matchList);

    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to fetch match results');
    } finally {
      setLoading(false);
    }
  };

  // Handle event selection
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setActiveFilter(null);
    setMatches([]);
  };

  // Handle filter chip click
  const handleFilterClick = (filterKey: FilterType) => {
    if (!selectedEvent) return;

    const chip = filterChips.find(c => c.key === filterKey);
    if (!chip) return;

    if (activeFilter === filterKey) {
      // Deselect current filter
      setActiveFilter(null);
      setMatches([]);
    } else {
      // Select new filter
      setActiveFilter(filterKey);
      fetchMatches(selectedEvent.id.toString(), chip.key);
    }
  };

  // Check if competitor is Indian
  const isIndianCompetitor = (competitor: Competitor, isTeamMatch: boolean) => {
    if (isTeamMatch) {
      return competitor.NOC === 'IND';
    }
    return competitor.Athlete?.NOC === 'IND';
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events Calendar - Left Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-8 py-2 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Calendar 2025
                </h2>
              </div>
              <div className="p-4 max-h-100 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Loading events...</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventSelect(event)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedEvent?.id === event.id
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 text-sm mb-2">
                          {event.name}
                        </h3>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p>{event.level} • {event.sublevel}</p>
                          <p>{event.location}</p>
                          <p>
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel - Right Side */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="bg-white rounded-lg shadow-sm border">
                {/* Event Header */}
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedEvent.name}
                  </h2>
                  <p className="text-gray-600">
                    {selectedEvent.location} • {formatDate(selectedEvent.start_date)} - {formatDate(selectedEvent.end_date)}
                  </p>
                </div>

                {/* Filter Chips */}
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    Select Category
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {filterChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={() => handleFilterClick(chip.key as FilterType)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                          activeFilter === chip.key
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results */}
                <div className="p-6">
                  {!activeFilter ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">
                        Select a category to view results
                      </p>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading results...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-red-500">{error}</p>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No Indian results found for this category</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">
                        Indian Results ({matches.length} matches)
                      </h3>
                      <div className="space-y-4">
                        {matches.map((match, index) => {
                          const isTeamMatch = activeFilter?.includes('TEAM') || false;
                          const isComp1Indian = isIndianCompetitor(match.Competitor1, isTeamMatch);
                          const isComp2Indian = isIndianCompetitor(match.Competitor2, isTeamMatch);

                          return (
                            <div
                              key={`${match.Phase}-${index}`}
                              className="border rounded-lg p-6 bg-white shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    Phase {match.Phase}
                                  </span>
                                  <span className="ml-3 text-gray-600">
                                    {match.Cat}
                                  </span>
                                </div>
                                {match.IsLive && (
                                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                    LIVE
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Competitor 1 */}
                                <div className={`p-4 rounded-lg border ${
                                  isComp1Indian ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        {isTeamMatch ? (
                                          `Team ${match.Competitor1.NOC}`
                                        ) : (
                                          `${match.Competitor1.Athlete?.GName} ${match.Competitor1.Athlete?.FName}`
                                        )}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {isTeamMatch ? match.Competitor1.NOC : match.Competitor1.Athlete?.NOC} • 
                                        Rank #{match.Competitor1.QualRank}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-2xl font-bold ${
                                        match.Competitor1.WinLose ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {match.Competitor1.Score}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {match.Competitor1.WinLose ? 'WIN' : 'LOSS'}
                                      </div>
                                    </div>
                                  </div>
                                  {match.Competitor1.SP && (
                                    <div className="text-sm text-gray-600">
                                      Set Points: {match.Competitor1.SP.replace(/\|/g, ' | ')}
                                    </div>
                                  )}
                                </div>

                                {/* Competitor 2 */}
                                <div className={`p-4 rounded-lg border ${
                                  isComp2Indian ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        {isTeamMatch ? (
                                          `Team ${match.Competitor2.NOC}`
                                        ) : (
                                          `${match.Competitor2.Athlete?.GName} ${match.Competitor2.Athlete?.FName}`
                                        )}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {isTeamMatch ? match.Competitor2.NOC : match.Competitor2.Athlete?.NOC} • 
                                        Rank #{match.Competitor2.QualRank}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-2xl font-bold ${
                                        match.Competitor2.WinLose ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {match.Competitor2.Score}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {match.Competitor2.WinLose ? 'WIN' : 'LOSS'}
                                      </div>
                                    </div>
                                  </div>
                                  {match.Competitor2.SP && (
                                    <div className="text-sm text-gray-600">
                                      Set Points: {match.Competitor2.SP.replace(/\|/g, ' | ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-12 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Select an Event
                  </h2>
                  <p className="text-gray-600">
                    Choose an event from the calendar to view archery results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}