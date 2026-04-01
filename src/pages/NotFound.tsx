import { Link } from 'react-router-dom';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import TextLink from '../components/ui/TextLink';
import { Heading, Text } from '../components/ui/Typography';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Section
        background="white"
        className="flex min-h-[80vh] items-center justify-center"
        aria-labelledby="page-not-found-heading"
      >
        <div className="mx-auto max-w-lg px-4 text-center sm:px-0">
          <div className="mb-10">
            <span
              className="text-6xl font-light tracking-wider text-carbon-900/20 md:text-7xl"
              aria-hidden
            >
              404
            </span>
            <Heading
              level={1}
              id="page-not-found-heading"
              className="mt-4 mb-3 text-2xl sm:text-3xl"
            >
              Page not found
            </Heading>
            <Text variant="small" muted className="mb-8 text-base leading-relaxed sm:text-sm">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </Text>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="min-h-12 w-full touch-manipulation sm:min-h-11">
                Back to home
              </Button>
            </Link>
            <Link to="/library" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="min-h-12 w-full touch-manipulation sm:min-h-11">
                Browse library
              </Button>
            </Link>
          </div>

          <div className="mt-14 border-t border-carbon-900/10 pt-10">
            <Heading level={2} className="mb-2 text-base sm:text-sm">
              Looking for something specific?
            </Heading>
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
