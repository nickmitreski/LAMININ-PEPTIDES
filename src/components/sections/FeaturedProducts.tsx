import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';
import { Label, Text } from '../ui/Typography';
import { featuredProducts } from '../../data/featuredProducts';
import { getProductSlug } from '../../data/productContent';

export default function FeaturedProducts() {
  return (
    <Section background="white" spacing="xl">
      <SectionTitle
        label="PEPTIDE LIBRARY"
        title="High Purity Peptides for Advanced Research Applications"
      />

      <div className="mb-10 grid grid-cols-2 gap-3 sm:mb-12 sm:gap-4 md:grid-cols-4 md:gap-6">
        {featuredProducts.map((product) => (
          <Link
            key={product.peptideId}
            to={`/products/${getProductSlug(product.peptideId)}`}
            className="group flex touch-manipulation flex-col motion-safe:transition-transform motion-safe:duration-300 active:opacity-90 md:hover:-translate-y-1"
          >
            <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-neutral-50 sm:mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-105 sm:p-4"
              />
            </div>
            <Label
              inheritColor
              className="mb-1 line-clamp-2 text-[0.65rem] leading-tight text-carbon-900 sm:text-xs"
            >
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
