import Section from '../components/layout/Section';
import PageTopBanner from '../components/ui/PageTopBanner';
import { Heading, Text } from '../components/ui/Typography';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import useScrollReveal from '../hooks/useScrollReveal';

/** Aligned with the published Privacy Policy (March 2026). */
export default function Privacy() {
  useDocumentTitle(
    'Privacy Policy',
    'How Laminin Peptide Lab collects, uses, and protects your personal information.'
  );
  const { ref: contentRef, revealed: contentRevealed } = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageTopBanner title="Privacy policy" subtitle="How we handle your data and protect your privacy." />

        <div ref={contentRef} data-revealed={contentRevealed} className="reveal mx-auto max-w-5xl space-y-8">
          <Text variant="body" className="text-carbon-900">
            Laminin Peptide Lab is committed to protecting your privacy and handling your
            information with discretion and integrity.
          </Text>

          <div>
            <Heading level={4} className="mb-3">
              Information collection
            </Heading>
            <Text variant="body" className="text-carbon-900">
              We collect only the information necessary to process and fulfil orders, including
              basic contact and delivery details provided at the time of purchase. Limited
              technical data may also be collected automatically to ensure the functionality,
              security, and performance of the website.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Use of information
            </Heading>
            <Text variant="body" className="mb-3 text-carbon-900">
              Information collected is used solely to:
            </Text>
            <ul className="ml-4 list-disc space-y-2 pl-1">
              <Text variant="body" as="li" className="text-carbon-900">
                Process and deliver orders
              </Text>
              <Text variant="body" as="li" className="text-carbon-900">
                Communicate relevant order updates
              </Text>
              <Text variant="body" as="li" className="text-carbon-900">
                Maintain internal records
              </Text>
              <Text variant="body" as="li" className="text-carbon-900">
                Improve website performance and user experience
              </Text>
            </ul>
            <Text variant="body" className="mt-3 text-carbon-900">
              We do not sell, rent, or distribute personal information to third parties.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Data security
            </Heading>
            <Text variant="body" className="text-carbon-900">
              We take reasonable measures to protect your information using secure systems and
              industry-standard practices.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Third-party services
            </Heading>
            <Text variant="body" className="text-carbon-900">
              Certain third-party services may be used to support payment processing, website
              functionality, and order fulfilment.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Data retention
            </Heading>
            <Text variant="body" className="text-carbon-900">
              Information is retained only for as long as necessary to fulfil its intended
              purpose.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Changes to this policy
            </Heading>
            <Text variant="body" className="text-carbon-900">
              This Privacy Policy may be updated periodically.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Research use &amp; disclaimer
            </Heading>
            <div className="space-y-3 text-carbon-900">
              <Text variant="body">
                All products supplied by Laminin Peptide Lab are intended strictly for laboratory
                research purposes only. These compounds are not approved for human consumption,
                therapeutic use, or diagnostic applications. Any reference to biological processes,
                mechanisms, or scientific literature is provided for informational purposes only
                and does not constitute medical or therapeutic claims.
              </Text>
              <Text variant="body">
                Products are sold exclusively for use by qualified professionals in controlled
                research environments. It is the responsibility of the purchaser to ensure
                compliance with all applicable laws, regulations, and guidelines in their
                jurisdiction.
              </Text>
              <Text variant="body">
                Laminin Peptide Lab makes no representations regarding the use or outcomes of
                these compounds outside of legitimate research settings.
              </Text>
              <Text variant="body">
                By purchasing from this website, you acknowledge and agree that: all products are
                for research use only; you are qualified to handle research compounds; and you
                will not use these products for human consumption or clinical purposes.
              </Text>
              <Text variant="body">
                Laminin Peptide Lab shall not be held liable for misuse or improper handling of any
                products supplied.
              </Text>
            </div>
          </div>

          <div>
            <Heading level={4} className="mb-3">
              Contact
            </Heading>
            <Text variant="body" className="text-carbon-900">
              Questions about this Privacy Policy:{' '}
              <a
                href="mailto:info@lamininpeplab.com.au"
                className="font-medium text-carbon-900 underline decoration-carbon-900/30 underline-offset-2 hover:decoration-carbon-900"
              >
                info@lamininpeplab.com.au
              </a>
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
