"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import Button from '@/components/ui/Button';
import BlogGrid from "@/components/blog/BlogGrid";
import { Mail, Instagram, Twitter } from "lucide-react";

const carouselSlides = [
  {
    src: "/images/tokyo2025.jpg",
    alt: "Tokyo Icon",
    title: "Tokyo Athletics Championship",
    desc: "See the latest updates from the Tokyo event!",
    date: "2025-09-13T00:00:00Z",
  },
  {
    src: "/images/dakar.jpg",
    alt: "Dakar Icon",
    title: "Dakar Youth Olympics",
    desc: "Experience the thrill of the Dakar Youth Olympics.",
    date: "2026-01-03T00:00:00Z",
  },
  {
    src: "/images/la28.jpg",
    alt: "LA28 Icon",
    title: "LA28 Olympics",
    desc: "The countdown to the LA28 Olympics begins!",
    date: "2028-07-14T00:00:00Z",
  },
];

interface Event {
  time: string;
  event: string;
  location: string;
}

export default function Home() {
  const [active, setActive] = useState(0);
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
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
    async function fetchBlogs() {
      const res = await fetch("/api/blogs");
      const data = await res.json();
      console.log("fetched logs", data);
      setBlogs(data);
    }
    fetchBlogs();
  }, []);

  const CurrentEventsSection = () => (
    <section className="rounded-xl shadow-md p-4" 
      style={{ background: "var(--surface)", boxShadow: "var(--card-shadow)" }}>
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--primary)" }}>
        Live Events <span className="text-green-500 animate-pulse">●</span>
      </h2>
      <div className="space-y-2">
        {currentEvents.length > 0 ? (
          currentEvents.map((event, idx) => (
            <div key={idx} 
              className="border-l-2 pl-3 py-1.5 hover:opacity-80 transition-opacity cursor-pointer" 
              style={{ borderColor: "var(--primary)" }}>
              <h5 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {event.event}
              </h5>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {event.location}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>
            No current events available.
          </p>
        )}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen p-4 md:p-6" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Carousel */}
          <section>
            <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden shadow-lg" 
              style={{ boxShadow: "var(--card-shadow)" }}>
              <Image
                src={carouselSlides[active].src}
                alt={carouselSlides[active].alt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4 md:p-6">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-1.5" 
                  style={{ color: "var(--surface)" }}>
                  {carouselSlides[active].title}
                </h2>
                <p className="text-sm md:text-base mb-2" style={{ color: "var(--surface)" }}>
                  {carouselSlides[active].desc}
                </p>
                <CountdownTimer target={carouselSlides[active].date} />
              </div>
            </div>
            {/* Carousel indicators */}
            <div className="flex justify-center mt-3 gap-2">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    active === idx ? 'w-6' : ''
                  }`}
                  style={{ background: active === idx ? "var(--primary)" : "var(--muted-2)" }}
                  onClick={() => setActive(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Mobile Current Events - Show only on mobile/tablet */}
          <div className="lg:hidden">
            <CurrentEventsSection />
          </div>

          {/* Blog Section */}
          <section className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                Latest Articles
              </h2>
              <Button href="/blog" variant="ghost" className="hidden md:flex text-sm">
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
        </aside>
      </div>

      {/* CTA Section */}
      <section
        className="py-6 md:py-8 px-4 md:px-8 rounded-2xl mt-6 shadow-lg"
        style={{
          background: "var(--foreground)",
          color: "var(--surface)",
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
              style={{ borderColor: "var(--surface)", color: "var(--surface)" }}
            >
              <Mail size={18} />
              <span className="text-sm">Email</span>
            </a>

            <a
              href="https://instagram.com/indian_sports_pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link flex items-center gap-2 border px-4 py-2.5 rounded-full transition-all hover:opacity-90"
              style={{ borderColor: "var(--surface)", color: "var(--surface)" }}
            >
              <Instagram size={18} />
              <span className="text-sm">Instagram</span>
            </a>

            <a
              href="https://twitter.com/indian_sports_pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link flex items-center gap-2 border px-4 py-2.5 rounded-full transition-all hover:opacity-90"
              style={{ borderColor: "var(--surface)", color: "var(--surface)" }}
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