import { Link } from 'react-router-dom';
import Container from './Container';
import { Text, Label } from '../ui/Typography';

export default function Footer() {
  const footerLinks = {
    'Research Areas': [
      { label: 'Peptides', path: '/library?category=Peptides' },
      { label: 'Peptide Blends', path: '/library?category=Blends' },
      { label: 'Metabolic Compounds', path: '/library?category=Metabolic' },
      { label: 'Neuropeptides', path: '/library?category=Neuropeptides' },
    ],
    'Resources': [
      { label: 'Certificate of Analysis', path: '/coa' },
      { label: 'Research Library', path: '/library' },
      { label: 'Contact', path: '/contact' },
    ],
  };

  return (
    <footer className="bg-carbon-900 text-white border-t border-white/5">
      <Container>
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <img
                src="/images/brand/logo-white.png"
                alt="Laminin Peptide Lab"
                className="h-7 mb-6"
              />
              <Text className="text-white max-w-sm" weight="light" variant="small">
                Australian supplier of high-quality research peptides and
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
                        className="text-xs text-white hover:text-accent transition-colors"
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
              <div className="flex items-center gap-6">
                <Link
                  to="/privacy"
                  className="text-xs text-white hover:text-accent transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  to="/terms-and-conditions"
                  className="text-xs text-white hover:text-accent transition-colors"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
