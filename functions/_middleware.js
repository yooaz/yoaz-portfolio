// YOAZ — Preview SEO safety for Cloudflare Pages.
// Prevents *.pages.dev previews from being indexed while leaving yoaz.fr indexable.

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);

  if (url.hostname.endsWith('.pages.dev')) {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
