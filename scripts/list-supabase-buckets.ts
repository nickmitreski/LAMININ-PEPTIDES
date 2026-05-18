import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });
const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const s = createClient(url, key, { auth: { persistSession: false } });

const { data: buckets, error } = await s.storage.listBuckets();
if (error) {
  console.error('listBuckets error:', error);
  process.exit(1);
}
console.log('Buckets:');
for (const b of buckets) console.log(' -', b.name, '(public:', b.public + ')');

for (const b of buckets) {
  const { data: top, error: e } = await s.storage.from(b.name).list('', { limit: 200 });
  if (e) {
    console.log(`\n[${b.name}] list error:`, e.message);
    continue;
  }
  console.log(`\n[${b.name}] top-level entries:`);
  for (const f of top || []) console.log('  ', f.name, f.id ? '(file)' : '(folder)');
}
