// aura/quiz/scoring.js

const QUESTIONS = [
  {
    id: 'q1',
    text: "What's actually draining you most right now?",
    options: [
      { text: "My body — low energy, carrying weight, not training consistently", scores: { body: 3, mind: 0, soul: 0 }, depth: null, tag: 'body_general' },
      { text: "My head — can't switch off, reactive, losing sharpness", scores: { body: 0, mind: 3, soul: 0 }, depth: null, tag: 'mind_general' },
      { text: "My sense of self — successful on paper, but something's missing", scores: { body: 0, mind: 0, soul: 3 }, depth: null, tag: 'soul_general' },
      { text: "All of it — nothing feels dialed in", scores: { body: 1, mind: 1, soul: 1 }, depth: null, tag: 'all' },
    ]
  },
  {
    id: 'q2',
    text: "What would a win look like?",
    options: [
      { text: "Leaner, stronger, performing physically — I want my body as an asset", scores: { body: 3, mind: 0, soul: 0 }, depth: null, tag: 'body_performance' },
      { text: "Clearer thinking, better decisions, more presence in the room", scores: { body: 0, mind: 3, soul: 0 }, depth: null, tag: 'mind_clarity' },
      { text: "A clear direction — understanding what I'm actually building toward", scores: { body: 0, mind: 0, soul: 3 }, depth: null, tag: 'soul_direction' },
      { text: "The full reset — all three working together", scores: { body: 1, mind: 1, soul: 1 }, depth: null, tag: 'all' },
    ]
  },
  {
    id: 'q3',
    text: "Where is it showing up most?",
    options: [
      { text: "In the gym, how I look, how I physically perform", scores: { body: 2, mind: 0, soul: 0 }, depth: null, tag: 'cost_physical' },
      { text: "In my work — decisions, relationships, how I show up", scores: { body: 0, mind: 2, soul: 0 }, depth: null, tag: 'cost_work' },
      { text: "In my identity — who I am, what I'm here for", scores: { body: 0, mind: 0, soul: 2 }, depth: null, tag: 'cost_self' },
      { text: "Everywhere — it's bleeding into everything", scores: { body: 1, mind: 1, soul: 1 }, depth: null, tag: 'cost_all' },
    ]
  },
  {
    id: 'q4',
    text: "How long has this been building?",
    options: [
      { text: "A few months — it's recent", scores: { body: 0, mind: 0, soul: 0 }, depth: 'low', tag: 'recent' },
      { text: "Over a year — I've been managing it", scores: { body: 0, mind: 0, soul: 0 }, depth: 'medium', tag: 'managing' },
      { text: "Long enough that I can't remember feeling different", scores: { body: 0, mind: 0, soul: 0 }, depth: 'high', tag: 'chronic' },
      { text: "It cycles — good patches, then it comes back", scores: { body: 0, mind: 0, soul: 0 }, depth: 'medium', tag: 'cyclical' },
    ]
  },
  {
    id: 'q5',
    text: "What best describes where you're at physically right now?",
    options: [
      { text: "I've gained weight and need to lean out — I've tried diets", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low', tag: 'fat_loss' },
      { text: "I'm underdeveloped — I need to build strength and muscle", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low', tag: 'muscle_build' },
      { text: "My performance and energy are off — I feel weaker than I should", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low', tag: 'performance' },
      { text: "I've tried everything across the board — nothing has stuck", scores: { body: 0, mind: 0, soul: 0 }, depth: 'high', tag: 'tried_all' },
    ]
  },
];

function calculateResult(answers) {
  // answers = { q1: optionIndex, q2: optionIndex, ... }
  const scores = { body: 0, mind: 0, soul: 0 };
  let q4Depth = 'low';
  let q5Depth = 'low';

  QUESTIONS.forEach((q) => {
    const answerIdx = answers[q.id];
    if (answerIdx === undefined) return;
    const option = q.options[answerIdx];
    scores.body += option.scores.body;
    scores.mind += option.scores.mind;
    scores.soul += option.scores.soul;
    if (q.id === 'q4') q4Depth = option.depth;
    if (q.id === 'q5') q5Depth = option.depth;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topPillar, topScore] = sorted[0];
  const [, secondScore] = sorted[1];
  const gap = topScore - secondScore;

  // Clear winner: one pillar >= 3 ahead of both others
  if (gap >= 3) {
    const pillarMap = { body: 'apex', mind: 'axon', soul: 'aeon' };
    return { resultType: pillarMap[topPillar], scores };
  }

  // No clear winner + deep history = Aura
  if (q4Depth === 'high' && q5Depth === 'high') {
    return { resultType: 'aura', scores };
  }

  // Otherwise: highest score wins. Tie defaults to body (apex).
  const pillarMap = { body: 'apex', mind: 'axon', soul: 'aeon' };
  return { resultType: pillarMap[topPillar], scores };
}
