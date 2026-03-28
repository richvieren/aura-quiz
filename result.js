// aura/quiz/result.js

const PILLAR_CONFIG = {
  apex: {
    label: 'APEX — BODY',
    verdict: 'YOUR BODY IS THE BOTTLENECK.',
    sub: 'This is where your reset starts.',
    ctaCopy: 'Your body is the operating system everything else runs on. When it slips, everything is harder. One conversation changes that.',
    ctaText: 'BOOK YOUR APEX CALL →',
    ctaHref: 'https://calendly.com/YOUR_APEX_LINK',
  },
  axon: {
    label: 'AXON — MIND',
    verdict: 'YOUR MIND IS THE BOTTLENECK.',
    sub: 'This is where your reset starts.',
    ctaCopy: 'Your instincts are still there. They are buried under noise. The full analysis shows you exactly where the interference is coming from.',
    ctaText: 'UNLOCK YOUR FULL ANALYSIS →',
    ctaHref: null, // paywall
  },
  aeon: {
    label: 'AEON — SOUL',
    verdict: 'YOUR SENSE OF SELF IS THE BOTTLENECK.',
    sub: 'This is where your reset starts.',
    ctaCopy: 'You already know something needs to shift. Your full analysis maps exactly what and why — built from your chart and your answers.',
    ctaText: 'UNLOCK YOUR FULL ANALYSIS →',
    ctaHref: null, // paywall
  },
  aura: {
    label: 'AURA — ALL THREE',
    verdict: 'THIS GOES DEEPER THAN ONE FIX.',
    sub: 'Body, mind, and soul. All three are involved.',
    ctaCopy: 'You have tried everything in isolation. Nothing stuck because the problem is not in one place. This conversation is different.',
    ctaText: 'BOOK YOUR AURA CALL →',
    ctaHref: 'https://calendly.com/YOUR_AURA_LINK',
  },
};

let currentSessionId = null;
let currentResultType = null;

function renderResult(sessionId, resultType, scores, diagnosis, paywalled) {
  currentSessionId = sessionId;
  currentResultType = resultType;

  const config = PILLAR_CONFIG[resultType];

  document.getElementById('result-pillar-label').textContent = config.label;
  document.getElementById('result-verdict').textContent = config.verdict;
  document.getElementById('result-sub').textContent = config.sub;

  renderScoreBars(scores);
  renderDiagnosis(diagnosis, paywalled);
  renderCTA(config, paywalled);

  showScreen('screen-result');
}

function renderScoreBars(scores) {
  const maxScore = 9; // max possible per pillar (Q1:3 + Q2:3 + Q3:2 + Q5:1)
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

function renderDiagnosis(diagnosis, paywalled) {
  document.getElementById('text-problem').textContent = diagnosis.problem;

  if (paywalled) {
    document.getElementById('block-cause').classList.add('paywall-blur');
    document.getElementById('block-transformation').classList.add('paywall-blur');
    document.getElementById('text-cause').textContent = 'This section reveals the root cause driving your situation. Unlock to read.';
    document.getElementById('text-transformation').textContent = 'This section describes exactly what shifts when the root cause is addressed. Unlock to read.';
    document.getElementById('paywall-gate').style.display = 'block';
  } else {
    document.getElementById('block-cause').classList.remove('paywall-blur');
    document.getElementById('block-transformation').classList.remove('paywall-blur');
    document.getElementById('text-cause').textContent = diagnosis.cause;
    document.getElementById('text-transformation').textContent = diagnosis.transformation;
  }
}

function renderCTA(config, paywalled) {
  if (!paywalled) {
    const block = document.getElementById('cta-block');
    block.style.display = 'block';
    document.getElementById('cta-copy').textContent = config.ctaCopy;
    document.getElementById('cta-link').textContent = config.ctaText;
    document.getElementById('cta-link').href = config.ctaHref;
  }
}

// Unlock button
document.getElementById('btn-unlock').addEventListener('click', async () => {
  document.getElementById('btn-unlock').textContent = 'Loading...';
  document.getElementById('btn-unlock').disabled = true;

  const { checkoutUrl } = await createCheckout(currentSessionId, currentResultType);
  window.location.href = checkoutUrl;
});

// Called when returning from Stripe with ?stripe_session= and ?quiz_session= params
async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const stripeSession = params.get('stripe_session');
  const quizSession = params.get('quiz_session');
  if (!stripeSession || !quizSession) return;

  showScreen('screen-loading');
  document.querySelector('#screen-loading p').textContent = 'Verifying payment...';

  const diagnosis = await pollForPayment(quizSession);
  if (diagnosis) {
    // Re-fetch result_type from Supabase since JS state was reset on redirect
    const res = await fetch(
      `${CONFIG.supabaseUrl}/rest/v1/quiz_responses?id=eq.${quizSession}&select=result_type`,
      { headers: { 'apikey': CONFIG.supabaseAnonKey, 'Authorization': `Bearer ${CONFIG.supabaseAnonKey}` } }
    );
    const rows = await res.json();
    const resultType = rows[0]?.result_type || 'axon';
    const config = PILLAR_CONFIG[resultType];
    document.getElementById('text-cause').textContent = diagnosis.cause;
    document.getElementById('text-transformation').textContent = diagnosis.transformation;
    document.getElementById('block-cause').classList.remove('paywall-blur');
    document.getElementById('block-transformation').classList.remove('paywall-blur');
    document.getElementById('paywall-gate').style.display = 'none';
    document.getElementById('cta-block').style.display = 'block';
    document.getElementById('cta-copy').textContent = config.ctaCopy;
    document.getElementById('cta-link').textContent = config.ctaText;
    document.getElementById('cta-link').href = config.ctaHref || '#';
    showScreen('screen-result');
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// Wire up submitAndRender (called from quiz.js)
async function submitAndRender(email, answers, scores, resultType) {
  try {
    const data = await generateResult(email, answers, scores, resultType);
    renderResult(data.sessionId, data.resultType, data.scores, data.diagnosis, data.paywalled);
  } catch (e) {
    showScreen('screen-landing');
    alert('Error: ' + e.message);
  }
}

// Check for payment return on page load
handlePaymentReturn();
