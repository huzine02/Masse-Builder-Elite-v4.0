# 🧠 CONCEPT.md - Masse Builder Elite

Ce document sert de "Cerveau" au projet. Il définit la philosophie, les contraintes techniques immuables et les **Prompts Maîtres** à utiliser pour garantir que l'IA génère toujours du code parfaitement aligné avec les besoins d'un pratiquant de 44 ans.

---

## 1. Vision & Philosophie (Le "Pourquoi")

**Cible :** Homme, 44 ans, niveau intermédiaire/avancé.
**Objectif :** Recomposition corporelle, hypertrophie, longévité.

### Piliers Fondamentaux :
1.  **Surcharge Progressive (S-1) :** L'application ne sert pas juste à noter, elle sert à *battre* la séance précédente. L'UI doit mettre en évidence les chiffres de la semaine passée (S-1) pour stimuler la compétition contre soi-même.
2.  **Friction Zéro :** À la salle, pas de temps à perdre. L'interface doit être sombre (économie batterie + ambiance), gros boutons (doigts transpirants), et ultra-rapide (pas de chargement serveur).
3.  **Sécurité & Longévité (McGill) :** À 40+ ans, le dos est la priorité. Le protocole McGill (Big 3) n'est pas optionnel, c'est un pré-requis bloquant ou fortement incitatif dans l'UX.
4.  **Récupération Thermique :** Intégration du suivi Sauna/Froid comme partie intégrante de l'entraînement, pas comme un bonus.

---

## 2. Objectifs Techniques (Le "Comment")

*   **Offline First :** L'app doit fonctionner en mode avion au fond d'un sous-sol. (LocalStorage + Service Workers).
*   **Architecture "Monolithique Simplifiée" :** Pour l'instant, tout le code critique réside dans `index.tsx` pour faciliter le copier-coller vers des environnements de dev rapides (Replit, Bolt, etc.), bien que la structure de fichiers (`types.ts`, `constants.ts`) existe pour la scalabilité future.
*   **Performance Absolue :** Pas de re-renders inutiles. Utilisation de `useMemo` et `useCallback` critique.
*   **Tech Stack :** React 18+, TailwindCSS (via CDN ou build), Vite.

---

## 3. 🤖 Prompts Maîtres (La "Commande")

Utilisez ces prompts pour initialiser une session avec une IA (ChatGPT, Claude, Gemini) afin qu'elle comprenne immédiatement le contexte sans casser l'existant.

### ➤ Prompt d'Initialisation (À copier au début d'une nouvelle session)
> "Tu agis en tant que Senior Frontend Engineer et Coach Sportif expert en hypertrophie pour les athlètes de 40 ans+.
>
> **Contexte du Projet :**
> Je développe 'Masse Builder Elite', une webapp React (Single File Component actuel) pour le suivi de musculation.
>
> **Règles d'Or (Tech) :**
> 1. Stack : React, TailwindCSS, LocalStorage, Vite.
> 2. Pas de Backend : Tout est stocké dans le navigateur.
> 3. Design : Dark Mode obligatoire, UI 'Oversized' pour usage mobile facile.
> 4. Ne jamais supprimer la logique de 'WakeLock' ou de 'Comparaison S-1'.
>
> **Règles d'Or (Métier) :**
> 1. L'utilisateur a 44 ans : Priorité à la sécurité (McGill) et à la récupération.
> 2. L'objectif est la surcharge progressive : L'UI doit toujours comparer la série actuelle à la semaine précédente.
>
> Garde ce contexte en mémoire pour toutes tes futures réponses. Si je te demande une modification, vérifie d'abord qu'elle ne viole pas ces règles."

### ➤ Prompt pour Nouvelle Fonctionnalité (Feature Request)
> "J'ai besoin d'ajouter [NOM DE LA FONCTIONNALITÉ].
>
> **Contraintes :**
> 1. Cela doit tenir dans la logique `index.tsx` actuelle.
> 2. Cela ne doit pas alourdir l'interface principale (l'écran de saisie des reps doit rester épuré).
> 3. Si cela nécessite des données, ajoute-les à l'interface `WorkoutSession` ou `ProgressData` et gère la rétro-compatibilité du `localStorage`.
>
> Propose-moi d'abord la spécification UI/UX, puis le code."

