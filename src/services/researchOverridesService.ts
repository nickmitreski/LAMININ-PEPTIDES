import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type ResearchProfileOverrideRow = {
  profile_id: string;
  overview: string | null;
  mechanism: string | null;
  highlights: string | null;
  updated_at: string;
};

export async function fetchResearchProfileOverrides(): Promise<
  Record<string, ResearchProfileOverrideRow>
> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('research_profile_overrides').select('*');
  if (error || !data) return {};
  const out: Record<string, ResearchProfileOverrideRow> = {};
  for (const row of data as ResearchProfileOverrideRow[]) {
    out[row.profile_id] = row;
  }
  return out;
}

export async function upsertResearchProfileOverride(
  client: SupabaseClient | null,
  row: {
    profile_id: string;
    overview: string | null;
    mechanism: string | null;
    highlights: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  const { error } = await client.from('research_profile_overrides').upsert(
    {
      profile_id: row.profile_id,
      overview: row.overview,
      mechanism: row.mechanism,
      highlights: row.highlights,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' }
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteResearchProfileOverride(
  client: SupabaseClient | null,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  const { error } = await client
    .from('research_profile_overrides')
    .delete()
    .eq('profile_id', profileId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
