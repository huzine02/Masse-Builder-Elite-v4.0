# 🗺️ Architecture du Projet - Masse Builder Elite

Ce document détaille la structure des fichiers de l'application et leur rôle respectif dans le fonctionnement global.

## 🟢 Point d'Entrée & Cœur de l'Application

### `index.html`
Le squelette de la page web.
- Charge les styles globaux (TailwindCSS via CDN, Polices Google).
- Définit les méta-données pour le mobile (viewport, overscroll).
- Contient la balise `<div id="root"></div>` où React s'injecte.
- **Role clé** : Importe le module JavaScript principal (`index.tsx`).

### `1-CODE/index.tsx`
Le cerveau actuel de l'application (Architecture Monolithique).
- Contient **toute la logique** : State management, Timer, Calculs, Composants UI.
- Gère le rendu final via `ReactDOM.createRoot`.
- **Note** : Situé dans le dossier `1-CODE`, c'est le moteur de l'application.

## 🟡 Architecture Modulaire (Fichiers de Structure)
*Situés dans `1-CODE/`, ces fichiers sont présents pour une structure plus propre.*

### `1-CODE/App.tsx`
Le composant React principal isolé.

### `1-CODE/types.ts`
Dictionnaire des définitions TypeScript.

### `1-CODE/constants.ts`
Base de données statique.

## ⚙️ Configuration & Build

### `vite.config.ts`
Configuration du bundler Vite.
- Gère la compilation du TypeScript vers le JavaScript.
- Configure le chemin de base (`base: './'`) pour que l'app fonctionne sur GitHub Pages.

### `tsconfig.json`
Configuration du compilateur TypeScript.
- Définit les règles de rigueur du code (Strict Mode).
- Configure la transpilation JSX pour React.

### `package.json`
Carte d'identité du projet Node.js.
- Liste les dépendances (React, React-DOM, TypeScript, Vite).
- Définit les scripts de commande (`npm run dev`, `npm run build`).

### `metadata.json`
Configuration spécifique pour l'environnement de développement (type Replit/Bolt).
- Liste les permissions requises (Camera, Microphone) pour les fonctionnalités avancées.

## 🚀 Déploiement & PWA

### `.github/workflows/deploy.yml`
Script d'automatisation (CI/CD).
- Déclenche une action à chaque modification sur la branche `main`.
- Compile le projet et le déploie automatiquement sur GitHub Pages.

### `public/manifest.json`
Configuration Progressive Web App (PWA).
- Permet à l'application d'être installée sur l'écran d'accueil d'un smartphone.
- Définit le nom, les icônes et les couleurs du thème.

### `README.md`
Documentation utilisateur.
- Explique comment installer et utiliser l'application.
- Liste les fonctionnalités principales (S-1, Timer, Calculateur).
