import Section from '../components/layout/Section';
import PageTopBanner from '../components/ui/PageTopBanner';
import PolicySectionHeading from '../components/legal/PolicySectionHeading';
import { Text } from '../components/ui/Typography';
import { Truck } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Shipping terms (April 2026). */
export default function Shipping() {
  useDocumentTitle(
    'Shipping',
    'Express shipping terms across Australia: delivery windows, packaging, tracking, and discretion.'
  );
  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageTopBanner
          title="Shipping terms & policy"
          subtitle="Express shipping across Australia with tracking, discreet packaging, and authority-to-leave delivery."
          eyebrow="Shipping & Delivery"
          icon={<Truck />}
        />

        <div className="mx-auto max-w-5xl space-y-8">
          <Text variant="body" className="text-carbon-900">
            Laminin Peptide Lab provides express shipping across Australia, prioritising reliability,
            discretion, and efficient delivery.
          </Text>
          <Text variant="body" className="text-carbon-900">
            All orders are processed and dispatched the next business day to ensure efficient handling
            and timely delivery.
          </Text>

          <div>
            <PolicySectionHeading>Shipping</PolicySectionHeading>
            <ul className="mb-4 ml-4 list-disc space-y-2 pl-1">
              <Text variant="body" as="li" className="text-carbon-900">
                Complimentary express shipping on orders over $250
              </Text>
              <Text variant="body" as="li" className="text-carbon-900">
                Flat rate express shipping of $11.90 for all other orders
              </Text>
            </ul>
            <Text variant="body" className="text-carbon-900">
              All shipments are sent via express service Australia-wide, with tracking details provided
              upon dispatch.
            </Text>
          </div>

          <div>
            <PolicySectionHeading>Delivery</PolicySectionHeading>
            <div className="space-y-3 text-carbon-900">
              <Text variant="body">
                All deliveries are sent with authority to leave (ATL). Parcels may be left unattended
                at the delivery address, and customers are responsible for ensuring the location is
                secure.
              </Text>
              <Text variant="body">
                Laminin Peptide Lab is not responsible for parcels once marked as delivered.
              </Text>
            </div>
          </div>

          <div>
            <PolicySectionHeading>Discreet packaging</PolicySectionHeading>
            <Text variant="body" className="text-carbon-900">
              All orders are shipped in discreet packaging, with no external indication of contents.
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
