import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Section from '../components/layout/Section';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';

/** In-app error page (e.g. linked from support). Uncaught render errors still use the root error boundary. */
export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="xl" className="min-h-[70vh]">
        <div className="mx-auto max-w-lg px-4 text-center sm:px-0">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-800" strokeWidth={2} aria-hidden />
          </div>
          <Heading level={1} className="mb-3 text-2xl sm:text-3xl">
            We hit a snag
          </Heading>
          <Text variant="body" muted className="mb-8 block text-base leading-relaxed sm:text-sm">
            Something didn’t load correctly. You can go back home, try checkout again from your cart,
            or reach out if the problem continues.
          </Text>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="min-h-12 w-full touch-manipulation sm:min-h-11">
                Back to home
              </Button>
            </Link>
            <Link to="/cart" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="min-h-12 w-full touch-manipulation sm:min-h-11">
                View cart
              </Button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="min-h-12 w-full touch-manipulation sm:min-h-11">
                Contact support
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
