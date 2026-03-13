# ScaleNix OS &mdash; Admin Guide

This guide covers deployment, configuration, maintenance, and troubleshooting for system administrators.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment](#quick-deployment)
3. [DNS & Network Setup](#dns--network-setup)
4. [Environment Configuration](#environment-configuration)
5. [Service Architecture](#service-architecture)
6. [Keycloak (Identity Provider)](#keycloak-identity-provider)
7. [Traefik (Reverse Proxy)](#traefik-reverse-proxy)
8. [Nextcloud (Files)](#nextcloud-files)
9. [Matrix/Synapse (Chat)](#matrixsynapse-chat)
10. [LiveKit (Video Conferencing)](#livekit-video-conferencing)
11. [Other Services](#other-services)
12. [TLS Certificates](#tls-certificates)
13. [Backup & Restore](#backup--restore)
14. [Monitoring](#monitoring)
15. [User Management](#user-management)
16. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Minimum |
|-------------|---------|
| **OS** | Linux (Ubuntu 22.04+ / Debian 12+ recommended) |
| **Docker** | 24.0+ with Docker Compose v2 |
| **RAM** | 8 GB (16 GB recommended for full stack) |
| **Disk** | 50 GB (SSD recommended) |
| **CPU** | 4 cores |
| **Ports** | 80, 443 (public), 8080 (Traefik dashboard, internal) |

---

## Quick Deployment

```bash
# 1. Clone the repository
git clone https://github.com/ScaleNix/ScaleNixOS.git
cd ScaleNixOS

# 2. Configure environment
cd infra
cp .env.example .env
nano .env                     # Set ALL secrets (see Environment Configuration)

# 3. Generate secrets
# Replace every 'changeme' with a strong random value:
openssl rand -hex 32          # For API secrets, cookie secrets
openssl rand -base64 32       # For database passwords

# 4. Configure shell environment
cd ../shell
cp .env.example .env
nano .env                     # Set service URLs

# 5. Deploy
cd ../infra
docker compose up -d --build

# 6. Verify
docker compose ps             # All services should be "Up"
docker compose logs -f        # Watch for errors
```

### First-Time Setup

After deployment, Keycloak imports the realm from `realm-scalenix.json` on first boot. This creates:

- Realm: `scalenix-os`
- Clients: `scalenix-shell`, `nextcloud`, `zimbra`, `oauth2-proxy`, `guacamole`
- Roles: `admin`, `developer`, `user`
- Default users (passwords must be changed immediately)

> **Important**: The realm import only runs on first startup. To modify realm settings after initial boot, use the Keycloak Admin Console at `https://auth.scalenix.fr/admin`.

---

## DNS & Network Setup

### Required DNS Records

All subdomains should point to your server's public IP:

| Subdomain | Service |
|-----------|---------|
| `os.scalenix.fr` | ScaleNix OS Shell (frontend) |
| `auth.scalenix.fr` | Keycloak (identity provider) |
| `files.scalenix.fr` | Nextcloud (file storage) |
| `mail.scalenix.fr` | Zimbra (email) |
| `terminal.scalenix.fr` | Xpra Terminal |
| `libreoffice.scalenix.fr` | Xpra LibreOffice |
| `chat.scalenix.fr` | Element Web (Matrix client) |
| `matrix.scalenix.fr` | Synapse (Matrix homeserver) |
| `meet.scalenix.fr` | LiveKit Meet (video) |
| `docs.scalenix.fr` | Outline (wiki) |
| `blog.scalenix.fr` | Ghost (blog) |
| `grist.scalenix.fr` | Grist (spreadsheets) |
| `photos.scalenix.fr` | Immich (photo management) |
| `media.scalenix.fr` | Jellyfin (media player) |
| `vault.scalenix.fr` | Vaultwarden (passwords) |
| `code.scalenix.fr` | code-server (VS Code) |
| `draw.scalenix.fr` | Excalidraw (whiteboard) |
| `rdp.scalenix.fr` | Guacamole (remote desktop) |

### Firewall Rules

```bash
# Required
ufw allow 80/tcp      # HTTP (Traefik redirect to HTTPS)
ufw allow 443/tcp     # HTTPS (all services)

# Optional (internal only)
ufw allow 8080/tcp    # Traefik dashboard (restrict to admin IPs)
```

---

## Environment Configuration

### `infra/.env` &mdash; Infrastructure Secrets

```bash
# Domain
DOMAIN=scalenix.fr

# Keycloak
KC_ADMIN_PASSWORD=<strong-password>
KC_DB_PASSWORD=<strong-password>

# OAuth2 Proxy
OAUTH2_PROXY_CLIENT_SECRET=<keycloak-client-secret>
OAUTH2_PROXY_COOKIE_SECRET=<32-char-random>

# Nextcloud
NC_DB_PASSWORD=<strong-password>
NC_ADMIN_PASSWORD=<strong-password>
NEXTCLOUD_WEBDAV_USER=admin
NEXTCLOUD_WEBDAV_PASSWORD=<strong-password>

# Matrix / Synapse
SYNAPSE_DB_PASSWORD=<strong-password>
SYNAPSE_OIDC_SECRET=<keycloak-client-secret>

# LiveKit
LIVEKIT_API_SECRET=<strong-secret>

# Grist
GRIST_CLIENT_SECRET=<keycloak-client-secret>

# Outline
OUTLINE_SECRET_KEY=<32-char-random>
OUTLINE_UTILS_SECRET=<32-char-random>
OUTLINE_OIDC_SECRET=<keycloak-client-secret>
OUTLINE_DB_PASSWORD=<strong-password>

# Ghost
GHOST_COOKIE_SECRET=<32-char-random>
GHOST_OIDC_SECRET=<keycloak-client-secret>
GHOST_DB_ROOT_PASSWORD=<strong-password>
GHOST_DB_PASSWORD=<strong-password>

# Immich
IMMICH_DB_PASSWORD=<strong-password>

# Vaultwarden
VAULTWARDEN_ADMIN_TOKEN=<strong-token>

# code-server
CODE_SERVER_PASSWORD=<strong-password>
```

### `shell/.env` &mdash; Frontend Configuration

```bash
VITE_KEYCLOAK_URL=https://auth.scalenix.fr
VITE_KEYCLOAK_REALM=scalenix-os
VITE_KEYCLOAK_CLIENT=scalenix-shell
VITE_ZIMBRA_URL=https://mail.scalenix.fr
VITE_NEXTCLOUD_URL=https://files.scalenix.fr
VITE_XPRA_TERMINAL_URL=https://terminal.scalenix.fr
VITE_GRIST_URL=https://grist.scalenix.fr
VITE_ELEMENT_URL=https://chat.scalenix.fr
VITE_LIVEKIT_MEET_URL=https://meet.scalenix.fr
VITE_OUTLINE_URL=https://docs.scalenix.fr
VITE_GHOST_URL=https://blog.scalenix.fr
VITE_JELLYFIN_URL=https://media.scalenix.fr
VITE_IMMICH_URL=https://photos.scalenix.fr
VITE_VAULTWARDEN_URL=https://vault.scalenix.fr
VITE_CODE_SERVER_URL=https://code.scalenix.fr
VITE_EXCALIDRAW_URL=https://draw.scalenix.fr
VITE_CHROMIUM_URL=https://browser.scalenix.fr
```

---

## Service Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Traefik v3 (Reverse Proxy)                  │
│                  Ports 80/443 — TLS termination                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ scalenix-    │  │ Keycloak 24  │  │ Nextcloud 29         │ │
│  │ shell        │  │ + PostgreSQL │  │ + OnlyOffice 8       │ │
│  │ (nginx)      │  │              │  │ + PostgreSQL         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Matrix       │  │ LiveKit      │  │ Grist                │ │
│  │ Synapse      │  │ + Meet UI    │  │                      │ │
│  │ + Element    │  │              │  │                      │ │
│  │ + PostgreSQL │  │              │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Ghost        │  │ Outline      │  │ Immich               │ │
│  │ + MySQL      │  │ + PostgreSQL │  │ + PostgreSQL         │ │
│  │              │  │ + Redis      │  │ + Redis + ML         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Vaultwarden  │  │ code-server  │  │ oauth2-proxy         │ │
│  │              │  │              │  │ → xpra-terminal      │ │
│  │              │  │              │  │ → xpra-libreoffice   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Jellyfin     │  │ Excalidraw   │  │ Guacamole            │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Keycloak (Identity Provider)

### Admin Console

Access at `https://auth.scalenix.fr/admin` with the master realm admin credentials.

### Key Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Realm | `scalenix-os` | Main realm for all users |
| Login theme | `scalenix` | Custom dark theme |
| SSL required | `none` (dev) / `external` (prod) | Set in realm settings |
| Token lifespan | 5 min (access) / 30 min (SSO) | Adjust in realm > Tokens |

### Creating Users

1. Admin Console > Users > Add user
2. Set username, email, first/last name
3. Credentials tab: set password (temporary = false)
4. Role Mappings tab: assign `user`, `developer`, and/or `admin`

### Client Configuration

Each integrated service has a Keycloak client. Key settings:

| Client | Flow | Public | Notes |
|--------|------|--------|-------|
| `scalenix-shell` | Authorization Code + PKCE | Yes | Frontend SPA |
| `nextcloud` | Authorization Code | No | Server-side OIDC |
| `zimbra` | Authorization Code | No | Preauth integration |
| `oauth2-proxy` | Authorization Code | No | Protects Xpra apps |
| `synapse` | Authorization Code | No | Matrix SSO |
| `grist` | Authorization Code | No | Spreadsheet SSO |

### Keycloak Login Theme

The custom login theme is at `infra/keycloak/themes/scalenix/login/`. It extends the default Keycloak theme with dark styling.

To customize:
1. Edit `login/resources/css/scalenix.css`
2. Replace `login/resources/img/scalenix-logo.svg` with your logo
3. Restart Keycloak: `docker compose restart keycloak`

---

## Traefik (Reverse Proxy)

### Configuration Files

| File | Purpose |
|------|---------|
| `infra/traefik/traefik.yml` | Main config (entrypoints, providers) |
| `infra/traefik/dynamic/tls.yml` | TLS certificate paths |
| `infra/traefik/dynamic/middlewares.yml` | Security headers, rate limiting |

### Dashboard

The Traefik dashboard runs on port 8080 (HTTP only, internal). Access it at `http://localhost:8080`.

### Adding a New Route

Routes are defined via Docker labels in `docker-compose.yml`:

```yaml
my-service:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.my-service.rule=Host(`myservice.${DOMAIN}`)"
    - "traefik.http.routers.my-service.entrypoints=websecure"
    - "traefik.http.routers.my-service.tls=true"
    - "traefik.http.services.my-service.loadbalancer.server.port=8080"
```

---

## Nextcloud (Files)

### OIDC Configuration

Nextcloud uses the `oidc_login` app (v3.2.5) for Keycloak SSO:

```php
'oidc_login_provider_url' => 'https://auth.scalenix.fr/realms/scalenix-os',
'oidc_login_client_id' => 'nextcloud',
'oidc_login_client_secret' => '<secret>',
```

### WebDAV Integration

The shell's File Explorer connects via WebDAV. The nginx proxy maps `/webdav/` to Nextcloud's WebDAV endpoint:

```nginx
location /webdav/ {
    rewrite ^/webdav/(.*)$ /remote.php/dav/$1 break;
    proxy_pass https://nextcloud;
}
```

Enable WebDAV Bearer token auth in Nextcloud:
```php
'oidc_login_webdav_enabled' => true,
```

---

## Matrix/Synapse (Chat)

### Configuration

Synapse config is at `infra/matrix/homeserver.yaml`:

- Database: PostgreSQL (`postgres-synapse`)
- OIDC: Keycloak integration via `oidc_providers`
- Rate limiting: relaxed for internal use (100 req/s)

### Element Web

Element Web is configured via `infra/matrix/element-config.json`. It connects to the Synapse homeserver.

---

## LiveKit (Video Conferencing)

### Components

1. **LiveKit Server** (`infra/livekit/livekit.yaml`): WebRTC SFU
2. **Meet UI** (`infra/livekit/meet/`): Express.js app that exchanges Keycloak tokens for LiveKit tokens

### Configuration

```yaml
# livekit.yaml
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
room:
  auto_create: true
  max_participants: 50
```

---

## Other Services

| Service | Config Location | Notes |
|---------|----------------|-------|
| **Ghost** | Docker env vars | Blog engine with OIDC |
| **Outline** | Docker env vars | Wiki with OIDC + PostgreSQL + Redis |
| **Grist** | Docker env vars | Spreadsheet with OIDC |
| **Immich** | Docker env vars | Photo manager with ML |
| **Vaultwarden** | Docker env vars | Bitwarden-compatible password manager |
| **code-server** | Docker env vars | VS Code in browser |
| **Excalidraw** | No config needed | Collaborative whiteboard |
| **Jellyfin** | Docker env vars | Media player |

---

## TLS Certificates

### Development (Self-Signed)

The project includes a root CA and wildcard certificate for `*.scalenix.fr`:

```bash
infra/certs/
├── scalenix-ca.crt          # Root CA (import in browser)
├── wildcard.scalenix.fr.crt # Wildcard certificate
└── trust-ca.sh              # Script to trust the CA on Linux
```

Trust the CA:
```bash
cd infra/certs
sudo bash trust-ca.sh
```

### Production (Let's Encrypt)

Replace the self-signed certs with Let's Encrypt by updating `traefik.yml`:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@scalenix.fr
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

---

## Backup & Restore

### What to Back Up

| Data | Location | Method |
|------|----------|--------|
| **Keycloak DB** | `postgres-keycloak` container | `pg_dump` |
| **Nextcloud files** | Nextcloud data volume | `rsync` / volume backup |
| **Nextcloud DB** | `postgres-nextcloud` container | `pg_dump` |
| **Matrix DB** | `postgres-synapse` container | `pg_dump` |
| **Matrix media** | Synapse media_store volume | `rsync` |
| **Vaultwarden** | Vaultwarden data volume | Copy `db.sqlite3` |
| **Environment** | `infra/.env`, `shell/.env` | Secure copy |

### Backup Script Example

```bash
#!/bin/bash
BACKUP_DIR="/backups/scalenix/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Keycloak
docker exec postgres-keycloak pg_dump -U keycloak keycloak > "$BACKUP_DIR/keycloak.sql"

# Nextcloud
docker exec postgres-nextcloud pg_dump -U nextcloud nextcloud > "$BACKUP_DIR/nextcloud.sql"

# Synapse
docker exec postgres-synapse pg_dump -U synapse synapse > "$BACKUP_DIR/synapse.sql"

# Config
cp infra/.env "$BACKUP_DIR/.env"

echo "Backup completed: $BACKUP_DIR"
```

---

## Monitoring

### Health Checks

```bash
# All services status
docker compose ps

# Keycloak
curl -s https://auth.scalenix.fr/realms/scalenix-os/.well-known/openid-configuration | jq .issuer

# Nextcloud
curl -s https://files.scalenix.fr/status.php | jq .installed

# Traefik
curl -s http://localhost:8080/api/overview | jq .

# Matrix
curl -s https://matrix.scalenix.fr/_matrix/client/versions | jq .
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f keycloak
docker compose logs -f traefik

# Last 100 lines
docker compose logs --tail 100 keycloak
```

---

## User Management

### Roles

| Role | Access Level |
|------|-------------|
| `user` | Standard apps (email, files, chat, calendar) |
| `developer` | User + Terminal, Code Server |
| `admin` | Developer + Keycloak Admin, all system apps |

### Bulk User Creation

Use the Keycloak Admin API:

```bash
# Get admin token
TOKEN=$(curl -s -X POST "https://auth.scalenix.fr/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=$KC_ADMIN_PASSWORD" \
  -d "grant_type=password" | jq -r .access_token)

# Create user
curl -s -X POST "https://auth.scalenix.fr/admin/realms/scalenix-os/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@scalenix.fr",
    "firstName": "New",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{"type": "password", "value": "temp-password", "temporary": true}]
  }'
```

### LDAP/AD Federation

Keycloak supports LDAP and Active Directory federation. Configure in:
Admin Console > User Federation > Add provider > LDAP

---

## Troubleshooting

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| **502 Bad Gateway** | Service not started yet | Wait 30-60s, check `docker compose logs <service>` |
| **Keycloak redirect loop** | Wrong redirect URI | Verify `redirectUris` in Keycloak client settings |
| **Iframe blank/refused** | CSP `frame-ancestors` missing | Add `frame-ancestors 'self' https://os.scalenix.fr` to service |
| **"Invalid token" errors** | Clock skew between containers | Sync time with NTP: `timedatectl set-ntp true` |
| **Nextcloud OIDC fails** | TLS verification on self-signed cert | Set `oidc_login_tls_verify` to `false` |
| **Xpra mouse not working** | iframe `sandbox` attribute | Do NOT add `sandbox` attribute to Xpra iframes |
| **Keycloak 24 proxy issues** | Wrong proxy config | Use `KC_PROXY_HEADERS: xforwarded`, NOT `KC_PROXY: edge` |

### Emergency Recovery

```bash
# Restart a single service
docker compose restart keycloak

# Rebuild and restart
docker compose up -d --build --force-recreate keycloak

# View real-time logs
docker compose logs -f --tail 50

# Shell into a container
docker compose exec keycloak bash

# Reset everything (WARNING: destroys all data)
docker compose down -v
docker compose up -d --build
```
