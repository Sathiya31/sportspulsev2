import React from 'react';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div 
      className="prose prose-slate max-w-none
        prose-headings:font-bold prose-headings:text-slate-900
        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-slate-900 prose-strong:font-semibold
        prose-ul:my-6 prose-li:text-slate-700
        prose-code:text-amber-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}