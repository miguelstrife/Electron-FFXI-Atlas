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
addon.version   = '1.0';                                            -- The version of the addon. (No specific format, x.x at least recommended.)
addon.desc      = 'Broadcast data to Electron FFXI Atlas App';      -- (Optional) The description of the addon.
addon.link      = 'https://github.com/miguelstrife/Electron-FFXI-Atlas';      -- (Optional) The link to the addons homepage.

--[[ Ashita v4 Addons Notes

    -   The main addon information table has been renamed to just 'addon'.
    -   The main addon information table now has two additional (optional) fields 'desc' and 'link'.
    -   The main addon information table has two hidden properties 'instance' and 'path'.
        -> instance is a class object of the current addon instance. This object has the following members:
            -> addon.instance.state                 - Returns the addons current state.
            -> addon.instance.current_frame         - Returns the addons current frame count.
            -> addon.instance.get_memory_usage()    - Returns the addons current memory usage.
        -> path is the path to the addons root folder.
    -   The main addon information table is no longer read-only; you are free to add other custom fields to it if you wish.


    -   Addons are now fully coroutine driven. This means that all calls made to the addons Lua side will result in
        the call being done inside of a Lua based thread. (coroutine) With this, you can now suspend all events with
        new API calls added to Lua's coroutine table. (More info below.) 

    -   Addons are now running via LuaJIT rather than stock Lua. This allows for optimized performance for heavy operation
        based scripts. You can read up more on LuaJIT here: https://luajit.org/
    -   The LuaJIT 'jit' and 'ffi' extensions are both enabled and available.

    -   Some events have been renamed.
    -   Some events have had their arguments changed. (Renamed, added, removed, etc.)
    -   Events now do not have their arguments passed individually. Instead, arguments are passed as a means of 'event args'.
        This causes the arguments to be passed as a structure to the event which has sub-properties. (See the event examples
        below for each events arguments.)
    -   Blocking an event is now done, if available, via setting the 'blocked' argument (ie. e.blocked = true;)
    -   Some events now also have 'raw' versions of some arguments. These are direct pointers that can be used with LuaJIT's 'ffi'
        extension giving you direct memory access to things. (Please be warned, misuse can and will lead to client crashes!)
    -   Registering events now take an additional argument, an alias, which is used to allow for multiple event callbacks per event
        if you wish to break your addon into multiple files/parts and wish to keep certain parts of an event handling separated.
    -   New events have been added.
--]]

--[[ Event Specific Notes

    load
        Addons are now only deemed valid/successfully loaded once all load event callbacks have fully completed. If you sleep
        a load callback, the addon will not be considered valid until that sleep has finished and the callback has completed.

    unload
        No notable changes.

    command
        New argument: 'arg.injected'.

    text_in
        Renamed from incoming_text in v3.
        New argument: 'arg.indented'.
        New argument: 'arg.injected'.

    text_out
        Renamed from outgoing_text in v3.
        New argument: 'arg.injected'.

    packet_in
        Renamed from incoming_packet in v3.
        New argument: 'arg.data_raw'.
        New argument: 'arg.data_modified_raw'.
        New argument: 'arg.chunk_size'.
        New argument: 'arg.chunk_data'.
        New argument: 'arg.chunk_data_raw'.
        New argument: 'arg.injected'.

    packet_out
        Renamed from outgoing_packet in v3.
        New argument: 'arg.data_raw'.
        New argument: 'arg.data_modified_raw'.
        New argument: 'arg.chunk_size'.
        New argument: 'arg.chunk_data'.
        New argument: 'arg.chunk_data_raw'.
        New argument: 'arg.injected'.

    plugin_event
        New event; used for allowing plugins/addons to communicate in a non-blocking manner.

    dinput_button
        New event; used for processing DirectInput controller input.

    key
        New event; used for processing keyboard input.
        This event is used when inputting text into chat, messages, comments, etc.

    key_data
        New event; used for processing keyboard input.
        This event is used when inputting game control.
        This event is used for the initial key press.

    key_state
        New event; used for processing keyboard input.
        This event is used when inputting game control.
        This event is used for the repeating key presses.

    mouse
        New event; used for processing mouse input.

    xinput_button
        New event; used for processing XInput controller input.

    xinput_state
        New event; used for processing XInput controller input.

    d3d_beginscene
        Renamed from prerender in v3.

    d3d_endscene
        Renamed from render in v3.

    d3d_present
        New event; used for when the game is presenting the final scene.
        While doing custom rendering, it is ideal to do so in this event.

    d3d_dp
        New event; used for when the game is rendering a primitive. (DrawPrimitive)
        Warning; having a callback to this event can yield in FPS loss. Only register a callback if needed!

    d3d_dpup
        New event; used for when the game is rendering a primitive. (DrawPrimitiveUP)
        Warning; having a callback to this event can yield in FPS loss. Only register a callback if needed!

    d3d_dip
        New event; used for when the game is rendering a primitive. (DrawIndexedPrimitive)
        Warning; having a callback to this event can yield in FPS loss. Only register a callback if needed!

    d3d_dipup
        New event; used for when the game is rendering a primitive. (DrawIndexedPrimitiveUP)
        Warning; having a callback to this event can yield in FPS loss. Only register a callback if needed!
--]]

