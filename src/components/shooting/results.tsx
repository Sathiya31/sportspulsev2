'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Button from '@/components/ui/Button';
import { ShootingEvent } from '@/shootingCalendar';

export interface SeriesScores {
  series_1: string;
  series_2: string;
  series_3: string;
  series_4: string;
  series_5: string;
  series_6: string;
}

export interface TeamMember {
  athlete_id: string;
  athlete_name: string;
  series_scores?: SeriesScores;
  total_score?: string;
}

export interface AthleteResult {
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

export interface Competition {
  name: string;
  location: string;
  date: string | null;
  competition_id: string;
  event_code: string;
  source_url: string;
  extracted_timestamp: string;
}

export interface ShootingResult {
  athlete_result: AthleteResult;
  event_format: string;
  event_stage: string;
  competition_info: Competition;
}

interface GroupedResults {
  [eventFormat: string]: {
    qualification: ShootingResult[];
    finals: ShootingResult[];
  };
}

// Mobile Event Format Dropdown Component
const MobileEventDropdown = ({ 
  availableEvents,
  selectedEvent,
  onEventSelect
}: {
  availableEvents: string[];
  selectedEvent: string | null;
  onEventSelect: (event: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = selectedEvent || 'Select Event Format';

  return (
    <div className="relative lg:hidden" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: selectedEvent ? "var(--primary)" : "var(--foreground)"
        }}
      >
        <span className="font-medium">{selectedLabel}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-30 max-h-80 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {availableEvents.map((eventFormat: string) => (
            <button
              key={eventFormat}
              onClick={() => {
                onEventSelect(eventFormat);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity border-b last:border-b-0"
              style={{
                background: selectedEvent === eventFormat ? "var(--primary)" : "transparent",
                color: selectedEvent === eventFormat ? "white" : "var(--foreground)",
                borderColor: "var(--border)"
              }}
            >
              {eventFormat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ShootingResults = ({ selectedCompetition }: { selectedCompetition: ShootingEvent | null }) => {
  const [results, setResults] = useState<GroupedResults>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    if(selectedCompetition?.competition_code) {
      fetchResults();
    }
  }, [selectedCompetition?.competition_code]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'shooting'),
       where('competition_info.competition_id', '==', selectedCompetition?.competition_code)
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

        if ((eventStage || '').toLowerCase().includes('qualification')) {
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

      console.log("Fetched results:", grouped);

      setResults(grouped);
      
      // Set the first event as selected by default
      const eventFormats = Object.keys(grouped);
      if (eventFormats.length > 0) {
        setSelectedEvent(eventFormats[0]);
      }
    } catch (err) {
      setError('Failed to fetch results');
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalStyle = (rank: number) => {
    if (rank === 1) return { background: "#FFD700", color: "#854D0E" }; // Gold
    if (rank === 2) return { background: "#C0C0C0", color: "#1F2937" }; // Silver
    if (rank === 3) return { background: "#CD7F32", color: "#1C1917" }; // Bronze
    return { background: "var(--muted)", color: "var(--surface)" };
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleEventClick = (eventFormat: string) => {
    setSelectedEvent(eventFormat);
  };

  const availableEvents = Object.keys(results);
  const selectedEventData = selectedEvent ? results[selectedEvent] : null;

  const renderTeamResult = (result: ShootingResult, index: number, isQualification: boolean = true) => {
    const teamId = `${result.athlete_result.team_name}-${index}`;
    const isExpanded = expandedTeams.has(teamId);
    
    return (
      <div key={teamId} 
           className="rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow"
           style={{ 
             background: "var(--surface)",
             borderColor: isQualification ? "var(--primary-light)" : "rgba(34, 197, 94, 0.3)"
           }}>
        
        {/* Team Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs"
              style={getMedalStyle(result.athlete_result.rank)}>
              {result.athlete_result.rank}
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base" style={{ color: "var(--foreground)" }}>
                {result.athlete_result.team_name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base md:text-lg font-bold" style={{ color: "var(--foreground)" }}>
              {result.athlete_result.total_score}
            </div>
            <div className="text-xs font-medium" 
              style={{ color: isQualification ? "var(--primary)" : "rgb(34, 197, 94)" }}>
              {isQualification ? 'TEAM' : 'FINAL'}
            </div>
          </div>
        </div>

        {/* Team Series Scores (only for qualification) */}
        {isQualification && result.athlete_result.team_series_scores && (
          <div className="mb-3 rounded-lg p-2" style={{ background: "var(--glass)" }}>
            <h4 className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>
              TEAM SERIES
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(result.athlete_result.team_series_scores)
                .sort(([a], [b]) => {
                  const numA = parseInt(a.replace('series_', ''));
                  const numB = parseInt(b.replace('series_', ''));
                  return numA - numB;
                })
                .map(([series, score]) => (
                  <div key={series} className="text-center">
                    <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                      {series.replace('series_', 'S')}
                    </div>
                    <div className="rounded px-2 py-1 text-xs font-semibold border"
                      style={{ background: "var(--surface)", borderColor: "var(--muted-2)" }}>
                      {score}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Collapsible Team Members */}
        <div>
          <button
            onClick={() => toggleTeam(teamId)}
            className="w-full flex items-center justify-between py-2 border-t hover:opacity-80 transition-opacity"
            style={{ borderColor: "var(--muted-2)" }}
          >
            <h4 className="text-xs font-semibold flex items-center gap-2" style={{ color: "var(--muted)" }}>
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              TEAM MEMBERS
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full" 
              style={{ background: "var(--glass)", color: "var(--muted)" }}>
              {result.athlete_result.team_members?.length || 0}
            </span>
          </button>
          
          {isExpanded && (
            <div className="space-y-2 mt-2">
              {result.athlete_result.team_members?.map((member) => (
                <div key={member.athlete_id} className="rounded-lg p-2" 
                  style={{ background: "var(--glass)" }}>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-xs md:text-sm" style={{ color: "var(--foreground)" }}>
                      {member.athlete_name}
                    </h5>
                    {member.total_score && (
                      <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {member.total_score}
                      </div>
                    )}
                  </div>
                  
                  {/* Individual Series Scores (only for qualification) */}
                  {isQualification && member.series_scores && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 mt-2">
                      {Object.entries(member.series_scores)
                        .sort(([a], [b]) => {
                          const numA = parseInt(a.replace('series_', ''));
                          const numB = parseInt(b.replace('series_', ''));
                          return numA - numB;
                        }).map(([series, score]) => (
                          <div key={series} className="text-center">
                            <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>
                              {series.replace('series_', 'S')}
                            </div>
                            <div className="rounded px-1.5 py-0.5 text-xs font-medium border"
                              style={{ background: "var(--surface)", borderColor: "var(--muted-2)" }}>
                              {score}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Qualification Status */}
        {result.athlete_result.remarks && (
          <div className="flex justify-end mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(34, 197, 94, 0.1)", color: "rgb(34, 197, 94)" }}>
              {result.athlete_result.remarks}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderQualificationResult = (result: ShootingResult, index: number) => (
    <div key={`${result.athlete_result.athlete_id}-${index}`} 
         className="rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow"
         style={{ background: "var(--surface)", borderColor: "var(--primary-light)" }}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs"
            style={{ background: "var(--muted)", color: "var(--surface)" }}>
            {result.athlete_result.rank}
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {result.athlete_result.athlete_name}
            </h3>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {result.athlete_result.noc_code}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            {result.athlete_result.total_score}
          </div>
          {result.athlete_result.bib_number && (
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              #{result.athlete_result.bib_number}
            </div>
          )}
        </div>
      </div>

      {result.athlete_result.series_scores && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 mb-2">
          {Object.entries(result.athlete_result.series_scores)
            .sort(([a], [b]) => {
              const numA = parseInt(a.replace('series_', ''));
              const numB = parseInt(b.replace('series_', ''));
              return numA - numB;
            }).map(([series, score]) => (
              <div key={series} className="text-center">
                <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>
                  {series.replace('series_', 'S')}
                </div>
                <div className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ background: "var(--glass)" }}>
                  {score}
                </div>
              </div>
            ))}
        </div>
      )}

      {result.athlete_result.remarks && (
        <div className="flex justify-end">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(34, 197, 94, 0.1)", color: "rgb(34, 197, 94)" }}>
            {result.athlete_result.remarks}
          </span>
        </div>
      )}
    </div>
  );

  const renderFinalsResult = (result: ShootingResult, index: number) => (
    <div key={`${result.athlete_result.athlete_id}-${index}`} 
         className="rounded-lg shadow-sm border p-3 hover:shadow-md transition-shadow"
         style={{ background: "rgba(34, 197, 94, 0.05)", borderColor: "rgba(34, 197, 94, 0.3)" }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm"
            style={getMedalStyle(result.athlete_result.rank)}>
            {result.athlete_result.rank}
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base" style={{ color: "var(--foreground)" }}>
              {result.athlete_result.athlete_name}
            </h3>
            <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              {result.athlete_result.noc_code}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            {result.athlete_result.total_score}
          </div>
          <div className="text-xs font-medium" style={{ color: "rgb(34, 197, 94)" }}>
            FINAL
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
          style={{ borderColor: "var(--primary)" }}></div>
        <span className="ml-3 text-sm" style={{ color: "var(--muted)" }}>Loading results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3">⚠️</div>
        <div className="font-medium mb-2" style={{ color: "var(--danger)" }}>Error loading results</div>
        <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{error}</p>
        <Button variant="primary" onClick={fetchResults}>
          Retry
        </Button>
      </div>
    );
  }

  if (Object.keys(results).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--muted)" }}>
          No Results Found
        </h3>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>
          No Indian shooters participated in this competition
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Event Selection */}
      <div className="border-b pb-3" style={{ borderColor: "var(--muted-2)" }}>
        <h3 className="text-base md:text-lg font-bold mb-3" style={{ color: "var(--primary)" }}>
          {selectedCompetition?.event_name} Results
        </h3>
        
        {/* Mobile Dropdown */}
        <MobileEventDropdown
          availableEvents={availableEvents}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventClick}
        />

        {/* Desktop Chips */}
        <div className="hidden lg:flex flex-wrap gap-2">
          {availableEvents.map((eventFormat) => (
            <Button
              key={eventFormat}
              variant={selectedEvent === eventFormat ? "primary" : "secondary"}
              className="text-xs font-medium px-3 py-2"
              size="sm"
              onClick={() => handleEventClick(eventFormat)}
            >
              {eventFormat}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {selectedEventData && (
        <div className="space-y-4">
          {selectedEventData.finals.length > 0 && (
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3" style={{ color: "var(--primary)" }}>
                Finals Results
              </h3>
              <div className="grid gap-3">
                {selectedEventData.finals.map((result, index) => 
                  result.athlete_result.result_type == 'team'
                    ? renderTeamResult(result, index, false)
                    : renderFinalsResult(result, index)
                )}
              </div>
            </div>
          )}

          {selectedEventData.qualification.length > 0 && (
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3" style={{ color: "var(--primary)" }}>
                Qualification Results
              </h3>
              <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
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
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Select an event format above to view results
          </p>
        </div>
      )}
    </div>
  );
};

export default ShootingResults;