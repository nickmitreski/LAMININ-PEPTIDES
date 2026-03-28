import { useId, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Text } from '../ui/Typography';

export interface ProductAccordionSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface ProductPageAccordionProps {
  sections: ProductAccordionSection[];
  /** Controlled: which section is open (only one at a time). */
  openId?: string | null;
  onOpenIdChange?: (id: string | null) => void;
}

export default function ProductPageAccordion({
  sections,
  openId: controlledOpenId,
  onOpenIdChange,
}: ProductPageAccordionProps) {
  const baseId = useId();
  const [internalOpenId, setInternalOpenId] = useState<string | null>(null);
  const controlled = onOpenIdChange !== undefined;
  const openId = controlled ? (controlledOpenId ?? null) : internalOpenId;

  const toggleSection = (sectionId: string) => {
    const next = openId === sectionId ? null : sectionId;
    if (controlled) onOpenIdChange!(next);
    else setInternalOpenId(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-carbon-900/10 bg-white shadow-sm ring-1 ring-carbon-900/[0.03]">
      {sections.map((section, index) => {
        const isOpen = openId === section.id;
        const panelId = `${baseId}-${section.id}-panel`;
        const headerId = `${baseId}-${section.id}-header`;
        const isFirst = index === 0;
        const isLast = index === sections.length - 1;

        return (
          <div
            key={section.id}
            className={`
              ${!isFirst ? 'border-t border-carbon-900/10' : ''}
              ${isFirst ? 'rounded-t-xl' : ''}
              ${isLast && !isOpen ? 'rounded-b-xl' : ''}
            `}
          >
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleSection(section.id)}
              className="flex min-h-14 w-full touch-manipulation items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-grey/50 sm:min-h-0 sm:px-5 sm:py-5 md:px-6 md:py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-carbon-900"
            >
              <span className="text-sm font-bold uppercase tracking-[0.12em] text-carbon-900 md:text-[0.8125rem]">
                {section.title}
              </span>
              <Plus
                className={`h-5 w-5 flex-shrink-0 text-carbon-900 transition-transform duration-200 ${
                  isOpen ? 'rotate-45' : ''
                }`}
                strokeWidth={1.75}
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
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`border-t border-carbon-900/10 bg-grey px-5 py-5 md:px-6 md:py-6 ${
                    isLast ? 'rounded-b-xl' : ''
                  }`}
                >
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductOverviewBody({
  paragraphs,
}: {
  paragraphs: string[];
}) {
  return (
    <div id="product-overview" className="space-y-4 scroll-mt-[7.5rem] md:scroll-mt-36">
      <Text
        as="h3"
        variant="small"
        weight="semibold"
        className="uppercase tracking-[0.14em] text-carbon-900"
      >
        Product description
      </Text>
      {paragraphs.map((p, i) => (
        <Text key={i} variant="body" className="text-neutral-600 leading-relaxed">
          {p}
        </Text>
      ))}
    </div>
  );
}
