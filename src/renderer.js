
const PlayerDotInit = { X: 512, Y: 512 };
const No_Map = '../assets/maps/no_map.png';
var Player = { X: 512, Y: 512 , Z: 0, ZoneId: 0, ZoneName: 'Unknown' };

function gameToPixels(x, z, areaType, offsetX, offsetY) {
    const positionX2d = (x * (areaType / 2)) + (offsetX * 2);
    const positionY2d = (z * -1 *((areaType / 2 )) + (offsetY * 2));
    // const px = ((x + 255) / 510) * 1024;
    // const py = ((255 - z) / 510) * 1024;
    // return { x: px, y: py };
    return { x: positionX2d, y: positionY2d };
}

function getPlayerData() {
    return 'Player Data: ' + JSON.stringify(Player);
}

(async () => {
    const app = new PIXI.Application();
    await app.init({ background: '#1099bb', width: 1024, height: 1024 });
    document.getElementById('map-container').appendChild(app.canvas);
    // document.body.appendChild(app.canvas);

    // Create graphics context
    
    // Create a container for the map
    const mapContainer = new PIXI.Container();

    app.stage.addChild(mapContainer);
    // Move the container to the center
    mapContainer.x = 0;
    mapContainer.y = 0;
    
    // Load zones dictionary
    const zones = window.ffxiAtlas.loadZones();
    
    // Load the map
    const mapTexture = await PIXI.Assets.load(No_Map);
    const mapSprite = new PIXI.Sprite(mapTexture);
    mapContainer.addChild(mapSprite);

    // Player navigator
    const navigatorTexture = await PIXI.Assets.load('../assets/compass/playerNavigator.png');
    const playerNavigator = new PIXI.Sprite(navigatorTexture);
    const playerContainer = new PIXI.Container();
    mapContainer.addChild(playerContainer);
    playerContainer.x = 0;
    playerContainer.y = 0;
    playerContainer.addChild(playerNavigator);
    playerNavigator.anchor.set(0.5, 0.5);
    playerNavigator.position.set(PlayerDotInit.X, PlayerDotInit.Y);
    playerNavigator.scale.set(0.5, 0.5);

    // mapContainer.addChild(playerNavigator);
    
    // Listen for Ashita UDP dat
    let currentZoneId = -1;
    window.ffxiAtlas.onPositionUpdate(async ({ x, y, z, zoneId }) => {
        const currentZone = zones[zoneId];
    
        if (!currentZone) {
            console.warn(`Unknown zone ID: ${zoneId}`);
            mapSprite.texture = await PIXI.Assets.load(No_Map);
            return;
        }
        // If the zone has changed, update the map
        if (zoneId !== currentZoneId) {
            const mapName = currentZone.mapName;
            const mapPath =  `../assets/maps/${mapName}.png`;
            mapSprite.texture = await PIXI.Assets.load(mapPath);
            currentZoneId = zoneId;
        }

        const position2d = gameToPixels(x, z, currentZone.scale, currentZone.offsetX, currentZone.offSetY);
        // const { x: px, y: py } = gameToPixels(x, y);
        console.log(`Previous Position: x=${playerNavigator.position.x}, y=${playerNavigator.position.y}, zoneId=${zoneId}`);
        // Update player dot position
        playerNavigator.position = { x: position2d.x, y: position2d.y};
        Player = { X: position2d.x, Y: position2d.y, Z: z, ZoneId: zoneId, ZoneName: currentZone.mapName };
        document.getElementById('player-data').innerText = getPlayerData();
        console.log(`Player position updated: x=${playerNavigator.position.x}, y=${playerNavigator.position.y}, zoneId=${zoneId}`);
    });
})();