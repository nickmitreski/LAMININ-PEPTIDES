import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import { Heading, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
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
  Bell,
  RotateCcw,
} from 'lucide-react';
import {
  listDuePaymentReminders,
  markPaymentReminderSent,
  type PaymentReminderRow,
} from '../services/ordersService';
import { resendOrderInstructionsEmail } from '../services/emailService';
import { formatPrice } from '../lib/formatCurrency';

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
  queued: { bg: 'bg-warning-muted', text: 'text-warning-text', icon: Clock },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send },
  delivered: { bg: 'bg-success-muted', text: 'text-success-text', icon: CheckCircle2 },
  failed: { bg: 'bg-error-muted', text: 'text-error-text', icon: XCircle },
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
  useDocumentTitle("Email Management", "View email logs and manage templates.");
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();

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
  const [reminders, setReminders] = useState<PaymentReminderRow[]>([]);
  const [reminderBusyId, setReminderBusyId] = useState<string | null>(null);
  const [resendBusyId, setResendBusyId] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  /* ---- data fetching ---- */

  const fetchReminders = async () => {
    const supabaseAdmin = getAdminSupabase();
    if (!supabaseAdmin) return;
    const rows = await listDuePaymentReminders(supabaseAdmin);
    setReminders(rows);
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const supabaseAdmin = getAdminSupabase();
      if (!supabaseAdmin) return;
      const { data, error } = await supabaseAdmin
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
      const supabaseAdmin = getAdminSupabase();
      if (!supabaseAdmin) return;
      const { data, error } = await supabaseAdmin
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
    if (tab === 'logs') {
      void fetchLogs();
      void fetchReminders();
    } else fetchTemplates();
  }, [tab]);

  const handleResendFromLog = async (log: EmailLog) => {
    if (!log.order_reference || !log.recipient_email) {
      showToast('Missing order reference or email on this log.', 'error');
      return;
    }
    setResendBusyId(log.id);
    try {
      const supabaseAdmin = getAdminSupabase();
      if (!supabaseAdmin) return;
      const { data: tracking } = await supabaseAdmin
        .from('payment_tracking')
        .select('id, total_amount, customer_name, customer_phone')
        .eq('order_reference', log.order_reference)
        .maybeSingle();

      if (!tracking?.id) {
        showToast('Could not find the related order.', 'error');
        return;
      }

      const result = await resendOrderInstructionsEmail({
        trackingId: tracking.id,
        orderReference: log.order_reference,
        customerEmail: log.recipient_email,
        customerName: tracking.customer_name || log.recipient_name || 'Customer',
        customerPhone: tracking.customer_phone || undefined,
        totalAmount: Number(tracking.total_amount ?? 0),
        emailType: 'payment_followup',
      });

      if (!result.success) {
        showToast(result.error ?? 'Resend failed.', 'error');
        return;
      }
      showToast('Follow-up / payment email resent.', 'success');
      void fetchLogs();
    } finally {
      setResendBusyId(null);
    }
  };

  const handleSendDueReminder = async (row: PaymentReminderRow) => {
    setReminderBusyId(row.id);
    try {
      const result = await resendOrderInstructionsEmail({
        trackingId: row.id,
        orderReference: row.order_reference,
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        customerPhone: row.customer_phone || undefined,
        totalAmount: Number(row.total_amount ?? 0),
        emailType: 'payment_reminder',
      });
      if (!result.success) {
        showToast(result.error ?? 'Reminder failed.', 'error');
        return;
      }
      const marked = await markPaymentReminderSent(row.id, getAdminSupabase());
      if (!marked.success) {
        showToast(
          `Reminder emailed, but tracking update failed: ${marked.error ?? 'unknown'}`,
          'error'
        );
      } else {
        showToast(
          `Reminder #${row.due_reminder_number ?? row.payment_reminder_count + 1} sent for ${row.order_reference}.`,
          'success'
        );
      }
      void fetchReminders();
      void fetchLogs();
    } finally {
      setReminderBusyId(null);
    }
  };

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
    const supabaseAdmin = getAdminSupabase();
    if (!editingTemplate || !supabaseAdmin) return;
    try {
      setSavingTemplate(true);
      const { error } = await supabaseAdmin
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
      showToast('Failed to save template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const createTemplate = async () => {
    const supabaseAdmin = getAdminSupabase();
    if (!supabaseAdmin) return;
    try {
      setSavingTemplate(true);
      const { data, error } = await supabaseAdmin
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
      showToast('Failed to create template', 'error');
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
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/invoices/new')}
                className="flex min-h-11 items-center gap-2 touch-manipulation"
              >
                <Send className="h-4 w-4" />
                New invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  tab === 'logs'
                    ? (void fetchLogs(), void fetchReminders())
                    : fetchTemplates()
                }
                className="flex min-h-11 items-center gap-2 touch-manipulation"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {tab === 'logs' && reminders.length > 0 && (
            <Card className="mb-6 border border-warning/30 bg-warning-muted/40 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bell className="h-5 w-5 text-warning-text" />
                <Heading level={5}>Payment reminders due</Heading>
              </div>
              <Text variant="small" muted className="mb-4 block">
                Unpaid invoices at 3 days and again at 6 days.
              </Text>
              <div className="space-y-3">
                {reminders.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-3 rounded-lg border border-carbon-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Text variant="small" weight="medium" className="font-mono">
                        {row.order_reference}
                      </Text>
                      <Text variant="caption" muted className="block truncate">
                        {row.customer_name} · {row.customer_email} ·{' '}
                        {formatPrice(Number(row.total_amount))}
                      </Text>
                      <Text variant="caption" muted>
                        Reminder #{row.due_reminder_number ?? 1} due
                      </Text>
                    </div>
                    <Button
                      size="sm"
                      className="min-h-11 touch-manipulation"
                      disabled={reminderBusyId === row.id}
                      onClick={() => void handleSendDueReminder(row)}
                    >
                      {reminderBusyId === row.id ? 'Sending…' : 'Send reminder'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
              <p className="text-2xl font-bold text-success">{stats.delivered}</p>
            </Card>
            <Card padding="md" className="text-center">
              <Text variant="caption" muted className="mb-1 block">
                Queued
              </Text>
              <p className="text-2xl font-bold text-warning">{stats.queued}</p>
            </Card>
            <Card padding="md" className="text-center">
              <Text variant="caption" muted className="mb-1 block">
                Failed
              </Text>
              <p className="text-2xl font-bold text-error">{stats.failed}</p>
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
                  : 'text-carbon-900 hover:text-carbon-900'
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
                  : 'text-carbon-900 hover:text-carbon-900'
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
                              {log.order_reference && (
                                <div className="sm:col-span-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="min-h-11 touch-manipulation"
                                    disabled={resendBusyId === log.id}
                                    onClick={() => void handleResendFromLog(log)}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    {resendBusyId === log.id
                                      ? 'Sending…'
                                      : 'Resend / follow-up email'}
                                  </Button>
                                </div>
                              )}
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
                                  <div className="rounded-sm bg-error-light border border-error-border px-3 py-2">
                                    <Text variant="caption" className="text-error-text">
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
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(log.body_html) }}
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
      <Modal
        open={!!editingTemplate}
        onClose={() => !savingTemplate && setEditingTemplate(null)}
        aria-label="Edit email template"
        disableBackdropClose={savingTemplate}
        disableEscClose={savingTemplate}
        backdropClassName="bg-carbon-900/60 px-4"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-sm border border-carbon-900/15 bg-white shadow-xl"
      >
        {editingTemplate && (
          <>
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-carbon-900/10 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <Heading level={4} className="truncate">Edit template</Heading>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-sm text-carbon-900 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="space-y-4">
              {/* Template name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
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
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
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
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
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
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
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
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Preview
                  </label>
                  <div className="rounded-sm border border-carbon-900/10 bg-neutral-50 p-4">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(templateDraft.body_html) }}
                    />
                  </div>
                </div>
              )}
            </div>

            </div>
            {/* Actions */}
            <div className="shrink-0 border-t border-carbon-900/10 bg-carbon-50 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-wrap items-center justify-end gap-3">
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
          </>
        )}
      </Modal>
    </div>
  );
}