### ➤ Prompt pour Debugging
> "J'ai une erreur [DESCRIPTION ERREUR].
> Analyser le fichier `index.tsx`. Ne réécris pas tout le fichier. Donne-moi uniquement la fonction ou le `useEffect` à corriger, ou le bloc XML `<changes>` si tu as accès aux fichiers. Vérifie que la correction ne casse pas la persistance des données dans le LocalStorage."

---

## 4. Roadmap (Le "Futur")

1.  **Graphiques d'évolution :** Visualiser la progression des charges sur 3 mois (Tab 'Progression').
2.  **Export CSV :** Pour analyse excel plus poussée.
3.  **Mode "Délestage" (Deload) :** Une option pour réduire automatiquement les charges de 50% sur une semaine spécifique.
4.  **Chronomètre de Reps (TUT) :** Un métronome visuel pour respecter le tempo (ex: 3-0-1-0).

---

## 5. Règles Fonctionnelles (Business Logic)

### A. Auto-Navigation Intelligente (Date & Semaine)
Le système doit savoir où l'utilisateur en est.
*   **Règle :** Au chargement de la page (`window.onload`) :
    1.  Détecter le jour actuel (`new Date().getDay()`).
    2.  Ouvrir automatiquement l'onglet correspondant (1=Lundi, 3=Mercredi, 5=Vendredi). Si on est Mardi/Jeudi/Sam/Dim, ouvrir l'onglet "Suivi" ou le jour d'entraînement suivant.
*   **Calcul de Semaine :** Si une "Date de début" est stockée, calculer automatiquement : `Math.ceil((DateActuelle - DateDébut) / 7 jours)`. Si aucune date, demander "C'est ta première séance ?" et stocker la date.

### B. Pré-remplissage & Progression (Le "Ghost Mode")
L'utilisateur ne doit pas deviner ses charges.
*   **Règle "Placeholder Actif" :**
    1.  Pour chaque exercice, le système doit chercher la valeur de la semaine précédente (S-1).
*   **Affichage :**
    1.  Mettre cette valeur (ex: "80kg") directement dans le placeholder de l'input.
    2.  Option "Auto-Fill" : Si l'utilisateur clique sur une icône "Répéter" à côté de l'input, la valeur S-1 se copie dans la case S-Actuelle.
*   **Feedback Immédiat :**
    1.  Si la valeur saisie > placeholder => Bordure Verte + Petite animation.

### C. Gestion Robuste des Vidéos (Le Fix YouTube)
Les iframes ne chargent pas les liens classiques `watch?v=`.
*   **Règle Technique :**
    1.  L'algorithme doit extraire uniquement l'ID de la vidéo (ex: `dQw4w9WgXcQ`).
    2.  Il doit reconstruire l'URL d'intégration forcée : `https://www.youtube.com/embed/[ID_VIDEO]?rel=0&modestbranding=1`.
    3.  Empêcher le chargement de toutes les iframes au démarrage (trop lourd). Charger l'iframe uniquement au clic sur le bouton "🎥 Démo" (Lazy Loading).

### D. Workflow de Séries (Attitude entre séries)
*   **Règle :**
    1.  Dès qu'un input est rempli (ex: "12 reps"), le Timer de Repos doit se lancer automatiquement (ou proposer de se lancer). Pas de clic superflu.

---

## 6. FEEDBACK UTILISATEUR & NOUVELLES FONCTIONNALITÉS (V4.1+)

Voici le Journal de bord mental de l'utilisateur et ce qui a manqué/frustré pour que la séance soit vraiment parfaite.

### PHASE 1 : LE LANCEMENT (Le "Cold Start")
*   **La frustration :** "C'est quel jour déjà ? On est la semaine 3 ou 4 ? J'ai fait quoi la dernière fois ?" Je dois réfléchir, cliquer sur "Semaine", chercher... Ça me refroidit.
*   **AMÉLIORATION N°1 : Le "Dashboard Intelligent"**
    *   Dès l'ouverture, je ne veux pas voir le menu complet. Je veux voir un écran d'accueil qui me dit : "Salut Alex. On est Lundi, Semaine 3. Objectif du jour : Battre tes 24kg au Incliné."
    *   Un gros bouton : [COMMENCER LA SÉANCE].
    *   **Pourquoi ?** Ça me conditionne mentalement. Je sais pourquoi je suis là.

