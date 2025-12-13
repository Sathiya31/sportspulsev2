import { useState, useMemo } from "react";
import { Match } from "@/types/badminton";
import { roundNames } from "./RoundGroup";

const ROUND_ORDER = [
  "F",
  "Final",
  "Semi-final",
  "SF",
  "Quarter-final",
  "QF",
  "Round of 16",
  "R16",
  "Round of 32",
  "R32",
  "Round of 64",
  "R64",
  "Qual. F",
  "Qual. SF",
  "Qual. QF",
  "Qual. R16",
  "Qual. R32",
  "Other"
];

function getRoundOrder(round: string): number {
  const idx = ROUND_ORDER.findIndex(r => r.toLowerCase() === (round || "Other").toLowerCase());
  return idx === -1 ? ROUND_ORDER.length - 1 : idx;
}

function sortResults(results: Match[]) {
  return results.slice().sort((a, b) => {
    const roundA = getRoundOrder(a.roundName || "Other");
    const roundB = getRoundOrder(b.roundName || "Other");
    if (roundA !== roundB) return roundA - roundB;
    // If same round, sort by date
    const dateA = a.matchTime ? new Date(a.matchTime).getTime() : 0;
    const dateB = b.matchTime ? new Date(b.matchTime).getTime() : 0;
    return dateB - dateA;
  })
}

export default function AthleteTournamentAccordion({ results, selectedPlayer }: { results: Match[], selectedPlayer: string }) {
  // Group results by tournament
  const grouped = useMemo(() => {
    const map: Record<string, Match[]> = {};
    results.forEach(r => {
      const key = r.tournamentName || r.tournamentCode || "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [results]);

  console.log("Selected player:", selectedPlayer);

  // Prepare tournament list sorted by best advancement, then date (descending)
  const tournaments = useMemo(() => {
    return Object.entries(grouped)
      .map(([name, res]) => {
        const sortedResults = sortResults(res);
        const best = sortedResults[0]; // Best result (highest round reached)
        const latest = sortedResults[sortedResults.length - 1]; // Latest match played
        return {
          name,
          results: sortedResults,
          best, // Best performance (for highlighting)
          latest, // Latest match (for date sorting)
          date: latest?.matchTime || ""
        };
      })
      .sort((a, b) => {
        // Sort by date only (most recent tournaments first)
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10); // Get latest 10 tournaments
  }, [grouped]);

  // Track open tournaments (multiple allowed)
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggleTournament(name: string) {
    setOpen(prev => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className="mt-6">
      {tournaments.length === 0 ? (
        <div className="text-center text-muted">No results found for this athlete.</div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => (
            <div key={t.name} className="border rounded-lg bg-[var(--glass)] shadow-md">
              <button
                className="w-full flex justify-between items-center px-4 py-3 text-left focus:outline-none hover:bg-[var(--surface)] transition-colors"
                style={{ color: "var(--primary)", fontWeight: 600 }}
                onClick={() => toggleTournament(t.name)}
              >
                <span className="flex flex-col">
                  <span className="text-md font-semibold">{t.name}</span>
                  <span className="text-xs font-normal mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                    <span>{t.results.length} matches</span>
                    <span>•</span>
                    <span>
                      {new Date(t.date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold shadow" style={{ background: "var(--primary)", color: "var(--surface)" }}>
                    {roundNames[t.best?.roundName] || "Qualification"}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${open[t.name] ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
              {open[t.name] && (
                <div className="p-4 border-t bg-white/10">
                  <table className="w-full text-sm rounded overflow-hidden">
                    <thead>
                      <tr style={{ background: "var(--surface)" }}>
                        <th className="text-left px-2 py-2">Round</th>
                        <th className="text-left px-2 py-2">Opponent</th>
                        <th className="text-left px-2 py-2">Score</th>
                        <th className="text-left px-2 py-2">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.results.map((r, idx) => {
                        // Determine which team is selectedPlayer's team (by id or nameDisplay)
                        const team1HasPlayer = r.team1.players?.some((p) => p.id === selectedPlayer || p.nameDisplay === selectedPlayer);
                        const team2HasPlayer = r.team2.players?.some((p) => p.id === selectedPlayer || p.nameDisplay === selectedPlayer);
                        let teamA = r.team1;
                        let teamB = r.team2;
                        if (!team1HasPlayer && team2HasPlayer) {
                          teamA = r.team2;
                          teamB = r.team1;
                        }
                        // Format players using nameDisplay
                        const teamAPlayers = (teamA.players || []).map(p => p.nameDisplay).join('/ ');
                        const teamBPlayers = (teamB.players || []).map(p => p.nameDisplay).join('/ ');
                        const playersLine = `${teamAPlayers} vs ${teamBPlayers}`;
                        // Format score as "home-away" for each set
                        const scoreLine = Array.isArray(r.score) && r.score.length > 0
                          ? r.score.map(s => `${s.home}-${s.away}`).join(', ')
                          : '-';
                        // Determine result (win/loss/draw) for selected player's team
                        let result = '-';
                        if (r.winner === 1 && teamA === r.team1) result = 'Win';
                        else if (r.winner === 2 && teamA === r.team2) result = 'Win';
                        else if (r.winner === 1 || r.winner === 2) result = 'Loss';
                        // If matchStatusValue is not finished, show status
                        if (r.matchStatusValue && r.matchStatusValue !== 'Finished') result = r.matchStatusValue;
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-transparent" : "bg-[var(--glass)]"}>
                            <td className="px-2 py-2 font-medium">{r.roundName}</td>
                            <td className="px-2 py-2">{playersLine}</td>
                            <td className="px-2 py-2">{scoreLine}</td>
                            <td className="px-2 py-2 font-semibold" style={{ color: result === "Win" ? "var(--success)" : result === "Loss" ? "var(--danger)" : "var(--muted)" }}>
                              {result}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}