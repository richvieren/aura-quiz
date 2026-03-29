// aura/quiz/result.js

const PILLAR_CONFIG = {
  apex: {
    label: 'APEX — BODY',
    ctaCopy: 'Your body is the operating system everything else runs on. When it slips, everything is harder. One conversation changes that.',
    ctaText: 'BOOK YOUR APEX CALL',
    ctaHref: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2x5Q59LpeLh0Cl9OIyi8XhfuZeCuscIGN9E1TN557-F9IiTW3X0tjnxWibhDWEehUw9hVxSiev',
    stages: ['Foundation', 'Apex 1:1 Coaching', 'Advanced Programming', 'Integration', 'Mastery'],
  },
  axon: {
    label: 'AXON — MIND',
    ctaCopy: 'Your instincts are still there. They are buried under noise. The full analysis shows you exactly where the interference is coming from.',
    ctaText: 'UNLOCK STAGE 2 — READ THE ROOM',
    ctaHref: null,
    stages: ['Awareness', 'Read The Room', 'Applied Frameworks', 'Cross-Pillar', 'Mastery'],
  },
  aeon: {
    label: 'AEON — SOUL',
    ctaCopy: 'You already know something needs to shift. Your Blueprint maps exactly what and why.',
    ctaText: 'UNLOCK STAGE 2 — BLUEPRINT READING',
    ctaHref: null,
    stages: ['Mapping', 'Blueprint Reading', 'Alignment Work', 'Embodiment', 'Mastery'],
  },
  aura: {
    label: 'AURA — ALL THREE',
    ctaCopy: 'You have tried everything in isolation. Nothing stuck because the problem is not in one place. This conversation is different.',
    ctaText: 'BOOK YOUR AURA CALL',
    ctaHref: 'https://calendar.app.google/bUEvWFg1um2Sgocy5',
    stages: ['Triage', 'Aura Platinum', 'Full Integration', 'Optimisation', 'Mastery'],
  },
};

let currentSessionId = null;
let currentResultType = null;

function renderResult(sessionId, resultType, scores, verdict, sub, gameplan, stage2Hook) {
  currentSessionId = sessionId;
  currentResultType = resultType;

  const config = PILLAR_CONFIG[resultType];

  document.getElementById('result-pillar-label').textContent = config.label;
  document.getElementById('result-verdict').textContent = verdict;
  document.getElementById('result-sub').textContent = sub;

  renderScoreBars(scores);
  renderGameplan(gameplan);
  renderStageRoadmap(config.stages);
  renderCTA(config, stage2Hook);

  showScreen('screen-result');
}

function renderScoreBars(scores) {
  const maxScore = 10;
  const bars = document.getElementById('score-bars');
  bars.innerHTML = '';

  [['BODY', scores.body], ['MIND', scores.mind], ['SOUL', scores.soul]].forEach(([label, score]) => {
    const pct = Math.round((score / maxScore) * 100);
    bars.innerHTML += `
      <div class="score-row">
        <span class="score-row-label">${label}</span>
        <div class="score-track"><div class="score-bar-fill" style="width:${pct}%"></div></div>
        <span class="score-pct">${pct}%</span>
      </div>`;
  });
}

function renderGameplan(gameplan) {
  const container = document.getElementById('gameplan-moves');
  container.innerHTML = '';
  gameplan.forEach((move, i) => {
    container.innerHTML += `
      <div class="gameplan-move">
        <p class="move-number">0${i + 1}</p>
        <p class="move-title">${move.title}</p>
        <p class="move-detail">${move.detail}</p>
      </div>`;
  });
}

function renderStageRoadmap(stages) {
  const container = document.getElementById('stage-roadmap');
  container.innerHTML = '';
  stages.forEach((stage, i) => {
    const cls = i === 0 ? 'unlocked' : 'locked';
    const dot = i === 0 ? '\u25CF' : '\u25CB';
    container.innerHTML += `
      <div class="stage-row ${cls}">
        <span class="stage-dot">${dot}</span>
        <span class="stage-number">STAGE ${i + 1}</span>
        <span class="stage-label">${stage}</span>
      </div>`;
  });
}

function renderCTA(config, stage2Hook) {
  document.getElementById('stage2-hook').textContent = stage2Hook;
  document.getElementById('cta-copy').textContent = config.ctaCopy;

  const ctaLink = document.getElementById('cta-link');
  ctaLink.textContent = config.ctaText;

  if (config.ctaHref) {
    ctaLink.href = config.ctaHref;
    ctaLink.onclick = null;
  } else {
    ctaLink.href = '#';
    ctaLink.onclick = async (e) => {
      e.preventDefault();
      ctaLink.textContent = 'Loading...';
      ctaLink.style.pointerEvents = 'none';
      try {
        const { checkoutUrl } = await createCheckout(currentSessionId, currentResultType);
        window.location.href = checkoutUrl;
      } catch (err) {
        ctaLink.textContent = config.ctaText;
        ctaLink.style.pointerEvents = '';
        alert('Error: ' + err.message);
      }
    };
  }
}

// Wire up submitAndRender (called from quiz.js)
async function submitAndRender(email, answers, scores, resultType) {
  try {
    const data = await generateResult(email, answers, scores, resultType);
    renderResult(
      data.sessionId,
      data.resultType,
      data.scores,
      data.verdict,
      data.sub,
      data.gameplan,
      data.stage2_hook
    );
  } catch (e) {
    showScreen('screen-landing');
    alert('Error: ' + e.message);
  }
}
