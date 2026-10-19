# Simulateur Instagram — Studio Feed (mobile)

**Site publié :** https://koloina-rakotomavo.github.io/instagram_simulator-/

L’application permet de composer et réorganiser sur iPhone une grille de publications Instagram **sans modifier le vrai compte Instagram**.

## Fonctions disponibles

- Importer plusieurs photos depuis l'appareil.
- Déplacer une publication en touchant une image, puis sa destination, ou avec les flèches.
- Modifier le pseudo, la bio, les statistiques, la photo de profil et les stories à la une.
- Sauvegarder / rouvrir un projet JSON ; annuler des modifications.
- Importer un JSON de publications existant.
- Prévisualiser la grille des profils Instagram **publics** depuis leur URL, **à condition d'activer le service Apify/Cloudflare**.

## Import JSON avec récupération automatique des photos

1. Télécharge le JSON d'un compte Instagram **public** depuis Apify une seule fois.
2. Dans le simulateur, clique sur **Importer JSON Instagram**.
3. L'option **Récupérer les miniatures automatiquement** est cochée par défaut. Le site essaie d'importer les fichiers image via un service tiers gratuit ([wsrv.nl](https://wsrv.nl/)), sans clé ni compte Cloudflare. Tu peux décocher l'option si tu ne veux pas lui transmettre les URL d'images publiques.
4. Quand les photos ont pu être téléchargées, elles sont converties en données locales et incluses dans **Enregistrer le projet**. Tu peux réorganiser ta grille sur iPhone puis la rouvrir plus tard.

**Limites importantes :** le service d'images gratuit peut refuser les CDN Instagram, qui peuvent eux-mêmes rejeter l'accès ou révoquer un lien avant sa date d'expiration. L'option ne peut donc pas garantir 100 % des images. Les photos qu'il n'a pas pu télécharger peuvent parfois rester visibles via le proxy, mais elles ne sont pas enregistrées localement. Les images ne sont pas transférées vers GitHub. L'import automatique depuis une simple URL de profil reste une fonctionnalité différente, qui nécessite le Worker Cloudflare et un accès Apify.

## Activer l'import par URL Instagram

Le site est déjà publié sur GitHub Pages. Le service d'import n'est pas inclus dans cet hébergement statique.

**[Guide complet d'installation Apify et Cloudflare](SETUP_APIFY.md)**

Fichiers :
- `index.html` : page iPhone et interface d'import.
- `worker.js` : passerelle sécurisée entre la page et Apify.
- `wrangler.toml` : configuration Cloudflare Workers (sans secret).
- `SETUP_APIFY.md` : procédure et vérification.
- `test_worker.mjs` et `smoke_test.py` : tests.

Deux Actors Apify sont utilisés : `apify/instagram-profile-scraper` pour le profil et les 12 publications récentes ; `apify/instagram-scraper` en complément pour 24 ou 36 publications.

### Après le déploiement du Worker

Dans le simulateur : **Connexion Instagram** → URL du Worker → code d'accès → **Enregistrer la connexion** → **Tester la connexion**. Un test réussi signifie que les secrets sont présents, mais ne garantit pas que chaque compte Instagram pourra être récupéré. Ensuite, colle l'URL d'un profil public en haut de page et importe sa grille.

## Sécurité et limites

- **Ne jamais commiter ou partager le jeton Apify** : il doit rester dans les **Secrets** Cloudflare, pas dans le HTML ni dans ce dépôt.
- Le code d'accès au Worker doit également rester confidentiel. Configure des limites de dépenses et d'utilisation pour éviter les frais non souhaités.
- Instagram peut limiter l'accès, supprimer ou faire expirer les liens des images ; des publications peuvent manquer ou arriver dans un ordre différent de la grille réelle.
- La simulation ne publie pas sur Instagram et ne permet pas de consulter des comptes privés.
- Respecte les droits sur les images et les conditions d'utilisation applicables.

## Déploiement de la page

GitHub Pages est configuré sur `main` à la racine du dépôt. Le statut du déploiement se vérifie dans **Actions** et **Settings → Pages**.
