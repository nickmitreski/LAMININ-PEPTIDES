import Section from '../components/layout/Section';
import PageHero from '../components/ui/PageHero';
import FaqAccordion from '../components/ui/FaqAccordion';
import CTACard from '../components/ui/CTACard';
import { faqItems } from '../data/faq';
import { HelpCircle, ShieldCheck, Mail } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import useScrollReveal from '../hooks/useScrollReveal';

export default function FAQ() {
  useDocumentTitle(
    'FAQ',
    'Answers to common questions on certificates of analysis, purity standards, storage, shipping, manufacturing quality, and our purity assurance guarantee.'
  );
  const { ref: accordionRef, revealed: accordionRevealed } = useScrollReveal<HTMLDivElement>();
  const { ref: ctaRef, revealed: ctaRevealed } = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageHero
          title="Frequently asked questions"
          subtitle="Laboratory use, certificates of analysis, purity standards, storage, shipping, manufacturing quality, and our purity assurance guarantee."
          tiles={[
            { icon: <HelpCircle className="h-4 w-4" />, label: 'Topics', value: 'Purity, storage & shipping' },
            { icon: <ShieldCheck className="h-4 w-4" />, label: 'Guarantee', value: '99%+ purity assured' },
            { icon: <Mail className="h-4 w-4" />, label: 'Support', value: 'Response within 24 hours' },
          ]}
          className="mb-8 md:mb-10"
        />

        <div ref={accordionRef} data-revealed={accordionRevealed} className="reveal mx-auto max-w-5xl">
          <FaqAccordion items={faqItems} />
        </div>

        <div ref={ctaRef} data-revealed={ctaRevealed} className="reveal">
          <CTACard
            title="Didn't find what you need?"
            description="Send a detailed message through our contact form — we reply to technical and procurement questions from qualified research buyers."
            className="mx-auto max-w-5xl"
          />
        </div>
      </Section>
    </div>
  );
}
