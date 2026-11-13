-- ฟังก์ชันเอฟเฟกต์ที่ใช้ร่วมกัน (รันฝั่ง client เท่านั้น)
-- ทุกอย่างสร้างจาก Part / Neon / ParticleEmitter / Beam / Trail / Highlight ไม่ใช้ asset ภายนอก
local Debris = game:GetService("Debris")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local VFX = {}

VFX.SmokeZones = {} -- { Position, Radius, Expires } ให้ VFXController ใช้ซ่อนชื่อ/แถบเลือด

local effectsFolder
local function getFolder()
	if not effectsFolder or not effectsFolder.Parent then
		effectsFolder = Instance.new("Folder")
		effectsFolder.Name = "LocalEffects"
		effectsFolder.Parent = Workspace
	end
	return effectsFolder
end

local WHITE = Color3.new(1, 1, 1)

local function newPart(props)
	local part = Instance.new("Part")
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.CastShadow = false
	part.Material = Enum.Material.Neon
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	for key, value in pairs(props) do
		part[key] = value
	end
	part.Parent = getFolder()
	return part
end

local function tween(instance, duration, goals, style, direction)
	local info = TweenInfo.new(duration, style or Enum.EasingStyle.Quad, direction or Enum.EasingDirection.Out)
	local t = TweenService:Create(instance, info, goals)
	t:Play()
	return t
end

-- ทำให้หายไปแล้วลบทิ้ง
local function fadeOut(part, duration, extraGoals)
	local goals = extraGoals or {}
	goals.Transparency = 1
	tween(part, duration, goals)
	Debris:AddItem(part, duration + 0.05)
end

-- พ่นอนุภาคครั้งเดียว
local function burst(position, color, count, speed, lifetime, size)
	local holder = newPart({ Size = Vector3.new(0.2, 0.2, 0.2), Position = position, Transparency = 1 })
	local emitter = Instance.new("ParticleEmitter")
	emitter.Enabled = false
	emitter.Color = ColorSequence.new(color, WHITE)
	emitter.LightEmission = 1
	emitter.Lifetime = NumberRange.new(lifetime * 0.5, lifetime)
	emitter.Speed = NumberRange.new(speed * 0.4, speed)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Drag = 3
	emitter.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, size or 0.6),
		NumberSequenceKeypoint.new(1, 0),
	})
	emitter.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0),
		NumberSequenceKeypoint.new(1, 1),
	})
	emitter.Parent = holder
	emitter:Emit(count)
	Debris:AddItem(holder, lifetime + 0.2)
end

local function flash(position, color, range, duration)
	local holder = newPart({ Size = Vector3.new(0.2, 0.2, 0.2), Position = position, Transparency = 1 })
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = range
	light.Brightness = 4
	light.Parent = holder
	tween(light, duration, { Brightness = 0 })
	Debris:AddItem(holder, duration + 0.05)
end

-- แผ่นกลมแนวนอน
local function disc(position, radius, height, props)
	props = props or {}
	props.Shape = Enum.PartType.Cylinder
	props.Size = Vector3.new(height, radius * 2, radius * 2)
	props.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.rad(90))
	return newPart(props)
end

local function flatUnit(direction)
	local flat = Vector3.new(direction.X, 0, direction.Z)
	if flat.Magnitude < 0.05 then
		return Vector3.new(0, 0, -1)
	end
	return flat.Unit
end

local function rootOf(character)
	return character and character.Parent and character:FindFirstChild("HumanoidRootPart")
end

---------------------------------------------------------------------------
-- ตัวอัปเดตรายเฟรม (กระสุน, ของที่ต้องตามตัวละคร)
---------------------------------------------------------------------------
local updaters = {}

local function addUpdater(callback)
	table.insert(updaters, callback)
end

local stepped = RunService:IsClient() and RunService.RenderStepped or RunService.Heartbeat
stepped:Connect(function(dt)
	for i = #updaters, 1, -1 do
		local ok, keep = pcall(updaters[i], dt)
		if not ok or not keep then
			table.remove(updaters, i)
		end
	end
end)

