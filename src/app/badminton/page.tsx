"use client";
import { useEffect, useState } from "react";
import { filterIndianResults } from "../../utils/badmintonIndianResults";
import Image from "next/image";

// Helper to check if an event is live
function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

export default function BadmintonPage() {
  const [calendar, setCalendar] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [indianResults, setIndianResults] = useState<any>({}); // { [roundName]: string[] }
  const [copySuccess, setCopySuccess] = useState("");
  // Removed unused copyBlockRef

  useEffect(() => {
    async function fetchCalendar() {
      const res = await fetch("/data/calendars/badminton_2025.json");
      const data = await res.json();
      setCalendar(data.results);
      setMonths(["All", ...data.results.map((m: any) => m.month)]);
      // Preselect live event if present
      const allTournaments = data.results.flatMap((m: any) => m.tournaments);
      const live = allTournaments.find((t: any) => isLive(t.start_date, t.end_date));
      if (live) {
        setSelectedEvent(live);
        const dates = getEventDates(live.start_date, live.end_date);
        const today = new Date().toISOString().slice(0, 10);
        setSelectedDate(dates.includes(today) ? today : dates[0]);
      }
    }
    fetchCalendar();
  }, []);
  // Helper to get all dates between start and end (inclusive)
  function getEventDates(start: string, end: string) {
    const dates = [];
    const d = new Date(start.slice(0, 10));
    const endDate = new Date(end.slice(0, 10));
    while (d <= endDate) {
      dates.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Find live event
  const liveEvent = calendar
    .flatMap((m: any) => m.tournaments)
    .find((t: any) => isLive(t.start_date, t.end_date));

  // When a calendar event is clicked
  function handleSelectEvent(event: any) {
    setSelectedEvent(event);
    const dates = getEventDates(event.start_date, event.end_date);
    // Default to today if in range, else first date
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(dates.includes(today) ? today : dates[0]);
    setIndianResults({});
    setFetchError("");
  }

  // Fetch matches for selected event/date
  async function handleFetchMatches() {
    if (!selectedEvent || !selectedDate) return;
    setFetching(true);
    setFetchError("");
    setIndianResults({});
    try {
      const url = `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches?tournamentCode=${selectedEvent.code}&date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      // Group matches by roundName first
      const roundGroups: { [round: string]: any[] } = {};
      (data || []).forEach((match: any) => {
        if (!match.roundName) return;
        if (!roundGroups[match.roundName]) roundGroups[match.roundName] = [];
        roundGroups[match.roundName].push(match);
      });
      // For each group, filter Indian results
      const grouped: { [round: string]: string[] } = {};
      Object.entries(roundGroups).forEach(([round, matches]) => {
        const results = filterIndianResults(matches as any[]);
        if (results.length > 0) grouped[round] = results;
      });
      console.log("Filtered Indian Results:", grouped);
      setIndianResults(grouped);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch results");
    } finally {
      setFetching(false);
    }
  }

  // Filter by month
  const filtered = month === "All"
    ? calendar.flatMap((m: any) => m.tournaments.map((t: any) => ({ ...t, month: m.month })))
    : (calendar.find((m: any) => m.month === month)?.tournaments.map((t: any) => ({ ...t, month })) || []);

  return (
    <div className="flex min-h-screen">
      {/* Left panel calendar */}
      <aside className="w-96 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        {/* Filter by Month */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Filter by Month</label>
          <select
            className="w-full p-2 border border-blue-400 rounded text-black"
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-4">
          {filtered.map((event: any) => (
            <button
              key={event.id}
              className={`flex items-center gap-4 w-full text-left bg-white rounded shadow p-3 relative border border-blue-100 hover:bg-blue-50 focus:outline-none ${selectedEvent?.id === event.id ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => handleSelectEvent(event)}
            >
              <Image src={event.logo} alt={event.name} width={56} height={56} className="h-14 w-14 object-contain rounded bg-gray-100" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900 text-base">{event.name}</div>
                <div className="text-xs text-gray-600">{event.location}</div>
                <div className="text-xs text-gray-500">{event.date}</div>
              </div>
              {isLive(event.start_date, event.end_date) && (
                <span className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold text-green-600">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>LIVE
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>
      {/* Right panel: event details and results */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Badminton 2025 Calendar</h1>
        {liveEvent && (
          <div className="mb-4 text-green-700 font-semibold">Live Event: {liveEvent.name}</div>
        )}
        {selectedEvent ? (
          <div>
            <div className="mb-2 text-xl font-bold text-blue-900">{selectedEvent.name}</div>
            <div className="mb-2 text-gray-700">{formatDate(selectedEvent.start_date.slice(0,10))} to {formatDate(selectedEvent.end_date.slice(0,10))}</div>
            {/* Date dropdown and fetch button */}
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-semibold">Select Date:</label>
              <select
                className="p-2 border border-blue-400 rounded text-black"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              >
                {getEventDates(selectedEvent.start_date, selectedEvent.end_date).map(date => (
                  <option key={date} value={date}>{formatDate(date)}</option>
                ))}
              </select>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                onClick={handleFetchMatches}
                disabled={fetching}
              >Fetch</button>
            </div>
            {fetching && <div className="text-blue-600">Fetching results...</div>}
            {fetchError && <div className="text-red-600">{fetchError}</div>}
            {Object.keys(indianResults).length > 0 ? (
              <div className="mt-4">
                <div className="font-semibold mb-2">Indian Player Results (grouped by round):</div>
                <div className="space-y-4">
                  {Object.entries(indianResults).map(([round, results]) => {
                    if (!Array.isArray(results) || results.length === 0) return null;
                    let preEl: HTMLPreElement | null = null;
                    // Sort: victories first, then losses
                    const sortedResults = [...results].sort((a, b) => {
                      const isWin = (s: string) => /\bwin\b|\bdef\b|\bdefeated\b|\bbeat\b|\bwon\b/i.test(s);
                      const aWin = isWin(a);
                      const bWin = isWin(b);
                      if (aWin === bWin) return 0;
                      return aWin ? -1 : 1;
                    });
                    return (
                      <div key={round} className="border border-blue-200 rounded p-2 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-blue-700">{round}</span>
                          <button
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                            onClick={() => {
                              if (preEl) {
                                navigator.clipboard.writeText(preEl.innerText);
                                setCopySuccess(`Copied ${round}!`);
                                setTimeout(() => setCopySuccess("") , 1500);
                              }
                            }}
                          >Copy</button>
                          {copySuccess === `Copied ${round}!` && <span className="text-green-600 text-xs">Copied!</span>}
                        </div>
                        <pre ref={el => { preEl = el; }} className="text-xs bg-gray-100 rounded p-2 max-h-48 overflow-auto select-all cursor-pointer whitespace-pre-wrap">
{sortedResults.join('\n')}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-gray-600">Select an event from the left panel to see more details.</p>
        )}
      </main>
    </div>
  );
}
