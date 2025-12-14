// src/components/ui/VerticalTabs.tsx
interface VerticalTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function VerticalTabs({ tabs, activeTab, onTabChange }: VerticalTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="block md:hidden w-full mb-2">
        <select
          className="w-full p-2 rounded border border-[var(--muted-2)] bg-[var(--surface)] text-sm 
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          style={{ color: 'var(--foreground)' }}
          value={activeTab}
          onChange={e => onTabChange(e.target.value)}
        >
          {tabs.map(tab => (
            <option key={tab} value={tab}>{tab}</option>
          ))}
        </select>
      </div>
      {/* Desktop: Vertical Tabs */}
      <div className="hidden md:flex flex-col space-y-2 min-w-[200px]" style={{ borderRight: '1px solid var(--muted-2)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              px-2 py-2 text-left transition-all duration-200 text-sm hover:bg-[var(--glass)]
              ${activeTab === tab 
                ? 'font-medium shadow-sm' 
                : ''
              }
            `}
            style={{
              background: activeTab === tab ? 'var(--glass)' : '',
              color: activeTab === tab ? 'var(--foreground)' : 'var(--muted)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </>
  );
}