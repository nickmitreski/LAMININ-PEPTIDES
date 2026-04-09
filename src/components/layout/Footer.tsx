import { Link } from 'react-router-dom';
import Container from './Container';
import { Text, Label } from '../ui/Typography';

export default function Footer() {
  const footerLinks = {
    'Research Areas': [
      { label: 'All compounds', path: '/library?category=All' },
      { label: 'Tissue regeneration', path: '/library?category=Healing' },
      {
        label: 'Cognitive and neurological research',
        path: '/library?category=Cognitive',
      },
      { label: 'Metabolic Research', path: '/library?category=Metabolic' },
      { label: 'Performance biology', path: '/library?category=Performance' },
      {
        label: 'Longevity and cellular research',
        path: '/library?category=Longevity',
      },
    ],
    'Resources': [
      { label: 'Certificate of Analysis', path: '/coa' },
      { label: 'Research Library', path: '/library' },
      { label: 'FAQ', path: '/faq' },
      { label: 'Shipping', path: '/shipping' },
      { label: 'Contact', path: '/contact' },
    ],
  };

  return (
    <footer className="border-t border-white/5 bg-carbon-900 text-white pb-safe">
      <Container>
        <div className="py-12 lg:py-20 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <img
                src="/images/brand/logo-white.png"
                alt="Laminin Peptide Lab"
                className="h-7 mb-6"
              />
              <Text className="text-white max-w-sm" weight="light" variant="small">
                Supplier of high-quality research peptides and
                laboratory materials. Our focus is on transparency, consistent
                quality, and reliable supply for research applications.
              </Text>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <Label
                  className="text-white mb-5 block"
                  uppercase
                >
                  {category}
                </Label>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="inline-flex min-h-10 max-w-full items-center py-1.5 text-xs text-white transition-colors hover:text-accent touch-manipulation"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <Text variant="caption" className="text-white">
                All products are intended for laboratory research use only.
              </Text>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-end">
                <Link
                  to="/privacy"
                  className="inline-flex min-h-10 items-center text-xs text-white transition-colors hover:text-accent touch-manipulation"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/disclaimer"
                  className="inline-flex min-h-10 items-center text-xs text-white transition-colors hover:text-accent touch-manipulation"
                >
                  Disclaimer
                </Link>
                <Link
                  to="/guarantee"
                  className="inline-flex min-h-10 items-center text-xs text-white transition-colors hover:text-accent touch-manipulation"
                >
                  Purity Guarantee
                </Link>
                <Link
                  to="/shipping"
                  className="inline-flex min-h-10 items-center text-xs text-white transition-colors hover:text-accent touch-manipulation"
                >
                  Shipping terms
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex min-h-11 items-center text-xs text-white/45 transition-colors hover:text-accent touch-manipulation"
                >
                  Staff sign-in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
