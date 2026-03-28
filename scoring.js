// aura/quiz/scoring.js

const QUESTIONS = [
  {
    id: 'q1',
    text: "What's the one thing draining you most right now?",
    options: [
      { text: "My body is running on empty — low energy, bad sleep, not training", scores: { body: 3, mind: 0, soul: 0 }, depth: null },
      { text: "My head won't switch off — brain fog, can't focus, always reactive", scores: { body: 0, mind: 3, soul: 0 }, depth: null },
      { text: "I've lost the plot on why I'm doing any of this", scores: { body: 0, mind: 0, soul: 3 }, depth: null },
      { text: "All three, honestly", scores: { body: 1, mind: 1, soul: 1 }, depth: null },
    ]
  },
  {
    id: 'q2',
    text: "What do you actually want?",
    options: [
      { text: "Feel physically strong and in control again", scores: { body: 3, mind: 0, soul: 0 }, depth: null },
      { text: "Think sharper, make better calls, trust my instincts", scores: { body: 0, mind: 3, soul: 0 }, depth: null },
      { text: "Find direction, meaning, or understand myself better", scores: { body: 0, mind: 0, soul: 3 }, depth: null },
      { text: "I want all of it — the full reset", scores: { body: 1, mind: 1, soul: 1 }, depth: null },
    ]
  },
  {
    id: 'q3',
    text: "Where is it costing you most?",
    options: [
      { text: "In the gym, my health, how I look and feel", scores: { body: 2, mind: 0, soul: 0 }, depth: null },
      { text: "In my work, decisions, relationships, being present", scores: { body: 0, mind: 2, soul: 0 }, depth: null },
      { text: "In my sense of self — who I am, what I'm here for", scores: { body: 0, mind: 0, soul: 2 }, depth: null },
      { text: "Everywhere equally", scores: { body: 1, mind: 1, soul: 1 }, depth: null },
    ]
  },
  {
    id: 'q4',
    text: "How long has this been building?",
    options: [
      { text: "Recently — a few months", scores: { body: 0, mind: 0, soul: 0 }, depth: 'low' },
      { text: "A while — over a year", scores: { body: 0, mind: 0, soul: 0 }, depth: 'medium' },
      { text: "Long enough that I can't remember feeling different", scores: { body: 0, mind: 0, soul: 0 }, depth: 'high' },
      { text: "It comes in waves", scores: { body: 0, mind: 0, soul: 0 }, depth: 'medium' },
    ]
  },
  {
    id: 'q5',
    text: "What have you already attempted?",
    options: [
      { text: "Training programs, diets, supplements", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low' },
      { text: "Productivity systems, therapy, coaching", scores: { body: 0, mind: 1, soul: 0 }, depth: 'low' },
      { text: "Retreats, journaling, spiritual practices", scores: { body: 0, mind: 0, soul: 1 }, depth: 'low' },
      { text: "A bit of everything, nothing stuck", scores: { body: 0, mind: 0, soul: 0 }, depth: 'high' },
    ]
  },
];

function calculateResult(answers) {
  // answers = { q1: optionIndex, q2: optionIndex, ... }
  const scores = { body: 0, mind: 0, soul: 0 };
  let q4Depth = 'low';
  let q5Depth = 'low';

  QUESTIONS.forEach((q, qIdx) => {
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

  // Route to Aura if no clear winner and deep
  if (gap < 3 && q4Depth === 'high' && q5Depth === 'high') {
    return { resultType: 'aura', scores };
  }

  // Route to single pillar
  const pillarMap = { body: 'apex', mind: 'axon', soul: 'aeon' };
  return { resultType: pillarMap[topPillar], scores };
}
