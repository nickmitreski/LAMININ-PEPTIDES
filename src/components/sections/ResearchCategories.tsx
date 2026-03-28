import Section from '../layout/Section';
import { Heading } from '../ui/Typography';

interface ResearchCategory {
  label: string;
  image: string;
  alt: string;
}

const categories: ResearchCategory[] = [
  {
    label: 'METABOLIC RESEARCH',
    image: '/images/products/retatrutide-10mg.png',
    alt: 'Retatrutide 20MG',
  },
  {
    label: 'TISSUE REGENERATION',
    image: '/images/products/bpc157-tb500-20mg.png',
    alt: 'BPC-157 / TB-500 Blend',
  },
  {
    label: 'PERFORMANCE BIOLOGY',
    image: '/images/products/cjc1295-ipa-20mg.png',
    alt: 'CJC-1295 / Ipamorelin Blend',
  },
];

export default function ResearchCategories() {
  return (
    <Section background="none" spacing="xl" className="bg-accent">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Left - Large hero image (Metabolic Research) */}
        <div className="md:col-span-2 md:row-span-2">
          <div className="h-full flex flex-col">
            <Heading
              level={3}
              className="text-white tracking-hero mb-4 md:mb-6"
            >
              {categories[0].label}
            </Heading>
            <div className="flex-1 rounded-lg overflow-hidden bg-white">
              <img
                src={categories[0].image}
                alt={categories[0].alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right top - Tissue Regeneration */}
        <div className="md:col-span-1">
          <div className="h-full flex flex-col">
            <Heading
              level={4}
              className="text-white tracking-hero mb-3 md:mb-4"
            >
              {categories[1].label}
            </Heading>
            <div className="flex-1 rounded-lg overflow-hidden bg-white">
              <img
                src={categories[1].image}
                alt={categories[1].alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right bottom - Performance Biology */}
        <div className="md:col-span-1">
          <div className="h-full flex flex-col">
            <Heading
              level={4}
              className="text-white tracking-hero mb-3 md:mb-4"
            >
              {categories[2].label}
            </Heading>
            <div className="flex-1 rounded-lg overflow-hidden bg-white">
              <img
                src={categories[2].image}
                alt={categories[2].alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