---------------------------------------------------------------------------
-- เอฟเฟกต์พื้นฐาน
---------------------------------------------------------------------------

function VFX.Hit(data)
	burst(data.Position, data.Color, 8, 14, 0.3, 0.5)
	local ball = newPart({
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(1.5, 1.5, 1.5),
		Position = data.Position,
		Color = data.Color,
		Transparency = 0.3,
	})
	fadeOut(ball, 0.18, { Size = Vector3.new(4, 4, 4) })
end

function VFX.Explosion(data)
	local radius = data.Radius or 6
	local duration = data.Duration or 0.4
	local ball = newPart({
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(1, 1, 1),
		Position = data.Position,
		Color = data.Color,
		Transparency = 0.25,
	})
	fadeOut(ball, duration, { Size = Vector3.new(radius * 2, radius * 2, radius * 2) })
	local ring = disc(data.Position, 0.5, 0.3, { Color = data.Color, Transparency = 0.2 })
	fadeOut(ring, duration * 1.2, { Size = Vector3.new(0.3, radius * 2.4, radius * 2.4) })
	burst(data.Position, data.Color, math.clamp(math.floor(radius * 3), 10, 60), radius * 3, duration + 0.2, 0.8)
	flash(data.Position, data.Color, radius * 2.5, duration)
end

-- วงเตือนบนพื้น ค่อย ๆ เต็มจนถึงเวลาที่สกิลลง
function VFX.Telegraph(data)
	local position = data.Position + Vector3.new(0, 0.15, 0)
	local outer = disc(position, data.Radius, 0.1, { Color = data.Color, Transparency = 0.8 })
	local inner = disc(position + Vector3.new(0, 0.05, 0), 0.5, 0.1, { Color = data.Color, Transparency = 0.5 })
	tween(inner, data.Duration, { Size = Vector3.new(0.1, data.Radius * 2, data.Radius * 2) }, Enum.EasingStyle.Linear)
	Debris:AddItem(outer, data.Duration)
	Debris:AddItem(inner, data.Duration)
end

