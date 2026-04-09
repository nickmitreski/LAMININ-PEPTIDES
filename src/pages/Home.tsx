import Hero from '../components/sections/Hero';
import TrustBar from '../components/sections/TrustBar';
import FeaturedProducts from '../components/sections/FeaturedProducts';
import PeptideToggleSection from '../components/sections/PeptideToggleSection';
import ResearchCategories from '../components/sections/ResearchCategories';
import QualityAndSecurity from '../components/sections/QualityAndSecurity';
import Disclaimer from '../components/sections/Disclaimer';
import CTASection from '../components/sections/CTASection';
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
} from '../components/seo/StructuredData';

export default function Home() {
  return (
    <>
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      <Hero />
      <TrustBar />
      <FeaturedProducts />
      <QualityAndSecurity />
      <PeptideToggleSection />
      <Disclaimer />
      <CTASection />
    </>
  );
}
