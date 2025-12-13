"use client";

import { useState, useEffect } from "react";
import EventCard from "@/components/ui/EventCard";
import ShootingResults from "../../components/shooting/results";
import ShootingExtractor from '../../components/shooting/ShootingExtractor';
import { useSession } from 'next-auth/react';
import { isAdmin } from "@/config/auth";
import { ShootingEvent } from "@/shootingCalendar";

function isLive(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

export default function ShootingPage() {
  const [filter, setFilter] = useState("");
  const [events, setEvents] = useState<ShootingEvent[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<ShootingEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: session } = useSession(); 
  const userIsAdmin = isAdmin(session?.user?.email);

  useEffect(() => {
    fetch("/data/calendars/shooting_2025.json")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]));
  }, []);

  function handleCardClick(item: ShootingEvent) {
    setSelectedCompetition(item || null);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  }

  // Find live events
  const liveEvents = events.filter(event => isLive(event.start_date, event.end_date));

  // Filtered events for sidebar
  const filteredEvents = events.filter((item: ShootingEvent) =>
    item.event_name.toLowerCase().includes(filter.toLowerCase()) ||
    item.location.toLowerCase().includes(filter.toLowerCase()) ||
    item.start_date.includes(filter) ||
    item.end_date.includes(filter)
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Calendar Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-80 md:w-96
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-[var(--surface)] p-4 overflow-y-auto
      `}>
        <h2 className="text-xl font-bold my-3" style={{ color: "var(--primary)" }}>2025 Calendar</h2>
        <div className="mb-2">
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 pl-10 rounded-xl border transition-all duration-300"
              style={{ background: "var(--glass)", borderColor: "var(--muted-2)", color: "var(--foreground)" }}
              placeholder="Filter events..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="grid gap-1">
          {filteredEvents.map((item: ShootingEvent, idx: number) => (
            <EventCard
              key={item.competition_code || idx}
              id={item.competition_code || idx}
              name={item.event_name}
              location={item.location}
              startDate={item.start_date}
              endDate={item.end_date}
              accentColor={selectedCompetition?.competition_code === item.competition_code ? "var(--primary)" : "var(--muted-2)"}
              isLive={isLive(item.start_date, item.end_date)}
              onClick={() => handleCardClick(item)}
              className={selectedCompetition?.competition_code === item.competition_code ? "ring-2" : ""}
            />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8" style={{ background: "var(--background)" }}>
        {/* Mobile menu button */}
        <button
          className="md:hidden fixed top-20 right-4 z-50 p-1 rounded-lg shadow-lg"
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

        <h1 className="text-2xl font-bold mb-4 ml-12 md:ml-0" style={{ color: "var(--primary)" }}>Shooting</h1>
        
        {/* Live Events Display */}
        {liveEvents.length > 0 && (
          <div className="mb-4">
            <div className="font-semibold text-lg mb-2" style={{ color: "var(--success)" }}>Live Events</div>
            <div className="flex flex-wrap gap-2">
              {liveEvents.map((event, idx) => (
                <span 
                  key={event.competition_code || idx}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ background: "var(--glass)", color: "var(--primary)" }}
                >
                  {event.event_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="mb-8">
          {selectedCompetition ?
            <ShootingResults selectedCompetition={selectedCompetition} />
            :
            <div className="shadow-sm" style={{ background: "var(--surface)" }}>
              <div className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>
                  Select an Event
                </h2>
                <p style={{ color: "var(--muted-2)" }}>
                  Choose an event from the calendar to view results
                </p>
              </div>
            </div>}
        </div>

        {/* Extractor for admins only */}
        {userIsAdmin && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--muted-2)" }}>
            <ShootingExtractor selectedCompetition={selectedCompetition?.competition_code}/>
          </div>
        )}
      </main>
    </div>
  );
}