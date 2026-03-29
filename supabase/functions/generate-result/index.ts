import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const SYSTEM_PROMPT = `You are writing a personalised performance gameplan for a high-achieving man aged 35-65. He is a founder, entrepreneur, or operator.

Your tone: blunt, precise, authoritative. No fluff. No exclamation marks. No life-coach language. Write like a performance analyst who has seen this before and knows exactly what is happening.

Never use: journey, wellness, transform, crush, amazing, unlock potential, holistic, empower, elevate, thrive, delve, realm, harness, tapestry, paradigm, leverage, synergy, innovative, game-changer, transformative, seamless, optimize, streamline.

Never use em dashes anywhere in your output. Use plain conjunctions or two sentences instead.

Return ONLY valid JSON in this exact format:
{
  "verdict": "SHORT BOLD STATEMENT IN CAPS.",
  "sub": "One quiet line. Not hype.",
  "gameplan": [
    {"title": "Action-oriented title", "detail": "2-4 sentences. Concrete and specific."},
    {"title": "Action-oriented title", "detail": "2-4 sentences. Concrete and specific."},
    {"title": "Action-oriented title", "detail": "2-4 sentences. Concrete and specific."}
  ],
  "stage2_hook": "One sentence bridging the free gameplan to what Stage 2 adds. Factual, not salesy."
}

Rules:
- verdict: 4-8 words, all caps, ends with a period. No em dashes.
- sub: one sentence. Quiet. Not motivational.
- gameplan: exactly 3 items. Each title is an action directive, not a label. Each detail is 2-4 sentences, specific to his answers. No generic advice that could apply to anyone.
- stage2_hook: one sentence that bridges what Stage 1 gives him to what Stage 2 adds. Factual tone.
- For Body/Apex results: scope gameplan strictly to hybrid training (strength, endurance, recovery), sleep, and nutrition basics. Use the body context tag to personalise: fat_loss gets nutrition and deficit focus, muscle_build gets progressive overload and protein targets, performance gets recovery and periodisation.
- For Mind/Axon results: scope gameplan to cognitive performance, decision quality, and stress regulation.
- For Soul/Aeon results: scope gameplan to identity clarity, direction-setting, and values alignment.
- For Aura results: cover one concrete move from each domain (body, mind, soul).
- Be specific to the context tags provided. Same result type with different tags should produce different moves.`;

const QUESTIONS = [
  "What's actually draining you most right now?",
  "What would a win look like?",
  "Where is it showing up most?",
  "How long has this been building?",
  "What best describes where you're at physically right now?",
];

const ANSWER_OPTIONS = [
  [
    "My body -- low energy, carrying weight, not training consistently",
    "My head -- can't switch off, reactive, losing sharpness",
    "My sense of self -- successful on paper, but something's missing",
    "All of it -- nothing feels dialed in",
  ],
  [
    "Leaner, stronger, performing physically -- I want my body as an asset",
    "Clearer thinking, better decisions, more presence in the room",
    "A clear direction -- understanding what I'm actually building toward",
    "The full reset -- all three working together",
  ],
  [
    "In the gym, how I look, how I physically perform",
    "In my work -- decisions, relationships, how I show up",
    "In my identity -- who I am, what I'm here for",
    "Everywhere -- it's bleeding into everything",
  ],
  [
    "A few months -- it's recent",
    "Over a year -- I've been managing it",
    "Long enough that I can't remember feeling different",
    "It cycles -- good patches, then it comes back",
  ],
  [
    "I've gained weight and need to lean out -- I've tried diets",
    "I'm underdeveloped -- I need to build strength and muscle",
    "My performance and energy are off -- I feel weaker than I should",
    "I've tried everything across the board -- nothing has stuck",
  ],
];

const CONTEXT_TAGS = [
  ['body_general', 'mind_general', 'soul_general', 'all'],
  ['body_performance', 'mind_clarity', 'soul_direction', 'all'],
  ['cost_physical', 'cost_work', 'cost_self', 'cost_all'],
  ['recent', 'managing', 'chronic', 'cyclical'],
  ['fat_loss', 'muscle_build', 'performance', 'tried_all'],
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { email, answers, scores, resultType } = await req.json();

    const answerSummary = Object.entries(answers).map(([, idx], i) => {
      return `Q${i + 1}: "${QUESTIONS[i]}" -> "${ANSWER_OPTIONS[i][idx as number]}"`;
    }).join('\n');

    const tags = Object.entries(answers).map(([, idx], i) =>
      CONTEXT_TAGS[i][idx as number]
    );

    const userMessage = `Result type: ${resultType.toUpperCase()}
Body score: ${scores.body}, Mind score: ${scores.mind}, Soul score: ${scores.soul}
Context tags: ${tags.join(', ')}

Quiz answers:
${answerSummary}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const claudeData = await claudeRes.json();
    const raw = claudeData.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(raw);

    const { data, error } = await supabase
      .from('quiz_responses')
      .insert({
        email,
        answers,
        scores,
        result_type: resultType,
        gameplan: result.gameplan,
        context_tags: tags,
        pillar_tag: resultType,
        paid: false,
      })
      .select('id')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      sessionId: data.id,
      resultType,
      scores,
      verdict: result.verdict,
      sub: result.sub,
      gameplan: result.gameplan,
      stage2_hook: result.stage2_hook,
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS }
    });
  }
});
