// aura/quiz/scoring.js

const QUESTIONS = [
  {
    id: 'q1',
    text: "Where have you lost the most ground?",
    options: [
      { text: "My body. Softer, slower, less in control than I used to be.", scores: { body: 3, mind: 0, soul: 0 }, depth: null, tag: 'body_general' },
      { text: "My mind. The edge is gone. Reactive, scattered, not the sharpest guy in the room anymore.", scores: { body: 0, mind: 3, soul: 0 }, depth: null, tag: 'mind_general' },
      { text: "My sense of self. I built the life. Lost the point somewhere along the way.", scores: { body: 0, mind: 0, soul: 3 }, depth: null, tag: 'soul_general' },
      { text: "All three. I'm not operating at the level I know I'm capable of.", scores: { body: 1, mind: 1, soul: 1 }, depth: null, tag: 'all' },
    ]
  },
  {
    id: 'q2',
    text: "What does getting back to your peak actually look like?",
    options: [
      { text: "A body that performs. Lean, strong, back in control of how I look and feel.", scores: { body: 3, mind: 0, soul: 0 }, depth: null, tag: 'body_performance' },
      { text: "My edge back. Sharp decisions, clear thinking, commanding the room again.", scores: { body: 0, mind: 3, soul: 0 }, depth: null, tag: 'mind_clarity' },
      { text: "A clear mission. Knowing what I'm building and why it still matters.", scores: { body: 0, mind: 0, soul: 3 }, depth: null, tag: 'soul_direction' },
      { text: "All three firing together. The full version of me, back online.", scores: { body: 1, mind: 1, soul: 1 }, depth: null, tag: 'all' },
    ]
  },
  {
    id: 'q3',
    text: "Where is the gap costing you most?",
    options: [
      { text: "In how I look and perform physically. I'm not the guy I was.", scores: { body: 2, mind: 0, soul: 0 }, depth: null, tag: 'cost_physical' },
      { text: "At work. My decisions, my presence, the energy I bring to the room.", scores: { body: 0, mind: 2, soul: 0 }, depth: null, tag: 'cost_work' },
      { text: "In who I am. I don't fully recognise the man I've become.", scores: { body: 0, mind: 0, soul: 2 }, depth: null, tag: 'cost_self' },
      { text: "Everywhere. It's bleeding into every part of my life.", scores: { body: 1, mind: 1, soul: 1 }, depth: null, tag: 'cost_all' },
    ]
  },
  {
    id: 'q4',
    text: "How long have you been running below your potential?",
    options: [
      { text: "A few months. It's recent.", scores: { body: 0, mind: 0, soul: 0 }, depth: 'low', tag: 'recent' },
      { text: "Over a year. Managing it and telling myself it's fine.", scores: { body: 0, mind: 0, soul: 0 }, depth: 'medium', tag: 'managing' },
      { text: "Long enough that I can't remember my last real peak.", scores: { body: 0, mind: 0, soul: 0 }, depth: 'high', tag: 'chronic' },
      { text: "It comes and goes. Good patches, then it falls apart again.", scores: { body: 0, mind: 0, soul: 0 }, depth: 'medium', tag: 'cyclical' },
    ]
  },
  {
    id: 'q5',
    text: "Where are you physically right now?",
    options: [
      { text: "Carrying too much. I need to cut and get lean again.", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low', tag: 'fat_loss' },
      { text: "Smaller and weaker than I should be. I need to rebuild.", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low', tag: 'muscle_build' },
      { text: "Performance is off. Energy, output, recovery are all down.", scores: { body: 1, mind: 0, soul: 0 }, depth: 'low', tag: 'performance' },
      { text: "I've tried everything. Nothing has stuck and I'm still not where I was.", scores: { body: 0, mind: 0, soul: 0 }, depth: 'high', tag: 'tried_all' },
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
