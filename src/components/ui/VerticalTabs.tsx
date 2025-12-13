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
    <div className="flex flex-col space-y-2 min-w-[200px]"
    style={{ border: '1px solid var(--muted-2)' }}>
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
  );
}