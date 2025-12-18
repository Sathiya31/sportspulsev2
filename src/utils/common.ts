// Common utility functions for the project

// Converts a string to capitalized case (first letter of each word uppercase, rest lowercase)
export function toCapitalizedCase(str: string): string {
  return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

// Add more utility functions below as needed
export const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

export const getMedalStyle = (rank: number) => {
    if (rank === 1) return { background: "#FFD700", color: "#854D0E" };
    if (rank === 2) return { background: "#C0C0C0", color: "#1F2937" };
    if (rank === 3) return { background: "#CD7F32", color: "#1C1917" };
    return { background: "var(--muted)", color: "var(--surface)" };
  };
