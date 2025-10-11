"use client";
import CompetitionResults from "@/components/tabletennis/CompetitionResults";
import { useEffect, useState } from "react";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";

function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
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
      // sort by StartDateTime
      data.sort((a: any, b: any) => new Date(a.StartDateTime).getTime() - new Date(b.StartDateTime).getTime());
      const rows = data || [];
      setEvents(rows);
      // Extract unique months
      const monthSet = new Set<string>();
      const catSet = new Set<string>();
      rows.forEach((ev: any) => {
        const m = new Date(ev.StartDateTime).toLocaleString('default', { month: 'long' });
        monthSet.add(m);
        if (ev.Event_Tier_Name) catSet.add(ev.Event_Tier_Name);
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
    const catMatch = category === "All" || ev.Event_Tier_Name === category;
    return monthMatch && catMatch;
  });

  // Find all live events
  const liveEvents = events.filter(ev => isLive(ev.StartDateTime, ev.EndDateTime));

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Consistent Calendar Sidebar */}
      <aside className="w-96 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--muted)" }}>Filter by Month</label>
          <select
            className="w-full p-2 rounded mb-2"
            style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--muted)" }}>Filter by Category</label>
          <select
            className="w-full p-2 rounded"
            style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}
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
            const key = event.EventId ? `${event.EventId}_${idx}` : `event_${idx}`;
            return (
              <EventCard
                key={key}
                id={event.EventId}
                name={event.EventName}
                location={`${event.City}, ${event.Country}`}
                startDate={event.StartDateTime}
                endDate={event.EndDateTime}
                accentColor={selectedEvent?.EventId === event.EventId ? "var(--primary)" : "var(--muted-2)"}
                isLive={isLive(event.StartDateTime, event.EndDateTime)}
                onClick={() => handleCalendarClick(event)}
                className={selectedEvent?.EventId === event.EventId ? "ring-2" : ""}
              />
            );
// Helper to determine if event is live
function isLive(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}
          })}
        </div>
      </aside>
      {/* Consistent Main Layout */}
      <main className="flex-1 p-8 flex flex-col gap-8" style={{ background: "var(--background)" }}>
        <div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--primary)" }}>Table Tennis</h1>
          <div className="mb-4 font-semibold text-lg" style={{ color: "var(--success)" }}>Live Events</div>
          {liveEvents.length > 0 ? (
            <div className="flex space-x-2 mb-8">
              {liveEvents.map((ev, idx) => {
                const key = ev.EventId ? `${ev.EventId}_${idx}` : `live_${idx}`;
                return (
                  <EventCard
                    key={key}
                    id={ev.EventId}
                    name={ev.EventName}
                    location={`${ev.City}, ${ev.Country}`}
                    startDate={ev.StartDateTime}
                    endDate={ev.EndDateTime}
                    accentColor={"var(--primary)"}
                    isLive={isLive(ev.StartDateTime, ev.EndDateTime)}
                    onClick={() => handleCalendarClick(ev)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mb-8" style={{ color: "var(--muted-2)" }}>No live events at the moment.</div>
          )}
        </div>
        <div>
          {/* Display selected event Results */}
          {selectedEvent && (
            <CompetitionResults {...selectedEvent} />
          )}
        </div>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--primary)" }}>Indian Results Extractor</h2>
          <textarea
            className="w-full h-40 p-2 rounded mb-4 focus:ring-2 transition-all duration-300"
            style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}
            placeholder="Paste HTML content here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button variant="primary" className="mr-2" onClick={handleExtract}>
            Extract
          </Button>
          {error && <div className="mt-2" style={{ color: "var(--danger)" }}>{error}</div>}
          {result && (
            <div className="mt-6 rounded shadow p-4 relative transition-colors duration-300" style={{ background: "var(--glass)", color: "var(--primary)" }}>
              <pre className="whitespace-pre-wrap break-words">{result}</pre>
              <button
                className="absolute top-2 right-2 px-2 py-1 rounded text-xs transition-colors duration-300"
                style={{ background: "var(--primary)", color: "var(--surface)" }}
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