### PHASE 2 : L'EXÉCUTION (Le "Grind")
*   **La frustration :** L'intensité réelle (RPE) : J'ai noté "10 reps", mais est-ce que c'était facile ou est-ce que j'ai failli mourir ? Si je ne le note pas, la semaine prochaine, je ne saurai pas si je dois augmenter. Le Tempo : J'ai fait mes reps un peu vite pour m'en débarrasser.
*   **AMÉLIORATION N°2 : Le "Selecteur RPE" (Intensité)**
    *   À côté de l'input des reps, je veux 3 petits boutons de couleur (Vert/Orange/Rouge) ou une note sur 10 (RPE).
        *   🟢 Facile (J'en avais 3 en réserve).
        *   🟠 Dur (J'en avais 1 en réserve).
        *   🔴 Échec (Impossible d'en faire une de plus).
    *   **Pourquoi ?** La semaine prochaine, l'appli pourra me dire : "La dernière fois c'était Facile, aujourd'hui tu DOIS augmenter."
*   **AMÉLIORATION N°3 : Le "Métronome Visuel" (Tempo)**
    *   Sous le titre de l'exercice, une petite animation ou une barre qui se remplit en 3 secondes (Descente) et 1 seconde (Montée). Juste un guide visuel qui pulse.
    *   **Pourquoi ?** Ça me force à ralentir. C'est là que le muscle se construit.

### PHASE 3 : LE TEMPS DE REPOS (Le "Piège à TikTok")
*   **La frustration :** Je vois "01:29... 01:28...". C'est ennuyeux. Je switch sur Instagram "juste pour voir". 4 minutes passent. Je suis froid.
*   **AMÉLIORATION N°4 : Le "Black Screen of Focus"**
    *   Quand le timer se lance, l'écran doit changer radicalement.
    *   Fond noir total. Gros texte blanc : "LÂCHE CE TÉLÉPHONE".
    *   Consigne active : "Marche. Respire par le ventre. Visualise la prochaine série."
    *   **Pourquoi ?** L'appli doit être mon garde-fou.

### PHASE 4 : LA PROGRESSION (Le "Doute")
*   **La frustration :** "Attends, est-ce que je progresse vraiment ?" J'ai l'impression de faire la même chose depuis 3 semaines.
*   **AMÉLIORATION N°5 : Le "Micro-Loading" (Les petits pas)**
    *   Si l'appli voit que j'ai fait la même perf que la semaine dernière, elle doit me suggérer une surcharge autre que le poids.
    *   Message pop-up : "Tu as fait le même poids ? Ok, alors essaie de faire 11 reps au lieu de 10 cette fois-ci." ou "Réduis le repos de 15 secondes."
    *   **Pourquoi ?** Pour l'hypertrophie naturelle à 40 ans, il faut toujours une surcharge, même minime.

### PHASE 5 : LA FIN (La "Récompense")
*   **La frustration :** Je clique sur "Finir la séance". L'appli se ferme. C'est tout ? C'est décevant.
*   **AMÉLIORATION N°6 : L'Écran de Victoire (Dopamine)**
    *   Je veux un écran de fin qui récapitule : "Volume total soulevé : 4.2 Tonnes (+5% vs semaine dernière) 🚀", "Exercice le plus fort : Incliné".
    *   Et surtout : Le rappel du protocole Thermique. "Maintenant : 10min Sauna, 3min Froid. Go."

### RÉSUMÉ POUR LE DÉVELOPPEUR
1.  **L'Accueil Contextuel :** Ouvre direct sur le bon jour avec l'objectif précis à battre.
2.  **La Saisie RPE :** Je dois pouvoir dire si c'était "Facile" ou "Mortel".
3.  **Le Mode "Anti-Distraction" pendant le repos :** Un écran qui m'engueule gentiment si je reste inactif.
4.  **Le Feedback de fin :** Donne-moi une raison d'être fier de ma séance (Stats de progression immédiates).