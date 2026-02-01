---
description: How to build the project for distribution
---

# Build Workflow

## Prerequisites
- Node.js 18+
- npm or pnpm

## Quick Build

// turbo
```bash
# Currently the project is a single-file userscript
# Just copy src/nix-helper.user.js to use
```

## Available Versions

### 1. Tampermonkey Userscript (Recommended)
**File**: `src/nix-helper.user.js`

Auto-loads when visiting NIX LMS websites. Install via Tampermonkey.

### 2. Console Paste Version
**File**: `paste-to-console.js`

Copy and paste into browser console (F12).

## Future: Bundled Build

When modules are separated, use:

```bash
npm run build
```

This will bundle all modules into `dist/paste-to-console.js`.
