// aura/quiz/supabase/functions/stripe-webhook/index.ts
import Stripe from 'npm:stripe@12.18.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch {
    return new Response('Webhook signature failed', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const quizSessionId = session.metadata?.quiz_session_id;
    if (quizSessionId) {
      await supabase.from('quiz_responses').update({ paid: true }).eq('id', quizSessionId);
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
