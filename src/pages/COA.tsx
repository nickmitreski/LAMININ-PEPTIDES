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
import { isLiquidAncillaryPeptide } from '../data/peptides';
import { getVariants } from '../data/productPricing';
import {
  coaDownloadButtonLabel,
  getCoaDownload,
} from '../data/coaPdfs';
import { CheckCircle, FileCheck, Award, FlaskConical, Target, FileText } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import useScrollReveal from '../hooks/useScrollReveal';
import { useShopImages } from '../context/ShopImagesContext';

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
  const { allProducts, getLiveCatalogEntry } = useShopImages();

  const coaEntries = useMemo(() => {
    const verified = allProducts.filter(
      (p) =>
        !isLiquidAncillaryPeptide(p.id) &&
        (p.coaVerified || Boolean(getLiveCatalogEntry(p.id)?.coaLinkUrl))
    );
    return buildCoaCardEntries(verified).sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
  }, [allProducts, getLiveCatalogEntry]);

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
          subtitle="Download batch-specific purity and identity reports for our research compounds."
          tiles={[
            { icon: <FlaskConical className="h-4 w-4" />, label: 'Method', value: 'HPLC purity verified' },
            { icon: <Target className="h-4 w-4" />, label: 'Standard', value: '\u226599% purity guaranteed' },
            { icon: <FileText className="h-4 w-4" />, label: 'Reports', value: 'Batch-specific documentation' },
          ]}
          className="mb-6 md:mb-8"
        />

        {/* Certificates first — long copy used to bury this grid below the fold */}
        <div className="mx-auto mb-5 max-w-xl sm:mb-6">
          <SearchField
            type="search"
            placeholder="Search by compound name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            aria-label="Search certificates by compound"
          />
        </div>

        <Text variant="caption" muted className="mb-4 block text-center sm:mb-5">
          {filteredEntries.length} certificate{filteredEntries.length === 1 ? '' : 's'}
        </Text>

        <div
          ref={gridRef}
          data-revealed={gridRevealed}
          className="reveal mb-12 grid grid-cols-1 gap-6 md:mb-16 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredEntries.map(({ key, peptide, variantId, title }) => {
            const coa = getCoaDownload(peptide.id, variantId);
            const liveCoaUrl = getLiveCatalogEntry(peptide.id)?.coaLinkUrl;
            return (
              <Card key={key} padding="lg">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <Heading level={5} className="mb-2">
                      {title}
                    </Heading>
                    <Badge variant="neutral" size="sm">
                      {peptide.category}
                    </Badge>
                  </div>
                  <IconTile>
                    <CheckCircle className="h-4 w-4 text-accent" strokeWidth={1.5} />
                  </IconTile>
                </div>

                <div className="mb-5 space-y-2.5">
                  <div className="flex justify-between">
                    <Text variant="caption" muted>
                      Purity:
                    </Text>
                    <Text variant="caption" weight="medium">
                      {peptide.purity}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="caption" muted>
                      Batch:
                    </Text>
                    <Text variant="caption" weight="medium">
                      #
                      {variantId
                        ? `${peptide.id}-${variantId}`.toUpperCase()
                        : peptide.id.toUpperCase()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="caption" muted>
                      Status:
                    </Text>
                    <div className="inline-flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                      <Text variant="caption" weight="medium">
                        Verified
                      </Text>
                    </div>
                  </div>
                </div>

                {liveCoaUrl ? (
                  <Button
                    variant="accent"
                    size="md"
                    className="w-full"
                    href={liveCoaUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View current COA
                  </Button>
                ) : coa ? (
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
          <div className="py-12 text-center">
            <Text variant="small" muted>
              No certificates found matching your search.
            </Text>
          </div>
        )}

        <div
          className="mx-auto max-w-5xl space-y-6 rounded-sm border border-accent/45 px-4 py-6 text-left sm:px-6 sm:py-7"
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
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <PolicySectionHeading icon={<Award />}>Quality &amp; Analytical Integrity</PolicySectionHeading>
            <div className="space-y-3">
              <Text variant="body" className="text-carbon-900">
                All batches supplied are verified using HPLC purity analysis as a minimum standard
                before release. Supplier identifying details may be redacted to protect confidentiality
                while still providing the relevant analytical data.
              </Text>
              <Text variant="body" className="text-carbon-900">
                Laminin Peptide Lab also provides a{' '}
                <Link
                  to="/guarantee"
                  className="touch-manipulation font-medium text-accent-dark underline decoration-accent/60 underline-offset-2 transition-opacity hover:opacity-90"
                >
                  Purity Assurance Guarantee
                </Link>
                . If independent testing shows purity below the stated ≥99% specification, we provide
                a full refund.
              </Text>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
