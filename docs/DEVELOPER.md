# ScaleNix OS &mdash; Developer Guide

This guide covers the architecture, codebase conventions, and how to extend ScaleNix OS with new applications and features.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Application System](#application-system)
4. [Adding a New Native App](#adding-a-new-native-app)
5. [Adding a New Iframe App](#adding-a-new-iframe-app)
6. [Adding a New Desktop Widget](#adding-a-new-desktop-widget)
7. [State Management](#state-management)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Authentication](#authentication)
10. [API Clients](#api-clients)
11. [Testing](#testing)
12. [Code Conventions](#code-conventions)
13. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ScaleNix OS Shell (React)                │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌────────┐ │  │
│  │  │ Taskbar  │ │ Launcher │ │ Spotlight  │ │Widgets │ │  │
│  │  └─────────┘ └──────────┘ └────────────┘ └────────┘ │  │
│  │  ┌───────────────────────────────────────────────────┐│  │
│  │  │            Window Manager (Zustand)               ││  │
│  │  │  ┌─────────┐ ┌──────────┐ ┌───────────────────┐  ││  │
│  │  │  │ Native  │ │ Iframe   │ │ Xpra              │  ││  │
│  │  │  │ Apps    │ │ Apps     │ │ Apps               │  ││  │
│  │  │  │ (React) │ │ (embed)  │ │ (oauth2-proxy)    │  ││  │
│  │  │  └─────────┘ └──────────┘ └───────────────────┘  ││  │
│  │  └───────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                      Traefik (TLS)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────┴────┐        ┌────┴────┐         ┌────┴────┐
   │Keycloak │        │Nextcloud│         │ Matrix  │
   │  (IdP)  │        │ + OODS  │         │ Synapse │
   └─────────┘        └─────────┘         └─────────┘
        │
   ┌────┴──────────────────────────────────────────┐
   │  Zimbra  Ghost  Outline  Grist  LiveKit  ...  │
   └───────────────────────────────────────────────┘
```

### Authentication Flow

1. User opens `os.scalenix.fr`
2. `keycloak-js` redirects to `auth.scalenix.fr` (OIDC Authorization Code + PKCE)
3. User authenticates, token returned to shell
4. Token auto-refreshed every 60s
5. **Iframe apps**: share Keycloak session cookies (same `.scalenix.fr` domain)
6. **Xpra apps**: use `oauth2-proxy` ForwardAuth sidecar
7. **Native apps**: use token directly for API calls (WebDAV, Matrix, Grist, etc.)

---

## Frontend Architecture

### Tech Stack

- **React 18** with functional components and hooks
- **Vite** for bundling (with `@tailwindcss/vite` plugin)
- **TypeScript** with strict mode
- **Tailwind CSS v4** (no `tailwind.config.js` needed)
- **Zustand** for state management (15+ stores)

### Key Source Directories

```
shell/src/
├── apps/           # One file per native app component
├── auth/           # keycloak.ts, AuthProvider.tsx, useAuth.ts
├── desktop/        # Desktop shell components
│   ├── Desktop.tsx       # Main desktop layout
│   ├── Taskbar.tsx       # Bottom taskbar with pinned apps, tray, clock
│   ├── Launcher.tsx      # Full-screen app launcher grid
│   ├── Spotlight.tsx     # Ctrl+K search overlay
│   ├── NotificationCenter.tsx
│   ├── QuickSettings.tsx
│   ├── CalendarPopup.tsx
│   ├── VolumePopup.tsx
│   ├── AltTabSwitcher.tsx
│   ├── Onboarding.tsx
│   └── widgets/          # Desktop widgets
├── windows/        # Window management
│   ├── Window.tsx        # Window container + NATIVE_APPS registry
│   ├── WindowManager.tsx # Renders all open windows
│   ├── TitleBar.tsx      # Window title bar with controls
│   └── useWindowDrag.ts  # Drag & resize hooks
├── store/          # Zustand stores
├── hooks/          # Custom hooks (useAutoTheme, useFullscreen, etc.)
├── i18n/           # Translation system
├── api/            # External API clients
├── components/     # Shared components (ContextMenu, Notification)
└── types/          # TypeScript interfaces
```

---

## Application System

ScaleNix OS has three types of applications:

### 1. Native Apps (`type: "native"`)

React components rendered directly inside the window. They have full access to stores, hooks, and the auth context.

**Examples**: File Explorer, Calculator, Settings, Kanban Board, Text Editor

### 2. Iframe Apps (`type: "iframe"`)

External web applications embedded in an iframe. They share Keycloak session cookies for authentication.

**Examples**: Zimbra, Nextcloud, Element, Ghost, OnlyOffice, Grist

### 3. Xpra Apps (`type: "xpra"`)

Linux desktop applications streamed via Xpra HTML5, protected by `oauth2-proxy` ForwardAuth.

**Examples**: Terminal, LibreOffice

### App Registry

All applications are declared in `shell/public/apps/registry.json`. This file is loaded at runtime by `appStore`, which resolves environment variable placeholders.

```typescript
// shell/src/types/app.types.ts
export interface AppManifest {
  id: string;                    // Unique identifier (kebab-case)
  label: string;                 // Display name (French fallback)
  icon: string;                  // Emoji icon
  description: string;           // Short description
  type: 'iframe' | 'xpra' | 'native';
  url?: string;                  // URL template (for iframe/xpra)
  keycloak_client?: string;      // Associated Keycloak client ID
  roles?: string[];              // Required realm roles
  sandboxPolicy?: string;        // Iframe sandbox attributes
  defaultSize: { w: number; h: number };
  category: 'communication' | 'productivity' | 'system' | 'tools' | 'multimedia';
  color: string;                 // Brand color (hex)
}
```

### Categories

| Category | Description |
|----------|-------------|
| `communication` | Email, chat, video, directory |
| `productivity` | Files, documents, spreadsheets, notes |
| `tools` | Terminal, calculator, code editor, utilities |
| `multimedia` | Media players, photo management |
| `system` | Settings, admin tools, task manager |

---

## Adding a New Native App

Follow these 5 steps:

### Step 1: Create the Component

Create `shell/src/apps/MyApp.tsx`:

```tsx
import { useThemeStore } from '../store/themeStore';
import { useI18n } from '../i18n';

export function MyApp() {
  const colors = useThemeStore((s) => s.colors);
  const t = useI18n((s) => s.t);

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: colors.surface, color: colors.textPrimary }}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold">{t('myApp.title')}</h2>
        {/* Your app content */}
      </div>
    </div>
  );
}
```

### Step 2: Register in the App Registry

Add an entry to `shell/public/apps/registry.json`:

```json
{
  "id": "my-app",
  "label": "My App",
  "icon": "🚀",
  "description": "Description of my app",
  "type": "native",
  "defaultSize": { "w": 800, "h": 600 },
  "category": "tools",
  "color": "#3b82f6"
}
```

### Step 3: Register in the Window Router

Import and add your component to the `NATIVE_APPS` map in `shell/src/windows/Window.tsx`:

```tsx
import { MyApp } from '../apps/MyApp';

const NATIVE_APPS: Record<string, React.FC> = {
  // ... existing apps
  'my-app': MyApp,
};
```

### Step 4: Add Translations

Add translation keys in `shell/src/i18n/translations.ts` for all 5 languages:

```typescript
// In each language object:
'app.my-app': 'My App',           // App name
'appDesc.my-app': 'Description',  // App description
'myApp.title': 'My App Title',    // Internal strings
```

### Step 5: Test

```bash
cd shell
npm run dev
# Open the app from the Launcher or Spotlight (Ctrl+K)
```

---

## Adding a New Iframe App

### Step 1: Add to Registry

Add an entry to `shell/public/apps/registry.json`:

```json
{
  "id": "my-service",
  "label": "My Service",
  "icon": "🌐",
  "description": "My external service",
  "type": "iframe",
  "url": "${MY_SERVICE_URL}",
  "keycloak_client": "my-service",
  "roles": ["user"],
  "sandboxPolicy": "allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox",
  "defaultSize": { "w": 1280, "h": 800 },
  "category": "productivity",
  "color": "#3b82f6"
}
```

### Step 2: Add Environment Variable

Add the URL resolver in `shell/src/store/appStore.ts`:

```typescript
function resolveEnvVars(url: string): string {
  return url
    // ... existing entries
    .replace('${MY_SERVICE_URL}', import.meta.env.VITE_MY_SERVICE_URL ?? '');
}
```

Add to `.env.example`:

```
VITE_MY_SERVICE_URL=https://myservice.scalenix.fr
```

### Step 3: Configure Keycloak Client

Add a client in `infra/keycloak/realm-scalenix.json`:

```json
{
  "clientId": "my-service",
  "name": "My Service",
  "enabled": true,
  "publicClient": false,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "secret": "changeme",
  "rootUrl": "https://myservice.scalenix.fr",
  "redirectUris": ["https://myservice.scalenix.fr/*"],
  "webOrigins": ["https://myservice.scalenix.fr"],
  "fullScopeAllowed": true
}
```

### Step 4: Add Docker Service

Add the service to `infra/docker-compose.yml` with appropriate Traefik labels:

```yaml
my-service:
  image: myservice:latest
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.my-service.rule=Host(`myservice.scalenix.fr`)"
    - "traefik.http.routers.my-service.tls=true"
  networks:
    - scalenix
```

### Step 5: Add Translations

```typescript
'app.my-service': 'My Service',
'appDesc.my-service': 'My external service description',
```

---

## Adding a New Desktop Widget

### Step 1: Create the Widget Component

Create `shell/src/desktop/widgets/MyWidget.tsx`:

```tsx
import { useThemeStore } from '../../store/themeStore';

export function MyWidget() {
  const colors = useThemeStore((s) => s.colors);

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl backdrop-blur-md select-none"
      style={{
        background: `${colors.surface}cc`,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
      }}
    >
      <div className="px-3 py-2 rounded-t-xl" style={{ background: '#3b82f622' }}>
        <span className="text-xs font-semibold">My Widget</span>
      </div>
      <div className="flex-1 p-3">
        {/* Widget content */}
      </div>
    </div>
  );
}
```

### Step 2: Register in WidgetLayer

Add your widget to `shell/src/desktop/widgets/WidgetLayer.tsx`:

```tsx
import { MyWidget } from './MyWidget';

// In the WIDGET_COMPONENTS map:
const WIDGET_COMPONENTS: Record<string, React.FC> = {
  // ... existing widgets
  'my-widget': MyWidget,
};
```

### Step 3: Add to Widget Store

Register the widget type in `shell/src/store/widgetStore.ts`:

```typescript
// In WIDGET_CATALOG:
{ id: 'my-widget', label: 'My Widget', icon: '🚀', defaultSize: { w: 280, h: 200 } },
```

---

## State Management

ScaleNix OS uses **Zustand** for all state management. Each store is a standalone module with no cross-dependencies (stores access each other via `getState()` when needed).

### Store Overview

| Store | File | Purpose |
|-------|------|---------|
| `windowStore` | `store/windowStore.ts` | Open windows, positions, z-index, focus, snap, PiP |
| `appStore` | `store/appStore.ts` | App registry loaded from `registry.json` |
| `notifStore` | `store/notifStore.ts` | System notification queue |
| `themeStore` | `store/themeStore.ts` | Theme colors, dark/light mode, wallpaper |
| `desktopStore` | `store/desktopStore.ts` | Desktop icons, layout |
| `widgetStore` | `store/widgetStore.ts` | Widget instances, positions, sizes |
| `shortcutStore` | `store/shortcutStore.ts` | Global keyboard shortcuts |
| `volumeStore` | `store/volumeStore.ts` | System volume, mute state |
| `audioStore` | `store/audioStore.ts` | Notification sounds |
| `clipboardStore` | `store/clipboardStore.ts` | Cross-app clipboard |
| `clipboardHistoryStore` | `store/clipboardHistoryStore.ts` | Clipboard history |
| `kanbanStore` | `store/kanbanStore.ts` | Kanban boards & cards |
| `rssStore` | `store/rssStore.ts` | RSS feed subscriptions |
| `screenshotStore` | `store/screenshotStore.ts` | Screenshot history |
| `profileStore` | `store/profileStore.ts` | User profile data |
| `lockStore` | `store/lockStore.ts` | Lock screen state |
| `presenceStore` | `store/presenceStore.ts` | User online/away status |
| `workspaceStore` | `store/workspaceStore.ts` | Virtual desktop workspaces |
| `appPrefsStore` | `store/appPrefsStore.ts` | App pinning & disabling |
| `badgeStore` | `store/badgeStore.ts` | Taskbar badge counters |

### Persistence

Most stores persist to `localStorage` using Zustand's `persist` middleware. The key convention is `scalenix-{storeName}`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMyStore = create(
  persist(
    (set) => ({
      // state & actions
    }),
    { name: 'scalenix-my-store' }
  )
);
```

---

## Internationalization (i18n)

ScaleNix OS supports 5 languages: **French (fr)**, **English (en)**, **Italian (it)**, **Spanish (es)**, **German (de)**.

### How It Works

- Translations are in `shell/src/i18n/translations.ts` (~560 keys per language)
- The `useI18n` Zustand store manages the current language
- Language is persisted in `localStorage` and auto-detected from browser settings

### Using Translations

```tsx
import { useI18n } from '../i18n';

function MyComponent() {
  const t = useI18n((s) => s.t);

  return <p>{t('myApp.title')}</p>;
}
```

### Variable Interpolation

```typescript
// Definition:
'files.deleteConfirm': 'Delete {count} files?',

// Usage:
t('files.deleteConfirm', { count: '5' })  // "Delete 5 files?"
```

### App Name/Description Translation

App names from `registry.json` are translated at render time using `app.{id}` and `appDesc.{id}` keys:

```typescript
import { useAppLabel, useAppDesc } from '../i18n';

const label = useAppLabel('calculator', app.label);  // Translated or fallback
const desc = useAppDesc('calculator', app.description);
```

### Adding a New Translation Key

1. Add the key in ALL 5 language objects in `translations.ts`
2. Use the key with `t('my.key')` in your component

---

## Authentication

### Setup

Authentication is handled by `keycloak-js`. Configuration is in `shell/src/auth/keycloak.ts`:

```typescript
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT,
});
```

### Using Auth in Components

```tsx
import { useAuth } from '../auth/useAuth';

function MyComponent() {
  const { user, token, keycloak } = useAuth();

  // user.preferred_username, user.name, user.email
  // token: current access token (auto-refreshed)
  // keycloak: raw keycloak-js instance
}
```

### Role-Based Access

Apps can require specific roles via the `roles` field in `registry.json`. The Launcher, Spotlight, and App Store all filter apps based on the user's realm roles.

```json
{ "roles": ["admin", "developer"] }  // Only admin OR developer can see this app
```

---

## API Clients

### WebDAV (Nextcloud Files)

`shell/src/apps/webdav.ts` provides CRUD operations against Nextcloud WebDAV:

```typescript
import { listFiles, uploadFile, deleteFile, moveFile } from './webdav';
```

### Matrix (Chat)

`shell/src/api/matrixClient.ts` handles Matrix login, sync, room listing, and messaging.

### Grist (Spreadsheets)

`shell/src/api/gristClient.ts` provides organizations, workspaces, documents, tables, and records APIs.

### Zimbra (Mail/Calendar)

`shell/src/api/zimbraSoap.ts` handles Zimbra SOAP API for preauth token generation.

---

## Testing

### E2E Tests (Playwright)

```bash
cd shell

# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/desktop.spec.ts

# Run with UI mode
npx playwright test --ui

# Run with trace
npx playwright test --trace on
```

### Test Structure

| File | Tests |
|------|-------|
| `auth.spec.ts` | Login, logout, role verification |
| `desktop.spec.ts` | Desktop rendering, taskbar, launcher |
| `windows.spec.ts` | Window open/close/drag/resize/snap |
| `features.spec.ts` | File explorer, settings, text editor |
| `widgets.spec.ts` | Widget display and interaction |
| `services.spec.ts` | Service availability, API endpoints |
| `new-features.spec.ts` | Spotlight, audio, clipboard, shortcuts |

### Test Credentials

Test passwords are externalized via the `E2E_PASSWORD` environment variable:

```bash
E2E_PASSWORD=mypassword npx playwright test
```

---

## Code Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `FileExplorer.tsx`)
- Stores: `camelCaseStore.ts` (e.g., `windowStore.ts`)
- Hooks: `useCamelCase.ts` (e.g., `useAutoTheme.ts`)
- Types: `camelCase.types.ts`

### Component Structure
- Functional components only (no class components)
- Theme colors via `useThemeStore((s) => s.colors)`
- Text via `useI18n((s) => s.t)` for all user-facing strings
- Inline styles for dynamic theme colors, Tailwind for layout

### Styling
- Tailwind CSS v4 (JIT, no config file)
- Dynamic colors from theme store via `style={{ color: colors.textPrimary }}`
- Backdrop blur: `backdrop-blur-md` on overlays and widgets
- Rounded corners: `rounded-xl` for panels, `rounded-lg` for cards

---

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| App doesn't appear in Launcher | Missing from `registry.json` or user lacks required role | Check `roles` field and user's realm roles |
| Native app shows blank window | Not registered in `NATIVE_APPS` map in `Window.tsx` | Add import + entry to the map |
| Iframe app shows CORS error | Service not configured for `frame-ancestors` | Add CSP header on the service: `frame-ancestors 'self' https://os.scalenix.fr` |
| Environment variable not resolved | Missing `resolveEnvVars` entry in `appStore.ts` | Add the `.replace()` line for your variable |
| Translation shows key instead of text | Key missing in one or more languages | Add key to ALL 5 language objects in `translations.ts` |
| Keycloak redirect loop | Client misconfigured | Check `redirectUris` and `webOrigins` in realm JSON |
| Tailwind class not working | Tailwind v4 uses different syntax than v3 | Check [Tailwind v4 docs](https://tailwindcss.com/docs) |

---

## Architecture Decision Records

### Why Zustand over Redux?
Minimal boilerplate, no providers needed, easy store composition, built-in persistence middleware.

### Why Runtime Registry (`registry.json`) over Hardcoded?
Allows deployment-time customization without rebuilding. Admins can add/remove apps by editing a JSON file.

### Why Iframe Embedding over API Integration?
Leverages existing web UIs of mature applications (Zimbra, Nextcloud, Element). Session cookies shared via same-domain Keycloak SSO.

### Why Tailwind CSS v4?
JIT compilation, no config file, CSS-first approach, smaller bundle. The `@tailwindcss/vite` plugin handles everything.
