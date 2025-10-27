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
    <div className="flex flex-col space-y-2 min-w-[200px] border-r border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            px-2 py-2 text-left transition-all duration-200 text-sm
            ${activeTab === tab 
              ? 'font-semibold shadow-sm' 
              : 'hover:bg-slate-100'
            }
          `}
          style={{
            background: activeTab === tab ? 'var(--primary)' : 'transparent',
            color: activeTab === tab ? 'var(--surface)' : 'var(--foreground)',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}