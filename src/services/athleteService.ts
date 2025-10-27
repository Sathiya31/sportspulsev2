// Service for fetching athlete data from Firebase
import { db } from "@/config/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export interface AthleteData {
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
}

export interface MatchResult {
  tournament?: string;
  tournamentCode?: string;
  date?: string;
  round?: string;
  opponent?: string;
  score?: string;
  result?: "win" | "loss";
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
export async function searchAthletes(searchQuery: string): Promise<AthleteData[]> {
  try {
    const athletesRef = collection(db, "athletes");
    
    // Convert search query to lowercase for case-insensitive search
    const lowerQuery = searchQuery.toLowerCase();
    
    // Fetch all athletes (you may want to add pagination for large datasets)
    const q = query(athletesRef);
    const querySnapshot = await getDocs(q);
    
    const athletes: AthleteData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AthleteData;
      // Filter by name containing search query (case-insensitive)
      if (data.name && data.name.toLowerCase().includes(lowerQuery)) {
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
export async function getAthleteResults(athleteId: string): Promise<MatchResult[]> {
  try {
    const resultsRef = collection(db, "athleteResults");
    const q = query(resultsRef, where("athleteId", "==", athleteId));
    const querySnapshot = await getDocs(q);
    
    const results: MatchResult[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as MatchResult);
    });
    
    // Sort by date (most recent first)
    results.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return results;
  } catch (error) {
    console.error("Error fetching athlete results:", error);
    throw new Error("Failed to fetch athlete results");
  }
}

/**
 * Get athlete results by name (alternative approach if you don't have athlete IDs)
 */
export async function getAthleteResultsByName(athleteName: string): Promise<MatchResult[]> {
  try {
    const resultsRef = collection(db, "athleteResults");
    const q = query(resultsRef, where("athleteName", "==", athleteName));
    const querySnapshot = await getDocs(q);
    
    const results: MatchResult[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as MatchResult);
    });
    
    // Sort by date (most recent first)
    results.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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
export function inferAchievementsFromResults(results: MatchResult[]): Achievement[] {
  const achievements: Achievement[] = [];
  const tournamentResults = new Map<string, MatchResult[]>();

  // Group results by tournament
  results.forEach(result => {
    if (!result.tournament) return;
    
    if (!tournamentResults.has(result.tournament)) {
      tournamentResults.set(result.tournament, []);
    }
    tournamentResults.get(result.tournament)?.push(result);
  });

  // Analyze each tournament's results
  tournamentResults.forEach((matches, tournament) => {
    // Sort matches by round to determine progression
    matches.sort((a, b) => {
      const roundOrder = new Map([
        ['Final', 5],
        ['Semi-final', 4],
        ['Quarter-final', 3],
        ['Round of 16', 2],
        ['Round of 32', 1]
      ]);
      
      const aOrder = a.round ? roundOrder.get(a.round) || 0 : 0;
      const bOrder = b.round ? roundOrder.get(b.round) || 0 : 0;
      return bOrder - aOrder;
    });

    // Find the last match to determine final position
    const lastMatch = matches[0];
    if (!lastMatch) return;

    let position: string;
    if (lastMatch.round === 'Final' && lastMatch.result === 'win') {
      position = 'Winner';
    } else if (lastMatch.round === 'Final' && lastMatch.result === 'loss') {
      position = 'Runner-up';
    } else if (lastMatch.round === 'Semi-final') {
      position = 'Semi-finalist';
    } else if (lastMatch.round === 'Quarter-final') {
      position = 'Quarter-finalist';
    } else {
      return; // Don't record achievement for earlier round exits
    }

    achievements.push({
      tournament,
      position,
      date: lastMatch.date,
      category: matches[0].tournamentCode
    });
  });

  return achievements;
}

/**
 * Get athlete achievements combining stored and inferred achievements
 */
export async function getAthleteAchievements(athleteId: string): Promise<Achievement[]> {
  try {
    // First, get stored achievements from Firestore
    const achievementsRef = collection(db, "athleteAchievements");
    const q = query(achievementsRef, where("athleteId", "==", athleteId));
    const querySnapshot = await getDocs(q);
    
    const storedAchievements: Achievement[] = [];
    querySnapshot.forEach((doc) => {
      storedAchievements.push(doc.data() as Achievement);
    });

    // Get athlete's match results
    const results = await getAthleteResults(athleteId);

    // Infer additional achievements from results
    const inferredAchievements = inferAchievementsFromResults(results);

    // Combine stored and inferred achievements
    // Using Map to remove duplicates based on tournament and date
    const achievementsMap = new Map<string, Achievement>();
    
    [...storedAchievements, ...inferredAchievements].forEach(achievement => {
      const key = `${achievement.tournament}-${achievement.date}`;
      if (!achievementsMap.has(key)) {
        achievementsMap.set(key, achievement);
      }
    });

    // Convert back to array and sort by date (most recent first)
    const allAchievements = Array.from(achievementsMap.values());
    allAchievements.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return allAchievements;
  } catch (error) {
    console.error("Error fetching athlete achievements:", error);
    throw new Error("Failed to fetch athlete achievements");
  }
}