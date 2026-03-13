# Contributing to ScaleNix OS

First off, thank you for considering contributing to ScaleNix OS! Every contribution helps make this project better for everyone.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Adding a New App](#adding-a-new-app)
- [Adding Translations](#adding-translations)
- [Running Tests](#running-tests)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

This project follows a simple rule: **be respectful**. We're building software together. Treat others the way you'd like to be treated. Harassment, discrimination, and toxic behavior will not be tolerated.

---

## How Can I Contribute?

There are many ways to contribute, and not all of them involve writing code:

| Contribution | Description |
|-------------|-------------|
| **Bug Reports** | Found a bug? [Open an issue](#reporting-bugs) |
| **Feature Requests** | Have an idea? [Suggest it](#requesting-features) |
| **Code** | Fix a bug, add a feature, improve performance |
| **Documentation** | Improve guides, add examples, fix typos |
| **Translations** | Add or improve translations for the 5 supported languages |
| **Testing** | Write E2E tests, test on different browsers |
| **Design** | Improve UI/UX, create icons, refine themes |
| **Security** | Report vulnerabilities (see [Security](#security)) |

---

## Development Setup

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Git**
- A modern browser (Chrome, Firefox, Edge, Safari)

### Getting Started

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ScaleNixOS.git
cd ScaleNixOS

# 3. Set up the frontend
cd shell
cp .env.example .env
npm install

# 4. Start the dev server
npm run dev
# Opens at http://localhost:3000
```

> **Note:** The frontend can run standalone for UI development. For full integration (Keycloak, Nextcloud, etc.), you'll need the Docker infrastructure. See the [Admin Guide](docs/ADMIN.md).

### Running the Full Stack

```bash
cd infra
cp .env.example .env     # Configure secrets
docker compose up -d --build
```

---

## Project Architecture

Understanding the architecture will help you contribute effectively.

```
shell/src/
├── apps/           # One React component per native app
├── auth/           # Keycloak OIDC integration
├── desktop/        # Shell UI (Taskbar, Launcher, Spotlight, etc.)
│   └── widgets/    # Desktop widgets
├── windows/        # Window Manager (Window.tsx, TitleBar, drag/resize)
├── store/          # Zustand stores (state management)
├── hooks/          # Custom React hooks
├── i18n/           # Translation system
├── api/            # External API clients
├── components/     # Shared UI components
└── types/          # TypeScript interfaces
```

### Key Concepts

| Concept | Location | Description |
|---------|----------|-------------|
| **App Registry** | `public/apps/registry.json` | JSON file listing all apps (loaded at runtime) |
| **Native Apps** | `src/apps/*.tsx` | React components rendered in windows |
| **Window Router** | `src/windows/Window.tsx` | Maps app IDs to components via `NATIVE_APPS` |
| **Stores** | `src/store/*.ts` | Zustand stores for all state management |
| **Theme** | `src/store/themeStore.ts` | Dark/light colors accessed via `useThemeStore` |
| **i18n** | `src/i18n/translations.ts` | All translations (~560 keys x 5 languages) |

> **Full architecture details:** [Developer Guide](docs/DEVELOPER.md)

---

## Making Changes

### Branch Naming

Use descriptive branch names with a prefix:

| Prefix | Use For |
|--------|---------|
| `feat/` | New features (`feat/add-weather-widget`) |
| `fix/` | Bug fixes (`fix/window-snap-offset`) |
| `docs/` | Documentation (`docs/improve-admin-guide`) |
| `i18n/` | Translations (`i18n/add-portuguese`) |
| `refactor/` | Code improvements (`refactor/simplify-stores`) |
| `test/` | Test additions (`test/add-launcher-tests`) |

### Workflow

```bash
# 1. Create a branch from main
git checkout -b feat/my-feature main

# 2. Make your changes

# 3. Run tests
cd shell && npx playwright test

# 4. Commit (see commit message format below)
git add -A
git commit -m "feat: add weather widget to desktop"

# 5. Push and open a PR
git push origin feat/my-feature
```

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, CI, dependencies |
| `i18n` | Translation additions or fixes |

### Examples

```
feat: add Portuguese translation
fix: window snap not aligning to screen edge
docs: add troubleshooting section to admin guide
refactor: simplify appStore loading logic
test: add e2e tests for widget drag and drop
i18n: fix German translation for settings page
```

---

## Pull Request Process

### Before Submitting

- [ ] Your code builds without errors (`npm run build`)
- [ ] Tests pass (`npx playwright test`)
- [ ] You've added translations for all 5 languages (if adding UI text)
- [ ] You've tested in both dark and light themes
- [ ] Your branch is up to date with `main`

### PR Template

When opening a PR, please include:

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2

## Screenshots
(If applicable, include before/after screenshots)

## Testing
- [ ] Tested locally
- [ ] E2E tests pass
- [ ] Tested dark/light theme
- [ ] Tested multiple languages
```

### Review Process

1. A maintainer will review your PR
2. Feedback may be requested &mdash; this is normal and collaborative
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

---

## Code Style

### General Rules

- **Functional components** only (no class components)
- **TypeScript** with strict mode &mdash; no `any` unless absolutely necessary
- **Tailwind CSS v4** for layout, inline `style` for dynamic theme colors
- **No comments** unless the logic is non-obvious
- **No console.log** in production code (use `console.error` for actual errors)

### Component Pattern

```tsx
import { useThemeStore } from '../store/themeStore';
import { useI18n } from '../i18n';

export function MyComponent() {
  const colors = useThemeStore((s) => s.colors);
  const t = useI18n((s) => s.t);

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: colors.surface, color: colors.textPrimary }}
    >
      <h2>{t('myComponent.title')}</h2>
    </div>
  );
}
```

### Key Conventions

| Rule | Details |
|------|---------|
| **Theme colors** | Always use `colors.surface`, `colors.textPrimary`, etc. &mdash; never hardcode colors |
| **Text strings** | Always use `t('key')` &mdash; never hardcode user-facing text |
| **File naming** | `PascalCase.tsx` for components, `camelCaseStore.ts` for stores |
| **State** | Zustand stores, never React context for global state |
| **Imports** | Relative paths (`../store/themeStore`), no path aliases |

---

## Adding a New App

This is a common contribution. Follow these steps:

### Native App (React component)

1. Create `shell/src/apps/MyApp.tsx`
2. Add entry to `shell/public/apps/registry.json`
3. Add import + entry in `NATIVE_APPS` map in `shell/src/windows/Window.tsx`
4. Add translations in `shell/src/i18n/translations.ts` (all 5 languages)
5. Test via Launcher or Spotlight

### Iframe App (embedded service)

1. Add entry to `shell/public/apps/registry.json` with `"type": "iframe"`
2. Add URL resolver in `shell/src/store/appStore.ts`
3. Add `VITE_*` env var to `shell/.env.example`
4. Add Keycloak client in `infra/keycloak/realm-scalenix.json`
5. Add Docker service in `infra/docker-compose.yml`
6. Add translations

> **Detailed guide with code examples:** [Developer Guide &mdash; Adding Apps](docs/DEVELOPER.md#adding-a-new-native-app)

---

## Adding Translations

ScaleNix OS supports 5 languages. All translations live in `shell/src/i18n/translations.ts`.

### Adding a Translation Key

When adding any user-facing text, you **must** add it in ALL 5 languages:

```typescript
// shell/src/i18n/translations.ts

// French (fr)
'myApp.greeting': 'Bonjour !',

// English (en)
'myApp.greeting': 'Hello!',

// Italian (it)
'myApp.greeting': 'Ciao!',

// Spanish (es)
'myApp.greeting': 'Hola!',

// German (de)
'myApp.greeting': 'Hallo!',
```

### Key Naming Convention

```
app.{appId}          → App name in launcher
appDesc.{appId}      → App description
{appName}.{key}      → Internal app strings
settings.{key}       → Settings page strings
desktop.{key}        → Desktop shell strings
```

### Adding a New Language

To add a 6th language (e.g., Portuguese):

1. Add a new language object in `translations.ts` with ALL existing keys
2. Add the locale code to the `Lang` type
3. Add the language option in `Settings.tsx` (`LANG_OPTIONS` array)
4. Test the language switcher

---

## Running Tests

### E2E Tests (Playwright)

```bash
cd shell

# Run all tests
npx playwright test

# Run a specific file
npx playwright test e2e/desktop.spec.ts

# Run with browser visible
npx playwright test --headed

# Run with Playwright UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

### Test Structure

```
shell/e2e/
├── auth.spec.ts          # Login, logout, roles
├── desktop.spec.ts       # Desktop, taskbar, launcher
├── windows.spec.ts       # Window management
├── features.spec.ts      # File explorer, settings, editor
├── widgets.spec.ts       # Desktop widgets
├── services.spec.ts      # Service health checks
├── new-features.spec.ts  # Spotlight, audio, clipboard, shortcuts
└── helpers.ts            # Shared test utilities
```

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';
import { login, waitForDesktop } from './helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'malik');
    await waitForDesktop(page);
  });

  test('should do something', async ({ page }) => {
    // Your test
  });
});
```

> **Note:** Test credentials are externalized via `E2E_PASSWORD` env var. Never hardcode passwords.

---

## Reporting Bugs

When reporting a bug, please include:

1. **Steps to reproduce** &mdash; clear, numbered steps
2. **Expected behavior** &mdash; what should happen
3. **Actual behavior** &mdash; what actually happens
4. **Screenshots** &mdash; if applicable
5. **Environment** &mdash; browser, OS, screen resolution
6. **Console errors** &mdash; open DevTools (F12) > Console tab

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**Steps to reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: Chrome 120
- OS: macOS 14
- Screen: 1920x1080
```

---

## Requesting Features

We love feature ideas! When suggesting a feature:

1. **Check existing issues** &mdash; it might already be requested
2. **Describe the use case** &mdash; why is this useful?
3. **Propose a solution** &mdash; how would it work?

### Feature Request Template

```markdown
**Is your feature related to a problem?**
A description of the problem. E.g., "I'm always frustrated when..."

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought of.

**Additional context**
Screenshots, mockups, or examples from other projects.
```

---

## Security

If you discover a security vulnerability, **do not** open a public issue. Instead, please contact us directly at **security@scalenix.fr** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours and work with you to address the issue.

---

## Recognition

All contributors are valued! Contributors will be:

- Listed in the project's contributors section
- Credited in release notes for significant contributions
- Thanked in the community

---

<p align="center">
  <strong>Thank you for contributing to ScaleNix OS!</strong>
  <br />
  Every contribution, no matter how small, makes a difference.
</p>
