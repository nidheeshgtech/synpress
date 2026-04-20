# Synpress

> WordPress Sync Manager for teams — push, pull and deploy everything between local and live with one click.

## What is Synpress?

Synpress is an internal organization tool that makes WordPress development workflows simple. Instead of manually running terminal commands to sync databases, plugins, themes and files between your local environment and live server — Synpress gives your whole team a beautiful dashboard to do it all from one place.

No more forgetting steps. No more broken live sites. No more "who pushed what".

## Features

- 🗄 **Database Sync** — Pull or push your WordPress DB with automatic URL search-replace
- 🎨 **Theme Files** — Sync your theme changes local ↔ live instantly
- ⬡ **Plugin Manager** — Keep plugins in sync across environments
- 🖼 **Media / Uploads** — Sync your wp-content/uploads folder
- ◎ **Git Integration** — Commit, push and pull via Git all from the dashboard
- ⚡ **Selective Sync** — Choose exactly what to push or pull, not everything at once
- 👥 **Team Access** — Multiple team members, one centralized tool
- 📋 **Activity Log** — See who synced what and when
- 🖥 **Terminal Log** — Watch commands run in real time

## How it Works

Synpress runs as a local Node.js server on your machine or organization server. Your team opens it in the browser and connects to the live WordPress site via SSH. All the complex terminal commands (WP-CLI, rsync, git) run behind the scenes.

```
Your Local Machine
      ↕  SSH + Git + WP-CLI
   Synpress Dashboard
      ↕
Live WordPress Server
```

## Tech Stack

- **Frontend** — HTML, CSS, JavaScript
- **Backend** — Node.js + Express
- **Sync** — WP-CLI, Git, rsync, SSH
- **Config** — JSON based site configuration

## Status

🚧 Currently in active development — prototype UI complete.

---

Built for teams who work with WordPress every day.
