import { Link } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { Heading, Text } from './Typography';

interface CTACardProps {
  title: string;
  description: string;
  buttonLabel?: string;
  buttonTo?: string;
  className?: string;
}

/**
 * Standardised CTA card used at the bottom of content pages.
 * Platinum background, heading + description + primary button linking to contact.
 */
export default function CTACard({
  title,
  description,
  buttonLabel = 'Contact us',
  buttonTo = '/contact',
  className = '',
}: CTACardProps) {
  return (
    <Card padding="lg" className={`mt-12 bg-platinum sm:mt-16 ${className}`}>
      <div className="max-w-xl">
        <Heading level={5} className="mb-3">
          {title}
        </Heading>
        <Text variant="small" muted className="mb-5">
          {description}
        </Text>
        <Link to={buttonTo}>
          <Button variant="primary" size="md">
            {buttonLabel}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
