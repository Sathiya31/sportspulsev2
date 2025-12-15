import {archeryCategoryMap} from './archeryCategoryMap';

export function getPhaseName(phase: number): string {
  const matchCount = 2 * phase;

  if (matchCount >= 65 && matchCount <= 128) {
    return 'Round of 128';
  } else if (matchCount >= 33 && matchCount <= 64) {
    return 'Round of 64';
  } else if (matchCount >= 17 && matchCount <= 32) {
    return 'Round of 32';
  } else if (matchCount >= 9 && matchCount <= 16) {
    return 'Round of 16';
  } else if (matchCount >= 5 && matchCount <= 8) {
    return 'Quarter Finals';
  } else if (matchCount >= 3 && matchCount <= 4) {
    return 'Semi Finals';
  } else if (phase === 1) {
    return 'Bronze Medal Match';
  } else if (phase === 0) {
    return 'Gold Medal Match';
  }
  
  return `Phase ${phase}`;
}

// Category Code to Label Converter
export function getCategoryLabel(categoryCode: string): string {
  return archeryCategoryMap[categoryCode] || `${categoryCode} Category`;
}