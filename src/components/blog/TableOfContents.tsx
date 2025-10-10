'use client';

import React, { useState, useEffect } from 'react';
//import { TocItem } from '@/lib/toc';

interface TableOfContentsProps {
  items: any[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-24 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4">
        Table of Contents
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? 'ml-4' : ''}
          >
            <button
              onClick={() => handleClick(item.id)}
              className={`text-left text-sm transition-colors hover:text-amber-600 ${
                activeId === item.id
                  ? 'text-amber-600 font-medium'
                  : 'text-slate-600'
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}