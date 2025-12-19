'use client';

import React, { useState, useMemo } from 'react';
import BlogGrid from '@/components/blog/BlogGrid';
import SearchBar from '@/components/blog/SearchBar';
import TagFilter from '@/components/blog/TagFilter';
import { BlogPost } from '@/app/lib/blog';

interface BlogPageClientProps {
  initialBlogs: BlogPost[];
  allTags: string[];
}

export default function BlogPageClient({ initialBlogs, allTags }: BlogPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredBlogs = useMemo(() => {
    let filtered = initialBlogs;

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((blog) => blog.tags.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.excerpt?.toLowerCase().includes(query) ||
          blog.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [initialBlogs, searchQuery, selectedTag]);

  return (
    <>
      {/* Search and Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="mb-6">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Filter by Topic
            </h3>
            <TagFilter
              tags={allTags}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing {filteredBlogs.length} of {initialBlogs.length} articles
            {selectedTag && (
              <span className="ml-1">
                in <span className="font-medium text-amber-600">{selectedTag}</span>
              </span>
            )}
          </p>
        </div>

        <BlogGrid blogs={filteredBlogs} />
      </section>
    </>
  );
}