function VFX.LineTelegraph(data)
	local drop = Vector3.new(0, 2.7, 0)
	local from, to = data.From - drop, data.To - drop
	local length = (to - from).Magnitude
	if length < 0.1 then
		return
	end
	local mid = (from + to) / 2
	local strip = newPart({
		Size = Vector3.new(data.Width, 0.15, length),
		CFrame = CFrame.lookAt(mid, to),
		Color = data.Color,
		Transparency = 0.85,
	})
	tween(strip, data.Duration, { Transparency = 0.35 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
	Debris:AddItem(strip, data.Duration)
end

function VFX.Beam(data)
	local from, to = data.From, data.To
	local length = (to - from).Magnitude
	if length < 0.1 then
		return
	end
	local width = data.Width or 0.4
	local duration = data.Duration or 0.2
	local beam = newPart({
		Size = Vector3.new(width, width, length),
		CFrame = CFrame.lookAt((from + to) / 2, to),
		Color = data.Color,
		Transparency = 0.1,
	})
	fadeOut(beam, duration, { Size = Vector3.new(width * 0.1, width * 0.1, length) })
	if width >= 1.5 then
		flash(to, data.Color, 20, duration)
		burst(to, data.Color, 14, 20, 0.4, 0.7)
	end
end

function VFX.Lightning(data)
	local from, to = data.From, data.To
	local total = (to - from).Magnitude
	if total < 0.1 then
		return
	end
	local width = data.Width or 0.4
	local segments = math.clamp(math.floor(total / 5), 3, 16)
	local previous = from
	for i = 1, segments do
		local point = from:Lerp(to, i / segments)
		if i < segments then
			local jitter = math.min(3, total * 0.08)
			point += Vector3.new(
				(math.random() - 0.5) * 2 * jitter,
				(math.random() - 0.5) * 2 * jitter,
				(math.random() - 0.5) * 2 * jitter
			)
		end
		local length = (point - previous).Magnitude
		if length > 0.05 then
			local segment = newPart({
				Size = Vector3.new(width, width, length),
				CFrame = CFrame.lookAt((previous + point) / 2, point),
				Color = data.Color,
			})
			local core = newPart({
				Size = Vector3.new(width * 0.4, width * 0.4, length),
				CFrame = segment.CFrame,
				Color = WHITE,
			})
			fadeOut(segment, 0.25)
			fadeOut(core, 0.2)
		end
		previous = point
	end
	flash(to, data.Color, 18, 0.25)
	burst(to, data.Color, 10, 18, 0.3, 0.5)
end

---------------------------------------------------------------------------
-- กระสุน (ภาพอย่างเดียว server เป็นคนคิดดาเมจ)
---------------------------------------------------------------------------
local function addTrail(part, color, height, lifetime)
	local a0 = Instance.new("Attachment")
	a0.Position = Vector3.new(0, height, 0)
	a0.Parent = part
	local a1 = Instance.new("Attachment")
	a1.Position = Vector3.new(0, -height, 0)
	a1.Parent = part
	local trail = Instance.new("Trail")
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Color = ColorSequence.new(color)
	trail.LightEmission = 1
	trail.Lifetime = lifetime
	trail.Transparency = NumberSequence.new(0.2, 1)
	trail.WidthScale = NumberSequence.new(1, 0)
	trail.FaceCamera = true
	trail.Parent = part
end

-- คืนค่ารายการชิ้นส่วน { Part, Offset } ของกระสุนแต่ละแบบ
local function buildProjectile(style, size, color, dark)
	local pieces = {}
	local function add(props, offset)
		props.Color = props.Color or color
		local part = newPart(props)
		table.insert(pieces, { Part = part, Offset = offset or CFrame.new() })
		return part
	end

	local spin = 0
	if style == "Needle" then
		local part = add({ Size = Vector3.new(0.2, 0.2, 2.4) })
		addTrail(part, color, 0.15, 0.15)
	elseif style == "Bolt" then
		local part = add({ Size = Vector3.new(0.5, 0.5, 7) })
		add({ Size = Vector3.new(0.2, 0.2, 7.4), Color = WHITE })
		addTrail(part, color, 0.5, 0.2)
	elseif style == "Blade" then
		local part = add({ Size = Vector3.new(0.25, 0.7, 4.2) })
		addTrail(part, color, 0.4, 0.2)
		spin = 14
	elseif style == "Shuriken" then
		local part = add({ Size = Vector3.new(1.6, 0.15, 0.35) })
		add({ Size = Vector3.new(0.35, 0.15, 1.6) })
		addTrail(part, color, 0.2, 0.15)
		spin = 30
	elseif style == "Hook" then
		local part = add({ Shape = Enum.PartType.Ball, Size = Vector3.new(size, size, size) })
		addTrail(part, color, 0.25, 0.6)
	elseif style == "Crescent" then
		-- พระจันทร์เสี้ยว: ชิ้นเรียงเป็นส่วนโค้ง
		local half = size / 2
		local count = 7
		for i = 1, count do
			local t = (i - 1) / (count - 1) * 2 - 1 -- -1..1
			local x = t * half
			local z = (t * t) * half * 0.55
			local yaw = -t * math.rad(38)
			local thickness = 1.1 - math.abs(t) * 0.7
			local part = add({
				Size = Vector3.new(size / count + 0.5, 0.35, thickness),
				Color = dark and Color3.fromRGB(25, 10, 45) or color,
				Material = dark and Enum.Material.SmoothPlastic or Enum.Material.Neon,
			}, CFrame.new(x, 0, z) * CFrame.Angles(0, yaw, 0))
			if dark then
				add({ Size = Vector3.new(size / count + 0.5, 0.15, 0.25) }, CFrame.new(x, 0, z - thickness / 2) * CFrame.Angles(0, yaw, 0))
			end
			if i == 1 or i == count then
				addTrail(part, color, 0.2, 0.2)
			end
		end
	elseif style == "Wave" then
		add({ Shape = Enum.PartType.Ball, Size = Vector3.new(size, size, size), Transparency = 0.65 })
		local ring = add({ Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.4, size, size), Transparency = 0.3 }, CFrame.Angles(0, math.rad(90), 0))
		addTrail(ring, color, size / 2, 0.15)
	else -- Orb
		local part = add({ Shape = Enum.PartType.Ball, Size = Vector3.new(size, size, size) })
		add({ Shape = Enum.PartType.Ball, Size = Vector3.new(size * 0.5, size * 0.5, size * 0.5), Color = WHITE })
		addTrail(part, color, size * 0.4, 0.2)
	end
	return pieces, spin
end

function VFX.Projectile(data)
	local direction = data.Direction
	local pieces, spinSpeed = buildProjectile(data.Style or "Orb", data.Size or 1, data.Color, data.Dark)

	local params = RaycastParams.new()
	local filter = {}
	if data.Pierce then
		-- กระสุนทะลุคน: ภาพหยุดเฉพาะเมื่อชนแผนที่
		params.FilterType = Enum.RaycastFilterType.Include
		table.insert(filter, Workspace:FindFirstChild("Map"))
	else
		params.FilterType = Enum.RaycastFilterType.Exclude
		table.insert(filter, getFolder())
		for _, item in ipairs({ "Effects" }) do
			table.insert(filter, Workspace:FindFirstChild(item))
		end
		if typeof(data.Owner) == "Instance" then
			table.insert(filter, data.Owner)
		end
	end
	params.FilterDescendantsInstances = filter
	params.RespectCanCollide = true

	local position = data.Origin
	local traveled = 0
	local spin = 0

	local function place()
		local base = CFrame.lookAt(position, position + direction)
		if spinSpeed ~= 0 then
			base *= CFrame.Angles(0, spin, 0)
		end
		for _, piece in ipairs(pieces) do
			piece.Part.CFrame = base * piece.Offset
		end
	end

	local function finish(hitPosition)
		for _, piece in ipairs(pieces) do
			piece.Part.Transparency = 1
			Debris:AddItem(piece.Part, 0.3)
		end
		if hitPosition then
			burst(hitPosition, data.Color, 10, 16, 0.3, 0.6)
		end
	end

	place()
	addUpdater(function(dt)
		local step = math.min(data.Speed * dt, data.Range - traveled)
		local result = Workspace:Raycast(position, direction * (step + 0.5), params)
		if result then
			position = result.Position
			place()
			finish(result.Position)
			return false
		end
		position += direction * step
		traveled += step
		spin += spinSpeed * dt
		place()
		if traveled >= data.Range - 0.01 then
			finish(nil)
			return false
		end
		return true
	end)
end

-- ของที่ปาเป็นวิถีโค้ง (ระเบิดพลังงาน)
function VFX.Arc(data)
	local from, to = data.From, data.To
	local size = data.Size or 1.5
	local ball = newPart({ Shape = Enum.PartType.Ball, Size = Vector3.new(size, size, size), Position = from, Color = data.Color })
	addTrail(ball, data.Color, size * 0.4, 0.25)
	local height = math.max(6, (to - from).Magnitude * 0.35)
	local elapsed = 0
	addUpdater(function(dt)
		elapsed += dt
		local t = math.min(elapsed / data.Duration, 1)
		ball.Position = from:Lerp(to, t) + Vector3.new(0, math.sin(t * math.pi) * height, 0)
		if t >= 1 then
			ball.Transparency = 1
			Debris:AddItem(ball, 0.3)
			return false
		end
		return true
	end)
end

---------------------------------------------------------------------------
-- ฟัน / หมุน / พุ่ง
---------------------------------------------------------------------------
local function arc(center, forward, radius, spanDegrees, segments, color, thickness, flip, stagger)
	local base = CFrame.lookAt(center, center + forward)
	for i = 1, segments do
		local t = (i - 0.5) / segments
		if flip then
			t = 1 - t
		end
		local angle = math.rad(-spanDegrees / 2 + spanDegrees * t)
		local cf = base * CFrame.Angles(0, -angle, 0) * CFrame.new(0, 0, -radius)
		local segmentLength = 2 * math.pi * radius * (spanDegrees / 360) / segments + 0.4
		task.delay((i - 1) * stagger, function()
			local part = newPart({
				Size = Vector3.new(segmentLength, 0.25, thickness),
				CFrame = cf,
				Color = color,
				Transparency = 0.1,
			})
			fadeOut(part, 0.2, { Size = Vector3.new(segmentLength, 0.05, thickness * 0.3) })
		end)
	end
end

function VFX.Slash(data)
	local forward = flatUnit(data.Direction)
	local range = data.Range or 8
	local span = math.clamp((data.Width or 8) * 11, 60, 170)
	local segments = data.Small and 4 or 8
	local thickness = data.Final and 2.2 or 1.2
	if data.Small then
		thickness = 0.8
	end
	arc(data.Position, forward, range * 0.75, span, segments, data.Color, thickness, data.Flip, 0.012)
	if data.Final then
		arc(data.Position, forward, range * 0.5, span, segments, WHITE, 0.6, data.Flip, 0.012)
		burst(data.Position + forward * range * 0.7, data.Color, 10, 16, 0.3, 0.6)
	end
end

function VFX.Spin(data)
	local root = rootOf(data.Target)
	local position = root and root.Position or data.Position
	if not position then
		return
	end
	arc(position, Vector3.new(0, 0, -1), data.Radius * 0.85, 360, 20, data.Color, 2, false, 0.012)
	arc(position, Vector3.new(0, 0, -1), data.Radius * 0.5, 360, 14, WHITE, 0.6, true, 0.012)
	burst(position, data.Color, 16, data.Radius * 2, 0.35, 0.7)
end

function VFX.Dash(data)
	VFX.Beam({ From = data.From, To = data.To, Color = data.Color, Width = 1.2, Duration = 0.3 })
	burst(data.From, data.Color, 8, 10, 0.3, 0.6)
	burst(data.To, data.Color, 8, 10, 0.3, 0.6)
end

-- ร่างเงา/ร่างควอนตัม (ภาพค้าง)
function VFX.Ghost(data)
	local duration = data.Duration or 0.5
	local shapes = {
		{ Vector3.new(2, 2, 1), CFrame.new(0, 0, 0) },
		{ Vector3.new(1.2, 1.2, 1.2), CFrame.new(0, 1.6, 0) },
		{ Vector3.new(0.9, 2, 0.9), CFrame.new(-0.5, -2, 0) },
		{ Vector3.new(0.9, 2, 0.9), CFrame.new(0.5, -2, 0) },
		{ Vector3.new(0.9, 2, 0.9), CFrame.new(-1.5, 0, 0) },
		{ Vector3.new(0.9, 2, 0.9), CFrame.new(1.5, 0, 0) },
	}
	for _, shape in ipairs(shapes) do
		local part = newPart({ Size = shape[1], CFrame = data.CFrame * shape[2], Color = data.Color, Transparency = 0.35 })
		fadeOut(part, duration)
	end
end

---------------------------------------------------------------------------
-- พื้นที่ค้าง (หลุมดำ / หน่วงเวลา / ควัน)
---------------------------------------------------------------------------
function VFX.Zone(data)
	local radius, duration = data.Radius, data.Duration
	local diameter = radius * 2
	local kind = data.Kind
	local parts = {}

	local sphere = newPart({
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(1, 1, 1),
		Position = data.Position,
		Color = data.Color,
		Transparency = 1,
	})
	table.insert(parts, sphere)

	local emitter = Instance.new("ParticleEmitter")
	emitter.Shape = Enum.ParticleEmitterShape.Sphere
	emitter.LightEmission = 1
	emitter.Color = ColorSequence.new(data.Color)
	emitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.9), NumberSequenceKeypoint.new(1, 0) })

	local targetTransparency = 0.85
	if kind == "BlackHole" then
		targetTransparency = 0.8
		emitter.ShapeInOut = Enum.ParticleEmitterShapeInOut.Inward
		emitter.ShapeStyle = Enum.ParticleEmitterShapeStyle.Surface
		emitter.Rate = 90
		emitter.Speed = NumberRange.new(radius * 1.2)
		emitter.Lifetime = NumberRange.new(0.6, 0.8)
		local core = newPart({
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(1, 1, 1),
			Position = data.Position,
			Color = Color3.new(0, 0, 0),
			Material = Enum.Material.SmoothPlastic,
		})
		tween(core, 0.3, { Size = Vector3.new(5, 5, 5) })
		table.insert(parts, core)
		local halo = newPart({
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(1, 1, 1),
			Position = data.Position,
			Color = data.Color,
			Transparency = 0.5,
		})
		tween(halo, 0.3, { Size = Vector3.new(6.5, 6.5, 6.5) })
		table.insert(parts, halo)
	elseif kind == "Smoke" then
		targetTransparency = 0.45
		sphere.Material = Enum.Material.SmoothPlastic
		emitter.LightEmission = 0
		emitter.Rate = 40
		emitter.Speed = NumberRange.new(1, 3)
		emitter.Lifetime = NumberRange.new(1.5, 2.5)
		emitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 3), NumberSequenceKeypoint.new(1, 6) })
		emitter.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 1) })
		table.insert(VFX.SmokeZones, { Position = data.Position, Radius = radius, Expires = os.clock() + duration })
	else -- SlowField
		emitter.Rate = 25
		emitter.Speed = NumberRange.new(0.5, 1.5)
		emitter.Lifetime = NumberRange.new(1.2, 2)
		local ring = disc(data.Position - Vector3.new(0, 1.8, 0), radius, 0.15, { Color = data.Color, Transparency = 0.7 })
		table.insert(parts, ring)
	end
	emitter.Parent = sphere

	tween(sphere, 0.25, { Size = Vector3.new(diameter, diameter, diameter), Transparency = targetTransparency })

	task.delay(duration, function()
		emitter.Enabled = false
		for _, part in ipairs(parts) do
			fadeOut(part, 0.4)
		end
	end)
