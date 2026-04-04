import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import PolicySectionHeading from '../components/legal/PolicySectionHeading';
import { Text } from '../components/ui/Typography';

/** Shipping terms (April 2026). */
export default function Shipping() {
  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <SectionTitle
          title="Shipping Terms & Policy"
          subtitle="Last updated: April 5, 2026"
        />

        <div className="mx-auto max-w-3xl space-y-8">
          <Text variant="body" className="text-neutral-600">
            Laminin Peptide Lab provides express shipping across Australia, prioritising reliability,
            discretion, and efficient delivery.
          </Text>
          <Text variant="body" className="text-neutral-600">
            All orders are processed and dispatched the next business day to ensure efficient handling
            and timely delivery.
          </Text>

          <div>
            <PolicySectionHeading>Shipping</PolicySectionHeading>
            <ul className="mb-4 ml-4 list-disc space-y-2 pl-1">
              <Text variant="body" as="li" className="text-neutral-600">
                Complimentary express shipping on orders over $250
              </Text>
              <Text variant="body" as="li" className="text-neutral-600">
                Flat rate express shipping of $11.90 for all other orders
              </Text>
            </ul>
            <Text variant="body" className="text-neutral-600">
              All shipments are sent via express service Australia-wide, with tracking details provided
              upon dispatch.
            </Text>
          </div>

          <div>
            <PolicySectionHeading>Delivery</PolicySectionHeading>
            <div className="space-y-3 text-neutral-600">
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
            <PolicySectionHeading>Discreet Packaging</PolicySectionHeading>
            <Text variant="body" className="text-neutral-600">
              All orders are shipped in discreet packaging, with no external indication of contents.
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
