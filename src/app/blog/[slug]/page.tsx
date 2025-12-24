import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { getBlogBySlug, getAllBlogSlugs } from '@/app/lib/blog';
import { generateTableOfContents, addHeadingIds } from '@/app/lib/toc';
import BlogContent from '@/components/blog/BlogContent';
import TableOfContents from '@/components/blog/TableOfContents';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}


export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog || !blog.content) {
    notFound();
  }
  
  const fullPath = path.join(process.cwd(), 'content/blogs', `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { content: markdownContent } = matter(fileContents);
  
  const tocItems = generateTableOfContents(markdownContent);
  const contentWithIds = addHeadingIds(blog.content);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Button href="/blog" variant="ghost">
            ← Back to Articles
          </Button>
        </div>

        {/* Article Header */}
        <header className="max-w-4xl mx-auto mb-12">
          {/* <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="primary">
                {tag}
              </Badge>
            ))}
          </div> */}

          <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex items-center gap-6 text-slate-600 mb-8">
            <span className="font-medium text-slate-900">{blog.author}</span>
            <span>•</span>
            <time dateTime={blog.date}>
              {format(new Date(blog.date), 'MMMM dd, yyyy')}
            </time>
            {blog.readTime && (
              <>
                <span>•</span>
                <span>{blog.readTime} min read</span>
              </>
            )}
          </div>

          {/* Cover Image */}
          <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-xl mb-12">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </header>

        {/* Content with TOC */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                <BlogContent content={contentWithIds} />
              </div>

              {/* Add Tags at the bottom */}
              <div className="mt-8 flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sidebar with TOC */}
            {tocItems.length > 0 && (
              <aside className="lg:col-span-4">
                <TableOfContents items={tocItems} />
              </aside>
            )}
          </div>
        </div>

        {/* Back Button at Bottom */}
        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-slate-200">
          <Button href="/blog" variant="secondary">
            ← Back to All Articles
          </Button>
        </div>
      </article>
    </main>
  );
}