import Section from '../components/layout/Section';
import PageHero from '../components/ui/PageHero';
import PolicySectionHeading from '../components/legal/PolicySectionHeading';
import { Text } from '../components/ui/Typography';
import { Truck, MapPin, Package } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import useScrollReveal from '../hooks/useScrollReveal';

/** Shipping terms (April 2026). */
export default function Shipping() {
  useDocumentTitle(
    'Shipping',
    'Express shipping terms across Australia: delivery windows, packaging, tracking, and discretion.'
  );
  const { ref: contentRef, revealed: contentRevealed } = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageHero
          title="Shipping terms & policy"
          subtitle="Express shipping across Australia with tracking, discreet packaging, and authority-to-leave delivery."
          tiles={[
            { icon: <Truck className="h-4 w-4" />, label: 'Service', value: 'Express Australia-wide' },
            { icon: <MapPin className="h-4 w-4" />, label: 'Delivery', value: 'Next business day dispatch' },
            { icon: <Package className="h-4 w-4" />, label: 'Packaging', value: 'Discreet, no branding' },
          ]}
          className="mb-8 md:mb-10"
        />

        <div ref={contentRef} data-revealed={contentRevealed} className="reveal mx-auto max-w-5xl space-y-8">
          <Text variant="body" className="text-carbon-900">
            Laminin Peptide Lab provides express shipping across Australia, prioritising reliability,
            discretion, and efficient delivery.
          </Text>
          <Text variant="body" className="text-carbon-900">
            All orders are processed and dispatched the next business day to ensure efficient handling
            and timely delivery.
          </Text>

          <div>
            <PolicySectionHeading icon={<Truck />}>Shipping</PolicySectionHeading>
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
            <PolicySectionHeading icon={<MapPin />}>Delivery</PolicySectionHeading>
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
            <PolicySectionHeading icon={<Package />}>Discreet packaging</PolicySectionHeading>
            <Text variant="body" className="text-carbon-900">
              All orders are shipped in discreet packaging, with no external indication of contents.
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
