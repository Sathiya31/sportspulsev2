import React from "react";
import type { AthleteData } from "@/services/athleteService";
import AthleteTournamentAccordion from "./PlayerTournamentAccordion";
import { Match } from "@/types/badminton";
import { toCapitalizedCase } from "@/utils/common";

interface PlayerTournamentResultsProps {
  player: AthleteData;
  results: Match[];
  isLoading: boolean;
  error: string;
  onClear: () => void;
}

export default function PlayerTournamentResults({ player, results, isLoading, error, onClear }: PlayerTournamentResultsProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>{toCapitalizedCase(player.name)}&apos;s Tournament Results</span>
      </div>
      {isLoading ? (
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>Loading player results...</div>
      ) : error ? (
        <div className="text-center py-8" style={{ color: "var(--danger)" }}>{error}</div>
      ) : (
        <AthleteTournamentAccordion results={results} selectedPlayer={player.playerId} />
      )}
    </div>
  );
}