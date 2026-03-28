import { useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import ToggleTabs from '../components/ui/ToggleTabs';
import PeptideCard from '../components/peptides/PeptideCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import TextLink from '../components/ui/TextLink';
import { Heading, Text } from '../components/ui/Typography';
import { peptideCategories, getPeptidesByCategory } from '../data/peptides';
import { Search } from 'lucide-react';

export default function Library() {
  const [activeCategory, setActiveCategory] = useState(peptideCategories[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const categoryPeptides = getPeptidesByCategory(activeCategory);
  const filteredPeptides = searchTerm
    ? categoryPeptides.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categoryPeptides;

  return (
    <div className="min-h-screen">
      <Section background="white">
        <SectionTitle
          title="Research Library"
          subtitle="Browse our complete catalogue of laboratory-grade peptides with verified purity"
        />

        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search compounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-900/35" />
          </div>
        </div>

        <ToggleTabs
          tabs={peptideCategories}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        <div className="mt-6 flex items-center justify-between">
          <Text variant="caption" muted>
            {filteredPeptides.length} compounds found
          </Text>
          <TextLink to="/coa">View all certificates →</TextLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredPeptides.map((peptide) => (
            <PeptideCard key={peptide.id} peptide={peptide} />
          ))}
        </div>

        {filteredPeptides.length === 0 && (
          <div className="text-center py-16">
            <Text variant="small" muted>No compounds found matching your search.</Text>
          </div>
        )}

        <Card padding="lg" className="mt-16 bg-grey">
          <div className="max-w-xl">
            <Heading level={5} className="mb-3">
              Need Help Finding a Compound?
            </Heading>
            <Text variant="small" muted className="mb-5">
              Can't find what you're looking for? Our team can help source specific research compounds or provide guidance on alternatives.
            </Text>
            <Link to="/contact">
              <Button variant="primary" size="md">
                Contact Us
              </Button>
            </Link>
          </div>
        </Card>
      </Section>
    </div>
  );
}
