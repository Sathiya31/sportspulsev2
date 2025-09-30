import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Match, TournamentResults } from '@/types/badminton';

export async function getTournamentResults(tournamentCode: string): Promise<TournamentResults> {
  try {
    const matchesRef = collection(db, 'badminton');
    const q = query(matchesRef, where('tournamentCode', '==', tournamentCode));
    const querySnapshot = await getDocs(q);

    console.log('Fetched matches:', querySnapshot.size);

    // Group matches by round
    const results: TournamentResults = {};
    
    querySnapshot.forEach((doc) => {
      const match = doc.data() as Match;
      const round = match.roundName;
      
      if (!results[round]) {
        results[round] = [];
      }
      
      results[round].push(match);
    });
    
    // Sort rounds in proper order
    const roundOrder = ['Final', 'F', 'SF', 'QF', 'R16', 'R32', 'R64'];
    const sortedResults: TournamentResults = {};
    
    roundOrder.forEach(round => {
      if (results[round]) {
        // Sort matches within each round by match time
        sortedResults[round] = results[round].sort(
          (a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
        );
      }
    });
    
    return sortedResults;
  } catch (error) {
    console.error('Error fetching tournament results:', error);
    throw error;
  }
}
