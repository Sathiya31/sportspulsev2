import fs from "fs";
import path from "path";
import { isAfter, isBefore } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const today = new Date();
    const calendarDir = path.join(process.cwd(), "public", "data", "calendars");
    const files = fs.readdirSync(calendarDir);
    const events: { time: string; event: string; location: string }[] = [];

    files.forEach((file) => {
      const filePath = path.join(calendarDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (Array.isArray(data)) {
        data.forEach((event) => {
          const startDate = new Date(event.start_date || event.StartDateTime);
          const endDate = new Date(event.end_date || event.EndDateTime);

          if (isAfter(today, startDate) && isBefore(today, endDate)) {
            events.push({
              time: "Ongoing",
              event: event.title || event.EventName || event.name || event.event_name,
              location: event.location || event.City || event.location
            });
          }
        });
      }
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
}
