'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, Trophy, Target, TrendingUp } from 'lucide-react';
import { Match } from '@/types/badminton';
import { AthleteData } from '@/services/athleteService';
import { toCapitalizedCase } from '@/utils/common';

// Helper functions
const getRoundOrder = (roundName: string): number => {
  const order: { [key: string]: number } = {
    "Final": 7,
    "SF": 6,
    "QF": 5,
    "R16": 4,
    "R32": 3,
    "R64": 2,
    "R128": 1,
  };
  return order[roundName] || 0;
};

const getRoundName = (roundName: string): string => {
  const shortNames: { [key: string]: string } = {
    "Final": "F",
    "SF": "Semi Final",
    "QF": "Quarter Final",
    "R16": "Round of 16",
    "R32": "Round of 32",
    "R64": "Round of 64",
  };
  return shortNames[roundName] || roundName;
};

const getEventIcon = (eventName: string): string => {
  if (eventName.includes("XD") || eventName.toLowerCase().includes("mixed")) return "👫";
  if (eventName.includes("D") || eventName.toLowerCase().includes("double")) return "👥";
  return "👤";
};

const getMedalEmoji = (roundName: string, won: boolean): string | null => {
  if (roundName === "Final" && won) return "🥇";
  if (roundName === "Final" && !won) return "🥈";
  return null;
};

const getEventName = (drawName: string): string => {
  const eventMap: { [key: string]: string } = {
    "WS": "Women's Singles",
    "WD": "Women's Doubles",
    "XD": "Mixed Doubles",
    "MS": "Men's Singles",
    "MD": "Men's Doubles",
  };
  return eventMap[drawName] || drawName;
};

const BadmintonPlayerResults = ({
  player,
  matches,
  onBack
}: {
  player: AthleteData;
  matches: Match[];
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
    const isTeam1 = match.team1.players.some(p => p.id === player.playerId);
    return (isTeam1 && match.winner === 1) || (!isTeam1 && match.winner === 2);
  };

  // Helper: Get opponent info
  const getOpponentInfo = (match: Match) => {
    const isTeam1 = match.team1.players.some(p => p.id === player.playerId);
    const opponentTeam = isTeam1 ? match.team2 : match.team1;
    const opponentSeed = isTeam1 ? match.team2seed : match.team1seed;
    
    // For doubles, show first player's name + partner indicator
    if (opponentTeam.players.length > 1) {
      const names = opponentTeam.players.map(p => p.nameDisplay).join('/');
      return {
        name: names,
        country: opponentTeam.countryCode,
        seed: opponentSeed
      };
    }
    
    return {
      name: opponentTeam.players[0]?.nameDisplay || "Unknown",
      country: opponentTeam.countryCode,
      seed: opponentSeed
    };
  };

  // Helper: Get score string
  const getScoreString = (match: Match): string => {
    const isTeam1 = match.team1.players.some(p => p.id === player.playerId);
    return match.score.map(set => {
      const playerScore = isTeam1 ? set.home : set.away;
      const opponentScore = isTeam1 ? set.away : set.home;
      return `${playerScore}-${opponentScore}`;
    }).join(', ');
  };

  // Helper: Get player's seed in tournament
  const getPlayerSeed = (match: Match): string | undefined => {
    const isTeam1 = match.team1.players.some(p => p.id === player.playerId);
    return isTeam1 ? match.team1seed : match.team2seed;
  };

  // Group matches by tournament and event
    const groupedTournaments = useMemo<{ code: string; name: string; date: string; events: Record<string, Match[]> }[]>(() => {
      const tournaments: { [key: string]: { [event: string]: Match[] } } = {};
  
      matches.forEach(match => {
        const tournamentKey = match.tournamentCode;
        const eventName = getEventName(match.eventName);
  
        if (!tournaments[tournamentKey]) {
          tournaments[tournamentKey] = {};
        }
        if (!tournaments[tournamentKey][eventName]) {
          tournaments[tournamentKey][eventName] = [];
        }
        tournaments[tournamentKey][eventName].push(match);
      });
  
      // Sort matches within each event chronologically (by round, best first)
      Object.values(tournaments).forEach(tournament => {
        Object.keys(tournament).forEach(eventName => {
          tournament[eventName].sort((a, b) => getRoundOrder(b.roundName) - getRoundOrder(a.roundName));
        });
      });
  
      // Get tournament info and sort by date
      const tournamentList = Object.entries(tournaments).map(([code, events]) => {
        const firstMatch = Object.values(events)[0][0];
        return {
          code,
          name: firstMatch.tournamentName,
          date: firstMatch.matchTime,
          events
        };
      });
  
      return tournamentList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }, [matches]);

  // Calculate statistics
  const stats = useMemo(() => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    let wins = 0;

    matches.forEach(match => {
      const won = didPlayerWin(match);
      if (won) wins++;

      if (match.roundName === "Final") {
        if (won) gold++;
        else silver++;
      } else if (match.roundName === "SF" && !won) {
        bronze++;
      }
    });

    return {
      gold,
      silver,
      bronze,
      totalTournaments: groupedTournaments.length,
      totalMatches: matches.length,
      wins,
      losses: matches.length - wins
    };
  }, [matches, groupedTournaments]);

  // Get best result for tournament
    const getBestResult = (events: { [event: string]: Match[] }): Match | null => {
      let bestRound = 0;
      let bestMatch: Match | null = null;
  
      Object.values(events).forEach(eventMatches => {
        eventMatches.forEach(match => {
          const order = getRoundOrder(match.roundName);
          if (order > bestRound) {
            bestRound = order;
            bestMatch = match;
          }
        });
      });
  
      return bestMatch;
    };

  // Auto-expand tournaments with finals
  useMemo(() => {
    const tournamentsWithMedals = new Set<string>();
    groupedTournaments.forEach(tournament => {
      Object.values(tournament.events).forEach(eventMatches => {
        eventMatches.forEach(match => {
          if (match.roundName === "Final") {
            tournamentsWithMedals.add(tournament.code);
          }
        });
      });
    });
    setExpandedTournaments(tournamentsWithMedals);
  }, [groupedTournaments]);

  // Get player avatar
