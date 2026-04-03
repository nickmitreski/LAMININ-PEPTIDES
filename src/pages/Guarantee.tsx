import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import { Heading, Text } from '../components/ui/Typography';

/** Aligned with the Purity Assurance Guarantee (March 2026). */
export default function Guarantee() {
  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <SectionTitle
          title="Purity Assurance Guarantee"
          subtitle="Last updated: March 29, 2026"
          titleClassName="!font-bold"
          subtitleClassName="!font-bold"
        />

        <div className="mx-auto max-w-3xl space-y-8">
          <Text variant="body" className="text-neutral-600">
            Laminin Peptide Lab is committed to maintaining high analytical standards for all
            compounds supplied for laboratory research. Each batch undergoes analytical
            verification prior to release, and Certificates of Analysis are made available to
            support transparency regarding compound identity and purity.
          </Text>
          <Text variant="body" className="text-neutral-600">
            To reinforce our commitment to quality, Laminin Peptide Lab provides a Purity
            Assurance Guarantee for all compounds supplied.
          </Text>

          <div>
            <Heading level={4} className="mb-3 !font-bold">
              Analytical verification
            </Heading>
            <div className="space-y-3 text-neutral-600">
              <Text variant="body">
                Compounds supplied by Laminin Peptide Lab are manufactured by partners operating
                under recognised quality management systems, including GMP-aligned processes and
                ISO-certified facilities (ISO 9001 and ISO 13485).
              </Text>
              <Text variant="body">
                Each batch undergoes analytical verification using established techniques such as
                High Performance Liquid Chromatography (HPLC) to confirm compound purity prior to
                release. Batch-specific Certificates of Analysis are provided so researchers can
                review the relevant analytical documentation.
              </Text>
            </div>
          </div>

          <div>
            <Heading level={4} className="mb-3 !font-bold">
              Purity standard
            </Heading>
            <Text variant="body" className="text-neutral-600">
              Laminin Peptide Lab maintains a minimum purity standard of ≥99% for peptide
              compounds, verified through analytical testing prior to supply. This standard
              reflects our commitment to providing researchers with compounds that meet consistent
              quality expectations.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3 !font-bold">
              Our guarantee
            </Heading>
            <div className="space-y-3 text-neutral-600">
              <Text variant="body">
                If independent analytical testing demonstrates that the purity of a compound
                supplied by Laminin Peptide Lab does not meet the stated specification of ≥99%
                purity, we will provide a full refund for the affected product, and shipping costs.
              </Text>
              <Text variant="body">
                To initiate a review under the Purity Assurance Guarantee, customers may contact
                our team and provide supporting documentation from a recognised analytical
                laboratory. Each case will be reviewed individually to verify the testing
                methodology and ensure the results correspond to the relevant batch.
              </Text>
            </div>
          </div>

          <div>
            <Heading level={4} className="mb-3 !font-bold">
              Additional information
            </Heading>
            <div className="space-y-3 text-neutral-600">
              <Text variant="body">
                The Purity Assurance Guarantee applies specifically to the analytical purity of the
                compound supplied, as verified through recognised analytical testing methods.
              </Text>
              <Text variant="body">
                Compounds supplied by Laminin Peptide Lab are intended strictly for laboratory
                research purposes and are not intended for human consumption or therapeutic use.
                Our objective is to maintain transparent analytical standards and consistent quality
                across every compound supplied to the research community.
              </Text>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
