import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});

const SYSTEM_PROMPT = `You are writing a personalized performance diagnosis for a high-achieving man aged 35–65. He is a founder, entrepreneur, or operator. He has arrived at this quiz feeling something is off — energy, sharpness, or purpose.

Your tone: blunt, precise, authoritative. No fluff. No exclamation marks. No life-coach language. Write like a performance analyst who has seen this before and knows exactly what's happening.

Never use: journey, wellness, transform, crush, amazing, unlock potential, holistic, empower, elevate, thrive.

Write exactly three blocks. Each block is 2–4 sentences. Be specific to what the answers reveal. Do not write generic copy that could apply to anyone.

Return ONLY valid JSON in this exact format:
{
  "problem": "...",
  "cause": "...",
  "transformation": "..."
}

problem: What is actually happening. Name it precisely.
cause: Why it is happening. Root this in his specific answers.
transformation: What concretely shifts when this is addressed. Vivid and specific.`;

const QUESTIONS = [
  "What's the one thing draining you most right now?",
  "What do you actually want?",
  "Where is it costing you most?",
  "How long has this been building?",
  "What have you already attempted?",
];

const ANSWER_OPTIONS = [
  ["My body is running on empty — low energy, bad sleep, not training", "My head won't switch off — brain fog, can't focus, always reactive", "I've lost the plot on why I'm doing any of this", "All three, honestly"],
  ["Feel physically strong and in control again", "Think sharper, make better calls, trust my instincts", "Find direction, meaning, or understand myself better", "I want all of it — the full reset"],
  ["In the gym, my health, how I look and feel", "In my work, decisions, relationships, being present", "In my sense of self — who I am, what I'm here for", "Everywhere equally"],
  ["Recently — a few months", "A while — over a year", "Long enough that I can't remember feeling different", "It comes in waves"],
  ["Training programs, diets, supplements", "Productivity systems, therapy, coaching", "Retreats, journaling, spiritual practices", "A bit of everything, nothing stuck"],
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  const { email, answers, scores, resultType } = await req.json();

  // Build readable answer summary
  const answerSummary = Object.entries(answers).map(([qId, idx], i) => {
    return `Q${i + 1}: "${QUESTIONS[i]}" → "${ANSWER_OPTIONS[i][idx as number]}"`;
  }).join('\n');

  const userMessage = `Result type: ${resultType.toUpperCase()}
Body score: ${scores.body}, Mind score: ${scores.mind}, Soul score: ${scores.soul}

Quiz answers:
${answerSummary}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const diagnosis = JSON.parse((message.content[0] as any).text);

  // Store in DB
  const { data, error } = await supabase
    .from('quiz_responses')
    .insert({
      email,
      answers,
      scores,
      result_type: resultType,
      diagnosis,
      pillar_tag: resultType,
      paid: false,
    })
    .select('id')
    .single();

  if (error) throw error;

  // For Axon/Aeon: return only the problem block + session id (cause/transformation held server-side)
  const isPaywalled = resultType === 'axon' || resultType === 'aeon';

  return new Response(JSON.stringify({
    sessionId: data.id,
    resultType,
    scores,
    diagnosis: isPaywalled
      ? { problem: diagnosis.problem, cause: null, transformation: null }
      : diagnosis,
    paywalled: isPaywalled,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
});
