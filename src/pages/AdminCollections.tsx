import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { adminListAllCollections, createCollectionRow, updateCollectionRow, type Collection } from '../services/supabaseService';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';

export default function AdminCollections() {
  useDocumentTitle('Collections', 'Manage product collections for curated library URLs.');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();
  const [list, setList] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = getAdminSupabase();
      const rows = await adminListAllCollections(db);
      setList(rows);
    } catch {
      showToast('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    const resolvedSlug = (slug.trim() || name.trim()).replace(/\s+/g, '-').toLowerCase();
    // Check for duplicate slug before creating
    if (list.some((c) => c.slug === resolvedSlug)) {
      showToast(`A collection with slug "${resolvedSlug}" already exists`, 'error');
      return;
    }
    setCreating(true);
    try {
      const db = getAdminSupabase();
      const r = await createCollectionRow(db, {
        slug: resolvedSlug,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (r.success) {
        showToast('Collection created', 'success');
        setSlug('');
        setName('');
        setDescription('');
        void load();
      } else {
        showToast(r.error || 'Failed', 'error');
      }
    } catch {
      showToast('Failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (c: Collection) => {
    setTogglingId(c.id);
    try {
      const db = getAdminSupabase();
      const r = await updateCollectionRow(db, c.id, { is_active: !c.is_active });
      if (r.success) {
        showToast(`Collection ${c.is_active ? 'deactivated' : 'activated'}`, 'success');
        void load();
      } else {
        showToast(r.error || 'Failed to update', 'error');
      }
    } catch {
      showToast('Failed to update', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />
      <Section spacing="lg">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <FolderOpen className="h-8 w-8 text-accent-600" />
            <div>
              <Heading level={1} className="mb-1">
                Collections
              </Heading>
              <Text className="text-carbon-600 max-w-prose">
                Assign products to collections in the Product Editor. Public URL:{' '}
                <code className="rounded bg-white px-1">/collections/your-slug</code>
              </Text>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card padding="md">
            <Heading level={4} className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" /> New collection
            </Heading>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-carbon-700">Slug (optional)</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. metabolics-stack"
                  className="min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 font-mono text-base md:text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-carbon-700">Display name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-carbon-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                />
              </div>
              <Button onClick={() => void handleCreate()} disabled={creating}>
                {creating ? 'Creating…' : 'Create collection'}
              </Button>
            </div>
          </Card>

          <Card padding="md">
            <Heading level={4} className="mb-4">
              All collections
            </Heading>
            {loading ? (
              <Text muted>Loading…</Text>
            ) : list.length === 0 ? (
              <Text muted>No collections yet.</Text>
            ) : (
              <ul className="divide-y divide-carbon-200 rounded-sm border border-carbon-200">
                {list.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <span className={`font-medium ${c.is_active ? 'text-carbon-900' : 'text-carbon-400'}`}>{c.name}</span>
                      <span className="ml-2 font-mono text-xs text-carbon-500">{c.slug}</span>
                      {!c.is_active && (
                        <span className="ml-2 rounded-full bg-warning-muted px-2 py-0.5 text-xs">inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        disabled={togglingId === c.id}
                        className="inline-flex items-center gap-1 rounded-sm border border-carbon-200 px-2 py-1 text-xs text-carbon-600 hover:bg-grey/30 disabled:opacity-50"
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {c.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <a
                        href={`/collections/${encodeURIComponent(c.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent-700 underline-offset-2 hover:underline"
                      >
                        View →
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </Section>
    </div>
  );
}
