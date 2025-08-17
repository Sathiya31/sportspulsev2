import React from "react";

export function parseIssfScheduleHtml(html: string): { day: string; htmlRows: string[] }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // Find all day blocks
  const schedule: { day: string; htmlRows: string[] }[] = [];
  const dayBlocks = Array.from(doc.querySelectorAll('.md\\:flex.md\\:flex-row.w-full.mb-6.pt-2.border-t.border-gray-400'));
  dayBlocks.forEach(dayBlock => {
    const day = dayBlock.querySelector('h3')?.textContent?.trim() || '';
    const rows = Array.from(dayBlock.querySelectorAll('.md\\:flex.md\\:flex-row'));
    const htmlRows = rows.map(row => row.outerHTML);
    if (day && htmlRows.length) schedule.push({ day, htmlRows });
  });
  return schedule;
}

export function IssfScheduleDisplay({ schedule }: { schedule: { day: string; htmlRows: string[] }[] }) {
  if (!schedule || !schedule.length) {
    return <div className="text-gray-500 dark:text-yellow-400">No schedule data found.</div>;
  }
  return (
    <div className="space-y-8">
      {schedule.map((day, idx) => (
        <div key={idx} className="">
          <h3 className="font-bold uppercase mb-2 text-lg border-b pb-1 text-blue-700 border-blue-200 dark:text-yellow-200 dark:border-yellow-300">{day.day}</h3>
          <div>
            {day.htmlRows.map((rowHtml, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: rowHtml }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
