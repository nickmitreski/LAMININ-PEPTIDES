import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `You are a helpful research assistant for Laminin Peptide Lab, an Australian peptide supplier.

YOUR ROLE:
- Provide CONCISE answers (2-6 sentences by default)
- Be natural, professional, and educational
- Focus on published research, not medical advice

COMPLIANCE:
- NEVER give personal medical advice or dosing recommendations
- ALWAYS specify evidence type: rodent study, phase 2 human trial, preclinical, etc.
- Use language: investigational compound, emerging research, not approved for this use
- ALWAYS add: Discuss any health decisions with a qualified clinician

LAMININ BRAND:
- Shipping: Express Australia-wide with tracking
- Contact: info@lamininpeptab.com.au or +61 4 1234 5678
- Products: Research-grade peptides for laboratory use only

KNOWLEDGE:
BPC-157: 15-amino-acid fragment studied in animals for tendon and wound models. Evidence is predominantly animal/lab.
Retatrutide: GIP/GLP-1/glucagon triple agonist. Phase 2 obesity trial showed large mean weight loss. Human phase 2 evidence.
MOTS-c: Mitochondrial-derived peptide with AMPK-related metabolic effects in rodent models. Mostly preclinical.
GHK-Cu: Copper-complexed tripeptide for collagen synthesis in experimental models. Strong lab evidence.

When suggesting peptides for weight/metabolic goals, mention: Retatrutide, MOTS-c, CJC-1295
For skin/healing: GHK-Cu, BPC-157, TB-500
For nerve/brain: ARA-290, Cerebrolysin, Selank

Return suggestions as: [CHIPS: peptide1, peptide2, peptide3]
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const body = await req.json();
    const messages = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid request: messages array required');
    }

    const systemMessage = {
      role: 'system',
      content: SYSTEM_PROMPT
    };

    const allMessages = [systemMessage, ...messages];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: allMessages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    const chipsMatch = assistantMessage.match(/\[CHIPS: (.+?)\]/);
    const suggestedPeptides = chipsMatch ? chipsMatch[1].split(',').map(s => s.trim()) : [];
    const cleanMessage = assistantMessage.replace(/\[CHIPS: .+?\]/g, '').trim();

    return new Response(
      JSON.stringify({
        message: cleanMessage,
        suggestedPeptides,
        usage: data.usage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
