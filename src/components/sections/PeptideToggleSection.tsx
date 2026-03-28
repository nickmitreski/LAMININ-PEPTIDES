import { useState } from 'react';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import ToggleTabs from '../ui/ToggleTabs';
import PeptideCard from '../peptides/PeptideCard';
import { peptideCategories, getPeptidesByCategory } from '../../data/peptides';

export default function PeptideToggleSection() {
  const [activeCategory, setActiveCategory] = useState(peptideCategories[0]);

  const displayedPeptides = getPeptidesByCategory(activeCategory).slice(0, 6);

  return (
    <Section background="neutral">
      <SectionTitle
        title="Research Compounds"
        subtitle="Laboratory-grade peptides with verified purity"
      />

      <ToggleTabs
        tabs={peptideCategories}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedPeptides.map((peptide) => (
          <PeptideCard key={peptide.id} peptide={peptide} />
        ))}
      </div>
    </Section>
  );
}
