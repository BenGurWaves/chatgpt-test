async function sign(secret, payload) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function parseSignature(header) { return Object.fromEntries(header.split(',').map(x => x.split('='))); }
export async function onRequestPost(context) {
  const payload = await context.request.text();
  const header = context.request.headers.get('stripe-signature') || '';
  const parts = parseSignature(header);
  if (!parts.t || !parts.v1 || !context.env.STRIPE_WEBHOOK_SECRET) return new Response('Bad webhook configuration', { status: 400 });
  const expected = await sign(context.env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${payload}`);
  if (expected !== parts.v1) return new Response('Invalid signature', { status: 400 });
  const event = JSON.parse(payload);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email || 'unknown';
    const plan = session.metadata?.plan || 'unknown';
    const amount = ((session.amount_total || 0) / 100).toFixed(2);
    const resendKey = context.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', { method:'POST', headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'}, body:JSON.stringify({ from:'ChatGPTWebMaker <orders@calyvent.com>', to:['contact@calyvent.com'], subject:`New ChatGPTWebMaker purchase: ${plan}`, html:`<h2>New ChatGPTWebMaker purchase</h2><p><b>Plan:</b> ${plan}</p><p><b>Amount:</b> $${amount}</p><p><b>Customer:</b> ${email}</p><p><b>Stripe session:</b> ${session.id}</p><p>The customer has completed payment. Contact them for project information and fulfillment.</p>`}) });
    }
  }
  return Response.json({ received: true });
}
