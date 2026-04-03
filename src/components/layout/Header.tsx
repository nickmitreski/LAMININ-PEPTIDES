import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, ShoppingCart } from 'lucide-react';
import Container from './Container';
import CartDrawer from '../cart/CartDrawer';
import HeaderSearch from './HeaderSearch';
import { useCart } from '../../context/CartContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { state } = useCart();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/library', label: 'Library' },
    { path: '/coa', label: 'Certificate of Analysis' },
    { path: '/guarantee', label: 'Purity guarantee' },
    { path: '/faq', label: 'FAQ' },
  ];

  return (
    <header className="bg-carbon-900 sticky top-0 z-50 border-b border-white/5 pt-safe">
      <Container>
        <div className="flex min-h-[4.25rem] items-center justify-between py-2 md:min-h-24 md:py-0">
          <div className="flex-shrink-0">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group flex items-center"
            >
              <img
                src="/images/brand/logo-reverse.png"
                alt="Laminin Peptide Lab"
                className="h-11 w-auto max-h-[2.75rem] transition-opacity group-hover:opacity-90 sm:h-[3.47875rem] sm:max-h-none md:h-[4.1745rem]"
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

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/10 touch-manipulation active:bg-white/15"
              aria-label="Search catalogue"
            >
              <Search className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/10 touch-manipulation active:bg-white/15"
              aria-label={`Shopping cart with ${state.itemCount} items`}
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={2} aria-hidden />
              {state.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-carbon-900 bg-accent rounded-full">
                  {state.itemCount > 99 ? '99+' : state.itemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white touch-manipulation active:bg-white/10 lg:hidden"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </Container>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-carbon-900 border-t border-white/5 animate-fadeIn">
          <Container>
            <nav className="space-y-1 py-4 pb-safe sm:py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    block min-h-12 px-4 py-3.5 text-sm font-medium leading-snug tracking-wide rounded-sm transition-all duration-200 touch-manipulation
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
          </Container>
        </div>
      )}

      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
      <HeaderSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
