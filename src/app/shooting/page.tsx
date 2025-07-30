"use client";
import { useState } from "react";

export default function ShootingPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function extractIndianShootingResultsFromHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const tables = doc.querySelectorAll("table.result_xml_resulttable");
    // eslint-disable-next-line prefer-const
    let results: string[] = [];
    tables.forEach((table) => {
      const rows = table.querySelectorAll("tbody > tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 13) {
          const noc = cells[3].textContent?.trim();
          if (noc === "IND") {
            const rank = cells[0].textContent?.trim() || "";
            let name = cells[2].textContent?.replace(/\u00a0/g, " ").trim() || "";
            // Convert "LASTNAME Firstname" to "Firstname LASTNAME"
            if (name.includes(" ")) {
              const [last, first] = name.split(/\s+/, 2);
              name = `${first} ${last}`;
            }
            const totalScore = cells[9].textContent?.trim() || "";
            const remarksRaw = (cells[11].textContent?.trim() || "") + (cells[10].textContent?.trim() ? ` ${cells[10].textContent?.trim()}` : "");
            const remarks = remarksRaw.trim();
            const remarksPart = remarks ? ` - ${remarks}` : "";
            results.push(`${rank}. ${name}\nTotal: ${totalScore}${remarksPart}`);
          }
        }
      });
    });
    return results.length
      ? results.join("\n\n")
      : "No Indian results found.";
  }

  function handleExtract() {
    try {
      const formatted = extractIndianShootingResultsFromHtml(input);
      setResult(formatted);
      setError("");
    } catch {
      setError("Invalid HTML content");
      setResult("");
    }
  }

  // Add API call for server-side fetch
  async function handleExtractFromUrl() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/shooting-indian-results?url=" + encodeURIComponent(url));
      if (!res.ok) throw new Error("Failed to fetch URL");
      const data = await res.json();
      if (data.html) {
        const formatted = extractIndianShootingResultsFromHtml(data.html);
        setResult(formatted);
      } else {
        setError("No HTML content returned from server");
      }
    } catch {
      setError("Could not extract data from URL");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">
        Shooting Data Extractor
      </h1>
      <div className="mb-4">
        <input
          type="text"
          className="w-full p-2 border border-blue-400 rounded text-black focus:ring-2 focus:ring-blue-500 transition-all duration-300 mb-2"
          placeholder="Paste webpage URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded mr-2 hover:bg-blue-900 transition-colors duration-300"
          onClick={handleExtractFromUrl}
          disabled={loading || !url}
        >
          {loading ? "Extracting..." : "Extract from URL"}
        </button>
      </div>
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
  );
}
