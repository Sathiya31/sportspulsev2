"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/ui/EventCard";
import Button from "@/components/ui/Button";

// Helper to check if an event is live
function isLive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
}

export default function AthleticsPage() {
  const [calendar, setCalendar] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("All");
  const [months, setMonths] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchCalendar() {
      const res = await fetch("/data/calendars/athletics_2025.json");
      const data = await res.json();
      setCalendar(data);
      setMonths([
        "All",
        ...Array.from(
          new Set((data ?? []).map((m: any) => m.month))
        ) as string[],
      ]);
    }
    fetchCalendar();
  }, []);

  // Filter by month
  const filtered = month === "All"
    ? calendar // all events
    : calendar.filter((t: any) => t.month === month);

  // When event is selected
  function handleSelectEvent(event: any) {
    setSelectedEvent(event);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
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
          // Only map TextItem types
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
        w-80 md:w-96  max-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        border-r p-4 bg-slate-50 border-slate-200 overflow-y-auto
      `}>
        {/* Filter by Month */}
        <div className="mb-4">
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
      <main className="flex-1 p-4 md:p-8" style={{ background: "var(--background)" }}>
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

        <h1 className="text-2xl font-bold mb-4 ml-12 md:ml-0" style={{ color: "var(--primary)" }}>Athletics 2025 Calendar</h1>
        {selectedEvent ? (
          <div>
            <div className="mb-2 text-xl font-bold" style={{ color: "var(--primary)" }}>{selectedEvent.title}</div>
            <div className="mb-2" style={{ color: "var(--muted)" }}>{selectedEvent.start_date} to {selectedEvent.end_date}</div>
            <div className="mb-6" style={{ color: "var(--muted-2)" }}>Location: {selectedEvent.location}</div>
            
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
                
                {error && <div className="text-sm" style={{ color: "var(--danger)" }}>{error}</div>}
                
                {result && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold" style={{ color: "var(--primary)" }}>Extracted Text:</h4>
                      <button
                        onClick={handleCopy}
                        className="text-sm px-3 py-1 rounded transition-colors"
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
          <p style={{ color: "var(--muted-2)" }}>Select an event from the left panel to see more details.</p>
        )}
      </main>
    </div>
  );
}