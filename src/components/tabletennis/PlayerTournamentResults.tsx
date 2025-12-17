import React, { useState, useMemo } from "react";
import { toCapitalizedCase } from "@/utils/common";
import type { Match } from "./CompetitionResults";

interface PlayerTournamentResultsProps {
  player: any;
  results: Match[];
  sport?: string;
  calendarEvents?: any[];
}

interface TournamentGroup {
  tournamentName: string;
  date: string;
  events: Record<string, Match[]>;
}

const PlayerTournamentResults: React.FC<PlayerTournamentResultsProps> = ({ 
  player, 
  results, 
  calendarEvents = []
}) => {
  const [expandedTournaments, setExpandedTournaments] = useState<Record<string, boolean>>({});
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleTournament = (tournamentKey: string) => {
    setExpandedTournaments(prev => ({
      ...prev,
      [tournamentKey]: !prev[tournamentKey]
    }));
  };

  const toggleEvent = (eventKey: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventKey]: !prev[eventKey]
    }));
  };

  // Get tournament name from calendarEvents
  const getTournamentName = (competitionId: number | string) => {
    const event = calendarEvents.find(e => e.EventId === Number(competitionId));
    return event?.EventName || `Tournament ${competitionId}`;
  };

  // Event emoji mapping
  const getEventEmoji = (eventName: string) => {
    const name = eventName.toLowerCase();
    if (name.includes("single")) return "🏸";
    if (name.includes("double") && name.includes("mixed")) return "👫";
    if (name.includes("double")) return "👥";
    return "🎾";
  };

  // Get best round order
  const getRoundOrder = (roundName: string) => {
    const order: Record<string, number> = {
      "Final": 7,
      "Semifinals": 6,
      "Quarterfinals": 5,
      "Round of 16": 4,
      "Round of 32": 3,
      "Round of 64": 2,
      "Qualification": 1,
    };
    return order[roundName] || 0;
  };

  // Short round names for badges
  const getShortRound = (roundName: string) => {
    const shortNames: Record<string, string> = {
      "Final": "F",
      "Semifinals": "SF",
      "Quarterfinals": "QF",
      "Round of 16": "R16",
      "Round of 32": "R32",
      "Round of 64": "R64",
      "Qualification": "Q",
    };
    return shortNames[roundName] || roundName;
  };

  // Get best result for an event
  const getBestResult = (matches: Match[]) => {
    return matches.reduce((best, match) => {
      const currentOrder = getRoundOrder(match.round_name);
      const bestOrder = getRoundOrder(best.round_name);
      return currentOrder > bestOrder ? match : best;
    }, matches[0]);
  };

  // Check if player won the match
  const didPlayerWin = (match: Match) => {
    for (const competitor of match.competitors) {
      const athleteIds = competitor.athletes ? Object.keys(competitor.athletes) : [];
      if (athleteIds.includes(player.playerId)) {
        return competitor.win_loss === "W";
      }
    }
    return false;
  };

  // Get opponent name(s)
  const getOpponentName = (match: Match) => {
    for (const competitor of match.competitors) {
      const athleteIds = competitor.athletes ? Object.keys(competitor.athletes) : [];
      const isPlayer = athleteIds.includes(player.playerId);
      if (!isPlayer) {
        return competitor.team_name.replaceAll("/", " / ");
      }
    }
    return "Unknown";
  };

  // Get opponent organization
  const getOpponentOrg = (match: Match) => {
    for (const competitor of match.competitors) {
      const athleteIds = competitor.athletes ? Object.keys(competitor.athletes) : [];
      const isPlayer = athleteIds.includes(player.playerId);
      if (!isPlayer) {
        return competitor.organization;
      }
    }
    return "";
  };

  // Get match score
