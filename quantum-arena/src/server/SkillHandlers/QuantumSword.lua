-- สกิลสายดาบควอนตัม (Quantum Sword)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local U = require(Server.SkillUtil)

local H = {}

-- ร่างควอนตัม 2 ร่าง ฟันพร้อมกันจาก 3 ทิศ
H.SuperpositionSlash = function(player, character, p)
	local skill = p.Skill
	local forward = U.Flat(p.Direction)
	forward = forward.Magnitude > 0.05 and forward.Unit or Vector3.new(0, 0, -1)
	local center = p.Origin + forward * 5
	for _, angle in ipairs({ 120, 240 }) do
		local offset = U.Rotate(-forward, angle) * 7
		U.VFX("Ghost", { CFrame = CFrame.lookAt(center + offset, center), Color = p.Color, Duration = 0.6, Target = character })
	end
	for i = 1, skill.Hits do
		if not CombatService.IsAlive(character) then
			return
		end
		local direction = U.Rotate(forward, (i - 1) * 120)
		U.VFX("Slash", {
			Position = center - direction * 6,
			Direction = direction,
			Range = skill.Range,
			Width = 12,
			Color = p.Color,
			Final = i == skill.Hits,
		})
		for _, model in ipairs(U.EnemiesInRadius(player, center, skill.Range - 1)) do
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end
		task.wait(0.12)
	end
end

-- ฟันทะลุกำแพงเป็นเส้นตรง
H.PhaseCut = function(player, _character, p)
	local skill = p.Skill
	local direction = p.Direction
	local to = p.Origin + direction * skill.Range
	U.VFX("Slash", { Position = p.Origin, Direction = direction, Range = 10, Width = 10, Color = p.Color, Final = true })
	U.VFX("Beam", { From = p.Origin, To = to, Color = p.Color, Width = skill.Width * 0.6, Duration = 0.3 })
	for _, model in ipairs(U.EnemiesInLine(player, p.Origin, direction, skill.Range, skill.Width, 9)) do
		CombatService.Damage(player, model, skill.Damage, p.Name)
	end
end

-- ปาดาบ ถ้าโดนศัตรูจะวาร์ปไปหา
H.EntangleThrow = function(player, character, p)
	local skill = p.Skill
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 2,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = 1.2,
		Visual = { Color = p.Color, Size = 1, Style = "Blade" },
		OnHit = function(model)
			CombatService.Damage(player, model, skill.Damage, p.Name)
			local targetPos = U.Position(model)
			if targetPos and CombatService.IsAlive(character) then
				local back = U.Flat(p.Direction)
				back = back.Magnitude > 0.05 and back.Unit or Vector3.new(0, 0, -1)
				local destination = targetPos - back * 4
				if not U.HasLineOfSight(targetPos, destination) then
					destination = targetPos + Vector3.new(0, 4, 0)
				end
				local from = character:GetPivot().Position
				U.Teleport(character, destination, back)
				U.VFX("Beam", { From = from, To = destination, Color = p.Color, Width = 0.5, Duration = 0.25 })
				U.VFX("Explosion", { Position = destination, Radius = 4, Color = p.Color, Duration = 0.3 })
			end
			return true
		end,
	})
end

-- หมุนตัวพร้อมดาบลอยรอบตัว
H.BladeStorm = function(player, character, p)
	local skill = p.Skill
	U.VFX("Aura", { Target = character, Color = p.Color, Duration = skill.Duration, Kind = "BladeStorm", Radius = skill.Radius })
	for _ = 1, math.floor(skill.Duration / skill.Tick) do
		if not CombatService.IsAlive(character) then
			return
		end
		local position = U.Position(character)
		for _, model in ipairs(U.EnemiesInRadius(player, position, skill.Radius)) do
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end
		task.wait(skill.Tick)
	end
end

-- คลื่นพลังรูปพระจันทร์เสี้ยว
H.QuantumWave = function(player, _character, p)
	local skill = p.Skill
	U.VFX("Slash", { Position = p.Origin, Direction = p.Direction, Range = 8, Width = 10, Color = p.Color })
	U.Projectile(player, {
		Origin = p.Origin + p.Direction * 3,
		Direction = p.Direction,
		Speed = skill.Speed,
		Range = skill.Range,
		Radius = skill.Radius,
		Pierce = true,
		Visual = { Color = p.Color, Size = skill.Radius * 2, Style = "Crescent" },
		OnHit = function(model)
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end,
	})
end

return H
