# Instagram feed setup — Yoaz

The website now uses a real backend endpoint:

`/.netlify/functions/instagram-feed`

It never displays fake/local artworks as Instagram posts.

## Netlify environment variables

Add these in Netlify → Site configuration → Environment variables:

```bash
INSTAGRAM_ACCESS_TOKEN=YOUR_LONG_LIVED_META_OR_INSTAGRAM_TOKEN
INSTAGRAM_LIMIT=9
```

Recommended for Instagram Business / Creator accounts:

```bash
INSTAGRAM_USER_ID=YOUR_INSTAGRAM_BUSINESS_USER_ID
```

If `INSTAGRAM_USER_ID` is provided, the function uses Meta Graph API:

`https://graph.facebook.com/v20.0/{INSTAGRAM_USER_ID}/media`

If not, it tries Instagram Basic Display:

`https://graph.instagram.com/me/media`

## Required Meta setup

1. Instagram account must be Creator or Business.
2. Link it to a Facebook Page.
3. Create a Meta Developer app.
4. Generate a long-lived token with the correct Instagram permissions.
5. Add the token to Netlify and redeploy.

## Expected result

The Instagram section shows only real latest posts from `@iamyoaz`. If the token is missing or expired, it shows a clean setup message instead of fake images.
