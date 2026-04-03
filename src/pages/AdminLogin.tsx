import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';

const LOGIN_ERRORS: Record<
  'not_configured' | 'invalid_credentials' | 'not_admin',
  string
> = {
  not_configured:
    'Admin login is not configured on this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (or your host) and redeploy.',
  invalid_credentials: 'Invalid email or password.',
  not_admin:
    'Sign-in worked, but this account is not marked as admin. In Supabase: Authentication → Users → your user → User Management → set App Metadata to include "admin": true, or run supabase/admin_auth_setup.sql for your email. Alternatively set VITE_ADMIN_EMAIL_ALLOWLIST on the server (comma-separated emails) and redeploy.',
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, authReady } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-platinum">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    navigate('/admin/dashboard');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.ok) {
        navigate('/admin/dashboard');
      } else {
        setError(LOGIN_ERRORS[result.code]);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="xl">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <Lock className="h-8 w-8 text-accent-dark" />
            </div>
            <Heading level={2} className="mb-2">
              Admin Login
            </Heading>
            <Text variant="body" muted>
              Enter your credentials to access the admin dashboard
            </Text>
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <Text variant="small" className="text-red-900">
                    {error}
                  </Text>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-carbon-900">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input min-h-11 w-full rounded-sm border border-carbon-900/20 bg-white py-3 pl-11 pr-4 text-base text-carbon-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:text-sm"
                    placeholder="info@lamininpeptab.com.au"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-carbon-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input min-h-11 w-full rounded-sm border border-carbon-900/20 bg-white py-3 pl-11 pr-4 text-base text-carbon-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:text-sm"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Card>
        </div>
      </Section>
    </div>
  );
}
