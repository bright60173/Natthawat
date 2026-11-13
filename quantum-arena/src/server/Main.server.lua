-- จุดเริ่มต้นฝั่ง server: สร้างแผนที่แล้วเปิดระบบทั้งหมดตามลำดับ
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Server = script.Parent

-- สร้าง RemoteEvent ทั้งหมดก่อน (client จะรอจนกว่าจะมี)
require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Remotes"))

local MapBuilder = require(Server.MapBuilder)
local StatsService = require(Server.StatsService)
local CombatService = require(Server.CombatService)
local SpawnService = require(Server.SpawnService)
local LoadoutService = require(Server.LoadoutService)
local SkillService = require(Server.SkillService)

local mapInfo = MapBuilder.Build()

StatsService.Init()
CombatService.Init()
SpawnService.Init(mapInfo)
LoadoutService.Init()
SkillService.Init()

print("[QuantumArena] เซิร์ฟเวอร์พร้อมแล้ว")
