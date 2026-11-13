-- สกิลสายหมัดเทพ (Divine Fist)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local H = {}

-- หมัดส่งคลื่นลม + Knockback แรง
H.ShockwavePunch = function(player, _character, p)
	local skill = p.Skill
	local push = U.Flat(p.Direction)
	push = push.Magnitude > 0.05 and push.Unit or Vector3.new(0, 0, -1)
	U.VFX("Slash", { Position = p.Origin, Direction = p.Direction, Range = 6, Width = 6, Color = p.Color, Final = true })
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 2,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = skill.Radius,
		Pierce = true,
		Visual = { Color = p.Color, Size = skill.Radius * 2, Style = "Wave" },
		OnHit = function(model)
			if CombatService.Damage(player, model, skill.Damage, p.Name) > 0 then
				StatusService.Knockback(model, push * skill.Knockback + Vector3.new(0, 18, 0), 0.3)
			end
		end,
	})
end

-- รัวหมัด 10 ครั้งใน 1.5 วิ
H.HundredFists = function(player, character, p)
	local skill = p.Skill
	local interval = skill.Duration / skill.Hits
	StatusService.Apply(character, "Channel", skill.Duration)
	for i = 1, skill.Hits do
		if not CombatService.IsAlive(character) or not StatusService.CanAct(character) then
			break
		end
		local origin = U.Position(character)
		-- ต่อยไปทางที่ตัวละครหันอยู่ (เดินตามเป้าได้)
		local direction = U.Flat(character:GetPivot().LookVector)
		direction = direction.Magnitude > 0.05 and direction.Unit or p.Direction
		U.VFX("Slash", {
			Position = origin,
			Direction = direction,
			Range = skill.Range,
			Width = skill.Width,
			Color = p.Color,
			Flip = i % 2 == 0,
			Small = true,
		})
		for _, model in ipairs(U.EnemiesInLine(player, origin - direction, direction, skill.Range + 1, skill.Width, 8)) do
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end
		task.wait(interval)
	end
	StatusService.Remove(character, "Channel")
end

-- ส่งศัตรูลอย ตัวเองกระโดดตาม
H.SkyUppercut = function(player, character, p)
	local skill = p.Skill
	local direction = U.Flat(p.Direction)
	direction = direction.Magnitude > 0.05 and direction.Unit or Vector3.new(0, 0, -1)
	U.VFX("Beam", {
		From = p.Origin + direction * 3 - Vector3.new(0, 2, 0),
		To = p.Origin + direction * 3 + Vector3.new(0, 12, 0),
		Color = p.Color,
		Width = 2,
		Duration = 0.3,
	})
	local hitAny = false
	for _, model in ipairs(U.EnemiesInLine(player, p.Origin - direction, direction, skill.Range + 1, skill.Width, 9)) do
		if CombatService.Damage(player, model, skill.Damage, p.Name) > 0 then
			StatusService.Airborne(model, skill.Airborne, 50)
			hitAny = true
		end
	end
	if hitAny then
		StatusService.Push(character, Vector3.new(0, 50, 0), 0.3)
	else
		StatusService.Push(character, Vector3.new(0, 35, 0), 0.2)
	end
end

-- กระโดดขึ้นแล้วทุบลง + Stun
H.GroundSlam = function(player, character, p)
	local skill = p.Skill
	StatusService.Apply(character, "Channel", 0.8)
	StatusService.Push(character, Vector3.new(0, 42, 0), 0.2)
	task.wait(0.75)
	if not CombatService.IsAlive(character) then
		return
	end
	local position = U.Position(character)
	local ground = U.GroundBelow(position, 40) or position
	U.VFX("Explosion", { Position = ground, Radius = skill.Radius, Color = p.Color, Duration = 0.45, Ground = true })
	U.VFX("Telegraph", { Position = ground, Radius = skill.Radius, Color = p.Color, Duration = 0.3 })
	for _, model in ipairs(U.EnemiesInRadius(player, ground + Vector3.new(0, 2, 0), skill.Radius)) do
		if CombatService.Damage(player, model, skill.Damage, p.Name) > 0 then
			StatusService.Stun(model, skill.Stun)
		end
	end
end

-- ท่าตั้งรับ: CombatService จะสวนกลับให้เองถ้าโดนตีในช่วงนี้
H.PerfectParry = function(_player, character, p)
	local skill = p.Skill
	StatusService.Apply(character, "Parry", skill.Duration, { Multiplier = skill.Multiplier, Stun = skill.Stun })
	U.VFX("Aura", { Target = character, Color = p.Color, Duration = skill.Duration, Kind = "Parry" })
end

return H
