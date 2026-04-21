# Whiteboard Workspace

This project now uses separate frontend and backend folders:

- `client`: Next.js app for creating and joining InkSync by Yoshiths
- `server`: Express and Socket.IO backend for room management and live drawing sync

## Run locally

1. Install dependencies from the repo root:

```bash
npm install
```

2. Create env files from the examples:

```bash
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

3. Start the backend:

```bash
npm run dev:server
```

4. In another terminal, start the frontend:

```bash
npm run dev:client
```

5. Open `http://localhost:3000`

The frontend expects the backend at `http://localhost:4000` by default.
