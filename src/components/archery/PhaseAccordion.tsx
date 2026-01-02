import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MatchData, Competitor } from '../../types/archery';
import { getPhaseName } from '../../utils/archeryUtils';
import CountryFlag from '../CountryFlag';

// Match Card Component
const MatchCard = ({ match, isTeamMatch }: { match: MatchData; isTeamMatch: boolean }) => {
  const [showSetPoints, setShowSetPoints] = useState(false);
  
  const comp1 = match.Competitor1;
  const comp2 = match.Competitor2;
  
  // Skip if either competitor has QualRank 0 (bye)
  if (comp1.QualRank === 0 || comp2.QualRank === 0) {
    return null;
  }

  const getCompetitorName = (competitor: Competitor) => {
    if (isTeamMatch) {
      return `Team ${competitor.Name || competitor.NOC}`;
    }
    return `${competitor.Athlete?.GName} ${competitor.Athlete?.FName}`;
  };

  const getNOC = (competitor: Competitor) => {
    return isTeamMatch ? competitor.NOC : competitor.Athlete?.NOC;
  };

  return (
    <div className="p-3 shadow-sm hover:shadow-md transition-shadow" style={{ background: "var(--surface)"}}>
      {/* Competitor 1 */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CountryFlag countryCode={getNOC(comp1) || ""} className="w-6 h-4" />
          <span className="text-sm md:text-base font-medium truncate" 
             style={{ color: comp1.WinLose ? "var(--foreground)" : "var(--muted-2)" }}>
            {getCompetitorName(comp1)}
            </span>
          <span className="text-xs md:text-sm" style={{ color: "var(--muted-2)" }}>({comp1.QualRank})</span>
        </div>
        <div className={`text-lg font-bold ml-2`} style={{ color: comp1.WinLose ? "var(--success)" : "var(--muted)" }}>
          {comp1.Score}
          {comp1.WinLose && ' ✓'}
        </div>
      </div>

      {/* Competitor 2 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* <span className="text-sm md:text-base" style={{ color: "var(--muted)" }}>{getNOC(comp2)}</span> */}
          <CountryFlag countryCode={getNOC(comp2) || ""} className="w-6 h-4" />
          <span className="text-sm md:text-base font-medium truncate" 
          style={{ color: comp2.WinLose ? "var(--foreground)" : "var(--muted-2)" }}>
            {getCompetitorName(comp2)}
            </span>
          <span className="text-xs md:text-sm" style={{ color: "var(--muted-2)" }}>({comp2.QualRank})</span>
        </div>
        <div className={`text-lg font-bold ml-2`} style={{ color: comp2.WinLose ? "var(--success)" : "var(--muted)" }}>
          {comp2.Score}
          {comp2.WinLose && ' ✓'}
        </div>
      </div>

      {/* Set Points Expandable */}
      {(comp1.SP || comp2.SP) && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setShowSetPoints(!showSetPoints)}
            className="flex items-center gap-1 text-xs hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            {showSetPoints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Set Points
          </button>
          {showSetPoints && (
            <div className="mt-2 text-xs md:text-sm space-y-1" style={{ color: "var(--muted)" }}>
              {comp1.SP && (
                <div>
                  <span className="font-medium">{getCompetitorName(comp1).split(' ')[0]}:</span> {comp1.SP.replace(/\|/g, ' | ')}
                </div>
              )}
              {comp2.SP && (
                <div>
                  <span className="font-medium">{getCompetitorName(comp2).split(' ')[0]}:</span> {comp2.SP.replace(/\|/g, ' | ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Phase Accordion Component
export const PhaseAccordion = ({ 
  phase, 
  matches, 
  isTeamMatch 
}: { 
  phase: number; 
  matches: MatchData[]; 
  isTeamMatch: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasLiveMatch = matches.some(m => m.IsLive);
  const validMatches = matches.filter(m => m.Competitor1.QualRank !== 0 && m.Competitor2.QualRank !== 0);

  if (validMatches.length === 0) return null;

  return (
    <div className="mb-4 p-2 shadow-sm" 
    style={{ background: "var(--background)", borderColor: "var(--border)" }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between 
        border-b border-blue-200 hover:opacity-90 transition-opacity"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: "var(--foreground)" }}>{getPhaseName(phase)}</span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>({validMatches.length} matches)</span>
          {hasLiveMatch && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--danger)", color: "var(--surface)" }}>
              LIVE
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {validMatches.map((match, index) => (
            <MatchCard key={`${phase}-${index}`} match={match} isTeamMatch={isTeamMatch} />
          ))}
        </div>
      )}
    </div>
  );
};