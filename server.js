require('dotenv').config();
const { createApp } = require('./src/app');
const { run: seedMiniApps } = require('./src/data/seed');
const { getState } = require('./src/db');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Set it in a .env file before deploying.');
  process.env.JWT_SECRET = 'dev-only-insecure-secret';
}

// Seed the mini-apps catalog on first boot only.
const state = getState();
if (!state.miniApps || state.miniApps.length === 0) {
  seedMiniApps();
}

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Atma-Nirbhar backend listening on http://localhost:${PORT}`);
});