const getMatchScore = (match: Match) => {
  let playerScore = "";
  let opponentScore = "";
  
  for (const competitor of match.competitors) {
    const athleteIds = competitor.athletes ? Object.keys(competitor.athletes) : [];
    const isPlayer = athleteIds.includes(player.playerId);
    if (isPlayer) {
      playerScore = competitor.result;
    } else {
      opponentScore = competitor.result;
    }
  }
  return `${playerScore}-${opponentScore}`;
};

  // Group matches by tournament and event
  const groupedTournaments = useMemo(() => {
    const tournaments: Record<string, TournamentGroup> = {};

    results.forEach((match) => {
      const tournamentKey = match.competition_id?.toString() || match.date;
      const tournamentName = getTournamentName(match.competition_id) || `Tournament ${tournamentKey}`;
      const eventName = match.event_name || "Unknown Event";

      if (!tournaments[tournamentKey]) {
        tournaments[tournamentKey] = {
          tournamentName,
          date: match.date,
          events: {},
        };
      }

      if (!tournaments[tournamentKey].events[eventName]) {
        tournaments[tournamentKey].events[eventName] = [];
      }

      tournaments[tournamentKey].events[eventName].push(match);
    });

    // Sort matches within each event by round
    Object.values(tournaments).forEach((tournament) => {
      Object.keys(tournament.events).forEach((eventName) => {
        tournament.events[eventName].sort((a, b) => 
          getRoundOrder(b.round_name) - getRoundOrder(a.round_name)
        );
      });
    });

    // Convert to array and sort by date (most recent first)
    return Object.entries(tournaments)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
  }, [results, player.name, calendarEvents]);

  // Early returns after all hooks
  if (!player) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔍</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--muted)" }}>No Player Selected</h2>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>Search and select a player to view results</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📊</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--muted)" }}>No Results Found</h2>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>No match results available for this player</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-bold" style={{ color: "var(--primary)" }}>
          {toCapitalizedCase(player.name)}&apos;s Tournament Results
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {groupedTournaments.length} {groupedTournaments.length === 1 ? "tournament" : "tournaments"} • {results.length} matches
        </p>
      </div>

      <div className="space-y-3">
        {groupedTournaments.map((tournament) => {
          const isExpanded = expandedTournaments[tournament.key];
          const totalMatches = Object.values(tournament.events).reduce(
            (sum, matches) => sum + matches.length,
            0
          );

          return (
            <div key={tournament.key} className="overflow-hidden shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--primary-light)" }}>
              {/* Tournament Header */}
              <button
                className="w-full flex justify-between items-center px-4 py-3 text-left focus:outline-none hover:bg-[var(--glass)] transition-colors"
                onClick={() => toggleTournament(tournament.key)}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-bold truncate" style={{ color: "var(--primary)" }}>
                      {tournament.tournamentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    <span>
                      {new Date(tournament.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span>•</span>
                    <span>{totalMatches} {totalMatches === 1 ? "match" : "matches"}</span>
                  </div>
                  
                  {/* Event Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(tournament.events).map(([eventName, matches]) => {
                      const best = getBestResult(matches);
                      const won = didPlayerWin(best);
                      const shortEvent = eventName.replace("Men's ", "M").replace("Women's ", "W").replace("Mixed ", "X").replace(" Singles", "S").replace(" Doubles", "D");
                      
                      return (
                        <span
                          key={eventName}
                          className="text-xs px-2 py-1 rounded font-semibold flex items-center gap-1"
                          style={{
                            background: won ? "rgba(34, 197, 94, 0.15)" : "var(--glass)",
                            color: won ? "rgb(34, 197, 94)" : "var(--foreground)",
                            border: `1px solid ${won ? "rgba(34, 197, 94, 0.3)" : "var(--muted-2)"}`
                          }}
                        >
                          <span>{getEventEmoji(eventName)}</span>
                          <span>{shortEvent}: {getShortRound(best.round_name)}</span>
                          <span>{won ? "✅" : "❌"}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Expand Icon */}
                <svg
                  className={`w-5 h-5 ml-3 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--primary)" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Expanded Content - Events as Sub-Accordions */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {Object.entries(tournament.events).map(([eventName, matches]) => {
                    const eventKey = `${tournament.key}-${eventName}`;
                    const isEventExpanded = expandedEvents[eventKey];
                    const best = getBestResult(matches);
                    const won = didPlayerWin(best);

                    return (
                      <div key={eventName} className="overflow-hidden" style={{ background: "var(--glass)", border: "1px solid var(--primary-lighter)" }}>
                        {/* Event Sub-Header */}
                        <button
                          className="w-full flex items-center justify-between px-3 py-2 text-left focus:outline-none hover:bg-[var(--surface)] transition-colors"
                          onClick={() => toggleEvent(eventKey)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base">{getEventEmoji(eventName)}</span>
                            <span className="text-xs md:text-sm font-semibold truncate" style={{ color: "var(--primary)" }}>
                              {eventName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded font-semibold" 
                              style={{ 
                                background: won ? "rgba(34, 197, 94, 0.15)" : "var(--surface)",
                                color: won ? "rgb(34, 197, 94)" : "var(--muted)"
                              }}>
                              {getShortRound(best.round_name)} {won ? "✅" : "❌"}
                            </span>
                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                              ({matches.length})
                            </span>
                          </div>
                          <svg
                            className={`w-4 h-4 transition-transform flex-shrink-0 ${isEventExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "var(--primary)" }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Compact Match List */}
                        {isEventExpanded && (
                          <div className="px-3 pb-2 space-y-1">
                            {matches.map((match) => {
                              const won = didPlayerWin(match);
                              const opponentName = getOpponentName(match);
                              const opponentOrg = getOpponentOrg(match);
                              const score = opponentOrg.toLowerCase() === 'bye' ? "Bye" : getMatchScore(match);

                              return (
                                <div
                                  key={match.match_id}
                                  className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs rounded"
                                  style={{
                                    background: won ? "rgba(34, 197, 94, 0.05)" : "transparent",
                                    borderLeft: `3px solid ${won ? "rgb(34, 197, 94)" : "var(--muted-2)"}`
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--primary)" }}>
                                      {getShortRound(match.round_name)}
                                    </span>
                                    <span style={{ color: won ? "rgb(34, 197, 94)" : "var(--foreground)" }}>
                                      {won ? "✅" : "❌"}
                                    </span>
                                    <span className="truncate" style={{ color: "var(--foreground)" }}>
                                      vs {opponentName}
                                    </span>
                                    {opponentOrg && opponentOrg.toLowerCase() !== 'bye' && (
                                      <span className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--muted)", color: "var(--surface)" }}>
                                        {opponentOrg}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold tabular-nums whitespace-nowrap" style={{ color: won ? "rgb(34, 197, 94)" : "var(--muted)" }}>
                                    {score}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerTournamentResults;