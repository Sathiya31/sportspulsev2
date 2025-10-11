"use client";

import { useState, useEffect } from "react";
import { IssfScheduleDisplay, parseIssfScheduleHtml } from "../../components/IssfSchedule";
import EventCard from "@/components/ui/EventCard";
import ShootingResults from "../../components/shooting/results";

interface ShootingEvent {
  event_name: string;
  start_date: string;
  end_date: string;
  location: string;
  hyperlink: string;
  competition_code?: string;
}

export default function ShootingPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [events, setEvents] = useState<ShootingEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'Results' | 'Schedule' | 'Extractor'>('Results');
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/calendars/shooting_2025.json")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]));
  }, []);

  async function handleTableClick(tabName: 'Results' | 'Schedule' | 'Extractor') {
    setActiveTab(tabName);
    if (tabName === 'Schedule' && selectedCompetition && !selectedSchedule) {
      setSelectedSchedule('Loading...');
      try {
        const url = `/api/shooting-indian-results?url=${encodeURIComponent(`https://www.issf-sports.org/competitions/${selectedCompetition}/schedule`)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch schedule');
        const { html } = await res.json();
        const schedule = parseIssfScheduleHtml(html);
        setSelectedSchedule(schedule);
      } catch {
        setSelectedSchedule('Could not fetch schedule.');
      }
    }
  }

  // Stub handlers for extractor tab
  async function handleExtractFromUrl() {
    // TODO: Implement extraction from URL
    setLoading(true);
    setError("");
    setResult("");
    setTimeout(() => {
      setLoading(false);
      setResult("Stub: Extracted data from URL");
    }, 1000);
  }

  async function handleExtract() {
    // TODO: Implement extraction from HTML
    setError("");
    setResult("");
    setTimeout(() => {
      setResult("Stub: Extracted data from HTML");
    }, 1000);
  }

  function handleCopy() {
    // TODO: Implement copy to clipboard
    if (result) {
      navigator.clipboard.writeText(result);
    }
  }

  async function handleCardClick(item: ShootingEvent) {
    setSelectedCompetition(item?.competition_code || null);
    setActiveTab('Results');
  }

  function isLive(startDate: string, endDate: string) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Calendar Sidebar */}
      <aside className="w-96 h-fit p-4 border-r border-slate-200 bg-slate-50">
        <h2 className="text-xl font-bold my-3" style={{ color: "var(--primary)" }}>2025 Calendar</h2>
        <div className="mb-2">
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 pl-10 rounded-xl transition-all duration-300"
              style={{ background: "var(--glass)", borderColor: "var(--muted-2)", color: "var(--foreground)" }}
              placeholder="Filter events..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="grid gap-1">
          {events
            .filter((item: ShootingEvent) =>
              item.event_name.toLowerCase().includes(filter.toLowerCase()) ||
              item.location.toLowerCase().includes(filter.toLowerCase()) ||
              item.start_date.includes(filter) ||
              item.end_date.includes(filter)
            )
            .map((item: ShootingEvent, idx: number) => (
              <EventCard
                key={item.competition_code || idx}
                id={item.competition_code || idx}
                name={item.event_name}
                location={item.location}
                startDate={item.start_date}
                endDate={item.end_date}
                accentColor={selectedCompetition === item.competition_code ? "var(--primary)" : "var(--muted-2)"}
                isLive={isLive(item.start_date, item.end_date)}
                onClick={() => handleCardClick(item)}
                className={selectedCompetition === item.competition_code ? "ring-2" : ""}
              />
            ))}
        </div>
      </aside>
      {/* Main Content with Tabs */}
      <div className="flex-1 p-8" style={{ background: "var(--background)" }}>
        <div className="mb-2 flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
          {(['Results', 'Schedule', 'Extractor'] as const).map(tab => (
            <button
              key={tab}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 
                ${activeTab === tab 
                  ? 'bg-white dark:bg-gray-700 text-primary dark:text-accent shadow-lg transform scale-[1.02]' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
              onClick={() => handleTableClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="card min-h-[400px]">
          {activeTab === 'Schedule' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Competition Schedule</h2>
              {Array.isArray(selectedSchedule) ? (
                <IssfScheduleDisplay schedule={selectedSchedule as any[]} />
              ) : selectedSchedule === 'Loading...' ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : selectedSchedule ? (
                <div className="text-gray-600 dark:text-gray-300">{selectedSchedule}</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-300">
                  <svg className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-medium">Select a competition to view schedule</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'Results' && (
            <ShootingResults selectedCompetition={selectedCompetition} />
          )}
          {activeTab === 'Extractor' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Shooting Data Extractor</h2>
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 
                              rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent 
                              transition-all duration-300"
                    placeholder="Paste webpage URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex gap-4">
                  <button
                    className={`flex-1 ${loading || !url ? 'btn-disabled' : 'btn-primary'}`}
                    onClick={handleExtractFromUrl}
                    disabled={loading || !url}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Extracting...</span>
                      </div>
                    ) : (
                      "Extract from URL"
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 
                              rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent 
                              transition-all duration-300 resize-none"
                    placeholder="Or paste HTML content here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
                <button className="btn-primary w-full" onClick={handleExtract}>Extract from HTML</button>
                {error && (
                  <div className="flex items-center gap-2 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-4 rounded-xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                {result && (
                  <div className="relative mt-6 card">
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-700 dark:text-gray-300">{result}</pre>
                    <button
                      className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
                      onClick={handleCopy}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}