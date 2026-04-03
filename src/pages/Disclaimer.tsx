import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import { Heading, Text } from '../components/ui/Typography';

/** Research-use disclaimer (March 2026). */
export default function Disclaimer() {
  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <SectionTitle
          title="Disclaimer"
          subtitle="Last updated: March 29, 2026"
        />

        <div className="mx-auto max-w-3xl space-y-6">
          <Text variant="body" className="text-neutral-600">
            All products supplied by Laminin Peptide Lab are intended strictly for laboratory research
            purposes only.
          </Text>

          <Text variant="body" className="text-neutral-600">
            These compounds are not approved for human consumption, therapeutic use, or diagnostic
            applications. Any reference to biological processes, mechanisms, or scientific literature
            is provided for informational purposes only and does not constitute medical or therapeutic
            claims.
          </Text>

          <Text variant="body" className="text-neutral-600">
            Products are sold exclusively for use by qualified professionals in controlled research
            environments. It is the responsibility of the purchaser to ensure compliance with all
            applicable laws, regulations, and guidelines in their jurisdiction.
          </Text>

          <Text variant="body" className="text-neutral-600">
            Laminin Peptide Lab makes no representations regarding the use or outcomes of these
            compounds outside of legitimate research settings.
          </Text>

          <div>
            <Text variant="body" className="mb-3 text-neutral-600">
              By purchasing from this website, you acknowledge and agree that:
            </Text>
            <ul className="ml-4 list-disc space-y-2 pl-1">
              <Text variant="body" as="li" className="text-neutral-600">
                All products are for research use only
              </Text>
              <Text variant="body" as="li" className="text-neutral-600">
                You are qualified to handle research compounds
              </Text>
              <Text variant="body" as="li" className="text-neutral-600">
                You will not use these products for human consumption or clinical purposes
              </Text>
            </ul>
          </div>

          <Text variant="body" className="text-neutral-600">
            Laminin Peptide Lab shall not be held liable for misuse or improper handling of any
            products supplied.
          </Text>

          <div className="border-t border-neutral-200 pt-8">
            <Heading level={4} className="mb-3">
              Contact
            </Heading>
            <Text variant="body" className="text-neutral-600">
              Questions about this disclaimer:{' '}
              <a
                href="mailto:info@lamininpeptab.com.au"
                className="font-medium text-carbon-900 underline decoration-carbon-900/30 underline-offset-2 hover:decoration-carbon-900"
              >
                info@lamininpeptab.com.au
              </a>
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
