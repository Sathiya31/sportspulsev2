import React, { useState } from "react";
import Button from "../ui/Button";

type ShootingExtractorProps = { selectedCompetition: string | undefined };

const ShootingExtractor: React.FC<ShootingExtractorProps> = ({ selectedCompetition }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  function extractIndianShootingResultsFromHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const tables = doc.querySelectorAll("table.result_xml_resulttable");
    const results: string[] = [];
    tables.forEach((table) => {
      const rows = table.querySelectorAll("tbody > tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 13) {
          const noc = cells[3].textContent?.trim();
          if (noc === "IND") {
            const rank = cells[0].textContent?.trim() || "";
            let name = cells[2].textContent?.replace(/\u00a0/g, " ").trim() || "";
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
    return results.length ? results.join("\n\n") : "No Indian results found.";
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

  
  function handleLoadData() {
    fetch("/api/shooting-extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ event_id: selectedCompetition }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
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
    <div className="mt-8 p-4 border rounded-lg" style={{ background: "var(--glass)", borderColor: "var(--primary)" }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--primary)" }}>Shooting Data Extractor</h3>
      <div className="flex p-2 space-2">
        <p className="bold p-2">
          <label className="text-md font-semibold">Selected Event:</label> {selectedCompetition}
        </p>
        <Button
          variant="primary"
          onClick={handleLoadData}
          disabled={!selectedCompetition}
          className="text-xs px-3 py-1 rounded transition-colors"
        >
          Load Data
        </Button>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            className="w-full p-3 pl-10 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
            placeholder="Paste webpage URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <button
            className={`flex-1 ${loading || !url ? 'btn-disabled' : 'btn-primary'}`}
            onClick={handleExtractFromUrl}
            disabled={loading || !url}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span>Extracting...</span>
              </div>
            ) : (
              "Extract from URL"
            )}
          </button>
        </div>
        <div className="relative">
          <textarea
            className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 resize-none"
            placeholder="Or paste HTML content here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full" onClick={handleExtract}>Extract from HTML</button>
        {error && (
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-4 rounded-xl">
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
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShootingExtractor;
