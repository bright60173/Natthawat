-- ดาเมจ, ใครฆ่าใคร, assist, ฟื้นเลือด — server เป็นคนตัดสินทั้งหมด
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Remotes = require(Shared:WaitForChild("Remotes"))
local Classes = require(Shared:WaitForChild("Classes"))

local StatusService = require(script.Parent.StatusService)
local StatsService = require(script.Parent.StatsService)

local CombatService = {}

local damageLogs = {} -- [character] = { [userId] = { Time, Skill, Player } }
local lastDamaged = {} -- [character] = os.clock()

local function getRoot(model)
	return model:FindFirstChild("HumanoidRootPart")
end

function CombatService.InLobby(model)
	local root = getRoot(model)
	return root ~= nil and root.Position.Y > Config.Lobby.SafeY
end

function CombatService.IsAlive(model)
	if not model or not model.Parent then
		return false
	end
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	return humanoid ~= nil and humanoid.Health > 0 and getRoot(model) ~= nil
end

function CombatService.LastDamaged(character)
	return lastDamaged[character] or 0
end

local function subclassColor(player)
	local sub = player and Classes.GetSubclass(player:GetAttribute("Subclass"))
	return sub and sub.Color or Color3.new(1, 1, 1)
end

function CombatService.Heal(character, amount)
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if humanoid and humanoid.Health > 0 then
		humanoid.Health = math.min(humanoid.MaxHealth, humanoid.Health + amount)
	end
end

-- ทำดาเมจ คืนค่าดาเมจที่เข้าเลือดจริง (0 = ไม่เข้า)
-- opts.NoReflect = ดาเมจสะท้อน/สวนกลับ (ห้ามสะท้อนซ้ำ)
function CombatService.Damage(attacker, target, amount, skillName, opts)
	opts = opts or {}
	if not CombatService.IsAlive(target) or amount <= 0 then
		return 0
	end
	if CombatService.InLobby(target) then
		return 0
	end
	local attackerChar = attacker and attacker.Character
	if attackerChar then
		if attackerChar == target or CombatService.InLobby(attackerChar) then
			return 0
		end
	end
	if attacker and target:GetAttribute("OwnerId") == attacker.UserId then
		return 0
	end
	if StatusService.IsInvulnerable(target) then
		return 0
	end

	local humanoid = target:FindFirstChildOfClass("Humanoid")
	local root = getRoot(target)
	local targetPlayer = Players:GetPlayerFromCharacter(target)

	-- ปัดป้อง (Perfect Parry): ไม่เสียเลือด + สวนกลับ 2 เท่า + Stun ผู้ตี
	local parry = StatusService.Get(target, "Parry")
	if parry then
		if opts.NoReflect then
			return 0
		end
		StatusService.Remove(target, "Parry")
		Remotes.PlayVFX:FireAllClients("Explosion", {
			Position = root.Position, Radius = 6, Color = Color3.fromHex("#FF8C00"), Duration = 0.3,
		})
		Remotes.PlayVFX:FireAllClients("SlashSphere", {
			Position = root.Position, Radius = 5, Color = Color3.fromHex("#FF8C00"), Duration = 0.4, Count = 10,
		})
		if attackerChar and CombatService.IsAlive(attackerChar) then
			CombatService.Damage(targetPlayer, attackerChar, amount * (parry.Multiplier or 2), "ปัดป้อง", { NoReflect = true })
			StatusService.Stun(attackerChar, parry.Stun or 1)
		end
		return 0
	end

	-- ร่างเงา (Shadow Veil): การโจมตีครั้งแรกแรงขึ้น
	if attackerChar and not opts.NoReflect then
		local empower = StatusService.Get(attackerChar, "Empower")
		if empower then
			amount *= empower.Bonus or 1.5
			StatusService.Remove(attackerChar, "Empower")
		end
	end

	-- ร่างปลอมนินจา: โดนตีครั้งเดียวหาย
	if target:GetAttribute("OneHit") then
		Remotes.PlayVFX:FireAllClients("Explosion", {
			Position = root.Position, Radius = 5, Color = Color3.fromRGB(200, 200, 200), Duration = 0.35,
		})
		target:Destroy()
		return 0
	end

	local remaining, reflect = StatusService.AbsorbShield(target, amount)
	if reflect and attackerChar and not opts.NoReflect then
		Remotes.PlayVFX:FireAllClients("Lightning", {
			From = root.Position, To = attackerChar:GetPivot().Position, Color = Color3.fromHex("#00BFFF"),
		})
		CombatService.Damage(targetPlayer, attackerChar, reflect, "โล่ไฟฟ้า", { NoReflect = true })
	end

	local now = os.clock()
	lastDamaged[target] = now
	if attacker then
		local log = damageLogs[target]
		if not log then
			log = {}
			damageLogs[target] = log
		end
		log[attacker.UserId] = { Time = now, Skill = skillName or "โจมตี", Player = attacker }
		Remotes.SkillFeedback:FireClient(attacker, {
			Type = "Damage",
			Position = root.Position,
			Amount = math.floor(amount + 0.5),
			Shielded = remaining < amount,
		})
	end
	Remotes.PlayVFX:FireAllClients("Hit", { Position = root.Position, Color = subclassColor(attacker), Target = target })

	if remaining <= 0 then
		return 0
	end

	local newHealth = humanoid.Health - remaining
	if targetPlayer then
		humanoid.Health = math.max(0, newHealth)
	elseif target:GetAttribute("Dummy") then
		-- หุ่นซ้อม: ไม่ตายจริง เลือดเต็มใหม่
		if newHealth <= 0 then
			humanoid.Health = humanoid.MaxHealth
			Remotes.PlayVFX:FireAllClients("Explosion", {
				Position = root.Position, Radius = 5, Color = Color3.fromRGB(255, 255, 255), Duration = 0.3,
			})
		else
			humanoid.Health = newHealth
		end
	else
		-- ป้อมปืน ฯลฯ
		if newHealth <= 0 then
			Remotes.PlayVFX:FireAllClients("Explosion", {
				Position = root.Position, Radius = 6, Color = Color3.fromRGB(255, 160, 60), Duration = 0.35,
			})
			target:Destroy()
		else
			humanoid.Health = newHealth
		end
	end
	return remaining
