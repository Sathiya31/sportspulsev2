import React from 'react';
import BlogCard from './BlogCard';
import { BlogPost } from '@/app/lib/blog';

interface BlogGridProps {
  blogs: BlogPost[];
}

export default function BlogGrid({ blogs }: BlogGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 text-lg">No blog posts found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((blog) => (
        <BlogCard key={blog.slug} blog={blog} />
      ))}
    </div>
  );
}