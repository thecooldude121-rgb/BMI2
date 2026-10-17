# BMI

Multi-tenant B2B CRM: React + Vite frontend (`Frontend/`), Node/Express backend (`Backend/`), PostgreSQL.
Project rules and decisions live in `CLAUDE.md`.

## Run it locally

One command, from your own terminal, starts both servers:

```sh
./scripts/dev.sh
```

- Backend on http://localhost:5001, frontend on **http://localhost:5173** (use `localhost` —
  `127.0.0.1:5173` does not load, because Vite listens on IPv6 loopback).
- Ctrl-C, or closing the terminal, stops both. Restart it after pulling or editing backend code.
- It refuses to start if 5001 or 5173 is already taken, and names the process holding the port.
- The backend refuses to start when a database migration is pending (`MIGRATIONS_ON_BOOT=check`).
  Apply migrations first with `(cd Backend && npm run db:migrate)`; on the live database, do a
  rolled-back dry run before that.

First-time setup: `npm ci` in `Backend/` and in `Frontend/`, and a `Backend/.env` based on
`Backend/.env.example` (keep it private: `chmod 600 Backend/.env`).
