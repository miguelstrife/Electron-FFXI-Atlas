// --- Constants and State ---
const PlayerNavigatorInit = { X: 512, Y: 512 };
const No_Map = '../assets/maps/no_map.png';
let isTrackingEnabled = true;
let zones = {}; // Will be loaded from file
let playerState = { lastX: 0, lastY: 0 };

// --- PIXI App Setup ---
const app = new PIXI.Application();
const mapContainer = new PIXI.Container();
const playerContainer = new PIXI.Container();
let mapSprite;
let playerNavigator;

// --- UI Element References ---
const trackingSwitch = document.getElementById('tracking-mode-switch');
const zoneSearchInput = document.getElementById('zone-search-input');
const zoneDatalist = document.getElementById('zone-datalist-options');
const playerDataZoneName = document.getElementById('player-data-zone-name');
const playerDataMapId = document.getElementById('player-data-map-id');
const playerDataCoords = document.getElementById('player-data-coords');


// --- Functions ---

/**
 * Converts FFXI game coordinates to pixel coordinates for the map.
 * @param {number} x - The player's X coordinate.
 * @param {number} y - The player's Y coordinate.
 * @param {object} zone - The zone object containing scale and offset data.
 * @returns {{x: number, y: number}} Pixel coordinates.
 */
function gameToPixels(x, y, map) {
    if (map === undefined || map.scale === undefined || map.offsetX === undefined || map.offsetY === undefined) {
        console.warn('Invalid map data for conversion:', map);
        return { x: 0, y: 0 };
    }
    // Convert game coordinates to pixel coordinates based on the map's scale and offset
    let posX, posY;  
    posX = 2 * (map.offsetX + map.scale * x);
    posY = 2 * (map.offsetY - map.scale * y);
   
    return { x: posX * 2, y: posY * 2 };
}

/**
 * Loads a map texture and displays it on the canvas.
 * @param {number} zoneId - The ID of the zone to load.
 * @param {number} mapId - The ID of the map to load.
 */
async function loadMap(zoneId, mapId) {
    const zone = zones[zoneId];
    let mapName = zone ? zone.mapName : 'no_map';
    let mapPath = `../assets/maps/${mapName}`;

    if(mapId === undefined || mapId === null || zone.maps.length === 1) {
        mapPath += '.png';
    }
    else {
        mapPath += `_${mapId}.png`;
    }

    try {
        mapSprite.texture = await PIXI.Assets.load(mapPath);
    } catch (error) {
        console.error(`Failed to load map: ${mapPath}`, error);
        mapSprite.texture = await PIXI.Assets.load(No_Map);
    }
}

/**
 * Updates the player data display on the UI.
 * @param {object} data - The player data object {x, y, z, zoneId, mapId}.
 */
function updatePlayerDataUI(data) {
    const zone = zones[data.zoneId];
    playerDataZoneName.textContent = zone ? zone.mapName.replace(/_/g, ' ') : 'Unknown';
    playerDataMapId.textContent = data.mapId || 'N/A';
    playerDataCoords.textContent = data.x ? `${data.x.toFixed(2)}, ${data.y.toFixed(2)}, ${data.z.toFixed(2)}` : 'N/A';
}

/**
 * Updates the player rotation (heading position) on the UI.
 * @param {object} position2d - The player position object {x, y}
 * @param {object} playerNavigator - The player navigator sprite.
 */
function calculateHeadingRotation(position2d, playerNavigator) {
    const dx = position2d.x - playerState.lastX;
    const dy = position2d.y - playerState.lastY;

    // Only update heading if the player has moved a meaningful amount
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        // Calculate the angle of movement and rotate the navigator
        // The PI/2 offset aligns the "up" pointing sprite with the direction of movement
        playerNavigator.rotation = Math.atan2(dy, dx) + (Math.PI / 2);
    }
    
    // Update the last known position for the next frame's calculation
    playerState.lastX = position2d.x;
    playerState.lastY = position2d.y;
}

/**
 * checks if the player is within a specified range.
 * @param {object} playerPosition - The player position object {x, y}   
 * @param {object} range - Ranges object containing x1, x2, y1, y2.
 * @returns {boolean} True if the player is within the range, false otherwise.
 */
function isPlayerInRange(playerPosition, range) {
    if (playerPosition.x < range.x1 || playerPosition.x > range.x2 || playerPosition.z > range.z2 ||
        playerPosition.y < range.y1 || playerPosition.y > range.y2 || playerPosition.z > range.z2) {
        return false; // Player is outside the range
    }
    return true; // Player is within the range
}

/**
 * checks in which map the player is based on their position.
 * This is necessary for zones with multiple maps.
 * @param {object} playerPosition - The player position object {x, y}
 * @param {object} zone - the zone object containing map data.
 * @returns {object} The map ID if found, null if not found.
 */
