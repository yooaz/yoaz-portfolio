# Instagram feed — YoAz (professional API migration, October 2026)

The Netlify endpoint /.netlify/functions/instagram-feed only returns real posts.
This is a migration candidate, not proof that the current Netlify token works.

## Prerequisite

The account must be Instagram Business or Creator. Instagram Basic Display
was retired on December 4, 2024 and cannot be used for personal accounts.

## Mode A — Instagram API with Facebook Login

Configure a Facebook Page/User token authorized for the Instagram professional
account and supply the professional Instagram account ID:

- INSTAGRAM_ACCESS_TOKEN = valid Facebook Graph token
- INSTAGRAM_USER_ID = Instagram professional account ID
- INSTAGRAM_LIMIT = optional number from 1 to 24 (default 9)

Endpoint: https://graph.facebook.com/v26.0/{INSTAGRAM_USER_ID}/media

## Mode B — Instagram API with Instagram Login

Use an Instagram professional account token with the required media read
permissions. Omit INSTAGRAM_USER_ID entirely:

- INSTAGRAM_ACCESS_TOKEN = valid Instagram Login token
- INSTAGRAM_LIMIT = optional number from 1 to 24

Endpoint: https://graph.instagram.com/v26.0/me/media

Never mix the token types. A failed request does not retry the other mode.

## Security and migration notes

- Graph API v20.0 ended support in September 2026; the candidate targets v26.0.
- Missing credentials return an unconfigured response without a network call.
- Public errors are generic and do not echo the provider response or token.
- Upstream timeout: nine seconds; HTTPS media validation; cached per token/account/limit.
- No live Meta requests, Netlify preview or production deployment were run.

## Manual approval gate

1. Verify an Instagram Business or Creator account and API permissions.
2. Store valid credentials as Netlify secrets; never commit them.
3. Test a current real post (media URL, timestamp, permalink) in a supervised environment.
4. Check expiration, empty feed, 401/403 behavior and token redaction.
5. Confirm current Meta API compatibility before deploying.

The retired Instagram Basic Display fallback must not be reintroduced.
