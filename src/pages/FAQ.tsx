import { Link } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageTopBanner from '../components/ui/PageTopBanner';
import FaqAccordion from '../components/ui/FaqAccordion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { faqItems } from '../data/faq';
import { HelpCircle } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function FAQ() {
  useDocumentTitle(
    'FAQ',
    'Answers to common questions on certificates of analysis, purity standards, storage, shipping, manufacturing quality, and our purity assurance guarantee.'
  );
  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageTopBanner
          title="Frequently asked questions"
          subtitle="Laboratory use, certificates of analysis, purity standards, storage, shipping, manufacturing quality, and our purity assurance guarantee."
          eyebrow="Support"
          icon={<HelpCircle />}
        />

        <div className="mx-auto max-w-5xl">
          <FaqAccordion items={faqItems} />
        </div>

        <Card padding="lg" className="mx-auto mt-16 max-w-5xl bg-platinum md:mt-20">
          <Heading level={5} className="mb-3">
            Didn’t find what you need?
          </Heading>
          <Text variant="small" muted className="mb-5">
            Send a detailed message through our contact form—we reply to technical
            and procurement questions from qualified research buyers.
          </Text>
          <Link to="/contact">
            <Button variant="primary" size="md">
              Contact us
            </Button>
          </Link>
        </Card>
      </Section>
    </div>
  );
}
