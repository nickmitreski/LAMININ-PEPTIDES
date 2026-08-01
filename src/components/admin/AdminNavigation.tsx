import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Beaker,
  BookOpen,
  Boxes,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminNavigationProps {
  onLogout?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  description: string;
  match?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        path: '/admin/dashboard',
        label: 'Orders',
        icon: ShoppingCart,
        description: 'Orders and fulfilment',
        match: ['/admin/dashboard', '/admin/orders/'],
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        path: '/admin/products',
        label: 'Products',
        icon: Package,
        description: 'Products, pricing and media',
      },
      {
        path: '/admin/coas',
        label: 'Certificates',
        icon: FileCheck2,
        description: 'COA files and batch records',
      },
      {
        path: '/admin/inventory',
        label: 'Inventory',
        icon: Boxes,
        description: 'Stock and adjustments',
      },
      {
        path: '/admin/collections',
        label: 'Collections',
        icon: FolderOpen,
        description: 'Storefront groupings',
      },
      {
        path: '/admin/research',
        label: 'Research',
        icon: BookOpen,
        description: 'Research content',
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        path: '/admin/invoices/new',
        label: 'New invoice',
        icon: FileText,
        description: 'Create customer invoices',
      },
      {
        path: '/admin/discounts',
        label: 'Discounts',
        icon: Tag,
        description: 'Promotions and codes',
      },
      {
        path: '/admin/customers',
        label: 'Customers',
        icon: Users,
        description: 'Customer records',
      },
      {
        path: '/admin/emails',
        label: 'Emails',
        icon: Mail,
        description: 'Templates and delivery',
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        path: '/admin/analytics',
        label: 'Analytics',
        icon: BarChart3,
        description: 'Visits and conversion',
      },
      {
        path: '/admin/audit',
        label: 'Audit log',
        icon: ShieldCheck,
        description: 'Admin activity history',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        path: '/admin/tools',
        label: 'Tools',
        icon: Wrench,
        description: 'Calculators and utilities',
      },
      {
        path: '/admin/settings',
        label: 'Settings',
        icon: Settings,
        description: 'Payments and operators',
      },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  const matches = item.match ?? [item.path];
  return matches.some((match) =>
    match.endsWith('/') ? pathname.startsWith(match) : pathname === match
  );
}

function SidebarContent({
  onNavigate,
  onLogout,
}: {
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}) {
  const location = useLocation();
  const { user } = useAdminAuth();
  const initials = (user?.name || user?.email || 'Admin')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex h-full min-h-0 flex-col bg-carbon-950 text-white">
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-400 text-carbon-950 shadow-sm">
          <Beaker className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-wide">LAMININ</p>
          <p className="text-xs text-white/50">Commerce admin</p>
        </div>
      </div>

      <nav aria-label="Admin navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(location.pathname, item);
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      aria-current={active ? 'page' : undefined}
                      title={item.description}
                      className={`group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                        active
                          ? 'bg-white text-carbon-950 shadow-sm'
                          : 'text-white/68 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-[1.125rem] w-[1.125rem] shrink-0 ${active ? 'text-accent-700' : 'text-white/50 group-hover:text-accent-300'}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                      {active ? <ChevronRight className="h-4 w-4 text-carbon-400" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mb-2 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-white/65 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          <LayoutDashboard className="h-[1.125rem] w-[1.125rem] text-white/50" aria-hidden="true" />
          <span className="flex-1 font-medium">View storefront</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>

        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-400 text-xs font-semibold text-carbon-950">
            {initials || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user?.name || 'Administrator'}</p>
            <p className="truncate text-[0.68rem] text-white/45">{user?.email || 'Secure session'}</p>
          </div>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminNavigation({ onLogout }: AdminNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-carbon-800 lg:block">
        <SidebarContent onNavigate={handleNavigate} onLogout={onLogout} />
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-carbon-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-carbon-950 text-accent-300">
            <Beaker className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-wide text-carbon-950">LAMININ</p>
            <p className="text-[0.65rem] text-carbon-500">Commerce admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-carbon-200 text-carbon-800 transition-colors hover:bg-carbon-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label="Open admin menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button
            type="button"
            className="absolute inset-0 bg-carbon-950/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(19rem,88vw)] shadow-2xl">
            <SidebarContent onNavigate={handleNavigate} onLogout={onLogout} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              aria-label="Close admin menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </aside>
        </div>
      ) : null}
    </>
  );
}
