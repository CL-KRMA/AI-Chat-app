# AI-Chat App

Application de chat IA full-stack construite avec Next.js, intégrant trois modèles Ollama (llama3, llava, gemma4) avec un pipeline CI/CD complet et un déploiement GitOps automatisé sur Kubernetes.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Routes API](#routes-api)
- [Tests](#tests)
- [Pipeline CI/CD](#pipeline-cicd)
- [Dockerfile](#dockerfile)
- [Structure du projet](#structure-du-projet)
- [Repos liés](#repos-liés)

## 🎯 Vue d'ensemble

AI-Chat est une plateforme de chat IA self-hosted qui permet d'interagir avec trois modèles différents via une interface web. L'application communique avec un serveur Ollama déployé sur Kubernetes pour l'inférence des modèles.

**Modèles disponibles :**

| Modèle | Capacités | Route |
|---|---|---|
| `llama3:8b` | Génération de texte | `/llama` |
| `llava:7b` | Texte + analyse d'images + audio | `/llava` |
| `gemma4:12b` | Texte + image + audio + vidéo | `/gemma` |

## 🏗️ Architecture

```
Utilisateur
    │
    ▼
Next.js Frontend (port 3000)
    │
    ├── /llama  → POST /api/llama  → Ollama (llama3:8b)
    ├── /llava  → POST /api/llava  → Ollama (llava:7b)
    └── /gemma  → POST /api/gemma  → Ollama (gemma4:12b)
                          │
                          ▼
              http://ollama:11434/api/generate
              (Service Kubernetes interne)
```

**Stack technique :**
- **Frontend** : Next.js 16 (App Router, TypeScript)
- **Styling** : Tailwind CSS
- **Tests** : Jest + ts-jest (23 tests unitaires)
- **CI/CD** : GitHub Actions
- **Registry** : GitHub Container Registry (GHCR)
- **Déploiement** : Kubernetes (K3s) via ArgoCD GitOps
- **Sécurité** : Trivy scan bloquant sur CRITICAL/HIGH

## 📦 Prérequis

- **Node.js** >= 20
- **npm** >= 10
- **Docker** (pour le build de l'image)
- **Ollama** accessible sur `http://ollama:11434` (ou configurer `OLLAMA_API_URL`)

## 🚀 Installation

### 1. Cloner le repo

```bash
git clone https://github.com/CL-KRMA/AI-Chat-app
cd AI-Chat-app/AI-Chat
```

### 2. Installer les dépendances

```bash
npm ci
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
# Éditer .env.local avec tes valeurs
```

### 4. Lancer en développement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

### 5. Lancer avec Docker Compose (recommandé)

```bash
# À la racine du repo
docker-compose up
```

Démarre l'application Next.js et Ollama ensemble.

## ⚙️ Variables d'environnement

| Variable | Valeur par défaut | Description |
|---|---|---|
| `OLLAMA_API_URL` | `http://ollama:11434` | URL du serveur Ollama |
| `NODE_ENV` | `development` | Environnement Node.js |

> En développement local, remplace `OLLAMA_API_URL` par `http://localhost:11434` si Ollama tourne sur ta machine.

## 🔌 Routes API

### POST `/api/llama`

Génération de texte avec **llama3:8b**.

**Body :**
```json
{
  "prompt": "Explique Kubernetes en 3 lignes"
}
```

**Réponse :**
```json
{
  "response": "Kubernetes est un orchestrateur de conteneurs..."
}
```

**Codes de retour :**
- `200` — réponse générée avec succès
- `400` — prompt manquant
- `500` — erreur Ollama ou réseau

---

### POST `/api/llava`

Analyse texte + image + audio avec **llava:7b**.

**Body :**
```json
{
  "prompt": "Décris cette image",
  "image": "<base64>",
  "audio": "<base64>"
}
```

> `prompt`, `image` et `audio` sont optionnels mais au moins un est requis. Si `prompt` est absent, utilise `"Analyze this content"` par défaut.

**Codes de retour :**
- `200` — réponse générée
- `400` — prompt, image et audio tous absents
- `500` — erreur Ollama ou réseau

---

### POST `/api/gemma`

Analyse multimodale avec **gemma4:12b** — texte, image, audio et vidéo.

**Body :**
```json
{
  "prompt": "Analyse ce contenu",
  "image": "<base64>",
  "audio": "<base64>",
  "video": "<base64>"
}
```

> Au moins un champ requis. Si `prompt` est absent, utilise `"Analyze this content"` par défaut.

**Codes de retour :**
- `200` — réponse générée
- `400` — tous les champs absents
- `500` — erreur Ollama ou réseau

---

### POST `/api/chat`

Route générique utilisant **llava:7b** — alias pour `/api/llava`.

## 🧪 Tests

Les tests unitaires mockent `fetch` vers Ollama — aucune instance Ollama nécessaire pour les faire tourner.

```bash
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch
```

**Résultat attendu :**
```
PASS  test/api.test.ts
  POST /api/llama    ✓ 6 tests
  POST /api/llava    ✓ 8 tests
  POST /api/gemma    ✓ 9 tests

Tests: 23 passed, 23 total
```

**Ce que les tests valident :**
- Réponse correcte avec un input valide
- Code `400` si les champs requis sont absents
- Code `500` si Ollama répond avec une erreur
- Code `500` si erreur réseau (fetch throw)
- Bon modèle appelé dans le body de la requête (`llama3:8b`, `llava:7b`, `gemma4:12b`)
- Trim de la réponse Ollama
- Médias (image, audio, video) transmis ou ignorés correctement

## 🔄 Pipeline CI/CD

Le pipeline GitHub Actions se déclenche à chaque push sur `main` :

```
push main
  │
  ├── lint (ESLint) ──────────────────────┐
  │                                        ├── build (Docker)
  ├── tests (Jest 23 tests) ──────────────┘       │
  │                                               ▼
  │                                       security (Trivy scan)
  │                                               │
  │                                      si scan OK → promote :latest
  │                                               │
  └───────────────────────────────────────────────▼
                                          update-infra (GitOps)
                                          → mise à jour frontend.yaml
                                          → ArgoCD déploie sur K3s
```

**Fonctionnalités du pipeline :**
- Cache npm (`setup-node`) — builds lint/tests plus rapides
- Cache Docker (`type=gha`) — rebuilds plus rapides
- Trivy bloquant sur `CRITICAL,HIGH` — aucune image vulnérable ne passe
- `latest` promu uniquement après validation du scan
- Notification Slack en cas d'échec
- Mise à jour automatique du tag dans [AI-Chat-gitops](https://github.com/CL-KRMA/AI-Chat-gitops)

## 🐳 Dockerfile

Image multi-stage optimisée pour la production :

```
Stage 1 (deps)    — installation des dépendances npm
Stage 2 (build)   — compilation Next.js (mode standalone)
Stage 3 (runtime) — image finale légère (~80-100MB)
```

**Optimisations :**
- Mode `standalone` Next.js — image 5x plus légère
- Utilisateur non-root (`appuser`) — sécurité renforcée
- `NEXT_TELEMETRY_DISABLED=1` — pas de données envoyées à Vercel
- `HEALTHCHECK` intégré — détection automatique des crashs
- Cache Docker optimisé — `package.json` copié avant le code source

> Requiert `output: 'standalone'` dans `next.config.ts`.

## 📁 Structure du projet

```
AI-Chat-app/
├── .github/
│   └── workflows/
│       └── CI.yml              # Pipeline GitHub Actions
├── AI-Chat/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts   # Route générique (llava:7b)
│   │   │   ├── gemma/route.ts  # Route gemma4:12b
│   │   │   ├── llama/route.ts  # Route llama3:8b
│   │   │   └── llava/route.ts  # Route llava:7b
│   │   ├── gemma/page.tsx      # Page chat Gemma
│   │   ├── llama/page.tsx      # Page chat Llama
│   │   ├── llava/page.tsx      # Page chat Llava
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # Page d'accueil
│   ├── public/
│   ├── test/
│   │   └── api.test.ts         # 23 tests unitaires
│   ├── .dockerignore
│   ├── .trivyignore            # CVE ignorées (devDependencies)
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── next.config.ts          # output: 'standalone'
│   ├── package.json
│   └── tsconfig.json
└── docker-compose.yml
```

## 📚 Repos liés

| Repo | Description |
|---|---|
| [AI-Chat-gitops](https://github.com/CL-KRMA/AI-Chat-gitops) | Manifests Kubernetes (GitOps) |
| [AI-Chat-infra](https://github.com/CL-KRMA/AI-Chat-infra) | Infrastructure AWS (K3s cluster) |

## 📝 Licence

Ce projet est sous licence MIT.  
Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👤 Auteur

Créé par Cheick — Juin 2026
