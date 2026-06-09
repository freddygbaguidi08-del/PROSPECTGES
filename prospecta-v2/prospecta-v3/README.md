# 🚀 Prospecta v2 — Déploiement en 3 étapes

## Ce projet est un seul dossier Next.js — déployable en 1 clic sur Vercel

---

## Étape 1 — Créez votre base de données Supabase (5 min)

1. Allez sur https://supabase.com → créez un compte gratuit
2. Cliquez **"New Project"** → donnez un nom → créez
3. Attendez 2 minutes
4. Allez dans **Settings → Database**
5. Copiez l'URL sous **"Transaction pooler"** (commence par `postgresql://postgres.XXXX:...`)

---

## Étape 2 — Déployez sur Vercel (3 min)

1. Allez sur https://github.com → créez un compte gratuit
2. Cliquez **"New repository"** → nommez-le `prospecta` → créez
3. Allez sur https://vercel.com → créez un compte avec GitHub
4. Cliquez **"Add New Project"** → importez votre repo
5. Dans **"Environment Variables"**, ajoutez :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | L'URL Supabase copiée à l'étape 1 |
| `JWT_SECRET` | N'importe quelle phrase secrète longue |
| `GROQ_API_KEY` | Votre clé Groq (https://console.groq.com) |
| `GEMINI_API_KEY` | Votre clé Gemini (https://makersuite.google.com) |
| `BREVO_SMTP_USER` | Votre email Brevo |
| `BREVO_SMTP_PASS` | Votre mot de passe SMTP Brevo |

6. Cliquez **"Deploy"** → attendez 2 minutes

---

## Étape 3 — Uploadez votre code sur GitHub

### Option A — Interface web GitHub (sans terminal)

1. Sur votre repo GitHub, cliquez **"uploading an existing file"**
2. Glissez-déposez tous les fichiers du dossier `prospecta-v2`
3. Cliquez **"Commit changes"**
4. Vercel redéploie automatiquement !

### Option B — Avec terminal

```bash
cd prospecta-v2
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE_USERNAME/prospecta.git
git push -u origin main
```

---

## Les tables se créent automatiquement

Pas besoin de commandes Prisma ! Le code crée les tables SQL automatiquement
au premier appel API grâce à la fonction `initDB()`.

---

## Fonctionnalités

- ✅ Gestion prospects (CRUD, import CSV, scoring)
- ✅ Campagnes email avec séquences
- ✅ Génération emails par IA (Groq + Gemini)
- ✅ Pipeline CRM Kanban drag & drop
- ✅ Analytics et tableaux de bord
- ✅ Authentification sécurisée (JWT)
- ✅ 100% gratuit à déployer
