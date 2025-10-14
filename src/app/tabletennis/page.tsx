"use client";
import CompetitionResults from "@/components/tabletennis/CompetitionResults";
import { useEffect, useState } from "react";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/config/auth";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);

  const handleCalendarClick = (event: any) => {
    console.log("clicked event", event);
    setSelectedEvent(event);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
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

  function handleLoadData() {
    fetch("/api/tabletennis-extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event_id: selectedEvent?.EventId })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
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

  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.email);

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Consistent Calendar Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-80 md:w-96 
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto
      `}>
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
          })}
        </div>
      </aside>

      {/* Consistent Main Layout */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-3 md:gap-4" style={{ background: "var(--background)" }}>
        {/* Mobile menu button */}
        <button
          className="md:hidden fixed top-20 right-4 z-50 p-2 rounded-lg shadow-lg"
          style={{ background: "var(--surface)", color: "var(--foreground)" }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-3" style={{ color: "var(--primary)" }}>Table Tennis</h1>
          
          {/* Compact Live Events Badges */}
          {liveEvents.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--success)" }}></span>
                <span className="font-semibold text-sm" style={{ color: "var(--success)" }}>Live Now</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {liveEvents.map((ev, idx) => {
                  const key = ev.EventId ? `${ev.EventId}_${idx}` : `live_${idx}`;
                  return (
                    <button
                      key={key}
                      onClick={() => handleCalendarClick(ev)}
                      className="px-3 py-1.5 rounded-full text-sm hover:opacity-80 transition-opacity"
                      style={{ 
                        background: selectedEvent?.EventId === ev.EventId ? "var(--primary)" : "var(--glass)",
                        color: selectedEvent?.EventId === ev.EventId ? "var(--surface)" : "var(--primary)",
                        border: `1px solid ${selectedEvent?.EventId === ev.EventId ? "var(--primary)" : "var(--muted-2)"}`
                      }}
                    >
                      {ev.EventName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Display selected event Results or Empty State */}
        <div>
          {selectedEvent ? (
            <CompetitionResults {...selectedEvent} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg 
                className="w-16 h-16 mb-4" 
                style={{ color: "var(--muted-2)" }} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-lg font-medium mb-2" style={{ color: "var(--muted)" }}>
                No Event Selected
              </p>
              <p className="text-sm" style={{ color: "var(--muted-2)" }}>
                Select an event from the calendar to view results
              </p>
            </div>
          )}
        </div>

        {/* Collapsible Extractor for Admins */}
        {userIsAdmin && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--muted-2)" }}>
            <button 
              onClick={() => setShowExtractor(!showExtractor)}
              className="flex items-center gap-2 text-lg font-semibold mb-3 hover:opacity-80 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              <svg 
                className={`w-5 h-5 transition-transform ${showExtractor ? 'rotate-90' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Indian Results Extractor
            </button>
            
            {showExtractor && (
              <div>
              <div className="p-2 space-y-4">
                <p className="bold">Selected Event: {selectedEvent?.EventName} ({selectedEvent?.EventId})</p>
                <Button
                  variant="primary"
                  onClick={handleLoadData}
                  disabled={!selectedEvent}
                  className="text-xs px-3 py-1 rounded transition-colors"
                  >
                    Load Data
                  </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Input Column */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
                    Input HTML
                  </label>
                  <textarea
                    className="w-full h-64 p-3 rounded border focus:ring-2 transition-all duration-300 text-sm"
                    style={{ borderColor: "var(--primary)", color: "var(--foreground)", background: "var(--surface)" }}
                    placeholder="Paste HTML content here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button variant="primary" onClick={handleExtract}>
                      Extract
                    </Button>
                    <Button variant="secondary" onClick={() => { setInput(""); setResult(""); setError(""); }}>
                      Clear
                    </Button>
                  </div>
                  {error && <div className="mt-2 text-sm" style={{ color: "var(--danger)" }}>{error}</div>}
                </div>

                {/* Output Column */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold" style={{ color: "var(--muted)" }}>
                      Extracted Results
                    </label>
                    {result && (
                      <button
                        onClick={handleCopy}
                        className="text-xs px-3 py-1 rounded transition-colors"
                        style={{ 
                          background: "var(--primary)", 
                          color: "var(--surface)" 
                        }}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  {result ? (
                    <pre 
                      className="w-full h-64 p-3 rounded border text-xs overflow-auto whitespace-pre-wrap break-words" 
                      style={{ background: "var(--glass)", color: "var(--muted)", borderColor: "var(--muted-2)" }}
                    >
                      {result}
                    </pre>
                  ) : (
                    <div 
                      className="w-full h-64 flex items-center justify-center rounded border" 
                      style={{ background: "var(--glass)", borderColor: "var(--muted-2)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--muted-2)" }}>
                        Results will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}