end

---------------------------------------------------------------------------
-- เอฟเฟกต์ที่ติดกับตัวละคร
---------------------------------------------------------------------------
local function highlight(character, color, duration, fillTransparency)
	local h = Instance.new("Highlight")
	h.Name = "QA_Aura"
	h.FillColor = color
	h.OutlineColor = color
	h.FillTransparency = fillTransparency or 0.6
	h.OutlineTransparency = 0
	h.DepthMode = Enum.HighlightDepthMode.Occluded
	h.Parent = character
	Debris:AddItem(h, duration)
	return h
end

-- ชิ้นส่วนที่โคจรรอบตัวละคร
local function orbit(character, duration, count, radius, height, speed, makePiece)
	local pieces = {}
	for i = 1, count do
		pieces[i] = makePiece(i)
	end
	local elapsed = 0
	addUpdater(function(dt)
		elapsed += dt
		local root = rootOf(character)
		if elapsed >= duration or not root then
			for _, piece in ipairs(pieces) do
				piece:Destroy()
			end
			return false
		end
		for i, piece in ipairs(pieces) do
			local angle = elapsed * speed + (i - 1) * (2 * math.pi / count)
			piece.CFrame = CFrame.new(root.Position + Vector3.new(0, height, 0))
				* CFrame.Angles(0, angle, 0)
				* CFrame.new(0, 0, -radius)
		end
		return true
	end)
