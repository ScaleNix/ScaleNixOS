<p align="center">
  <img src="shell/public/scalenix-logo.svg" alt="ScaleNix OS" width="120" />
</p>

<h1 align="center">ScaleNix OS</h1>

<p align="center">
  <strong>A full-featured web desktop environment accessible from any browser.</strong>
  <br />
  Built by <a href="https://scalenix.fr">Scalenix</a> &mdash; Open Source, Self-Hosted, Enterprise-Ready.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-LGPL--2.0-blue" alt="License" />
  <img src="https://img.shields.io/badge/react-18-61dafb" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-5-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwind-v4-38bdf8" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/docker-compose-2496ed" alt="Docker" />
  <img src="https://img.shields.io/badge/i18n-5_languages-green" alt="i18n" />
</p>

---

## What is ScaleNix OS?

ScaleNix OS is a **cloud desktop** that runs entirely in the browser. It provides a familiar desktop experience &mdash; draggable windows, taskbar, launcher, notifications, widgets &mdash; while integrating **30+ enterprise applications** behind a single sign-on.

Think of it as your organization's private workspace: email, files, chat, video calls, documents, passwords, code editor, and more &mdash; all in one tab.

### Key Highlights

- **KDE-style window management** &mdash; drag, resize, snap (left/right/maximize), minimize, Alt+Tab, virtual workspaces
- **30+ integrated applications** &mdash; from email to code editors, all accessible from one desktop
- **Single Sign-On** &mdash; Keycloak OIDC (Authorization Code + PKCE), role-based access
- **5 languages** &mdash; French, English, Italian, Spanish, German
- **Desktop widgets** &mdash; clock, calendar, sticky notes, system monitor, weather, todo, chat preview
- **Fully self-hosted** &mdash; Docker Compose deployment, no cloud dependency
- **Dark & light themes** &mdash; with automatic scheduling and custom wallpapers

---

## Screenshots

| Desktop | Launcher | File Explorer |
|---------|----------|---------------|
| ![Desktop](shell/screenshots/01-desktop.png) | ![Launcher](shell/screenshots/02-launcher.png) | ![Files](shell/screenshots/03-file-explorer.png) |

| Mail | Browser | Kanban |
|------|---------|--------|
| ![Mail](shell/screenshots/04-mail.png) | ![Browser](shell/screenshots/05-browser.png) | ![Kanban](shell/screenshots/06-kanban.png) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **State Management** | Zustand (15+ stores) |
| **Authentication** | Keycloak 24 (OIDC PKCE via `keycloak-js`) |
| **Reverse Proxy** | Traefik v3 (TLS, routing, middlewares) |
| **Containers** | Docker + Docker Compose |
| **Email** | Zimbra 10 (preauth SSO integration) |
| **Files** | Nextcloud 29 (WebDAV + OIDC) |
| **Documents** | OnlyOffice 8 (via Nextcloud) |
| **Chat** | Matrix/Synapse + Element Web |
| **Video** | LiveKit (WebRTC conferencing) |
| **Spreadsheets** | Grist (API-driven) |
| **Wiki** | Outline |
| **Blog** | Ghost |
| **Photos** | Immich |
| **Passwords** | Vaultwarden (Bitwarden-compatible) |
| **Code** | code-server (VS Code in browser) |
| **Whiteboard** | Excalidraw |
| **Media** | Jellyfin |
| **Remote Desktop** | Xpra HTML5 (Linux apps in browser) |
| **Testing** | Playwright (35+ E2E tests) |

---

## Application Catalog

### Communication (5 apps)
| App | Type | Description |
|-----|------|-------------|
| **Messagerie** | iframe | Zimbra Webmail with preauth SSO |
| **Agenda** | iframe | Zimbra Calendar |
| **Chat** | iframe | Matrix/Element instant messaging |
| **Visio** | iframe | LiveKit video conferencing |
| **Annuaire** | native | Employee directory from Keycloak |

### Productivity (7 apps)
| App | Type | Description |
|-----|------|-------------|
| **Fichiers** | native | Nextcloud File Explorer (WebDAV) |
| **Editeur** | iframe | OnlyOffice via Nextcloud |
| **Grist** | iframe | Spreadsheet & database |
| **Notes** | iframe | Outline knowledge base |
| **Blog** | iframe | Ghost publishing platform |
| **Kanban** | native | Task boards with drag & drop |
| **Tableau blanc** | iframe | Excalidraw collaborative whiteboard |

