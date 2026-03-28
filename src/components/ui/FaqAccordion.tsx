import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Card from './Card';
import { Text } from './Typography';
import type { FAQItem } from '../../data/faq';

interface FaqAccordionProps {
  items: FAQItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  const handleActivate = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-panel-${item.id}`;
        const headerId = `${baseId}-header-${item.id}`;

        return (
          <Card
            key={item.id}
            variant="bordered"
            padding="none"
            className="overflow-hidden transition-shadow duration-200 hover:shadow-md !bg-accent !border-2 !border-white/60 shadow-md shadow-carbon-900/5 ring-1 ring-white/40"
          >
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => handleActivate(item.id)}
              className="flex w-full items-start gap-4 text-left px-5 py-4 md:px-6 md:py-5 hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900 focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
            >
              <Text
                as="span"
                variant="body"
                weight="medium"
                className="flex-1 text-carbon-900 pr-2"
              >
                <span className="text-carbon-900/40 font-normal tabular-nums mr-2">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.question}
              </Text>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 text-carbon-900/50 mt-0.5 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden min-h-0">
                <div className="border-t border-white/50 bg-accent-muted/95 px-5 py-4 md:px-6 md:py-5">
                  {item.answer}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
