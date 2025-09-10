"use client";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    async function fetchCalendar() {
      const res = await fetch("/data/calendars/athletics_2025.json");
      const data = await res.json();
      setCalendar(data);
      setMonths(["All", ...(data ?? []).map((m: any) => m.month)]);
    }
    fetchCalendar();
  }, []);

  // Filter by month
  const filtered = month === "All"
    ? calendar // all events
    : calendar.filter((t: any) => t.month === month);

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
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex-1">
                <div className="font-semibold text-blue-900 text-base">{event.title}</div>
                <div className="text-xs text-gray-600">{event.location}</div>
                <div className="text-xs text-gray-500">{event.start_date}  -  {event.end_date}</div>
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
      {/* Right panel: event details */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Athletics 2025 Calendar</h1>
        {selectedEvent ? (
          <div>
            <div className="mb-2 text-xl font-bold text-blue-900">{selectedEvent.name}</div>
            <div className="mb-2 text-gray-700">{selectedEvent.start_date} to {selectedEvent.end_date}</div>
            <div className="text-gray-600 mb-6">Location: {selectedEvent.location}</div>
            
            {/* PDF Upload and Extract Section */}
            <div className="mt-8 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Extract Results from PDF</h3>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <button
                  onClick={handleExtract}
                  disabled={!file}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Extract Text
                </button>
                
                {error && <div className="text-red-500 text-sm">{error}</div>}
                
                {result && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Extracted Text:</h4>
                      <button
                        onClick={handleCopy}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
                      {result}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Select an event from the left panel to see more details.</p>
        )}
      </main>
    </div>
  );
}
