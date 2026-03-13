# ScalenixOS — Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Domain `scalenix.fr` with DNS records:
  - `os.scalenix.fr` → server IP
  - `auth.scalenix.fr` → server IP
  - `terminal.scalenix.fr` → server IP
  - `libreoffice.scalenix.fr` → server IP
- Ports 80 and 443 open

## Development Setup

```bash
# 1. Clone
git clone <repo> && cd scalenix-os

# 2. Configure environment
cp infra/.env.example infra/.env
cp shell/.env.example shell/.env
# Edit .env files with your values

# 3. Start infrastructure
cd infra
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. Or run shell locally (without Docker)
cd shell
npm install
npm run dev
```

The dev shell runs on `http://localhost:3000` with hot reload.

## Production Deployment

```bash
# 1. Configure environment
cp infra/.env.example infra/.env
# Edit infra/.env — change ALL passwords and secrets

# 2. Update Keycloak client secrets
# Edit infra/keycloak/realm-scalenix.json
# Replace all CHANGE_ME_* values with generated secrets

# 3. Deploy
cd infra
docker compose up -d --build

# 4. Verify
docker compose ps
curl -I https://os.scalenix.fr
```

## Post-deployment

1. Log in to Keycloak admin: `https://auth.scalenix.fr/admin`
2. Change default admin password
3. Update client secrets to match your .env configuration
4. Create real users or configure LDAP/AD federation
5. Configure Nextcloud and Zimbra OIDC integration with their respective client IDs

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Base domain (e.g., `scalenix.fr`) |
| `KC_ADMIN_PASSWORD` | Keycloak admin password |
| `KC_DB_PASSWORD` | Keycloak PostgreSQL password |
| `OAUTH2_PROXY_CLIENT_SECRET` | oauth2-proxy Keycloak client secret |
| `OAUTH2_PROXY_COOKIE_SECRET` | 32-char cookie encryption secret |
