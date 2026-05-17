import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Landmark, Save } from 'lucide-react';
import AdminNavigation from '../components/admin/AdminNavigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  getBankDetails,
  updateBankDetails,
  type BankDetails,
} from '../services/bankDetailsService';

/**
 * Operator-facing settings page. Currently surfaces the bank-transfer
 * destination details only — the values that ship in every order email.
 * Add more sections here as they appear; keep one Card per concern.
 */
export default function AdminSettings() {
  useDocumentTitle('Admin settings', 'Operator settings');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [form, setForm] = useState({
    bsb: '',
    account_number: '',
    account_name: '',
    bank_name: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getBankDetails(getAdminSupabase(), { force: true });
    setBank(result);
    setForm({
      bsb: result.bsb,
      account_number: result.account_number,
      account_name: result.account_name,
      bank_name: result.bank_name ?? '',
    });
    setTableMissing(result.id === 'fallback');
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bank || saving) return;
    if (tableMissing) {
      showToast(
        'Bank-details table not deployed yet. Apply migration 20260517180000.',
        'error',
        5000
      );
      return;
    }
    setSaving(true);
    const r = await updateBankDetails(
      bank.id,
      {
        bsb: form.bsb,
        account_number: form.account_number,
        account_name: form.account_name,
        bank_name: form.bank_name,
      },
      getAdminSupabase()
    );
    setSaving(false);
    if (!r.success) {
      showToast(r.error ?? 'Could not save bank details.', 'error');
      return;
    }
    showToast('Bank details updated.', 'success');
    void load();
  };

  const dirty =
    !!bank &&
    (form.bsb.trim() !== bank.bsb ||
      form.account_number.trim() !== bank.account_number ||
      form.account_name.trim() !== bank.account_name ||
      (form.bank_name.trim() || null) !== (bank.bank_name ?? null));

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        <div className="mb-6">
          <Heading level={1} className="mb-1">
            Settings
          </Heading>
          <Text className="text-carbon-600">
            Account-wide configuration. Changes take effect immediately.
          </Text>
        </div>

        {tableMissing && (
          <Card className="mb-6 border-warning-border bg-warning-light p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <Text weight="medium" className="text-warning-text">
                  Bank-details table not yet deployed.
                </Text>
                <Text variant="small" className="mt-1 text-warning-text">
                  Apply migration{' '}
                  <code className="font-mono">
                    20260517180000_bank_details_settings.sql
                  </code>{' '}
                  with <code className="font-mono">supabase db push</code>. The order email is
                  currently using the hardcoded fallback values shown below.
                </Text>
              </div>
            </div>
          </Card>
        )}

        <Card padding="lg" className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <Heading level={3}>Bank transfer details</Heading>
              <Text variant="small" muted className="mt-0.5">
                Customers see these in every order email. Updates are logged.
              </Text>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                  BSB
                </Text>
                <input
                  value={form.bsb}
                  onChange={(e) => setForm((f) => ({ ...f, bsb: e.target.value }))}
                  placeholder="013-402"
                  required
                  maxLength={16}
                  inputMode="numeric"
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2.5 font-mono text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </label>

              <label className="block">
                <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                  Account number
                </Text>
                <input
                  value={form.account_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, account_number: e.target.value }))
                  }
                  placeholder="807892935"
                  required
                  maxLength={32}
                  inputMode="numeric"
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2.5 font-mono text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </label>

              <label className="block">
                <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                  Account name
                </Text>
                <input
                  value={form.account_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, account_name: e.target.value }))
                  }
                  placeholder="Legal entity name on the bank account"
                  required
                  maxLength={100}
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </label>

              <label className="block">
                <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                  Bank name (optional)
                </Text>
                <input
                  value={form.bank_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bank_name: e.target.value }))
                  }
                  placeholder="e.g. Commonwealth Bank"
                  maxLength={100}
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </label>

              {bank && bank.id !== 'fallback' && (
                <Text variant="caption" muted>
                  Last updated: {new Date(bank.updated_at).toLocaleString('en-AU')}
                </Text>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-carbon-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void load()}
                  disabled={saving}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!dirty || saving || tableMissing}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Text variant="caption" muted>
          More settings will appear here as they're added.
        </Text>
      </Section>
    </div>
  );
}
