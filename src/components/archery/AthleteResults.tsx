'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, Trophy, Target } from 'lucide-react';
import { toCapitalizedCase } from '@/utils/common';
import { getCategoryLabel, getPhaseName } from '@/utils/archeryUtils';

// Proper TypeScript interfaces
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
  Name?: string;
  Athlete?: Athlete;
  Members?: Athlete[];
  NOC?: string;
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
  athlete_ids?: string[];
  competition_id: string;
  competition_name?: string;
}

interface Player {
  name: string;
  playerId?: string;
}

interface GroupedMatches {
  [competitionId: string]: {
    name: string;
    hasMedals: boolean;
    eventChips: EventChip[];
    events: {
      [eventCode: string]: {
        eventName: string;
        isTeam: boolean;
        teamMembers?: string;
        matches: MatchData[];
      };
    };
  };
}

interface EventChip {
  eventName: string;
  phaseName: string;
  medal?: '🥇' | '🥈' | '🥉';
}

const getCompetitorName = (competitor: Competitor): string => {
  if (competitor.Name) return competitor.Name;
  if (competitor.Athlete) {
    return `${competitor.Athlete.GName} ${competitor.Athlete.FName}`;
  }
  return 'Unknown';
};

const formatSetScores = (sp: string): string[] => {
  return sp.split('|').filter(s => s.trim() !== '');
};

const getTeamMembersString = (members: Athlete[]): string => {
  return members.map(m => `${m.GName.split(' ')[0]} ${m.FName.charAt(0)}.`).join(', ');
};

