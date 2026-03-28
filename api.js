// aura/quiz/api.js

async function generateResult(email, answers, scores, resultType) {
  const res = await fetch(`${CONFIG.supabaseUrl}/functions/v1/generate-result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`,
    },
    body: JSON.stringify({ email, answers, scores, resultType }),
  });
  if (!res.ok) throw new Error('Generation failed');
  return res.json();
}

async function createCheckout(sessionId, resultType) {
  const res = await fetch(`${CONFIG.supabaseUrl}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`,
    },
    body: JSON.stringify({ sessionId, resultType }),
  });
  if (!res.ok) throw new Error('Checkout failed');
  return res.json();
}

async function pollForPayment(sessionId) {
  // Poll Supabase REST API every 2s until paid = true (max 2 minutes)
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(
      `${CONFIG.supabaseUrl}/rest/v1/quiz_responses?id=eq.${sessionId}&select=paid,diagnosis`,
      { headers: { 'apikey': CONFIG.supabaseAnonKey, 'Authorization': `Bearer ${CONFIG.supabaseAnonKey}` } }
    );
    const data = await res.json();
    if (data[0]?.paid) return data[0].diagnosis;
  }
  return null;
}
