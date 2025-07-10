"use client";
import Link from "next/link";

export default function About() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4">About Sports Pulse</h1>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
        Sports Pulse is your hub for the latest sports news and data extraction across multiple disciplines. Stay updated and analyze data with ease.
      </p>
      <div className="flex gap-6 mt-8">
        <Link href="https://instagram.com" target="_blank" className="hover:underline text-pink-600 font-semibold">Instagram</Link>
        <Link href="https://twitter.com" target="_blank" className="hover:underline text-blue-500 font-semibold">Twitter</Link>
        <Link href="https://threads.net" target="_blank" className="hover:underline text-purple-600 font-semibold">Threads</Link>
      </div>
    </div>
  );
}
