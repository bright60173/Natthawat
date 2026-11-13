-- รับคำสั่งใช้สกิลจาก client → ตรวจสอบทุกอย่าง → คิดคูลดาวน์ → เรียก handler
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Classes = require(Shared:WaitForChild("Classes"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local CombatService = require(script.Parent.CombatService)
local LoadoutService = require(script.Parent.LoadoutService)
local SpawnService = require(script.Parent.SpawnService)
local StatusService = require(script.Parent.StatusService)
local U = require(script.Parent.SkillUtil)

local HandlerFolder = script.Parent.SkillHandlers
local Basic = require(HandlerFolder.Basic)

local SkillService = {}

local Handlers = {} -- [subclassId] = { [skillId] = function(player, character, payload) }
local states = {} -- [player] = { Cooldowns, Totals, Rate, Window, Count }

local SLOT_KEYS = { "0", "1", "2", "3", "dash" }

local function newState()
	local state = { Cooldowns = {}, Totals = {}, Rate = 1, Window = 0, Count = 0 }
	for _, key in ipairs(SLOT_KEYS) do
		state.Cooldowns[key] = 0
		state.Totals[key] = 1
	end
	return state
end

local function sync(player)
	local state = states[player]
	if state then
		Remotes.SkillFeedback:FireClient(player, {
			Type = "Cooldowns",
			Remaining = state.Cooldowns,
			Totals = state.Totals,
			Rate = state.Rate,
		})
	end
end

local function setCooldown(player, key, seconds)
	local state = states[player]
	if state then
		state.Cooldowns[key] = seconds
		state.Totals[key] = math.max(seconds, 0.05)
		sync(player)
	end
end

function SkillService.Reset(player)
	states[player] = newState()
	sync(player)
end

local function deny(player, key, reason)
	Remotes.SkillFeedback:FireClient(player, { Type = "Denied", Slot = key, Reason = reason })
end

-- จำกัดการยิง Remote ไม่เกิน Config.RemoteRateLimit ครั้ง/วิ
local function rateOk(state)
	local now = os.clock()
	if now - state.Window >= 1 then
		state.Window = now
		state.Count = 0
	end
	state.Count += 1
	return state.Count <= Config.RemoteRateLimit
end

local function isFiniteVector(value)
	return typeof(value) == "Vector3"
		and value.X == value.X
		and value.Y == value.Y
		and value.Z == value.Z
		and value.Magnitude < 1e5
end

local function runHandler(handler, player, character, payload)
	task.spawn(function()
		local ok, err = pcall(handler, player, character, payload)
		if not ok then
			warn(string.format("[SkillService] สกิล %s ทำงานผิดพลาด: %s", tostring(payload.Name), tostring(err)))
		end
	end)
end

local function useDash(player, character)
	-- ทิศพุ่ง = ทิศที่กำลังเดิน (ดูจากความเร็วจริงของร่าง) ถ้ายืนนิ่งให้พุ่งไปทางที่หันหน้า
	local root = U.Root(character)
	local direction = U.Flat(root.AssemblyLinearVelocity)
	if direction.Magnitude < 3 then
		direction = root.CFrame.LookVector
	end
	setCooldown(player, "dash", Config.Dash.Cooldown)
	StatusService.Apply(character, "DashIFrame", Config.Dash.IFrame)
	local from, to = U.Dash(character, direction, Config.Dash.Distance, Config.Dash.Duration)
	local sub = Classes.GetSubclass(player:GetAttribute("Subclass"))
	U.VFX("Dash", { From = from, To = to, Color = sub and sub.Color or Color3.new(1, 1, 1), Target = character })
end

local function onUseSkill(player, slot, aimPosition)
	local state = states[player]
	if not state or not rateOk(state) then
		return
	end

	-- ตรวจรูปแบบข้อมูลที่ client ส่งมา
	local key
	if slot == "dash" then
		key = "dash"
	elseif slot == 0 or slot == 1 or slot == 2 or slot == 3 then
		key = tostring(slot)
	else
		return
	end
	if not isFiniteVector(aimPosition) then
		return
	end

	-- ผู้เล่นต้องมีชีวิตและอยู่ในสนาม
	local character = player.Character
	if not character or not CombatService.IsAlive(character) then
		return
	end
	if not player:GetAttribute("InArena") or CombatService.InLobby(character) then
		return
	end

	if not StatusService.CanAct(character) then
		return deny(player, key, "ติดสถานะ ใช้สกิลไม่ได้")
	end
	if state.Cooldowns[key] > 0 then
		sync(player)
		return
	end

	if key == "dash" then
		useDash(player, character)
		return
	end

	if StatusService.Has(character, "Phase") then
		return deny(player, key, "อยู่ในมิติ โจมตีไม่ได้")
	end
	if StatusService.Has(character, "Channel") then
		return
	end

	local loadout = LoadoutService.Get(player)
	local sub = loadout and Classes.GetSubclass(loadout.Subclass)
	if not sub then
		return
	end

	local skill, handler, cooldown
	if key == "0" then
		skill = sub.Basic
		if not Basic.CanUse(player, character, skill) then
			return
		end
		handler = Basic.Use
		cooldown = Basic.GetCooldown(player, character, skill)
	else
		-- สกิลต้องอยู่ในชุดที่ผู้เล่นเลือกไว้จริง
		local skillId = loadout.Skills[slot]
		skill = skillId and sub.SkillById[skillId]
		handler = skill and Handlers[sub.Id] and Handlers[sub.Id][skill.Id]
		if not skill or not handler then
			return
		end
		cooldown = skill.Cooldown
	end

	local origin, direction, point, target = U.ResolveAim(player, character, aimPosition, skill.Range)

	-- โจมตีแล้วอมตะตอนเกิดหายทันที และหลุดล่องหน
	StatusService.Remove(character, "SpawnProtect")
	if skill.Damage then
		StatusService.Remove(character, "Invisible")
	end

	setCooldown(player, key, cooldown)

	local payload = {
		Slot = key,
		Skill = skill,
		Subclass = sub,
		Name = skill.Name,
		Color = sub.Color,
		Origin = origin,
		Direction = direction,
		Point = point,
		Target = target,
		Refund = function()
			setCooldown(player, key, 0.5)
		end,
	}
	runHandler(handler, player, character, payload)
end

function SkillService.Init()
	-- โหลด handler ของทุกสายย่อย แล้วตรวจว่ามีครบทุกสกิล
	for _, subId in ipairs(Classes.SubclassOrder) do
		local module = HandlerFolder:FindFirstChild(subId)
		if module then
			Handlers[subId] = require(module)
		else
			Handlers[subId] = {}
			warn("[SkillService] ไม่พบ handler ของสาย " .. subId)
		end
		for _, skill in ipairs(Classes.Subclasses[subId].Skills) do
			if type(Handlers[subId][skill.Id]) ~= "function" then
				warn(string.format("[SkillService] สกิล %s.%s ยังไม่มี handler", subId, skill.Id))
			end
		end
	end

	Players.PlayerAdded:Connect(function(player)
		states[player] = newState()
	end)
	for _, player in ipairs(Players:GetPlayers()) do
		states[player] = newState()
	end
	Players.PlayerRemoving:Connect(function(player)
		states[player] = nil
		Basic.Cleanup(player)
	end)

	SpawnService.OnEnterArena(function(player)
		SkillService.Reset(player)
		local loadout = LoadoutService.Get(player)
		local sub = loadout and Classes.GetSubclass(loadout.Subclass)
		Basic.Reset(player, sub and sub.Basic)
	end)

	Remotes.UseSkill.OnServerEvent:Connect(onUseSkill)

	-- นับคูลดาวน์ฝั่ง server (เร่งเวลา = ลดเร็วขึ้น 2 เท่า)
	RunService.Heartbeat:Connect(function(dt)
		for player, state in pairs(states) do
			local character = player.Character
			local rate = (character and StatusService.Has(character, "Haste")) and 2 or 1
			for _, key in ipairs(SLOT_KEYS) do
				if state.Cooldowns[key] > 0 then
					state.Cooldowns[key] = math.max(0, state.Cooldowns[key] - dt * rate)
				end
			end
			if rate ~= state.Rate then
				state.Rate = rate
				sync(player)
			end
		end
	end)
end

return SkillService