function getMapIdFromPlayerPosition(playerPosition, zone) {
    // Object.values will return an empty array for an empty object.
    const maps = Object.values(zone?.maps ?? {});

    for (const map of maps) {
        for (const range of Object.values(map.ranges)) {
            if (isPlayerInRange(playerPosition, range)) {
                return map; // Correctly returns the map and exits the function.
            }
        }
    }

    // This part is only reached if no map was found after checking all ranges.
    console.warn(`No map found for player position in zone ${zone.zoneId}. Player position:`, playerPosition);
    return null;
}

/**
 * Initializes the entire application.
 */
async function initialize() {
    // Init PIXI
    await app.init({ background: '#343a40', width: 1024, height: 1024 });
    document.getElementById('map-container').appendChild(app.canvas);
    app.stage.addChild(mapContainer);
    mapContainer.x = 0;
    mapContainer.y = 0;

    // Enable sorting on the container to respect zIndex.
    mapContainer.sortableChildren = true;

    // Load zone data and populate search
    zones = window.ffxiAtlas.loadZones();
    Object.entries(zones).forEach(([zoneId, zone]) => {
        const option = document.createElement('option');
        // Use a more readable format for the display value
        option.value = zone.mapName.replace(/_/g, ' ');
        // Store the mapId in a data attribute for easy retrieval
        option.dataset.zoneId = zoneId;
        zoneDatalist.appendChild(option);
    });

    // Load map and player assets
    const mapTexture = await PIXI.Assets.load(No_Map);
    mapSprite = new PIXI.Sprite(mapTexture);
    mapSprite.zIndex = 0; // Set map to be at the bottom layer
    mapContainer.addChild(mapSprite);

    const navigatorTexture = await PIXI.Assets.load('../assets/compass/playerNavigator.png');
    playerNavigator = new PIXI.Sprite(navigatorTexture);
    mapContainer.addChild(playerContainer);
    playerContainer.x = 0;
    playerContainer.y = 0;
    playerContainer.addChild(playerNavigator);
    playerNavigator.anchor.set(0.5, 0.5);
    playerNavigator.position.set(PlayerNavigatorInit.X, PlayerNavigatorInit.Y);
    playerNavigator.scale.set(0.5, 0.5);
    playerNavigator.visible = true; // Initially visible
    playerNavigator.zIndex = 1;
    
    let currentZoneId = -1;
    let currentMapId = -1;
    // --- Event Listeners ---

    // Listener for the tracking mode switch
    trackingSwitch.addEventListener('change', (event) => {
        isTrackingEnabled = event.target.checked;
        playerNavigator.visible = isTrackingEnabled;
        if (!isTrackingEnabled) {
            // Clear player data when tracking is off
            updatePlayerDataUI({});
        }
    });

    // Listener for the zone search input
    zoneSearchInput.addEventListener('input', (event) => {
        const selectedValue = event.target.value;
        const selectedOption = Array.from(zoneDatalist.options).find(opt => opt.value === selectedValue);
        
        if (selectedOption) {
            const zoneId = parseInt(selectedOption.dataset.zoneId, 10);
            
            // Manually load the selected map and disable tracking
            trackingSwitch.checked = false;
            isTrackingEnabled = false;
            playerNavigator.visible = false;
            loadMap(zoneId, 1);
            updatePlayerDataUI({ mapId: zoneId, zoneId: zoneId});
            currentZoneId = zoneId;
        }
    });

    // Listener for position updates from the main process
    window.ffxiAtlas.onPositionUpdate(async ({ x, y, z, zoneId }) => {
        if (!isTrackingEnabled) {
            return; // Do nothing if tracking is disabled
        }

        const zone = zones[zoneId];
        if (!zone) {
            console.warn(`Unknown zone ID: ${zoneId}`);
            if (currentZoneId !== -1) {
                mapSprite.texture = await PIXI.Assets.load(No_Map);
                currentZoneId = -1;
            }
            return;
        }
        // Zones with multiple maps should handle mapId differently
        let map = getMapIdFromPlayerPosition({x: x, y: y, z: z}, zone);
        // If the map has changed, update the map texture
        if (zoneId !== currentZoneId || map !== undefined|| map.mapId !== currentMapId) {
            await loadMap(zoneId, map.mapId);
            currentZoneId = zoneId;
            currentMapId = map.mapId;
        }

        // Update UI and player navigator position
        updatePlayerDataUI({ x, y, z, zoneId, mapId: map.mapId });
        const position2d = gameToPixels(x, y, map);
        calculateHeadingRotation(position2d, playerNavigator);
        playerNavigator.position.set(position2d.x, position2d.y);
    });
}

// --- Start the App ---
initialize();
