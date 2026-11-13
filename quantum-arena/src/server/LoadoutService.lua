-- รับ / ตรวจสอบ / บันทึกการเลือกสายของผู้เล่น
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Classes = require(Shared:WaitForChild("Classes"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local SpawnService = require(script.Parent.SpawnService)

local LoadoutService = {}

local loadouts = {} -- [player] = { Subclass = string, Skills = { string×3 } }
local lastSelect = {}

local store
do
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(Config.DataStoreName)
	end)
	if ok then
		store = result
	else
		warn("[LoadoutService] ใช้ DataStore ไม่ได้ จะใช้ค่าเริ่มต้นแทน:", result)
	end
end

local function apply(player, subclassId, skills)
	loadouts[player] = { Subclass = subclassId, Skills = { skills[1], skills[2], skills[3] } }
	player:SetAttribute("Skill1", skills[1])
	player:SetAttribute("Skill2", skills[2])
	player:SetAttribute("Skill3", skills[3])
	player:SetAttribute("Subclass", subclassId)
end

function LoadoutService.Get(player)
	return loadouts[player]
end

local function save(player)
	local loadout = loadouts[player]
	if not store or not loadout then
		return
	end
	local userId = player.UserId
	task.spawn(function()
		local ok, err = pcall(function()
			store:SetAsync("u_" .. userId, { Subclass = loadout.Subclass, Skills = loadout.Skills })
		end)
		if not ok then
			warn("[LoadoutService] บันทึกชุดสกิลไม่สำเร็จ:", err)
		end
	end)
end

local function load(player)
	if not store then
		return
	end
	local ok, data = pcall(function()
		return store:GetAsync("u_" .. player.UserId)
	end)
	if not ok or type(data) ~= "table" then
		return
	end
	if not Classes.ValidateLoadout(data.Subclass, data.Skills) then
		return
	end
	-- ใช้ค่าที่บันทึกไว้เฉพาะตอนที่ผู้เล่นยังไม่ได้เลือกเองและยังอยู่ใน Lobby
	if player.Parent and not player:GetAttribute("InArena") and not player:GetAttribute("HasChosen") then
		apply(player, data.Subclass, data.Skills)
		player:SetAttribute("HasSaved", true)
	end
end

local function onSelect(player, subclassId, skills)
	local now = os.clock()
	if lastSelect[player] and now - lastSelect[player] < 0.5 then
		return
	end
	lastSelect[player] = now

	local function reject(reason)
		Remotes.SkillFeedback:FireClient(player, { Type = "LoadoutRejected", Reason = reason })
	end

	if player:GetAttribute("InArena") then
		return reject("ต้องอยู่ใน Lobby ถึงจะเปลี่ยนสายได้")
	end
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return reject("ยังไม่พร้อมลงสนาม")
	end
	local ok, reason = Classes.ValidateLoadout(subclassId, skills)
	if not ok then
		return reject(reason)
	end

	apply(player, subclassId, skills)
	player:SetAttribute("HasChosen", true)
	save(player)

	if SpawnService.Deploy(player) then
		Remotes.SkillFeedback:FireClient(player, { Type = "LoadoutAccepted" })
	else
		reject("ยังไม่พร้อมลงสนาม")
	end
end

local function onPlayer(player)
	apply(player, Config.DefaultLoadout.Subclass, Config.DefaultLoadout.Skills)
	task.spawn(load, player)
end

function LoadoutService.Init()
	Players.PlayerAdded:Connect(onPlayer)
	for _, player in ipairs(Players:GetPlayers()) do
		onPlayer(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		loadouts[player] = nil
		lastSelect[player] = nil
	end)
	Remotes.SelectLoadout.OnServerEvent:Connect(onSelect)
end

return LoadoutService
