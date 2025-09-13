import { db } from '@/config/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export async function saveTournamentDayResults(
  tournamentCode: string, 
  date: string, 
  results: any[]
) {
  try {
    // Use batched writes for better performance and atomicity
    const batch = writeBatch(db);

    for (const match of results) {
      if (!match.id) {
        console.warn('Match missing ID, skipping:', match);
        continue;
      }

      const docRef = doc(db, 'badminton', match.id.toString());

      batch.set(docRef, match, { merge: true });
    }

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error saving tournament results:', error);
    throw error;
  }
}