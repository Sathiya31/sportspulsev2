"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";
import VerticalTabs from "@/components/ui/VerticalTabs";
import ResultsTable from "@/components/ui/ResultsTable";
import { AthleticsEvent } from "@/types/athletics";
import { useSession } from 'next-auth/react';
import { isAdmin } from "@/config/auth";
import {
  getCalendarEvents,
  getAvailableYears,
  getUniqueMonths,
  filterEventsByMonth,
  isEventLive,
  formatEventDate,
  type CalendarEvent
} from "@/services/calendarService";

// Athletics specific event interface
interface AthleticsCalendarEvent extends CalendarEvent {
  title?: string;
  month?: string;
}

export default function AthleticsPage() {
  // Calendar state
  const [allEvents, setAllEvents] = useState<AthleticsCalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AthleticsCalendarEvent[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AthleticsCalendarEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // PDF extraction state
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  
  // Results state
  const [groupedResults, setGroupedResults] = useState<Record<string, AthleticsEvent[]>>({});
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [activeEventTab, setActiveEventTab] = useState<string>("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState("");

  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.email);

  // Initialize: Load available years
  useEffect(() => {
    async function initializeYears() {
      try {
        const years = await getAvailableYears('athletics');
        setAvailableYears(years);
        
        // Default to current year if available, otherwise first year
        const currentYear = new Date().getFullYear().toString();
        const defaultYear = years.includes(currentYear) ? currentYear : years[0];
        setSelectedYear(defaultYear);
      } catch (error) {
        console.error('Error loading available years:', error);
      }
    }
    
    initializeYears();
  }, []);

  // Load events when year changes
  useEffect(() => {
    if (!selectedYear) return;

    async function loadEventsForYear() {
      try {
        const events = await getCalendarEvents('athletics', selectedYear);
        setAllEvents(events as AthleticsCalendarEvent[]);
        
        // Extract unique months
        const uniqueMonths = getUniqueMonths(events);
        setMonths(uniqueMonths);
        
        // Reset month filter
        setMonth("All");
        
        // Clear selection when year changes
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
    
    loadEventsForYear();
  }, [selectedYear]);

  // Filter events by month
  useEffect(() => {
    const filtered = filterEventsByMonth(allEvents, month) as AthleticsCalendarEvent[];
    setFilteredEvents(filtered);
  }, [allEvents, month]);

  // Fetch results from Firebase when event is selected
  useEffect(() => {
    async function fetchResults() {
      if (!selectedEvent?.id) return;

      console.log("Fetching results for event:", selectedEvent);
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

  // Event selection handler
  function handleSelectEvent(event: AthleticsCalendarEvent) {
    setSelectedEvent(event);
    setIsMobileMenuOpen(false);
  }

  // PDF extraction handlers
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

  const liveEvents = filteredEvents.filter(event => 
    isEventLive(event.start_date, event.end_date)
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed bg-black bg-opacity-50 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Consistent Calendar Sidebar */}
      <aside className={`
        fixed md:static left-0 z-50
        w-80 md:w-96
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-[var(--surface)] border-r border-[var(--border)] p-4 overflow-y-auto
      `}>
        {/* Year Filter */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Filter by Year
          </label>
          <select
            className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{ color: "var(--foreground)" }}
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Filter by Month
          </label>
          <select
            className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{ color: "var(--foreground)" }}
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--muted-2)" }}>
              No events found for {selectedYear}
            </p>
          ) : (
            filteredEvents.map((event, idx) => (
              <EventCard
                key={event.id || `${event.title}_${idx}`}
                id={event.id || idx}
                name={event.title || event.name}
                location={event.location}
                startDate={formatEventDate(event.start_date)}
                endDate={formatEventDate(event.end_date)}
                accentColor={selectedEvent?.id === event.id ? "var(--primary)" : "var(--muted-2)"}
                isLive={isEventLive(event.start_date, event.end_date)}
                onClick={() => handleSelectEvent(event)}
                className={selectedEvent?.id === event.id ? "ring-2" : ""}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8" style={{ background: "var(--background)" }}>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Athletics
            </h1>
            <button
              className="md:hidden p-2 rounded-lg shadow-lg"
              style={{ background: "var(--surface)", color: "var(--foreground)" }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Open calendar menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Compact Live Events Badges */}
        {liveEvents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--warning)" }}></span>
              <span className="font-semibold text-sm" style={{ color: "var(--warning)" }}>Live : </span>
              {liveEvents.map((event, idx) => (
                <button
                  key={event.id || idx}
                  onClick={() => handleSelectEvent(event)}
                  className="px-3 py-1.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                  style={{ 
                    background: "var(--glass)",
                    color: "var(--foreground)",
                    border: `1px solid var(--muted-2)`
                  }}
                >
                  {event.title || event.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Event Details and Results */}
        {selectedEvent ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>
                {selectedEvent.title || selectedEvent.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {selectedEvent.location} • {formatEventDate(selectedEvent.start_date)} - {formatEventDate(selectedEvent.end_date)}
              </p>
            </div>
            
            {/* Results Section */}
            <div className="mb-8 rounded-lg" style={{ background: "var(--surface)" }}>
              {loadingResults ? (
                <div className="p-8 text-center" style={{ color: "var(--muted)" }}>
                  Fetching tournament results...
                </div>
              ) : resultsError ? (
                <div className="p-8 text-center" style={{ color: "var(--danger)" }}>
                  {resultsError}
                </div>
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
                    {groupedResults[activeEventTab]?.map((group, index) => (
                      <ResultsTable
                        key={index}
                        results={group.results || []}
                        eventName={activeEventTab}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center" style={{ color: "var(--muted-2)" }}>
                  No results available for this tournament yet.
                </div>
              )}
            </div>

            {/* PDF Upload and Extract Section - Only for Admins */}
            {userIsAdmin && (
              <div className="mt-8 p-6 border rounded-lg" style={{ background: "var(--glass)", borderColor: "var(--border)" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--primary)" }}>
                  Extract Results from PDF
                </h3>
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
                    <div className="text-sm p-3 rounded" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}>
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
                      <pre className="p-4 rounded border text-sm overflow-auto max-h-48 md:max-h-96 whitespace-pre-wrap break-words" style={{ background: "var(--surface)", color: "var(--muted)", borderColor: "var(--border)" }}>
                        {result}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="shadow-sm rounded-lg" style={{ background: "var(--surface)" }}>
            <div className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                Select an Event
              </h2>
              <p style={{ color: "var(--muted-2)" }}>
                Choose an event from the calendar to view athletics results
              </p>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden mt-6 px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Open Calendar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}