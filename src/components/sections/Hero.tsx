import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

export default function Hero() {
  return (
    <Section background="accent" spacing="2xl">
      <div className="max-w-4xl mx-auto text-center">
        <Heading
          level={1}
          className="text-carbon-900 tracking-hero mb-6 animate-fadeInUp leading-relaxed !text-3xl md:!text-4xl lg:!text-5xl"
        >
          LABORATORY VERIFIED PEPTIDES
        </Heading>

        <Text
          className="max-w-md mx-auto mb-14 animate-fadeInUp leading-relaxed text-base md:text-lg text-carbon-900"
        >
          high purity compounds supported by analytical testing and documented quality
        </Text>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp mb-8">
          <Link to="/library">
            <Button variant="white" size="lg" className="min-w-[200px] uppercase">
              Browse Library
            </Button>
          </Link>
          <Link to="/coa">
            <Button variant="white" size="lg" className="min-w-[200px] uppercase">
              View Certificates
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
