import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';

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
      const success = await login(email, password);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
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
                    className="w-full rounded-sm border border-carbon-900/20 bg-white py-3 pl-11 pr-4 text-sm text-carbon-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="admin@lamininpeplab.com.au"
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
                    className="w-full rounded-sm border border-carbon-900/20 bg-white py-3 pl-11 pr-4 text-sm text-carbon-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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

              <div className="rounded-sm border border-carbon-900/10 bg-grey/30 p-4">
                <Text variant="caption" muted>
                  Use a Supabase Auth user marked as admin (App Metadata{' '}
                  <code className="text-xs">admin: true</code>) or listed in{' '}
                  <code className="text-xs">VITE_ADMIN_EMAIL_ALLOWLIST</code>. See{' '}
                  <code className="text-xs">supabase/admin_auth_setup.sql</code>.
                </Text>
              </div>
            </form>
          </Card>
        </div>
      </Section>
    </div>
  );
}
