'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, Trophy, Target, TrendingUp } from 'lucide-react';
import { Match } from './CompetitionResults'
import { toCapitalizedCase } from '@/utils/common';

// // Types
// interface Competitor {
//   team_name: string;
//   organization: string;
//   win_loss: string;
//   code: string;
//   athlete_names: string[];
//   result: string;
//   seed?: number;
// }

// interface Match {
//   match_id: string;
//   event_name: string;
//   competition_id: number;
//   athlete_ids: string[];
//   time?: string;
//   competitors: Competitor[];
//   date: string;
//   result: string;
//   round_code: string;
//   round_name: string;
// }

interface TournamentGroup {
  tournamentName: string;
  date: string;
  events: {
    [eventName: string]: Match[];
  };
}

interface GroupedTournaments {
  [competitionId: string]: TournamentGroup;
}

// Helper functions
const getRoundOrder = (roundName: string): number => {
  const order: { [key: string]: number } = {
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

const getShortRound = (roundName: string): string => {
  const shortNames: { [key: string]: string } = {
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

const getEventIcon = (eventName: string): string => {
  const name = eventName.toLowerCase();
  if (name.includes("mixed")) return "👫";
  if (name.includes("double")) return "👥";
  return "👤";
};

const getMedalEmoji = (roundName: string, won: boolean): string | null => {
  if (roundName === "Final" && won) return "🥇";
  if (roundName === "Final" && !won) return "🥈";
  if (roundName === "Semifinals" && !won) return "🥉";
  return null;
};

const getSummaryStyles = (best_round_name: string, won: boolean) => {
  const isFinal = best_round_name === "Final";
  if (isFinal && won) {
    return {
      background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      color: "#854D0E",
      fontWeight: "bold",
      border: "1px solid #FFD700"
    };
  }
  // add background and colors for silver and bronze
  else if (isFinal && !won) {
    return {
      background: "linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)",
      color: "#3C3C3C",
      fontWeight: "bold",
      border: "1px solid #C0C0C0"
    };
  } else if (best_round_name === "Semifinals" && !won) {
    return {
      background: "linear-gradient(135deg, #CD7F32 0%, #B87333 100%)",
      color: "#4E2A0C",
      fontWeight: "bold",
      border: "1px solid #CD7F32"
    };
  } else {
    return {
      background: "var(--glass)",
      color: "var(--foreground)",
      border: "1px solid var(--border)"
    };
  }
};


const TableTennisPlayerResults = ({
  player,
  matches,
  calendarEvents,
  onBack
}: {
  player: { name: string; playerId: string };
  matches: Match[];
  calendarEvents: any[];
  onBack?: () => void;
}) => {
  const [expandedTournaments, setExpandedTournaments] = useState<Set<string>>(new Set());

  const toggleTournament = (tournamentKey: string) => {
    setExpandedTournaments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tournamentKey)) {
        newSet.delete(tournamentKey);
      } else {
        newSet.add(tournamentKey);
      }
      return newSet;
    });
  };

  // Helper: Check if player won
  const didPlayerWin = (match: Match): boolean => {
    for (const comp of match.competitors) {
      const athleteIds = comp.athletes?.map(a => String(a.id)) || [];
      if (athleteIds.includes(player.playerId)) {
        return comp.win_loss === "W";
      }
    }
    return false;
  };

  // Helper: Get opponent info
  const getOpponentInfo = (match: Match) => {
    for (const comp of match.competitors) {
      const athleteIds = comp.athletes?.map(a => String(a.id)) || [];
      const isPlayer = athleteIds.includes(player.playerId);
      if (!isPlayer) {
        // Shorten doubles partner names
        const names = comp.team_name.split('/').map(n => {
          const parts = n.trim().split(' ');
          if (parts.length > 1) {
            return `${parts[0]} ${parts[1].charAt(0)}.`;
          }
          return n;
        }).join('/');
        return { name: names, org: comp.organization };
      }
    }
    return { name: "Unknown", org: "" };
  };

  // Helper: Get score
  const getScore = (match: Match): string => {
    let playerScore = "";
    let opponentScore = "";
    for (const comp of match.competitors) {
      const athleteIds = comp.athletes?.map(a => String(a.id)) || [];
      const isPlayer = athleteIds.includes(player.playerId);
      if (isPlayer) {
        playerScore = comp.result;
      } else {
        opponentScore = comp.result;
      }
    }
    return `${playerScore}-${opponentScore}`;
  };

  // Get tournament name
  const getTournamentName = (compId: number): string => {
    const event = calendarEvents.find(e => e.EventId === compId);
    return event?.EventName || `Tournament ${compId}`;
  };

  // Group matches by tournament and event
  const groupedTournaments = useMemo(() => {
    const tournaments: GroupedTournaments = {};

    matches.forEach(match => {
      const compId = match.competition_id.toString();
      if (!tournaments[compId]) {
        tournaments[compId] = {
          tournamentName: getTournamentName(match.competition_id),
          date: match.date,
          events: {}
        };
      }

      const eventName = match.event_name;
      if (!tournaments[compId].events[eventName]) {
        tournaments[compId].events[eventName] = [];
      }
      tournaments[compId].events[eventName].push(match);
    });

    // Sort matches within each event by round (best first)
    Object.values(tournaments).forEach(tournament => {
      Object.keys(tournament.events).forEach(eventName => {
        tournament.events[eventName].sort((a, b) =>
          getRoundOrder(b.round_name) - getRoundOrder(a.round_name)
        );
      });
    });

    // Convert to array and sort by date (recent first)
    return Object.entries(tournaments)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matches, player.name]);

  // Calculate statistics
  const stats = useMemo(() => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    let wins = 0;

    matches.forEach(match => {
      const won = didPlayerWin(match);
      if (won) wins++;

      if (match.round_name === "Final") {
        if (won) gold++;
        else silver++;
      } else if (match.round_name === "Semifinals" && !won) {
        bronze++;
      }
    });

    return {
      gold,
      silver,
      bronze,
      totalTournaments: groupedTournaments.length,
      wins
    };
  }, [matches, groupedTournaments]);

  // Get best result for event
  const getBestResult = (matches: Match[]) => {
    return matches.reduce((best, match) =>
      getRoundOrder(match.round_name) > getRoundOrder(best.round_name) ? match : best
      , matches[0]);
  };

  // Auto-expand tournaments with medals
  useMemo(() => {
    const tournamentsWithMedals = new Set<string>();
    groupedTournaments.forEach(tournament => {
      Object.values(tournament.events).forEach(eventMatches => {
        eventMatches.forEach(match => {
          if (match.round_name === "Final" && didPlayerWin(match)) {
            tournamentsWithMedals.add(tournament.key);
          }
        });
      });
    });
    setExpandedTournaments(tournamentsWithMedals);
  }, [groupedTournaments]);

  if (!player || !matches || matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">🏓</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--muted)" }}>
          No Results Found
        </h2>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>
          No match results available for this player
        </p>
      </div>
    );
  }

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
          <div className="flex items-center gap-4 mb-4">
            {/* <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "var(--primary)", color: "white" }}>
              {player.name.charAt(0)}
            </div> */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                {toCapitalizedCase(player.name)}
              </h1>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg" style={{ background: "var(--glass)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#FFD700" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.gold}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Gold</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#C0C0C0" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.silver}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Silver</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#CD7F32" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.bronze}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Bronze</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target size={20} style={{ color: "var(--primary)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.totalTournaments}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Events</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={20} style={{ color: "var(--success)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.wins}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Wins</p>
            </div>
          </div>
        </div>

        {/* Tournament Timeline */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--primary)" }}>
            2025 Season Results
          </h2>

          {groupedTournaments.map(tournament => {
            const isExpanded = expandedTournaments.has(tournament.key);
            const hasMedal = Object.values(tournament.events).some(eventMatches =>
              eventMatches.some(m => m.round_name === "Final" && didPlayerWin(m))
            );

            return (
              <div key={tournament.key} className="rounded-xl shadow-lg overflow-hidden"
                style={{ background: "var(--surface)" }}>

                {/* Tournament Header */}
                <button
                  onClick={() => toggleTournament(tournament.key)}
                  className="w-full p-4 text-left hover:opacity-90 transition-opacity"
                  style={{ background: hasMedal ? "var(--glass)" : "transparent" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                      {tournament.tournamentName}
                    </h3>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                    {new Date(tournament.date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>

                  {/* Event Summary Badges */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tournament.events).map(([eventName, eventMatches]) => {
                      const best = getBestResult(eventMatches);
                      const won = didPlayerWin(best);
                      const medal = getMedalEmoji(best.round_name, won);

                      return (
                        <span key={eventName} className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                          style={getSummaryStyles(best.round_name, won)}>
                          <span>{getEventIcon(eventName)}</span>
                          <span>{eventName}</span>
                          {medal && <span>{medal}</span>}
                          {!medal && <span>{getShortRound(best.round_name)} {won ? "✓" : "✗"}</span>}
                        </span>
                      );
                    })}
                  </div>
                </button>

                {/* Expanded Event Details */}
                {isExpanded && (
                  <div className="p-4 pt-2 space-y-2">
                    {Object.entries(tournament.events).map(([eventName, eventMatches]) => {
                      const best = getBestResult(eventMatches);
                      const isFinalWon = best.round_name === "Final" && didPlayerWin(best);

                      return (
                        <div key={eventName} className="rounded-lg p-3"
                          style={{
                            background: isFinalWon ? "rgba(255, 215, 0, 0.1)" : "var(--glass)",
                            border: `1px solid ${isFinalWon ? "#FFD700" : "var(--border)"}`
                          }}>

                          {/* Event Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">{getEventIcon(eventName)}</span>
                            <h4 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                              {eventName}
                            </h4>
                            {isFinalWon && <span className="text-lg">🥇</span>}
                          </div>

                          {/* Compact Match List */}
                          <div className="space-y-1">
                            {eventMatches.map(match => {
                              const won = didPlayerWin(match);
                              const opponent = getOpponentInfo(match);
                              const score = opponent.org.toLowerCase() === 'bye' ? "Bye" : getScore(match);
                              const isBye = opponent.org.toLowerCase() === 'bye';

                              return (
                                <div key={match.match_id}
                                  className="flex items-center justify-between gap-2 text-xs py-1"
                                  style={{
                                    borderLeft: `3px solid ${won ? "var(--success)" : "var(--muted-2)"}`,
                                    paddingLeft: "8px"
                                  }}>
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-bold px-2 py-0.5 rounded"
                                      style={{ background: "var(--surface)", color: "var(--primary)" }}>
                                      {getShortRound(match.round_name)}
                                    </span>
                                    <span style={{ color: won ? "var(--success)" : "var(--danger)" }}>
                                      {won ? "✓" : "✗"}
                                    </span>
                                    <span className="truncate" style={{ color: "var(--foreground)" }}>
                                      vs {opponent.name}
                                    </span>
                                    {opponent.org && !isBye && (
                                      <span className="px-1.5 py-0.5 rounded text-xs"
                                        style={{ background: "var(--muted)", color: "var(--surface)" }}>
                                        {opponent.org}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold tabular-nums whitespace-nowrap"
                                    style={{ color: won ? "var(--success)" : "var(--muted)" }}>
                                    {score}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
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
    </div>
  );
};

export default TableTennisPlayerResults;