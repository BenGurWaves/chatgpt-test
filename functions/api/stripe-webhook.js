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
    const name = session.customer_details?.name || 'Not provided';
    const plan = session.metadata?.plan || 'unknown';
    const amount = ((session.amount_total || 0) / 100).toFixed(2);
    const details = { plan, amount: `$${amount}`, customer: name, email, stripe_session: session.id, paid_at: new Date().toISOString(), next_step: 'Customer should complete the project intake form.' };
    const html = `<h2>New ChatGPTWebMaker purchase</h2><p><b>They just paid.</b></p>${Object.entries(details).map(([k,v])=>`<p><b>${k.replaceAll('_',' ')}:</b> ${String(v)}</p>`).join('')}`;
    if (context.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', { method:'POST', headers:{Authorization:`Bearer ${context.env.RESEND_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({ from:'ChatGPTWebMaker <orders@calyvent.com>', to:['contact@calyvent.com'], subject:`New ChatGPTWebMaker purchase: ${plan}`, html }) });
    } else {
      const form = new URLSearchParams({ _subject:`New ChatGPTWebMaker purchase: ${plan}`, message:`They just paid on ChatGPTWebMaker.\n\n${Object.entries(details).map(([k,v])=>`${k}: ${v}`).join('\n')}` });
      await fetch('https://formsubmit.co/ajax/contact@calyvent.com', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'}, body:form });
    }
  }
  return Response.json({ received: true });
}
