# ScalenixOS

Web desktop environment by [Scalenix](https://scalenix.fr) — accessible from any browser.

## Features

- Desktop shell with draggable/resizable windows (macOS-like controls)
- SSO via Keycloak (OIDC Authorization Code + PKCE)
- Integrated apps: Zimbra Mail, Nextcloud Files, OnlyOffice, Linux Terminal (Xpra)
- Role-based app access (user / developer / admin)
- System notifications
- Dark theme with blur effects

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Auth | keycloak-js (OIDC PKCE) |
| Reverse Proxy | Traefik v3 |
| Container | Docker + Docker Compose |
| IdP | Keycloak 24 |

## Quick Start

```bash
# Development
cd shell
cp .env.example .env
npm install
npm run dev

# Production (Docker)
cd infra
cp .env.example .env
# Edit .env with real values
docker compose up -d --build
```

## Project Structure

```
scalenix-os/
├── shell/          # React frontend (web desktop)
│   ├── src/
│   │   ├── auth/       # Keycloak OIDC integration
│   │   ├── desktop/    # Desktop, TopBar, Dock, Launcher
│   │   ├── windows/    # Window Manager, drag, TitleBar
│   │   ├── apps/       # IframeApp, XpraApp loaders
│   │   ├── store/      # Zustand stores
│   │   ├── components/ # Shared UI components
│   │   └── types/      # TypeScript interfaces
│   └── public/apps/    # App registry (runtime config)
├── infra/          # Docker infrastructure
│   ├── docker-compose.yml
│   ├── traefik/    # Reverse proxy config
│   ├── keycloak/   # Realm export + themes
│   └── oauth2-proxy/
└── docs/           # Architecture & deployment docs
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)

## License

Open Source — Scalenix
