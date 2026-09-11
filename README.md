# Atma-Nirbhar OmniNexus — Backend API

A REST API backend for the `index.html` super-app frontend (Home, AI Orchestrator Agent,
Wallet, Chat, Mini Apps, Profile). Built with Node.js + Express, JWT auth, and a small
file-backed JSON datastore (`src/data/db.json`) so it runs with zero external services —
swap `src/db.js` for a real database later without touching any route.

## Setup

```bash
npm install
cp .env.example .env   # then edit JWT_SECRET
npm start               # or: npm run dev  (auto-restart on changes)
```

Server listens on `http://localhost:4000` by default (`PORT` in `.env`).

## Auth

All routes except `/health`, `/api/auth/register`, and `/api/auth/login` require:

```
Authorization: Bearer <token>
```

`token` is returned from register/login and expires per `JWT_EXPIRES_IN` (default 7 days).

## Endpoints

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, phone?, address? }` | Creates user + wallet (seeded with a ₹5,000 welcome bonus, matching the demo balance) |
| POST | `/api/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| GET | `/api/auth/me` | — | Current user |

### Profile
| Method | Path | Body |
|---|---|---|
| GET | `/api/profile` | — |
| PUT | `/api/profile` | `{ name?, email?, phone?, address? }` |
| PUT | `/api/profile/security` | `{ biometric? }` |

### Wallet
| Method | Path | Body |
|---|---|---|
| GET | `/api/wallet` | — balance |
| GET | `/api/wallet/transactions?limit=20` | — |
| POST | `/api/wallet/add-money` | `{ amount, method? }` |
| POST | `/api/wallet/send-money` | `{ recipient, amount, note? }` — 402 if insufficient balance |
| GET | `/api/wallet/fraud-status` | — |

### Chats
| Method | Path | Body |
|---|---|---|
| GET | `/api/chats?query=` | List conversations (optionally filtered by name) |
| POST | `/api/chats` | `{ name, avatar?, gradient?, online? }` — create a conversation |
| GET | `/api/chats/:chatId/messages` | — |
| POST | `/api/chats/:chatId/messages` | `{ text }` — stores your message + a simulated reply |

### Mini Apps
| Method | Path | Notes |
|---|---|---|
| GET | `/api/miniapps` | Shared catalog (seeded once on first boot) |
| POST | `/api/miniapps/:appId/launch` | Mock launch/deep-link, 409 if "Coming Soon" |

### AI Orchestrator Agent
| Method | Path | Body |
|---|---|---|
| POST | `/api/ai/message` | `{ text }` — matches one of the canned multi-step task plans (ride+notify, bill pay, dinner order) via the same word-overlap heuristic the frontend used, or a generic fallback plan. Unlike the frontend's mock, the bill-pay and dinner-order plans **actually debit the wallet**, and the ride plan **actually posts to the "Family Group" chat**. |
| GET | `/api/ai/history?limit=20` | Past AI interactions for the user |

## Wiring up the frontend

Replace the frontend's in-memory arrays/functions with `fetch` calls, e.g.:

```js
const API = 'http://localhost:4000/api';
let authToken = localStorage.getItem('token'); // or an in-memory variable

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

// e.g. replace sendMoney()'s local balance math with:
async function sendMoney() {
  const recipient = document.getElementById('send-recipient').value.trim();
  const amount = parseInt(document.getElementById('send-amount').value) || 0;
  const { balance } = await api('/wallet/send-money', {
    method: 'POST',
    body: JSON.stringify({ recipient, amount }),
  });
  walletBalance = balance;
  updateWalletDisplay();
  closeModal();
}
```

## Notes / production hardening

- The JSON datastore (`src/data/db.json`) is fine for a demo/prototype; for real traffic,
  replace `src/db.js` with a proper database and keep the same `getState()/persist()`
  shape, or refactor routes to use an ORM.
- Add input validation (e.g. `zod`/`joi`) and stronger rate limiting per route in production.
- Rotate `JWT_SECRET` via a secrets manager, not `.env`, in production.
- CORS is wide open (`CORS_ORIGIN=*`) by default for local development — lock it down.
