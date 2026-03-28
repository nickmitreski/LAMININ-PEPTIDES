import { Link } from 'react-router-dom';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import TextLink from '../components/ui/TextLink';
import { Heading, Text } from '../components/ui/Typography';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Section background="white" className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-10">
            <span className="text-6xl md:text-7xl font-light tracking-wider text-carbon-900/20">404</span>
            <Heading level={3} className="mt-4 mb-3">Page Not Found</Heading>
            <Text variant="small" muted className="mb-8">
              The page you're looking for doesn't exist or has been moved.
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="primary" size="md">
                Back to Home
              </Button>
            </Link>
            <Link to="/library">
              <Button variant="outline" size="md">
                Browse Library
              </Button>
            </Link>
          </div>

          <div className="mt-14 pt-10 border-t border-carbon-900/10">
            <Heading level={6} className="mb-2">Looking for something specific?</Heading>
            <Text variant="small" muted className="mb-4">
              Try searching our research library or contact our team.
            </Text>
            <TextLink to="/contact">Contact Support</TextLink>
          </div>
        </div>
      </Section>
    </div>
  );
}
