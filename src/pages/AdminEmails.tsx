import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import { Heading, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import {
  Mail,
  Send,
  RefreshCw,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_id: string | null;
  template_name: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  resend_id: string | null;
  order_reference: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

type Tab = 'logs' | 'templates';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  queued: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  bounced: { bg: 'bg-orange-100', text: 'text-orange-800', icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.queued;
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminEmails() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  /* ---- state ---- */
  const [tab, setTab] = useState<Tab>('logs');
  const [loading, setLoading] = useState(true);

  // Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateDraft, setTemplateDraft] = useState({ name: '', subject: '', body_html: '', body_text: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  /* ---- data fetching ---- */

  const fetchLogs = async () => {
    try {
      setLoading(true);
      if (!supabase) return;
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      if (!supabase) return;
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching email templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
    else fetchTemplates();
  }, [tab]);

  /* ---- template editing ---- */

  const openTemplateEditor = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateDraft({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
    });
  };

  const saveTemplate = async () => {
    if (!editingTemplate || !supabase) return;
    try {
      setSavingTemplate(true);
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: templateDraft.name,
          subject: templateDraft.subject,
          body_html: templateDraft.body_html,
          body_text: templateDraft.body_text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const createTemplate = async () => {
    if (!supabase) return;
    try {
      setSavingTemplate(true);
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: 'New Template',
          subject: 'Subject',
          body_html: '<p>Email content here</p>',
          body_text: 'Email content here',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        openTemplateEditor(data);
        fetchTemplates();
      }
    } catch (err) {
      console.error('Error creating template:', err);
      alert('Failed to create template');
    } finally {
      setSavingTemplate(false);
    }
  };

  /* ---- filtering ---- */

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !logSearch ||
      log.recipient_email.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.subject.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.order_reference || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.recipient_name || '').toLowerCase().includes(logSearch.toLowerCase());

    const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;

    return matchesSearch && matchesStatus;
  });

  /* ---- stats ---- */

  const stats = {
    total: logs.length,
    delivered: logs.filter((l) => l.status === 'delivered').length,
    sent: logs.filter((l) => l.status === 'sent').length,
    failed: logs.filter((l) => l.status === 'failed' || l.status === 'bounced').length,
    queued: logs.filter((l) => l.status === 'queued').length,
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section background="white" spacing="lg">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Heading level={3} className="mb-1">
                Email management
              </Heading>
              <Text variant="small" muted>
                Manage email templates and view sent email history
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (tab === 'logs' ? fetchLogs() : fetchTemplates())}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card padding="md" className="text-center">
              <Text variant="caption" muted className="mb-1 block">
                Total sent
              </Text>
              <p className="text-2xl font-bold text-carbon-900">{stats.total}</p>
            </Card>
            <Card padding="md" className="text-center">
              <Text variant="caption" muted className="mb-1 block">
                Delivered
              </Text>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </Card>
            <Card padding="md" className="text-center">
              <Text variant="caption" muted className="mb-1 block">
                Queued
              </Text>
              <p className="text-2xl font-bold text-yellow-600">{stats.queued}</p>
            </Card>
            <Card padding="md" className="text-center">
              <Text variant="caption" muted className="mb-1 block">
                Failed
              </Text>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-1 rounded-sm border border-carbon-900/10 bg-neutral-50 p-1">
            <button
              type="button"
              onClick={() => setTab('logs')}
              className={`flex-1 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === 'logs'
                  ? 'bg-white text-carbon-900 shadow-sm'
                  : 'text-neutral-600 hover:text-carbon-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Sent emails
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTab('templates')}
              className={`flex-1 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === 'templates'
                  ? 'bg-white text-carbon-900 shadow-sm'
                  : 'text-neutral-600 hover:text-carbon-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Edit3 className="h-4 w-4" />
                Templates
              </div>
            </button>
          </div>

          {/* ============== LOGS TAB ============== */}
          {tab === 'logs' && (
            <>
              {/* Search & Filter Bar */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search by email, subject, or order reference..."
                    className="w-full rounded-sm border border-carbon-900/20 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900"
                  />
                </div>
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="rounded-sm border border-carbon-900/20 bg-white px-4 py-2.5 text-sm focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900"
                >
                  <option value="all">All statuses</option>
                  <option value="queued">Queued</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>

              {/* Email Logs Table */}
              {loading ? (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label="Loading emails"
                  className="space-y-2"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} padding="md">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8" rounded="full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-3/5" />
                          <Skeleton className="h-3 w-2/5" />
                        </div>
                        <Skeleton className="h-5 w-16" rounded="full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <Mail className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
                  <Text variant="body" muted>
                    {logs.length === 0
                      ? 'No emails have been sent yet. Emails will appear here once Resend is configured.'
                      : 'No emails match your search.'}
                  </Text>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <Card
                        key={log.id}
                        padding="none"
                        className={`overflow-hidden transition-shadow ${
                          isExpanded ? 'ring-2 ring-carbon-900/20' : ''
                        }`}
                      >
                        {/* Row summary */}
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
                        >
                          <div className="hidden sm:block">
                            <StatusBadge status={log.status} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Text variant="caption" weight="medium" className="truncate text-carbon-900">
                                {log.recipient_email}
                              </Text>
                              <span className="sm:hidden">
                                <StatusBadge status={log.status} />
                              </span>
                            </div>
                            <Text variant="caption" muted className="truncate">
                              {log.subject}
                            </Text>
                          </div>
                          <div className="hidden shrink-0 text-right sm:block">
                            {log.order_reference && (
                              <Text variant="caption" className="font-mono text-xs text-neutral-500">
                                {log.order_reference}
                              </Text>
                            )}
                            <Text variant="caption" muted className="text-xs">
                              {formatDate(log.created_at)}
                            </Text>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                          )}
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t border-carbon-900/10 bg-neutral-50 px-4 py-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <Text variant="caption" muted className="mb-1 block text-xs uppercase tracking-wide">
                                  Recipient
                                </Text>
                                <Text variant="small" className="text-carbon-900">
                                  {log.recipient_name ? `${log.recipient_name} <${log.recipient_email}>` : log.recipient_email}
                                </Text>
                              </div>
                              <div>
                                <Text variant="caption" muted className="mb-1 block text-xs uppercase tracking-wide">
                                  Subject
                                </Text>
                                <Text variant="small" className="text-carbon-900">
                                  {log.subject}
                                </Text>
                              </div>
                              {log.order_reference && (
                                <div>
                                  <Text variant="caption" muted className="mb-1 block text-xs uppercase tracking-wide">
                                    Order reference
                                  </Text>
                                  <Text variant="small" className="font-mono text-carbon-900">
                                    {log.order_reference}
                                  </Text>
                                </div>
                              )}
                              <div>
                                <Text variant="caption" muted className="mb-1 block text-xs uppercase tracking-wide">
                                  Sent at
                                </Text>
                                <Text variant="small" className="text-carbon-900">
                                  {log.sent_at ? formatDate(log.sent_at) : 'Not sent yet'}
                                </Text>
                              </div>
                              {log.resend_id && (
                                <div>
                                  <Text variant="caption" muted className="mb-1 block text-xs uppercase tracking-wide">
                                    Resend ID
                                  </Text>
                                  <Text variant="small" className="font-mono text-xs text-neutral-500">
                                    {log.resend_id}
                                  </Text>
                                </div>
                              )}
                              {log.error_message && (
                                <div className="sm:col-span-2">
                                  <Text variant="caption" muted className="mb-1 block text-xs uppercase tracking-wide">
                                    Error
                                  </Text>
                                  <div className="rounded-sm bg-red-50 border border-red-200 px-3 py-2">
                                    <Text variant="caption" className="text-red-800">
                                      {log.error_message}
                                    </Text>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Email preview */}
                            <div className="mt-4">
                              <Text variant="caption" muted className="mb-2 block text-xs uppercase tracking-wide">
                                Email content preview
                              </Text>
                              <div className="rounded-sm border border-carbon-900/10 bg-white p-4">
                                {log.body_html ? (
                                  <div
                                    className="prose prose-sm max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: log.body_html }}
                                  />
                                ) : (
                                  <Text variant="caption" className="whitespace-pre-wrap text-carbon-900">
                                    {log.body_text || 'No content'}
                                  </Text>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ============== TEMPLATES TAB ============== */}
          {tab === 'templates' && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <Text variant="small" muted>
                  Email templates used for automated notifications
                </Text>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={createTemplate}
                  disabled={savingTemplate}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  New template
                </Button>
              </div>

              {loading ? (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label="Loading templates"
                  className="space-y-2"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} padding="md">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-8 w-20" rounded="sm" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <Edit3 className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
                  <Text variant="body" muted className="mb-2">
                    No email templates yet
                  </Text>
                  <Text variant="caption" muted className="mb-4 block">
                    Create templates that will be used when sending order confirmations and payment instructions.
                  </Text>
                  <Button variant="primary" size="sm" onClick={createTemplate} disabled={savingTemplate}>
                    Create first template
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <Card key={template.id} padding="md" className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Text variant="small" weight="medium" className="text-carbon-900">
                          {template.name}
                        </Text>
                        <Text variant="caption" muted className="truncate">
                          Subject: {template.subject}
                        </Text>
                        <Text variant="caption" muted className="text-xs">
                          Updated {formatDate(template.updated_at)}
                        </Text>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTemplateEditor(template)}
                        className="flex shrink-0 items-center gap-2"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* ============== TEMPLATE EDITOR MODAL ============== */}
      {editingTemplate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-carbon-900/60 px-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingTemplate(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-carbon-900/15 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <Heading level={4}>Edit template</Heading>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-neutral-600 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Template name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Template name
                </label>
                <input
                  type="text"
                  value={templateDraft.name}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900"
                />
              </div>

              {/* Subject line */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Subject line
                </label>
                <input
                  type="text"
                  value={templateDraft.subject}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, subject: e.target.value }))}
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900"
                  placeholder="e.g. Your Laminin order — payment instructions"
                />
              </div>

              {/* HTML body */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Email body (HTML)
                </label>
                <textarea
                  value={templateDraft.body_html}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, body_html: e.target.value }))}
                  rows={12}
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 font-mono text-sm focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900"
                  placeholder="<p>Hello {{customer_name}},</p>..."
                />
                <Text variant="caption" muted className="mt-1 text-xs">
                  Available variables: {'{{customer_name}}'}, {'{{order_reference}}'}, {'{{total_amount}}'}, {'{{bsb}}'}, {'{{account_number}}'}, {'{{account_name}}'}
                </Text>
              </div>

              {/* Plain text body */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Plain text fallback
                </label>
                <textarea
                  value={templateDraft.body_text}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, body_text: e.target.value }))}
                  rows={6}
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-carbon-900 focus:outline-none focus:ring-1 focus:ring-carbon-900"
                  placeholder="Hello {{customer_name}},..."
                />
              </div>

              {/* HTML Preview */}
              {templateDraft.body_html && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
                    Preview
                  </label>
                  <div className="rounded-sm border border-carbon-900/10 bg-neutral-50 p-4">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: templateDraft.body_html }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-carbon-900/10 pt-6">
              <Button variant="outline" size="sm" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveTemplate}
                disabled={savingTemplate}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {savingTemplate ? 'Saving...' : 'Save template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
