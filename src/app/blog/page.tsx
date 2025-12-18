import React from 'react';
import Head from "next/head";
import BlogPageClient from './BlogPageClient';
import { getAllBlogs, getAllTags } from '@/app/lib/blog';

export default function BlogPage() {
  const allBlogs = getAllBlogs();
  const allTags = getAllTags();

  return (
    <>
      <Head>
        <title>Sports Pulse Blog | Indian Sports Articles & Insights</title>
        <meta name="description" content="Read the latest articles, insights, and stories on Indian sports. Explore athlete interviews, event analysis, and expert commentary on the Sports Pulse Blog." />
        <meta property="og:title" content="Sports Pulse Blog | Indian Sports Articles & Insights" />
        <meta property="og:description" content="Read the latest articles, insights, and stories on Indian sports. Explore athlete interviews, event analysis, and expert commentary on the Sports Pulse Blog." />
        <meta property="og:image" content="https://sportzpulse.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://sportzpulse.com/blog" />
        <script type="application/ld+json">
          {`
            {"@context": "https://schema.org","@type": "Blog","name": "Sports Pulse Blog | Indian Sports Articles & Insights","description": "Read the latest articles, insights, and stories on Indian sports. Explore athlete interviews, event analysis, and expert commentary on the Sports Pulse Blog.","url": "https://sportzpulse.com/blog"}
          `}
        </script>
      </Head>
      <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">All Articles</h1>
          <p className="text-xl text-slate-300">
            Explore our collection of {allBlogs.length} articles
          </p>
        </div>
      </section>

      <BlogPageClient initialBlogs={allBlogs} allTags={allTags} />
    </main>
    </>
  );
}