//   const playerAvatar = matches[0]?.team1.players.find(p => p.id === player.playerId)?.avatar.thumbnailUrl ||
//                        matches[0]?.team2.players.find(p => p.id === player.playerId)?.avatar.thumbnailUrl;

  if (!player || !matches || matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">🏸</div>
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
            {/* {playerAvatar ? (
              <img 
                src={playerAvatar} 
                alt={player.name}
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: "2px solid var(--primary)" }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: "var(--primary)", color: "white" }}>
                {player.name.charAt(0)}
              </div>
            )} */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                {toCapitalizedCase(player.name)}
              </h1>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 p-4 rounded-lg" style={{ background: "var(--glass)" }}>
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
                  {stats.wins}-{stats.losses}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>W-L</p>
            </div>
          </div>
        </div>

        {/* Tournament Timeline */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--primary)" }}>
            2025 Season Results
          </h2>

          {groupedTournaments.map(tournament => {
            const isExpanded = expandedTournaments.has(tournament.code);
            const bestMatch = getBestResult(tournament.events);
            const bestWon = bestMatch ? didPlayerWin(bestMatch) : false;
            const isFinal = bestMatch?.roundName === "Final";
            const medal = bestMatch ? getMedalEmoji(bestMatch?.roundName, bestWon) : null;
            const playerSeed = bestMatch ? getPlayerSeed(bestMatch) : null;

            return (
              <div key={tournament.code} className="rounded-xl shadow-lg overflow-hidden"
                style={{ background: "var(--surface)" }}>
                
                {/* Tournament Header */}
                <button
                  onClick={() => toggleTournament(tournament.code)}
                  className="w-full p-4 text-left hover:opacity-90 transition-opacity"
                  style={{ 
                    background: isFinal ? "var(--glass)" : "transparent"
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                        {tournament.name}
                      </h3>
                      {medal && <span className="text-xl">{medal}</span>}
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                    <span>
                      {new Date(tournament.date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    {playerSeed && (
                      <>
                        <span>Seed [{playerSeed}]</span>
                        <span>•</span>
                      </>
                    )}
                    {bestMatch && (
                      <>
                        <span className="font-semibold"
                          style={{ 
                            color: isFinal && bestWon ? "#FFD700" : 
                                   isFinal && !bestWon ? "#C0C0C0" :
                                   bestWon ? "var(--success)" : "var(--foreground)"
                          }}>
                          {bestMatch.roundName === "Final" ? (bestWon ? "Champion" : "Runner-up") :
                           bestMatch.roundName === "SF" ? "Semifinalist" :
                           getRoundName(bestMatch.roundName)}
                        </span>
                      </>
                    )}
                  </div>
                </button>

                {/* Expanded Event Details */}
                {isExpanded && (
                  <div className="p-4 pt-2 space-y-4">
                    {Object.entries(tournament.events).map(([eventName, eventMatches]) => (
                      <div key={eventName}>
                        {/* Event Header (only if multiple events) */}
                        {Object.keys(tournament.events).length > 1 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">{getEventIcon(eventName)}</span>
                            <h4 className="font-bold text-sm" style={{ color: "var(--primary)" }}>
                              {eventName}
                            </h4>
                          </div>
                        )}

                        {/* Compact Match List */}
                        <div className="space-y-1">
                          {eventMatches.map(match => {
                            const won = didPlayerWin(match);
                            const opponent = getOpponentInfo(match);
                            const score = getScoreString(match);

                            return (
                              <div key={match.id}
                                className="flex items-start justify-between gap-2 text-xs py-1.5 px-2"
                                style={{
                                  borderLeft: `3px solid ${won ? "var(--success)" : "var(--muted-2)"}`,
                                }}>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="font-bold px-2 py-0.5 rounded whitespace-nowrap"
                                    style={{ background: "var(--surface)", color: "var(--primary)" }}>
                                    {match.roundName}
                                  </span>
                                  <span style={{ color: won ? "var(--success)" : "var(--danger)" }}>
                                    {won ? "✓" : "✗"}
                                  </span>
                                  <span className="truncate" style={{ color: "var(--foreground)" }}>
                                    vs {opponent.name} ({opponent.country})
                                    {opponent.seed && ` [${opponent.seed}]`}
                                  </span>
                                </div>
                                <span className="font-semibold tabular-nums whitespace-nowrap ml-2"
                                  style={{ color: won ? "var(--success)" : "var(--muted)" }}>
                                  {score}
                                </span>
                              </div>
                            );
                          })}
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

export default BadmintonPlayerResults;