end

function VFX.Aura(data)
	local character = data.Target
	if not rootOf(character) then
		return
	end
	local kind, color, duration = data.Kind, data.Color, data.Duration

	if kind == "Phase" then
		highlight(character, Color3.fromRGB(230, 220, 255), duration, 0.25)
	elseif kind == "Parry" then
		highlight(character, color, duration, 0.4)
		orbit(character, duration, 3, 3, 0, 14, function()
			return newPart({ Size = Vector3.new(2.4, 4, 0.2), Color = color, Transparency = 0.4 })
		end)
	elseif kind == "BladeStorm" then
		local radius = (data.Radius or 10) * 0.75
		orbit(character, duration, 5, radius, 0, 11, function()
			return newPart({ Size = Vector3.new(0.25, 0.7, 4.5), Color = color })
		end)
		orbit(character, duration, 3, radius * 0.5, 1, -13, function()
			return newPart({ Size = Vector3.new(0.2, 0.5, 3.5), Color = WHITE })
		end)
	elseif kind == "Bomb" then
		highlight(character, color, duration, 0.7)
		local bomb = newPart({ Shape = Enum.PartType.Ball, Size = Vector3.new(1.4, 1.4, 1.4), Color = color })
		local elapsed = 0
		addUpdater(function(dt)
			elapsed += dt
			local root = rootOf(character)
			if elapsed >= duration or not root then
				bomb:Destroy()
				return false
			end
			-- กะพริบถี่ขึ้นเมื่อใกล้ระเบิด
			local pulse = math.sin(elapsed * (6 + elapsed * 8)) * 0.5 + 0.5
			local size = 1.2 + pulse * 0.9
			bomb.Size = Vector3.new(size, size, size)
			bomb.Position = root.Position + Vector3.new(0, 4.5, 0)
			return true
		end)
	elseif kind == "Charge" then
		highlight(character, color, duration, 0.5)
		orbit(character, duration, 4, 2.5, 0.5, 9, function()
			return newPart({ Shape = Enum.PartType.Ball, Size = Vector3.new(0.6, 0.6, 0.6), Color = color })
		end)
	else -- Overdrive และอื่น ๆ
		highlight(character, color, duration, 0.55)
	end
