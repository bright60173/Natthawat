-- สกิลสายสายฟ้า (Lightning)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local H = {}

H.Bolt = function(player, _character, p)
	local skill = p.Skill
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 2,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = 1.3,
		Pierce = skill.Pierce,
		Visual = { Color = p.Color, Size = 1.2, Style = "Bolt" },
		OnHit = function(model)
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end,
	})
end

H.FlashStep = function(player, character, p)
	local skill = p.Skill
	local from, to, distance = U.Dash(character, p.Direction, skill.Range, 0.16)
	U.VFX("Lightning", { From = from, To = to, Color = p.Color, Width = 0.8 })
	U.VFX("Dash", { From = from, To = to, Color = p.Color, Target = character })
	if distance > 0.5 then
		local direction = (to - from).Unit
		for _, model in ipairs(U.EnemiesInLine(player, from, direction, distance + 3, skill.Width, 9)) do
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end
	end
end

H.ThunderStrike = function(player, _character, p)
	local skill = p.Skill
	local point = p.Point
	U.VFX("Telegraph", { Position = point, Radius = skill.Radius, Color = p.Color, Duration = skill.Delay })
	task.wait(skill.Delay)
	U.VFX("Lightning", { From = point + Vector3.new(0, 90, 0), To = point, Color = p.Color, Width = 2.5 })
	U.VFX("Explosion", { Position = point, Radius = skill.Radius, Color = p.Color, Duration = 0.4, Ground = true })
	for _, model in ipairs(U.EnemiesInRadius(player, point + Vector3.new(0, 2, 0), skill.Radius)) do
		if CombatService.Damage(player, model, skill.Damage, p.Name) > 0 then
			StatusService.Stun(model, skill.Stun)
		end
	end
end

H.StaticShield = function(_player, character, p)
	StatusService.Shield(character, p.Skill.Shield, p.Skill.Duration, p.Skill.Damage)
end

H.ChainLightning = function(player, _character, p)
	local skill = p.Skill
	local target, position = U.Hitscan(player, p.Origin, p.Direction, skill.Range, 1.6)
	U.VFX("Lightning", { From = p.Origin + p.Direction * 2, To = position, Color = p.Color, Width = 0.6 })
	if not target then
		return
	end
	local hit = {}
	local damage = skill.Damage
	local jumps = 0
	while target do
		hit[target] = true
		local from = U.Position(target)
		CombatService.Damage(player, target, damage, p.Name)
		if jumps >= skill.Jumps or not from then
			break
		end
		local nextTarget = U.NearestEnemy(player, from, skill.JumpRange, hit)
		if not nextTarget then
			break
		end
		jumps += 1
		damage *= skill.Falloff
		task.wait(0.08)
		if not nextTarget.Parent or not U.Position(nextTarget) then
			break
		end
		U.VFX("Lightning", { From = from, To = U.Position(nextTarget), Color = p.Color, Width = 0.5 })
		target = nextTarget
	end
end

return H
