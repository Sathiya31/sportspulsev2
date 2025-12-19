import fs from "fs";
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const blogsDirectory = path.join(process.cwd(), 'content/blogs');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  coverImage: string;
  tags: string[];
  content?: string;
  readTime?: number;
}

// Calculate reading time (average 200 words per minute)
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Get all blog posts
export function getAllBlogs(): BlogPost[] {
  const fileNames = fs.readdirSync(blogsDirectory);
  const allBlogs = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(blogsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
        author: data.author,
        coverImage: data.coverImage,
        tags: data.tags || [],
        readTime: calculateReadTime(content),
      } as BlogPost;
    });

  // Sort by date (newest first)
  return allBlogs.sort((a, b) => (a.date > b.date ? -1 : 1));
}

// Get latest N blog posts
export function getLatestBlogs(count: number): BlogPost[] {
  const allBlogs = getAllBlogs();
  return allBlogs.slice(0, count);
}

// Get a single blog by slug
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(blogsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Convert markdown to HTML
    const processedContent = await remark().use(remarkGfm).use(html).process(content);
    const contentHtml = processedContent.toString();

    return {
      slug,
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
      author: data.author,
      coverImage: data.coverImage,
      tags: data.tags || [],
      content: contentHtml,
      readTime: calculateReadTime(content),
    };
  } catch (error) {
    console.error(`Error fetching blog with slug "${slug}":`, error);
    return null;
  }
}

// Get all unique tags
// Get all unique tags or top N most occurred tags
export function getAllTags(count?: number): string[] {
  const allBlogs = getAllBlogs();
  const tagCounts: Record<string, number> = {};
  allBlogs.forEach((blog) => {
    blog.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
  if (count && count > 0) {
    return sortedTags.slice(0, count);
  }
  return sortedTags;
}

// Get blogs by tag
export function getBlogsByTag(tag: string): BlogPost[] {
  const allBlogs = getAllBlogs();
  return allBlogs.filter((blog) => blog.tags.includes(tag));
}

// Get all blog slugs for static generation
export function getAllBlogSlugs(): string[] {
  const fileNames = fs.readdirSync(blogsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}