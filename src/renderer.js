// import * as PIXI from './modules/pixi.min.js';
    // Coordinate transform
function gameToPixels(x, z) {
    const px = ((x + 255) / 510) * 1024;
    const py = ((255 - z) / 510) * 1024;
    return { x: px, y: py };
}

(async () => {
    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', resizeTo: window });
    document.body.appendChild(app.canvas);
    
    // Create a container for the map
    const mapContainer = new PIXI.Container();
    app.stage.addChild(mapContainer);
    
    // Load zones dictionary
    const zones = window.ffxiAtlas.loadZones();
    
    // Load the map
    const mapTexture = await PIXI.Assets.load('../assets/maps/valkurm_dunes.png');
    const mapSprite = new PIXI.Sprite(mapTexture);
    mapContainer.addChild(mapSprite);
    
    // Player dot
    const playerDot = new PIXI.Graphics()
        .circle(50, 50, 6)
        .stroke(0x00ff00)
        .lineStyle(5)
        .fill('red');
    app.stage.addChild(playerDot);
    
    // Listen for Ashita UDP dat
    let currentZoneId = -1;
    window.ffxiAtlas.onPositionUpdate(async ({ x, z, zoneId }) => {
        if (zoneId !== currentZoneId) {
            const mapName = zones[zoneId];
            if (!mapName) {
            console.warn(`Unknown zone ID: ${zoneId}`);
            return;
            }
            const mapPath =  `../assets/maps/${mapName}.png`;
            mapSprite.texture = await PIXI.Assets.load(mapPath);
            currentZoneId = zoneId;
        }
        const { x: px, y: py } = gameToPixels(x, z);
        playerDot.position.set(px, py);
    });
})();