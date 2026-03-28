import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Container from './Container';
import Button from '../ui/Button';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/library', label: 'Library' },
    { path: '/coa', label: 'Certificate of Analysis' },
    { path: '/collection', label: 'Collection' },
  ];

  return (
    <header className="bg-carbon-900 sticky top-0 z-50 border-b border-white/5">
      <Container>
        <div className="flex justify-between items-center h-20 md:h-24">
          <div className="flex-shrink-0">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group flex items-center"
            >
              <img
                src="/images/brand/logo-white.png"
                alt="Laminin Peptide Lab"
                className="h-10 md:h-12 transition-opacity group-hover:opacity-90"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`
                  px-5 py-2.5 text-sm font-medium tracking-wide rounded-sm transition-all duration-200
                  ${
                    isActive(link.path)
                      ? 'text-carbon-900 bg-accent'
                      : 'text-white hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/library" className="hidden lg:block">
              <Button variant="white" size="md">
                Search
              </Button>
            </Link>
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </Container>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-carbon-900 border-t border-white/5 animate-fadeIn">
          <Container>
            <nav className="py-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    block px-4 py-3 text-sm font-medium tracking-wide rounded-sm transition-all duration-200
                    ${
                      isActive(link.path)
                        ? 'text-carbon-900 bg-accent'
                        : 'text-white hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4">
                <Link
                  to="/library"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="white" size="md" className="w-full">
                    Search
                  </Button>
                </Link>
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
