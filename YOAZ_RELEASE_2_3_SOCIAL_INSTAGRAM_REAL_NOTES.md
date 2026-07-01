# YOAZ Release 2.3 — Social Icons + Real Instagram Embeds

Fixes:
- Replaced social icons with clean official-style inline SVG marks.
- Removed Foundation from visible social rows.
- Replaced the fake/local Instagram fallback artwork with real Instagram post embeds from @iamyoaz.
- Kept a visible fallback link for each Instagram post if Instagram embed.js is blocked locally.

Important:
- A truly automatic latest-post feed requires Instagram Graph API access token + cache endpoint. This static fallback uses real Instagram permalinks and Instagram embed.js, so it is no longer reusing local gallery drawings as if they were Instagram posts.
