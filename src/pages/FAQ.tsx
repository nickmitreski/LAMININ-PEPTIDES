import { Link } from 'react-router-dom';
import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import FaqAccordion from '../components/ui/FaqAccordion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { faqItems } from '../data/faq';

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <Section background="white">
        <SectionTitle
          label="Support"
          title="Frequently asked questions"
          subtitle="Laboratory use, certificates of analysis, purity standards, storage, shipping, manufacturing quality, and our Purity Assurance Guarantee."
        />

        <div className="max-w-6xl mx-auto">
          <FaqAccordion items={faqItems} />
        </div>

        <Card padding="lg" className="mt-16 md:mt-20 bg-grey max-w-6xl mx-auto">
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
