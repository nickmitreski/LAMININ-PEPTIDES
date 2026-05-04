import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageHero from '../components/ui/PageHero';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SearchField from '../components/ui/SearchField';
import { Heading, Text } from '../components/ui/Typography';
import IconTile from '../components/ui/IconTile';
import PolicySectionHeading from '../components/legal/PolicySectionHeading';
import type { Peptide } from '../data/peptides';
import { allPeptides, isLiquidAncillaryPeptide } from '../data/peptides';
import { getVariants } from '../data/productPricing';
import {
  coaDownloadButtonLabel,
  getCoaDownload,
} from '../data/coaPdfs';
import { CheckCircle, FileCheck, Award, FlaskConical, Target, FileText } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import useScrollReveal from '../hooks/useScrollReveal';

type CoaCardEntry = {
  key: string;
  peptide: Peptide;
  variantId?: string;
  title: string;
};

function buildCoaCardEntries(peptides: Peptide[]): CoaCardEntry[] {
  const out: CoaCardEntry[] = [];
  for (const p of peptides) {
    if (p.id === 'retatrutide') {
      const vars = getVariants('retatrutide');
      if (vars?.length) {
        for (const v of vars) {
          out.push({
            key: `retatrutide-${v.id}`,
            peptide: p,
            variantId: v.id,
            title: `Retatrutide (${v.label})`,
          });
        }
      } else {
        out.push({ key: p.id, peptide: p, title: p.name });
      }
    } else {
      out.push({ key: p.id, peptide: p, title: p.name });
    }
  }
  return out;
}

export default function COA() {
  useDocumentTitle(
    'Certificates of Analysis',
    'Browse and download certificates of analysis for our research peptide range. Independently verified purity, mass, and identity data.'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const { ref: gridRef, revealed: gridRevealed } = useScrollReveal<HTMLDivElement>();

  const coaEntries = useMemo(() => {
    const verified = allPeptides.filter(
      (p) => p.coaVerified && !isLiquidAncillaryPeptide(p.id)
    );
    return buildCoaCardEntries(verified);
  }, []);

  const filteredEntries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return coaEntries;
    return coaEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.peptide.name.toLowerCase().includes(q) ||
        e.peptide.category.toLowerCase().includes(q)
    );
  }, [coaEntries, searchTerm]);

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageHero
          title="Certificate of analysis"
          subtitle="View third-party verification and purity reports for all compounds."
          tiles={[
            { icon: <FlaskConical className="h-4 w-4" />, label: 'Method', value: 'HPLC purity verified' },
            { icon: <Target className="h-4 w-4" />, label: 'Standard', value: '\u226599% purity guaranteed' },
            { icon: <FileText className="h-4 w-4" />, label: 'Reports', value: 'Batch-specific documentation' },
          ]}
          className="mb-8 md:mb-10"
        />

        <div
          className="mx-auto mb-10 max-w-5xl space-y-6 rounded-sm border border-accent/45 px-4 py-6 text-left sm:px-6 sm:py-7 md:mb-12"
          aria-label="About certificates of analysis"
        >
          <div className="space-y-4">
            <PolicySectionHeading icon={<FileCheck />}>Certificates of Analysis</PolicySectionHeading>
            <div className="space-y-3">
              <Text variant="body" className="text-carbon-900">
                Laminin Peptide Lab provides batch-specific Certificates of Analysis to support
                analytical transparency and product verification.
              </Text>
              <Text variant="body" className="text-carbon-900">
                Each batch undergoes analytical verification prior to release. Documentation confirming
                compound identity and purity is made available to researchers for review.
              </Text>
              <Text variant="body" className="text-carbon-900">
                Certificates of Analysis can be accessed directly on each product page within the
                Analytical Documentation section.
              </Text>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <PolicySectionHeading icon={<Award />}>Quality &amp; Analytical Integrity</PolicySectionHeading>
            <div className="space-y-3">
              <Text variant="body" className="text-carbon-900">
                At Laminin Peptide Lab, maintaining the analytical integrity of the compounds we
                supply is a core priority.
              </Text>
              <Text variant="body" className="text-carbon-900">
                We conduct ongoing verification of products supplied by manufacturing partners that
                operate under recognised quality management systems, including GMP-aligned processes,
                ISO 9001, and ISO 13485 certifications.
              </Text>
              <Text variant="body" className="text-carbon-900">
                In certain cases, identifying details relating to the original manufacturing partner
                may be redacted from publicly available Certificates of Analysis. This is standard
                practice to protect supplier confidentiality while still providing researchers with
                the relevant analytical data confirming compound identity and purity.
              </Text>
              <Text variant="body" className="text-carbon-900">
                All batches supplied are verified using HPLC purity analysis as a minimum standard
                before release.
              </Text>
              <Text variant="body" className="text-carbon-900">
                To reinforce our commitment to quality, Laminin Peptide Lab provides a{' '}
                <Link
                  to="/guarantee"
                  className="font-medium text-accent-dark underline decoration-accent/60 underline-offset-2 transition-opacity hover:opacity-90 touch-manipulation"
                >
                  Purity Assurance Guarantee
                </Link>
                . If independent analytical testing demonstrates that the purity of a supplied
                compound does not meet the stated specification of ≥99% purity, we will provide a
                full refund.
              </Text>
              <Text variant="body" className="text-carbon-900">
                Our objective is to provide researchers with transparent documentation and consistent
                analytical standards across every compound supplied.
              </Text>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-12">
          <SearchField
            type="search"
            placeholder="Search by compound name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            aria-label="Search certificates by compound"
          />
        </div>

        <div ref={gridRef} data-revealed={gridRevealed} className="reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map(({ key, peptide, variantId, title }) => {
            const coa = getCoaDownload(peptide.id, variantId);
            return (
              <Card key={key} padding="lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Heading level={5} className="mb-2">
                      {title}
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
                    <Text variant="caption" weight="medium">
                      #
                      {variantId
                        ? `${peptide.id}-${variantId}`.toUpperCase()
                        : peptide.id.toUpperCase()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="caption" muted>Status:</Text>
                    <div className="inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                      <Text variant="caption" weight="medium">Verified</Text>
                    </div>
                  </div>
                </div>

                {coa ? (
                  <Button
                    variant="accent"
                    size="md"
                    className="w-full"
                    href={coa.url}
                    download={coa.filename}
                  >
                    {coaDownloadButtonLabel(coa.kind)}
                  </Button>
                ) : (
                  <Button variant="outline" size="md" className="w-full" disabled>
                    Certificate coming soon
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-16">
            <Text variant="small" muted>No certificates found matching your search.</Text>
          </div>
        )}
      </Section>
    </div>
  );
}