// Compact Match Card Component
const CompactMatchCard = ({ 
  match, 
  playerAthleteIds 
}: { 
  match: MatchData; 
  playerAthleteIds: string[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which competitor is the player
  const isPlayer1 = match.Competitor1.Members?.some(m => playerAthleteIds.includes(m.Id)) ||
                    (match.Competitor1.Athlete && playerAthleteIds.includes(match.Competitor1.Athlete.Id));
  
  const playerComp = isPlayer1 ? match.Competitor1 : match.Competitor2;
  const opponentComp = isPlayer1 ? match.Competitor2 : match.Competitor1;
  
  const playerWon = playerComp.WinLose;
  const goldMedalMatch = match.Phase === 0;
  const bronzeMedalMatch = match.Phase === 1;

  const playerSets = formatSetScores(playerComp.SP);
  const opponentSets = formatSetScores(opponentComp.SP);

  let medalEmoji = '';
  if (goldMedalMatch && playerWon) medalEmoji = '🥇';
  if (goldMedalMatch && !playerWon) medalEmoji = '🥈';
  if (bronzeMedalMatch && playerWon) medalEmoji = '🥉';

  const opponentNOC = opponentComp.NOC || opponentComp.Athlete?.NOC || '';
  const opponentName = playerComp.Bye ? 'Bye' : getCompetitorName(opponentComp);

  return (
    <div 
      className="border-l-4 pl-3 py-2 mb-1" 
      style={{ 
        borderLeftColor: playerWon ? "var(--success)" : "var(--danger-dark)",
        borderBottomColor: "var(--border)"
      }}
    >
      {/* Compact Single Line */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity text-left"
      >
        <span 
          className="text-sm flex-1" 
          style={{ color: playerWon ? "var(--foreground)" : "var(--muted)" }}
        >
          {getPhaseName(match.Phase)} vs {opponentNOC} {opponentName}: {playerComp.Score}-{opponentComp.Score} {medalEmoji}
        </span>
        {playerSets.length > 0 && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </button>

      {/* Expanded Set Details */}
      {isExpanded && playerSets.length > 0 && (
        <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Sets: {playerSets.map((playerSet, idx) => {
            const opponentSet = opponentSets[idx];
            return (
              <span key={idx} style={{ color: "var(--muted)" }}>
                {playerSet}-{opponentSet}{idx < playerSets.length - 1 ? ', ' : ''}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Event Chip Component (for competition header)
const EventChipComponent = ({ chip }: { chip: EventChip }) => {
  const getMedalColor = () => {
    if (chip.medal === '🥇') return '#FFD700';
    if (chip.medal === '🥈') return '#C0C0C0';
    if (chip.medal === '🥉') return '#CD7F32';
    return 'var(--border)';
  };

  return (
    <span
      className="inline-block px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
      style={{
        background: "var(--glass)",
        border: `1px solid ${getMedalColor()}`,
        color: "var(--foreground)"
      }}
    >
      {chip.eventName} - {chip.medal || chip.phaseName}
    </span>
  );
};

const ArcheryPlayerResults = ({ 
  player,
  matches, 
  onBack 
}: { 
  player?: Player;
  matches: MatchData[]; 
  onBack?: () => void;
}) => {
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<string>>(new Set());

  // Extract player info
  const firstMatch = matches[0];
  const playerAthleteIds = firstMatch?.athlete_ids || [];

  // Group matches by competition and event
  const groupedMatches: GroupedMatches = matches.reduce((acc, match) => {
    const compId = match.competition_id;
    const eventCode = match.CategoryCode;
    
    if (!acc[compId]) {
      acc[compId] = {
        name: match.competition_name || `Competition #${compId}`,
        hasMedals: false,
        eventChips: [],
        events: {}
      };
    }
    
    if (!acc[compId].events[eventCode]) {
      const isTeam = !!match.Competitor1.Members;
      let teamMembers = '';
      
      if (isTeam) {
        const playerComp = match.Competitor1.Members?.some(m => playerAthleteIds.includes(m.Id))
          ? match.Competitor1
          : match.Competitor2;
        if (playerComp.Members) {
          teamMembers = getTeamMembersString(playerComp.Members);
        }
      }
      
      acc[compId].events[eventCode] = {
        eventName: getCategoryLabel(eventCode),
        isTeam,
        teamMembers,
        matches: []
      };
    }
    
    acc[compId].events[eventCode].matches.push(match);
    
    // Check if this match is a medal match
    const playerComp = match.Competitor1.Members?.some(m => playerAthleteIds.includes(m.Id)) ||
                      (match.Competitor1.Athlete && playerAthleteIds.includes(match.Competitor1.Athlete.Id))
                      ? match.Competitor1 : match.Competitor2;
    
    if ((match.Phase === 0 || (match.Phase === 1 && playerComp.WinLose))) {
      acc[compId].hasMedals = true;
    }
    
    return acc;
  }, {} as GroupedMatches);

  // Sort matches within each event by phase
  Object.values(groupedMatches).forEach(comp => {
    Object.values(comp.events).forEach(event => {
      event.matches.sort((a, b) => a.Phase - b.Phase);
    });
  });

  // Generate event chips for each competition
  Object.values(groupedMatches).forEach((comp) => {
    const chips: EventChip[] = [];
    
    Object.values(comp.events).forEach((event) => {
      const bestMatch = event.matches[0]; // Already sorted by phase
      const playerComp = bestMatch.Competitor1.Members?.some(m => playerAthleteIds.includes(m.Id)) ||
                        (bestMatch.Competitor1.Athlete && playerAthleteIds.includes(bestMatch.Competitor1.Athlete.Id))
                        ? bestMatch.Competitor1 : bestMatch.Competitor2;
      
      let medal: '🥇' | '🥈' | '🥉' | undefined;
      if (bestMatch.Phase === 0 && playerComp.WinLose) medal = '🥇';
      if (bestMatch.Phase === 0 && !playerComp.WinLose) medal = '🥈';
      if (bestMatch.Phase === 1 && playerComp.WinLose) medal = '🥉';
      
      chips.push({
        eventName: event.eventName,
        phaseName: getPhaseName(bestMatch.Phase),
        medal
      });
    });
    
    comp.eventChips = chips;
  });

  // Auto-expand competitions with medals
  useEffect(() => {
    const competitionsWithMedals = Object.entries(groupedMatches)
      .filter(([, comp]) => comp.hasMedals)
      .map(([compId]) => compId);
    
    setExpandedCompetitions(new Set(competitionsWithMedals));
  }, [groupedMatches]);

  // Calculate statistics
  const stats = {
    gold: matches.filter(m => {
      const playerComp = m.Competitor1.Members?.some(mem => playerAthleteIds.includes(mem.Id)) ||
                        (m.Competitor1.Athlete && playerAthleteIds.includes(m.Competitor1.Athlete.Id))
                        ? m.Competitor1 : m.Competitor2;
      return m.Phase === 0 && playerComp.WinLose;
    }).length,
    silver: matches.filter(m => {
      const playerComp = m.Competitor1.Members?.some(mem => playerAthleteIds.includes(mem.Id)) ||
                        (m.Competitor1.Athlete && playerAthleteIds.includes(m.Competitor1.Athlete.Id))
                        ? m.Competitor1 : m.Competitor2;
      return m.Phase === 0 && !playerComp.WinLose;
    }).length,
    bronze: matches.filter(m => {
      const playerComp = m.Competitor1.Members?.some(mem => playerAthleteIds.includes(mem.Id)) ||
                        (m.Competitor1.Athlete && playerAthleteIds.includes(m.Competitor1.Athlete.Id))
                        ? m.Competitor1 : m.Competitor2;
      return m.Phase === 1 && playerComp.WinLose;
    }).length,
    totalCompetitions: Object.keys(groupedMatches).length,
    totalMatches: matches.length
  };

  const toggleCompetition = (compId: string) => {
    setExpandedCompetitions(prev => {
      const next = new Set(prev);
      if (next.has(compId)) {
        next.delete(compId);
      } else {
        next.add(compId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen p-2" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            <ArrowLeft size={20} />
            <span>Back to Search</span>
          </button>
        )}

        {/* Player Header */}
        <div className="rounded-xl p-6 mb-6 shadow-lg" style={{ background: "var(--surface)" }}>
          <h1 className="text-xl md:text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            {toCapitalizedCase(player?.name || 'Athlete')}
          </h1>

          {/* Statistics Section */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 p-4 rounded-lg" style={{ background: "var(--glass)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#FFD700" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.gold}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Gold</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#C0C0C0" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.silver}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Silver</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#CD7F32" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.bronze}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Bronze</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target size={20} style={{ color: "var(--accent)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.totalCompetitions}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Events</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.totalMatches}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Matches</p>
            </div>
          </div>
        </div>

        {/* Competition Timeline */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--primary)" }}>2025 Season Results</h2>

          {Object.entries(groupedMatches).map(([compId, comp]) => {
            const isExpanded = expandedCompetitions.has(compId);
            
            return (
              <div 
                key={compId}
                className="rounded-xl shadow-lg overflow-hidden" 
                style={{ background: "var(--surface)" }}
              >
                {/* Competition Header - Collapsible with Event Chips */}
                <button
                  onClick={() => toggleCompetition(compId)}
                  className="w-full p-4 border-b flex flex-col gap-3 hover:opacity-80 transition-opacity text-left"
                  style={{ background: "var(--glass)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
                      {comp.name}
                    </h3>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  
                  {/* Event Result Chips */}
                  <div className="flex flex-wrap gap-2">
                    {comp.eventChips.map((chip, idx) => (
                      <EventChipComponent key={idx} chip={chip} />
                    ))}
                  </div>
                </button>

                {/* Events and Matches */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {Object.entries(comp.events).map(([eventCode, event]) => (
                      <div key={eventCode} 
                      className='p-3 rounded-lg' 
                      style={{ border: "2px solid var(--border-emphasis)" }}>
                        {/* Event Header (Bold with Accent Color) */}
                        <h4 className="font-bold text-base mb-2" style={{ color: "var(--accent)" }}>
                          {event.eventName}
                          {event.isTeam && event.teamMembers && (
                            <span className="font-normal text-sm ml-2" style={{ color: "var(--muted)" }}>
                              ({event.teamMembers})
                            </span>
                          )}
                        </h4>

                        {/* Match List */}
                        <div className="ml-2">
                          {event.matches.map((match, idx) => (
                            <CompactMatchCard
                              key={`${compId}-${eventCode}-${idx}`}
                              match={match}
                              playerAthleteIds={playerAthleteIds}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ArcheryPlayerResults;