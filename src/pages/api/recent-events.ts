import fs from "fs";
import path from "path";
import { isBefore, subDays } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";
import { Event } from "@/types/home";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30); // Get events from last 30 days
    const calendarDir = path.join(process.cwd(), "public", "data", "calendars");
    const files = fs.readdirSync(calendarDir);
    const events: Event[] = [];

    files.forEach((file) => {
      const filePath = path.join(calendarDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      
      // Extract sport name from filename (e.g., "archery_2025.json" -> "Archery")
      const sport = file.replace(/_\d+\.json/, '').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (Array.isArray(data)) {
        data.forEach((event) => {
          const startDate = new Date(event.start_date || event.StartDateTime);
          const endDate = new Date(event.end_date || event.EndDateTime);

          // Check if event has ended (end date is before today)
          // AND ended within the last 30 days
          if (isBefore(endDate, today) && isBefore(thirtyDaysAgo, endDate)) {
            events.push({
              id: event.id?.toString() || `${file}-${event.event_id || events.length}`,
              name: event.title || event.EventName || event.name || event.event_name,
              sport: event.sport || sport,
              location: event.location || event.City || "Unknown Location",
              date: startDate.toISOString(),
              endDate: endDate.toISOString()
            });
          }
        });
      }
    });

    // Sort by end date descending (most recent first)
    events.sort((a, b) => {
      const dateA = new Date(a.endDate || a.date);
      const dateB = new Date(b.endDate || b.date);
      return dateB.getTime() - dateA.getTime();
    });

    // Return top 5 most recent events
    res.status(200).json(events.slice(0, 5));
  } catch (error) {
    console.error("Failed to fetch recent events:", error);
    res.status(500).json({ error: "Failed to fetch recent events" });
  }
}