--[[ Coroutine Changes/Notes

    Addons are now fully coroutine driven. This means that each event call into Lua is running inside of a Lua thread. (coroutine)
    Events can now be suspended/slept as needed if desired while reacting to a given event.

    If you suspend an event, you forfeit the ability to interact with the events arguments or block the event after the callback resumes.

    Take the following for example:

        ashita.events.register('packet_in', 'packet_in_callback1', function (e)
            if (e.id == 0x1A) then
                -- Sleep for 5 seconds, suspending this event callback..
                coroutine.sleep(5); 
                print('Slept for 5 seconds after seeing a 0x1A packet!');

                -- Invalid; the event was suspended, thus doing this will do nothing..
                e.blocked = true;
            end
        end);

    By calling 'coroutine.sleep', we cause the coroutine for this event call to be suspended. In this example, we sleep the event for 5
    seconds, where it will be resumed and continue where the code left off. However, because we slept the event, the event is no longer
    valid to be manipulated by that event call. This means that doing anything to the 'e' object or trying to block it will do nothing.

    If you need to block an event and sleep it to do something afterward, be sure to block it before sleeping first!
--]]

--[[ New Functions / Features

    The following 'ashita.events' functions replace the old event handling calls from v3.

        ashita.events.register(eventName, eventAlias, func);
            Renamed from 'ashita.register_event' in v3.
            Now takes a second string for callback aliases, allowing multiple event callbacks for a single event.

        ashita.events.unregister(eventName, eventAlias);
            New call allowing to easily unregister events. (v3 required you to manipulate a hidden table.)


    The following 'ashita.tasks' functions are used to replace the old timer lib from v3 due to the new coroutine changes.

        ashita.tasks.once(func, ...);
            Creates a task that fires once, immediately.

        ashita.tasks.once(delay, func, ...);
            Creates a task that fires once, after the given delay (in seconds).

        ashita.tasks.oncef(delay, func, ...);
            Creates a task that fires once, after the given delay (in frames).

        ashita.tasks.repeating(delay, repeats, repeatDelay, func, ...);
            Creates a task that repeats. (Delays are in seconds.)

        ashita.tasks.repeatingf(delay, repeats, repeatDelay, func, ...);
            Creates a task that repeats. (Delays are in frames.)

    The follow 'coroutine' functions are extensions added to the default Lua coroutine table.

        coroutine.kill();
            Kills the current coroutine task by force.

        coroutine.sleep(delay);
            Sleeps the current coroutine task for the given amount of seconds.

        coroutine.sleepf(delay);
            Sleeps the current coroutine task for the given amount of frames.

    WARNING:

        While using frames can be useful for doing things next-frame, it is not reliable for doing things further in advanced!
        The frame count is based on the literal count of frames of the game. This means that uncapping the FPS to 60 or higher will
        affect the length of time it takes to complete something. (30fps vs. 60fps is not the same delay wise!)
--]]

