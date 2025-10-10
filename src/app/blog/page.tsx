import React from 'react';
import BlogPageClient from './BlogPageClient';
import { getAllBlogs, getAllTags } from '@/app/lib/blog';

export default function BlogPage() {
  const allBlogs = getAllBlogs();
  const allTags = getAllTags();

  return (
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
  );
}