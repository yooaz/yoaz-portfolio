// YOAZ — secure Stripe checkout / payment-link resolver for Netlify.
// Preferred simple mode: set Stripe Payment Link env vars in Netlify.
// Optional advanced mode: set STRIPE_SECRET_KEY to create Checkout Sessions server-side.
// Never exposes secret keys to the front-end.

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

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

function cleanUrl(value) {
  const url = String(value || '').trim();
  if (!/^https:\/\//i.test(url)) return '';
  return url;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

    const { slug } = JSON.parse(event.body || '{}');
    if (!PRODUCTS[slug]) return json(400, { error: 'Unknown product' });

    // Payment Link mode: price is controlled in Stripe, not by browser input.
    const specific = cleanUrl(process.env[PRODUCT_ENV[slug]]);
    const fallback = cleanUrl(process.env.STRIPE_UNIVERSAL_PAYMENT_LINK || process.env.STRIPE_PAYMENT_LINK);
    if (specific || fallback) return json(200, { url: specific || fallback, mode: 'payment_link' });

    // Optional session mode. Requires the secret server-side only.
    if (!process.env.STRIPE_SECRET_KEY) return json(503, { error: 'Stripe not configured' });

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const [name, amount, image] = PRODUCTS[slug];
    const site = (process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://yoaz.fr').replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'always',
      phone_number_collection: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR','NL','BE','DE','ES','IT','PT','GB','IE','US','CA','CH','AT','DK','SE','NO','FI','LU'],
      },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'eur' },
          display_name: 'Livraison incluse',
        },
      }],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: amount,
          product_data: {
            name: `${name} — Poster Fine Art 50×70 cm`,
            description: 'Tirage Yoaz Fine Art matte — livraison incluse.',
            images: [`${site}/${image}`],
            metadata: { slug, format: '50x70', displayed_price: '59 EUR' },
          },
        },
      }],
      client_reference_id: slug,
      metadata: { product_slug: slug, product_name: name, format: '50x70', displayed_price: '59 EUR' },
      payment_intent_data: { metadata: { product_slug: slug, product_name: name, format: '50x70', displayed_price: '59 EUR' } },
      success_url: `${site}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/#shop`,
    });

    return json(200, { url: session.url, mode: 'checkout_session' });
  } catch (err) {
    return json(500, { error: err && err.message ? err.message : 'Checkout error' });
  }
};
