export async function onRequestPost(context) {
  try {
    const { plan } = await context.request.json();
    const plans = {
      starter: [2900, 'ChatGPTWebMaker Starter'],
      business: [9900, 'ChatGPTWebMaker Business'],
      signature: [24900, 'ChatGPTWebMaker Signature']
    };
    if (!plans[plan]) return Response.json({ error: 'Invalid plan' }, { status: 400 });
    const [amount, name] = plans[plan];
    const origin = new URL(context.request.url).origin;
    const body = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(amount),
      'line_items[0][price_data][product_data][name]': name,
      'line_items[0][price_data][product_data][description]': 'Custom website build from ChatGPTWebMaker',
      'line_items[0][quantity]': '1',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      customer_creation: 'always',
      billing_address_collection: 'auto',
      'metadata[plan]': plan
    });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.error?.message || 'Stripe error' }, { status: 502 });
    return Response.json({ url: data.url });
  } catch (error) {
    return Response.json({ error: 'Unable to start checkout' }, { status: 500 });
  }
}
