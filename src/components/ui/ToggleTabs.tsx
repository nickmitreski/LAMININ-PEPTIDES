import Button from './Button';

export type ToggleTabItem = { id: string; label: string };

interface ToggleTabsProps {
  /** Prefer `items` when labels differ from ids (e.g. library filters). */
  items?: ToggleTabItem[];
  /** @deprecated use `items` with id === label when strings are enough */
  tabs?: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Merged onto the tabs row wrapper (e.g. spacing when a subtitle sits below). */
  className?: string;
}

export default function ToggleTabs({
  items,
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: ToggleTabsProps) {
  const resolved: ToggleTabItem[] =
    items ??
    (tabs ?? []).map((t) => ({
      id: t,
      label: t,
    }));
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
        {resolved.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => onTabChange(id)}
            variant={activeTab === id ? 'primary' : 'outline'}
            size="md"
            className={[
              'shrink-0 snap-start min-h-11 touch-manipulation px-4 py-2.5 text-xs sm:min-h-0 sm:px-6 sm:text-sm',
              activeTab === id
                ? 'bg-accent hover:bg-accent-dark text-carbon-900'
                : 'bg-white',
            ].join(' ')}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
