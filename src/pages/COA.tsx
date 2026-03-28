import { useState } from 'react';
import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Heading, Text } from '../components/ui/Typography';
import IconTile from '../components/ui/IconTile';
import { allPeptides } from '../data/peptides';
import { Search, CheckCircle } from 'lucide-react';

export default function COA() {
  const [searchTerm, setSearchTerm] = useState('');

  const verifiedPeptides = allPeptides.filter(p => p.coaVerified);

  const filteredPeptides = verifiedPeptides.filter(peptide =>
    peptide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    peptide.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Section background="white">
        <SectionTitle
          title="Certificate of Analysis"
          subtitle="View third-party verification and purity reports for all compounds"
        />

        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by compound name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-900/35" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeptides.map((peptide) => (
            <Card key={peptide.id} padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Heading level={5} className="mb-2">
                    {peptide.name}
                  </Heading>
                  <Badge variant="neutral" size="sm">
                    {peptide.category}
                  </Badge>
                </div>
                <IconTile>
                  <CheckCircle className="w-4 h-4 text-accent" strokeWidth={1.5} />
                </IconTile>
              </div>

              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between">
                  <Text variant="caption" muted>Purity:</Text>
                  <Text variant="caption" weight="medium">{peptide.purity}</Text>
                </div>
                <div className="flex justify-between">
                  <Text variant="caption" muted>Batch:</Text>
                  <Text variant="caption" weight="medium">#{peptide.id.toUpperCase()}</Text>
                </div>
                <div className="flex justify-between">
                  <Text variant="caption" muted>Status:</Text>
                  <div className="inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                    <Text variant="caption" weight="medium">Verified</Text>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="md" className="w-full">
                Download COA (PDF)
              </Button>
            </Card>
          ))}
        </div>

        {filteredPeptides.length === 0 && (
          <div className="text-center py-16">
            <Text variant="small" muted>No certificates found matching your search.</Text>
          </div>
        )}

        <Card padding="lg" className="mt-16 bg-grey">
          <div className="max-w-2xl mx-auto text-center">
            <Heading level={5} className="mb-3">About Our COA Program</Heading>
            <Text variant="small" muted>
              Every compound supplied by Laminin Peptide Lab undergoes rigorous third-party analytical testing.
              Our Certificates of Analysis include HPLC, mass spectrometry, and purity verification data from
              independent laboratories, ensuring complete transparency and quality assurance for your research.
            </Text>
          </div>
        </Card>
      </Section>
    </div>
  );
}
