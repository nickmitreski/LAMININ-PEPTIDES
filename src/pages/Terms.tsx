import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import { Heading, Text } from '../components/ui/Typography';

export default function Terms() {
  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <SectionTitle
          title="Terms & Conditions"
          subtitle="Last updated: March 29, 2026"
        />

        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <Heading level={4} className="mb-4">
              1. Acceptance of Terms
            </Heading>
            <Text variant="body" className="text-neutral-600">
              By accessing and using this website, you accept and agree to be bound by the terms
              and conditions of this agreement. If you do not agree to these terms, please do not
              use this website.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              2. Research Use Only
            </Heading>
            <Text variant="body" className="text-neutral-600 mb-3">
              All products sold by Laminin Peptide Lab are intended strictly for laboratory
              research purposes only. By purchasing from us, you acknowledge and agree that:
            </Text>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <Text variant="body" as="li" className="text-neutral-600">
                Products are not intended for human consumption or therapeutic use
              </Text>
              <Text variant="body" as="li" className="text-neutral-600">
                You are a qualified research professional or institution
              </Text>
              <Text variant="body" as="li" className="text-neutral-600">
                You will use products in compliance with all applicable laws
              </Text>
              <Text variant="body" as="li" className="text-neutral-600">
                Products will be handled in appropriate laboratory settings
              </Text>
            </ul>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              3. Product Information
            </Heading>
            <Text variant="body" className="text-neutral-600">
              We strive to provide accurate product information and Certificates of Analysis.
              However, we do not warrant that product descriptions, specifications, or other
              content is accurate, complete, reliable, current, or error-free.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              4. Pricing and Payment
            </Heading>
            <Text variant="body" className="text-neutral-600 mb-3">
              All prices are in Australian Dollars (AUD) unless otherwise stated. We reserve the
              right to change prices at any time without notice. Payment is due at the time of
              order placement.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              5. Shipping and Delivery
            </Heading>
            <Text variant="body" className="text-neutral-600">
              We ship research compounds with appropriate cold chain logistics where required.
              Delivery times are estimates only. We are not responsible for delays caused by
              shipping carriers, customs, or events beyond our control.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              6. Returns and Refunds
            </Heading>
            <Text variant="body" className="text-neutral-600">
              Due to the nature of research compounds, we cannot accept returns of opened or used
              products. If you receive a defective or incorrect product, please contact us within
              7 days of delivery for a replacement or refund.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              7. Limitation of Liability
            </Heading>
            <Text variant="body" className="text-neutral-600">
              To the fullest extent permitted by law, Laminin Peptide Lab shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising out of
              your use of our products or website.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              8. Intellectual Property
            </Heading>
            <Text variant="body" className="text-neutral-600">
              All content on this website, including text, graphics, logos, and images, is the
              property of Laminin Peptide Lab and is protected by copyright and other intellectual
              property laws.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              9. Governing Law
            </Heading>
            <Text variant="body" className="text-neutral-600">
              These terms and conditions are governed by and construed in accordance with the laws
              of Australia. You agree to submit to the exclusive jurisdiction of the Australian
              courts.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              10. Changes to Terms
            </Heading>
            <Text variant="body" className="text-neutral-600">
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting to the website. Your continued use of the website after
              changes constitutes acceptance of the modified terms.
            </Text>
          </div>

          <div>
            <Heading level={4} className="mb-4">
              11. Contact Information
            </Heading>
            <Text variant="body" className="text-neutral-600">
              For questions about these Terms & Conditions, please contact us at:
            </Text>
            <Text variant="body" className="text-neutral-600 mt-2">
              Email: info@lamininpeptidelab.com.au
            </Text>
          </div>
        </div>
      </Section>
    </div>
  );
}
