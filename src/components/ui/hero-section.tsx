import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface FinancialHeroProps {
  title: ReactNode;
  description: string;
  primaryButtonText: string;
  /** In-app route, e.g. /library */
  primaryButtonTo: string;
  secondaryButtonText?: string;
  secondaryButtonTo?: string;
  imageUrl1: string;
  imageUrl2: string;
  imageAlt1?: string;
  imageAlt2?: string;
  className?: string;
}

function useHeroMotionVariants(reduce: boolean | null) {
  if (reduce) {
    const instant = { opacity: 1, y: 0, x: 0 };
    return {
      container: { hidden: instant, visible: instant },
      item: { hidden: instant, visible: instant },
      cards: { hidden: instant, visible: instant },
      cardItem: { hidden: instant, visible: instant },
    };
  }

  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45 },
      },
    },
    cards: {
      hidden: { opacity: 0, x: 40 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.65, staggerChildren: 0.25 },
      },
    },
    cardItem: {
      hidden: { opacity: 0, x: 40 },
      visible: { opacity: 1, x: 0 },
    },
  };
}

/**
 * Animated split hero: Laminin accent surface, grid texture, dual product cards.
 * Uses site Button + typography tokens via Tailwind theme.
 */
export function FinancialHero({
  title,
  description,
  primaryButtonText,
  primaryButtonTo,
  secondaryButtonText,
  secondaryButtonTo,
  imageUrl1,
  imageUrl2,
  imageAlt1 = 'Product vial',
  imageAlt2 = 'Product vial',
  className,
}: FinancialHeroProps) {
  const reduceMotion = useReducedMotion();
  const v = useHeroMotionVariants(reduceMotion);

  const gridBackgroundStyle: CSSProperties = {
    backgroundImage:
      'linear-gradient(rgb(0 0 0 / 0.07) 1px, transparent 1px), linear-gradient(to right, rgb(0 0 0 / 0.07) 1px, transparent 1px)',
    backgroundSize: '3rem 3rem',
  };

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden bg-accent text-carbon-900',
        className
      )}
    >
      <div className="absolute inset-0" style={gridBackgroundStyle} aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-accent via-accent/90 to-accent"
        aria-hidden
      />

      <motion.div
        className="relative z-10 mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col items-center gap-12 px-6 py-20 sm:min-h-[78vh] sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
        initial="hidden"
        animate="visible"
        variants={v.container}
      >
        <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
          <motion.div
            variants={v.item}
            className="font-sans text-2xl font-bold uppercase leading-[1.25] tracking-[0.12em] text-carbon-900 sm:text-3xl sm:leading-snug sm:tracking-[0.18em] md:text-4xl md:tracking-[0.22em] lg:text-5xl lg:tracking-[0.26em]"
          >
            {title}
          </motion.div>

          <motion.p
            variants={v.item}
            className="mt-6 max-w-xl font-sans text-base leading-relaxed text-carbon-900/85 sm:text-base md:text-lg"
          >
            {description}
          </motion.p>

          <motion.div
            variants={v.item}
            className="mt-10 flex w-full max-w-md flex-col items-stretch justify-center gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-start sm:gap-3 lg:max-w-none"
          >
            <Link
              to={primaryButtonTo}
              className="touch-manipulation sm:min-w-[200px]"
            >
              <Button
                variant="white"
                size="lg"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 uppercase tracking-button sm:min-h-0 sm:w-auto"
              >
                {primaryButtonText}
                <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2} />
              </Button>
            </Link>
            {secondaryButtonText && secondaryButtonTo ? (
              <Link
                to={secondaryButtonTo}
                className="touch-manipulation sm:min-w-[200px]"
              >
                <Button
                  variant="white"
                  size="lg"
                  className="min-h-14 w-full uppercase tracking-button sm:min-h-0 sm:w-auto"
                >
                  {secondaryButtonText}
                </Button>
              </Link>
            ) : null}
          </motion.div>
        </div>

        <motion.div
          className="relative mx-auto h-[320px] w-full max-w-xl sm:h-[380px] lg:mx-0 lg:h-[440px] lg:w-1/2 lg:max-w-none"
          variants={v.cards}
        >
          {/* Rear card — sits lower & further right, tilted the other way */}
          <motion.img
            src={imageUrl2}
            alt={imageAlt2}
            variants={v.cardItem}
            loading="lazy"
            {...(!reduceMotion
              ? {
                  whileHover: {
                    y: -6,
                    rotate: 16,
                    transition: { duration: 0.25 },
                  },
                }
              : {})}
            className="absolute bottom-2 right-0 z-0 h-40 w-40 rounded-2xl object-cover shadow-[0_20px_50px_-12px_rgb(0_0_0/0.35)] sm:bottom-4 sm:right-2 sm:h-56 sm:w-56 md:bottom-8 md:right-8 md:h-64 md:w-64 lg:bottom-10 lg:right-4 lg:h-72 lg:w-72 rotate-[14deg] sm:rotate-[16deg]"
          />
          {/* Front card — upper left, counter-angled so they read as a pair, not a stack */}
          <motion.img
            src={imageUrl1}
            alt={imageAlt1}
            variants={v.cardItem}
            loading="lazy"
            {...(!reduceMotion
              ? {
                  whileHover: {
                    y: -8,
                    rotate: -13,
                    transition: { duration: 0.25 },
                  },
                }
              : {})}
            className="absolute left-0 top-4 z-10 h-40 w-40 rounded-2xl object-cover shadow-[0_24px_55px_-10px_rgb(0_0_0/0.4)] sm:left-2 sm:top-8 sm:h-56 sm:w-56 md:left-4 md:top-10 md:h-64 md:w-64 lg:left-6 lg:top-12 lg:h-72 lg:w-72 -rotate-[11deg] sm:-rotate-[13deg]"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
