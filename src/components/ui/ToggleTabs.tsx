import Button from './Button';

interface ToggleTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Merged onto the tabs row wrapper (e.g. spacing when a subtitle sits below). */
  className?: string;
}

export default function ToggleTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: ToggleTabsProps) {
  return (
    <div
      className={[
        /* Bleed to screen edges on small viewports so tabs can scroll */
        '-mx-4 px-4 sm:mx-0 sm:px-0',
        className,
      ]
        .join(' ')
        .trim()}
    >
      <div
        className="
          scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1
          sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:pb-0
        "
        role="tablist"
        aria-label="Filter catalogue"
      >
        {tabs.map((tab) => (
          <Button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            variant={activeTab === tab ? 'primary' : 'outline'}
            size="md"
            className={[
              'shrink-0 snap-start min-h-11 touch-manipulation px-4 py-2.5 text-xs sm:min-h-0 sm:px-6 sm:text-sm',
              activeTab === tab
                ? 'bg-accent hover:bg-accent-dark text-carbon-900'
                : 'bg-white',
            ].join(' ')}
          >
            {tab}
          </Button>
        ))}
      </div>
    </div>
  );
}
