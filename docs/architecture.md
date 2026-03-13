# ScalenixOS — Architecture

## Overview

ScalenixOS is a web desktop environment accessible from a browser, integrating multiple enterprise applications via SSO.

```
Browser (os.scalenix.fr)
  └── React Shell (Vite + TypeScript)
        ├── Auth Layer (keycloak-js OIDC PKCE)
        ├── Desktop (TopBar, Dock, Wallpaper)
        ├── Window Manager (Zustand)
        ├── Launcher (app registry)
        └── App Containers
              ├── IframeApp (Zimbra, Nextcloud, OnlyOffice, Keycloak Admin)
              └── XpraApp (Terminal, LibreOffice → via oauth2-proxy)
```

## Authentication Flow

1. User opens `os.scalenix.fr`
2. `keycloak-js` redirects to `auth.scalenix.fr` (OIDC Authorization Code + PKCE)
3. User authenticates → token returned to shell
4. Token auto-refreshed every 60s
5. Iframe apps use shared Keycloak session cookies (same `.scalenix.fr` domain)
6. Xpra apps use `oauth2-proxy` ForwardAuth sidecar

## Infrastructure

```
Traefik (reverse proxy + TLS)
  ├── os.scalenix.fr → scalenix-shell (nginx serving React build)
  ├── auth.scalenix.fr → Keycloak 24 (+ PostgreSQL)
  ├── terminal.scalenix.fr → oauth2-proxy → xpra-terminal
  └── libreoffice.scalenix.fr → oauth2-proxy → xpra-libreoffice
```

## State Management

- `windowStore` (Zustand) — open windows, positions, z-index, focus
- `appStore` (Zustand) — app registry loaded from `registry.json`
- `notifStore` (Zustand) — system notifications queue

## Security

- CSP `frame-src` restricts iframe origins
- CSP `frame-ancestors` on each embedded app allows only `os.scalenix.fr`
- Token never stored in localStorage — managed by keycloak-js
- oauth2-proxy handles auth for apps without native OIDC (Xpra)
- TLS 1.2+ enforced via Traefik
