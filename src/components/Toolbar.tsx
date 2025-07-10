"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Badminton", href: "/badminton" },
  { name: "Table Tennis", href: "/tabletennis" },
  { name: "Archery", href: "/archery" },
  { name: "Shooting", href: "/shooting" },
  { name: "Athletics", href: "/athletics" },
  { name: "About", href: "/about" },
];

export default function Toolbar() {
  const pathname = usePathname();
  return (
    <nav className="w-full bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 text-white shadow-md sticky top-0 z-50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 select-none group">
          <span className="flex items-center text-2xl font-extrabold tracking-tight">
            <span className="px-2 py-1 rounded-l bg-blue-300 text-blue-900 transition-colors duration-500 flex items-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="mr-1"
              >
                <circle cx="12" cy="12" r="10" fill="#2563eb" />
                <path
                  d="M7 12h5l2-4 3 8"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sports
            </span>
            <span className="px-2 py-1 rounded-r bg-blue-700 text-white transition-colors duration-500 flex items-center relative overflow-hidden">
              Pulse
              <span className="ml-2 w-2 h-2 bg-blue-300 rounded-full animate-pulse"></span>
            </span>
          </span>
        </Link>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-1 rounded hover:bg-blue-300 hover:text-blue-900 transition-colors duration-300 font-medium ${
                pathname.startsWith(item.href)
                  ? "bg-blue-300 text-blue-900"
                  : ""
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
