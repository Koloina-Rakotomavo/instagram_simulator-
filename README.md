# Studio Feed Instagram — iPhone + import d’un profil public

## Contenu

- `index.html` : simulateur autonome à ouvrir sur un ordinateur ou un téléphone, à héberger sur **GitHub Pages** pour obtenir un lien partageable.
- `worker.js` : service Cloudflare Worker optionnel qui consulte les publications publiques via **Apify** sans exposer la clé Apify dans le navigateur.

Le simulateur **fonctionne déjà sans serveur** pour importer des images locales, déplacer les publications, éditer la bio/le profil/les stories, annuler un déplacement, ouvrir et enregistrer un projet JSON. Il ne publie rien sur Instagram.

**L’import automatique à partir d’une URL Instagram publique nécessite d’abord de configurer un Worker et une clé Apify.** Un site statique seul ne peut pas accéder de façon fiable à la grille complète d’un compte Instagram : contrôles d’accès, CORS et limites d’API. Il ne peut pas accéder à un compte privé. Le service tiers peut être payant, limité, temporairement indisponible, ou soumis aux conditions d’utilisation applicables.

## A — Tester tout de suite le simulateur sur iPhone

1. Ouvrez `index.html` sur ordinateur ou après l’avoir téléchargé sur votre iPhone (pour un usage stable, voir GitHub Pages plus bas).
2. Appuyez sur **Ajouter mes visuels**.
3. Touchez une miniature, puis une autre case pour déplacer la publication. Les boutons **←** et **→** font avancer/reculer d’une case.
4. Appuyez sur **Partager / Fichiers** ou **Enregistrer le projet** pour récupérer un JSON contenant les images locales.
5. Plus tard, **Ouvrir un projet** permet de restaurer cette composition.

> Les couvertures des Reels et carrousels importés sont des images. Le simulateur ne lit pas la vidéo et ne réorganise pas le vrai profil sur Instagram.

## B — Activer l’import depuis une URL Instagram

### 1. Compte Apify

- Créer un compte sur https://console.apify.com/ et consulter l’utilisation et les tarifs. Une consommation peut être facturée.
- Générer une clé API secrète dans **API & Integrations**.
- Le Worker utilise ces deux acteurs gérés par Apify :
  - `apify/instagram-profile-scraper` pour la bio, le profil et jusqu’à 12 dernières publications.
  - `apify/instagram-scraper` pour tenter jusqu’à 24 ou 36 publications.
- L’acteur peut échouer ou renvoyer moins de publications que demandé si Instagram limite son accès.

### 2. Créer le Cloudflare Worker

1. Aller à https://dash.cloudflare.com/ → **Workers & Pages** → créer un Worker.
2. Dans son éditeur, remplacer le code par le contenu **complet** de `worker.js`, puis **Deploy**.
3. Dans **Settings → Variables and Secrets**, définir :
   - `APIFY_TOKEN` en **Secret** : votre jeton Apify. Ne jamais le copier dans `index.html` ni sur GitHub.
   - `IMPORT_PASSCODE` en **Secret** : un mot de passe long de votre choix pour restreindre les appels (distinct du jeton Apify).
   - `SITE_ORIGIN` (optionnel, **fortement conseillé après publication**) : origine exacte de votre GitHub Pages, par exemple `https://votre-pseudo.github.io` ; ne mettez pas le chemin du dépôt.
4. Déployer les modifications et tester `https://nom-du-worker.votrecompte.workers.dev/health` : réponse JSON avec `status: ready`, `apifyConfigured: true`, `accessConfigured: true`.
5. Dans le simulateur, ouvrir **Connexion Instagram**, coller l’URL du Worker (sans `/health`), entrer le `IMPORT_PASSCODE` dans « Code d’accès », puis appuyer sur **Enregistrer la connexion**.
6. En haut, coller un **lien de profil** du type `https://www.instagram.com/nomducompte/`, choisir 12/24/36, puis appuyer sur **Importer le profil**.

Le mot de passe d’accès est conservé pour la session dans le navigateur ; l’adresse du Worker est gardée sur cet appareil. **Ne jamais placer `APIFY_TOKEN` dans la page HTML publique.** Pour éviter des coûts excessifs, activer aussi les protections Cloudflare appropriées (limites de débit, contrôle d’accès, supervision de consommation) : le simple code d’accès est une protection basique, pas une authentification robuste.

**Attention :** avec `SITE_ORIGIN` verrouillé sur GitHub Pages, l’import ne fonctionne que depuis ce site autorisé, pas depuis un fichier `file://` local. Le code d’origine envoyé par certains navigateurs peut être `null` pour les fichiers locaux.

### 3. Mise en ligne gratuite de la page

1. Créer un dépôt GitHub dédié, par exemple `studio-feed-instagram`, et y ajouter **`index.html` à la racine**. `worker.js` peut rester sur votre ordinateur ou dans le dépôt, **sans les secrets**.
2. Dans le dépôt, **Settings → Pages → Build and deployment → Deploy from a branch**, sélectionner `main` et le dossier `/ (root)` puis enregistrer.
3. Une fois la publication terminée, GitHub Pages affiche une adresse ressemblant à `https://votre-pseudo.github.io/studio-feed-instagram/` (exemple seulement, **pas un lien déjà créé**).
4. Ouvrir cette adresse dans Safari sur iPhone. En option, menu de partage Safari → **Sur l’écran d’accueil**.

Le code fourni ici n’a pas été déployé automatiquement sur votre compte. L’adresse publique n’existe qu’une fois les étapes GitHub Pages faites.

## C — Mode alternatif sans Worker

Vous pouvez toujours importer vos propres images, ou utiliser **Importer JSON Instagram** si vous avez déjà exporté les données d’un profil via un outil autorisé. Le JSON doit être soit un objet de profil (`username`, `biography`, `followersCount`, `followsCount`, `latestPosts`), soit une liste de publications comportant `displayUrl`/`imageUrl`. Les URL distantes peuvent **expirer**. Pour sauvegarder durablement les images Instagram, privilégiez l’import depuis le Worker qui tente de les convertir localement.

## D — Remarques utiles

- Le nombre de « publications visibles » est la taille de la grille affichée dans le simulateur, pas le nombre total de publications réelles du compte.
- La grille affiche une **photographie approximative** des publications accessibles. Instagram peut épingler certaines publications ou modifier son ordre d’affichage : l’import ne garantit pas une copie identique pour tous les comptes.
- Ne pas traiter les profils privés, ne pas contourner les protections d’accès et respecter les droits d’auteur / conditions d’utilisation.
- Les images importées avec `input[type=file]` sont ramenées à une résolution maximale de 900 px pour contenir la taille du fichier de projet. Une sauvegarde avec beaucoup d’images reste volumineuse.
- Le format du projet est `version: 2`. Les anciens projets `version: 1` issus du simulateur iPhone sont acceptés.

## Documentation des services

- Apify — Profile Scraper : https://apify.com/apify/instagram-profile-scraper
- Apify — Instagram Scraper : https://apify.com/apify/instagram-scraper
- Apify — Run Actor and retrieve data : https://docs.apify.com/academy/api/run-actor-and-retrieve-data-via-api
- Cloudflare — Workers : https://developers.cloudflare.com/workers/
- GitHub — GitHub Pages : https://docs.github.com/en/pages