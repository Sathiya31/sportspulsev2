import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Badge from '../ui/Badge';
import { BlogPost } from '@/app/lib/blog';

interface BlogCardProps {
  blog: BlogPost;
}

export default function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link href={`/blog/${blog.slug}`} className="group">
      <article className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-1">
            {blog.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="primary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="text-slate-600 text-xs mb-4 line-clamp-3">
            {blog.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>{format(new Date(blog.date), 'MMM dd, yyyy')}</span>
            </div>
            <span className="text-amber-600 group-hover:text-amber-700 font-medium">
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}