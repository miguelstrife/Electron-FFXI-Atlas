// --- Constants and State ---
const PlayerNavigatorInit = { X: 512, Y: 512 };
const No_Map = '../assets/maps/no_map.png';
let isTrackingEnabled = true;
let zones = {}; // Will be loaded from file
let playerState = { lastX: 0, lastY: 0 };
let currentZoneId = -1;
let currentMapId = -1;

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
// UI references for the related maps feature
const relatedMapsContainer = document.getElementById('related-maps-container');
const relatedMapsLoader = document.getElementById('related-maps-loader');


// --- Functions ---

/**
 * Scales and centers the main map container to fit the canvas.
 * This preserves the map's aspect ratio.
 */
function resizeAndCenterMap() {
    const { width, height } = app.renderer.screen;
    if (mapContainer && mapSprite && mapSprite.texture.valid) {
        const mapWidth = mapSprite.texture.width;
        const mapHeight = mapSprite.texture.height;
        const scale = Math.min(width / mapWidth, height / mapHeight);
        mapContainer.scale.set(scale);
        mapContainer.x = (width - mapContainer.width) / 2;
        mapContainer.y = (height - mapContainer.height) / 2;
    }
}

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
    currentZoneId = zoneId;
    currentMapId = mapId;
    
    const zone = zones[zoneId];
    let mapPath = No_Map;

    if (zone) {
        const map = zone.maps[mapId - 1];
        if (map) {
            // Construct path based on your logic (with or without mapId suffix)
            const mapName = zone.mapName;
            mapPath = `../assets/maps/${mapName}${Object.keys(zone.maps).length > 1 ? `_${mapId}` : ''}.png`;
        }
    }

    try {
        mapSprite.texture = await PIXI.Assets.load(mapPath);
    } catch (error) {
        console.error(`Failed to load map: ${mapPath}`, error);
        mapSprite.texture = await PIXI.Assets.load(No_Map);
    }
    
    resizeAndCenterMap();
    updateRelatedMapsUI(zoneId); // Refresh related maps to show active one
}

/**
 * Finds all maps for a given zone and displays them as thumbnails.
 * @param {number | null} zoneId - The ID of the zone to display maps for.
 */
function updateRelatedMapsUI(zoneId) {
    relatedMapsContainer.innerHTML = ''; // Clear previous maps
    const zone = zones[zoneId];
    if (!zone || !zone.maps) {
        relatedMapsLoader.classList.add('d-none');
        return;
    }

    relatedMapsLoader.classList.remove('d-none'); // Show loader

    const maps = Object.values(zone.maps);

    setTimeout(() => {
        maps.forEach(map => {
            const mapId = map.mapId;
            const mapName = zone.mapName;
            const mapPath = `../assets/maps/${mapName}${maps.length > 1 ? `_${mapId}` : ''}.png`;

            const col = document.createElement('div');
            col.className = 'col';

            // Create a wrapper for positioning the badge
            const wrapper = document.createElement('div');
            wrapper.className = 'map-thumb-wrapper';

             // Create the badge for the Map ID
            const badge = document.createElement('span');
            badge.className = 'map-id-badge badge bg-success rounded-pill';
            badge.textContent = `Map ${mapId}`;

            // Create the image thumbnail
            const img = document.createElement('img');
            img.src = mapPath;
            img.className = 'img-fluid rounded related-map-thumb';
            if (mapId === currentMapId) {
                img.classList.add('active');
            }
            img.title = `${mapName.replace(/_/g, ' ')} (Map ${mapId})`;
            
            img.addEventListener('click', () => {
                loadMap(zoneId, mapId);
                updatePlayerDataUI({ mapId: mapId, zoneId: zoneId });
                trackingSwitch.checked = false;
                isTrackingEnabled = false;
                playerNavigator.visible = false;
            });

            // Append badge and image to the wrapper
            wrapper.appendChild(badge);
            wrapper.appendChild(img);
            
            // Append the wrapper to the column
            col.appendChild(wrapper);
            relatedMapsContainer.appendChild(col);
        });
        relatedMapsLoader.classList.add('d-none'); // Hide loader
    }, 10);
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
    const maps = Object.values(zone?.maps ?? {});
    for (const map of maps) {
        for (const range of Object.values(map.ranges)) {
            if (isPlayerInRange(playerPosition, range)) {
                return map;
            }
        }
    }
    return maps.length > 0 ? maps[0] : null; // Default to first map if no range matches
}

/**
 * Initializes the entire application.
 */
async function initialize() {
    // Init PIXI
    await app.init({ background: '#343a40', height: 1024, width: 1024 });
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

    // Setup resize listener
    app.renderer.on('resize', resizeAndCenterMap);
    resizeAndCenterMap(); // Call once for initial sizing
    
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
            // currentZoneId = zoneId;
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
                await loadMap(null, null);
            }
            return;
        }
        // Zones with multiple maps should handle mapId differently
        let map = getMapIdFromPlayerPosition({x: x, y: y, z: z}, zone);
        if (!map) return;
        // If the map has changed, update the map texture
        if (zoneId !== currentZoneId || map.mapId !== currentMapId) {
            await loadMap(zoneId, map.mapId);
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
