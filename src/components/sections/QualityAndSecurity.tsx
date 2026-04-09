import Section from '../layout/Section';
import Container from '../layout/Container';
import { Heading, Text } from '../ui/Typography';
import { Shield, Award } from 'lucide-react';

export default function QualityAndSecurity() {
  return (
    <Section background="accent" spacing="lg">
      <Container>
        <div className="space-y-12 lg:space-y-16">
          {/* Quality Assurance Section - Image Left */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Image placeholder - wide and short */}
            <div className="w-full lg:w-96 aspect-[8/3] bg-white/90 rounded-lg flex items-center justify-center border border-white flex-shrink-0">
              <Award className="w-20 h-20 text-accent" strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="flex-1">
              <Heading level={3} className="mb-4 font-bold text-carbon-900">
                Professional Quality Assurance
              </Heading>
              <Text variant="body" className="text-carbon-900/90 leading-relaxed">
                Laminin Peptide Lab partners with leading independent analytical laboratories
                to provide comprehensive third-party testing for all research peptides. Our
                commitment to transparency ensures every batch is verified for identity and
                purity, delivering the highest quality compounds for accurate research outcomes.
                Each product includes detailed Certificates of Analysis, supporting reliable
                and reproducible research applications.
              </Text>
            </div>
          </div>

          {/* Secure Payment Section - Image Right */}
          <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-start">
            {/* Image placeholder - wide and short */}
            <div className="w-full lg:w-96 aspect-[8/3] bg-white/90 rounded-lg flex items-center justify-center border border-white flex-shrink-0">
              <Shield className="w-20 h-20 text-accent" strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="flex-1">
              <Heading level={3} className="mb-4 font-bold text-carbon-900">
                Secure Encrypted Payment
              </Heading>
              <Text variant="body" className="text-carbon-900/90 leading-relaxed">
                Your transactions are protected through CoreForge Payments, a secure payment
                platform integrated with Square's industry-leading payment processing. We employ
                end-to-end encryption, two-factor authentication (2FA), and PCI-compliant security
                standards to ensure your payment information remains completely secure. CoreForge
                supports all major credit and debit cards, providing a trusted and seamless
                checkout experience.
              </Text>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
