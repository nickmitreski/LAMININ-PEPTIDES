# Chatbot Deployment Guide

This guide covers deploying the Laminin peptide chatbot and activating all features.

## What Was Built

### 1. **Floating Chatbot** (All Pages)
- Fixed launcher button (bottom-right corner)
- Chat panel with:
  - Message history (persisted in sessionStorage)
  - Suggested prompts for first-time users
  - Peptide suggestion chips based on conversation
  - Minimize/expand functionality
- Compliance-first design:
  - No medical advice or personal dosing
  - Evidence type labeling (rodent, phase 2, preclinical, etc.)
  - Safe regulatory language

### 2. **Research Library Page** (`/research`)
- Nav link: "Peptide Science"
- Category filters: Metabolic, Repair, Neurology, Longevity, Skin
- 18 peptide cards with:
  - Overview, mechanism, highlights
  - Evidence level notes
  - PubMed/journal citations
- Regulatory disclaimers (TGA/FDA)
- Single source of truth: `src/data/peptideData.ts`

### 3. **Backend Integration**
- Supabase Edge Function (`supabase/functions/chat/index.ts`)
- OpenAI GPT-4 Turbo integration
- Knowledge base loaded from:
  - `public/laminin-research/peptide-profiles.md`
  - `public/laminin-research/positioning-and-compliance.md`
- Rate limiting and token capping built-in

---

## Deployment Steps

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked: `supabase link --project-ref YOUR_PROJECT_REF`
- OpenAI API key ready

### Step 1: Deploy the Edge Function

```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# Deploy the chat function
supabase functions deploy chat --no-verify-jwt --project-ref YOUR_PROJECT_REF
```

**Expected output:**
```
Deploying function chat...
Function chat deployed successfully!
```

### Step 2: Set the OpenAI API Key

```bash
# Set the secret (replace with your actual key)
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here --project-ref YOUR_PROJECT_REF
```

**Verify it's set:**
```bash
supabase secrets list --project-ref YOUR_PROJECT_REF
```

You should see `OPENAI_API_KEY` in the list.

### Step 3: Test the Chatbot

1. Deploy the site to Vercel (or your hosting platform)
2. Visit any page on the site
3. Click the "Ask about peptides" button (bottom-right)
4. Try a test question: "What peptides help with weight loss?"

**Expected behavior:**
- Chat opens in a modal
- AI responds with 2-6 sentences
- Suggested peptide chips appear (e.g., "Retatrutide", "MOTS-c")
- Evidence level is mentioned ("phase 2 trial", "rodent models", etc.)

### Step 4: Verify Research Library

1. Visit `/research` on your site
2. Check that:
   - All category filters work
   - Peptide cards display with citations
   - External links open to PubMed/journals
   - Disclaimer is visible

---

## Knowledge Base Maintenance

The chatbot and Research Library page share the same data source to prevent content drift.

### Updating Peptide Information

**Option 1: Edit TypeScript Data (Current)**
- File: `src/data/peptideData.ts`
- Edit the `PEPTIDE_PROFILES` array
- Rebuild and redeploy

**Option 2: Sync from Markdown (Future)**
- Knowledge base lives in `/Users/nickmitreski/Downloads/protein-main-new/public/laminin-research/`
- Key files:
  - `peptide-profiles.md` - All peptide data
  - `positioning-and-compliance.md` - Regulatory language
  - `peptide-ui-categories.json` - Category mappings

The edge function currently loads from GitHub raw URLs:
- `https://raw.githubusercontent.com/nickmitreski/LAMININ-PEPTIDES/main/public/laminin-research/peptide-profiles.md`
- `https://raw.githubusercontent.com/nickmitreski/LAMININ-PEPTIDES/main/public/laminin-research/positioning-and-compliance.md`

**To update:**
1. Edit markdown files in `public/laminin-research/`
2. Commit and push to GitHub
3. Edge function will fetch the latest version on next deployment

---

## Customization

### Chatbot Behavior

**File:** `supabase/functions/chat/index.ts`

**Adjust:**
- `max_tokens`: 500 (controls response length)
- `temperature`: 0.7 (creativity level)
- `model`: 'gpt-4-turbo-preview' (can switch to gpt-3.5-turbo for cost savings)

### Suggested Prompts

**File:** `src/components/chat/ChatPanel.tsx`

**Edit the array:**
```typescript
const SUGGESTED_PROMPTS = [
  'What peptides help with weight loss?',
  'Tell me about BPC-157 research',
  // Add your own prompts here
];
```