end

-- เรียกเมื่อผู้เล่นตาย (ทุกสาเหตุ) เพื่อให้เครดิตคิล / assist
function CombatService.HandleDeath(victim, character)
	local now = os.clock()
	local log = damageLogs[character] or {}
	damageLogs[character] = nil
	lastDamaged[character] = nil

	local killerEntry
	for _, entry in pairs(log) do
		if now - entry.Time <= Config.AssistWindow * 2 and entry.Player ~= victim then
			if not killerEntry or entry.Time > killerEntry.Time then
				killerEntry = entry
			end
		end
	end

	StatsService.AddDeath(victim)

	if not killerEntry then
		Remotes.KillFeed:FireAllClients(nil, victim.DisplayName, "ตกจากสนาม", {})
		return
	end

	local killer = killerEntry.Player
	local assists = {}
	for _, entry in pairs(log) do
		if entry ~= killerEntry and entry.Player ~= victim and now - entry.Time <= Config.AssistWindow then
			table.insert(assists, entry.Player.DisplayName)
		end
	end

	Remotes.KillFeed:FireAllClients(killer.DisplayName, victim.DisplayName, killerEntry.Skill, assists)

	if killer.Parent then
		local streak = StatsService.AddKill(killer)
		if killer.Character then
			CombatService.Heal(killer.Character, Config.KillHeal)
		end
		local message = Config.Streaks[streak]
		if message then
			Remotes.Announce:FireAllClients(
				string.format("%s %s (ฆ่าติดกัน %d ครั้ง)", killer.DisplayName, message, streak),
				subclassColor(killer)
			)
		end
	end
end

function CombatService.Init()
	-- ฟื้นเลือด 3 HP/วิ หลังไม่โดนตี 6 วิ
	task.spawn(function()
		while true do
			task.wait(1)
			local now = os.clock()
			for _, player in ipairs(Players:GetPlayers()) do
				local character = player.Character
				if character and CombatService.IsAlive(character) then
					if now - (lastDamaged[character] or 0) >= Config.Regen.Delay then
						CombatService.Heal(character, Config.Regen.Rate)
					end
				end
			end
			for character in pairs(lastDamaged) do
				if not character.Parent then
					lastDamaged[character] = nil
					damageLogs[character] = nil
				end
			end
		end
	end)
end

return CombatService