end

function VFX.Status(data)
	local character = data.Target
	if not rootOf(character) then
		return
	end
	local kind, duration = data.Kind, data.Duration
	if kind == "Stun" then
		orbit(character, duration, 3, 1.6, 3.4, 6, function()
			return newPart({ Shape = Enum.PartType.Ball, Size = Vector3.new(0.6, 0.6, 0.6), Color = Color3.fromRGB(255, 230, 60) })
		end)
	elseif kind == "Haste" then
		highlight(character, Color3.fromHex("#FFD700"), duration, 0.7)
		orbit(character, duration, 2, 2.2, -1.5, 12, function()
			return newPart({ Size = Vector3.new(0.3, 0.3, 2.5), Color = Color3.fromHex("#FFD700") })
		end)
	elseif kind == "Shield" then
		local bubble = newPart({
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(8, 8, 8),
			Color = Color3.fromHex("#00BFFF"),
			Material = Enum.Material.ForceField,
			Transparency = 0.2,
		})
		local elapsed = 0
		addUpdater(function(dt)
			elapsed += dt
			local root = rootOf(character)
			local shield = character:GetAttribute("Shield") or 0
			-- เผื่อเวลาให้ attribute ซิงก์มาถึงก่อน แล้วค่อยเช็กว่าโล่แตกหรือยัง
			if elapsed >= duration or not root or (elapsed > 0.4 and shield <= 0) then
				bubble:Destroy()
				return false
			end
			bubble.Position = root.Position
			return true
		end)
	end
end

-- เรียกเอฟเฟกต์ตามชื่อ (ใช้โดย VFXController)
function VFX.Play(effectId, data)
	local handler = VFX[effectId]
	if type(handler) == "function" and type(data) == "table" then
		handler(data)
	end
end

return VFX
