"use client";
import { useState } from "react";

function extractIndianMatches(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const matches: any[] = [];
  // Find all match cards
  const matchCards = doc.querySelectorAll("app-match-card");
  matchCards.forEach((card) => {
    // Get round/event
    const roundElem = card.querySelector("h1");
    const round = roundElem ? roundElem.textContent?.trim() : "";
    // Get player names and countries
    const playerElems = card.querySelectorAll(".match_player_name");
    if (playerElems.length < 2) return;
    const getPlayer = (el: Element) => {
      const name =
        el.querySelector("app-mask-competitor-name span")?.textContent?.trim() ||
        "";
      const countryFlag =
        el.querySelector("app-country-flag span")?.getAttribute("title") || "";
      return { name, country: countryFlag };
    };
    const player1 = getPlayer(playerElems[0]);
    const player2 = getPlayer(playerElems[1]);
    // Only include matches with Indian athletes
    if (player1.country !== "IND" && player2.country !== "IND") return;
    // Get overall score
    const scoreElem = card.querySelector(".match_overall_big_score");
    const score = scoreElem ? scoreElem.textContent?.trim() : "";
    // Format: Player 1 Country Player 1 Score - Score Player 2 Country
    matches.push({
      round,
      event: round,
      formatted: `${player1.name} (${player1.country}) ${score} ${player2.name} (${player2.country})`,
    });
  });
  // Group by round/event
  const grouped: Record<string, string[]> = {};
  matches.forEach((m) => {
    if (!grouped[m.round]) grouped[m.round] = [];
    grouped[m.round].push(m.formatted);
  });
  let output = "";
  Object.entries(grouped).forEach(([round, matches]) => {
    output += `=== ${round} ===\n`;
    output += matches.join("\n") + "\n\n";
  });
  console.log("Extracted Results:", output);
  return output.trim();
}

export default function TableTennisPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  function handleExtract() {
    try {
      setResult(extractIndianMatches(input));
      setError("");
    } catch {
      setError("Invalid HTML content");
      setResult("");
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">
        Table Tennis Data Extractor
      </h1>
      <textarea
        className="w-full h-40 p-2 border border-blue-400 rounded mb-4 text-black focus:ring-2 focus:ring-blue-500 transition-all duration-300"
        placeholder="Paste HTML content here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="bg-blue-700 text-white px-4 py-2 rounded mr-2 hover:bg-blue-900 transition-colors duration-300"
        onClick={handleExtract}
      >
        Extract
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {result && (
        <div className="mt-6 bg-blue-50 text-blue-900 rounded shadow p-4 relative transition-colors duration-300">
          <pre className="whitespace-pre-wrap break-words">{result}</pre>
          <button
            className="absolute top-2 right-2 bg-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-400 transition-colors duration-300"
            onClick={handleCopy}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
