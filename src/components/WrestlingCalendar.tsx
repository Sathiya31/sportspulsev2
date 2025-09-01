import React, { useEffect, useState } from 'react';

interface WrestlingEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  link?: string;
}

const WrestlingCalendar: React.FC = () => {
  const [events, setEvents] = useState<WrestlingEvent[]>([]);

  useEffect(() => {
    fetch('/calendars/wrestling-events.json')
      .then(response => response.json())
      .then(data => setEvents(data.events || []));
  }, []);

  return (
    <div>
      <h2>Upcoming Wrestling Events</h2>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            <strong>{event.name}</strong> - {event.date} ({event.location})
            {event.link && (
              <a href={event.link} target="_blank" rel="noopener noreferrer"> More Info</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WrestlingCalendar;