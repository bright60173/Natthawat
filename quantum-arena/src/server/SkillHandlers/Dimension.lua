-- สกิลสายมิติ (Dimension)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local Debris = game:GetService("Debris")

local H = {}

-- วาร์ปไปตามทิศ สูงสุดตามระยะของสกิล ห้ามทะลุกำแพง
H.Blink = function(_player, character, p)
	local direction = U.Flat(p.Direction)
	if direction.Magnitude < 0.05 then
		direction = U.Flat(character:GetPivot().LookVector)
	end
	direction = direction.Unit
	local wanted = math.clamp(U.Flat(p.Point - p.Origin).Magnitude, 10, p.Skill.Range)
	local distance = U.ClampMove(p.Origin, direction, wanted)
	local destination = p.Origin + direction * distance
	U.VFX("Explosion", { Position = p.Origin, Radius = 4, Color = p.Color, Duration = 0.3 })
	U.VFX("Ghost", { CFrame = character:GetPivot(), Color = p.Color, Duration = 0.5, Target = character })
	U.Teleport(character, destination, direction)
	U.VFX("Beam", { From = p.Origin, To = destination, Color = p.Color, Width = 0.6, Duration = 0.25 })
	U.VFX("Explosion", { Position = destination, Radius = 5, Color = p.Color, Duration = 0.35 })
	U.VFX("SlashSphere", { Position = destination, Radius = 4, Color = p.Color, Duration = 0.4, Count = 7 })
end

local function makePortal(position, color)
	local part = Instance.new("Part")
	part.Name = "QA_Portal"
	part.Shape = Enum.PartType.Ball
	part.Size = Vector3.new(7, 7, 7)
	part.Position = position
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = true
	part.Material = Enum.Material.Neon
	part.Color = color
	part.Transparency = 0.45
	part.CastShadow = false
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = 16
	light.Brightness = 2
	light.Parent = part
	local core = Instance.new("ParticleEmitter")
	core.Color = ColorSequence.new(color)
	core.LightEmission = 1
	core.Rate = 25
	core.Lifetime = NumberRange.new(0.5, 0.9)
	core.Speed = NumberRange.new(2, 5)
	core.SpreadAngle = Vector2.new(180, 180)
	core.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.8), NumberSequenceKeypoint.new(1, 0) })
	core.Parent = part
	part.Parent = U.EffectsFolder()
	return part
end

-- ประตู 2 บาน ใครก็เดินผ่านได้
H.Portal = function(_player, _character, p)
	local flat = U.Flat(p.Direction)
	flat = flat.Magnitude > 0.05 and flat.Unit or Vector3.new(0, 0, -1)
	local near = p.Origin + flat * U.ClampMove(p.Origin, flat, 7)
	local far = p.Point + Vector3.new(0, 3.5, 0)
	local a = makePortal(near, p.Color)
	local b = makePortal(far, p.Color)
	Debris:AddItem(a, p.Skill.Duration)
	Debris:AddItem(b, p.Skill.Duration)

	local lastUse = {}
	local function link(from, to)
		from.Touched:Connect(function(hit)
			local model = U.ModelFromPart(hit)
			local root = model and U.Root(model)
			if not root or root.Anchored or not CombatService.IsAlive(model) then
				return
			end
			if not to.Parent then
				return
			end
			local now = os.clock()
			if lastUse[model] and now - lastUse[model] < 1.5 then
				return
			end
			lastUse[model] = now
			U.Teleport(model, to.Position, model:GetPivot().LookVector)
			U.VFX("Explosion", { Position = to.Position, Radius = 5, Color = p.Color, Duration = 0.3 })
		end)
	end
	link(a, b)
	link(b, a)
end

-- ทรงกลมดูดศัตรูเข้ากลาง
H.BlackHole = function(player, _character, p)
	local skill = p.Skill
	local center = p.Point + Vector3.new(0, 4, 0)
	U.VFX("Zone", { Position = center, Radius = skill.Radius, Color = p.Color, Duration = skill.Duration, Kind = "BlackHole" })
	U.VFX("Vortex", { Position = p.Point, Radius = skill.Radius * 0.8, Height = 14, Duration = skill.Duration, Color = p.Color, Dark = true, Spin = 7 })
	local step = 0.1
	local ticks = math.floor(skill.Duration / step + 0.5)
	local perDamage = math.floor(skill.Tick / step + 0.5)
	for i = 1, ticks do
		for _, model in ipairs(U.EnemiesInRadius(player, center, skill.Radius)) do
			local offset = U.Flat(center - U.Position(model))
			if offset.Magnitude > 2 then
				StatusService.Knockback(model, offset.Unit * 26, step + 0.08)
			end
			if i % perDamage == 0 then
				CombatService.Damage(player, model, skill.Damage, p.Name)
			end
		end
		task.wait(step)
	end
end

-- รอยแยกเส้นตรง ระเบิดหลังดีเลย์
H.SpaceRift = function(player, _character, p)
	local skill = p.Skill
	local direction = U.Flat(p.Direction).Unit
	local from = p.Origin
	local to = from + direction * skill.Range
	U.VFX("LineTelegraph", { From = from, To = to, Width = skill.Width, Color = p.Color, Duration = skill.Delay })
	task.wait(skill.Delay)
	U.VFX("Beam", { From = from, To = to, Color = p.Color, Width = skill.Width * 0.8, Duration = 0.35 })
	for k = 1, 3 do
		U.VFX("SpikeBurst", { Position = from:Lerp(to, k / 4), Radius = 6, Color = p.Color, Duration = 0.5 })
	end
	for _, model in ipairs(U.EnemiesInLine(player, from, direction, skill.Range, skill.Width, 12)) do
		CombatService.Damage(player, model, skill.Damage, p.Name)
	end
end

-- อมตะ + ทะลุตัวคนอื่น แต่โจมตีไม่ได้
H.PhaseShift = function(_player, character, p)
	StatusService.Apply(character, "Phase", p.Skill.Duration)
	U.VFX("Aura", { Target = character, Color = p.Color, Duration = p.Skill.Duration, Kind = "Phase" })
end

return H
