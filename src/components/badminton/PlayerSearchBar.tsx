import React, { useState, useRef, useEffect } from "react";
import { toCapitalizedCase } from "@/utils/common";
import { searchAthletes } from "@/services/athleteService";

interface PlayerSearchBarProps {
  sport: string;
  onSelect: (player: any) => void;
  onClear: () => void;
}

const PlayerSearchBar: React.FC<PlayerSearchBarProps> = ({ sport, onSelect, onClear }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    searchAthletes(query, sport).then((res) => {
      setResults(res);
      setShowDropdown(true);
      setLoading(false);
    });
  }, [query, sport]);

  function handleSelect(player: any) {
    onSelect(player);
    setShowDropdown(false);
  }

  function handleClear() {
    onClear();
    setQuery("");
    setShowDropdown(false);
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative w-full max-w-md mx-auto">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--muted)] pointer-events-none">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="w-80 pl-8 pr-2 py-2 border-b-2 border-[var(--primary)] focus:outline-none 
          focus:border-[var(--primary)] transition-all duration-300 text-sm bg-[var(--surface)]"
          style={{ color: "var(--muted)" }}
          placeholder="Search player by name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setShowDropdown(true)}
        />
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded shadow-lg z-20 max-h-64 overflow-y-auto border" style={{ borderColor: "var(--primary)" }}>
          {results.map((player: any) => (
            <button
              key={player.id || player.name}
              className="w-full text-left px-4 py-2 hover:bg-[var(--primary-lighter)] transition-colors"
              style={{ color: "var(--surface)" }}
              onClick={() => handleSelect(player)}
            >
              {toCapitalizedCase(player.name)}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute right-2 top-2">
          <span className="animate-spin h-4 w-4 border-b-2 border-primary inline-block rounded-full"></span>
        </div>
      )}
      {results.length > 0 && (
        <button
          className="absolute right-2 top-2 text-xs px-2 py-1 rounded bg-primary text-white"
          onClick={handleClear}
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default PlayerSearchBar;