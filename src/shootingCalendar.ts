export interface ShootingEvent {
  event_name: string;
  start_date: string;
  end_date: string;
  location: string;
  hyperlink: string;
}

import shootingData from "../public/data/calendars/shooting_2025.json";

export const getShootingEvents = () => {
  const events: ShootingEvent[] = shootingData as ShootingEvent[];
  return events;
};