### Category Filters

**File:** `src/data/peptideData.ts`

**Edit:**
```typescript
export const CATEGORY_FILTERS: CategoryFilter[] = [
  {
    id: 'metabolic',
    label: 'Metabolic & body composition',
    description: 'Weight regulation, insulin sensitivity...',
  },
  // Add more categories here
];
```

---

## Cost Management

### OpenAI API Costs

**Estimated usage:**
- Average query: ~1,500 tokens (prompt + knowledge base)
- Average response: ~200 tokens
- **Total per message: ~1,700 tokens**

**GPT-4 Turbo pricing (as of 2024):**
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens
- **Cost per message: ~$0.02**

**Monthly estimates:**
- 100 messages/month: ~$2
- 500 messages/month: ~$10
- 1,000 messages/month: ~$20

### Reduce Costs

1. **Switch to GPT-3.5 Turbo** (5x cheaper):
   ```typescript
   model: 'gpt-3.5-turbo'
   ```

2. **Reduce max_tokens**:
   ```typescript
   max_tokens: 300  // Shorter responses
   ```

3. **Trim knowledge base**:
   - Only load relevant sections based on user query
   - Implement RAG (retrieval-augmented generation) later

---

## Rate Limiting (TODO)

The edge function has placeholders for rate limiting. To implement:

**File:** `supabase/functions/chat/index.ts`

**Add rate limiting logic:**
```typescript
// Check IP or session rate limit
const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
// Implement Redis or Supabase table-based rate limiting
// Max 10 requests per minute per IP
```

**Alternative:** Use Cloudflare rate limiting rules on your domain.

---

## Monitoring

### Supabase Logs

```bash
# View function logs
supabase functions logs chat --project-ref YOUR_PROJECT_REF

# Follow live logs
supabase functions logs chat --project-ref YOUR_PROJECT_REF --follow
```

### OpenAI Usage

Visit https://platform.openai.com/usage to monitor:
- Token consumption
- Cost per day
- Request volume

---

## Troubleshooting

### Chatbot not responding

1. **Check Supabase function deployment:**
   ```bash
   supabase functions list --project-ref YOUR_PROJECT_REF
   ```

2. **Check OpenAI API key:**
   ```bash
   supabase secrets list --project-ref YOUR_PROJECT_REF
   ```

3. **Check browser console** for errors:
   - Open DevTools → Console
   - Look for "Chat API error" or network failures

4. **Check Supabase logs:**
   ```bash
   supabase functions logs chat --project-ref YOUR_PROJECT_REF
   ```

### Knowledge base not loading

The edge function fetches from GitHub raw URLs. If this fails:

1. **Check GitHub URLs** in `supabase/functions/chat/index.ts`
2. **Verify files exist** in `public/laminin-research/`
3. **Check CORS** - GitHub raw content should allow CORS

**Alternative:** Bundle knowledge base directly in the edge function instead of fetching from URLs.

### Rate limiting not working

Currently not implemented. See "Rate Limiting (TODO)" above.

---

## Next Steps

### Recommended Enhancements

1. **Add Laminin brand facts:**
   - Create `public/laminin-research/laminin-brand-facts.md`
   - Include: hours, shipping regions, contact, mission
   - Load into chatbot knowledge base

2. **Implement RAG** (Retrieval-Augmented Generation):
   - Chunk peptide profiles into smaller sections
   - Embed with OpenAI embeddings
   - Store in Supabase Vector (pgvector)
   - Retrieve only relevant chunks per query → lower costs

3. **Add analytics:**
   - Track popular queries
   - Identify knowledge gaps
   - Monitor user satisfaction

4. **A/B test prompts:**
   - Test different suggested prompts
   - Optimize for engagement

---

## Support

For questions or issues:
- Email: info@lamininpeplab.com.au
- Prefer the website **Contact** page for operational questions; do not publish a support phone in docs unless it is a real, monitored number.

---

**Deployment Checklist:**

- [ ] Edge function deployed: `supabase functions deploy chat --no-verify-jwt --project-ref YOUR_PROJECT_REF`
- [ ] OpenAI API key set: `supabase secrets set OPENAI_API_KEY=...`
- [ ] Site deployed to Vercel/hosting
- [ ] Chat launcher visible on all pages
- [ ] Research Library accessible at `/research`
- [ ] Test chatbot with sample queries
- [ ] Verify compliance language in responses
- [ ] Monitor OpenAI usage for first week
- [ ] Set up cost alerts in OpenAI dashboard

**Done!** 🎉
