// server component route function the latest blogs using getLatestBlogs from blog.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getLatestBlogs } from '@/app/lib/blog';
import { BlogPost } from '@/app/lib/blog';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const latestBlogs: BlogPost[] = getLatestBlogs(3);
  res.status(200).json(latestBlogs);
}