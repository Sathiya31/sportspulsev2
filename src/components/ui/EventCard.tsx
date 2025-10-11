import React from "react";

interface EventCardProps {
  id: number | string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  accentColor?: string;
  isLive?: boolean;
  onClick?: () => void;
  className?: string;
  logo?: string;
}


function formatDate(dateStr: string) {
  // Try to extract only the date part (YYYY-MM-DD)
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString();
  }
  // Fallback: try to slice if ISO format
  return dateStr.slice(0, 10);
}

const EventCard: React.FC<EventCardProps> = ({
  name,
  location,
  startDate,
  endDate,
  accentColor = "var(--primary)",
  isLive = false,
  onClick,
  className = "",
  logo,
}) => {
  return (
    <div
      className={`rounded-md shadow p-3 bg-[var(--glass)] border border-blue-100 cursor-pointer transition-all mb-1 duration-200 hover:shadow-lg flex items-center gap-4 ${className}`}
      style={{ color: "var(--foreground)" }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${name}`}
    >
      {logo && (
        <div className="flex-shrink-0 flex items-center justify-center h-full">
          <img src={logo} alt={`${name} logo`} className="h-18 w-18 object-contain bg-white" />
        </div>
      )}
      <div className="flex flex-col gap-1 text-sm flex-1">
        <h3 className="text-md font-bold mb-1" style={{ color: accentColor }}>{name}</h3>
        <span style={{ color: "var(--muted)" }}>{location}</span>
        <span style={{ color: "var(--muted-2)" }}>{formatDate(startDate)} - {formatDate(endDate)}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-bold mt-2" style={{ color: "var(--success)" }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--success)" }}></span>LIVE
          </span>
        )}
      </div>
    </div>
  );
};

export default EventCard;
