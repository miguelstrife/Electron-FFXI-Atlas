# 🗺️ FFXI Atlas – Interactive Map Viewer for Final Fantasy XI

FFXI Atlas is a cross-platform Electron app that displays zone maps from *Final Fantasy XI* and tracks your character's real-time location using Ashita v4. Whether you're navigating the dunes of Valkurm or the depths of Uleguerand Range, FFXI Atlas helps you find your way—just like a personal Navi-map for Vana'diel.

![FFXI Atlas Screenshot](assets/screenshot.png)

## ✨ Features

- 🧭 Real-time player position tracking (requires Ashita v4)
- 🌍 Interactive, high-resolution maps for all FFXI zones
- 🔍 Zoom, pan, and coordinate grid overlays
- 🔄 Automatic zone detection (based on Ashita memory reading)
- 💡 Lightweight communication bridge via UDP/WebSocket
- ⚔️ Designed for adventurers, collectors, and explorers

---

## 🚀 Getting Started

### Prerequisites

- [Ashita v4](https://ashita.atom0s.com/) installed and configured
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- FFXI installed via Square Enix or Steam.
- 
### 1. Clone the Repository

```bash
git clone https://github.com/miguelstrife/electron-ffxi-atlas.git
cd electron-ffxi-atlas.git
```

### 2. Run application
```bash
cd electron-ffxi-atlas.git
npm run start
```