import { useCallback, useEffect, useId, useState } from 'react';
import {
  Archive,
  Check,
  ExternalLink,
  FileCheck2,
  FileUp,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { getAdminSupabase } from '../../lib/supabaseAdminClient';
import {
  archiveProductCoa,
  formatCoaFileSize,
  listProductCoas,
  restoreProductCoa,
  setCurrentProductCoa,
  uploadProductCoa,
  validateCoaFile,
  type ProductCoa,
} from '../../services/coaAdminService';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

interface ProductEditorCoaManagerProps {
  productId: string;
  onCurrentChange?: (url: string) => void;
}

export default function ProductEditorCoaManager({
  productId,
  onCurrentChange,
}: ProductEditorCoaManagerProps) {
  const fileInputId = useId();
  const [coas, setCoas] = useState<ProductCoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [labName, setLabName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [makeCurrent, setMakeCurrent] = useState(true);

  const loadCoas = useCallback(async () => {
    const client = getAdminSupabase();
    if (!client) {
      setError('Admin session is unavailable. Sign in again.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setCoas(await listProductCoas(productId, client));
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : 'Unknown error';
      setError(
        detail.includes('product_coas')
          ? 'COA management is ready in the app but the Supabase migration still needs to be deployed.'
          : `Could not load certificates: ${detail}`
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadCoas();
  }, [loadCoas]);

  const handleFileChange = (selected: File | null) => {
    setMessage(null);
    const validationError = selected ? validateCoaFile(selected) : null;
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleUpload = async () => {
    const client = getAdminSupabase();
    if (!client || !file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    const result = await uploadProductCoa(
      {
        productId,
        file,
        batchNumber,
        labName,
        testDate,
        makeCurrent,
      },
      client
    );
    setUploading(false);
    if (!result.success) {
      setError(result.error || 'Certificate upload failed.');
      if (result.coa) await loadCoas();
      return;
    }

    if (result.coa?.is_current) onCurrentChange?.(result.coa.document_url);
    setFile(null);
    setBatchNumber('');
    setLabName('');
    setTestDate('');
    setMessage(makeCurrent ? 'Certificate uploaded and published.' : 'Certificate saved as a draft.');
    await loadCoas();
  };

  const handleSetCurrent = async (coa: ProductCoa) => {
    const client = getAdminSupabase();
    if (!client) return;
    setBusyId(coa.id);
    setError(null);
    const result = await setCurrentProductCoa(coa.id, productId, client);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || 'Could not publish this certificate.');
      return;
    }
    onCurrentChange?.(coa.document_url);
    setMessage('Current certificate updated. The previous version was archived.');
    await loadCoas();
  };

  const handleArchive = async (coa: ProductCoa) => {
    const client = getAdminSupabase();
    if (!client) return;
    setBusyId(coa.id);
    setError(null);
    const result = await archiveProductCoa(coa, client);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || 'Could not archive this certificate.');
      return;
    }
    if (coa.is_current) onCurrentChange?.('');
    setMessage('Certificate archived. You can restore it later.');
    await loadCoas();
  };

  const handleRestore = async (coa: ProductCoa) => {
    const client = getAdminSupabase();
    if (!client) return;
    setBusyId(coa.id);
    setError(null);
    const result = await restoreProductCoa(coa, client);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || 'Could not restore this certificate.');
      return;
    }
    setMessage('Certificate restored as a draft.');
    await loadCoas();
  };

  return (
    <section className="rounded-xl border border-carbon-200 bg-carbon-50/70 p-4 sm:p-5" aria-labelledby="coa-manager-title">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-800">
          <FileCheck2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <Heading id="coa-manager-title" level={3} className="mb-1">
            Certificates of Analysis
          </Heading>
          <Text variant="small" muted>
            Upload a new batch certificate, publish the current version, and retain a reversible history.
          </Text>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error-border bg-error-light px-3 py-2 text-sm text-error-text" role="alert">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-lg border border-success-border bg-success-light px-3 py-2 text-sm text-success-text" role="status">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-dashed border-carbon-300 bg-white p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={fileInputId} className="mb-1.5 block text-sm font-medium text-carbon-800">
            Certificate file
          </label>
          <input
            id={fileInputId}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-carbon-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-carbon-950 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-carbon-800"
          />
          <p className="mt-1.5 text-xs text-carbon-500">PDF, PNG or JPG · maximum 10MB</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-carbon-800">Batch number</span>
          <input className="input" value={batchNumber} onChange={(event) => setBatchNumber(event.target.value)} placeholder="e.g. BATCH-2026-08" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-carbon-800">Laboratory</span>
          <input className="input" value={labName} onChange={(event) => setLabName(event.target.value)} placeholder="Testing laboratory" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-carbon-800">Test date</span>
          <input type="date" className="input" value={testDate} onChange={(event) => setTestDate(event.target.value)} />
        </label>
        <label className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-carbon-200 bg-carbon-50 px-3">
          <input type="checkbox" checked={makeCurrent} onChange={(event) => setMakeCurrent(event.target.checked)} className="h-4 w-4 rounded border-carbon-300 text-accent-700 focus:ring-accent-500" />
          <span className="text-sm font-medium text-carbon-800">Publish as current COA</span>
        </label>
        <div className="flex justify-end md:col-span-2">
          <Button onClick={() => void handleUpload()} disabled={!file || uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload certificate'}
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Text variant="small" weight="semibold">Certificate history</Text>
          <Text variant="caption" muted>{coas.length} record{coas.length === 1 ? '' : 's'}</Text>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-carbon-200 bg-white p-4 text-sm text-carbon-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading certificates…
          </div>
        ) : coas.length === 0 ? (
          <div className="rounded-lg border border-carbon-200 bg-white p-4 text-sm text-carbon-500">
            No certificates uploaded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {coas.map((coa) => (
              <div key={coa.id} className="flex flex-col gap-3 rounded-xl border border-carbon-200 bg-white p-3 sm:flex-row sm:items-center">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${coa.is_current ? 'bg-success-light text-success' : 'bg-carbon-100 text-carbon-500'}`}>
                  {coa.is_current ? <Check className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-carbon-900">{coa.file_name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                      coa.is_current
                        ? 'bg-success-muted text-success-text'
                        : coa.status === 'archived'
                          ? 'bg-carbon-100 text-carbon-600'
                          : 'bg-warning-muted text-warning-text'
                    }`}>
                      {coa.is_current ? 'Current' : coa.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-carbon-500">
                    {[coa.batch_number, coa.lab_name, coa.test_date, formatCoaFileSize(coa.file_size)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <a href={coa.document_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-carbon-200 px-3 text-xs font-medium text-carbon-700 transition-colors hover:bg-carbon-50">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </a>
                  {!coa.is_current && coa.status !== 'archived' ? (
                    <button type="button" onClick={() => void handleSetCurrent(coa)} disabled={busyId === coa.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-carbon-950 px-3 text-xs font-medium text-white transition-colors hover:bg-carbon-800 disabled:opacity-50">
                      {busyId === coa.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Make current
                    </button>
                  ) : null}
                  {coa.status === 'archived' ? (
                    <button type="button" onClick={() => void handleRestore(coa)} disabled={busyId === coa.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-carbon-200 px-3 text-xs font-medium text-carbon-700 hover:bg-carbon-50 disabled:opacity-50">
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                  ) : (
                    <button type="button" onClick={() => void handleArchive(coa)} disabled={busyId === coa.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-carbon-500 hover:bg-carbon-50 hover:text-carbon-900 disabled:opacity-50">
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
