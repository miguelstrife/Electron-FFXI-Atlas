--[[
* Addons - Copyright (c) 2023 Ashita Development Team
* Contact: https://www.ashitaxi.com/
* Contact: https://discord.gg/Ashita
*
* This file is part of Ashita.
*
* Ashita is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* Ashita is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with Ashita.  If not, see <https://www.gnu.org/licenses/>.
--]]

addon.name      = 'FFXI Atlas Broadcaster';                         -- The name of the addon.
addon.author    = 'miguelstrife';                                   -- The name of the addon author.
addon.version   = '1.5';                                            -- The version of the addon.
addon.desc      = 'Broadcast data to Electron FFXI Atlas App';      -- (Optional) The description of the addon.
addon.link      = 'https://github.com/miguelstrife/Electron-FFXI-Atlas';      -- (Optional) The link to the addons homepage.

-------------------------------------------------------------------------------
-- Requirements
-------------------------------------------------------------------------------
require('common');
local socket = require("socket")
-- Requires json.lua to be in the same folder as this addon file.
-- Download from: https://github.com/rxi/json.lua
local json = require('json'); 
local dumper = require('dumper');

-------------------------------------------------------------------------------
-- Globals
-------------------------------------------------------------------------------
local client = socket.udp()
-- Get managers needed for all data.
local memMgr = AshitaCore:GetMemoryManager();
local partyMgr = memMgr:GetParty();
local entityMgr = memMgr:GetEntity();


-------------------------------------------------------------------------------
-- Helper Functions
-------------------------------------------------------------------------------

-- Gets the zone ID for a given party member index.
local function getPlayerZoneIdFromMemory(playerIndex)
    return partyMgr:GetMemberZone(playerIndex) or 0
end

local function isSolo()
	if (partyMgr == nil) then
		return true
	else
		return partyMgr:GetMemberIsActive(1) == 0;
	end
end

-------------------------------------------------------------------------------
-- Main Broadcast Function
-------------------------------------------------------------------------------

-- This function gathers data for the player and party, then broadcasts it.
local function broadcastPartyData()
    local player = GetPlayerEntity();
    if (player == nil) then
        return
    end
    -- Ensure the JSON library was loaded correctly.
    if (json == nil) then
        print('[FFXIAtlas] Error: json.lua is missing or could not be loaded. Please place it in the addon folder.');
        return;
    end

    -- print("[FFXIAtlas] Get Managers")
    if not memMgr then return end

    -- print("[FFXIAtlas] Checking managers")
    -- Add nil checks for robustness, especially during zoning.
    -- if (partyMgr == nil or entityMgr == nil) then
    --     return
    -- end

    -- print("[FFXIAtlas] Creating data packet")
    -- Prepare the main data packet table. MapId has been removed.
    local data_packet = {
        player = {
            name = player.Name,
            x = player.Movement.LocalPosition.X,
            y = player.Movement.LocalPosition.Y,
            z = player.Movement.LocalPosition.Z,
            zoneId = getPlayerZoneIdFromMemory(0)
        },
        party = {}
    }
    -- print("[FFXIAtlas]  Loop pt members")
    -- Loop through all 5 party member slots (0 = player, 1-5 = party)

    if not isSolo() then
        -- print("[FFXIAtlas]  Player is solo, skipping party member data.")
        for i = 1, 5 do
            if (partyMgr:GetMemberIsActive(i) == 1) then
                -- print("[FFXIAtlas]  Party member " .. i .. " is active.")
                local member_server_id = partyMgr:GetMemberServerId(i);
                local partyMemberName = partyMgr:GetMemberName(i);                
                local partyMemberZoneId = getPlayerZoneIdFromMemory(i);
                -- A valid server ID is greater than 0
                if (partyMemberZoneId == data_packet.player.zoneId) then
                    local member_entity = memMgr:GetEntity(member_server_id);
                    local partyMemberIndexId = partyMgr:GetMemberTargetIndex(i);
                    --
                    local partyEntity = memMgr:GetEntity(partyMemberIndexId); 

                    -- print("Party Entity: " .. tostring(partyEntity.MovementSpeed) .. " in Zone: " .. partyMemberZoneId);
                    -- print("Party Entity: " .. partyEntity.Name .. " in Zone: " .. partyMemberZoneId .. "Pos: " .. partyEntity.Position.X .. ", " .. partyEntity.Movement.LocalPosition.Y .. ", " .. partyEntity.Movement.LocalPosition.Z)
                    --
                    local partyMemberPositionX = entityMgr:GetLocalPositionX(partyMemberIndexId);
                    local partyMemberPositionY = entityMgr:GetLocalPositionY(partyMemberIndexId);
                    local partyMemberPositionZ = entityMgr:GetLocalPositionZ(partyMemberIndexId);
                    
                    -- local partyMemberMovementPositionX = entityMgr:GetMoveX(partyMemberIndexId);
                    -- local partyMemberMovementPositionY = entityMgr:GetMoveY(partyMemberIndexId);
                    -- local partyMemberMovementPositionZ = entityMgr:GetMoveZ(partyMemberIndexId);

                    -- print("[FFXIAtlas]  Party Member Position: " .. partyMemberPositionX .. ", " .. partyMemberPositionY .. ", " .. partyMemberPositionZ .. " in Zone: " .. partyMemberZoneId)

                    -- Add the party member's data, including their specific zone ID.
                    table.insert(data_packet.party, {
                        name = partyMemberName,
                        x = partyMemberPositionX,
                        y = partyMemberPositionY,
                        z = partyMemberPositionZ,
                        zoneId = partyMemberZoneId
                    })
                else
                    table.insert(data_packet.party, {
                        name = partyMemberName,
                        x = 0,
                        y = 0,
                        z = 0,
                        zoneId = partyMemberZoneId
                    })   
                end
            end
        end
    end
    
    -- Encode the entire data table to a JSON string and send it.
    local msg = json.encode(data_packet)
    if (client) then
        client:send(msg)
    end
end

-------------------------------------------------------------------------------
-- Ashita Events
-------------------------------------------------------------------------------

--[[
* event: load
* desc : Event called when the addon is being loaded.
--]]
ashita.events.register('load', 'load_callback1', function ()
    print("[FFXIAtlas] 'load' event was called.");
    client:setpeername("127.0.0.1", 12345)

    -- Creates a task that repeats indefinitely.
    -- It now calls the new function that handles party data.
    ashita.tasks.repeating(0.25, -1, 0.25, broadcastPartyData)
    print("[FFXIAtlas] Player and party position broadcaster task started.")
end);

--[[
* event: unload
* desc : Event called when the addon is being unloaded.
--]]
ashita.events.register('unload', 'unload_callback1', function ()
    print("[FFXIAtlas] 'unload' event was called.");
    -- It's good practice to close the socket on unload
    if (client) then
        client:close()
    end
end);
