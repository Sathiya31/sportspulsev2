'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, Trophy, Target } from 'lucide-react';
import { toCapitalizedCase } from '@/utils/common';
import { MatchData, Competitor } from '@/app/archery/page';
import { getCategoryLabel, getPhaseName } from '@/utils/archeryUtils';


interface GroupedMatches {
  [competitionId: string]: {
    matches: MatchData[];
  };
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


// Compact Match Card Component
const CompactMatchCard = ({ match, playerAthleteIds }: { match: MatchData, playerAthleteIds: string[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which competitor is the player
  const isPlayer1 = match.Competitor1.Members?.some(m => playerAthleteIds.includes(m.Id)) ||
                    (match.Competitor1.Athlete && playerAthleteIds.includes(match.Competitor1.Athlete.Id));
  
  const playerComp = isPlayer1 ? match.Competitor1 : match.Competitor2;
  const opponentComp = isPlayer1 ? match.Competitor2 : match.Competitor1;
  
  const playerWon = playerComp.WinLose;
  const isTeam = !!match.Competitor1.Members;
  const isFinal = match.Phase <= 1;
  const goldMedalMatch = match.Phase === 0;
  const bronzeMedalMatch = match.Phase === 1;

  const playerSets = formatSetScores(playerComp.SP);
  const opponentSets = formatSetScores(opponentComp.SP);

  return (
    <div className="rounded-lg border p-3 hover:shadow-md transition-shadow"
      style={{
        background: "var(--surface)",
        borderLeft: `4px solid ${playerWon ? 'var(--success)' : 'var(--danger)'}`,
        borderColor: (goldMedalMatch || (bronzeMedalMatch && playerWon)) ? '#FFD700' : 'var(--border)'
      }}>
      
      {/* Match Header - Single Line */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-medium px-2 py-1 rounded"
            style={{ 
              background: isFinal ? '#FFD700' : 'var(--primary)',
              color: isFinal ? '#854D0E' : 'white'
            }}>
            {getPhaseName(match.Phase)}
          </span>
          <span className="text-xs" style={{ color: "var(--foreground)" }}>
            {getCategoryLabel(match.CategoryCode)}
          </span>
        </div>
        {goldMedalMatch && playerWon && (
          <span className="text-lg">🥇</span>
        )}
        {goldMedalMatch && !playerWon && (
          <span className="text-lg">🥈</span>
        )}
        {bronzeMedalMatch && playerWon && (
          <span className="text-lg">🥉</span>
        )}
      </div>

      {/* Score Line - Compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs md:text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {playerComp.NOC  || playerComp.Athlete?.NOC}
          </span>
          <span className="text-sm md:text-base" style={{ color: "var(--muted)" }}>
            {getCompetitorName(playerComp)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" 
            style={{ color: playerWon ? "var(--success)" : "var(--muted)" }}>
            {playerComp.Score}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>vs</span>
          <span className="text-lg font-bold"
            style={{ color: !playerWon ? "var(--success)" : "var(--muted)" }}>
            {opponentComp.Score}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm md:text-base" style={{ color: "var(--muted)" }}>
            {playerComp.Bye ? "Bye" : getCompetitorName(opponentComp)}
          </span>
          <span className="text-xs md:text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {opponentComp.NOC || opponentComp.Athlete?.NOC}
          </span>
          {/* {playerWon ? (
            <span className="text-success font-bold">✓</span>
          ) : (
            <span className="text-danger font-bold">✗</span>
          )} */}
        </div>
      </div>

      {/* Team Members (if team event) */}
      {isTeam && playerComp.Members && (
        <div className="mt-2 text-xs md:text-sm" style={{ color: "var(--muted)" }}>
          Team: {playerComp.Members.map(m => `${m.GName.split(' ')[0]} ${m.FName.charAt(0)}.`).join(', ')}
        </div>
      )}

      {/* Expandable Section */}
      <div className="mt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
          style={{ color: "var(--primary)" }}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Set Details
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {/* Set Scores */}
            <div className="grid gap-1">
              {playerSets.map((playerSet, idx) => {
                const opponentSet = opponentSets[idx];
                const playerSetWon = parseInt(playerSet) > parseInt(opponentSet);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs p-1 rounded"
                    style={{ background: "var(--glass)" }}>
                    <span style={{ color: playerSetWon ? "var(--success)" : "var(--muted)" }}>
                      Set {idx + 1}: {playerSet}
                    </span>
                    <span style={{ color: "var(--muted)" }}>-</span>
                    <span style={{ color: !playerSetWon ? "var(--success)" : "var(--muted)" }}>
                      {opponentSet}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ArcheryPlayerResults = ({ 
 player,
  matches, 
  onBack 
}: { 
    player?: any,
  matches: MatchData[], 
  onBack?: () => void 
}) => {
  // Extract player info from first match
  const firstMatch = matches[0]
  const playerAthleteIds = firstMatch?.athlete_ids || [];
  
  
//   if (firstMatch) {
//     const playerComp = firstMatch.Competitor1.Members?.some(m => playerAthleteIds.includes(m.Id)) 
//       ? firstMatch.Competitor1 
//       : firstMatch.Competitor2;
    
//     if (playerComp.Athlete) {
//       playerName = `${playerComp.Athlete.GName} ${playerComp.Athlete.FName}`;
//     } else if (playerComp.Members) {
//       const playerMember = playerComp.Members.find(m => playerAthleteIds.includes(m.Id));
//       if (playerMember) {
//         playerName = `${playerMember.GName} ${playerMember.FName}`;
//         playerNOC = playerComp.NOC;
//       }
//     }
//   }

  // Group by competition
  const groupedMatches: GroupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.competition_id]) {
      acc[match.competition_id] = { matches: [] };
    }
    acc[match.competition_id].matches.push(match);
    return acc;
  }, {} as GroupedMatches);

  // Sort matches within each competition by phase (finals first)
  Object.values(groupedMatches).forEach(comp => {
    comp.matches.sort((a, b) => a.Phase - b.Phase);
  });

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
              {playerName.charAt(0)}
            </div> */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                {toCapitalizedCase(player.name || 'Athlete')}
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
                <Target size={20} style={{ color: "var(--primary)" }} />
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
        <div className="space-y-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--primary)" }}>2025 Season Results</h2>

          {Object.entries(groupedMatches).map(([compId, { matches: compMatches }]) => (
            <div key={compId} className="rounded-xl shadow-lg overflow-hidden" style={{ background: "var(--surface)" }}>
              {/* Competition Header */}
              <div className="p-4 border-b" style={{ background: "var(--glass)", borderColor: "var(--border)" }}>
                <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
                  {compMatches[0]?.competition_name || `Competition #${compId}`}
                </h3>
              </div>

              {/* Match List */}
              <div className="p-4 space-y-3">
                {compMatches.map((match, idx) => (
                  <CompactMatchCard 
                    key={`${compId}-${idx}`} 
                    match={match} 
                    playerAthleteIds={playerAthleteIds}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArcheryPlayerResults;