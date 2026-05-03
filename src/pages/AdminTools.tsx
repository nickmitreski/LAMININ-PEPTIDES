import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ExternalLink, Calculator } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';

export default function AdminTools() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [copied, setCopied] = useState(false);

  const calculatorUrl = `${window.location.origin}/reconstitution-calculator`;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(calculatorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />
      <Section spacing="lg">
        <div className="mb-6">
          <Heading level={1} className="mb-2">Tools</Heading>
          <Text className="text-carbon-600">Utilities and resources for order management.</Text>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Reconstitution Calculator Link */}
          <Card padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent-100">
                <Calculator className="h-6 w-6 text-accent-700" />
              </div>
              <div className="flex-1">
                <Heading level={4} className="mb-2">Reconstitution calculator</Heading>
                <Text variant="small" className="text-carbon-600 mb-4">
                  Share this link with customers so they can calculate reconstitution volumes for their peptides.
                </Text>
                <div className="flex flex-wrap items-center gap-2 rounded-sm border border-carbon-200 bg-grey/30 px-3 py-2 mb-3">
                  <code className="flex-1 text-xs text-carbon-700 break-all">{calculatorUrl}</code>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={copyLink} className="inline-flex items-center gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/reconstitution-calculator', '_blank')}
                    className="inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
