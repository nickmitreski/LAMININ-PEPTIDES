// Laminin peptide chatbot - OpenAI integration with knowledge base
// Edge function deployed to Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createRateLimiter, getClientIp } from '../_shared/rateLimit.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
- **Contact:** info@lamininpeptab.com.au or +61 4 1234 5678
- **Products:** Research-grade peptides for laboratory use only
- **Purity Guarantee:** All products meet strict quality standards with third-party verification
`.trim();
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return 'Knowledge base temporarily unavailable.';
  }
};

const SYSTEM_PROMPT = `You are a helpful research assistant for Laminin Peptide Lab, an Australian peptide supplier.

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

  // Throttle per IP to protect the OpenAI quota from abuse via the anon key.
  const clientIp = getClientIp(req);
  if (!chatLimiter.check(clientIp)) {
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

    const { messages, sessionId }: ChatRequest = await req.json();

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
        model: 'gpt-4-turbo-preview',
        messages: openAIMessages,
        max_tokens: 500, // Cap for concise responses
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
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
