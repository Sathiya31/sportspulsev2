// Utility to filter and format Indian badminton results
// Usage: import and call filterIndianResults(jsonData)

interface Player {
    nameDisplay: string;
    countryCode: string;
}

interface Team {
    players: Player[];
}

interface SetScore {
    set: number;
    home: number;
    away: number;
}

interface Match {
    team1: Team;
    team2: Team;
    winner: number;
    scoreStatusValue?: string;
    score?: string | SetScore[];
    scores?: { scoreString: string }[];
    matchStatus?: string;
    matchStatusValue?: string;
    scoreArray?: SetScore[];
}

function capitalizeName(name: string) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function filterIndianResults(matches: Match[]): string[] {
    const results: string[] = [];
    for (const match of matches) {
        const { team1, team2, winner } = match;
        const team1HasIndian = team1.players.some((p) => p.countryCode === "IND");
        const team2HasIndian = team2.players.some((p) => p.countryCode === "IND");
        if (!team1HasIndian && !team2HasIndian) continue;

        // Get scores (if available)
        let scoreStr = "";
        // If score is an array of set objects
        // For each Indian player, format result
        if (team1HasIndian) {
            scoreStr = (match.score as SetScore[]).map((s) => `${s.home}-${s.away}`).join(", ");
        } else {
            scoreStr = (match.score as SetScore[]).map((s) => `${s.away}-${s.home}`).join(", ");
        }

        // For each Indian player, format result
        if (team1HasIndian) {
            const opponent = team2.players.map((x) => `${capitalizeName(x.nameDisplay)}`).join(" / ");
            const opponentCountry = team2.players[0].countryCode;
            const outcome = winner === 1 ? `defeated` : `lost to`;
            const hometeam = team1.players.map((x) => `${capitalizeName(x.nameDisplay)}`).join(" / ");
            const hometeamCountry = team1.players[0].countryCode;
            results.push(`${hometeam} (${hometeamCountry}) ${outcome} ${opponent} (${opponentCountry}) (Score: ${scoreStr})`);

        } else if (team2HasIndian) {
            const opponent = team1.players.map((x) => `${capitalizeName(x.nameDisplay)}`).join(" / ");
            const opponentCountry = team1.players[0].countryCode;
            const outcome = winner === 2 ? `defeated` : ` lost to`;
            const hometeam = team2.players.map((x) => `${capitalizeName(x.nameDisplay)}`).join(" / ");
            const hometeamCountry = team2.players[0].countryCode;
            results.push(`${hometeam} (${hometeamCountry}) ${outcome} ${opponent} (${opponentCountry}) (Score: ${scoreStr})`);

        }
    }
    return results;
}
