-- position_broadcast.lua
local socket = require("socket")
local client = socket.udp()
client:setpeername("127.0.0.1", 12345)

local zoneId = AshitaCore:GetMemoryManager():GetParty():GetMemberZone(0)

ashita.register_event('render', function()
    local player = GetPlayerEntity()
    if player then
        local msg = string.format('%f,%f,%f,%d', player.Movement.LocalPosition.X, player.Movement.LocalPosition.Y, player.Movement.LocalPosition.Z, player.ServerId, zoneId)
        client:send(msg)
    end
end)