### Tools (9 apps)
| App | Type | Description |
|-----|------|-------------|
| **Terminal** | xpra | Linux terminal via Xpra |
| **Code** | iframe | VS Code (code-server) |
| **Navigateur** | iframe | Chromium via Selkies-GStreamer |
| **Calculatrice** | native | Scientific calculator |
| **Horloge mondiale** | native | World timezone clock |
| **Editeur de texte** | native | Text editor with syntax highlighting |
| **Capture d'ecran** | native | Screenshot & screen recording |
| **Presse-papiers** | native | Clipboard history manager |
| **Audio** | native | Volume mixer & sound controls |
| **Mots de passe** | iframe | Vaultwarden password manager |

### Multimedia (2 apps)
| App | Type | Description |
|-----|------|-------------|
| **Media** | iframe | Jellyfin media player |
| **Photos** | iframe | Immich photo management |

### System (7 apps)
| App | Type | Description |
|-----|------|-------------|
| **Preferences** | native | Theme, wallpaper, language settings |
| **App Store** | native | Enable/disable/pin applications |
| **Gestionnaire de taches** | native | Process & window manager |
| **Widgets** | native | Desktop widget manager |
| **Corbeille** | native | Deleted files (Nextcloud trash) |
| **Mon Profil** | native | User profile & preferences |
| **Admin IAM** | iframe | Keycloak admin console (admin only) |

### Desktop Widgets (15)
Clock, Calendar, Sticky Notes, System Monitor, Todo List, Weather, Pomodoro Timer, Quick Links, Inspirational Quotes, Nextcloud Files, Zimbra Mail, Zimbra Calendar, Zimbra Tasks, Matrix Chat preview.

---

## Quick Start

### Development (frontend only)

```bash
git clone https://github.com/ScaleNix/ScaleNixOS.git
cd ScaleNixOS/shell
cp .env.example .env          # Edit with your service URLs
npm install
npm run dev                   # http://localhost:3000
```

### Full Stack (Docker Compose)

```bash
cd ScaleNixOS/infra
cp .env.example .env          # Edit ALL secrets and URLs
docker compose up -d --build
```

> See [Deployment Guide](docs/ADMIN.md) for detailed instructions.

---

## Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [Developer Guide](docs/DEVELOPER.md) | Developers | Architecture, adding apps, contributing |
| [Admin Guide](docs/ADMIN.md) | Sysadmins | Deployment, configuration, maintenance |
| [User Guide](docs/USER.md) | End users | Using the desktop, apps, shortcuts |

---

## Project Structure

```
ScaleNixOS/
├── shell/                    # React frontend (web desktop)
│   ├── src/
│   │   ├── apps/            # Native app components (30+)
│   │   ├── auth/            # Keycloak OIDC integration
│   │   ├── desktop/         # Desktop, Taskbar, Launcher, Spotlight
│   │   │   └── widgets/     # Desktop widgets (15)
│   │   ├── windows/         # Window Manager, TitleBar, drag/resize
│   │   ├── store/           # Zustand stores (15+)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Internationalization (5 languages)
│   │   ├── api/             # API clients (Matrix, Grist, Zimbra, WebDAV)
│   │   ├── components/      # Shared UI (ContextMenu, Notification)
│   │   └── types/           # TypeScript interfaces
│   ├── public/apps/         # App registry (runtime config)
│   └── e2e/                 # Playwright E2E tests (35+)
├── infra/                   # Docker infrastructure
│   ├── docker-compose.yml   # Full service stack
│   ├── keycloak/            # Realm config + login theme
│   ├── traefik/             # Reverse proxy & TLS
│   ├── matrix/              # Synapse homeserver config
│   ├── livekit/             # LiveKit server + Meet UI
│   ├── nginx/               # Nextcloud proxy config
│   └── docker/              # Custom Dockerfiles (Xpra, X2Go)
├── docs/                    # Documentation
└── LICENSE                  # LGPL-2.0
```

---

## Contributing

We welcome contributions! Please read the [Developer Guide](docs/DEVELOPER.md) to get started.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`cd shell && npx playwright test`)
5. Submit a Pull Request

---

## License

This project is licensed under the **GNU Library General Public License v2 (LGPL-2.0)**.
See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with care by <a href="https://scalenix.fr">Scalenix</a> &mdash; Founded by Malik Benmekki
</p>
