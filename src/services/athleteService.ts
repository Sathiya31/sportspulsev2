import { Query, or } from "firebase/firestore";
// Service for fetching athlete data from Firebase
import { db } from "@/config/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { Match } from "@/types/badminton";

/**
 * Flexible results fetcher: generates the query internally based on collectionName and player name/id
 */
export async function getAthleteResultsFlexible(
  playerIdOrName: string,
  collectionName: string
): Promise<Match[]> {
  try {
    const resultsRef = collection(db, collectionName);
    console.log(`Fetching results from collection: ${collectionName} for player: ${playerIdOrName}`);
    let q: Query;
    switch (collectionName) {
      case "athleteResults":
        q = query(resultsRef, where("athleteId", "==", playerIdOrName));
        break;
      case "badminton":
        // For badminton, check both team1.players and team2.players arrays for playerId
        q = query(
          resultsRef,
          or(
            where("team1PlayerIds", "array-contains", playerIdOrName),
            where("team2PlayerIds", "array-contains", playerIdOrName)
          )
        );
        break;
      case "tabletennisResults":
        q = query(resultsRef, where("athleteName", "==", playerIdOrName));
        break;
      case "shootingResults":
        q = query(resultsRef, where("athleteId", "==", playerIdOrName));
        break;
      // Add more cases as needed
      default:
        q = query(resultsRef, where("athleteId", "==", playerIdOrName));
        break;
    }
    const querySnapshot = await getDocs(q);

    const results: Match[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as Match);
    });

    console.log(`Fetched ${results.length} results for player: ${playerIdOrName} from collection: ${collectionName}`);

    return results;
  } catch (error) {
    console.error("Error fetching athlete results:", error);
    throw new Error("Failed to fetch athlete results");
  }
}

export async function getBadmintonAthleteResults(
  playerIdOrName: string
): Promise<Match[]> {
  try {
    const resultsRef = collection(db, "badminton");
    console.log(`Fetching badminton results for player: ${playerIdOrName}`);
    const q = query(
          resultsRef,
          or(
            where("team1PlayerIds", "array-contains", playerIdOrName),
            where("team2PlayerIds", "array-contains", playerIdOrName)
          )
        );
        
    const querySnapshot = await getDocs(q);

    const results: Match[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as Match);
    });

    console.log(`Fetched ${results.length} results for player: ${playerIdOrName} from collection: ${collectionName}`);

    return results;
  } catch (error) {
    console.error("Error fetching athlete results:", error);
    throw new Error("Failed to fetch athlete results");
  }
}


export async function getTableTennisAthleteResults(
  playerIdOrName: string
): Promise<Match[]> {
  try {
    const resultsRef = collection(db, "tabletennis");
    console.log(`Fetching table tennis results for player: ${playerIdOrName}`);
    const q = query(
          resultsRef,
          or(
            where("team1PlayerIds", "array-contains", playerIdOrName),
            where("team2PlayerIds", "array-contains", playerIdOrName)
          )
        );
        
    const querySnapshot = await getDocs(q);

    const results: Match[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as Match);
    });

    console.log(`Fetched ${results.length} results for player: ${playerIdOrName} from collection: ${collectionName}`);

    return results;
  } catch (error) {
    console.error("Error fetching athlete results:", error);
    throw new Error("Failed to fetch athlete results");
  }
}

/**
 * Helper to select the correct field for athlete id or name based on collectionName
 */
function getAthleteIdField(collectionName: string): string {
  switch (collectionName) {
    case "athleteResults":
      return "athleteId";
    case "badmintonResults":
      return "playerId";
    case "tabletennisResults":
      return "athleteName";
    case "shootingResults":
      return "athleteId";
    // Add more cases as needed for your collections
    default:
      return "athleteId";
  }
}

export interface AthleteData {
  playerId: string;
  id?: string;
  name: string;
  country?: string;
  ranking?: number;
  category?: string;
  photo?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  playsHand?: string;
  sport?: string;
}


export interface Achievement {
  tournament?: string;
  position?: string; // "Winner", "Runner-up", "Semi-finalist", "Quarter-finalist"
  date?: string;
  category?: string;
  prize?: string;
}

/**
 * Search for athletes by name
 * Performs a case-insensitive search in Firebase
 */
export async function searchAthletes(searchQuery: string, sport?: string): Promise<AthleteData[]> {
  try {
    const athletesRef = collection(db, "athletes");
    // Convert search query to lowercase for case-insensitive search
    const lowerQuery = searchQuery.toLowerCase();
    const lowerSport = sport ? sport.toLowerCase() : undefined;
    // Fetch all athletes (you may want to add pagination for large datasets)
    const q = query(athletesRef);
    const querySnapshot = await getDocs(q);
    const athletes: AthleteData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AthleteData;
      // Filter by name containing search query (case-insensitive)
      const nameMatch = data.name && data.name.toLowerCase().includes(lowerQuery);
      // Filter by sport if provided
      const sportMatch = lowerSport ? (data.sport && data.sport.toLowerCase() === lowerSport) : true;
      if (nameMatch && sportMatch) {
        athletes.push({
          id: doc.id,
          ...data
        });
      }
    });
    return athletes;
  } catch (error) {
    console.error("Error searching athletes:", error);
    throw new Error("Failed to search athletes");
  }
}

