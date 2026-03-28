import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Heading, Text } from '../ui/Typography';
import IconTile from '../ui/IconTile';
import { FileCheck, Download, Shield } from 'lucide-react';

export default function LabResults() {
  const sampleCertificates = [
    { id: 1, compound: 'BPC-157', purity: '99.2%', batch: 'LPL-2024-001' },
    { id: 2, compound: 'TB-500', purity: '99.7%', batch: 'LPL-2024-002' },
    { id: 3, compound: 'Semaglutide', purity: '99.4%', batch: 'LPL-2024-003' },
  ];

  return (
    <Section background="white">
      <SectionTitle
        title="Lab Results from USA"
        subtitle="Third-party verified certificates of analysis for complete transparency"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleCertificates.map((cert) => (
          <Card key={cert.id} padding="lg">
            <div className="flex items-start justify-between mb-4">
              <Badge variant="success" size="sm" icon={<Shield className="w-3 h-3" strokeWidth={1.5} />}>
                Verified
              </Badge>
              <IconTile>
                <FileCheck className="w-4 h-4 text-accent" strokeWidth={1.5} />
              </IconTile>
            </div>

            <Heading level={5} className="mb-2">
              {cert.compound}
            </Heading>

            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between">
                <Text variant="caption" muted>Purity:</Text>
                <Text variant="caption" weight="medium">{cert.purity}</Text>
              </div>
              <div className="flex justify-between">
                <Text variant="caption" muted>Batch:</Text>
                <Text variant="caption" weight="medium">{cert.batch}</Text>
              </div>
            </div>

            <Button variant="outline" size="md" className="w-full gap-2">
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              Download COA
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link to="/coa">
          <Button variant="outline" size="md">
            View All Certificates
          </Button>
        </Link>
      </div>
    </Section>
  );
}
