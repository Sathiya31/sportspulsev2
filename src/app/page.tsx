"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import Button from '@/components/ui/Button';
import BlogGrid from "@/components/blog/BlogGrid";
import { Mail, Instagram, Twitter, Clock, MapPin, Calendar } from "lucide-react";
import { Event } from "@/types/home";

const carouselSlides = [
  {
    src: "/images/aichinagoya26.jpg",
    alt: "20th Asian Games Aichi-Nagoya 2026",
    title: "20th Asian Games Aichi-Nagoya 2026",
    desc: "Will India surpass their historic 2022 medal tally!",
    date: "2026-09-19T00:00:00Z",
  },
  {
    src: "/images/dakar.jpg",
    alt: "Dakar Icon",
    title: "Dakar Youth Olympics",
    desc: "Experience the thrill of the Dakar Youth Olympics.",
    date: "2026-10-31T00:00:00Z",
  },
  {
    src: "/images/la28.jpg",
    alt: "LA28 Icon",
    title: "LA28 Olympics",
    desc: "The countdown to the LA28 Olympics begins!",
    date: "2028-07-14T00:00:00Z",
  },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/fetch-events");
        const events: Event[] = await response.json();
        setCurrentEvents(events);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchRecentEvents = async () => {
      try {
        const response = await fetch("/api/recent-events");
        const events: Event[] = await response.json();
        // Get top 5 most recent
        setRecentEvents(events.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch recent events:", error);
        // Fallback to empty array
        setRecentEvents([]);
      }
    };

    fetchRecentEvents();
  }, []);

  useEffect(() => {
    async function fetchBlogs() {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      console.log("fetched logs", data);
      setBlogs(data);
    }
    fetchBlogs();
  }, []);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateStr);
  };

  const CurrentEventsSection = () => (
    <section className="rounded-xl shadow-md p-4" 
      style={{ background: "var(--surface)", boxShadow: "var(--card-shadow)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-500 animate-pulse text-lg">●</span>
        <h2 className="text-lg font-bold" style={{ color: "var(--primary)" }}>
          Live Events
        </h2>
      </div>
      <div className="space-y-3">
        {currentEvents.length > 0 ? (
          currentEvents.map((event) => (
            <div 
              key={event.id} 
              className="p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer"
              style={{ 
                background: "var(--glass)",
                borderColor: "var(--border)",
                borderLeft: "3px solid var(--success)"
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h5 className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                  {event.name}
                </h5>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                  style={{ 
                    background: "var(--success-bg)",
                    color: "var(--success)"
                  }}
                >
                  {event.sport}
                </span>
              </div>
              
              <div className="flex items-center gap-1 mb-1">
                <MapPin size={12} style={{ color: "var(--muted)" }} />
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {event.location}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar size={12} style={{ color: "var(--muted-2)" }} />
                <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                  {formatDate(event.date)} - {formatDate(event.endDate)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted-2)" }}>
            No live events at the moment.
          </p>
        )}
      </div>
    </section>
  );

  const RecentEventsSection = () => (
    <section className="rounded-xl shadow-md p-4" 
      style={{ background: "var(--surface)", boxShadow: "var(--card-shadow)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={18} style={{ color: "var(--primary)" }} />
        <h2 className="text-lg font-bold" style={{ color: "var(--primary)" }}>
          Recent Events
        </h2>
      </div>
      <div className="space-y-3">
        {recentEvents.length > 0 ? (
          recentEvents.map((event) => (
            <div 
              key={event.id} 
              className="p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer"
              style={{ 
                background: "var(--glass)",
                borderColor: "var(--border)"
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h5 className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                  {event.name}
                </h5>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                  style={{ 
                    background: "var(--primary-20)",
                    color: "var(--primary)"
                  }}
                >
                  {event.sport}
                </span>
              </div>
              
              <div className="flex items-center gap-1 mb-1">
                <MapPin size={12} style={{ color: "var(--muted)" }} />
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {event.location}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar size={12} style={{ color: "var(--muted-2)" }} />
                <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                  {getTimeAgo(event.endDate || event.date)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted-2)" }}>
            No recent events to display.
          </p>
        )}
      </div>
      
      {/* {recentEvents.length > 0 && (
        <div className="mt-4 text-center">
          <Button href="/events" variant="secondary" className="text-xs w-full">
            View All Events →
          </Button>
        </div>
      )} */}
    </section>
  );

  return (
    <main className="min-h-screen p-4 md:p-6" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Carousel */}
          <section>
            <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-lg" 
              style={{ boxShadow: "var(--card-shadow)" }}>
              <Image
                src={carouselSlides[active].src}
                alt={carouselSlides[active].alt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight" 
                  style={{ color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  {carouselSlides[active].title}
                </h2>
                <p className="text-xs sm:text-sm md:text-base mb-3 leading-snug max-w-2xl" 
                  style={{ color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                  {carouselSlides[active].desc}
                </p>
                <CountdownTimer target={carouselSlides[active].date} />
              </div>
            </div>
            {/* Carousel indicators */}
            <div className="flex justify-center mt-4 gap-2">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active === idx ? 'w-8 sm:w-10' : 'w-2'
                  }`}
                  style={{ 
                    background: active === idx ? "var(--primary)" : "var(--muted-2)",
                    minWidth: active === idx ? '32px' : '8px'
                  }}
                  onClick={() => setActive(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Mobile Current Events & Recent Events - Show only on mobile/tablet */}
          <div className="lg:hidden space-y-4">
            <CurrentEventsSection />
            <RecentEventsSection />
          </div>

          {/* Blog Section */}
          <section className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                Latest Articles
              </h2>
              <Button href="/blog" variant="secondary" className="hidden md:flex text-sm">
                View All →
              </Button>
            </div>

            <BlogGrid blogs={blogs} />

            <div className="mt-6 text-center md:hidden">
              <Button href="/blog" variant="primary">
                View All Articles
              </Button>
            </div>
          </section>
        </div>

        {/* Desktop Sidebar - Hidden on mobile/tablet */}
        <aside className="hidden lg:block w-80 space-y-4 flex-shrink-0">
          <CurrentEventsSection />
          <RecentEventsSection />
        </aside>
      </div>

      {/* CTA Section */}
      <section
        className="py-6 md:py-8 px-4 md:px-8 rounded-2xl mt-6 shadow-lg"
        style={{
          background: "var(--surface)",
          color: "var(--foreground)",
          boxShadow: "var(--card-shadow)"
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            🏆 Stay Ahead in Indian Sports!
          </h2>

          <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--muted-2)" }}>
            Get the latest <strong>Indian sports results, event updates,</strong> and
            in-depth blogs covering everything from boxing and cricket to
            athletics and more.
          </p>

          <p className="text-sm md:text-base" style={{ color: "var(--muted-2)" }}>
            Be part of a growing community that lives and breathes Indian sports.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
            <a
              href="mailto:indiaatsports31@gmail.com"
              className="social-link flex items-center gap-2 px-4 py-2.5 border rounded-full font-semibold transition-all hover:opacity-90"
              style={{ borderColor: "var(--primary)" }}
            >
              <Mail size={18} />
              <span className="text-sm">Email</span>
            </a>

            <a
              href="https://instagram.com/indian_sports_pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link flex items-center gap-2 border px-4 py-2.5 rounded-full transition-all hover:opacity-90"
              style={{ borderColor: "var(--primary)" }}
            >
              <Instagram size={18} />
              <span className="text-sm">Instagram</span>
            </a>

            <a
              href="https://twitter.com/indian_sports_pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link flex items-center gap-2 border px-4 py-2.5 rounded-full transition-all hover:opacity-90"
              style={{ borderColor: "var(--primary)"}}
            >
              <Twitter size={18} />
              <span className="text-sm">Twitter</span>
            </a>
          </div>

          <p className="mt-4 text-sm" style={{ color: "var(--muted-2)" }}>
            📢 Follow us for real-time updates, exclusive insights, and
            behind-the-scenes stories from the world of Indian sports.
          </p>
        </div>
      </section>

      <style jsx>{`
        .social-link:hover {
          background: var(--surface);
          color: var(--primary);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}