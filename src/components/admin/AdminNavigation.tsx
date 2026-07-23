import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Mail,
  Tag,
  Wrench,
  LogOut,
  BookOpen,
  FolderOpen,
  ShieldCheck,
  Settings,
  FileText,
  BarChart3,
} from 'lucide-react';
import Button from '../ui/Button';

interface AdminNavigationProps {
  onLogout?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/admin/dashboard',
    label: 'Orders',
    icon: ShoppingCart,
    description: 'Manage customer orders',
  },
  {
    path: '/admin/invoices/new',
    label: 'Invoice',
    icon: FileText,
    description: 'Create custom customer invoices',
  },
  {
    path: '/admin/inventory',
    label: 'Inventory',
    icon: Package,
    description: 'Track stock levels',
  },
  {
    path: '/admin/products',
    label: 'Products',
    icon: LayoutDashboard,
    description: 'Manage products',
  },
  {
    path: '/admin/collections',
    label: 'Collections',
    icon: FolderOpen,
    description: 'Curated library groupings',
  },
  {
    path: '/admin/research',
    label: 'Research',
    icon: BookOpen,
    description: 'Peptide science copy overrides',
  },
  {
    path: '/admin/discounts',
    label: 'Discounts',
    icon: Tag,
    description: 'Manage discount codes',
  },
  {
    path: '/admin/customers',
    label: 'Customers',
    icon: Users,
    description: 'Manage customers',
  },
  {
    path: '/admin/emails',
    label: 'Emails',
    icon: Mail,
    description: 'Email templates & history',
  },
  {
    path: '/admin/tools',
    label: 'Tools',
    icon: Wrench,
    description: 'Reconstitution calculator & tools',
  },
  {
    path: '/admin/audit',
    label: 'Audit',
    icon: ShieldCheck,
    description: 'Admin action history',
  },
  {
    path: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Visits and checkout insights',
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Bank details and operator settings',
  },
];

export default function AdminNavigation({ onLogout }: AdminNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-carbon-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-carbon-900">
              Laminin Admin
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2
                    ${
                      active
                        ? 'bg-accent-600 text-white'
                        : 'text-carbon-700 hover:bg-carbon-100 hover:text-carbon-900'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2
                  ${
                    active
                      ? 'bg-accent-600 text-white'
                      : 'text-carbon-700 hover:bg-carbon-100 hover:text-carbon-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div>{item.label}</div>
                  <div className={`text-xs ${active ? 'text-white/80' : 'text-carbon-500'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
