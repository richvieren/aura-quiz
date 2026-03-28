// aura/quiz/supabase/functions/create-checkout/index.ts
import Stripe from 'npm:stripe@12.18.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const PRICE_IDS = {
  axon: Deno.env.get('STRIPE_PRICE_AXON')!,
  aeon: Deno.env.get('STRIPE_PRICE_AEON')!,
};

const APP_URL = Deno.env.get('APP_URL')!; // e.g. https://richvieren.github.io/aura-quiz

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  const { sessionId, resultType } = await req.json();
  const priceId = PRICE_IDS[resultType as 'axon' | 'aeon'];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}?stripe_session={CHECKOUT_SESSION_ID}&quiz_session=${sessionId}`,
    cancel_url: APP_URL,
    metadata: { quiz_session_id: sessionId },
  });

  // Store Stripe session ID
  await supabase.from('quiz_responses').update({ stripe_session_id: session.id }).eq('id', sessionId);

  return new Response(JSON.stringify({ checkoutUrl: session.url }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
});
