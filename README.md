# FlashMem

Nuxt 4 application with MongoDB authentication.

## Features

- Login and register pages
- JWT auth stored in HTTP-only cookies
- Route middleware for guest and authenticated areas
- Default route redirects to `/login` or `/dashboard`
- App layout with topbar for authenticated pages

## Requirements

- Node.js 22+
- MongoDB running locally or a remote connection string (MongoDB Atlas for Netlify)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and JWT secret.

4. Start the development server:

```bash
npm run dev
```

## Deploy to Netlify

1. Push this repo to GitHub (or connect the folder in Netlify).

2. In Netlify: **Add new site → Import an existing project**.

3. Build settings are already in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `22`

4. Add environment variables in **Site configuration → Environment variables**:

| Variable | Example |
| --- | --- |
| `NUXT_MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/flashmem` |
| `NUXT_JWT_SECRET` | a long random secret string |

`MONGODB_URI` / `JWT_SECRET` also work if you prefer those names.

5. Use a cloud MongoDB (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas)). Allow network access from anywhere (`0.0.0.0/0`) or Netlify’s IPs so serverless functions can connect.

6. Deploy. The site runs as Nuxt SSR on Netlify Functions via the Nitro `netlify` preset.

### Local production check

```bash
npm run build
npm run preview
```

## Routes

| Route | Access |
| --- | --- |
| `/` | Redirects to login or dashboard |
| `/login` | Guest only |
| `/register` | Guest only |
| `/dashboard` | Authenticated only |
| `/listing` | Authenticated only |
| `/community` | Authenticated only |
| `/word-sets/:id` | Authenticated only |
| `/flashcard/:id` | Authenticated only |

## API Endpoints

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Current user
- Word set CRUD and flashcard APIs under `/api/word-sets`
