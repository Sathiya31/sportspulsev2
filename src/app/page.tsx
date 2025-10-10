"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import Button from '@/components/ui/Button';
import BlogGrid from "@/components/blog/BlogGrid";

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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Carousel - Adjusted width */}
          <section className="mb-10">
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={carouselSlides[active].src}
                alt={carouselSlides[active].alt}
                fill
                className="object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
                <h2 className="text-3xl text-white font-bold mb-2">
                  {carouselSlides[active].title}
                </h2>
                <p className="text-white text-lg">
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
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${active === idx ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  onClick={() => setActive(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </section>

          {/* News Cards / Feeds */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Latest Articles
                </h2>
              </div>
              <Button href="/blog" variant="ghost" className="hidden md:flex">
                View All →
              </Button>
            </div>

            <BlogGrid blogs={blogs} />

            <div className="mt-12 text-center md:hidden">
              <Button href="/blog" variant="primary">
                View All Articles
              </Button>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 space-y-6">
          {/* Current Events */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Current Events</h2>
            <div className="space-y-4">
              {currentEvents.length > 0 ? (
                currentEvents.map((event, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-semibold text-gray-800">{event.event}</h3>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No current events available.</p>
              )}
            </div>
          </section>
        </div>
      </div>


      {/* CTA Section */}
      <section className="bg-amber-50 border-y border-amber-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Dont miss out on the latest articles, tutorials, and insights.
            Check out our full collection of blog posts.
          </p>
          <Button href="/blog" variant="primary" size="lg">
            Browse All Articles
          </Button>
        </div>
      </section>
    </main>
  );
}