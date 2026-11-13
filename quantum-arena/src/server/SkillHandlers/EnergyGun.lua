-- สกิลสายปืนพลังงาน (Energy Gun)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local CollectionService = game:GetService("CollectionService")

local H = {}

H.Overdrive = function(_player, character, p)
	StatusService.Apply(character, "Overdrive", p.Skill.Duration)
	U.VFX("Aura", { Target = character, Color = p.Color, Duration = p.Skill.Duration, Kind = "Overdrive" })
end

-- ชาร์จแล้วยิงเส้นทะลุทุกอย่าง
H.Railgun = function(player, character, p)
	local skill = p.Skill
	local direction = p.Direction
	StatusService.Apply(character, "Channel", skill.Charge)
	StatusService.Apply(character, "Rooted", skill.Charge)
	U.VFX("LineTelegraph", {
		From = p.Origin,
		To = p.Origin + direction * skill.Range,
		Width = 1.2,
		Color = p.Color,
		Duration = skill.Charge,
	})
	U.VFX("Aura", { Target = character, Color = p.Color, Duration = skill.Charge, Kind = "Charge" })
	task.wait(skill.Charge)
	if not CombatService.IsAlive(character) or not StatusService.CanAct(character) then
		return
	end
	local origin = U.Position(character)
	U.VFX("Beam", { From = origin, To = origin + direction * skill.Range, Color = p.Color, Width = 2.5, Duration = 0.4 })
	for _, model in ipairs(U.EnemiesInLine(player, origin, direction, skill.Range, skill.Width, 8)) do
		CombatService.Damage(player, model, skill.Damage, p.Name)
	end
end

-- ปาวิถีโค้ง ระเบิด + กระเด็น
H.PlasmaGrenade = function(player, _character, p)
	local skill = p.Skill
	local point = p.Point
	U.VFX("Arc", { From = p.Origin, To = point, Duration = skill.FlightTime, Color = p.Color, Size = 1.6 })
	U.VFX("Telegraph", { Position = point, Radius = skill.Radius, Color = p.Color, Duration = skill.FlightTime })
	task.wait(skill.FlightTime)
	U.VFX("Explosion", { Position = point, Radius = skill.Radius, Color = p.Color, Duration = 0.45, Ground = true })
	for _, model in ipairs(U.EnemiesInRadius(player, point + Vector3.new(0, 2, 0), skill.Radius)) do
		local position = U.Position(model)
		if CombatService.Damage(player, model, skill.Damage, p.Name) > 0 and position then
			local away = U.Flat(position - point)
			away = away.Magnitude > 0.1 and away.Unit or Vector3.new(1, 0, 0)
			StatusService.Knockback(model, away * 50 + Vector3.new(0, 25, 0), 0.25)
		end
	end
end

-- ลูกซอง 8 นัดในกรวย + ดีดตัวเองถอยหลัง
H.ScatterBlast = function(player, character, p)
	local skill = p.Skill
	local origin = p.Origin
	for i = 1, skill.Hits do
		local angle = -skill.Cone / 2 + skill.Cone * (i - 1) / (skill.Hits - 1)
		local direction = U.Rotate(p.Direction, angle)
		local target, position = U.Hitscan(player, origin, direction, skill.Range, 0.8)
		U.VFX("Beam", { From = origin + direction * 2, To = position, Color = p.Color, Width = 0.25, Duration = 0.12 })
		if target then
			CombatService.Damage(player, target, skill.Damage, p.Name)
		end
	end
	local back = U.Flat(p.Direction)
	if back.Magnitude > 0.05 then
		StatusService.Push(character, -back.Unit * 55, 0.2)
	end
end

local function buildTurret(player, position, color, health)
	local model = Instance.new("Model")
	model.Name = "ป้อมปืน"

	local function part(name, size, offset, partColor, material)
		local piece = Instance.new("Part")
		piece.Name = name
		piece.Size = size
		piece.CFrame = CFrame.new(position + offset)
		piece.Anchored = true
		piece.CanCollide = true
		piece.Color = partColor
		piece.Material = material
		piece.Parent = model
		return piece
	end

	local dark = Color3.fromRGB(35, 35, 45)
	part("Base", Vector3.new(3.5, 1, 3.5), Vector3.new(0, 0.5, 0), dark, Enum.Material.Metal)
	local root = part("HumanoidRootPart", Vector3.new(2, 2, 2), Vector3.new(0, 2, 0), dark, Enum.Material.Metal)
	part("Head", Vector3.new(1.2, 1.2, 1.2), Vector3.new(0, 3.6, 0), color, Enum.Material.Neon)
	model.PrimaryPart = root

	local humanoid = Instance.new("Humanoid")
	humanoid.RequiresNeck = false
	humanoid.BreakJointsOnDeath = false
	humanoid.MaxHealth = health
	humanoid.Health = health
	humanoid.DisplayName = "ป้อมปืน"
	humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOn
	humanoid.Parent = model

	model:SetAttribute("OwnerId", player.UserId)
	CollectionService:AddTag(model, U.COMBATANT_TAG)
	model.Parent = U.EntitiesFolder()
	return model
end

-- ป้อมยิงศัตรูใกล้สุดอัตโนมัติ
H.Turret = function(player, _character, p)
	local skill = p.Skill
	local flat = U.Flat(p.Direction)
	flat = flat.Magnitude > 0.05 and flat.Unit or Vector3.new(0, 0, -1)
	local spot = p.Origin + flat * U.ClampMove(p.Origin, flat, 5)
	local ground = U.GroundBelow(spot) or (spot - Vector3.new(0, 3, 0))
	local turret = buildTurret(player, ground, p.Color, skill.Health)
	local muzzle = ground + Vector3.new(0, 3.6, 0)
	U.VFX("Explosion", { Position = muzzle, Radius = 4, Color = p.Color, Duration = 0.3 })

	local shots = math.floor(skill.Duration / skill.FireRate)
	for _ = 1, shots do
		task.wait(skill.FireRate)
		if not turret.Parent or not player.Parent then
			break
		end
		local best, bestDist
		for _, model in ipairs(U.AllCombatants()) do
			if U.IsEnemy(player, model) then
				local position = U.Position(model)
				local dist = (position - muzzle).Magnitude
				if dist <= skill.Range and (not bestDist or dist < bestDist) and U.HasLineOfSight(muzzle, position) then
					best, bestDist = model, dist
				end
			end
		end
		if best then
			U.VFX("Beam", { From = muzzle, To = U.Position(best), Color = p.Color, Width = 0.25, Duration = 0.12 })
			CombatService.Damage(player, best, skill.Damage, p.Name)
		end
	end
	if turret.Parent then
		U.VFX("Explosion", { Position = muzzle, Radius = 4, Color = p.Color, Duration = 0.3 })
		turret:Destroy()
	end
end

return H
