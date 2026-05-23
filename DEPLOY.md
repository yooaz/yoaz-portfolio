# Yoaz portfolio — GitHub + Netlify deploy

Static site. No build step. Publish directory: project root (`.`).

## Local Git (done)

```bash
git init -b main
git add .
git commit -m "Yoaz portfolio validated freeze"
```

Commit: `448907c` on branch `main`.

## GitHub (one-time)

1. Install and log in (if needed):

```bash
brew install gh   # macOS
gh auth login
```

2. Create the repo and push from this folder:

```bash
cd "/Users/yohannazancot/YOAZ_STUDIO_OS/yoaz-v18 12"
gh repo create yoaz-portfolio --public --source=. --remote=origin --push
```

If the repo already exists on your account:

```bash
git remote add origin https://github.com/YOUR_USERNAME/yoaz-portfolio.git
git push -u origin main
```

## Netlify (one-time)

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project** → **GitHub** → `yoaz-portfolio`.
2. Build settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `.`
3. **Deploy site**.
4. **Domain settings:** attach `yoaz.fr` (existing DNS).
5. **Site configuration → Build & deploy:**
   - Production branch: `main`
   - **Deploy previews:** On (for pull requests)

`netlify.toml` in this repo already configures:

- `publish = "."`
- Security headers (`_headers` mirrored in TOML)
- SEO file cache (`sitemap.xml`, `robots.txt`, `llms.txt`, …)
- 404 fallback to `/404.html` (not a SPA rewrite — static files stay reachable)
- HTTPS redirects for `www.yoaz.fr` → `yoaz.fr`

Do **not** add `/* → /index.html` (200) — it can hide real static assets.

## Future updates

```bash
git add .
git commit -m "describe your change"
git push
```

Netlify deploys automatically from `main`. Pull requests get preview URLs if enabled.

## Post-deploy QA

- https://yoaz.fr/ loads
- https://yoaz.fr/robots.txt
- https://yoaz.fr/sitemap.xml
- https://yoaz.fr/llms.txt
- https://yoaz.fr/images/hero.webp
- GTM/GA in page source
- Shopify product links open correctly
