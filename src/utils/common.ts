// Common utility functions for the project

// Converts a string to capitalized case (first letter of each word uppercase, rest lowercase)
export function toCapitalizedCase(str: string): string {
  return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

// Add more utility functions below as needed
