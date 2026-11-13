-- สกิลสายเคียวเงา (Shadow Scythe)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local H = {}

local GLOW = Color3.fromHex("#9B4DFF") -- สีเรืองแสงของเงา (สีประจำสายเข้มเกินไปสำหรับเอฟเฟกต์)

-- ปาโซ่เงา ดึงศัตรูมาหา + Stun
H.ReapHook = function(player, character, p)
	local skill = p.Skill
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 2,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = 1.4,
		Visual = { Color = GLOW, Size = 1.2, Style = "Hook" },
		OnHit = function(model)
			CombatService.Damage(player, model, skill.Damage, p.Name)
			local targetPos = U.Position(model)
			local casterPos = U.Position(character)
			if targetPos and casterPos and model.Parent then
				U.VFX("Beam", { From = casterPos, To = targetPos, Color = GLOW, Width = 0.4, Duration = 0.3 })
				local delta = U.Flat(casterPos - targetPos)
				local distance = math.max(0, delta.Magnitude - 4)
				if distance > 1 then
					StatusService.Knockback(model, delta.Unit * (distance / 0.25), 0.25)
				end
				StatusService.Stun(model, skill.Stun)
			end
			return true
		end,
	})
end

-- หมุนเคียว 360°
H.DeathSpin = function(player, character, p)
	local skill = p.Skill
	U.VFX("Spin", { Target = character, Radius = skill.Radius, Color = GLOW, Duration = 0.35 })
	for _, model in ipairs(U.EnemiesInRadius(player, p.Origin, skill.Radius)) do
		CombatService.Damage(player, model, skill.Damage, p.Name)
	end
end

-- ฟันหนัก ดูดเลือดคืน 100% ของดาเมจ
H.SoulDrain = function(player, character, p)
	local skill = p.Skill
	local direction = p.Direction
	U.VFX("Slash", { Position = p.Origin, Direction = direction, Range = skill.Range, Width = skill.Width, Color = GLOW, Final = true })
	local total = 0
	for _, model in ipairs(U.EnemiesInLine(player, p.Origin - direction, direction, skill.Range + 1, skill.Width, 9)) do
		local position = U.Position(model)
		local dealt = CombatService.Damage(player, model, skill.Damage, p.Name)
		if dealt > 0 and position then
			total += dealt
			U.VFX("Beam", { From = position, To = p.Origin, Color = Color3.fromRGB(120, 255, 140), Width = 0.4, Duration = 0.35 })
		end
	end
	if total > 0 then
		CombatService.Heal(character, total)
	end
end

-- คลื่นจันทร์เสี้ยวสีดำ + Slow
H.CrescentReap = function(player, _character, p)
	local skill = p.Skill
	U.VFX("Slash", { Position = p.Origin, Direction = p.Direction, Range = 9, Width = 12, Color = GLOW })
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 3,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = skill.Radius,
		Pierce = true,
		Visual = { Color = GLOW, Size = skill.Radius * 2, Style = "Crescent", Dark = true },
		OnHit = function(model)
			if CombatService.Damage(player, model, skill.Damage, p.Name) > 0 then
				StatusService.Slow(model, skill.SlowPercent, skill.SlowDuration)
			end
		end,
	})
end

-- ล่องหน + การโจมตีครั้งแรกแรงขึ้น
H.ShadowVeil = function(_player, character, p)
	local skill = p.Skill
	U.VFX("Explosion", { Position = p.Origin, Radius = 5, Color = GLOW, Duration = 0.35 })
	StatusService.SetInvisible(character, skill.Duration)
	StatusService.Apply(character, "Empower", skill.BonusWindow, { Bonus = skill.Bonus })
end

return H
