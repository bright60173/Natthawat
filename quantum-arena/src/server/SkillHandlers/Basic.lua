-- โจมตีปกติของทุกสายย่อย (เลือกวิธีตาม Basic.Type ใน SkillData)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local Basic = {}

local combos = {} -- [player] = { Index, Last }
local guns = {} -- [player] = { Ammo, ReloadUntil }

local COMBO_RESET = 1.2

local function gunState(player, basic)
	local state = guns[player]
	if not state then
		state = { Ammo = basic.Ammo, ReloadUntil = 0 }
		guns[player] = state
		player:SetAttribute("Ammo", state.Ammo)
		player:SetAttribute("Reloading", false)
	end
	return state
end

function Basic.Reset(player, basic)
	combos[player] = nil
	guns[player] = nil
	player:SetAttribute("Ammo", nil)
	player:SetAttribute("Reloading", nil)
	if basic and basic.Type == "Gun" then
		gunState(player, basic)
	end
end

function Basic.Cleanup(player)
	combos[player] = nil
	guns[player] = nil
end

function Basic.CanUse(player, _character, basic)
	if basic.Type == "Gun" then
		return os.clock() >= gunState(player, basic).ReloadUntil
	end
	return true
end

function Basic.GetCooldown(_player, character, basic)
	if basic.Type == "Gun" and StatusService.Has(character, "Overdrive") then
		return basic.Cooldown / 2
	end
	return basic.Cooldown
end

local Types = {}

function Types.Projectile(player, _character, p)
	local basic = p.Skill
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 2,
		Direction = p.Direction,
		Speed = basic.Speed,
		Range = basic.Range,
		Radius = basic.Radius,
		Visual = { Color = p.Color, Size = 1.4, Style = "Orb" },
		OnHit = function(model)
			CombatService.Damage(player, model, basic.Damage, p.Name)
		end,
	})
end

function Types.Spread(player, _character, p)
	local basic = p.Skill
	for i = 1, basic.Count do
		local angle = (i - (basic.Count + 1) / 2) * basic.SpreadAngle
		local direction = U.Rotate(p.Direction, angle)
		U.Projectile(player, {
			Origin = p.Origin + direction * 2,
			Direction = direction,
			Speed = basic.Speed,
			Range = basic.Range,
			Radius = basic.Radius,
			Visual = { Color = p.Color, Size = 0.7, Style = "Needle" },
			OnHit = function(model)
				CombatService.Damage(player, model, basic.Damage, p.Name)
			end,
		})
	end
end

function Types.Hitscan(player, _character, p)
	local basic = p.Skill
	local target, position = U.Hitscan(player, p.Origin, p.Direction, basic.Range, basic.Radius)
	U.VFX("Lightning", { From = p.Origin + p.Direction * 2, To = position, Color = p.Color, Width = 0.35 })
	if target then
		CombatService.Damage(player, target, basic.Damage, p.Name)
	end
end

function Types.Gun(player, character, p)
	local basic = p.Skill
	local state = gunState(player, basic)
	local overdrive = StatusService.Has(character, "Overdrive")
	if not overdrive then
		state.Ammo -= 1
		player:SetAttribute("Ammo", state.Ammo)
	end

	local target, position = U.Hitscan(player, p.Origin, p.Direction, basic.Range, basic.Radius)
	U.VFX("Beam", { From = p.Origin + p.Direction * 2.5, To = position, Color = p.Color, Width = 0.3, Duration = 0.12 })
	if target then
		CombatService.Damage(player, target, basic.Damage, p.Name)
	end

	if state.Ammo <= 0 then
		-- กระสุนหมด: รีโหลด
		state.ReloadUntil = os.clock() + basic.Reload
		player:SetAttribute("Reloading", true)
		task.delay(basic.Reload, function()
			if guns[player] == state then
				state.Ammo = basic.Ammo
				player:SetAttribute("Ammo", state.Ammo)
				player:SetAttribute("Reloading", false)
			end
		end)
	end
end

function Types.MeleeCombo(player, _character, p)
	local basic = p.Skill
	local now = os.clock()
	local combo = combos[player]
	if not combo or now - combo.Last > COMBO_RESET then
		combo = { Index = 0, Last = now }
		combos[player] = combo
	end
	combo.Index = combo.Index % #basic.Damage + 1
	combo.Last = now

	local damage = basic.Damage[combo.Index]
	local final = #basic.Damage > 1 and combo.Index == #basic.Damage
	local direction = p.Direction
	U.VFX("Slash", {
		Position = p.Origin,
		Direction = direction,
		Range = basic.Range,
		Width = basic.Width,
		Color = p.Color,
		Final = final,
		Flip = combo.Index % 2 == 0,
	})
	local enemies = U.EnemiesInLine(player, p.Origin - direction, direction, basic.Range + 1, basic.Width, 8)
	for _, model in ipairs(enemies) do
		CombatService.Damage(player, model, damage, p.Name)
	end
end

function Basic.Use(player, character, payload)
	local handler = Types[payload.Skill.Type]
	if handler then
		handler(player, character, payload)
	end
end

return Basic
