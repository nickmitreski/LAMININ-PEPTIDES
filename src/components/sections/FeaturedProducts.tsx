import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';
import { Label, Text } from '../ui/Typography';
import { featuredProducts } from '../../data/featuredProducts';

export default function FeaturedProducts() {
  return (
    <Section background="white" spacing="xl">
      <SectionTitle
        label="PEPTIDE LIBRARY"
        title="High Purity Peptides for Advanced Research Applications"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {featuredProducts.map((product) => (
          <Link
            key={product.name}
            to="/library"
            className="group flex flex-col transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="aspect-square bg-neutral-50 rounded-lg overflow-hidden mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <Label inheritColor className="text-carbon-900 mb-1">
              {product.name}
            </Label>
            <Text variant="caption" muted>
              {product.pricePrefix && (
                <span className="mr-1">{product.pricePrefix}</span>
              )}
              {product.price}
            </Text>
          </Link>
        ))}
      </div>

      <div className="flex justify-center">
        <Link to="/library">
          <Button variant="primary" size="md">
            Explore the Library
          </Button>
        </Link>
      </div>
    </Section>
  );
}
