import { useEffect, useState } from 'react';
import { FinancialHero } from '@/components/ui/hero-section';

export default function Hero() {
  const fullTitle = 'Laboratory verified compounds';
  const [typedTitle, setTypedTitle] = useState('');

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedTitle(fullTitle.slice(0, index));
      if (index >= fullTitle.length) {
        window.clearInterval(timer);
      }
    }, 55);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <FinancialHero
      title={typedTitle || 'Laboratory verified compounds'}
      eyebrow=""
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
