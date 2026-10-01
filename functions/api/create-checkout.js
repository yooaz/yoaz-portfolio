// YOAZ — Cloudflare Pages version of the checkout endpoint.
// Preferred mode: Stripe Payment Links via environment variables.
// Optional mode: STRIPE_SECRET_KEY creates a Checkout Session through Stripe's REST API.

const PRODUCT_ENV = {
  'chaos-horse': 'STRIPE_LINK_CHAOS_HORSE',
  'faces': 'STRIPE_LINK_FACES',
  'palm-guardians': 'STRIPE_LINK_PALM_GUARDIANS',
  'portail': 'STRIPE_LINK_PORTAIL',
  'cite-psychedelique': 'STRIPE_LINK_CITE_PSYCHEDELIQUE',
};

const PRODUCTS = {
  'chaos-horse': ['Chaos Horse', 5900, 'images/hero.jpg'],
  'faces': ['Faces', 5900, 'images/gallery-vision.jpg'],
  'palm-guardians': ['Palm Guardians', 5900, 'images/gallery-jungle.jpg'],
  'portail': ['Portail', 5900, 'images/gallery-portail.jpg'],
  'cite-psychedelique': ['Cité Psychédélique', 5900, 'images/gallery-cite-psychedelique.jpg'],
};

const COUNTRIES = ['FR','NL','BE','DE','ES','IT','PT','GB','IE','US','CA','CH','AT','DK','SE','NO','FI','LU'];

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function cleanUrl(value) {
  const url = String(value || '').trim();
  return /^https:\/\//i.test(url) ? url : '';
}

function add(params, key, value) {
  params.append(key, String(value));
}

export async function onRequestPost({ request, env }) {
  try {
    const { slug } = await request.json().catch(() => ({}));
    if (!PRODUCTS[slug]) return json(400, { error: 'Unknown product' });

    const specific = cleanUrl(env[PRODUCT_ENV[slug]]);
    const fallback = cleanUrl(env.STRIPE_UNIVERSAL_PAYMENT_LINK || env.STRIPE_PAYMENT_LINK);
    if (specific || fallback) {
      return json(200, { url: specific || fallback, mode: 'payment_link' });
    }

    if (!env.STRIPE_SECRET_KEY) return json(503, { error: 'Stripe not configured' });

    const [name, amount, image] = PRODUCTS[slug];
    const site = cleanUrl(env.SITE_URL) || new URL(request.url).origin || 'https://yoaz.fr';

    const params = new URLSearchParams();
    add(params, 'mode', 'payment');
    add(params, 'customer_creation', 'always');
    add(params, 'phone_number_collection[enabled]', 'true');
    add(params, 'billing_address_collection', 'required');
    COUNTRIES.forEach((country, index) => add(params, `shipping_address_collection[allowed_countries][${index}]`, country));
    add(params, 'shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    add(params, 'shipping_options[0][shipping_rate_data][fixed_amount][amount]', 0);
    add(params, 'shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
    add(params, 'shipping_options[0][shipping_rate_data][display_name]', 'Livraison incluse');
    add(params, 'line_items[0][quantity]', 1);
    add(params, 'line_items[0][price_data][currency]', 'eur');
    add(params, 'line_items[0][price_data][unit_amount]', amount);
    add(params, 'line_items[0][price_data][product_data][name]', `${name} — Poster Fine Art 50×70 cm`);
    add(params, 'line_items[0][price_data][product_data][description]', 'Tirage Yoaz Fine Art matte — livraison incluse.');
    add(params, 'line_items[0][price_data][product_data][images][0]', `${site.replace(/\/$/, '')}/${image}`);
    add(params, 'line_items[0][price_data][product_data][metadata][slug]', slug);
    add(params, 'line_items[0][price_data][product_data][metadata][format]', '50x70');
    add(params, 'line_items[0][price_data][product_data][metadata][displayed_price]', '59 EUR');
    add(params, 'client_reference_id', slug);
    add(params, 'metadata[product_slug]', slug);
    add(params, 'metadata[product_name]', name);
    add(params, 'metadata[format]', '50x70');
    add(params, 'metadata[displayed_price]', '59 EUR');
    add(params, 'payment_intent_data[metadata][product_slug]', slug);
    add(params, 'payment_intent_data[metadata][product_name]', name);
    add(params, 'payment_intent_data[metadata][format]', '50x70');
    add(params, 'payment_intent_data[metadata][displayed_price]', '59 EUR');
    add(params, 'success_url', `${site.replace(/\/$/, '')}/order-success.html?session_id={CHECKOUT_SESSION_ID}`);
    add(params, 'cancel_url', `${site.replace(/\/$/, '')}/#shop`);

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const stripeData = await stripeResponse.json();
    if (!stripeResponse.ok || !stripeData.url) {
      const message = stripeData && stripeData.error && stripeData.error.message
        ? stripeData.error.message
        : `Stripe HTTP ${stripeResponse.status}`;
      return json(502, { error: message });
    }

    return json(200, { url: stripeData.url, mode: 'checkout_session' });
  } catch (err) {
    return json(500, { error: err && err.message ? err.message : 'Checkout error' });
  }
}

export function onRequest() {
  return json(405, { error: 'Method not allowed' });
}
