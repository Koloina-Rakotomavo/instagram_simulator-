# Activer Apify pour le simulateur Instagram

Site déjà publié : https://koloina-rakotomavo.github.io/instagram_simulator-/

## Étape 1 — Compte et jeton Apify

1. Ouvre https://console.apify.com/ et connecte-toi.
2. Dans **Settings / API & Integrations**, retrouve ton **API token**.
3. Consulte la consommation et les limites de dépenses de ton compte avant les essais.
4. Les Actors du projet sont :
   - https://apify.com/apify/instagram-profile-scraper (données du profil et jusqu'à 12 publications récentes)
   - https://apify.com/apify/instagram-scraper (tentative de récupération de 24 ou 36 publications)
5. Pour vérifier manuellement le premier Actor, lance-le avec l'entrée `{"usernames":["nomducompte"]}` pour un compte Instagram **public** auquel tu peux accéder. Vérifie que le résultat contient `latestPosts`.

**Important : ne colle jamais le jeton Apify dans GitHub, dans index.html, dans une issue, une capture d'écran, ni dans une conversation.**

## Étape 2 — Créer le Worker Cloudflare depuis GitHub

1. Ouvre https://dash.cloudflare.com/ → **Workers & Pages** → **Create application**.
2. Choisis **Import an existing Git repository**, puis ton repo `Koloina-Rakotomavo/instagram_simulator-`, pour un **Worker** (pas pour Pages ; le site lui-même est déjà sur GitHub Pages).
3. La racine du dépôt contient `wrangler.toml` : nom du Worker `instagram-simulator-import`, point d'entrée `worker.js`.
4. Si Cloudflare te demande une commande de déploiement, choisis `npx wrangler deploy` et la branche `main`. Confirme le déploiement du Worker.
5. Sous **Settings → Variables and Secrets → Add**, ajoute deux valeurs de type **Secret** :
   - `APIFY_TOKEN` = le jeton du compte Apify ;
   - `IMPORT_PASSCODE` = un mot de passe fort distinct du jeton Apify (que tu choisis toi-même).
6. Le paramètre public `SITE_ORIGIN = "https://koloina-rakotomavo.github.io"` est déjà présent dans `wrangler.toml`. Il ne faut pas y ajouter `/instagram_simulator-/`.
7. Valide avec **Deploy** pour rendre les secrets disponibles au Worker.

**Alternative** : si tu ne souhaites pas connecter GitHub à Cloudflare, crée un Worker dans l'éditeur Cloudflare en collant le contenu de `worker.js`, puis ajoute les mêmes secrets et la variable texte `SITE_ORIGIN`.

## Étape 3 — Vérifier la connexion, sans consommer Apify

Ouvre l'URL indiquée par Cloudflare, sous la forme :

`https://instagram-simulator-import.<ton-sous-domaine>.workers.dev/health`

La réponse attendue ressemble à :

```json
{"status":"ready","apifyConfigured":true,"accessConfigured":true}
```

Ce contrôle ne lance **aucun** Actor Apify.

## Étape 4 — Importer la grille depuis l'iPhone

1. Ouvre https://koloina-rakotomavo.github.io/instagram_simulator-/ dans Safari.
2. Déroule **Connexion Instagram**.
3. Colle l'URL de ton Worker jusqu'à `.workers.dev` (sans `/health`).
4. Entre le code `IMPORT_PASSCODE` dans **Code d'accès au service** — ce n'est **pas** ton token Apify.
5. Appuie sur **Enregistrer la connexion**, puis **Tester la connexion**.
6. En haut, colle `https://www.instagram.com/nomducompte/`, choisis 12, 24 ou 36 et touche **Importer le profil**.
7. Réorganise les publications en touchant une image, puis l'emplacement visé.

Les images de comptes publics peuvent rester indisponibles, l'import peut être partiel, et l'ordre des publications épinglées peut différer. Aucun contenu n'est publié ou déplacé sur Instagram : le simulateur travaille sur une copie locale.

## Sécurité et budget

- Les deux secrets ne doivent jamais être poussés sur GitHub.
- Le code d'accès est une protection minimale ; conserve-le privé. Configure aussi des limites de fréquence / budget dans Cloudflare et Apify.
- GitHub Pages héberge uniquement l'interface publique et ne peut pas cacher un token API.
- L'API peut générer des coûts et être temporairement limitée par Instagram / Apify.
- N'utilise le service que pour des profils publics et en respectant les autorisations et droits applicables.

Documentation officielle :
- https://docs.apify.com/api/v2
- https://developers.cloudflare.com/workers/get-started/dashboard/
- https://developers.cloudflare.com/workers/configuration/secrets/
