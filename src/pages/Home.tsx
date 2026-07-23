import { useEffect } from 'react';
import Hero from '../components/sections/Hero';
import TrustBar from '../components/sections/TrustBar';
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

function prefetchLibrary() {
  void import('../pages/Library');
}

export default function Home() {
  useDocumentTitle(
    'Laminin Peptide Lab — Research-Grade Peptides',
    'Australian supplier of high-quality research peptides and laboratory materials. Transparent quality certificates, consistent purity, reliable supply for research applications.'
  );

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const run = () => prefetchLibrary();

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(run, 1200);
    }

    return () => {
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      <Hero />
      <TrustBar />
      <FeaturedProducts />
      <PeptideToggleSection />
      <ResearchCategories />
      <PeptideScience />
      <Disclaimer />
      <CTASection />
    </>
  );
}
