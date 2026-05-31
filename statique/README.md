# 🔥 DEPLOY SOUVERAIN (STANDALONE ARCHITECTURE)

Ce dossier `/statique` a été entièrement configuré à la main, **sans aucun outil de build (zéro Vite, zéro npm, zéro webpack), sans TypeScript et sans aucun serveur Node.js distant**.

Il s'ouvre, se modifie et s'exécute directement sur n'importe quel ordinateur portable ou Chromebook (même avec 4 Go de RAM), même en étant 100% déconnecté d'Internet.

---

## 🛠️ Comment l'utiliser localement ?

1. Copiez les fichiers de ce dossier `/statique` et placez-les sur votre Chromebook, dans un dossier de votre choix :
   - `index.html`
   - `forgeron.js`
   - `sentinel.js`
   - `bridge.js`
   - `worker.js`
   - `sw.js`
   - `manifest.json`
2. **Double-cliquez sur `index.html`** pour l'ouvrir dans Chrome ou n'importe quel navigateur autonome.
3. Le Globe 3D géodésique se mettra à tourner en s'appuyant directement sur le processeur graphique à l'aide de formules mathématiques pures (Canvas 2D), et l'indexeur démarrera directement via l'API locale sécurisée IndexedDB.

---

## 🌎 Comment le déployer sur GitHub Pages (Gratuit et Rapide) ?

Puisque l'application n'utilise **aucun serveur de backend**, elle est éligible pour l'hébergement gratuit sur GitHub Pages :

1. Créez un dépôt GitHub vide (nommé par exemple `sentinel-forgeron`).
2. Déposez-y directement les fichiers listés ci-dessus (ne mettez pas de fichiers `package.json` ou de configuration build, juste ces fichiers nus).
3. Allez dans les paramètres du dépôt sous **Settings** ➔ **Pages**.
4. Sous **Build and deployment**, sélectionnez la branche `main` (ou `master`) et le dossier `/ (root)` comme source, puis cliquez sur **Save**.
5. GitHub vous fournit une URL sécurisée (par exemple : `https://compte.github.io/sentinel-forgeron/`) où votre jumeau numérique tournera à vie, sans jamais nécessiter d'abonnement ni de serveur intermédiaire.

---

## 🔬 Détails de la Technologie Souveraine

*   **Rendu 3D sans Three.js (sentinel.js) :** Le globe n'utilise aucun moteur 3D tiers ou CDN instable. Un algorithme de calcul matriciel et de projection gère le rendu de la sphère et des arcs de tension en temps-réel à l'aide du Canvas HTML5 standard.
*   **Parasitisme Actif Public (forgeron.js) :** Les relevés de séismes (USGS) et les tempêtes solaires (NOAA) sont scrapés à la volée depuis le navigateur. Si le blocage réseau (CORS) s'active, un redirecteur transparent (AllOrigins) gère le flux sans qu'aucune clé API ou secret d'authentification ne soit exposé.
*   **AGI Symbolique & Copie des Chemins :** Après avoir indexé un dossier (en utilisant l'API browser moderne `showDirectoryPicker`), vous pouvez lier des concepts sémantiques ou mots de code à des fichiers réels. La copie automatique du chemin vers le presse-papiers est instantanée pour l'insertion dans vos terminaux locaux.
*   **Progressive Web App (sw.js & manifest.json) :** Vos fichiers sont instantanément mis en cache par un Service Worker. Dès que vous avez ouvert la page une première fois, l'application fonctionne parfaitement au milieu de l'océan, sans réseau.
