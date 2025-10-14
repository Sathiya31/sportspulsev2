import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { event_id } = req.body;
  if (!event_id) {
    return res.status(400).json({ error: 'Missing event_id' });
  }
  try {
    const apiKey = process.env.COLLECTOR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    const response = await fetch('https://collector-u3tk.onrender.com/api/v1/shooting/extract', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
