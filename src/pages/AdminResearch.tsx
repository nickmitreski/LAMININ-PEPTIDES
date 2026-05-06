import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, Save, Trash2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  fetchResearchProfileOverrides,
  upsertResearchProfileOverride,
  deleteResearchProfileOverride,
  type ResearchProfileOverrideRow,
} from '../services/supabaseService';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';
import { PEPTIDE_PROFILES } from '../data/peptideData';

export default function AdminResearch() {
  useDocumentTitle('Research overrides', 'Edit Peptide science profiles.');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();
  const [overrides, setOverrides] = useState<Record<string, ResearchProfileOverrideRow>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(PEPTIDE_PROFILES[0]?.id ?? '');
  const [overview, setOverview] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [highlights, setHighlights] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const m = await fetchResearchProfileOverrides();
      setOverrides(m);
    } catch {
      showToast('Failed to load overrides', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = PEPTIDE_PROFILES.find((p) => p.id === selectedId);

  useEffect(() => {
    if (!profile) return;
    const o = overrides[profile.id];
    setOverview(o?.overview?.trim() ? o.overview : profile.overview);
    setMechanism(o?.mechanism?.trim() ? o.mechanism : profile.mechanism);
    setHighlights(o?.highlights?.trim() ? o.highlights : profile.highlights);
  }, [profile, overrides, selectedId]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const db = getAdminSupabase();
      const r = await upsertResearchProfileOverride(db, {
        profile_id: profile.id,
        overview: overview.trim() || null,
        mechanism: mechanism.trim() || null,
        highlights: highlights.trim() || null,
      });
      if (r.success) {
        showToast('Profile saved', 'success');
        await load();
      } else {
        showToast(r.error || 'Save failed', 'error');
      }
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearOverride = async () => {
    if (!profile || !confirm('Remove DB override and revert to static copy for this profile?')) return;
    setSaving(true);
    try {
      const db = getAdminSupabase();
      const r = await deleteResearchProfileOverride(db, profile.id);
      if (r.success) {
        showToast('Override cleared', 'success');
        await load();
      } else {
        showToast(r.error || 'Failed', 'error');
      }
    } catch {
      showToast('Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />
      <Section spacing="lg">
        <div className="mb-6 flex items-start gap-3">
          <BookOpen className="h-8 w-8 text-accent-600" />
          <div>
            <Heading level={1} className="mb-1">
              Peptide science overrides
            </Heading>
            <Text className="text-carbon-600 max-w-prose">
              Static profiles live in code. Overrides here replace overview, mechanism, and highlights
              on the public <code className="rounded bg-white px-1">/research</code> page.
            </Text>
          </div>
        </div>

        <Card padding="md" className="max-w-3xl">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-carbon-700">Profile</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="min-h-11 w-full max-w-md rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                >
                  {PEPTIDE_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {profile && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-carbon-700">Overview</label>
                    <textarea
                      value={overview}
                      onChange={(e) => setOverview(e.target.value)}
                      rows={5}
                      className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-carbon-700">Mechanism</label>
                    <textarea
                      value={mechanism}
                      onChange={(e) => setMechanism(e.target.value)}
                      rows={4}
                      className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-carbon-700">Highlights</label>
                    <textarea
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      rows={3}
                      className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving…' : 'Save override'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void clearOverride()}
                      disabled={saving || !overrides[profile.id]}
                      className="inline-flex items-center gap-2 text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear DB override
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}
