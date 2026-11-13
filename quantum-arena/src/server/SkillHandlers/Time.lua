-- สกิลสายเวลา (Time)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local Players = game:GetService("Players")

local SpawnService = require(Server.SpawnService)

local H = {}

-- ประวัติตำแหน่ง/เลือดของผู้เล่นสายเวลา เก็บทุก 0.1 วิ (ใช้กับ "ย้อนเวลา")
local HISTORY_STEP = 0.1
local HISTORY_KEEP = 4
local history = {} -- [character] = { { T, CFrame, Health } }

SpawnService.OnEnterArena(function(_player, character)
	history[character] = nil
end)

task.spawn(function()
	while true do
		task.wait(HISTORY_STEP)
		local now = os.clock()
		for _, player in ipairs(Players:GetPlayers()) do
			local character = player.Character
			if
				character
				and player:GetAttribute("Subclass") == "Time"
				and player:GetAttribute("InArena")
				and CombatService.IsAlive(character)
				and not CombatService.InLobby(character)
			then
				local list = history[character]
				if not list then
					list = {}
					history[character] = list
				end
				local humanoid = character:FindFirstChildOfClass("Humanoid")
				table.insert(list, { T = now, CFrame = character:GetPivot(), Health = humanoid.Health })
				while list[1] and now - list[1].T > HISTORY_KEEP do
					table.remove(list, 1)
				end
			end
		end
		for character in pairs(history) do
			if not character.Parent then
				history[character] = nil
			end
		end
	end
end)

H.TimeStop = function(player, _character, p)
	local skill = p.Skill
	U.VFX("Explosion", { Position = p.Origin, Radius = skill.Radius, Color = p.Color, Duration = 0.5 })
	for _, model in ipairs(U.EnemiesInRadius(player, p.Origin, skill.Radius)) do
		StatusService.Freeze(model, skill.Duration)
	end
end

H.Rewind = function(_player, character, p)
	local list = history[character]
	if not list or #list == 0 then
		p.Refund()
		return
	end
	local target = os.clock() - p.Skill.Seconds
	local entry = list[1]
	for _, item in ipairs(list) do
		if item.T <= target then
			entry = item
		else
			break
		end
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	local from = p.Origin
	U.VFX("Ghost", { CFrame = character:GetPivot(), Color = p.Color, Duration = 0.6, Target = character })
	StatusService.StopPush(character)
	character:PivotTo(entry.CFrame)
	humanoid.Health = math.clamp(entry.Health, 1, humanoid.MaxHealth)
	history[character] = nil
	U.VFX("Beam", { From = from, To = entry.CFrame.Position, Color = p.Color, Width = 0.5, Duration = 0.4 })
	U.VFX("Explosion", { Position = entry.CFrame.Position, Radius = 5, Color = p.Color, Duration = 0.4 })
end

H.Haste = function(_player, character, p)
	StatusService.Haste(character, p.Skill.SpeedBonus, p.Skill.Duration)
end

H.SlowField = function(player, _character, p)
	local skill = p.Skill
	local center = p.Point + Vector3.new(0, 2, 0)
	U.VFX("Zone", { Position = center, Radius = skill.Radius, Color = p.Color, Duration = skill.Duration, Kind = "SlowField" })
	local step = 0.25
	for _ = 1, math.floor(skill.Duration / step + 0.5) do
		for _, model in ipairs(U.EnemiesInRadius(player, center, skill.Radius)) do
			StatusService.Slow(model, skill.SlowPercent, step + 0.2)
		end
		task.wait(step)
	end
end

H.TimeBomb = function(player, _character, p)
	local skill = p.Skill
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 2,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = 1.2,
		Visual = { Color = p.Color, Size = 1.6, Style = "Orb" },
		OnHit = function(model)
			U.VFX("Aura", { Target = model, Color = p.Color, Duration = skill.Delay, Kind = "Bomb" })
			task.delay(skill.Delay, function()
				local position = model.Parent and U.Position(model)
				if not position then
					return
				end
				U.VFX("Explosion", { Position = position, Radius = skill.Radius, Color = p.Color, Duration = 0.45, Ground = true })
				for _, enemy in ipairs(U.EnemiesInRadius(player, position, skill.Radius)) do
					CombatService.Damage(player, enemy, skill.Damage, p.Name)
				end
			end)
			return true
		end,
	})
end

return H
