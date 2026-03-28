import Hero from '../components/sections/Hero';
import TrustBar from '../components/sections/TrustBar';
import FeaturedProducts from '../components/sections/FeaturedProducts';
import PeptideToggleSection from '../components/sections/PeptideToggleSection';
import ResearchCategories from '../components/sections/ResearchCategories';
import Disclaimer from '../components/sections/Disclaimer';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedProducts />
      <PeptideToggleSection />
      <ResearchCategories />
      <Disclaimer />
      <CTASection />
    </>
  );
}
