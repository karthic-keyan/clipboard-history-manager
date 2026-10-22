# Clipboard History Manager for Windows

A lightweight, high-performance Windows clipboard history manager built with **Electron**, **React**, **TypeScript**, and **SQLite (FTS5)**. 

Designed with Windows 11 Fluent Design aesthetics, glassmorphic acrylic visuals, instant global hotkey access, local full-text search, and privacy-first controls.

---

## ✨ Features

- ⚡ **Background Clipboard Monitoring**:
  - Automatically captures copied text, URLs, code snippets, rich HTML, and bounded PNG images.
  - Efficient polling loop (configurable 250ms–2000ms, default 500ms) with zero unnecessary database writes when clipboard is unchanged.
  - Internal application write protection prevents loops and duplicate entries when pasting back from the manager.
  - Instant Pause / Resume toggle via Titlebar, System Tray, or Settings.

- 🔍 **SQLite FTS5 Full-Text Search & Filtering**:
  - Full-text tokenized search powered by SQLite FTS5 with instant typing response.
  - Category filters: **All**, **Pinned ⭐**, **Text 📄**, **Code 💻**, **Links 🔗**, and **Images 🖼️**.
  - Time filters: **All Time**, **Today**, **Past 7 Days**, **Past 30 Days**.
  - Sorting: **Most Recent**, **Oldest First**, **Most Copied**.

- 📌 **Pinned Items Preservation**:
  - Pin important snippets to keep them permanently accessible.
  - Pinned items are never deleted by automatic retention rules or excess history pruning.

- 🚀 **Quick Access Overlay Window (Win+V / Raycast style)**:
  - Global keyboard shortcut (Default: `Ctrl+Shift+V` or `Alt+Shift+V`).
  - Seamless floating popup positioned near active cursor/screen center.
  - Auto-focused search input with instant keyboard navigation (`↑`/`↓` arrows, `Enter` to copy, `Esc` to close).
  - Quick-copy number hotkeys (`Ctrl+1` through `Ctrl+9` or `1`–`9`).

- 🛡️ **Privacy & Sensitive Data Protection**:
  - **100% Offline & Local**: No accounts, no telemetry, no cloud syncing. All data remains in local SQLite.
  - **Sensitive Data Detection**: Recognizes API tokens (GitHub, Stripe, AWS, OpenAI), JWTs, credit card patterns, and OTP verification codes.
  - **Password Masking**: Masks sensitive items behind bullets with a single-click peek toggle.
  - **Ignore Sensitive Mode**: Option to never save detected passwords or keys to SQLite.
  - **Configurable Retention**: Auto-cleanup after 1, 7, 30, 90 days, or unlimited.
  - **Instant History Purge**: One-click wipe of unpinned history with safety confirmation.