--[[
* event: load
* desc : Event called when the addon is being loaded.
--]]
require('common');
local socket = require("socket")

-- local memMgr = AshitaCore and AshitaCore:GetMemoryManager()
-- local targetMgr = memMgr and memMgr:GetTarget()
-- local entityMgr = memMgr and memMgr:GetEntity()
-- local partyMgr  = memMgr and memMgr:GetParty()
-- local playerMgr = memMgr and memMgr:GetPlayer()
local client = socket.udp()

local function getPlayerZoneIdFromMemory()
    local memMgr = AshitaCore:GetMemoryManager()
    if not memMgr then
        return 0
    end

    local partyMgr = memMgr:GetParty()
    if not partyMgr then
        return 0
    end

    return partyMgr:GetMemberZone(0) or 0
end

-- This function contains the logic to broadcast the player's data.
local function broadcastPlayerData()
    local player = GetPlayerEntity()
    if (player == nil) then
        return
    end

    local zoneId = getPlayerZoneIdFromMemory()

    local msg = string.format('%f,%f,%f,%d', player.Movement.LocalPosition.X, player.Movement.LocalPosition.Y, player.Movement.LocalPosition.Z, zoneId)
    
    -- Error handling in case the send fails
    if (client) then
        client:send(msg)
    end
end

