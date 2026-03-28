import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import { Heading, Text } from '../ui/Typography';

export default function Features() {
  return (
    <Section background="neutral" spacing="xl" className="relative overflow-hidden">
      {/* Laminin symbol watermark - positioned right, partially clipped */}
      <img
        src="/images/brand/symbol-teal-circle.svg"
        alt=""
        className="absolute right-0 md:right-[-5%] top-1/2 -translate-y-1/2 w-[300px] md:w-[400px] opacity-[0.18] pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* Centered white card with content */}
      <div className="relative z-10 max-w-xl mx-auto bg-white rounded-xl shadow-sm p-10 md:p-12">
        <Heading level={3} className="text-accent tracking-wider mb-6">
          Analytical Transparency
        </Heading>

        <Text variant="small" className="mb-4">
          Each compound supplied by{' '}
          <strong className="font-medium">Laminin Peptide Lab</strong> is
          supported by analytical documentation verifying identity and purity.
        </Text>

        <Text variant="small" muted className="mb-6">
          Our testing framework ensures every batch meets strict research grade
          standards, with Certificates of Analysis available for review.
        </Text>

        <div className="text-center">
          <Link
            to="/coa"
            className="text-xs text-neutral-600 hover:text-carbon-900 underline underline-offset-4 transition-colors"
          >
            View Certificates of Analysis
          </Link>
        </div>
      </div>
    </Section>
  );
}
