"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SignInButton from "./auth/SignInButton";

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
    const [menuOpen, setMenuOpen] = useState(false);

    return (
    <nav className="w-full sticky top-0 z-50 shadow-md transition-colors duration-500" style={{ background: "var(--toolbar-bg)", color: "var(--foreground)" }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
                <Link href="/" className="flex items-center gap-3 select-none group" style={{ color: "var(--foreground)" }}>
                    {/* Rounded SP Logo */}
                    <span className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg"
                        style={{ background: "linear-gradient(135deg, var(--danger), var(--primary))" }}>
                        <span className="font-extrabold text-white text-lg tracking-widest">SP</span>
                    </span>
                    {/* Sports Pulse Font */}
                    <span className="flex items-center text-2xl font-extrabold tracking-tight font-sans">
                        {/* SportsPulse Logo Image */}
                        {/* <img
                            src="/logo-gradient.png"
                            alt="SportsPulse Logo"
                            className="w-8 h-8 mr-2 rounded-full object-cover"
                        /> */}
                        {/* Gradient Text */}
                        <span
                            className="px-1 py-1 rounded bg-clip-text text-transparent"
                            style={{ background: "linear-gradient(90deg, var(--danger), var(--accent), var(--primary))", WebkitBackgroundClip: "text", color: "transparent" }}
                        >
                            Sports Pulse
                        </span>
                    </span>
                </Link>
                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`px-3 py-1 w-full block font-medium transition-colors duration-300 border-none shadow-none rounded-none whitespace-nowrap`}
                            style={{
                                color: "var(--foreground)",
                                background: pathname && pathname.startsWith(item.href) ? "var(--glass)" : "transparent"
                            }}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <SignInButton />
                </div>
                {/* Mobile Hamburger */}
                <button
                    className="md:hidden flex items-center p-2"
                    style={{ color: "var(--foreground)" }}
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label="Toggle navigation"
                >
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                        <rect y="5" width="24" height="2" rx="1" fill="#333" />
                        <rect y="11" width="24" height="2" rx="1" fill="#333" />
                        <rect y="17" width="24" height="2" rx="1" fill="#333" />
                    </svg>
                </button>
            </div>
            {/* Mobile Nav */}
            {menuOpen && (
                <div className="md:hidden px-4 pb-3">
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-3 py-2 w-full block font-medium transition-colors duration-300 border-none shadow-none rounded-none whitespace-nowrap`}
                                style={{
                                    color: "var(--foreground)",
                                    background: pathname && pathname.startsWith(item.href) ? "var(--glass)" : "transparent"
                                }}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="px-3 py-2">
                            <SignInButton />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
