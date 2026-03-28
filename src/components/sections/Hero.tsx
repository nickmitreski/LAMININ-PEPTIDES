import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

export default function Hero() {
  return (
    <Section background="accent" spacing="2xl">
      <div className="max-w-6xl mx-auto text-center">
        <Heading
          level={1}
          className="mb-6 animate-fadeInUp !text-2xl !font-bold !tracking-[0.14em] leading-snug text-carbon-900 sm:!text-3xl sm:!tracking-[0.22em] sm:leading-relaxed md:!text-4xl md:!tracking-[0.3em] lg:!text-5xl"
        >
          LABORATORY VERIFIED PEPTIDES
        </Heading>

        <Text className="mx-auto mb-10 max-w-2xl animate-fadeInUp px-1 text-sm leading-relaxed text-carbon-900 sm:mb-14 sm:text-base md:text-lg">
          high purity compounds supported by analytical testing and documented quality
        </Text>

        <div className="mb-8 flex animate-fadeInUp flex-col items-stretch justify-center gap-3 px-1 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
          <Link to="/library" className="touch-manipulation sm:min-w-[200px]">
            <Button variant="white" size="lg" className="w-full uppercase sm:w-auto">
              Browse Library
            </Button>
          </Link>
          <Link to="/coa" className="touch-manipulation sm:min-w-[200px]">
            <Button variant="white" size="lg" className="w-full uppercase sm:w-auto">
              View Certificates
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
