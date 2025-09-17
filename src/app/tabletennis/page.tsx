"use client";
import CompetitionResults from "@/components/tabletennis/CompetitionResults";
import { useEffect, useState } from "react";

function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

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
  return output.trim();
}

export default function TableTennisPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleCalendarClick = (event: any) => {
    console.log("clicked event", event);
    setSelectedEvent(event);
};

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

  useEffect(() => {
    async function fetchCalendar() {
      const res = await fetch("/data/calendars/tabletennis_2025.json");
      const data = await res.json();
      const rows = data || [];
      setEvents(rows);
      // Extract unique months
      const monthSet = new Set<string>();
      const catSet = new Set<string>();
      rows.forEach((ev: any) => {
        const m = new Date(ev.StartDateTime).toLocaleString('default', { month: 'long' });
        monthSet.add(m);
        if (ev.EventType) catSet.add(ev.EventType);
      });
      setMonths(["All", ...Array.from(monthSet)]);
      setCategories(["All", ...Array.from(catSet)]);
    }
    fetchCalendar();
  }, []);

  // Filter events by month and category
  const filtered = events.filter(ev => {
    const eventMonth = new Date(ev.StartDateTime).toLocaleString('default', { month: 'long' });
    const monthMatch = month === "All" || eventMonth === month;
    const catMatch = category === "All" || ev.EventType === category;
    return monthMatch && catMatch;
  });

  // Find all live events
  const liveEvents = events.filter(ev => isLive(ev.StartDateTime, ev.EndDateTime));

  return (
    <div className="flex min-h-screen">
      {/* Left panel calendar */}
      <aside className="w-96 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        {/* Filters */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Filter by Month</label>
          <select
            className="w-full p-2 border border-blue-400 rounded text-black mb-2"
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label className="block text-sm font-semibold mb-1">Filter by Category</label>
          <select
            className="w-full p-2 border border-blue-400 rounded text-black"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-4">
          {filtered.map((event: any, idx: number) => {
            // Use a unique key: EventId if present, else fallback to index
            const key = event.EventId ? `${event.EventId}_${idx}` : `event_${idx}`;
            return (
              <div
                key={key}
                className={`flex flex-col bg-white rounded shadow p-3 relative border border-blue-100 hover:bg-blue-50`}
                onClick={() => handleCalendarClick(event)}
              >
                <div className="font-semibold text-blue-900 text-base">{event.EventName}</div>
                <div className="text-xs text-gray-600">{event.City}, {event.Country}</div>
                <div className="text-xs text-gray-500">{formatDate(event.StartDateTime)} to {formatDate(event.EndDateTime)}</div>
                <div className="text-xs text-gray-500">{event.EventType}</div>
                {isLive(event.StartDateTime, event.EndDateTime) && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold text-green-600">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>LIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      {/* Right panel: live events */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Table Tennis 2025 Calendar</h1>
        <div className="mb-4 font-semibold text-lg text-green-700">Live Events</div>
        {liveEvents.length > 0 ? (
          <div className="space-y-4 mb-8">
            {liveEvents.map((ev, idx) => {
              const key = ev.EventId ? `${ev.EventId}_${idx}` : `live_${idx}`;
              return (
                <div key={key} className="border border-green-300 rounded p-3 bg-white">
                  <div className="font-semibold text-blue-900">{ev.EventName}</div>
                  <div className="text-xs text-gray-600">{ev.City}, {ev.Country}</div>
                  <div className="text-xs text-gray-500">{formatDate(ev.StartDateTime)} to {formatDate(ev.EndDateTime)}</div>
                  <div className="text-xs text-gray-500">{ev.EventType}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-600 mb-8">No live events at the moment.</div>
        )}

{/* Display selected event Results */}
        <div>
      {selectedEvent && (
        <CompetitionResults selectedCompetition={selectedEvent.EventId} />
      )}
    </div>
        {/* Extractor UI */}
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h2 className="text-xl font-bold mb-4 text-blue-800">Indian Results Extractor</h2>
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
      </main>
    </div>
  );
}
