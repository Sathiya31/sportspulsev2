"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import VerticalTabs from "@/components/ui/VerticalTabs";
import ResultsTable from "@/components/ui/ResultsTable";
import { AthleticsEvent } from "@/types/athletics";

// Helper to check if an event is live
function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

// Use AthleticsEvent and AthleticsResult interfaces from types/athletics.ts

export default function AthleticsPage() {
  const [calendar, setCalendar] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // New states for results
  const [groupedResults, setGroupedResults] = useState<Record<string, AthleticsEvent[]>>({});
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [activeEventTab, setActiveEventTab] = useState<string>("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState("");

  useEffect(() => {
    async function fetchCalendar() {
      const res = await fetch("/data/calendars/athletics_2025.json");
      const data = await res.json();
  setCalendar(data as AthleticsEvent[]);
      setMonths([
        "All",
        ...Array.from(
          new Set((data ?? []).map((m: any) => m.month))
        ) as string[],
      ]);
    }
    fetchCalendar();
  }, []);

  // Fetch results from Firebase when event is selected
  useEffect(() => {
    
    console.log("Fetching results for event:", selectedEvent);
    async function fetchResults() {
      if (!selectedEvent?.id) return;

      setLoadingResults(true);
      setResultsError("");
      setGroupedResults({});
      setEventNames([]);
      setActiveEventTab("");

      try {
        // Query Firestore for results matching the tournament ID
        const resultsRef = collection(db, "athletics");
        const q = query(resultsRef, where("tournamentId", "==", selectedEvent.id));
        const querySnapshot = await getDocs(q);

        const fetchedResults: AthleticsEvent[] = [];
        querySnapshot.forEach((doc) => {
          fetchedResults.push({ ...doc.data() } as AthleticsEvent);
        });

        console.log("Fetched Results:", fetchedResults);

        if (fetchedResults.length === 0) {
          setLoadingResults(false);
          return;
        }

        // Group results by event name
        const grouped: Record<string, AthleticsEvent[]> = {};
        fetchedResults.forEach((result) => {
          const eventName = result.eventName || "Unknown Event";
          if (!grouped[eventName]) {
            grouped[eventName] = [];
          }
          grouped[eventName].push(result);
        });

        setGroupedResults(grouped);

        console.log("Grouped Results:", grouped);
        const names = Object.keys(grouped).sort();
        setEventNames(names);

        // Set first event as active by default
        if (names.length > 0) {
          setActiveEventTab(names[0]);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setResultsError("Failed to fetch results from database. Please try again later.");
      } finally {
        setLoadingResults(false);
      }
    }

    fetchResults();
  }, [selectedEvent]);

  // Filter by month
  const filtered = month === "All"
    ? calendar
    : calendar.filter((t: any) => t.month === month);

  // When event is selected
  function handleSelectEvent(event: any) {
    setSelectedEvent(event);
    setIsMobileMenuOpen(false);
  }

  async function handleExtract() {
    if (!file) return;
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
      const reader = new FileReader();
      reader.onload = async function (e) {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items
            .map((item) => 'str' in item ? (item as { str: string }).str : "")
            .join(" ") + "\n";
        }
        setResult(text);
        setError("");
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setError("Failed to extract PDF text. Please ensure the file is a valid PDF.");
      setResult("");
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left panel calendar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-80 md:w-96
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-[var(--surface)] p-4 overflow-y-auto
      `}>
        {/* Filter by Month */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1" style={{ color: "var(--muted)" }}>Filter by Month</label>
          <select
            className="w-full p-2 rounded border"
            style={{ borderColor: "var(--muted-2)" }}
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
              key={event.title + event.start_date}
              id={event.id}
              name={event.title}
              location={event.location}
              startDate={event.start_date}
              endDate={event.end_date}
              accentColor={selectedEvent?.id === event.id ? "var(--primary)" : "var(--muted-2)"}
              isLive={isLive(event.start_date, event.end_date)}
              onClick={() => handleSelectEvent(event)}
              className={selectedEvent?.title === event.title ? "ring-2" : ""}
            />
          ))}
        </div>
      </aside>

      {/* Right panel: event details */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto" style={{ background: "var(--background)" }}>
        {/* Mobile menu button */}
        <button
          className="md:hidden fixed top-15 right-4 z-50 p-2 rounded-lg shadow-lg"
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

        <h1 className="text-xl font-bold mb-4 md:ml-0" style={{ color: "var(--foreground)" }}>Athletics</h1>
        
        {selectedEvent ? (
          <div>
            <div className="mb-2 text-xl font-bold" style={{ color: "var(--primary)" }}>{selectedEvent.title}</div>
            <div className="mb-2 text-sm" style={{ color: "var(--muted)" }}>{selectedEvent.location}, {selectedEvent.start_date} to {selectedEvent.end_date}</div>
            
            
            {/* Results Section */}
            <div className="mb-8 b-r" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {/* <h3 className="text-md font-semibold p-2" style={{ color: "var(--muted)" }}>
                Tournament Results</h3> */}
              
              {loadingResults ? (
                <div>Fetching tournament results...</div>
              ) : resultsError ? (
                <div>{resultsError}</div>
              ) : eventNames.length > 0 ? (
                <div className="flex flex-col md:flex-row">
                  {/* Vertical Tabs */}
                  <VerticalTabs
                    tabs={eventNames}
                    activeTab={activeEventTab}
                    onTabChange={setActiveEventTab}
                  />
                  
                  {/* Results Table */}
                  <div className="flex-1 overflow-x-auto">
                    {/* iterate through grouped results */}
                    {groupedResults[activeEventTab].map((group, index) => (
                      <ResultsTable
                        key={index}
                        results={group.results || []}
                        eventName={activeEventTab}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>No results available for this tournament yet.</div>
              )}
            </div>

            {/* PDF Upload and Extract Section */}
            <div className="mt-8 p-4 border rounded-lg" style={{ background: "var(--glass)", borderColor: "var(--primary)" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--primary)" }}>Extract Results from PDF</h3>
              <div className="space-y-4">
                {/* Custom File Upload Button */}
                <div>
                  <label 
                    htmlFor="pdf-upload" 
                    className="inline-block px-4 py-2 rounded cursor-pointer text-sm font-medium transition-colors"
                    style={{ 
                      background: file ? "var(--muted)" : "var(--primary)", 
                      color: "var(--surface)" 
                    }}
                  >
                    {file ? `Selected: ${file.name}` : "Choose PDF File"}
                  </label>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={handleExtract}
                  disabled={!file}
                  variant={file ? "primary" : "secondary"}
                  className={!file ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Extract Text
                </Button>
                
                {error && (
                  <div className="text-sm p-2 rounded" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}>
                    {error}
                  </div>
                )}
                
                {result && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold" style={{ color: "var(--primary)" }}>Extracted Text:</h4>
                      <button
                        onClick={handleCopy}
                        className="text-sm px-3 py-1 rounded transition-colors hover:opacity-80"
                        style={{ 
                          background: "var(--primary)", 
                          color: "var(--surface)" 
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 rounded border text-sm overflow-auto max-h-48 md:max-h-96 whitespace-pre-wrap break-words" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                      {result}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm mt-20" style={{ color: "var(--muted)" }}>
            Select a tournament from the calendar to see details and results.
          </div>
        )}
      </main>
    </div>
  );
}