- 🪟 **Windows Native Integration**:
  - System Tray icon with right-click context menu (Open, Quick Access, Toggle Monitoring, Clear, Settings, Exit).
  - Configurable "Close to Tray" behavior to keep background monitoring active.
  - Auto-start with Windows preference (`openAtLogin`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Desktop Runtime** | Electron 35 |
| **Language** | TypeScript 5.8 |
| **UI Framework** | React 19 |
| **Build Tooling** | Vite 6 + `vite-plugin-electron` |
| **Styling** | Tailwind CSS 3 (Windows 11 Fluent Acrylic Dark Mode) |
| **State Management** | Zustand 5 |
| **Local Database** | SQLite (`better-sqlite3` compiled with FTS5) |
| **Schema Validation** | Zod 3 |
| **Testing** | Vitest 3 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (recommended v22+)
- npm 10+
- Windows 10 or 11

### Installation

```bash
# Clone or navigate to the repository
cd clipboard-history-manager

# Install dependencies
npm install

# Rebuild native SQLite module for Electron runtime
npm run rebuild
```

### Development

To start the application in development mode with hot-module replacement:

```bash
npm run dev
```

### Running Tests

Run the unit and integration test suite:

```bash
npm test
```

### Production Build

To compile TypeScript and bundle the application with Vite:

```bash
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `Ctrl+Shift+V` | Open / Toggle Quick Access floating popup |
| `Ctrl+F` | Focus search bar in Main Window |
| `↑` / `↓` | Navigate items in Quick Access or History |
| `Enter` | Copy selected item to clipboard |
| `Ctrl+1` .. `Ctrl+9` | Instant-copy items 1 through 9 |
| `Esc` | Dismiss / hide Quick Access popup |

---

## 📂 Project Architecture

```
clipboard-history-manager/
├── src/
│   ├── main/
│   │   ├── index.ts                     # Main process entry & lifecycle
│   │   ├── clipboard/
│   │   │   ├── monitor.ts               # Background polling & change detection
│   │   │   ├── reader.ts                # Clipboard reader (text, html, png images)
│   │   │   ├── normalizer.ts            # Type classification, sensitive detection & hash
│   │   │   └── deduplication.ts         # Duplicate detection & internal copy bypass
│   │   ├── database/
│   │   │   ├── connection.ts            # SQLite database manager & WAL mode
│   │   │   ├── migrations.ts            # Tables, FTS5 virtual table & auto-sync triggers
│   │   │   └── history-repository.ts    # CRUD, FTS search, pin, prune & stats
│   │   ├── services/
│   │   │   ├── history-service.ts       # Coordinator for clipboard & history ops
│   │   │   ├── retention-service.ts     # Scheduled retention & limit cleaner
│   │   │   └── privacy-service.ts       # Privacy, masking & exclusion rules
│   │   └── windows/
│   │       ├── window-manager.ts        # Main Window & Quick Access overlay
│   │       ├── shortcuts.ts             # Global keyboard shortcut manager
│   │       └── tray.ts                  # System Tray icon and menu
│   ├── preload/
│   │   └── index.ts                     # Context isolation bridge (`window.electronApi`)
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── TitleBar.tsx             # Windows Fluent titlebar with live badge
│   │   │   └── Toast.tsx                # Action feedback toast notification
│   │   ├── features/
│   │   │   ├── history/
│   │   │   │   ├── HistoryList.tsx      # Chronological history list & empty states
│   │   │   │   ├── ClipboardCard.tsx    # Card item with badge, copy, pin, delete
│   │   │   │   └── DetailModal.tsx      # Full inspector modal for text, code & images
│   │   │   ├── search/
│   │   │   │   └── SearchBar.tsx        # Search input, type pills & date filters
│   │   │   ├── quick-access/
│   │   │   │   └── QuickAccessView.tsx  # Raycast/Win+V compact keyboard overlay
│   │   │   └── settings/
│   │   │       └── SettingsModal.tsx    # General, Privacy, and Storage preferences
│   │   ├── stores/
│   │   │   └── useClipboardStore.ts     # Zustand reactive UI state store
│   │   ├── styles/
│   │   │   └── index.css                # Fluent acrylic CSS & scrollbars
│   │   ├── App.tsx                      # Root App routing (Main vs Quick Access)
│   │   └── main.tsx                     # React DOM bootstrap
│   └── shared/
│       ├── types/                       # TypeScript interfaces & API contract
│       ├── schemas/                     # Zod runtime validation schemas
│       └── constants/                   # Default settings & IPC channel definitions
├── tests/
│   ├── unit/
│   │   ├── normalizer.test.ts           # Type detection, sensitive data, stats
│   │   ├── deduplication.test.ts        # Hash caching & internal copy bypass
│   │   └── validation.test.ts           # Zod schema validation
│   └── integration/
│       └── database.test.ts             # SQLite migrations, FTS5 search & pruning
└── package.json
```

---

## 🔒 Privacy Guarantee

- **No Remote Calls**: The app does not make network requests.
- **Local Storage**: All history is saved in `%APPDATA%\clipboard-history-manager\data\clipboard-history.db`.
- **Sensitive Guard**: Automatic detection of passwords, secrets, and financial numbers with masking and optional discard.
- **Easy Erasure**: All history can be purged at any moment with one click.
