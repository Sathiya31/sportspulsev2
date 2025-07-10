"use client";
import { useState } from "react";

export default function ShootingPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  function handleExtract() {
    try {
      // Simple HTML extraction: get text content
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, "text/html");
      const text = doc.body.textContent || "";
      setResult(text.trim());
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

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">
        Shooting Data Extractor
      </h1>
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
