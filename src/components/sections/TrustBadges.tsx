import { ShieldCheck, CheckCircle, Award, FileCheck, Building2, Package, type LucideIcon } from 'lucide-react';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import Card from '../ui/Card';
import { Label, Text } from '../ui/Typography';
import { trustBadges } from '../../data/trustBadges';

const iconMap: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  'check-circle': CheckCircle,
  'award': Award,
  'file-check': FileCheck,
  'building': Building2,
  'package': Package,
};

export default function TrustBadges() {
  return (
    <Section background="white">
      <SectionTitle
        label="Quality Assurance"
        title="Verified Standards & Certifications"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {trustBadges.map((badge, index) => {
          const Icon = iconMap[badge.icon];
          return (
            <Card
              key={index}
              padding="md"
              className="flex flex-col items-center text-center"
            >
              <div className="mb-3">
                {Icon && <Icon className="w-4 h-4 text-accent" strokeWidth={1.5} />}
              </div>
              <Label inheritColor className="mb-1.5 text-carbon-900">
                {badge.label}
              </Label>
              <Text variant="caption" muted>
                {badge.description}
              </Text>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
