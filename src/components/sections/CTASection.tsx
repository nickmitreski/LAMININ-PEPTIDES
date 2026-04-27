import { Link } from 'react-router-dom';
import { Heading, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Section from '../layout/Section';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function CTASection() {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <Section background="accent" spacing="lg">
      <div ref={ref} className="text-center">
        <div data-revealed={revealed} className="reveal">
          <Heading level={2} className="text-carbon-900 mb-4">
            Ready to start your research?
          </Heading>
        </div>
        <div data-revealed={revealed} className="reveal reveal-delay-1">
          <Text
            variant="body"
            weight="light"
            className="mb-10 max-w-3xl mx-auto text-carbon-900"
          >
            Explore our complete catalogue of laboratory-grade peptides backed
            by third-party verification and comprehensive analysis.
          </Text>
        </div>
        <div
          data-revealed={revealed}
          className="reveal reveal-delay-2 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
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
