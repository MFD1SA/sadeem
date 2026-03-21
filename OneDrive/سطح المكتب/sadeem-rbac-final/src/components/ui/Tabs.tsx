interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-0 border-b border-border/60 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-item ${active === tab.id ? 'active' : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`inline-block ms-1.5 text-2xs font-medium px-1.5 py-0.5 rounded-md ${
              active === tab.id ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-content-tertiary'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
