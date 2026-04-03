import { FinancialHero } from '@/components/ui/hero-section';

export default function Hero() {
  return (
    <FinancialHero
      title={
        <>
          Laboratory verified{' '}
          <span className="underline decoration-2 decoration-accent-dark underline-offset-[0.25em]">
            compounds
          </span>
        </>
      }
      description="High purity compounds supported by analytical testing and documented quality."
      primaryButtonText="Browse library"
      primaryButtonTo="/library"
      secondaryButtonText="View certificates"
      secondaryButtonTo="/coa"
      imageUrl1="/images/products/glow-70mg.png"
      imageUrl2="/images/products/mots-c-40mg.png"
      imageAlt1="GLOW — laboratory vial render"
      imageAlt2="MOTS-c — laboratory vial render"
    />
  );
}
