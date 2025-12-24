'use client';

import React from 'react';

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectTag(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          selectedTag === null
            ? 'bg-amber-600 text-white shadow-md'
            : 'bg-white text-slate-700 border border-slate-300 hover:border-amber-600 hover:text-amber-600'
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(tag)}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
            selectedTag === tag
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-amber-600 hover:text-amber-600'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}