import Hero from '../components/sections/Hero';
import TrustBar from '../components/sections/TrustBar';
// import PromoVideo from '../components/sections/PromoVideo'; // Hidden until video is ready
import FeaturedProducts from '../components/sections/FeaturedProducts';
import PeptideToggleSection from '../components/sections/PeptideToggleSection';
import PeptideScience from '../components/sections/PeptideScience';
import ResearchCategories from '../components/sections/ResearchCategories';
import Disclaimer from '../components/sections/Disclaimer';
import CTASection from '../components/sections/CTASection';
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
} from '../components/seo/StructuredData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Home() {
  useDocumentTitle(
    'Laminin Peptide Lab — Research-Grade Peptides',
    'Australian supplier of high-quality research peptides and laboratory materials. Transparent quality certificates, consistent purity, reliable supply for research applications.'
  );

  return (
    <>
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      <Hero />
      <TrustBar />
      {/* <PromoVideo /> */}{/* Hidden until video asset is ready */}
      <FeaturedProducts />
      <PeptideToggleSection />
      <ResearchCategories />
      <PeptideScience />
      <Disclaimer />
      <CTASection />
    </>
  );
}