ashita.events.register('load', 'load_callback1', function ()
    print("[FFXIAtlas] 'load' event was called.");
    client:setpeername("127.0.0.1", 12345)

    -- Creates a task that repeats indefinitely every 0.25 seconds.
    -- Parameters for repeating: delay, repeats, repeatDelay, func
    -- delay: 0.25 (start after 0.25s)
    -- repeats: -1 (repeat forever)
    -- repeatDelay: 0.25 (repeat every 0.25s)
    -- func: broadcastPlayerData (the function to call)
    ashita.tasks.repeating(0.05, -1, 0.05, broadcastPlayerData)
    print("[FFXIAtlas] Player position broadcaster task started.")
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

--[[
* event: command
* desc : Event called when the addon is processing a command.
--]]
-- ashita.events.register('command', 'command_callback1', function (e)
--     --[[ Valid Arguments

--         e.mode       - (ReadOnly) The mode of the command.
--         e.command    - (ReadOnly) The raw command string.
--         e.injected   - (ReadOnly) Flag that states if the command was injected by Ashita or an addon/plugin.
--         e.blocked    - (Writable) Flag that states if the command has been, or should be, blocked.
--     --]]

--     -- Handle the /test command..
--     if (e.command == '/test') then
--         print("[Example] Blocking '/test' command!");
--         e.blocked = true;
--     end

--     -- Handle the /test2 command from a macro button..
--     if (e.mode == 2 and e.command == '/test2') then
--         print("[Example] Blocking '/test2' command from macro only!");
--         e.blocked = true;
--     end
-- end);

--[[
* event: text_in
* desc : Event called when the addon is processing incoming text.
--]]
-- ashita.events.register('text_in', 'text_in_callback1', function (e)
--     --[[ Valid Arguments

--         e.mode               - (ReadOnly) The message mode.
--         e.indent             - (ReadOnly) Flag that determines if the message is indented.
--         e.message            - (ReadOnly) The raw message string.
--         e.mode_modified      - (Writable) The modified mode.
--         e.indent_modified    - (Writable) The modified indent flag.
--         e.message_modified   - (Writable) The modified message.
--         e.injected           - (ReadOnly) Flag that states if the text was injected by Ashita or an addon/plugin.
--         e.blocked            - (Writable) Flag that states if the text has been, or should be, blocked.
--     --]]

--     --[[ Note: Deadlock Warning!

--             If you directly print from this function, you can cause a deadlock in any addon not properly filtering
--             and reprocessing text_in calls. The below example will deadlock and crash the client if not checking
--             for the injected flag or if you only re-process injected messages over and over.

--             You should avoid printing from this function as much as possible!
--     --]]

--     if (not e.injected) then
--         print(string.format("[Example] 'text_in' event was called: (non-injected) %s", e.message));
--     end

--     -- Mark all incoming text as indented to demo modding e..
--     if (not e.blocked and not e.indent) then
--         e.indent_modified = true;
--     end

--     -- Look for and modify messages starting with '1' as an example.. (/echo 1)
--     if (not e.blocked and not e.injected) then
--         if (string.sub(e.message, 1, 1) == '1') then
--             e.mode_modified      = 4;
--             e.message_modified   = '(Modified!)';
--         end
--     end
-- end);

--[[
* event: text_out
* desc : Event called when the addon is processing outgoing text.
--]]
-- ashita.events.register('text_out', 'text_out_callback1', function (e)
--     --[[ Valid Arguments

--         e.mode               - (ReadOnly) The message mode.
--         e.message            - (ReadOnly) The raw message string.
--         e.mode_modified      - (Writable) The modified mode.
--         e.message_modified   - (Writable) The modified message.
--         e.injected           - (ReadOnly) Flag that states if the text was injected by Ashita or an addon/plugin.
--         e.blocked            - (Writable) Flag that states if the text has been, or should be, blocked.
--     --]]

--     -- Block /wave commands not handled previously in the command event..
--     if (not e.injected) then
--         if (string.sub(e.message, 1, 5) == '/wave') then
--             e.blocked = true;
--             return;
--         end
--     end

--     print("[Example] 'text_out' event was called: " .. e.message);
-- end);

--[[
* event: packet_in
* desc : Event called when the addon is processing incoming packets.
--]]
-- ashita.events.register('packet_in', 'packet_in_callback1', function (e)
--     --[[ Valid Arguments

--         e.id                 - (ReadOnly) The id of the packet.
--         e.size               - (ReadOnly) The size of the packet.
--         e.data               - (ReadOnly) The data of the packet.
--         e.data_raw           - (Writable) The raw data pointer of the packet. (Use with FFI.)
--         e.data_modified      - (Writable) The modified data.
--         e.data_modified_raw  - (Writable) The modified raw data. (Use with FFI.)
--         e.chunk_size         - (ReadOnly) The size of the full packet chunk that contained the packet.
--         e.chunk_data         - (Writable) The data of the full packet chunk that contained the packet.
--         e.chunk_data_raw     - (Writable) The raw data pointer of the full packet chunk that contained the packet. (Use with FFI.)
--         e.injected           - (ReadOnly) Flag that states if the packet was injected by Ashita or an addon/plugin.
--         e.blocked            - (Writable) Flag that states if the packet has been, or should be, blocked.
--     --]]

--     -- Look for emote packets..
--     if (e.id == 0x5A) then
--         -- Look for /dance emotes and replace them with /wave instead..
--         local emoteId = struct.unpack('b', e.data, 0x10 + 1);
--         if (emoteId == 31) then
--             -- Use FFI to convert to the data and modify it to /wave..
--             local ffi = require('ffi');
--             local ptr = ffi.cast('uint8_t*', e.data_modified_raw);
--             ptr[0x10] = 8;
--         end
--     end
-- end);

--[[
* event: packet_out
* desc : Event called when the addon is processing outgoing packets.
--]]
-- ashita.events.register('packet_out', 'packet_out_callback1', function (e)
--     --[[ Valid Arguments

--         e.id                 - (ReadOnly) The id of the packet.
--         e.size               - (ReadOnly) The size of the packet.
--         e.data               - (ReadOnly) The data of the packet.
--         e.data_raw           - (Writable) The raw data pointer of the packet. (Use with FFI.)
--         e.data_modified      - (Writable) The modified data.
--         e.data_modified_raw  - (Writable) The modified raw data. (Use with FFI.)
--         e.chunk_size         - (ReadOnly) The size of the full packet chunk that contained the packet.
--         e.chunk_data         - (Writable) The data of the full packet chunk that contained the packet.
--         e.chunk_data_raw     - (Writable) The raw data pointer of the full packet chunk that contained the packet. (Use with FFI.)
--         e.injected           - (ReadOnly) Flag that states if the packet was injected by Ashita or an addon/plugin.
--         e.blocked            - (Writable) Flag that states if the packet has been, or should be, blocked.
--     --]]

--     -- Look for emote packets..
--     if (e.id == 0x5D) then
--         -- Look for /panic emotes and replace them with /wave instead.. (All via FFI)
--         local ffi = require('ffi');
--         local ptr = ffi.cast('uint8_t*', e.data_modified_raw);

--         -- Replace the emote..
--         if (ptr[0x0A] == 29) then
--             ptr[0x0A] = 8;
--         end        
--     end
-- end);

--[[
* event: plugin_event
* desc : Event called when the addon is processing plugin events.
--]]
-- ashita.events.register('plugin_event', 'plugin_event_callback1', function (e)
--     --[[ Valid Arguments

--         e.name       - (ReadOnly) The name of the plugin event.
--         e.data       - (Writable) The data of the event.
--         e.data_raw   - (Writable) The raw data pointer of the event. (Use with FFI.)
--         e.size       - (ReadOnly) The size of the data.
--     --]]
-- end);

--[[
* event: dinput_button
* desc : Event called when the addon is processing DirectInput controller input.
--]]
-- ashita.events.register('dinput_button', 'dinput_button_callback1', function (e)
--     --[[ Valid Arguments

--         e.button    - (Writable) The controller button id.
--         e.state     - (Writable) The controller button state value.
--         e.blocked   - (Writable) Flag that states if the button has been, or should be, blocked.
--         e.injected  - (ReadOnly) Flag that states if the button was injected by Ashita or an addon/plugin.
--     --]]
-- end);

--[[
* event: key
* desc : Event called when the addon is processing keyboard input. (WNDPROC)
--]]
-- ashita.events.register('key', 'key_callback1', function (e)
--     --[[ Valid Arguments

--         e.wparam     - (ReadOnly) The wparam of the event.
--         e.lparam     - (ReadOnly) The lparam of the event.
--         e.blocked    - (Writable) Flag that states if the key has been, or should be, blocked.

--         See the following article for how to process and use wparam/lparam values:
--         https://docs.microsoft.com/en-us/previous-versions/windows/desktop/legacy/ms644984(v=vs.85)

--         Note: Key codes used here are considered 'virtual key codes'.
--     --]]

--     --[[ Note

--             The game uses WNDPROC keyboard information to process keyboard input for chat and other
--             user-inputted text prompts. (Bazaar comment, search comment, etc.)

--             Blocking a press here will only block it during inputs of those types. It will not block
--             in-game button handling for things such as movement, menu interactions, etc.
--     --]]

--     -- Block left-arrow key presses.. (Blocks in chat input.)
--     if (e.wparam == 37) then
--         e.blocked = true;
--     end
-- end);

--[[
* event: key_data
* desc : Event called when the addon is processing keyboard input. (DirectInput GetDeviceData)
--]]
-- ashita.events.register('key_data', 'key_data_callback1', function (e)
--     --[[ Valid Arguments

--         e.key        - (ReadOnly) The DirectInput key id.
--         e.down       - (ReadOnly) The down state of the key.
--         e.blocked    - (Writable) Flag that states if the key has been, or should be, blocked.

--         Note: Key codes used here are considered 'DirectInput key codes'.
--     --]]

--     --[[ Note

--             The game uses the GetDeviceData information to process keyboard input as the initial
--             press of a button. GetDeviceState is then to determine if a key is being held down
--             after the initial press. 

--             Blocking a press here will only block the initial processing but will not block repeating.
--     --]]

--     -- Block left-arrow key presses.. (Blocks game input; initial press.)
--     if (e.key == 203) then
--         e.blocked = true;
--     end
-- end);

--[[
* event: key_state
* desc : Event called when the addon is processing keyboard input. (DirectInput GetDeviceState)
--]]
-- ashita.events.register('key_state', 'key_state_callback1', function (e)
--     --[[ Valid Arguments

--         e.data       - (ReadOnly) The array of key data.
--         e.data_raw   - (Writable) The raw data pointer to the array of key data.
--         e.size       - (ReadOnly) The size of the key data.

--         Note: Key codes used here are considered 'DirectInput key codes'.
--     --]]

--     --[[ Note

--             The game uses GetDeviceState information to process keyboard input as the repeated
--             state of a button (ie. it being held after pressed). GetDeviceData is used to process
--             the initial key press before continuing to check for repeating by being held down.

--             Blocking a press here will only block the repeating but will not block the initial press.
--     --]]

--     -- Use ffi to cast to the key data and block left-arrow key presses..
--     local ffi = require('ffi');
--     local ptr = ffi.cast('uint8_t*', e.data_raw);

--     -- Block left-arrow key presses.. (Blocks game input; repeating.)
--     if (ptr[203] ~= 0) then
--         ptr[203] = 0;
--     end
-- end);

--[[
* event: mouse
* desc : Event called when the addon is processing mouse input. (WNDPROC)
--]]
-- ashita.events.register('mouse', 'mouse_callback1', function (e)
--     --[[ Valid Arguments

--         e.message    - (ReadOnly) The mouse event id.
--         e.wparam     - (ReadOnly) The wparam of the event.
--         e.lparam     - (ReadOnly) The lparam of the event.
--         e.x          - (ReadOnly) The mouse x position.
--         e.y          - (ReadOnly) The mouse y position.
--         e.delta      - (ReadOnly) The mouse scroll delta.
--         e.blocked    - (Writable) Flag that states if the mouse has been, or should be, blocked.
--     --]]

--     -- Make a 100x100 pixel dead-zone at the top-left of the screen to block all mouse input..
--     if (e.x >= 0 and e.x <= 100) then
--         if (e.y >= 0 and e.y <= 100) then
--             print("[Example] Blocked a mouse event in 100x100 dead zone!");
--             e.blocked = true;
--             return;
--         end
--     end

--     -- Block left-clicks..
--     if (e.message == 513 or e.message == 514) then
--         e.blocked = true;
--         return;
--     end
-- end);

--[[
* event: xinput_button
* desc : Event called when the addon is processing XInput controller input.
--]]
-- ashita.events.register('xinput_button', 'xinput_button_callback1', function (e)
--     --[[ Valid Arguments

--         e.button    - (Writable) The controller button id.
--         e.state     - (Writable) The controller button state value.
--         e.blocked   - (Writable) Flag that states if the button has been, or should be, blocked.
--         e.injected  - (ReadOnly) Flag that states if the button was injected by Ashita or an addon/plugin.
--     --]]
-- end);

--[[
* event: xinput_state
* desc : Event called when the addon is processing XInput controller input.
--]]
-- ashita.events.register('xinput_state', 'xinput_state_callback1', function (e)
--     --[[ Valid Arguments

--         e.size              - (ReadOnly) The size of the state information. (Always sizeof(XINPUT_STATE))
--         e.user              - (ReadOnly) Index of the user's controller.
--         e.state             - (ReadOnly) The current XINPUT_STATE information of the event.
--         e.state_modified    - (Writable) The modified XINPUT_STATE information of the event.
--     --]]
-- end);

--[[
* event: d3d_beginscene
* desc : Event called when the Direct3D device is beginning a scene.
--]]
-- ashita.events.register('d3d_beginscene', 'd3d_beginscene_callback1', function (isRenderingBackBuffer)

--     -- isRenderingBackBuffer is a flag that will be true when the game is currently rendering to the back buffer.
--     -- Obtain the local player entity..
--     -- local player = GetPlayerEntity();
--     -- if (player == nil) then
--     --     return;
--     -- end

--     -- -- Determine if the player is moving..
--     -- local x = player.Movement.LocalPosition.X;
--     -- local y = player.Movement.LocalPosition.Y;
--     -- local z = player.Movement.LocalPosition.Z;
--     -- local zoneId = getPlayerZoneIdFromMemory();

--     -- local msg = string.format('%f,%f,%f,%d', player.Movement.LocalPosition.X, player.Movement.LocalPosition.Y, player.Movement.LocalPosition.Z, zoneId)
--     -- client:send(msg)


--     -- if (mmm.last_x == x and mmm.last_y == y and mmm.last_z == z) then
--     --     mmm.moving = false;
--     -- else
--     --     mmm.moving = true;
--     -- end

--     -- -- Update the last known coords..
--     -- mmm.last_x = x;
--     -- mmm.last_y = y;
--     -- mmm.last_z = z;
-- end);

--[[
* event: d3d_endscene
* desc : Event called when the Direct3D device is ending a scene.
--]]
-- ashita.events.register('d3d_endscene', 'd3d_endscene_callback1', function (isRenderingBackBuffer)

--     -- isRenderingBackBuffer is a flag that will be true when the game is currently rendering to the back buffer.

-- end);

-- --[[
-- * event: d3d_present
-- * desc : Event called when the Direct3D device is presenting a scene.
-- --]]
-- ashita.events.register('d3d_present', 'd3d_present_callback1', function ()

-- end);

-- --[[
-- * event: d3d_dp
-- * desc : Event called when the Direct3D device is drawing a primitive. (DrawPrimitive)
-- --]]
-- ashita.events.register('d3d_dp', 'd3d_dp_callback1', function (e)
--     --[[ Valid Arguments

--         e.primitive_type     - (ReadOnly) The type of primitive being rendered.
--         e.start_vertex       - (ReadOnly) Index of the first vertex to load.
--         e.primitive_count    - (ReadOnly) Number of primitives to render.
--         e.blocked            - (Writable) Flag that states if the event has been, or should be, blocked.
--     --]]
-- end);

-- --[[
-- * event: d3d_dpup
-- * desc : Event called when the Direct3D device is drawing a primitive. (DrawPrimitiveUP)
-- --]]
-- ashita.events.register('d3d_dpup', 'd3d_dpup_callback1', function (e)
--     --[[ Valid Arguments

--         e.primitive_type             - (ReadOnly) The type of primitive being rendered.
--         e.primitive_count            - (ReadOnly) Number of primitives to render.
--         e.vertex_stream_zero_data    - (ReadOnly) User memory pointer to vertex data to use for vertex stream zero.
--         e.vertex_stream_zero_stride  - (ReadOnly) Stride between data for each vertex, in bytes.
--         e.blocked                    - (Writable) Flag that states if the event has been, or should be, blocked.
--     --]]
-- end);

-- --[[
-- * event: d3d_dip
-- * desc : Event called when the Direct3D device is drawing a primitive. (DrawIndexedPrimitive)
-- --]]
-- ashita.events.register('d3d_dip', 'd3d_dip_callback1', function (e)
--     --[[ Valid Arguments

--         e.primitive_type    - (ReadOnly) The type of primitive being rendered.
--         e.min_index         - (ReadOnly) Minimum vertex index for the vertices used during this call.
--         e.num_vertices      - (ReadOnly) Number of vertices used during this call.
--         e.start_index       - (ReadOnly) Location in the index array to start reading indices.
--         e.primitive_count   - (ReadOnly) Number of primitives to render.
--         e.blocked           - (Writable) Flag that states if the event has been, or should be, blocked.
--     --]]
-- end);

-- --[[
-- * event: d3d_dipup
-- * desc : Event called when the Direct3D device is drawing a primitive. (DrawIndexedPrimitiveUP)
-- --]]
-- ashita.events.register('d3d_dipup', 'd3d_dipup_callback1', function (e)
--     --[[ Valid Arguments

--         e.primitive_type             - (ReadOnly) The type of primitive being rendered.
--         e.min_vertex_index           - (ReadOnly) Minimum vertex index, relative to zero, for vertices used during this call. 
--         e.num_vertex_indices         - (ReadOnly) Number of vertices used during this call.
--         e.primitive_count            - (ReadOnly) Number of primitives to render.
--         e.index_data                 - (ReadOnly) User memory pointer to the index data.
--         e.index_data_format          - (ReadOnly) The format type of the index data.
--         e.vertex_stream_zero_data    - (ReadOnly) User memory pointer to vertex data to use for vertex stream zero.
--         e.vertex_stream_zero_stride  - (ReadOnly) Stride between data for each vertex, in bytes.
--         e.blocked                    - (Writable) Flag that states if the event has been, or should be, blocked.
--     --]]
-- end);