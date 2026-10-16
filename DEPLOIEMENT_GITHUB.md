# Publier Studio Feed sur GitHub

Ce projet est prêt pour un dépôt nommé **studio-feed-instagram**.

## Créer le dépôt en ligne (étape à faire sur votre compte)

1. Aller sur https://github.com/new.
2. **Repository name** : `studio-feed-instagram` ; visibilité **Public**.
3. **Ne pas cocher** « Add a README file », `.gitignore` ou licence.
4. Cliquer **Create repository**. Le dépôt vide peut alors recevoir les fichiers depuis ChatGPT (connecteur GitHub) ou avec Git.

## Push en ligne de commande (alternative)

Depuis ce dossier, après la création du dépôt GitHub :

```bash
git remote add origin https://github.com/Koloina-Rakotomavo/studio-feed-instagram.git
git push -u origin main
```

Autre possibilité si `gh` est installé et authentifié :

```bash
gh repo create Koloina-Rakotomavo/studio-feed-instagram --public --source=. --remote=origin --push
```

## Activer GitHub Pages

1. Dans le dépôt, aller à **Settings → Pages**.
2. Sous **Build and deployment**, choisir **Deploy from a branch**.
3. Branch `main`, dossier `/ (root)`, puis **Save**.
4. Après publication, l’adresse attendue est :
   `https://koloina-rakotomavo.github.io/studio-feed-instagram/`.

Cette adresse est **prévue**, mais elle n'est pas une preuve de publication tant que Pages n'a pas été activé et vérifié.

## Activer l’import d’un profil Instagram public

Le simulateur statique fonctionne déjà pour l'import de photos locales et le réagencement. Pour charger automatiquement une grille par URL, il faut **déployer `worker.js` sur Cloudflare Workers**, renseigner en secret `APIFY_TOKEN`, et configurer un `IMPORT_PASSCODE`. Voir `README.md`. Aucun jeton secret ne doit être commité.