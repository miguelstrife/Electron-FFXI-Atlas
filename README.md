# 🗺️ FFXI Atlas – Interactive Map Viewer for Final Fantasy XI

FFXI Atlas is a cross-platform Electron app that displays zone maps from *Final Fantasy XI* and tracks your character's real-time location using Ashita v4. Whether you're navigating the dunes of Valkurm or the depths of Uleguerand Range, FFXI Atlas helps you find your way—just like a personal Navi-map for Vana'diel.

![FFXI Atlas Screenshot](assets/screenshot.gif)

## ✨ Features

- 🧭 Real-time player position tracking (requires Ashita v4)
- 🌍 Interactive, high-resolution maps for all FFXI zones
- 🔍 Zoom, pan, and coordinate grid overlays
- 🔄 Automatic zone detection (requires Ashita v4)
- 💡 Lightweight communication bridge via UDP/WebSocket
- ⚔️ Designed for adventurers, collectors, and explorers

---

## 🚀 Getting Started

### Prerequisites

- [Ashita v4](https://github.com/AshitaXI/Ashita-v4beta) installed and configured
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [FFXI](http://www.playonline.com/ff11us/download/media/install_win.html) installed via Square Enix or Steam.
- A map pack. [Remapster](https://github.com/AkadenTK/remapster_maps/releases) wiki packs 1024 are recommended.
  
### 1. Clone the Repository

```bash
git clone https://github.com/miguelstrife/electron-ffxi-atlas.git
cd electron-ffxi-atlas.git
```

### 2. Install dependencies
```bash
cd electron-ffxi-atlas
npm install
```

### 3. Run application
```bash
npm run start
```
### 4. Add your map pack
- Place your map pack inside ```assets\maps```. Naming should be in snake_case convention. 
  
### 5. Configure Ashita v4 plugin
- Download Ashita v4
- Create a folder named 'ffxiatlas' in your Ashita v4 addon directory, usually ```ashita-v4\addons\ffxiatlas\ffxiatlas.lua``` 
- Copy ```ffxiatlas.lua``` from ```scripts\ashita\addon\ffxiatlas.lua```
- In your Ashita load script, add ```/addon load ffxiatlas``` or type it in the chatbox once you character is loaded in FFXI.
