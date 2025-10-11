"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/ui/EventCard";
import { useSession } from "next-auth/react";
import { filterIndianResults } from "../../utils/badmintonIndianResults";
import { getTournamentResults } from "@/services/badmintonService";
import TournamentResults from "@/components/badminton/TournamentResults";
import TournamentActions from "@/components/badminton/TournamentActions";
import { isAdmin } from "@/config/auth";

interface Tournament {
  id: number;
  code: string;
  name: string;
  category: string;
  prize_money: string;
  start_date: string;
  end_date: string;
  location: string;
  logo: string;
  is_etihad: boolean;
}

// Helper to check if an event is live
function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

// Helper to get the month name from a date string
function getMonth(dateStr: string) {
  return new Date(dateStr).toLocaleString('default', { month: 'long' });
}

export default function BadmintonPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Tournament | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [tournamentResults, setTournamentResults] = useState<any>({});
  const [indianResults, setIndianResults] = useState<Record<string, string[]>>({});
  const [copySuccess, setCopySuccess] = useState("");
  // Removed unused copyBlockRef

  useEffect(() => {
    async function fetchTournaments() {
      const res = await fetch("/data/calendars/badminton_2025.json");
      const data: Tournament[] = await res.json();
      setTournaments(data);
      
      // Get unique months from tournament dates
      const uniqueMonths = Array.from(new Set(
        data.map(t => getMonth(t.start_date))
      )).sort((a, b) => {
        const monthOrder = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });
      setMonths(["All", ...uniqueMonths]);
      
      // Preselect live event if present
      const live = data.find(t => isLive(t.start_date, t.end_date));
      if (live) {
        setSelectedEvent(live);
        const dates = getEventDates(live.start_date, live.end_date);
        const today = new Date().toISOString().slice(0, 10);
        setSelectedDate(dates.includes(today) ? today : dates[0]);
      }
    }
    fetchTournaments();
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
  const liveEvent = tournaments.find(t => isLive(t.start_date, t.end_date));

  // Fetch Firebase results for a tournament
  async function fetchFirebaseResults(tournamentCode: string) {
    setFetching(true);
    setFetchError("");
    try {
      const results = await getTournamentResults(tournamentCode);
      setTournamentResults(results);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch tournament results");
    } finally {
      setFetching(false);
    }
  }

  // Fetch BWF results for a specific date
  async function fetchBWFResults() {
    if (!selectedEvent || !selectedDate) return;
    
    try {
      const url = `https://extranet-lv.bwfbadminton.com/api/tournaments/day-matches?tournamentCode=${selectedEvent.code}&date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch BWF results");
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
      setIndianResults(grouped);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch BWF results");
    }
  }

  // When a tournament is clicked
  function handleSelectEvent(event: Tournament) {
    console.log('Selected event:', event);
    setSelectedEvent(event);
    const dates = getEventDates(event.start_date, event.end_date);
    // Default to today if in range, else first date
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(dates.includes(today) ? today : dates[0]);
    setIndianResults({});
    setFetchError("");
    
    // Immediately fetch Firebase results when tournament is selected
    fetchFirebaseResults(event.code);
  }

  // Filter by month
  const filtered = month === "All"
    ? tournaments
    : tournaments.filter(t => getMonth(t.start_date) === month);

  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.email);

  return (
  <div className="flex min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Left panel calendar */}
  <aside className="w-96 border-r p-4 bg-slate-50 border-slate-200 overflow-y-auto">
        {/* Filter by Month */}
        <div className="mb-2">
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--muted)" }}>Filter by Month</label>
          <select
            className="w-full p-2 rounded"
            style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}
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
            <EventCard
              key={event.id}
              id={event.id}
              name={event.name}
              location={event.location}
              startDate={event.start_date}
              endDate={event.end_date}
              logo={event.logo}
              accentColor={selectedEvent?.id === event.id ? "var(--primary)" : "var(--muted-2)"}
              isLive={isLive(event.start_date, event.end_date)}
              onClick={() => handleSelectEvent(event)}
              className={selectedEvent?.id === event.id ? "ring-2" : ""}
            />
          ))}
        </div>
      </aside>
      {/* Right panel: event details and results */}
  <main className="flex-1 p-8" style={{ background: "var(--background)" }}>
  <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--primary)" }}>Badminton 2025</h1>
        {liveEvent && (
          <div className="mb-4 font-semibold" style={{ color: "var(--success)" }}>Live: {liveEvent.name}</div>
        )}
        {selectedEvent ? (
          <div>
            <div className="mb-2 text-xl font-bold" style={{ color: "var(--primary)" }}>{selectedEvent.name}</div>
            <div className="mb-2" style={{ color: "var(--muted)" }}>{formatDate(selectedEvent.start_date.slice(0,10))} to {formatDate(selectedEvent.end_date.slice(0,10))}</div>
            
            {/* Tournament Results Section */}
            <div className="mb-8">
              {fetchError && <div className="mb-4" style={{ color: "var(--danger)" }}>{fetchError}</div>}
              <TournamentResults results={tournamentResults} isLoading={fetching} />
            </div>

            {/* Indian Players Section - Only visible to admin */}
            {userIsAdmin && (
              <div className="mt-8 border-t pt-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--primary)" }}>Indian Players Results</h2>
                <TournamentActions
                  tournament={selectedEvent}
                  onFetchDaily={fetchBWFResults}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  isLoading={fetching}
                />

                {Object.keys(indianResults).length > 0 ? (
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
                      <div key={round} className="border rounded p-2" style={{ background: "var(--surface)", borderColor: "var(--primary)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" style={{ color: "var(--primary)" }}>{round}</span>
                          <button
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "var(--primary)", color: "var(--surface)" }}
                            onClick={() => {
                              if (preEl) {
                                navigator.clipboard.writeText(preEl.innerText);
                                setCopySuccess(`Copied ${round}!`);
                                setTimeout(() => setCopySuccess("") , 1500);
                              }
                            }}
                          >Copy</button>
                          {copySuccess === `Copied ${round}!` && <span className="text-xs" style={{ color: "var(--success)" }}>Copied!</span>}
                        </div>
                        <pre ref={el => { preEl = el; }} className="text-xs rounded p-2 max-h-48 overflow-auto select-all cursor-pointer whitespace-pre-wrap" style={{ background: "var(--glass)", color: "var(--muted)" }}>
{sortedResults.join('\n')}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--muted-2)" }}>Select an event from the left panel to see more details.</p>
        )}
      </main>
    </div>
  );
}
