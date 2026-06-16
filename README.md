# Forum-Food
# 🍽️ Forum Food

> Un forum dédié à la gastronomie, permettant aux utilisateurs d'échanger
> recettes, avis et coups de cœur culinaires.

---

## 📌 Contexte & Objectif

**Forum Food** est une application web complète dédiée à la passion culinaire.
Elle permet aux utilisateurs de :

- 💬 Communiquer autour de recettes, restaurants et tendances food
- 🗂️ Associer des catégories à leurs posts (Recettes, Restaurants, Astuces...)
- 👍 Liker / Disliker des posts et commentaires
- 🔍 Filtrer les publications par catégorie, posts créés ou posts likés
- 🖼️ Partager des images de plats et recettes
- 🔔 Recevoir des notifications d'activité
- 🔐 S'authentifier de manière sécurisée (Google, GitHub, email)

Le projet inclut un système de modération complet, une gestion des rôles
utilisateurs, le tout sous protocole **HTTPS** sécurisé.

---

## Prérequis

| Élément            | Détail                          
|
| **Langage**        | Go 1.22+                        
| **Base de données**| SQLite3                     
| **Outils**         | Git, VSCode,           
| **Dépendances**    | `sqlite3`
| **Formats**        | HTML, CSS, JavaScript, SQL  , golang 

---

## Installation & Exécution

### 🔧 Cloner le dépôt

git clone https://github.com/Alexanger300/Forum-Food.git
cd forum-food

Structure du dépôt
PROJET-FORUM
│
└── Forum-Food
    │
    ├── assets
    │   └── img
    │       └── logo.jpg
    │
    ├── src
    │   ├── css
    │   │   ├── variables.css
    │   │   ├── style.css
    │   │   ├── responsive.css
    │   │   │
    │   │   ├── header-inner.css
    │   │   ├── site-logo.css
    │   │   ├── nav.css
    │   │   │
    │   │   ├── home.css
    │   │   ├── board-title.css
    │   │   ├── forum-category.css
    │   │   ├── topic-row.css
    │   │   ├── hero-post-banner.css
    │   │   ├── hero-post-footer.css
    │   │   ├── widget-body.css
    │   │   │
    │   │   ├── post-card-body.css
    │   │   ├── post-actions.css
    │   │   ├── my-posts.css
    │   │   ├── my-post-card-content.css
    │   │   │
    │   │   ├── comment-section.css
    │   │   ├── comment-item.css
    │   │   ├── comment-inputs.css
    │   │   ├── comment-input-focus.css
    │   │   │
    │   │   ├── btn-login.css
    │   │   ├── btn-edit-comment.css
    │   │   ├── delete-post.css
    │   │   ├── edit-post-btn.css
    │   │   ├── dislike-btn.css
    │   │   ├── heart-icon.css
    │   │   │
    │   │   ├── login-card.css
    │   │   ├── login-card-top.css
    │   │   ├── login-deco.css
    │   │   ├── login-alert.css
    │   │   ├── checkbox-label.css
    │   │   ├── field-wrap.css
    │   │   ├── field-toggle.css
    │   │   │
    │   │   ├── pagination.css
    │   │   ├── member-chip.css
    │   │   ├── sep-text.css
    │   │
    │   ├── html
    │   │   ├── account.html
    │   │   ├── login.html
    │   │   ├── logout.html
    │   │   ├── posts.html
    │   │   └── register.html
    │   │
    │   └── js
    │       ├── db.js
    │       ├── logout.js
    │       └── script.js
    │
    ├── .env
    ├── COOKIME.exe
    ├── index.html
    ├── main.exe
    ├── main.go
    ├── README.md
    └── server.go



Fonctions clés 

- La fonction createPost() — enregistrer une nouvelle publication dans la base de données.
Elle est appelée lorsque l’utilisateur soumet un post depuis le formulaire.
Elle sert a envoier les données d’un post (titre, contenu, auteur, catégorie, image, date…) vers Supabase.

- createComment() — Ajoute un commentaire
Cette fonction permet d’ajouter un nouveau commentaire sous un post.
Elle est appelée lorsque l’utilisateur écrit un message dans la zone de commentaire et clique sur “Envoyer”.

- toggleLike() — Gestion des likes
Cette fonction permet à un utilisateur d’aimer ou de retirer son like sur un post.
Elle agit comme un interrupteur : 
    si l’utilisateur a déjà liké → le like est supprimé
    sinon → un like est ajouté

Architecture & compromis techniques
Le projet adopte une architecture modulaire séparant clairement :

la logique métier (gestion des posts, commentaires, likes, authentification) , l’interface utilisateur (HTML/CSS/JS) , le backend en go pour servir les pages et gérer les routes
Supabase pour l’authentification, la base de données et le stockage des images
Le choix de Go garantit des performances élevées, une gestion simple des routes HTTP et une bonne stabilité.
L’utilisation de Supabase simplifie l’authentification et la persistance des données, mais impose une dépendance à un service externe.


Qualité & fonctionnalités principales
Le site propose plusieurs fonctionnalités permettant une expérience fluide :

    Publications de posts
Les utilisateurs peuvent créer des posts contenant :

un titre
un contenu
une catégorie
une image uploadée via Supabase Storage
Les posts sont affichés dans un fil dynamique, triés du plus récent au plus ancien.

🔐 Authentification
Le système d’authentification repose sur Supabase Auth :
création de compte
connexion
déconnexion
gestion du profil utilisateur

💬 Commentaires
Chaque post possède une section de commentaires :
ouverture/fermeture via un bouton
chargement dynamique des commentaires
ajout de nouveaux commentaires
affichage de l’auteur et de la date

     Likes
Les utilisateurs peuvent liker un post.
Le système fonctionne comme un interrupteur :
like si l’utilisateur n’a pas encore liké
compteur mis à jour automatiquement

-  Limites connues & pistes d’amélioration
Certaines limites sont identifiées dans cette version :

Pas de vérification anti-spam pour les commentaires
Pas de pagination pour les posts
Pas encore de mode sombre
Pas de système de notifications (likes, réponses, etc.)

 - Améliorations possibles
    Plusieurs évolutions peuvent enrichir le projet :
    Ajout d’un mode sombre / clair
    Mise en place d’un système de favoris
    Ajout d’un système de notifications
    Ajout d’un système de rôles (admin, modérateur)
    Sécurisation renforcée des URLs et des accès backend
    Ajout d’un éditeur riche pour les posts 
    Mise en place d’un système de recherche par mots-clés ou catégories

👥 Crédits & licence
Développé par :
Humbert Chloé , Chochon Elsa , Fatoux-Della Posta Alexandre
