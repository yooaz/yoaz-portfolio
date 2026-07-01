# Mettre le site sur Netlify (yoaz-portfolio)

**yoaz.fr est déjà hébergé sur Netlify.** Pour que chaque `git push` déploie automatiquement ce dépôt :

## Option A — Nouveau site lié à GitHub (recommandé si pas encore lié)

1. Ouvrir : https://app.netlify.com/start/deploy?repository=https://github.com/yooaz/yoaz-portfolio
2. Se connecter à Netlify + autoriser GitHub.
3. Choisir le dépôt **yoaz-portfolio**.
4. Paramètres de build :
   - **Branch to deploy :** `main`
   - **Build command :** *(vide)*
   - **Publish directory :** `.`
5. **Deploy site**.
6. Dans **Domain management**, ajouter ou reconnecter **yoaz.fr** (si vous remplacez un ancien site, supprimez le domaine de l’ancien site d’abord).

## Option B — Site Netlify existant (yoaz.fr déjà en place)

1. https://app.netlify.com → ouvrir le site **yoaz.fr**.
2. **Site configuration** → **Build & deploy** → **Continuous deployment** → **Link repository**.
3. GitHub → **yoaz-portfolio** → branche **main**.
4. **Build settings :** publish directory = `.`, build command vide.
5. **Deploys** → **Trigger deploy** → **Deploy site** (pour publier le commit `Fix mobile hero and final QA`).

## CLI (optionnel, une fois)

```bash
npx netlify-cli login
cd "/Users/yohannazancot/YOAZ_STUDIO_OS/yoaz-v18 12"
npx netlify-cli init   # lier au site existant ou en créer un
npx netlify-cli deploy --prod --dir .
```

## Vérification

- https://yoaz.fr/ charge
- En-tête réponse : `server: Netlify`
- Dernier commit GitHub : https://github.com/yooaz/yoaz-portfolio/commits/main
