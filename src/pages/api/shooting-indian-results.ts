import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch URL' });
    }
    const html = await response.text();
    res.status(200).json({ html });
  } catch {
    res.status(500).json({ error: 'Error fetching URL' });
  }
}