/**
 * Get athlete details by ID
 */
export async function getAthleteById(athleteId: string): Promise<AthleteData | null> {
  try {
    const athleteRef = doc(db, "athletes", athleteId);
    const athleteSnap = await getDoc(athleteRef);
    
    if (athleteSnap.exists()) {
      return {
        id: athleteSnap.id,
        ...athleteSnap.data()
      } as AthleteData;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching athlete:", error);
    throw new Error("Failed to fetch athlete details");
  }
}

/**
 * Get athlete's match results
 */
export async function getAthleteResults(
  athleteIdOrName: string,
  collectionName: string = "athleteResults"
): Promise<Match[]> {
  try {
    const resultsRef = collection(db, collectionName);
    const idField = getAthleteIdField(collectionName);
    const q = query(resultsRef, where(idField, "==", athleteIdOrName));
    const querySnapshot = await getDocs(q);

    const results: Match[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as Match);
    });

    return results;
  } catch (error) {
    console.error("Error fetching athlete results:", error);
    throw new Error("Failed to fetch athlete results");
  }
}


/**
 * Infer achievements from match results
 * This function analyzes tournament results to determine achievements
 */
// export function inferAchievementsFromResults(results: Match[]): Achievement[] {
//   const achievements: Achievement[] = [];
//   const tournamentResults = new Map<string, Match[]>();

//   // Group results by tournament
//   results.forEach(result => {
//     if (!result.tournamentName) return;
    
//     if (!tournamentResults.has(result.tournamentName)) {
//       tournamentResults.set(result.tournamentName, []);
//     }
//     tournamentResults.get(result.tournamentName)?.push(result);
//   });

//   // Analyze each tournament's results
//   tournamentResults.forEach((matches, tournament) => {
//     // Sort matches by round to determine progression
//     matches.sort((a, b) => {
//       const roundOrder = new Map([
//         ['Final', 5],
//         ['Semi-final', 4],
//         ['Quarter-final', 3],
//         ['Round of 16', 2],
//         ['Round of 32', 1]
//       ]);
      
//       const aOrder = a.roundName ? roundOrder.get(a.roundName) || 0 : 0;
//       const bOrder = b.roundName ? roundOrder.get(b.roundName) || 0 : 0;
//       return bOrder - aOrder;
//     });

//     // Find the last match to determine final position
//     const lastMatch = matches[0];
//     if (!lastMatch) return;

//     let position: string;
//     if (lastMatch.round === 'Final' && lastMatch.result === 'win') {
//       position = 'Winner';
//     } else if (lastMatch.round === 'Final' && lastMatch.result === 'loss') {
//       position = 'Runner-up';
//     } else if (lastMatch.round === 'Semi-final') {
//       position = 'Semi-finalist';
//     } else if (lastMatch.round === 'Quarter-final') {
//       position = 'Quarter-finalist';
//     } else {
//       return; // Don't record achievement for earlier round exits
//     }

//     achievements.push({
//       tournament,
//       position,
//       date: lastMatch.date,
//       category: matches[0].tournamentCode
//     });
//   });

//   return achievements;
// }

/**
 * Get athlete achievements combining stored and inferred achievements
 */
// export async function getAthleteAchievements(athleteId: string): Promise<Achievement[]> {
//   try {
//     // First, get stored achievements from Firestore
//     const achievementsRef = collection(db, "athleteAchievements");
//     const q = query(achievementsRef, where("athleteId", "==", athleteId));
//     const querySnapshot = await getDocs(q);
    
//     const storedAchievements: Achievement[] = [];
//     querySnapshot.forEach((doc) => {
//       storedAchievements.push(doc.data() as Achievement);
//     });

//     // Get athlete's match results
//     const results = await getAthleteResults(athleteId);

//     // Infer additional achievements from results
//     const inferredAchievements = inferAchievementsFromResults(results);

//     // Combine stored and inferred achievements
//     // Using Map to remove duplicates based on tournament and date
//     const achievementsMap = new Map<string, Achievement>();
    
//     [...storedAchievements, ...inferredAchievements].forEach(achievement => {
//       const key = `${achievement.tournament}-${achievement.date}`;
//       if (!achievementsMap.has(key)) {
//         achievementsMap.set(key, achievement);
//       }
//     });

//     // Convert back to array and sort by date (most recent first)
//     const allAchievements = Array.from(achievementsMap.values());
//     allAchievements.sort((a, b) => {
//       if (!a.date || !b.date) return 0;
//       return new Date(b.date).getTime() - new Date(a.date).getTime();
//     });

//     return allAchievements;
//   } catch (error) {
//     console.error("Error fetching athlete achievements:", error);
//     throw new Error("Failed to fetch athlete achievements");
//   }
// }