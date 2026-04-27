import { Link } from 'react-router-dom';
import { Heading, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Section from '../layout/Section';

export default function CTASection() {
  return (
    <Section background="accent" spacing="lg">
      <div className="text-center">
        <Heading level={2} className="text-carbon-900 mb-4">
          Ready to start your research?
        </Heading>
        <Text
          variant="body"
          weight="light"
          className="mb-10 max-w-3xl mx-auto text-carbon-900"
        >
          Explore our complete catalogue of laboratory-grade peptides backed
          by third-party verification and comprehensive analysis.
        </Text>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/library">
            <Button variant="white" size="lg" className="min-w-[200px] uppercase">
              Browse compounds
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px] uppercase border-carbon-900 text-carbon-900 hover:bg-carbon-900 hover:text-white"
            >
              Get in touch
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
