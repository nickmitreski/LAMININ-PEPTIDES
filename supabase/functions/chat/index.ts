// Laminin peptide chatbot - OpenAI integration with knowledge base
// Edge function deployed to Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createRateLimiter, getClientIp } from '../_shared/rateLimit.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

/** Canonical public storefront (must match live DNS / index.html). */
const PUBLIC_SITE_ORIGIN = 'https://lamininpeplab.com.au';
const CONTACT_EMAIL = 'info@lamininpeplab.com.au';

// Per-IP throttle so a stolen anon key can't burn the OpenAI quota in a loop.
// Tuned for a real chatbot user: a burst of a few questions, then a pause.
const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
});

// Optional message-length cap to bound prompt cost per request.
const MAX_USER_MESSAGE_CHARS = 4000;
const MAX_MESSAGES_PER_REQUEST = 30;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

// Load knowledge base files at function initialization
const loadKnowledgeBase = async (): Promise<string> => {
  try {
    // In production, these files should be fetched from your Supabase storage or bundled
    // For now, we'll provide the essential knowledge inline
    const peptideProfilesUrl = 'https://raw.githubusercontent.com/nickmitreski/LAMININ-PEPTIDES/main/public/laminin-research/peptide-profiles.md';
    const complianceUrl = 'https://raw.githubusercontent.com/nickmitreski/LAMININ-PEPTIDES/main/public/laminin-research/positioning-and-compliance.md';

    const [profilesResponse, complianceResponse] = await Promise.all([
      fetch(peptideProfilesUrl),
      fetch(complianceUrl)
    ]);

    const profiles = profilesResponse.ok ? await profilesResponse.text() : '';
    const compliance = complianceResponse.ok ? await complianceResponse.text() : '';

    return `
## PEPTIDE KNOWLEDGE BASE

${compliance}

${profiles}

## LAMININ BRAND FACTS

- **Shipping:** Express Australia-wide with tracking; orders dispatch next business day
- **COA:** Certificate of Analysis available for all products on the COA page
- **Contact:** Website contact form at /contact and email ${CONTACT_EMAIL} — do not invent phone numbers or alternate contacts
- **Products:** Research-grade peptides for laboratory use only
- **Purity Guarantee:** All products meet strict quality standards with third-party verification
`.trim();
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return 'Knowledge base temporarily unavailable.';
  }
};

const SYSTEM_PROMPT = `You are a helpful research assistant for Laminin Peptide Lab, an Australian peptide supplier.

## ORDERING (STRICT)
- The live storefront is ${PUBLIC_SITE_ORIGIN}. Do not mention other domain spellings (e.g. old typos); if unsure, say to use the site’s Contact page.
- Describe ordering ONLY as: browse the compound library or product pages → add items to cart → open checkout → follow the on-screen payment / bank-transfer instructions.
- For questions like “how do I order from Laminin”, give those steps. Do NOT invent phone order lines, retail store addresses, SMS ordering, or third-party marketplaces.
- If operational detail is not explicitly in the knowledge base or brand facts, say you are not certain and direct the user to ${PUBLIC_SITE_ORIGIN}/contact (or “the site’s Contact page”) and FAQ instead of guessing.

## CONTACT (STRICT)
- Primary human contact paths: the website Contact page and email ${CONTACT_EMAIL}.
- Never provide a phone number unless it appears verbatim in the knowledge base below (there is no public phone placeholder).

## YOUR ROLE
- Provide CONCISE answers (2-6 sentences by default)
- Ask "Want more detail?" before long explanations
- Be natural, professional, and educational
- Focus on published research, not medical advice

## KNOWLEDGE SCOPE
1. **Peptides & compounds:** Answer from the knowledge base below
2. **Laminin:** Shipping, ordering, COA policy, contact info, brand facts
3. If vague query ("tell me about peptides"), ask what they're interested in

## COMPLIANCE (CRITICAL)
- NEVER give personal medical advice or dosing recommendations
- ALWAYS specify evidence type: "rodent study", "phase 2 human trial", "preclinical", etc.
- Use language: "investigational compound", "emerging research", "not approved for this use"
- AVOID: "cures", "heals", "fixes", "FDA-approved" (unless true)
- ALWAYS add: "Discuss any health decisions with a qualified clinician"

## SUGGESTED PEPTIDES
When user shows interest in a goal or peptide, offer relevant chips:
- Weight/metabolic: Retatrutide, MOTS-c, CJC-1295, 5-Amino-1MQ
- Skin/healing: GHK-Cu, BPC-157, TB-500
- Nerve/brain: ARA-290, Cerebrolysin, Selank/Semax
- Longevity: MOTS-c, Epithalon, NAD+, FOXO4-DRI

Return suggested peptides as: [CHIPS: peptide1, peptide2, peptide3]

Use catalogue-style names matching the storefront where possible so quick links resolve (examples: “BPC-157”, “MOTS-c”, “Retatrutide”, “CJC-1295 + Ipamorelin”, “Selank”). Avoid vague chips like “blend” alone.

## KNOWLEDGE BASE
`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let parsedBody: ChatRequest;
  try {
    parsedBody = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Throttle using IP + session when possible. Many edge paths report IP as
  // "unknown", so a single shared bucket would 429 everyone at once.
  const clientIp = getClientIp(req);
  const sid =
    typeof parsedBody.sessionId === 'string' && parsedBody.sessionId.trim().length > 0
      ? parsedBody.sessionId.trim()
      : '';
  const rateKey = sid ? `${clientIp}|${sid}` : clientIp;
  if (!chatLimiter.check(rateKey)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { messages } = parsedBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid request: messages array required');
    }

    if (messages.length > MAX_MESSAGES_PER_REQUEST) {
      return new Response(
        JSON.stringify({ error: 'Conversation too long. Please start a new chat.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const m of messages) {
      if (typeof m?.content !== 'string' || m.content.length > MAX_USER_MESSAGE_CHARS) {
        return new Response(
          JSON.stringify({ error: 'Message too long.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Load knowledge base (cached in edge function instance)
    const knowledgeBase = await loadKnowledgeBase();

    // Prepare messages for OpenAI
    const systemMessage: ChatMessage = {
      role: 'system',
      content: SYSTEM_PROMPT + '\n\n' + knowledgeBase
    };

    const openAIMessages = [systemMessage, ...messages];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        max_tokens: 500, // Cap for concise responses
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    // Extract suggested peptides if present
    const chipsMatch = assistantMessage.match(/\[CHIPS: (.+?)\]/);
    const suggestedPeptides = chipsMatch ? chipsMatch[1].split(',').map((s: string) => s.trim()) : [];
    const cleanMessage = assistantMessage.replace(/\[CHIPS: .+?\]/g, '').trim();

    return new Response(
      JSON.stringify({
        message: cleanMessage,
        suggestedPeptides,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
