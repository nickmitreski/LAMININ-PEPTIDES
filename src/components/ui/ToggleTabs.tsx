import Button from './Button';

interface ToggleTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ToggleTabs({ tabs, activeTab, onTabChange }: ToggleTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-12">
      {tabs.map((tab) => (
        <Button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          variant={activeTab === tab ? 'primary' : 'outline'}
          size="md"
          className={activeTab === tab ? 'bg-accent hover:bg-accent-dark text-carbon-900' : 'bg-white'}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
}
