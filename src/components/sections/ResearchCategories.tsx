import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import { Heading, Label, Text } from '../ui/Typography';
import { productImageFile, cfgProductFiles } from '../../data/peptides';
import useScrollReveal from '../../hooks/useScrollReveal';

const tileFrame =
  'group relative h-full w-full overflow-hidden rounded-2xl border-2 border-white/70 bg-white shadow-lg shadow-carbon-900/10 ring-1 ring-white/50';

const tileImage =
  [
    'absolute inset-0 z-0 h-full w-full object-cover',
    'grayscale opacity-70 brightness-110',
    'transition-[filter,opacity,transform] duration-500 ease-out',
    'group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-[1.02]',
  ].join(' ');

/** Extra wash so tiles read almost white at rest; fades on hover */
const tileWash =
  'pointer-events-none absolute inset-0 z-[1] bg-white/45 transition-opacity duration-500 ease-out group-hover:opacity-0';

const titleWrap =
  'pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2.5 py-3 sm:px-4 sm:py-5';

/** Compact type + tighter aqua label so tiles stay image-forward */
const tileTitle =
  [
    'max-w-[min(100%,16.5rem)] text-balance text-center sm:max-w-[min(100%,19rem)] md:max-w-[min(100%,23rem)]',
    'rounded-md px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5',
    'bg-accent font-semibold uppercase tracking-[0.08em] text-carbon-900',
    'text-[length:clamp(0.8125rem,1.35vw+0.4rem,1.625rem)]',
    'sm:text-[length:clamp(0.9375rem,1.15vw+0.48rem,1.875rem)]',
    'md:text-[length:clamp(1rem,1vw+0.55rem,2.125rem)]',
    'leading-snug shadow-sm shadow-carbon-900/10 ring-1 ring-white/50',
    'transition-opacity duration-300 ease-out',
    'group-hover:opacity-0',
  ].join(' ');

function CategoryTile({
  imageSrc,
  title,
  categoryId,
}: {
  imageSrc: string;
  title: string;
  /** Library filter tab id, e.g. "Metabolic" — links to /library?category=X */
  categoryId: string;
}) {
  return (
    <Link to={`/library?category=${encodeURIComponent(categoryId)}`} className="block h-full">
      <div className={tileFrame}>
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className={tileImage}
          loading="lazy"
          decoding="async"
        />
        <div className={tileWash} aria-hidden />
        <div className={titleWrap}>
          <h3 className={tileTitle}>{title}</h3>
        </div>
      </div>
    </Link>
  );
}

export default function ResearchCategories() {
  const { ref: headingRef, revealed: headingRevealed } =
    useScrollReveal<HTMLDivElement>();
  const { ref: gridRef, revealed: gridRevealed } =
    useScrollReveal<HTMLDivElement>();

  return (
    <Section background="none" spacing="xl" className="bg-accent">
      <div
        ref={headingRef}
        data-revealed={headingRevealed}
        className="reveal mx-auto mb-10 max-w-2xl text-center md:mb-14"
      >
        <Label inheritColor className="mb-3 inline-block text-carbon-900/80">
          Research focus areas
        </Label>
        <Heading level={2} className="mb-4 text-carbon-900">
          Compounds organised by application
        </Heading>
        <Text variant="lead" weight="light" className="text-carbon-900/85">
          Browse our peptide catalogue grouped by primary research area, from
          metabolic and tissue regeneration to neurology, longevity, and
          performance biology.
        </Text>
      </div>
      <div
        ref={gridRef}
        className="
          grid grid-cols-1 gap-4 md:gap-6
          md:grid-cols-4 md:grid-rows-2 md:auto-rows-[minmax(12rem,auto)]
        "
      >
        <div
          data-revealed={gridRevealed}
          className="reveal reveal-delay-1 md:col-span-2 md:row-start-1 md:min-h-[18rem] min-h-[12rem]"
        >
          <CategoryTile
            imageSrc={productImageFile(cfgProductFiles.retatrutide)}
            title="Metabolic research"
            categoryId="Metabolic"
          />
        </div>
        <div
          data-revealed={gridRevealed}
          className="reveal reveal-delay-2 md:col-span-1 md:row-start-1 md:aspect-square md:min-h-0 min-h-[12rem]"
        >
          <CategoryTile
            imageSrc={productImageFile(cfgProductFiles.nad)}
            title="Longevity & cellular research"
            categoryId="Longevity"
          />
        </div>
        <div
          data-revealed={gridRevealed}
          className="reveal reveal-delay-3 md:col-span-1 md:row-start-1 md:aspect-square md:min-h-0 min-h-[12rem]"
        >
          <CategoryTile
            imageSrc={productImageFile(cfgProductFiles.semax)}
            title="Cognitive & neurological research"
            categoryId="Cognitive"
          />
        </div>
        <div
          data-revealed={gridRevealed}
          className="reveal reveal-delay-3 md:col-span-2 md:row-start-2 md:min-h-[14rem] min-h-[12rem]"
        >
          <CategoryTile
            imageSrc={productImageFile(cfgProductFiles.bpcTb)}
            title="Tissue regeneration"
            categoryId="Healing"
          />
        </div>
        <div
          data-revealed={gridRevealed}
          className="reveal reveal-delay-4 md:col-span-2 md:row-start-2 md:min-h-[14rem] min-h-[12rem]"
        >
          <CategoryTile
            imageSrc={productImageFile(cfgProductFiles.cjcNoDac)}
            title="Performance biology"
            categoryId="Performance"
          />
        </div>
      </div>
    </Section>
  );
}
