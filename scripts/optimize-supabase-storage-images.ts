/**
 * One-off / maintenance: re-encode Supabase Storage product images as WebP (lossy).
 *
 * For each JPEG/PNG (and optionally existing WebP with --force), downloads the object,
 * resizes max edge to `--max-width`, encodes WebP at `--quality` with max effort /
 * chroma subsampling for smaller bytes, uploads (upsert), updates `product_images.image_url`
 * when the DB still has the exact old public URL, then deletes the source object when the path changed.
 *
 * Secrets (never commit):
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Project URL:
 *   VITE_SUPABASE_URL or SUPABASE_URL
 *
 * Loads `.env.local` then `.env` if present.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/optimize-supabase-storage-images.ts --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/optimize-supabase-storage-images.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

type CliArgs = {
  dryRun: boolean;
  force: boolean;
  deleteOriginal: boolean;
  bucket: string;
  prefix: string;
  maxWidth: number;
  quality: number;
};

function loadEnvFiles(): void {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env) || process.env[k] === '') {
        process.env[k] = v;
      }
    }
  }
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    dryRun: false,
    force: false,
    deleteOriginal: true,
    bucket: 'product-images',
    prefix: 'products',
    maxWidth: 1200,
    /** Default tuned for smallest practical WebP; raise with --quality */
    quality: 65,
  };

  const take = (
    flag: string,
    key: keyof Pick<CliArgs, 'bucket' | 'prefix' | 'maxWidth' | 'quality'>
  ): void => {
    const i = argv.indexOf(flag);
    if (i < 0 || i + 1 >= argv.length) {
      console.error(`Missing value for ${flag}`);
      process.exit(1);
    }
    const v = argv[i + 1];
    if (key === 'maxWidth' || key === 'quality') {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        console.error(`Invalid number for ${flag}: ${v}`);
        process.exit(1);
      }
      (out as Record<string, number>)[key] = n;
    } else {
      (out as Record<string, string>)[key] = v.replace(/^\/+|\/+$/g, '');
    }
  };

  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a === '--no-delete-original') out.deleteOriginal = false;
    else if (a === '--bucket') take('--bucket', 'bucket');
    else if (a === '--prefix') take('--prefix', 'prefix');
    else if (a === '--max-width') take('--max-width', 'maxWidth');
    else if (a === '--quality') take('--quality', 'quality');
  }

  if (out.maxWidth < 64 || out.maxWidth > 8192) {
    console.error('--max-width should be between 64 and 8192');
    process.exit(1);
  }
  if (out.quality < 1 || out.quality > 100) {
    console.error('--quality should be between 1 and 100');
    process.exit(1);
  }

  return out;
}

function storagePublicUrl(admin: ReturnType<typeof createClient>, bucket: string, objectPath: string): string {
  const {
    data: { publicUrl },
  } = admin.storage.from(bucket).getPublicUrl(objectPath);
  return publicUrl;
}

async function listAllFiles(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  folder: string
): Promise<string[]> {
  const names: string[] = [];
  const pageSize = 1000;
  const stack: string[] = [folder];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await admin.storage.from(bucket).list(current, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error) throw new Error(`list ${current || '<root>'}: ${error.message}`);
      if (!data?.length) break;
      for (const entry of data) {
        if (!entry.name) continue;
        const full = current ? `${current}/${entry.name}` : entry.name;
        if (entry.metadata == null) {
          stack.push(full);
        } else {
          names.push(full);
        }
      }
      if (data.length < pageSize) break;
    }
  }

  return names;
}

async function downloadBuffer(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  path: string
): Promise<Buffer> {
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error) throw new Error(`download ${path}: ${error.message}`);
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

/** Lossy WebP only — tuned for smaller file sizes (alpha trimmed a bit harder). */
async function encodeMinimalWebp(
  input: Buffer,
  args: { maxWidth: number; quality: number }
): Promise<Buffer> {
  const alphaQ = Math.max(35, Math.min(100, args.quality - 12));
  return sharp(input)
    .resize({
      width: args.maxWidth,
      height: args.maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: args.quality,
      alphaQuality: alphaQ,
      effort: 6,
      smartSubsample: true,
      nearLossless: false,
    })
    .toBuffer();
}

async function main(): Promise<void> {
  loadEnvFiles();
  const cli = parseArgs(process.argv.slice(2));

  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !serviceKey) {
    console.error(
      'Missing VITE_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY.'
    );
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const allPaths = await listAllFiles(admin, cli.bucket, cli.prefix);

  /** Accept common rasters stored in the bucket; GIF/SVG untouched. */
  const workList = allPaths.filter((p) => {
    if (/\.webp$/i.test(p)) return cli.force;
    return /\.(jpe?g|png)$/i.test(p);
  });

  console.log(
    `[${cli.bucket}/${cli.prefix}/] Listed ${allPaths.length} objects; queued ${workList.length} (${cli.dryRun ? 'dry-run' : 'live'}).`
  );

  let ok = 0;
  let failed = 0;

  for (const path of workList) {
    const lastSlash = path.lastIndexOf('/');
    const dir = lastSlash >= 0 ? path.slice(0, lastSlash) : '';
    const baseName = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
    const dot = baseName.lastIndexOf('.');
    const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
    const uploadPath = dir ? `${dir}/${stem}.webp` : `${stem}.webp`;

    try {
      if (cli.dryRun) {
        console.log(`• Would encode ${path} → ${uploadPath} (lossy, q=${cli.quality})`);
        ok++;
        continue;
      }

      const original = await downloadBuffer(admin, cli.bucket, path);
      const webpBuf = await encodeMinimalWebp(original, cli);

      const oldUrlExact = storagePublicUrl(admin, cli.bucket, path);
      const newUrlExact = storagePublicUrl(admin, cli.bucket, uploadPath);

      const { data: refs, error: selErr } = await admin
        .from('product_images')
        .select('id')
        .eq('image_url', oldUrlExact);

      if (selErr) throw new Error(selErr.message);

      console.log(
        `• ${path} → ${uploadPath} (image/webp q=${cli.quality}, ${(webpBuf.length / 1024).toFixed(
          1
        )} KiB ← was ${(original.length / 1024).toFixed(1)} KiB); DB rows referencing old URL: ${refs?.length ?? 0}`
      );

      const { error: upErr } = await admin.storage.from(cli.bucket).upload(uploadPath, webpBuf, {
        upsert: true,
        cacheControl: '31536000',
        contentType: 'image/webp',
      });
      if (upErr) throw new Error(upErr.message);

      if ((refs ?? []).length > 0 && oldUrlExact !== newUrlExact) {
        const { error: dbErr } = await admin
          .from('product_images')
          .update({ image_url: newUrlExact })
          .eq('image_url', oldUrlExact);

        if (dbErr) throw new Error(dbErr.message);
      } else if ((refs ?? []).length > 0 && oldUrlExact === newUrlExact) {
        console.log(`  In-place overwrite for ${uploadPath}: URL unchanged.`);
      } else if (oldUrlExact !== newUrlExact) {
        console.warn(
          `  No product_images rows matched exact legacy URL → update DB manually if needed.` +
            `\n    Old (expected): ${oldUrlExact}\n    New stored at: ${newUrlExact}`
        );
      }

      if (
        cli.deleteOriginal &&
        path !== uploadPath
      ) {
        const { error: delErr } = await admin.storage.from(cli.bucket).remove([path]);
        if (delErr) console.warn(`  Could not delete original blob: ${delErr.message}`);
      }
      ok++;
    } catch (e) {
      failed++;
      console.error(`✗ ${path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
