'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, Trophy, Target, Award } from 'lucide-react';
import { getMedalIcon, getMedalStyle, toCapitalizedCase } from '@/utils/common';
import type { ShootingResult, Competition } from './results';

interface GroupedResults {
  [competitionKey: string]: {
    competition: Competition;
    results: ShootingResult[];
  };
}

const AthleteResultsDisplay = ({ athlete, results, onBack }: 
    {athlete: any, results: ShootingResult[], onBack?: () => void }) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  // Group results by competition
  const groupedResults: GroupedResults = results.reduce((acc, result) => {
    const key = `${result.competition_info?.competition_id}-${result.competition_info?.date}`;
    if (!acc[key]) {
      acc[key] = {
        competition: result.competition_info,
        results: []
      };
    }
    acc[key].results.push(result);
    return acc;
  }, {} as GroupedResults);

  // Sort competitions by date (most recent first)
  const sortedCompetitions = Object.entries(groupedResults).sort((a, b) => {
    const dateA = new Date(a[1].competition?.date ?? 0);
    const dateB = new Date(b[1].competition?.date ?? 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate statistics
  const stats = {
    gold: results.filter(r => r.athlete_result.rank === 1 && (r.event_stage.toLowerCase().includes('final') || r.event_stage.toLowerCase().includes('medal'))).length,
    silver: results.filter(r => r.athlete_result.rank === 2 && (r.event_stage.toLowerCase().includes('final') || r.event_stage.toLowerCase().includes('medal'))).length,
    bronze: results.filter(r => r.athlete_result.rank === 3 && (r.event_stage.toLowerCase().includes('final') || r.event_stage.toLowerCase().includes('medal'))).length,
    totalCompetitions: Object.keys(groupedResults).length,
    bestScore: Math.max(...results.filter(r => r.athlete_result.total_score).map(r => parseFloat(r.athlete_result.total_score || '0')))
  };

  const getStageColor = (stage: string) => {
    if (stage.toLowerCase().includes('final')) return 'var(--accent)';
    if (stage.toLowerCase().includes('medal')) return '#FFD700';
    return 'var(--primary)';
  };

  const toggleExpand = (resultId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const athleteName = toCapitalizedCase(athlete?.name) || "Athlete";

  return (
    <div className="min-h-screen p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            <ArrowLeft size={20} />
            <span>Back to Search</span>
          </button>
        )}

        {/* Athlete Header */}
        <div className="rounded-xl p-6 mb-6 shadow-lg" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-4 mb-4">
            {/* <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "var(--primary)", color: "white" }}>
              {athleteName.charAt(0)}
            </div> */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                {athleteName}
              </h1>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg" style={{ background: "var(--glass)" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={20} style={{ color: "#FFD700" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.gold}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Gold</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award size={20} style={{ color: "#C0C0C0" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.silver}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Silver</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award size={20} style={{ color: "#CD7F32" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.bronze}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Bronze</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target size={20} style={{ color: "var(--primary)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {stats.totalCompetitions}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Events</p>
            </div>
          </div>

          {stats.bestScore > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Best Qualification Score: <span className="font-bold text-lg" style={{ color: "var(--primary)" }}>{stats.bestScore.toFixed(1)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Competition Timeline */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--primary)" }}>2025 Season Results</h2>

          {sortedCompetitions.map(([key, { competition, results: compResults }]) => (
            <div key={key} className="rounded-xl shadow-lg overflow-hidden" style={{ background: "var(--surface)" }}>
              {/* Competition Header */}
              <div className="p-4 border-b" style={{ background: "var(--glass)", borderColor: "var(--border)" }}>
                <h3 className="font-bold text-lg mb-1" style={{ color: "var(--foreground)" }}>
                  {competition?.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  📍 {competition?.location} • 📅 {competition?.date}
                </p>
              </div>

              {/* Event Results */}
              <div className="p-4 space-y-3">
                {/* Sort the results to gold medal first, bronze next, then final first */}
                {compResults.sort((a, b) => {
                  const getMedalValue = (rank: number | string, stage: string) => {
                    const r = Number(rank);
                    const s = (stage || '').toLowerCase();
                    if (r === 1 && (s.includes('final') || s.includes('medal'))) return 1;
                    if (r === 2 && (s.includes('final') || s.includes('medal'))) return 2;
                    if (r === 3 && (s.includes('final') || s.includes('medal'))) return 3;
                    if (s.includes('final') || s.includes('medal')) return 4;
                    return 5;
                  };
                  const aVal = getMedalValue(a.athlete_result.rank, a.event_stage || '');
                  const bVal = getMedalValue(b.athlete_result.rank, b.event_stage || '');
                  if (aVal !== bVal) return aVal - bVal;
                  // fallback: sort by total_score descending when medal priority is equal
                  const aScore = parseFloat(a.athlete_result.total_score || '0');
                  const bScore = parseFloat(b.athlete_result.total_score || '0');
                  return bScore - aScore;
                }).map((result, idx) => {
                  const resultId = `${key}-${idx}`;
                  const isExpanded = expandedResults.has(resultId);
                  const isFinal = result.event_stage.toLowerCase().includes('final') || result.event_stage.toLowerCase().includes('medal');
                  const medal = isFinal ? getMedalIcon(result.athlete_result.rank) : null;

                  return (
                    <div key={resultId} className="rounded-lg border p-4" 
                      style={{ 
                        background: isFinal ? "rgba(255, 107, 53, 0.05)" : "var(--glass)",
                        borderColor: isFinal ? "var(--accent)" : "var(--border)"
                      }}>
                      {/* Result Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold"
                            style={getMedalStyle(result.athlete_result.rank)}>
                            {medal || result.athlete_result.rank}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm md:text-base mb-1" style={{ color: "var(--foreground)" }}>
                              {result.event_format}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{ background: getStageColor(result.event_stage), color: "white" }}>
                                {result.event_stage}
                              </span>
                              {result.athlete_result.result_type === 'team' && (
                                <span className="text-xs px-2 py-1 rounded-full"
                                  style={{ background: "var(--glass)", color: "var(--muted)" }}>
                                  Team
                                </span>
                              )}
                              {result.athlete_result.remarks && (
                                <span className="text-xs px-2 py-1 rounded-full font-medium"
                                  style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                                  {result.athlete_result.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {result.athlete_result.total_score && (
                          <div className="text-right ml-2">
                            <div className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                              {result.athlete_result.total_score}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Team Members */}
                      {result.athlete_result.team_members && result.athlete_result.team_members.length > 0 && (
                        <div className="mt-3 p-2 rounded" style={{ background: "var(--glass)" }}>
                          <p className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                            Team: {result.athlete_result.team_name}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.athlete_result.team_members.map((member) => (
                              <span key={member.athlete_id} className="text-xs px-2 py-1 rounded"
                                style={{ background: "var(--surface)", color: "var(--foreground)" }}>
                                {member.athlete_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expandable Series Scores */}
                      {result.athlete_result.series_scores && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleExpand(resultId)}
                            className="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ color: "var(--primary)" }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Series Scores
                          </button>
                          {isExpanded && (
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                              {Object.entries(result.athlete_result.series_scores)
                                .sort(([a], [b]) => {
                                  const numA = parseInt(a.replace('series_', ''));
                                  const numB = parseInt(b.replace('series_', ''));
                                  return numA - numB;
                                })
                                .map(([series, score]) => (
                                  <div key={series} className="text-center p-2 rounded"
                                    style={{ background: "var(--surface)" }}>
                                    <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                                      {series.replace('series_', 'S')}
                                    </div>
                                    <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                                      {score}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AthleteResultsDisplay;